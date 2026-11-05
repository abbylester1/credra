// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

import {InvoiceRegistry} from "../src/InvoiceRegistry.sol";
import {InvestorAllowlist} from "../src/InvestorAllowlist.sol";
import {ReceivableFinance} from "../src/ReceivableFinance.sol";

/// Test-only token. Production flows use the official Whitechain USDT.
contract MockUSDT is ERC20 {
    constructor() ERC20("Tether USD", "USDT") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amt) external {
        _mint(to, amt);
    }
}

contract ReceivableFinanceTest is Test {
    InvoiceRegistry registry;
    InvestorAllowlist allowlist;
    ReceivableFinance finance;
    MockUSDT usdt;

    address admin = makeAddr("admin");
    address verifier = makeAddr("verifier");
    address business = makeAddr("business");
    address investor = makeAddr("investor");
    address investor2 = makeAddr("investor2");
    address stranger = makeAddr("stranger");

    bytes32 constant ID = keccak256("INV-001");
    bytes32 constant HASH = keccak256("pdf-bytes-1");
    bytes32 constant BUYER = keccak256("buyer-acme");
    uint256 constant AMOUNT = 10_000e6;
    uint256 constant ADVANCE = 9_000e6;
    uint64 due;

    function setUp() public {
        due = uint64(block.timestamp + 30 days);

        registry = new InvoiceRegistry(admin);
        allowlist = new InvestorAllowlist(admin);
        usdt = new MockUSDT();
        finance = new ReceivableFinance(admin, registry, allowlist, IERC20(address(usdt)), 3 days);

        vm.startPrank(admin);
        registry.grantRole(registry.VERIFIER_ROLE(), verifier);
        registry.grantRole(registry.FINANCE_ROLE(), address(finance));
        allowlist.add(investor);
        vm.stopPrank();

        usdt.mint(investor, 100_000e6);
        usdt.mint(investor2, 100_000e6);
        usdt.mint(business, 100_000e6);
    }

    // -------------------------------------------------------------- helpers

    function _submit() internal {
        vm.prank(business);
        registry.submitInvoice(ID, HASH, BUYER, AMOUNT, ADVANCE, due);
    }

    function _eligible() internal {
        _submit();
        vm.prank(verifier);
        registry.recordVerification(ID, InvoiceRegistry.Status.Eligible, keccak256("cre-run-1"));
    }

    function _fund() internal {
        _eligible();
        vm.startPrank(investor);
        usdt.approve(address(finance), ADVANCE);
        finance.fund(ID);
        vm.stopPrank();
    }

    // ------------------------------------------------------------ submission

    function test_submit_storesInvoice() public {
        _submit();
        InvoiceRegistry.Invoice memory inv = registry.getInvoice(ID);
        assertEq(inv.issuer, business);
        assertEq(inv.documentHash, HASH);
        assertEq(inv.amount, AMOUNT);
        assertEq(uint8(inv.status), uint8(InvoiceRegistry.Status.Submitted));
        assertTrue(registry.isHashUsed(HASH));
    }

    function test_submit_duplicateIdReverts() public {
        _submit();
        vm.prank(business);
        vm.expectRevert(InvoiceRegistry.DuplicateInvoice.selector);
        registry.submitInvoice(ID, keccak256("other"), BUYER, AMOUNT, ADVANCE, due);
    }

    function test_submit_duplicateDocumentHashReverts() public {
        _submit();
        vm.prank(business);
        vm.expectRevert(InvoiceRegistry.DuplicateDocument.selector);
        registry.submitInvoice(keccak256("INV-002"), HASH, BUYER, AMOUNT, ADVANCE, due);
    }

    function test_submit_invalidTermsRevert() public {
        vm.startPrank(business);
        vm.expectRevert(InvoiceRegistry.InvalidTerms.selector);
        registry.submitInvoice(ID, HASH, BUYER, 0, 0, due);
        vm.expectRevert(InvoiceRegistry.InvalidTerms.selector);
        registry.submitInvoice(ID, HASH, BUYER, AMOUNT, AMOUNT, due); // advance == face
        vm.expectRevert(InvoiceRegistry.InvalidTerms.selector);
        registry.submitInvoice(ID, HASH, BUYER, AMOUNT, ADVANCE, uint64(block.timestamp)); // past due
        vm.stopPrank();
    }

    // ---------------------------------------------------------- verification

    function test_verification_onlyVerifier() public {
        _submit();
        bytes32 role = registry.VERIFIER_ROLE();
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, stranger, role)
        );
        registry.recordVerification(ID, InvoiceRegistry.Status.Eligible, bytes32(0));
    }

    function test_verification_rejectedBlocksFunding() public {
        _submit();
        vm.prank(verifier);
        registry.recordVerification(ID, InvoiceRegistry.Status.Rejected, keccak256("failed-checks"));

        vm.startPrank(investor);
        usdt.approve(address(finance), ADVANCE);
        vm.expectRevert(ReceivableFinance.NotEligible.selector);
        finance.fund(ID);
        vm.stopPrank();
    }

    function test_verification_manualReviewThenEligible() public {
        _submit();
        vm.startPrank(verifier);
        registry.recordVerification(ID, InvoiceRegistry.Status.UnderReview, bytes32(0));
        registry.recordVerification(ID, InvoiceRegistry.Status.Eligible, keccak256("manual-ok"));
        vm.stopPrank();
        assertEq(uint8(registry.statusOf(ID)), uint8(InvoiceRegistry.Status.Eligible));
    }

    function test_verification_cannotSetFundedStatus() public {
        _submit();
        vm.prank(verifier);
        vm.expectRevert(InvoiceRegistry.InvalidVerificationStatus.selector);
        registry.recordVerification(ID, InvoiceRegistry.Status.Funded, bytes32(0));
    }

    function test_verification_unknownInvoiceReverts() public {
        vm.prank(verifier);
        vm.expectRevert(InvoiceRegistry.UnknownInvoice.selector);
        registry.recordVerification(ID, InvoiceRegistry.Status.Eligible, bytes32(0));
    }

    // --------------------------------------------------------------- funding

    function test_fund_paysIssuerAndMintsToInvestor() public {
        uint256 bizBefore = usdt.balanceOf(business);
        _fund();
        assertEq(usdt.balanceOf(business), bizBefore + ADVANCE);
        assertEq(usdt.balanceOf(address(finance)), 0); // no custody
        assertEq(finance.ownerOf(uint256(ID)), investor);
        assertEq(uint8(registry.statusOf(ID)), uint8(InvoiceRegistry.Status.Funded));
        (address orig, uint256 funded,,,) = finance.positions(ID);
        assertEq(orig, investor);
        assertEq(funded, ADVANCE);
    }

    function test_fund_unallowlistedReverts() public {
        _eligible();
        vm.startPrank(investor2);
        usdt.approve(address(finance), ADVANCE);
        vm.expectRevert(abi.encodeWithSelector(ReceivableFinance.NotAllowlisted.selector, investor2));
        finance.fund(ID);
        vm.stopPrank();
    }

    function test_fund_notEligibleReverts() public {
        _submit(); // still Submitted
        vm.startPrank(investor);
        usdt.approve(address(finance), ADVANCE);
        vm.expectRevert(ReceivableFinance.NotEligible.selector);
        finance.fund(ID);
        vm.stopPrank();
    }

    function test_fund_twiceReverts() public {
        _fund();
        vm.startPrank(investor);
        usdt.approve(address(finance), ADVANCE);
        vm.expectRevert(ReceivableFinance.NotEligible.selector);
        finance.fund(ID);
        vm.stopPrank();
    }

    function test_fund_withoutApprovalReverts() public {
        _eligible();
        vm.prank(investor);
        vm.expectRevert(); // ERC20InsufficientAllowance
        finance.fund(ID);
    }

    function test_fund_afterDueDateReverts() public {
        _eligible();
        vm.warp(due + 1);
        vm.startPrank(investor);
        usdt.approve(address(finance), ADVANCE);
        vm.expectRevert(ReceivableFinance.NotEligible.selector);
        finance.fund(ID);
        vm.stopPrank();
    }

    function test_fund_pausedReverts() public {
        _eligible();
        vm.prank(admin);
        finance.pause();
        vm.startPrank(investor);
        usdt.approve(address(finance), ADVANCE);
        vm.expectRevert();
        finance.fund(ID);
        vm.stopPrank();
    }

    // -------------------------------------------------------------- transfer

    function test_transfer_toNonAllowlistedReverts() public {
        _fund();
        vm.prank(investor);
        vm.expectRevert(abi.encodeWithSelector(ReceivableFinance.NotAllowlisted.selector, investor2));
        finance.transferFrom(investor, investor2, uint256(ID));
    }

    function test_transfer_toAllowlistedWorksAndRepaymentFollows() public {
        _fund();
        vm.prank(admin);
        allowlist.add(investor2);
        vm.prank(investor);
        finance.transferFrom(investor, investor2, uint256(ID));

        vm.startPrank(business);
        usdt.approve(address(finance), AMOUNT);
        uint256 before = usdt.balanceOf(investor2);
        finance.repay(ID);
        vm.stopPrank();
        assertEq(usdt.balanceOf(investor2), before + AMOUNT);
    }

    // ------------------------------------------------------------- repayment

    function test_repay_paysHolderFullAmountAndCloses() public {
        _fund();
        uint256 before = usdt.balanceOf(investor);
        vm.startPrank(business);
        usdt.approve(address(finance), AMOUNT);
        finance.repay(ID);
        vm.stopPrank();

        assertEq(usdt.balanceOf(investor), before + AMOUNT);
        assertEq(uint8(registry.statusOf(ID)), uint8(InvoiceRegistry.Status.Repaid));
        (,, uint256 repaid,, uint64 repaidAt) = finance.positions(ID);
        assertEq(repaid, AMOUNT);
        assertGt(repaidAt, 0);
        // investor yield == AMOUNT - ADVANCE
        assertEq(AMOUNT - ADVANCE, 1_000e6);
    }

    function test_repay_beforeFundingReverts() public {
        _eligible();
        vm.startPrank(business);
        usdt.approve(address(finance), AMOUNT);
        vm.expectRevert(ReceivableFinance.NotFunded.selector);
        finance.repay(ID);
        vm.stopPrank();
    }

    function test_repay_twiceReverts() public {
        _fund();
        vm.startPrank(business);
        usdt.approve(address(finance), AMOUNT * 2);
        finance.repay(ID);
        vm.expectRevert(ReceivableFinance.NotFunded.selector);
        finance.repay(ID);
        vm.stopPrank();
    }

    function test_repay_insufficientAllowanceReverts() public {
        _fund();
        vm.startPrank(business);
        usdt.approve(address(finance), AMOUNT - 1);
        vm.expectRevert();
        finance.repay(ID);
        vm.stopPrank();
        // state unchanged after revert
        assertEq(uint8(registry.statusOf(ID)), uint8(InvoiceRegistry.Status.Funded));
    }

    // --------------------------------------------------------------- default

    function test_default_beforeGraceReverts() public {
        _fund();
        vm.warp(due + 3 days);
        vm.expectRevert(ReceivableFinance.NotYetDefaulted.selector);
        finance.markDefaulted(ID);
    }

    function test_default_afterGraceMarksDefaulted() public {
        _fund();
        vm.warp(uint256(due) + 3 days + 1);
        vm.prank(stranger);
        finance.markDefaulted(ID);
        assertEq(uint8(registry.statusOf(ID)), uint8(InvoiceRegistry.Status.Defaulted));
    }

    function test_default_cannotRepayAfterDefault() public {
        _fund();
        vm.warp(uint256(due) + 3 days + 1);
        finance.markDefaulted(ID);
        vm.startPrank(business);
        usdt.approve(address(finance), AMOUNT);
        vm.expectRevert(ReceivableFinance.NotFunded.selector);
        finance.repay(ID);
        vm.stopPrank();
    }

    // ---------------------------------------------------------- access control

    function test_financeRole_onlyFinanceContractCanMarkFunded() public {
        _eligible();
        vm.prank(stranger);
        vm.expectRevert();
        registry.markFunded(ID);
    }

    function test_allowlist_onlyAdminCanAdd() public {
        vm.prank(stranger);
        vm.expectRevert();
        allowlist.add(stranger);
    }

    function test_allowlist_removeBlocksFunding() public {
        _eligible();
        vm.prank(admin);
        allowlist.remove(investor);
        vm.startPrank(investor);
        usdt.approve(address(finance), ADVANCE);
        vm.expectRevert(abi.encodeWithSelector(ReceivableFinance.NotAllowlisted.selector, investor));
        finance.fund(ID);
        vm.stopPrank();
    }

    function test_registry_pausedBlocksSubmission() public {
        vm.prank(admin);
        registry.pause();
        vm.prank(business);
        vm.expectRevert();
        registry.submitInvoice(ID, HASH, BUYER, AMOUNT, ADVANCE, due);
    }
}
