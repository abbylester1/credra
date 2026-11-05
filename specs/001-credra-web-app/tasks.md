---

description: "Task list for the Credra web app (001-credra-web-app)"
---

# Tasks: Credra Web App (Invoice Financing Lifecycle)

**Input**: Design documents from `/specs/001-credra-web-app/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, contracts/onchain.md, quickstart.md; constitution v1.0.0 in `.specify/memory/constitution.md`

**Tests**: Included for pure logic that protects funds or eligibility (constitution principle VI; plan decision D8). Browser automation is out of scope; chain behaviour is proven by the testnet quickstart.

**Organization**: Grouped by user story (US1-US5 from spec.md) so each story is independently testable. All app paths are relative to `apps/web/` unless a full path is given.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1..US5; Setup, Foundational and Polish tasks carry no story label
- Existing, unchanged assets: `contracts/` (deployed, verified), `cre/invoice-verification/`, `apps/mock-registry/`

## Path Conventions

Single Next.js app in `apps/web/` with `src/app/` (pages and `api/` routes), `src/components/`, `src/lib/`, `tests/`.

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Scaffold a Next.js (App Router) TypeScript + Tailwind CSS app in `apps/web/` (package.json, tsconfig.json, `src/app/layout.tsx`, `src/app/page.tsx`)
- [ ] T002 Install dependencies in `apps/web/package.json`: wagmi, viem, @tanstack/react-query, zod, vitest (use bun; Node 22)
- [ ] T003 [P] Configure vitest in `apps/web/vitest.config.ts` and add `test`, `typecheck` scripts to `apps/web/package.json`
- [ ] T004 [P] Append `apps/web/uploads/`, `apps/web/*.db`, `apps/web/.next/` to `/Users/abby/Eth Mumbai/.gitignore` (constitution III, IV)
- [ ] T005 [P] Load the repository-root `.env` for server code in `apps/web/next.config.ts` (read `../../.env`; expose no secret via `NEXT_PUBLIC_`) and add `apps/web/src/lib/env.ts` (server-only, zod-validated: `PRIVATE_KEY_VERIFIER`, `PRIVATE_KEY_DEPLOYER`, `OPERATOR_PASSCODE`, `REGISTRY_ADDRESS`, `ALLOWLIST_ADDRESS`, `FINANCE_ADDRESS`, `USDT`, `WHITECHAIN_RPC`, `WHITECHAIN_RPC_FALLBACK`, `MOCK_REGISTRY_URL`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure every user story needs. No user story work starts before this phase is complete.

- [ ] T006 [P] Implement 6-decimal USDT helpers in `src/lib/money.ts` (`parseUsdt(string) -> bigint`, `formatUsdt(bigint) -> string`; integers only, never floating point; reject more than 6 decimals)
- [ ] T007 [P] Unit tests for money in `tests/money.test.ts` (round trip, 6-decimal rejection, `10000.000001`, zero, negative)
- [ ] T008 [P] Implement `src/lib/hash.ts`: `documentHash(bytes) = keccak256(file bytes)`, `invoiceId(number) = keccak256(utf8(invoiceNumber))`, `buyerRef(name) = keccak256("buyer:" + name)` (must match `scripts/seed-demo.sh`)
- [ ] T009 [P] Unit tests for hash in `tests/hash.test.ts` (known vectors incl. `INV-1001 -> 0xe4f729cc5c74e26942b90175714ea77f0711eb25e5ea3b3620ff097d6805a571`; same bytes give same hash)
- [ ] T010 [P] Generate ABIs into `src/lib/abi.ts` for InvoiceRegistry, InvestorAllowlist, ReceivableFinance (from `contracts/out` via `forge inspect <Contract> abi --json`) plus the minimal ERC-20 ABI (`balanceOf`, `allowance`, `approve`, `decimals`); export as `as const`
- [ ] T011 Implement `src/lib/chain.ts`: Whitechain Sepolia chain definition (id 1874, WBT, explorer `https://explorer.testnet.whitechain.io`), addresses from env, viem public client using `fallback` transport over `WHITECHAIN_RPC` then `WHITECHAIN_RPC_FALLBACK` with timeouts, `explorerTx(hash)`, `explorerAddress(addr)` (depends on T010, T005)
- [ ] T012 [P] Implement `src/lib/status.ts`: enum `0 None, 1 Submitted, 2 UnderReview, 3 Eligible, 4 Rejected, 5 Funded, 6 Repaid, 7 Defaulted`, labels, allowed transitions exactly as in data-model.md (Rejected, Repaid, Defaulted terminal)
- [ ] T013 [P] Implement `src/lib/errors.ts` mapping contract/ERC-20/wallet errors to user messages per contracts/onchain.md ("Error mapping (UI)"): `DuplicateInvoice`/`DuplicateDocument` -> "already submitted"; `InvalidTerms`; `NotAllowlisted` -> "wallet not approved"; `NotEligible` -> "no longer available"; `NotFunded` -> "not awaiting repayment"; allowance/balance shortfall; wrong chain
- [ ] T014 Implement `src/lib/db.ts` (server-only, `node:sqlite`, file `apps/web/credra.db`) creating tables per data-model.md: `invoices` (`invoice_number` unique, `document_hash` unique), `documents` (allowed mime: pdf, png, jpg; max 10 MB), `verification_runs` (verdict: ELIGIBLE / REJECTED / MANUAL_REVIEW / ERROR), `operator_decisions` (decision APPROVE / REJECT, reason required), `status_events`, `positions`; add a `better-sqlite3` fallback note if `node:sqlite` fails under Next bundling
- [ ] T015 [P] Implement `src/lib/signer.ts` (server-only): viem wallet clients for the verifier key and the deployer/admin key; never exported to client modules (add `import "server-only"`)
- [ ] T016 [P] Implement `src/lib/auth.ts` (server-only): operator passcode check (constant-time compare against `OPERATOR_PASSCODE`), signed httpOnly session cookie, in-memory rate limit on login
- [ ] T017 [P] Unit tests for auth in `tests/auth.test.ts` (wrong passcode rejected, rate limit, tampered cookie rejected, valid cookie accepted)
- [ ] T018 [P] Implement `src/lib/walletAuth.ts` (server-only): issue nonce message, verify `x-wallet` / `x-signature` with viem `verifyMessage`, nonce single-use and expiring
- [ ] T019 [P] Implement `src/lib/api.ts`: zod-validated request helper and error envelope `{ error, message }` per contracts/api.md
- [ ] T020 Implement `src/lib/wagmi.ts` (injected connector, chain 1874, fallback transport), `src/components/Providers.tsx` (wagmi + react-query) and wire into `src/app/layout.tsx`
- [ ] T021 [P] Build `src/components/WalletButton.tsx` and `src/components/NetworkGuard.tsx` (blocks actions and prompts a switch when the wallet is not on chain 1874; FR-001, FR-002)
- [ ] T022 [P] Build `src/components/StatusBadge.tsx`, `TxLink.tsx`, `AddressLink.tsx`, `SimulatedBadge.tsx`, `AmountText.tsx` (explorer links via `explorerTx`; SimulatedBadge text "simulated data")
- [ ] T023 [P] Implement `GET /api/config` in `src/app/api/config/route.ts` returning `{ chainId, registry, allowlist, finance, usdt, explorer, usdtDecimals: 6 }` and no secrets

**Checkpoint**: foundation ready; `bun run typecheck` and `bun run test` pass.

---

## Phase 3: User Story 1 - Business submits an invoice and sees its verification result (Priority: P1) MVP

**Goal**: a business submits an invoice, it is verified through the real CRE workflow, the verdict is recorded onchain, and the business sees the outcome with reasons and explorer links.

**Independent Test**: quickstart scenarios 1, 2, 4 and 7: Eligible, Rejected (mismatch, absent), fail-safe on outage, duplicate refusal. Pre-seeded invoices INV-1001..4004 also work.

### Tests for User Story 1

- [ ] T024 [P] [US1] Tests for CRE output parsing in `tests/cre.test.ts`: parses the "Workflow Simulation Result" JSON string; maps missing CLI, non-zero exit, timeout, garbage output, unknown verdict, malformed JSON to verdict `ERROR` (never ELIGIBLE)
- [ ] T025 [P] [US1] Tests for verdict mapping in `tests/verdict.test.ts`: ELIGIBLE->3 Eligible, REJECTED->4 Rejected, MANUAL_REVIEW->2 UnderReview, ERROR->2 UnderReview; `verificationRef = keccak256(report_json)`; no input maps to Eligible except a parsed ELIGIBLE (constitution II)

### Implementation for User Story 1

- [ ] T026 [P] [US1] Implement `src/lib/cre.ts` (server-only): spawn `cre workflow simulate invoice-verification -T staging-settings --non-interactive --trigger-index 0 --http-payload '{"invoiceId":..,"invoiceNumber":..}'` with cwd `<repo>/cre`, PATH including `~/.local/bin`, 60 s timeout; parse stdout; return `{ verdict, failedChecks, reviewReasons, externalReference, reportJson }` or `ERROR` with a reason code
- [ ] T027 [P] [US1] Implement `src/lib/verdict.ts` (server-only): verdict-to-status mapping, `verificationRef`, and `recordVerdict(invoiceId, verdict, ref)` sending `recordVerification` with the verifier wallet (T015); waits for the receipt with a timeout
- [ ] T028 [P] [US1] Implement `src/lib/repo.ts` (server-only) queries for invoices, documents, verification_runs, status_events (insert, get by id, list by issuer, latest run)
- [ ] T029 [US1] Implement `POST /api/invoices` in `src/app/api/invoices/route.ts` (multipart per contracts/api.md): validate with zod (amount > 0; 0 < financing_amount < amount; due_date > now); recompute `keccak256(file)` and require equality with the onchain `documentHash`; require onchain issuer equals `x-wallet`; file type pdf/png/jpg and max 10 MB; store file under `apps/web/uploads/`; `409 duplicate_invoice` on repeat number or hash
- [ ] T030 [P] [US1] Implement `GET /api/invoices` and `GET /api/invoices/[invoiceId]` in `src/app/api/invoices/route.ts` and `src/app/api/invoices/[invoiceId]/route.ts` (status read live from the chain; latest verification run; never returns document bytes)
- [ ] T031 [P] [US1] Implement `GET /api/invoices/[invoiceId]/document` in `src/app/api/invoices/[invoiceId]/document/route.ts` (issuer via wallet-auth, or operator via session; `403` otherwise; FR-019)
- [ ] T032 [US1] Implement `POST /api/invoices/[invoiceId]/verify` in `src/app/api/invoices/[invoiceId]/verify/route.ts`: re-read chain status and refuse unless Submitted or UnderReview (`409 not_verifiable`); run `cre.ts`; record via `verdict.ts`; store the run (`source_simulated = 1`) and a status event; response includes `recordedBy: "application-verifier-wallet"` and `simulated: true`
- [ ] T033 [US1] Implement `POST /api/operator/login` in `src/app/api/operator/login/route.ts` using `src/lib/auth.ts`
- [ ] T034 [US1] Implement `POST /api/operator/simulated-erp` in `src/app/api/operator/simulated-erp/route.ts` (operator session): scenarios `match | amount_mismatch | disputed | absent`; reads the onchain invoice and writes or deletes the record via the mock registry's `POST /admin/invoices` at `MOCK_REGISTRY_URL`; response labelled `simulated: true`
- [ ] T035 [US1] Build `src/app/business/new/page.tsx`: form with invoice number, issuer and buyer details, amount, currency, invoice date, due date, requested financing amount, file; compute the document hash in the browser; wallet sends `submitInvoice` (T010 ABI), waits for receipt, then `POST /api/invoices`, then `POST .../verify`; show the duplicate message from T013
- [ ] T036 [US1] Build `src/app/business/page.tsx`: the connected wallet's invoices with StatusBadge and explorer links (FR-021)
- [ ] T037 [US1] Build `src/app/invoices/[invoiceId]/page.tsx` and `src/components/VerificationPanel.tsx`: terms, chain status, verdict, failed checks with plain-language text, external reference, SimulatedBadge, the line "recorded by the application's verifier wallet, not by the CRE network", explorer links
- [ ] T038 [US1] Build minimal operator console `src/app/operator/page.tsx`: passcode login and the "Demo: simulate ERP record" control (labelled simulated)
- [ ] T039 [US1] Validate quickstart scenarios 1, 2, 4, 7 against Whitechain testnet; append logs and explorer links to `evidence/cre-simulation-whitechain-testnet.md`

**Checkpoint**: US1 works alone; a business can submit and see a verified outcome (MVP).

---

## Phase 4: User Story 2 - Investor funds an eligible invoice in USDT (Priority: P1)

**Goal**: an approved investor approves spend and funds an Eligible invoice with the official USDT; the business is paid directly and the investor holds the receivable.

**Independent Test**: quickstart scenario 5 (needs sponsor test USDT in the investor wallet). Allowlist blocking and shortfall messages are testable before USDT arrives.

### Tests for User Story 2

- [ ] T040 [P] [US2] Tests in `tests/shortfall.test.ts`: balance below financing amount, allowance below financing amount, both sufficient, exact boundary (integers in base units)

### Implementation for User Story 2

- [ ] T041 [P] [US2] Implement `src/lib/shortfall.ts` (`computeShortfall({ balance, allowance, required })`) used by the fund and repay panels
- [ ] T042 [P] [US2] Implement `GET /api/positions?wallet=0x..` in `src/app/api/positions/route.ts` (reads `positions()` and `ownerOf` from the chain; funded amount, expected repayment, status)
- [ ] T043 [US2] Implement `POST /api/invoices/[invoiceId]/sync` in `src/app/api/invoices/[invoiceId]/sync/route.ts`: body `{ txHash }`; confirm the receipt on chain, read the resulting status, append a `status_events` row and refresh the `positions` cache (status never taken from the client); also add this route to `specs/001-credra-web-app/contracts/api.md`
- [ ] T044 [US2] Implement role resolution hook `src/lib/useRole.ts` (investor if `allowlist.isAllowed(wallet)`; operator if session; else business) per data-model.md
- [ ] T045 [US2] Build `src/components/FundPanel.tsx`: balance and allowance check (T041), clear separate steps "Approve USDT" then "Fund invoice", block with "wallet not approved" before any payment when not allowlisted, fund unavailable unless status is Eligible and not past due, error mapping (T013), explorer links for both transactions, then `POST .../sync`
- [ ] T046 [US2] Build `src/app/investor/page.tsx`: marketplace of Eligible invoices with issuer, buyer, amount, financing amount, implied return (`amount - financing_amount`), due date
- [ ] T047 [US2] Integrate `FundPanel` and the verification evidence/risk flags into `src/app/invoices/[invoiceId]/page.tsx` for investors (FR-009)
- [ ] T048 [US2] Build `src/app/investor/positions/page.tsx`: funded positions with holder, funded amount, expected repayment, status, explorer links (FR-021)
- [ ] T049 [US2] Validate quickstart scenario 5 on testnet once USDT arrives; record the approve and fund transaction links in `evidence/whitechain-transactions.md`

**Checkpoint**: US1 and US2 work; an invoice can be verified and funded.

---

## Phase 5: User Story 3 - Repayment closes the financing (Priority: P2)

**Goal**: the business (or operator) repays the full amount in USDT; the current holder is paid and the invoice becomes Repaid; default is available after the grace period.

**Independent Test**: quickstart scenario 6: repay a Funded invoice; investor balance rises by the invoice amount; second repay refused.

- [ ] T050 [P] [US3] Build `src/components/RepayPanel.tsx`: shortfall check against the full `amount`, "Approve USDT" then "Repay", refuse unless status is Funded, error mapping, explorer links, then `POST .../sync`
- [ ] T051 [P] [US3] Build `src/components/DefaultButton.tsx`: visible only when status is Funded and `now > dueDate + 259200`; calls `markDefaulted`; explains the grace period
- [ ] T052 [US3] Integrate `RepayPanel` and `DefaultButton` into `src/app/invoices/[invoiceId]/page.tsx`; show the current receivable holder (supports transferred receivables)
- [ ] T053 [US3] Update `src/app/investor/positions/page.tsx` to show repaid amount, repaid time and the repayment explorer link
- [ ] T054 [US3] Validate quickstart scenario 6 on testnet; record repay transaction links and the second-repay refusal in `evidence/whitechain-transactions.md`

**Checkpoint**: full lifecycle (submit, verify, fund, repay) demonstrable.

---

## Phase 6: User Story 4 - Operator reviews exceptions and manages investors (Priority: P2)

**Goal**: an operator resolves manual-review invoices with a recorded reason and manages the approved investor list.

**Independent Test**: quickstart scenario 3 and scenario 5's allowlist step.

- [ ] T055 [P] [US4] Tests in `tests/decision.test.ts`: reason required; APPROVE maps to Eligible and REJECT to Rejected; only from UnderReview; refused for any other status
- [ ] T056 [P] [US4] Implement `GET /api/operator/queue` in `src/app/api/operator/queue/route.ts` (operator session; invoices currently UnderReview with latest evidence and risk flags)
- [ ] T057 [US4] Implement `POST /api/operator/invoices/[invoiceId]/decision` in `src/app/api/operator/invoices/[invoiceId]/decision/route.ts`: body `{ decision: "APPROVE" | "REJECT", reason }` (reason required); re-read chain status first; send `recordVerification` with the verifier key; store the `operator_decisions` row and a status event
- [ ] T058 [P] [US4] Implement `GET` and `POST /api/operator/investors` in `src/app/api/operator/investors/route.ts`: list wallets from `InvestorAdded`/`InvestorRemoved` events; add/remove with the admin key via `InvestorAllowlist.add/remove`
- [ ] T059 [US4] Extend `src/app/operator/page.tsx` with the review queue (evidence, approve/reject with reason) and the allowlist manager
- [ ] T060 [US4] Add route protection for `/operator` and `/api/operator/*` in `src/middleware.ts`: non-operators get access denied (FR-016)
- [ ] T061 [US4] Validate quickstart scenario 3 on testnet; add evidence to `evidence/whitechain-transactions.md`

---

## Phase 7: User Story 5 - Transparent trail and honest labelling (Priority: P3)

**Goal**: every step has an explorer link and every simulated or application-recorded element is clearly labelled.

**Independent Test**: walk one invoice through the lifecycle and confirm links and labels (quickstart scenario 9 and SC-008).

- [ ] T062 [P] [US5] Build `src/components/Timeline.tsx` from `status_events` with timestamps and explorer links; add to the invoice detail page (FR-020)
- [ ] T063 [P] [US5] Build `src/components/TrustModelNotice.tsx` and `src/app/about/page.tsx`: states that the verifier wallet records results (not a DON-signed write), that Whitechain is read by the CRE simulator as an experimental chain, and which data is simulated (constitution I)
- [ ] T064 [US5] Audit every page for simulated or unavailable data and apply `SimulatedBadge` / `TrustModelNotice` where missing (FR-018)
- [ ] T065 [US5] Validate privacy (quickstart scenario 9): document route returns `403` to unrelated wallets; confirm onchain data has only hashes and amounts

---

## Phase 9: User Story 6 - Landing page (Priority: P3, after US1 and US2)

**Goal**: marketing page at `/` that explains Credra honestly and routes both audiences into the app (now under `/app`). Source: [landing-brief.md](landing-brief.md) (reconciled with the repository). Build only after the MVP and funding flow work.

**Independent Test**: load `/` at 375, 768, 1280 px; every visible CTA works; no invented figures; Verified status shown only when real.

- [x] T074 [P] [US6] Update `/Users/abby/Eth Mumbai/DESIGN.md`: add the marketing type scale, `pine-hover #092E29`, and the single pine CTA-band exception (needs approval, see landing-brief.md item 3)
- [ ] T075 [US6] Restructure routes: marketing at `src/app/(marketing)/page.tsx` (`/`), application under `/app/*` (route group `(app)` with an `app` segment); update links in ui-spec and API redirects
- [ ] T076 [P] [US6] Build `src/components/marketing/Navbar.tsx` and `MobileMenu.tsx` (72px sticky, anchor links, Launch app only filled action; no Sign in)
- [ ] T077 [US6] Build `HeroSection.tsx` and `ProductPreview.tsx` using the real `StatusChip`, `Amount`, `EvidencePanel` components; render INV-1001 from live data when available, otherwise labelled "Illustrative demo data"; never show a Verified status or transaction without a real recorded result
- [ ] T078 [P] [US6] Build `TrustSection.tsx` (four approach cards) and `ProcessTimeline.tsx` (five steps, horizontal and vertical)
- [ ] T079 [P] [US6] Build `AudienceSection.tsx` (business and investor, distinct CTAs; investor CTA hidden until `/app/investor` exists) and `TechnologySection.tsx` (use "Recorded onchain by the verifier wallet", say CRE is demonstrated in the simulator)
- [ ] T080 [P] [US6] Build `ProductShowcase.tsx` (one to three alternating stories from real components) and `FinalCTA.tsx` (pine band)
- [ ] T081 [P] [US6] Build `Footer.tsx` and the `/risk` page (demo and risk notice); link only to real destinations (trust-model page, explorer link to the registry contract)
- [ ] T082 [US6] Add SEO basics (title, description, Open Graph, canonical, robots, sitemap); check layout at 375, 390, 430, 768, 1024, 1280, 1440 px; run a link check; reduced-motion check

**Checkpoint**: landing page works alone and every CTA resolves.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T066 [P] Write `scripts/e2e-lifecycle.sh`: scripted testnet lifecycle (submit, verify via `POST /api/invoices/.../verify`, allowlist, approve, fund, approve, repay) using env keys without printing them
- [ ] T067 [P] Write `scripts/check-secrets.sh`: grep the built client bundle (`apps/web/.next/static`) and `apps/web/src` for key patterns and `NEXT_PUBLIC_` secrets; fail on any hit (FR-022)
- [ ] T068 Run `bun run typecheck`, `bun run test`, `bun run build` in `apps/web/`; also `forge test` and `bun test` (cre) to confirm existing suites stay green
- [ ] T069 [P] Write `/Users/abby/Eth Mumbai/README.md`: Credra overview, architecture diagram, setup instructions, why Whitechain and onchain USDT settlement (and what a regular payment rail cannot provide), CRE integration explanation, trust model, explorer links, current limitations
- [ ] T070 [P] Write `/Users/abby/Eth Mumbai/WHITECHAIN_FEEDBACK.md` (what worked, what was difficult, documentation gaps, testnet/tooling issues, one improvement)
- [ ] T071 [P] Write `docs/architecture.md`, `docs/data-flow.md`, `docs/threat-model.md`, `docs/demo-script.md` (3-minute script per the PRD)
- [ ] T072 Update `CLAUDE.md` (commands, structure, status) and refresh `evidence/` files; commit
- [ ] T073 Run the full `quickstart.md` end to end on Whitechain testnet and record final transaction links; record the 2-4 minute demo video

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: depends on Setup; blocks all user stories.
- **US1 (Phase 3)** depends on Foundational only.
- **US2 (Phase 4)** depends on Foundational and uses the invoice detail page from US1 (T037); its logic is otherwise independent.
- **US3 (Phase 5)** depends on US2's sync route (T043) and detail page integration.
- **US4 (Phase 6)** depends on Foundational and T033 (login); independent of US2/US3.
- **US5 (Phase 7)** depends on the pages built in US1-US4 for placement; its components are independent.
- **Polish (Phase 8)** depends on all desired stories.

### Within a story

Tests first (they should fail), then library modules, then API routes, then UI, then the testnet validation task.

### External dependency

T049, T054 and the funding/repayment parts of T073 need sponsor-supplied test USDT in the investor wallet (at least 9,000) and business wallet (at least 10,000 more). Everything else can proceed without it.

## Parallel Opportunities

- Phase 1: T003, T004, T005 together after T001/T002.
- Phase 2: T006-T010, T012, T013, T015-T019, T021-T023 are mostly independent files and can run in parallel; T011 follows T010 and T005; T014 and T020 are sequential single-file tasks.
- US1: T024, T025, T026, T027, T028 in parallel; then T030 and T031 in parallel; UI tasks T035-T038 are sequential on shared pages.
- US2 and US4 can be built by different people or sessions in parallel after Foundational.

### Example: User Story 1 kick-off

```text
Parallel batch A: T024 tests/cre.test.ts | T025 tests/verdict.test.ts | T026 src/lib/cre.ts | T027 src/lib/verdict.ts | T028 src/lib/repo.ts
Then: T029 POST /api/invoices, T032 verify route
Parallel batch B: T030 GET invoices | T031 document route
Then: T035 new invoice page, T036 dashboard, T037 detail page, T038 operator console
```

## Implementation Strategy

### MVP first (User Story 1 only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1) and validate with T039.
3. This alone demonstrates the Chainlink track: real CRE workflow reading Whitechain, an external API, eligibility results driving the application, plus the failure scenarios.

### Incremental delivery

1. US2 (funding) next: satisfies the mandatory USDT payment for the Whitechain track once USDT arrives.
2. US3 (repayment): completes the lifecycle step beyond issuance.
3. US4 (operator) and US5 (labelling) next, then Polish and the submission files (README, feedback file, demo video).

### Time-boxing note

If time runs short, cut in this order: US5 extras (T064/T065 audits beyond the notice component), T067 script, the default button (T051). Do not cut the trust-model notice (T063), the fail-safe tests (T024, T025) or the evidence tasks (constitution I, II, VI).

## Notes

- `[P]` tasks touch different files with no dependency on unfinished tasks.
- Commit after each task or logical group; keep history continuous (constitution VI).
- Never print, log or commit keys; the verifier and admin keys are used only in `signer.ts` (constitution III).
- Each story must be validated at its checkpoint before moving on.
