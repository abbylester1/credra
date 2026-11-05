# Credra

**Trust-backed financing infrastructure.** Credra lets a business finance an unpaid invoice. The invoice is registered on Whitechain, verified by a Chainlink CRE workflow, funded by an allowlisted investor in USDT, and settled on repayment.

Built at ETHGlobal Mumbai 2026 for the **Whitechain "Tokenize: Real World Finance"** and **Chainlink "Best workflow with CRE"** tracks. This is **testnet software, not a live lending product.** All tokens have no value, and the external verification source is simulated.

## Status (honest snapshot)

| Area | Status |
|---|---|
| Contracts on Whitechain Sepolia (1874), source-verified | Done |
| CRE workflow reading Whitechain state and calling an external API, run through the CRE CLI | Done |
| Web app: submit invoice, verification, invoice pipeline, detail, operator tools | Done |
| Verification verdict recorded onchain, with failure and outage fail-safe | Done, tested on testnet |
| Investor funding and repayment in official USDT from the UI | **In progress** (contracts and tests are done; UI and the explorer-linked USDT payment are pending) |
| Demo video, landing page | Pending |

Evidence: [evidence/](evidence/) (CRE runs, supported-chains output, deployment and end-to-end transaction links).

## How it works

1. **Submit.** A business wallet registers an invoice (`InvoiceRegistry.submitInvoice`): a document fingerprint (keccak256), a hashed buyer reference, amounts and due date. A duplicate invoice id or document is refused by the contract.
2. **Verify.** The app runs the **CRE workflow**: it reads the invoice from Whitechain, calls the external verification API, compares the two, applies the eligibility rules and returns ELIGIBLE, REJECTED or MANUAL_REVIEW.
3. **Record.** The app's verifier wallet records the verdict onchain (`recordVerification`). Any error, timeout or outage in verification becomes manual review, never Eligible.
4. **Fund.** An allowlisted investor funds an Eligible invoice in the official USDT. The business is paid directly and the investor receives a receivable token (ERC-721, "Credra Receivable", CRDR) that can only move between allowlisted wallets.
5. **Repay.** The full invoice amount is paid to the current holder of the receivable. After the due date plus a 3 day grace period anyone can mark the invoice defaulted.

Economics: the investor pays the financing amount (for example 9,000 USDT) and is repaid the full invoice amount (10,000 USDT); the difference is the investor's discount. Contracts never hold funds and there is no administrator withdrawal.

## Architecture

```text
Browser wallet (business, investor)         Operator (passcode)
        |  signs submit / approve / fund / repay        |
        v                                               v
+---------------------------- apps/web (Next.js) ----------------------------+
|  UI  +  API routes  +  SQLite (off-chain data)  +  server-side verifier key  |
+--------+---------------------------+---------------------------+-----------+
         | spawns                    | reads / writes            | HTTP
         v                           v                           v
   CRE CLI simulation        Whitechain Sepolia           apps/mock-registry
   (cre/invoice-verification) InvoiceRegistry              (SIMULATED external
   reads registry state       InvestorAllowlist             verification API)
   + calls external API       ReceivableFinance  <--USDT--> official USDT
```

- `contracts/` Foundry project: `InvoiceRegistry`, `InvestorAllowlist`, `ReceivableFinance` (29 tests).
- `cre/invoice-verification/` the CRE workflow (TypeScript) with pure eligibility rules (11 tests).
- `apps/web/` Next.js app (26 unit tests).
- `apps/mock-registry/` a small server standing in for an external ERP or business registry.
- `specs/` Spec Kit specification, plan, tasks and UI spec; `DESIGN.md` style reference; `docs/` and `evidence/`.

### Why this needs onchain stablecoin settlement on Whitechain

Invoice financing involves several parties who must agree on one record: the issuer, the investor and whoever verifies. A bank rail would settle the money but could not also enforce who may hold the receivable, refuse a second financing of the same invoice, or let anyone inspect the verification record and the payment trail without asking the platform. Here the registry rejects duplicate invoices and documents, the allowlist and status machine are enforced by the contracts, and USDT moves straight from investor to business and back to the holder with no platform custody. A regular payment rail also could not make "financing and repayment follow the receivable token" a single atomic, auditable rule.

### How CRE is used

