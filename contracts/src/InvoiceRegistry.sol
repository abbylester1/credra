// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title InvoiceRegistry
/// @notice Canonical onchain record of invoices: document hash, terms, verification
///         outcome and financing status. No documents or PII are stored, only hashes.
/// @dev Trust model: the VERIFIER_ROLE (the application backend) writes verification
///      results produced by the Chainlink CRE workflow. This is an application-authorised
///      transaction, not a DON-signed write. The FINANCE_ROLE is the ReceivableFinance contract.
contract InvoiceRegistry is AccessControl, Pausable {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant FINANCE_ROLE = keccak256("FINANCE_ROLE");

    enum Status {
        None, // 0: does not exist
        Submitted,
        UnderReview,
        Eligible,
        Rejected,
        Funded,
        Repaid,
        Defaulted
    }

    struct Invoice {
        bytes32 invoiceId;
        bytes32 documentHash;
        bytes32 buyerRef; // hashed buyer identifier, never plaintext
        bytes32 verificationRef; // hash of the CRE verification report / request id
        address issuer;
        uint256 amount; // face value owed by the buyer (repayment amount)
        uint256 financingAmount; // advance paid to the issuer at funding
        uint64 dueDate;
        Status status;
    }

    mapping(bytes32 => Invoice) private _invoices;
    mapping(bytes32 => bytes32) public invoiceIdByHash; // duplicate protection

    event InvoiceSubmitted(
        bytes32 indexed invoiceId,
        bytes32 indexed documentHash,
        address indexed issuer,
        uint256 amount,
        uint256 financingAmount,
        uint64 dueDate
    );
    event VerificationRecorded(bytes32 indexed invoiceId, Status status, bytes32 verificationRef);
    event StatusChanged(bytes32 indexed invoiceId, Status from, Status to);

    error ZeroValue();
    error InvalidTerms();
    error DuplicateInvoice();
    error DuplicateDocument();
    error UnknownInvoice();
    error InvalidTransition(Status from, Status to);
    error InvalidVerificationStatus();

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // ---------------------------------------------------------------- issuer

    /// @notice Business registers an invoice for verification. Status starts as Submitted.
    function submitInvoice(
        bytes32 invoiceId,
        bytes32 documentHash,
        bytes32 buyerRef,
        uint256 amount,
        uint256 financingAmount,
        uint64 dueDate
    ) external whenNotPaused {
        if (invoiceId == bytes32(0) || documentHash == bytes32(0)) revert ZeroValue();
        if (amount == 0 || financingAmount == 0 || financingAmount >= amount) revert InvalidTerms();
        if (dueDate <= block.timestamp) revert InvalidTerms();
        if (_invoices[invoiceId].status != Status.None) revert DuplicateInvoice();
        if (invoiceIdByHash[documentHash] != bytes32(0)) revert DuplicateDocument();

        _invoices[invoiceId] = Invoice({
            invoiceId: invoiceId,
            documentHash: documentHash,
            buyerRef: buyerRef,
            verificationRef: bytes32(0),
            issuer: msg.sender,
            amount: amount,
            financingAmount: financingAmount,
            dueDate: dueDate,
            status: Status.Submitted
        });
        invoiceIdByHash[documentHash] = invoiceId;

        emit InvoiceSubmitted(invoiceId, documentHash, msg.sender, amount, financingAmount, dueDate);
    }

    // -------------------------------------------------------------- verifier

    /// @notice Record the outcome of the CRE verification workflow.
    /// @param newStatus One of UnderReview (manual review), Eligible or Rejected.
    /// @param verificationRef Hash of the verification report / CRE request id.
    function recordVerification(bytes32 invoiceId, Status newStatus, bytes32 verificationRef)
        external
        onlyRole(VERIFIER_ROLE)
        whenNotPaused
    {
        if (
            newStatus != Status.UnderReview && newStatus != Status.Eligible && newStatus != Status.Rejected
        ) revert InvalidVerificationStatus();

        Invoice storage inv = _invoices[invoiceId];
        Status from = inv.status;
        if (from == Status.None) revert UnknownInvoice();
        // Verification can only act on pre-funding states.
        if (from != Status.Submitted && from != Status.UnderReview) revert InvalidTransition(from, newStatus);

        inv.status = newStatus;
        inv.verificationRef = verificationRef;
        emit VerificationRecorded(invoiceId, newStatus, verificationRef);
        emit StatusChanged(invoiceId, from, newStatus);
    }

    // --------------------------------------------------------------- finance

    function markFunded(bytes32 invoiceId) external onlyRole(FINANCE_ROLE) {
        _financeTransition(invoiceId, Status.Eligible, Status.Funded);
    }

    function markRepaid(bytes32 invoiceId) external onlyRole(FINANCE_ROLE) {
        _financeTransition(invoiceId, Status.Funded, Status.Repaid);
    }

    function markDefaulted(bytes32 invoiceId) external onlyRole(FINANCE_ROLE) {
        _financeTransition(invoiceId, Status.Funded, Status.Defaulted);
    }

    function _financeTransition(bytes32 invoiceId, Status expected, Status to) private {
        Invoice storage inv = _invoices[invoiceId];
        Status from = inv.status;
        if (from == Status.None) revert UnknownInvoice();
        if (from != expected) revert InvalidTransition(from, to);
        inv.status = to;
        emit StatusChanged(invoiceId, from, to);
    }

    // ----------------------------------------------------------------- admin

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // ------------------------------------------------------------------ views

    function getInvoice(bytes32 invoiceId) external view returns (Invoice memory) {
        return _invoices[invoiceId];
    }

    function statusOf(bytes32 invoiceId) external view returns (Status) {
        return _invoices[invoiceId].status;
    }

    function exists(bytes32 invoiceId) external view returns (bool) {
        return _invoices[invoiceId].status != Status.None;
    }

    function isHashUsed(bytes32 documentHash) external view returns (bool) {
        return invoiceIdByHash[documentHash] != bytes32(0);
    }
}
