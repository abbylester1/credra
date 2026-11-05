# Implementation Plan: Credra Web App (Invoice Financing Lifecycle)

**Branch**: `001-credra-web-app` (no git branch; work on `main`) | **Date**: 2026-11-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-credra-web-app/spec.md`

## Summary

Build one web application, `apps/web`, that lets a business, an investor and an operator run the full Credra lifecycle against the already-deployed, verified Whitechain contracts: submit invoice, verify through the Chainlink CRE workflow, record the verdict onchain, fund in official USDT, repay.

Approach: a single Next.js (TypeScript) app serves both the UI and a thin server layer. Wallet actions the user owns (submit invoice, approve USDT, fund, repay) are signed in the user's own browser wallet. Actions that need protocol authority (running the CRE workflow, recording the verdict with the verifier key, operator approvals, allowlist changes) run server-side with throwaway testnet keys that never reach the browser. The chain is the source of truth for invoice status; a small local database holds only off-chain data (documents, verification reports, operator notes, status history). The existing simulated external API in `apps/mock-registry` stays a separate process. No contract or CRE workflow changes are required.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 22 (same runtime as the existing CRE workflow tooling; bun for scripts)

**Primary Dependencies**: Next.js (App Router), React, Tailwind CSS, wagmi + viem (wallet and chain access), TanStack Query (via wagmi), zod (input validation). Existing: Foundry contracts, CRE CLI v1.39.0, `apps/mock-registry` (bun).

**Storage**: SQLite file via Node's built-in `node:sqlite` (fallback: `better-sqlite3`); invoice documents on local disk under a gitignored `uploads/` directory. Chain state is read live with viem.

**Testing**: vitest for server and library logic (verdict parsing, hashing, status mapping, auth); existing `forge test` (29) and `bun test` (11) stay green; scripted end-to-end run on Whitechain testnet per `quickstart.md`. No browser-automation suite (time budget).

**Target Platform**: Desktop browser with an injected wallet extension; app runs locally on Node 22 for the demo (the verification step shells out to the local `cre` CLI).

**Project Type**: web-application (single Next.js app with server routes; one auxiliary mock service)

**Performance Goals**: UI interactions respond in under 1 s excluding chain confirmation; verification of one invoice completes in under 30 s (observed ~7 s per CRE simulation).

**Constraints**: Whitechain Sepolia only (chain 1874); official USDT `0xcedf…55a7` with 6 decimals; RPCs are flaky so every chain read uses a fallback transport and every wait has a timeout; no private key in browser code or client bundles; no document or PII onchain; simulated data labelled everywhere; verification failure never yields Eligible; hackathon time budget forbids new contracts or a redeploy.

**Scale/Scope**: Demo scale: under 50 invoices, 3 roles, about 7 screens (landing/connect, business dashboard, new invoice, invoice detail, investor marketplace, investor positions, operator console).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` v1.0.0 (ratified 2026-11-05) governs. Gates map to its principles:

| Gate | Pre-research | Post-design |
|------|--------------|-------------|
| G1. Never claim a CRE/DON-signed write; the backend signs `recordVerification` and the UI says so (FR-018) | PASS | PASS (see research D3, contracts/api.md) |
| G2. CRE failure or outage fails safe to manual review, never Eligible (FR-007) | PASS | PASS (verify route maps any CRE error to `UnderReview`) |
| G3. Simulated external data is labelled in UI and docs (FR-018) | PASS | PASS (badge on verification panel) |
| G4. Keys are testnet-only, server-side, never printed, committed or sent to the browser (FR-022) | PASS | PASS (server-only module; env var names documented, no `NEXT_PUBLIC_` keys) |
| G5. No confidential data onchain; documents stored off-chain by fingerprint (FR-019) | PASS | PASS (only keccak256 of file goes onchain) |
| G6. Payments use the official USDT contract, no replacement token (FR-011) | PASS | PASS (address from env, defaulted to official) |
| G7. No scope expansion beyond the PRD (no CCIP, no multi-investor, no cross-chain) | PASS | PASS |

No violations; Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/001-credra-web-app/
├── plan.md              # This file
├── research.md          # Phase 0: decisions and alternatives
├── data-model.md        # Phase 1: entities, tables, state transitions
├── quickstart.md        # Phase 1: runnable validation scenarios
├── contracts/
│   ├── api.md           # HTTP interface of the web app's server routes
│   └── onchain.md       # Deployed contract interface the app depends on
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 (/speckit-tasks) - NOT created here
```

### Source Code (repository root)

```text
apps/
├── web/                          # NEW: Next.js app (UI + server routes)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx, page.tsx            # connect + role routing
│   │   │   ├── business/page.tsx               # my invoices
│   │   │   ├── business/new/page.tsx           # submit invoice
│   │   │   ├── invoices/[id]/page.tsx          # detail, timeline, explorer links, repay
│   │   │   ├── investor/page.tsx               # eligible marketplace
│   │   │   ├── investor/positions/page.tsx     # funded positions
│   │   │   ├── operator/page.tsx               # review queue, allowlist, demo ERP records
│   │   │   └── api/                            # server routes (see contracts/api.md)
│   │   ├── components/                         # StatusBadge, TxLink, VerificationPanel, WalletButton...
│   │   ├── lib/
│   │   │   ├── chain.ts          # viem clients (fallback RPCs), addresses, explorer URLs
│   │   │   ├── abi.ts            # ABIs for the three contracts + ERC-20
│   │   │   ├── wagmi.ts          # wagmi config for chain 1874
│   │   │   ├── hash.ts           # keccak256 of document bytes, invoiceId derivation
│   │   │   ├── db.ts             # SQLite schema and queries (server only)
│   │   │   ├── cre.ts            # spawn `cre workflow simulate`, parse verdict (server only)
│   │   │   ├── verdict.ts        # verdict -> onchain status, verificationRef (server only)
│   │   │   ├── signer.ts         # verifier/admin wallet clients (server only)
│   │   │   ├── auth.ts           # operator passcode session (server only)
│   │   │   └── money.ts          # 6-decimal USDT formatting and parsing
│   │   └── types/
│   ├── tests/                    # vitest: hash, money, cre parsing, verdict mapping, auth
│   └── package.json, tsconfig.json, next.config.ts, tailwind config
├── mock-registry/                # EXISTING: simulated external verification API (unchanged)
contracts/                        # EXISTING (unchanged)
cre/                              # EXISTING (unchanged; workflow invoked by apps/web/lib/cre.ts)
scripts/                          # EXISTING seed script; add e2e-lifecycle.sh for quickstart
evidence/                         # EXISTING; funding/repayment evidence added after USDT arrives
```

**Structure Decision**: One new app, `apps/web`, in the existing monorepo-style layout. A separate backend service (the PRD's NestJS/Postgres/S3 stack) is rejected as unnecessary for demo scale; Next.js server routes plus SQLite give the same capabilities with one process. The mock registry remains its own process because it stands in for an external system.

## Complexity Tracking

No constitution violations to justify.