The workflow `cre/invoice-verification` is the verification step of the product, not a decoration. It is triggered with an invoice id, **reads the invoice from the Whitechain registry**, **calls an external verification API**, compares onchain and external data (issuer wallet, buyer, amount, due date, document fingerprint), applies the eligibility rules and returns a verdict with failed checks and an external reference. The web app runs it with `cre workflow simulate` and uses the result to decide whether an invoice can reach financing.

Trust model, stated plainly:
- Whitechain is **not** in this CRE tenant's supported-chains list ([evidence/cre-supported-chains.txt](evidence/cre-supported-chains.txt)), so it is declared as an experimental chain and read through its RPC in simulation.
- The verdict is recorded by the **application's verifier wallet** (an application-authorised transaction). It is **not** a DON-signed or CRE-attested write.
- The external verification source is **simulated** (`apps/mock-registry`). A document fingerprint proves a document has not changed, not that an invoice is genuine.

## Deployed contracts (Whitechain Sepolia, chain 1874, source-verified)

| Contract | Address |
|---|---|
| InvoiceRegistry | [`0xc11162A72F388Efb6Ddd0B73Eea578598d733122`](https://explorer.testnet.whitechain.io/address/0xc11162A72F388Efb6Ddd0B73Eea578598d733122) |
| InvestorAllowlist | [`0xE27c2C0BF2A6C34749257f0FD519c9e531ff4B51`](https://explorer.testnet.whitechain.io/address/0xE27c2C0BF2A6C34749257f0FD519c9e531ff4B51) |
| ReceivableFinance | [`0x3025FDea4Aa3A96deC46451b7Eec2e83188307B6`](https://explorer.testnet.whitechain.io/address/0x3025FDea4Aa3A96deC46451b7Eec2e83188307B6) |
| Official USDT (not ours) | [`0xcedfB56113143d55b2358b8CFbB0dEB5Ad2f55a7`](https://explorer.testnet.whitechain.io/address/0xcedfB56113143d55b2358b8CFbB0dEB5Ad2f55a7) |

Transactions and end-to-end results: [evidence/whitechain-transactions.md](evidence/whitechain-transactions.md) and [evidence/e2e-mvp-testnet.md](evidence/e2e-mvp-testnet.md). The USDT funding and repayment transaction links will be added here once recorded.

## Setup

Prerequisites: Node 22, [bun](https://bun.sh), [Foundry](https://getfoundry.sh), the [CRE CLI](https://docs.chain.link/cre/getting-started/cli-installation) (v1.39.0 used) and a completed `cre login`.

```bash
git clone --recurse-submodules <this repo> && cd credra
cp .env.example .env        # fill in throwaway TESTNET keys only; never commit .env
```

Test everything that needs no wallet:

```bash
cd contracts && forge test                      # 29 tests
cd ../cre/invoice-verification && bun install && bun test   # 11 tests
cd ../../apps/web && bun install && bun run test            # 26 tests
```

Run the stack:

```bash
cd apps/mock-registry && bun server.ts          # simulated external API on :8787
cd apps/web && bun run dev                      # app on :3000 (open /app)
```

End-to-end on testnet (acts as the business wallet; needs WBT for gas and the keys in `.env`):

```bash
cd apps/web && bun --env-file ../../.env scripts/e2e-mvp.ts
```

Wallets: import the throwaway business and investor keys into a browser wallet on Whitechain Sepolia (chain 1874, RPC `https://rpc.testnet.whitechain.io`). Gas comes from the [Whitechain faucet](https://faucet.testnet.whitechain.io/); test USDT comes from the sponsor.

## Current limitations

- Testnet only. Test tokens have no value. Not a live lending or investment product, and not legal, credit or compliance advice.
- The external verification source is simulated. Verification is not legal enforceability or creditworthiness.
- Verdicts are recorded by an application wallet, not by the CRE network. CRE is exercised through the CLI simulator; deployment access is not enabled on this account.
- One investor per invoice. No secondary market, KYC, credit scoring, or automatic detection of the buyer's payment (repayment is an explicit transaction).
- Operator access is a demo passcode. Wallet authentication is signature based with a 10 minute window and no nonce store.
- Both public RPCs are intermittently slow, so the app reads through a fallback transport.
- Investor funding and repayment screens, the demo video and the landing page are not finished at the time of writing.

## AI usage

This project was built with substantial help from Claude (Anthropic) through Claude Code: contract drafting and tests, the CRE workflow, the web app, specifications and documentation. All code was run and checked in the repository; the evidence files record real testnet runs.

## License

MIT, see [LICENSE](LICENSE).
