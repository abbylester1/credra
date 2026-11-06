# Demo video script

Two cuts from one recording session: a **2:30 submission video** (ETHGlobal accepts 2 to 4 minutes and rejects anything outside that) and a **35-second teaser** for the landing page and social posts.

Rules to respect: never speed up footage (jump-cut waits instead), voice only with no music over text, record at 1080p on a desktop screen recorder, slides with at most four bullets.

## What is real and what is demo

- The live in-app flow uses real testnet amounts (about 20 USDT), because that is all the official test USDT we hold. The explorer links prove it.
- The landing page visuals and the calculator use a 50,000 USDT invoice at a 4% discount and are labelled "Illustrative demo data" or "Demo".
- The terminal segment uses a real onchain invoice registered at 50,000 USDT (`MTX-2026-0417`, Meridian Textiles Ltd). It is only verified, never funded.
- Say these three things aloud in the full cut: the verification source is simulated; Whitechain is not in the CRE supported-chains list, so the workflow reads it over RPC as an experimental chain; the verdict is written by our verifier wallet, not by the Chainlink network.
- Do not say "open source". Closing line is "Code on GitHub".

## Setup (once)

1. Mock registry running: `cd apps/mock-registry && bun server.ts` (port 8787).
2. Production app on port 3100 (no dev badge, no console warnings):
   `cd apps/web && NEXT_DIST_DIR=.next-prod bun run build && NEXT_DIST_DIR=.next-prod bunx next start -p 3100`
   Rebuild after any code change. Sessions are per origin, so sign in on `localhost:3100` ahead of time.
3. Two browser profiles, signed in beforehand so no email code is typed on camera:
   - Business: `abbylester@gmail.com` (wallet `0x2db8…495a`)
   - Investor: `abbylester+investor@gmail.com` (wallet `0x0b0e…9Ca6`, allowlisted, named "Halden Capital Partners")
4. Balances: investor wallet at least 22 USDT and some WBT for gas; business wallet some WBT for gas.
5. Terminal clip invoice (already registered; to register another run `./scripts/prepare-demo-invoice.sh <NUMBER> [AMOUNT] [FINANCING]` after `set -a && . ./.env && set +a`):
   ```
   cd cre && cre workflow simulate invoice-verification -T staging-settings --non-interactive --trigger-index 0 --http-payload '{"invoiceId":"0xdaa4c1a8f27ffcad55eafbeba95090c635f76136406367518e4c7d148f9149c0","invoiceNumber":"MTX-2026-0417"}'
   ```
   Takes about 11 seconds and prints the onchain read, the external lookup and `verdict=ELIGIBLE`. It only reads, so repeat it for as many takes as you need.
6. Explorer tabs open: the registry contract, and one fund and one repay transaction.
7. Fresh invoice for the live flow: use the "Use sample invoice" button on the submit page (new number each time).

## Clips to record (once)

| Clip | Capture | Raw length |
|---|---|---|
| A | Landing hero, then the stats strip | 10s |
| B | The four Approach cards (or one slide, four bullets max) | 12s |
| C | Business: sign in already done, Use sample invoice, Submit, approve the Privy prompt | 25s |
| D | Terminal: the CRE command above, then the fail-safe idea in one sentence | 30s |
| E | App: Eligible verification record with the "Simulated" label visible | 15s |
| F | Investor: Approve USDT, Fund, then the explorer showing the official USDT transfer | 25s |
| G | Repay, then the timeline with names, click one name to reveal the address, open one explorer link | 20s |
| H | End card: logo, "0% platform fee", repo URL | 6s |

## Cut 1: submission video, about 2:30

| Time | Clip | Voiceover |
|---|---|---|
| 0:00–0:15 | A | Businesses wait weeks for buyers to pay their invoices. Credra turns a verified invoice into instant USDT financing, with every step onchain on Whitechain. The numbers on this page are live testnet totals. |
| 0:15–0:30 | B | Four ideas drive the design. Verify before funding. Duplicates are blocked onchain. Money moves wallet to wallet, never through us. And every step leaves an audit trail. |
| 0:30–0:55 | C | A business signs in with just an email, and we create a wallet for it. It submits an invoice with the document, and the document's fingerprint is registered on Whitechain. Testnet amounts are small, so this invoice is scaled down. |
| 0:55–1:25 | D | Now verification. This is a Chainlink CRE workflow, run with the CRE CLI. It reads the invoice from Whitechain, asks an external API for the matching record, compares issuer, buyer, amount, due date and document hash, and returns a verdict. Here is a fifty-thousand USDT invoice: eligible. If anything fails it is rejected, and if the API is down it goes to manual review, never to eligible. |
| 1:25–1:45 | E | Back in the app, the same check is shown field by field. The source is a simulated registry, and it is labelled that way. The verdict is recorded onchain by our verifier wallet, not by the Chainlink network. |
| 1:45–2:10 | F | An approved investor funds the invoice in official Tether USDT. The business is paid directly, and the contract holds nothing. Here is the transaction on the Whitechain explorer. |
| 2:10–2:25 | G | At the due date the payer repays the full amount to whoever holds the receivable token. The timeline names every actor, and every step links to the explorer. |
| 2:25–2:35 | H | Zero platform fees. Built on Whitechain and Chainlink CRE. Code on GitHub. |

Whitechain note to include if time allows: chain 1874, all three contracts source-verified on the explorer, official USDT `0xcedf…55a7`.

