// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {InvoiceRegistry} from "./InvoiceRegistry.sol";
import {InvestorAllowlist} from "./InvestorAllowlist.sol";

/// @title ReceivableFinance
/// @notice Funding, ownership and repayment of verified invoices, settled in USDT.
///         Each funded invoice mints one ERC-721 "receivable" to the investor. The token
///         can only move between allowlisted wallets and entitles its holder to repayment.
/// @dev Funds are never held: the investor's USDT goes straight to the issuer, and
///      repayment goes straight to the current token holder. There is no admin withdrawal.
///
///      Economics: investor pays `financingAmount`, borrower repays the full `amount`.
///      The difference is the investor's discount (yield).
contract ReceivableFinance is ERC721, AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    InvoiceRegistry public immutable registry;
    InvestorAllowlist public immutable allowlist;
    IERC20 public immutable usdt;

    /// @notice Seconds after dueDate before anyone may mark a funded invoice defaulted.
    uint64 public immutable gracePeriod;

    struct Position {
        address originalInvestor;
        uint256 fundedAmount;
        uint256 repaidAmount;
        uint64 fundedAt;
        uint64 repaidAt;
    }

    mapping(bytes32 => Position) public positions;

    event Funded(bytes32 indexed invoiceId, address indexed investor, address indexed issuer, uint256 amount);
    event Repaid(bytes32 indexed invoiceId, address indexed payer, address indexed holder, uint256 amount);
    event DefaultMarked(bytes32 indexed invoiceId, address indexed holder);

    error NotAllowlisted(address account);
    error NotEligible();
    error NotFunded();
    error WrongRepayment();
    error NotYetDefaulted();
    error ZeroAddress();

    constructor(
        address admin,
        InvoiceRegistry registry_,
        InvestorAllowlist allowlist_,
        IERC20 usdt_,
        uint64 gracePeriod_
    ) ERC721("Invoice Receivable", "RCVBL") {
        if (admin == address(0) || address(usdt_) == address(0)) revert ZeroAddress();
        registry = registry_;
        allowlist = allowlist_;
        usdt = usdt_;
        gracePeriod = gracePeriod_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // ---------------------------------------------------------------- funding

    /// @notice Fund an Eligible invoice. Caller must be allowlisted and have approved
    ///         `financingAmount` USDT to this contract.
    function fund(bytes32 invoiceId) external nonReentrant whenNotPaused {
        if (!allowlist.isAllowed(msg.sender)) revert NotAllowlisted(msg.sender);

        InvoiceRegistry.Invoice memory inv = registry.getInvoice(invoiceId);
        if (inv.status != InvoiceRegistry.Status.Eligible) revert NotEligible();
        if (inv.dueDate <= block.timestamp) revert NotEligible();

        // Effects before interactions.
        registry.markFunded(invoiceId);
        positions[invoiceId] = Position({
            originalInvestor: msg.sender,
            fundedAmount: inv.financingAmount,
            repaidAmount: 0,
            fundedAt: uint64(block.timestamp),
            repaidAt: 0
        });
        _mint(msg.sender, uint256(invoiceId));

        // Investor -> issuer directly. SafeERC20 reverts on failure / false return.
        usdt.safeTransferFrom(msg.sender, inv.issuer, inv.financingAmount);

        emit Funded(invoiceId, msg.sender, inv.issuer, inv.financingAmount);
    }

    // -------------------------------------------------------------- repayment

    /// @notice Repay a funded invoice in full. Anyone (borrower or operator) may pay;
    ///         the payer must have approved `amount` USDT to this contract. Funds go to
    ///         the current holder of the receivable token.
    function repay(bytes32 invoiceId) external nonReentrant whenNotPaused {
        InvoiceRegistry.Invoice memory inv = registry.getInvoice(invoiceId);
        if (inv.status != InvoiceRegistry.Status.Funded) revert NotFunded();

        address holder = ownerOf(uint256(invoiceId));

        registry.markRepaid(invoiceId);
        Position storage p = positions[invoiceId];
        p.repaidAmount = inv.amount;
        p.repaidAt = uint64(block.timestamp);

        usdt.safeTransferFrom(msg.sender, holder, inv.amount);

        emit Repaid(invoiceId, msg.sender, holder, inv.amount);
    }

    /// @notice Anyone can flag a funded invoice as defaulted once due date + grace passed.
    function markDefaulted(bytes32 invoiceId) external {
        InvoiceRegistry.Invoice memory inv = registry.getInvoice(invoiceId);
        if (inv.status != InvoiceRegistry.Status.Funded) revert NotFunded();
        if (block.timestamp <= uint256(inv.dueDate) + gracePeriod) revert NotYetDefaulted();

        registry.markDefaulted(invoiceId);
        emit DefaultMarked(invoiceId, ownerOf(uint256(invoiceId)));
    }

    // ------------------------------------------------------------------ admin

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // ------------------------------------------------------ transfer restriction

    /// @dev Receivables may only be held by allowlisted wallets (mint and transfers).
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        if (to != address(0) && !allowlist.isAllowed(to)) revert NotAllowlisted(to);
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
