# Data Model: Credra Web App

The chain (InvoiceRegistry / ReceivableFinance) is the **source of truth** for invoice status, amounts, issuer and holder. The local database stores only off-chain data. When they disagree, the chain wins and the DB row is refreshed.

## Onchain status enum (InvoiceRegistry.Status)

`0 None, 1 Submitted, 2 UnderReview, 3 Eligible, 4 Rejected, 5 Funded, 6 Repaid, 7 Defaulted`

### State transitions (enforced by contracts)

```
(none) --submitInvoice--> Submitted
Submitted --recordVerification--> UnderReview | Eligible | Rejected
UnderReview --recordVerification--> UnderReview | Eligible | Rejected
Eligible --fund--> Funded
Funded --repay--> Repaid
Funded --markDefaulted (after dueDate + 3 days)--> Defaulted
```

Rejected, Repaid and Defaulted are terminal. Verification cannot act on Funded/Repaid/Defaulted.

## Entities (off-chain tables)

### invoices
| Field | Type | Notes |
|---|---|---|
| invoice_id | text PK | 0x bytes32 = keccak256(invoice number) |
| invoice_number | text unique | business-entered, e.g. INV-1001 |
| issuer_wallet | text | lowercase address; must equal onchain issuer |
| issuer_name | text | off-chain only (PII, not onchain) |
| buyer_name | text | off-chain only; onchain holds `buyerRef = keccak256("buyer:"+name)` |
| buyer_ref | text | bytes32 |
| currency | text | display only, e.g. USD |
| amount | text | base units (6 dp) as decimal string |
| financing_amount | text | base units |
| invoice_date | integer | unix seconds |
| due_date | integer | unix seconds; equals onchain dueDate |
| document_hash | text unique | bytes32 keccak256 of file |
| submit_tx | text | tx hash of `submitInvoice` |
| created_at | integer | |

Validation: amount > 0; 0 < financing_amount < amount; due_date > now; issuer_wallet equals the wallet that sent `submit_tx`; document_hash equals recomputed hash of the stored file.

### documents
| Field | Type | Notes |
|---|---|---|
| id | integer PK | |
| invoice_id | text FK | |
| storage_path | text | under gitignored `uploads/`, never served publicly |
| document_hash | text | recomputed server-side |
| mime_type, size_bytes | | allowed: pdf, png, jpg; max 10 MB |

Access: issuer wallet (signed request) and operator only (FR-019).

### verification_runs
| Field | Type | Notes |
|---|---|---|
| id | integer PK | |
| invoice_id | text FK | |
| verdict | text | ELIGIBLE / REJECTED / MANUAL_REVIEW / ERROR |
| failed_checks | text (JSON array) | e.g. `["amount_mismatch"]` |
| review_reasons | text (JSON array) | e.g. `["external_api_unavailable"]` |
| external_reference | text null | e.g. `ERP-SIM-INV-1001` |
| report_json | text | the full workflow output |
| verification_ref | text | bytes32 = keccak256(report_json) passed to `recordVerification` |
| record_tx | text null | tx hash of the verdict write |
| source_simulated | integer | 1 when the external source is the mock (always 1 in this build) |
| created_at | integer | |

Rule: ERROR (CLI failure, timeout, unparsable output) is stored and mapped to onchain `UnderReview`, never `Eligible` (FR-007).

### operator_decisions
| Field | Type | Notes |
|---|---|---|
| id | integer PK | |
| invoice_id | text FK | |
| decision | text | APPROVE / REJECT |
| reason | text | required |
| tx_hash | text | `recordVerification` tx |
| created_at | integer | |

### status_events
| Field | Type | Notes |
|---|---|---|
| id | integer PK | |
| invoice_id | text FK | |
| status | text | one of the enum names |
| tx_hash | text null | explorer link target |
| source | text | submit / verification / operator / fund / repay / default |
| created_at | integer | ordering for the timeline (FR-020) |

### positions (read cache, refreshable from chain)
| Field | Type | Notes |
|---|---|---|
| invoice_id | text PK/FK | |
| holder | text | current ERC-721 owner (`ownerOf(uint256(invoiceId))`) |
| original_investor | text | from `positions()` |
| funded_amount, repaid_amount | text | base units |
| fund_tx, repay_tx | text null | |
| funded_at, repaid_at | integer null | |

### simulated_erp_records (owned by apps/mock-registry data.json, not this DB)
Fields: invoiceNumber, issuerWallet, buyerRef, amount, dueDate, documentHash, status (valid/disputed/void), reference. Written via the mock's `POST /admin/invoices`.

## Derived values

- **Investor return** = `amount - financing_amount` (base units); display percentage = return / financing_amount.
- **Explorer links** = `https://explorer.testnet.whitechain.io/{tx|address}/{hash}`.
- **Role resolution** (FR-001): operator if operator session present; investor if `allowlist.isAllowed(wallet)`; otherwise business.