## Cut 2: teaser, 35 seconds (about 75 words)

| Time | Clip | Voiceover |
|---|---|---|
| 0:00–0:04 | A | Businesses wait weeks to get paid. Credra fixes that. |
| 0:04–0:10 | C | Submit an invoice, and its fingerprint is registered on Whitechain. |
| 0:10–0:17 | D + E (split view, "Simulated source" tag) | A Chainlink CRE workflow checks it against an external record. Any failure means manual review, never approval. |
| 0:17–0:25 | F | An investor funds it in official USDT, paid straight to the business. The contract never holds funds. |
| 0:25–0:31 | G | Repayment goes to the receivable holder, and every step is onchain with a link. |
| 0:31–0:35 | H | Verified invoices. Instant capital. Zero platform fees. |

## Fallbacks

- If the CRE run fails on camera, play the saved log from `evidence/cre-simulation-whitechain-testnet.md`.
- If the RPC or Privy is slow, record each segment separately and keep a backup take. Cut waits, do not speed footage up.
- Keep the whole thing under 3:40 on the rehearsal, and above 2:00 on the final export.

## Dry run notes (production build, port 3100)

A full rehearsal ran with a 10 USDT invoice (Meridian Textiles Ltd): sign, submit, onchain registration, CRE verification (Eligible), approve, fund, approve, repay. The status ended Repaid and the timeline recorded all four events with names (Meridian Textiles Ltd, Credra Verifier, Halden Capital Partners) and explorer links.

- Console shows "Unable to fetch token price for chain with id 1874" from Privy (no USD price for testnet gas). It is harmless and not visible on screen. Keep devtools closed while recording.
- Sessions are per origin: sign in on `localhost:3100` for both users before recording.
- Keep the sample invoice at its generated 20 and 18 USDT. The generated document image says 20.00, so editing the form amounts would make the document and the form disagree.
- The investor wallet cannot repay 20 USDT after funding 18 (22 USDT balance). Repay as the business user, whose wallet holds enough, or top the investor up first.
- Wait for the Funded event to appear on the timeline before moving on. It is recorded automatically after the transaction confirms (leaving the page too early skips it).

## Cut 3: walkthrough style, about 3:30 (explains the concept, then spends most of the time on the live demo)

Conversational "let me show you" voice, like a short workshop. About 25% concept, 65% demo, 10% close. Stay under 4:00 (ETHGlobal rejects longer uploads). Replace `[name]` with yours.

| Time | On screen | Say |
|---|---|---|
| 0:00–0:15 | You on the landing hero | "Hi, I'm [name], and this is Credra: verified invoice financing in USDT, built on Whitechain with a Chainlink CRE workflow doing the verification." |
| 0:15–0:40 | Landing: the calculator at 50,000 USDT, 4% discount | "Here's the problem. A business ships goods, sends an invoice, and then waits thirty days or more to be paid. With Credra, an investor pays most of that invoice today, and gets the full amount back when the buyer pays. On a fifty-thousand USDT invoice at four percent, the business gets forty-eight thousand now, and the investor earns two thousand. The platform fee is zero." |
| 0:40–1:00 | Landing: the five-step "How it works" stepper | "The hard part is trust: why would an investor fund an invoice they can't check? So nothing opens for funding until a Chainlink CRE workflow verifies it against an external record, and every step is recorded onchain." |
| 1:00–1:25 | App: sign in with email, "Use sample invoice", Submit, approve the Privy prompt | "Let me show you. I sign in with just an email, and the app creates a wallet for me. I submit an invoice with its document. Testnet amounts are small, so this one is scaled down. The document's fingerprint is registered on Whitechain." |
| 1:25–2:05 | Terminal: the `cre workflow simulate` command, then the app's Eligible verification record | "Now the verification. This is the CRE workflow, running with the CRE CLI. It reads the invoice from Whitechain, asks an external API for the matching record, and compares issuer, buyer, amount, due date and document hash. This one is a fifty-thousand USDT invoice, and it comes back eligible. If a field doesn't match, it's rejected. If the API is down, it goes to manual review, never to eligible. In the app you see the same check field by field. The source is a simulated registry, and it's labelled that way. The verdict is recorded by our verifier wallet, not by the Chainlink network." |
| 2:05–2:40 | Investor account: Approve USDT, Fund invoice, then the explorer | "Now I switch to an investor. They approve the official Tether USDT and fund the invoice. The business is paid directly, and the contract never holds the money. Here's that transaction on the Whitechain explorer: the official USDT contract, and the funds going to the business wallet." |
| 2:40–3:10 | Repay, then the timeline, click a name to reveal the address | "At the due date, the payer repays the full amount to whoever holds the receivable token. The timeline names every actor: the business, our verifier, the investor, and each step links to the explorer, so anyone can audit it." |
| 3:10–3:30 | Landing "Proof" section, then the end card | "To be clear about what's real: the contracts and the money movement are real testnet, the verification source is simulated, and the verdict comes from our wallet, not a decentralised network. Next steps are a real data source and a deployed CRE workflow. Zero platform fees, code on GitHub. Thanks for watching." |

Delivery notes:
- Say what you are about to do, then do it ("Let me submit it"), and name each result before moving on. Pause a beat after each transaction confirms.
- Keep terminal text large and read the verdict line aloud.
- Do not speed footage up. Jump-cut the waits.
- Total narration is about 480 words, which is about 3:25 at a calm pace. If a take runs over 3:45, trim the concept section first.
