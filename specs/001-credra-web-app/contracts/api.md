# Interface Contract: Web App Server Routes

Base path `/api`. JSON in and out unless noted. All bodies are validated with zod; errors use `{ "error": "<code>", "message": "<human text>" }` with an appropriate HTTP status. Wallet addresses are compared case-insensitively. Amounts are decimal strings in USDT base units (6 decimals).

Auth levels: **public** (no auth), **wallet** (request carries `x-wallet: <address>` and `x-signature` over a server-issued nonce message; the app verifies the signature with viem), **operator** (httpOnly session cookie from `POST /api/operator/login`).

## Invoices

### POST /api/invoices  (wallet = issuer)
Registers off-chain data **after** the business wallet has sent `submitInvoice` onchain. `multipart/form-data`:
`invoiceNumber, issuerName, buyerName, currency, amount, financingAmount, invoiceDate, dueDate, submitTx, file`.
Server checks: file type/size; recomputed `keccak256(file)` equals onchain `documentHash`; onchain issuer equals `x-wallet`; onchain amounts and due date equal the form. Duplicates return `409 duplicate_invoice`.
`201 { invoiceId, status: "Submitted" }`

### GET /api/invoices  (public, filtered)
Query: `role=business&wallet=0x..` (own invoices, wallet-auth) or `role=investor&status=Eligible` (public marketplace list).
Returns summaries: `{ invoiceId, invoiceNumber, issuerWallet, amount, financingAmount, dueDate, status, verdict, simulated }[]`. Status comes from the chain.

### GET /api/invoices/{invoiceId}  (public summary; issuer/operator for documents)
Full detail: terms, chain status, latest verification run, status timeline with explorer tx links, position if funded. Never returns document bytes.

### GET /api/invoices/{invoiceId}/document  (wallet = issuer, or operator)
Streams the stored file. `403` otherwise.

## Verification

### POST /api/invoices/{invoiceId}/verify  (wallet = issuer, or operator)
1. Loads the onchain invoice; refuses unless status is Submitted or UnderReview (`409 not_verifiable`).
2. Runs the CRE workflow simulation with `{ invoiceId, invoiceNumber }`.
3. Parses the verdict. Any CLI error, timeout, or unparsable output becomes verdict `ERROR`.
4. Computes `verificationRef = keccak256(report_json)` and sends `recordVerification` with the verifier key: ELIGIBLE→Eligible(3), REJECTED→Rejected(4), MANUAL_REVIEW or ERROR→UnderReview(2).
5. Stores the verification run and a status event.
`200 { verdict, failedChecks, reviewReasons, externalReference, status, recordTx, simulated: true, recordedBy: "application-verifier-wallet" }`
`recordedBy` is surfaced in the UI to satisfy FR-018 (not a DON-signed write).

## Operator

### POST /api/operator/login  (public)
Body `{ passcode }`. Sets the session cookie. `401` on mismatch; rate-limited.

### GET /api/operator/queue  (operator)
Invoices currently `UnderReview` with their verification evidence and risk flags.

### POST /api/operator/invoices/{invoiceId}/decision  (operator)
Body `{ decision: "APPROVE" | "REJECT", reason }` (reason required). Sends `recordVerification` (Eligible or Rejected) with the verifier key; stores the decision and a status event.
`200 { status, txHash }`

### GET /api/operator/investors  (operator)  and  POST /api/operator/investors  (operator)
List approved wallets (from `InvestorAdded/Removed` events or a tracked table) and add/remove: body `{ address, action: "add" | "remove" }`. Executes `InvestorAllowlist.add/remove` with the admin key. `200 { txHash }`.

### POST /api/operator/simulated-erp  (operator)
Demo control. Body `{ invoiceNumber, scenario: "match" | "amount_mismatch" | "disputed" | "absent" }`. Reads the onchain invoice and writes (or deletes) the corresponding record in the mock registry. Response labels `simulated: true`.

## Chain-derived reads

### GET /api/positions?wallet=0x..  (public)
Funded positions held by the wallet with expected repayment and status.

### GET /api/config  (public)
`{ chainId: 1874, registry, allowlist, finance, usdt, explorer, usdtDecimals: 6 }`. Contains no secrets.

## Not handled by the server

Wallet-signed transactions are sent directly from the browser to the chain: `submitInvoice`, USDT `approve`, `ReceivableFinance.fund`, `ReceivableFinance.repay`, `ReceivableFinance.markDefaulted`. The server only observes the result (receipt) when asked to store off-chain data or refresh a cache.

## Security rules

- No private key, passcode or CRE credential is ever returned or placed in a `NEXT_PUBLIC_` variable.
- Document download is limited to issuer and operator.
- Status changes in the DB are always derived from a confirmed chain receipt or read, never from client-supplied status.
- `verify` and `decision` are idempotent against chain state: they re-read status first and refuse invalid transitions.
