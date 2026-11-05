# Credra: Trust-backed financing infrastructure (invoice financing and receivables)

ETHGlobal Mumbai 2026 hackathon MVP. Targets: Whitechain "Tokenize: Real World Finance" + Chainlink "Best workflow with CRE". Solo build. Do not expand scope beyond the PRD (no CCIP, no cross-chain, no real credit scoring).

## Architecture in one paragraph
Business submits an invoice onchain (`InvoiceRegistry`). A Chainlink CRE workflow reads that record from Whitechain, calls an external verification API, applies eligibility rules, and returns ELIGIBLE / REJECTED / MANUAL_REVIEW. The backend then writes the verdict onchain (VERIFIER_ROLE). An allowlisted investor funds an Eligible invoice in official USDT via `ReceivableFinance`, which mints an allowlist-gated ERC-721 receivable. Repayment pays the full invoice amount to the current token holder.

## Repository
Public: https://github.com/abbylester1/credra (MIT). Commit messages carry no AI-attribution trailers (owner preference); AI use is disclosed in the README.

## Layout
- `contracts/` Foundry project (Solidity 0.8.24, OpenZeppelin v5.1.0, forge-std as git submodules in `contracts/lib`). Contracts: `InvoiceRegistry`, `InvestorAllowlist`, `ReceivableFinance` (funding + settlement merged; no separate SettlementManager).
- `cre/` CRE project. Workflow in `cre/invoice-verification/` (`main.ts` = CRE I/O, `rules.ts` = pure eligibility rules, `rules.test.ts` = bun tests).
- `apps/mock-registry/` SIMULATED external verification API (bun). `apps/web/` is the planned Next.js app (not built yet).
- `scripts/seed-demo.sh` submits 4 demo invoices onchain and seeds the mock API.
- `evidence/` CRE simulation logs, supported-chains output, Whitechain tx hashes. Keep these updated; the sponsor checklists depend on them.

## Commands
- Contract tests: `cd contracts && forge test` (29 tests, uses a MockUSDT).
- Deploy: `cd contracts && set -a && . ../.env && set +a && forge script script/Deploy.s.sol --rpc-url $WHITECHAIN_RPC --broadcast --slow`
- Verify on explorer (Blockscout): `forge verify-contract <addr> src/X.sol:X --constructor-args "$(cast abi-encode ...)" --verifier blockscout --verifier-url https://explorer.testnet.whitechain.io/api/ --rpc-url $WHITECHAIN_RPC --watch`. Quote the constructor args.
- Rules tests / typecheck: `cd cre/invoice-verification && bun test && bunx tsc --noEmit`
- Mock API: `cd apps/mock-registry && bun server.ts` (port 8787)
- CRE simulate: `cd cre && cre workflow simulate invoice-verification -T staging-settings --non-interactive --trigger-index 0 --http-payload '{"invoiceId":"0x...","invoiceNumber":"INV-1001"}'`

## Environment notes
- Tools live in `~/.foundry/bin`, `~/.local/bin` (cre v1.39.0), `~/.bun/bin`. Add to PATH in non-login shells.
- The Bash sandbox has no network; network commands need `dangerouslyDisableSandbox`. The network is slow/flaky: use generous timeouts and retry. Foundry/CRE installs came from GitHub releases.
- Shell is zsh: it does not word-split unquoted variables (`$spec`); use explicit args.
- Git author is set repo-locally (Abhi / abbylester@gmail.com). Commit often; the Whitechain track checks for steady history. End commits with the Co-Authored-By line from the session attribution reminder.

## Network and tokens
- Whitechain Sepolia, chain id 1874, native gas WBT. RPC `https://rpc.testnet.whitechain.io` (fallback `https://rpc.ankr.com/whitechain_testnet`, both flaky). Explorer `https://explorer.testnet.whitechain.io` (Blockscout).
- Official USDT `0xcedfB56113143d55b2358b8CFbB0dEB5Ad2f55a7`, 6 decimals, mint is owner-only. No public USDT faucet: test USDT must come from the Whitechain sponsor. Never deploy a replacement token for the main flow.
- WBT faucet is GitHub-login gated, one drip per account.
- Receivable token: `Credra Receivable` / `CRDR` (ERC-721). Earlier `Invoice Receivable`/`RCVBL` deployment was superseded (see evidence/whitechain-transactions.md).
- Deployed (verified): InvoiceRegistry `0xc11162A72F388Efb6Ddd0B73Eea578598d733122`, InvestorAllowlist `0xE27c2C0BF2A6C34749257f0FD519c9e531ff4B51`, ReceivableFinance `0x3025FDea4Aa3A96deC46451b7Eec2e83188307B6`.

## Decisions and trust model (state these honestly in the README)
- Whitechain is NOT in the CRE tenant's supported-chains list (`evidence/cre-supported-chains.txt`). It is declared as an `experimental-chains` entry (selector 1874) in `cre/project.yaml`, so CRE reads Whitechain state via RPC in simulation. There is no CRE/DON write: the backend signs `recordVerification`. Never claim a DON-attested write.
- The external verification API is a mock labeled simulated. Do not present it as a real registry.
- CRE failure or API outage must fail safe to MANUAL_REVIEW, never ELIGIBLE.
- Economics: investor pays `financingAmount` to the business directly; the payer repays the full `amount` to the token holder; the difference is the investor's discount. Funds are never held by contracts; no admin withdrawal.
- Duplicate invoice ID or document hash is blocked onchain at submit.
- `workflow.yaml` uses `deployment-registry: "private"` because the tenant has no Sepolia registry; deploy access is not enabled (simulation only, which the track allows).

## Secrets
- `/Users/abby/Eth Mumbai/.env` holds four throwaway testnet keys (deployer, verifier, business, investor). Gitignored, mode 600. Never print, log, commit or paste keys; load with `set -a && . ./.env`. Testnet only, no real funds.
- `cre/.env` is gitignored too.

## Status and next steps
Done: contracts + tests, deploy + explorer verification, CRE workflow simulated against live testnet (ELIGIBLE / REJECTED / MANUAL_REVIEW / not-found), evidence committed.
Pending: backend step that writes verdicts onchain, Next.js web app (business, investor, admin views), USDT funding + repayment on testnet (blocked on sponsor USDT for the investor wallet `0x195194047B45c06c946603ef1CD7cE22abc990D6`; business wallet also needs ~10,000 USDT to repay), README, WHITECHAIN_FEEDBACK.md, architecture docs, demo video.
