# Quickstart: Validating the Credra Web App

A runnable guide that proves the feature end to end. Contracts, data and CRE details live in [contracts/onchain.md](contracts/onchain.md), [contracts/api.md](contracts/api.md) and [data-model.md](data-model.md); they are not repeated here.

## Prerequisites

- Node 22, bun, Foundry and the `cre` CLI (v1.39.0) on `PATH`; `cre login` completed on this machine (`cre whoami` shows the account).
- Root `.env` with the four throwaway testnet keys, `USDT`, both RPCs, plus the app variables `OPERATOR_PASSCODE` and the contract addresses (see `.env.example`). Never print or commit it.
- Browser wallet extension with the **business** and **investor** throwaway keys imported (testnet only), network "Whitechain Sepolia" (chain 1874).
- WBT for gas on all four wallets (done). **Test USDT** on the investor (at least 9,000) and business (at least 10,000) wallets: supplied by the Whitechain sponsor; required only for scenarios 5-6.

## Setup

```bash
bun run --cwd apps/mock-registry server.ts      # simulated ERP API on :8787
cd apps/web && bun install && bun run dev       # app on :3000
```

Expected: `http://localhost:8787/health` returns `{"ok":true,"simulated":true}`; the app loads and shows a connect prompt.

## Automated checks (no wallet needed)

```bash
cd contracts && forge test                      # 29 pass
cd cre/invoice-verification && bun test         # 11 pass
cd apps/web && bun run test                     # vitest: hash, money, CRE parsing, verdict mapping, auth
```

## Validation scenarios

1. **Eligible path (US1, SC-001/002)**: As business, submit INV-9001 with a PDF. In operator console choose "Demo: simulate ERP record -> match". Verify. Expect status Eligible, verdict panel labelled "simulated data" and "recorded by application verifier wallet", explorer links for the submit and verdict transactions.
2. **Rejected path**: Repeat with INV-9002 and scenario "amount mismatch". Expect Rejected with `amount_mismatch`. Repeat with "absent": Rejected, `invoice_not_found_in_external_registry`.
3. **Manual review (US4)**: INV-9003 with "disputed". Expect Under review for the business; appears in the operator queue; approve with a reason; becomes Eligible and visible to investors.
4. **Fail-safe (SC-007)**: Stop the mock registry, verify a new invoice. Expect Under review with `external_api_unavailable`, never Eligible. Also temporarily rename the `cre` binary on `PATH`: expect Under review (ERROR), never Eligible.
5. **Funding (US2, SC-004/005)**: As a non-approved wallet, open an Eligible invoice: fund blocked with "not approved". As operator add the investor wallet. As investor: approve USDT, then fund. Expect business USDT balance up by the financing amount, status Funded, receivable held by investor, explorer links for approve and fund.
6. **Repayment and default (US3)**: As business, approve and repay the full amount. Expect investor balance up by the invoice amount, status Repaid. Confirm a second repay is refused. (Default path: only testable with a short-dated invoice or by reasoning from the 29 contract tests; not required for the demo.)
7. **Duplicates (SC-003)**: Resubmit INV-9001 and the same file under a new number. Both refused with duplicate messages; nothing registered.
8. **Wrong network and failed transactions**: Switch the wallet to another chain: actions blocked with a switch prompt. Reject a wallet prompt: status unchanged.
9. **Privacy (FR-019)**: Request `/api/invoices/{id}/document` as an unrelated wallet: `403`. Confirm onchain data contains only hashes and amounts.

## Evidence to capture (for sponsor checklists)

Record explorer links for scenario 5 and 6 in `evidence/whitechain-transactions.md`, and the CRE logs for scenarios 1-4 in `evidence/cre-simulation-whitechain-testnet.md`.

## Success mapping

| Scenario | Spec criteria |
|---|---|
| 1-3 | SC-001, SC-002, SC-008 |
| 4 | SC-007 |
| 5 | SC-004, SC-005 |
| 5-6 | SC-006, SC-009 |
| 7 | SC-003 |
