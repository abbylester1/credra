# Phase 0 Research: Credra Web App

All items from Technical Context are resolved; no NEEDS CLARIFICATION remain.

## D1. Application framework: single Next.js app (UI + server routes)

- **Decision**: Next.js App Router with TypeScript and Tailwind, one process for pages and API routes.
- **Rationale**: Solo, time-boxed build; one repo, one deploy, one language shared with the CRE workflow tooling. Server routes provide the privileged layer (keys, CRE, DB) without a second service.
- **Alternatives**: NestJS + separate React frontend (PRD suggestion): more setup, two processes, no benefit at demo scale. Vite SPA + Express: viable but loses file-system routing and server components.

## D2. Wallet and chain access: wagmi + viem

- **Decision**: wagmi with the injected connector and a custom chain definition for Whitechain Sepolia (id 1874). viem `fallback` transport over the official RPC and the Ankr RPC.
- **Rationale**: Both RPCs were observed to time out intermittently; a fallback transport with timeouts keeps reads and receipt waits resilient. viem types come straight from the ABIs.
- **Alternatives**: ethers.js (less ergonomic types with wagmi hooks); RainbowKit/WalletConnect (extra setup, a project id, not needed with an injected wallet).

## D3. Verification execution: run the real CRE workflow from the server

- **Decision**: The verify route spawns `cre workflow simulate invoice-verification -T staging-settings --non-interactive --trigger-index 0 --http-payload '{"invoiceId":..,"invoiceNumber":..}'`, parses the JSON verdict from the "Workflow Simulation Result" output, then records the verdict with the verifier key.
- **Rationale**: The Chainlink track requires the workflow to be used meaningfully in the real eligibility process, not decorated. Simulation is explicitly sufficient. Verified earlier: the workflow reads the live registry and returns the four expected verdicts in about 7 s each.
- **Trust statement (G1)**: the verdict is recorded by an application-authorised transaction from the verifier wallet (VERIFIER_ROLE). The UI and README must not claim a DON-signed write. Whitechain is not in the tenant's supported-chains list (evidence/cre-supported-chains.txt).
- **Failure handling (G2)**: CLI missing, not logged in, timeout, unparsable output or unknown verdict all map to `UnderReview` with a reason code; nothing becomes Eligible without a successful parsed `ELIGIBLE` verdict or an explicit operator approval.
- **Alternatives**: Re-implement the rules in the app (rejected: CRE would be decorative); CRE deployed to the network (deploy access not enabled, Whitechain unsupported).

## D4. Who signs what

- **Decision**: Business and investor sign `submitInvoice`, USDT `approve`, `fund` and `repay` in their own browser wallets. The server signs `recordVerification` (verifier key) and operator actions (allowlist add/remove, manual approve/reject via `recordVerification`) with server-side testnet keys loaded from `.env`.
- **Rationale**: Contracts require `issuer == msg.sender` at submission and the investor as `msg.sender` at funding, so those must be user-signed. Role-gated writes need the verifier/admin keys, which must never reach the browser (FR-022).
- **Operator auth**: a passcode (`OPERATOR_PASSCODE` in `.env`) exchanged for an httpOnly signed cookie. Demo-grade, documented as such. Alternative (wallet-signature login with the admin wallet imported into the browser) rejected: adds friction and exposes the admin key to an extension.

## D5. Storage

- **Decision**: SQLite via the built-in `node:sqlite` module (Node 22), documents on local disk (`uploads/`, gitignored). Chain state is read live; the DB stores only off-chain data and a status-event log.
- **Rationale**: Zero native build steps on a flaky network; trivially resettable for demos. The chain is authoritative for status so there is no sync problem to solve.
- **Fallbacks**: `better-sqlite3` if `node:sqlite` proves unstable under Next.js bundling; Postgres/S3 from the PRD rejected for demo scale.

## D6. Document fingerprint and invoice identity

- **Decision**: `documentHash = keccak256(file bytes)`, computed in the browser for the user and recomputed on the server on upload (must match). `invoiceId = keccak256(utf8(invoiceNumber))`, matching the existing seed script. Duplicate invoice number or document is also rejected by the contract.
- **Rationale**: Reproducible, matches what the CRE workflow and contract already expect. Documents never go onchain (G5).

## D7. External verification record for newly submitted invoices

- **Decision**: The operator console includes a clearly labelled "Demo: simulate ERP record" control that writes a record into the mock registry for a given invoice with a chosen scenario (matches, amount mismatch, disputed, absent).
- **Rationale**: The mock API is the stand-in for an external system; without a way to populate it for UI-submitted invoices the demo could only reuse the four pre-seeded ones. The labelling satisfies G3.

## D8. Testing approach

- **Decision**: vitest for pure server/library logic; existing forge and bun suites untouched; a scripted testnet lifecycle (`scripts/e2e-lifecycle.sh`) and the manual walkthrough in quickstart.md as the end-to-end proof. No Playwright.
- **Rationale**: Time budget. The risky logic (hashing, money, verdict mapping, CRE output parsing, auth) is pure and cheap to unit test; the chain interactions are proven on testnet.

## D9. Explorer links and amounts

- **Decision**: One `TxLink`/`AddressLink` component builds URLs from `https://explorer.testnet.whitechain.io`. All amounts handled as bigint in base units; a single `money.ts` formats and parses 6-decimal USDT.
- **Rationale**: FR-017 and the edge case about rounding; avoids floating-point errors.

## D10. Open risk: no test USDT yet

- The investor and business wallets hold 0 USDT; the official token's `mint` is owner-only. The app's funding and repayment screens can be built and tested up to the token-balance check, but SC-004/SC-006 need sponsor-supplied USDT. Tracked as a dependency, not a design blocker.
