# UI Specification: Credra Web App

**Feature**: 001-credra-web-app | **Status**: Draft for approval | **Date**: 2026-11-06
**Design system**: [DESIGN.md](../../DESIGN.md) v1.1 (tokens, components, voice). This document defines screens and behaviour; it does not redefine tokens.
**Direction**: Mercury's calm, Ramp's operational precision, Credra's trust layer. Patterns are borrowed from product references (including the supplied invoices screenshot), never colours, fonts or button styles. Wireframe figures below are illustrative only; the app shows live data and never invented numbers.

## 0. Spec deltas (need approval; constitution scope rule)

This UI spec adds structure beyond the original `spec.md` (which listed about 7 screens). Proposed additions, smallest first:

| # | Delta | Why | Cost |
|---|---|---|---|
| D1 | Left sidebar shell with role-aware navigation | Workflow-led structure | Low |
| D2 | Overview page per role (metrics + recent invoices) | Calm entry point | Low (reads existing data) |
| D3 | Invoice list as a pipeline: stage tabs with counts, summary row, filters, pagination | Matches the screenshot pattern; replaces three separate list pages | Medium |
| D4 | Transactions page: on-chain activity list with filters and expandable details | Evidence trail (FR-017, FR-020) in one place | Medium (reads `status_events`) |
| D5 | Verification page: list of verification runs with the CRE report | Chainlink-track evidence visible in the product | Low (reads `verification_runs`) |
| D6 | Cashflow summary that updates with Transactions filters | Mercury-style linked chart and table | High, stretch, cut first |

D1 to D5 are recommended. D6 is optional. If approved, `spec.md` gains a short "Navigation and workspace" story (P2) and `tasks.md` gains matching tasks; nothing in contracts, CRE or data model changes.

## 1. Principles for these screens

1. One purpose per screen: discover, verify, decide, fund, track. Never show every action at once.
2. The invoice list is the home of the product; everything else is reached from a row.
3. Exceptions are visible at a glance (left-edge marker, chip, due-date text), the rest stays quiet.
4. Evidence on demand: blockchain detail lives in the provenance strip, the Transactions page and the invoice timeline, not in the main list.
5. Every empty, loading, error, pending and blocked state is designed.

## 2. App shell

```text
+-----------+--------------------------------------------------------------+
| credra    |  Page title            [secondary]            [Primary action]|
|           |  Network banner (only when wrong network)                      |
| Overview  +--------------------------------------------------------------+
| Invoices 7|  content, max width 1120, gutter 32                           |
| ...       |                                                               |
|-----------|                                                               |
| network   |                                                               |
| wallet    |                                                               |
+-----------+--------------------------------------------------------------+
```

- **Sidebar**: 232px, canvas background, 1px `hair` right border. Under 1024px collapses to a 64px icon rail with tooltips; under 640px becomes a top menu button. Top: wordmark. Middle: grouped navigation with small group labels (mono 11px). Bottom: network indicator ("Whitechain Sepolia", green dot only when connected and correct) and the wallet card (role label, short address, menu).
- **Nav items**: 36px tall, 8px radius, icon 16px + label 14px. Selected: `card` fill with hairline and `ink` text; hover: `inset`. Count badges (mono 12px, `ink-3`) show actionable counts only, never decorative totals.
- **Top bar**: page title (32px / 600), optional one-line description (`ink-3`), right side: one primary action and at most one secondary. Sticky only on desktop.
- **Network banner**: amber strip under the top bar when the wallet is on the wrong chain.

### Navigation by role

| Group | Business | Investor | Operator |
|---|---|---|---|
| Workspace | Overview, Invoices (count: needs attention) | Overview, Invoices (count: Eligible to fund), Positions | Overview, Review queue (count: under review) |
| Activity | Transactions | Transactions | Transactions, Verification |
| Admin | n/a | n/a | Investors (allowlist), Demo tools |
| Info | About the trust model | About the trust model | About the trust model |

Role comes from the connected wallet (allowlisted wallet = investor; operator session = operator; otherwise business). Operator is a separate passcode session and replaces the wallet role in the sidebar when active.

## 3. Page specifications

### 3.1 Not connected (landing)

Centered column (reading width 720): wordmark, headline "Finance an invoice you are owed" (business) as the single message, one sentence on what Credra does, primary "Connect wallet", secondary "How it works" (about page). Below: three small plain steps (Submit, Verify, Fund) in a hairline card. No marketing imagery. The network and role are shown after connecting.

### 3.2 Overview (per role)

Page title "Overview", description "Your financing activity at a glance." Four metric cards in a row (Mercury style: label 13px `ink-3`, figure 32px mono, unit small, generous padding 24px), then a "Recent invoices" card (5 rows, "View all" text link), then on wide screens a "Needs attention" list.

| Role | Metrics (all live) |
|---|---|
| Business | Total invoices; Awaiting verification; Financing received (USDT); Outstanding to repay (USDT) |
| Investor | Funded positions; Capital deployed (USDT); Expected repayment (USDT); Repaid to date (USDT) |
| Operator | In review; Approved investors; Verifications run; Rejected |

"Needs attention" examples: business: "INV-1001 is eligible. Share it with investors." / "INV-2002 was rejected. See why."; investor: "2 invoices are open for funding."; operator: "1 invoice is waiting for review." Empty state: "No activity yet." plus the one action that starts it.

### 3.3 Invoices (pipeline list)  [pattern from supplied screenshot]

```text
Invoices                                                [Submit invoice]
[All 24] [Submitted 3] > [Under review 2] > [Eligible 5] > [Funded 4] > [Repaid 2]
Total invoiced      Rejected              Overdue
98,115.42 USDT      2 invoices            1 invoice
                    View invoices ->      View invoices ->
[All | Mine] [Due date v] [Status v] [All filters] [Search....]   [Columns]
Due date: next 30 days  (x)
[ ] Invoice            Amount        Financing    Due date        Status
|   Demo Exports Ltd   10,000.00     9,000.00     5 Dec 2026      [Eligible]
|   INV-1001 (mono)                               in 29 days
| ! Acme Trading       6,500.00      5,800.00     12 Nov 2026     [Under review]
|   INV-3003                                      in 6 days
1-50 of 218     [50 per page v]                          1 of 5  [<][>]
```

- **Stage tab bar**: tabs follow the lifecycle (Submitted > Under review > Eligible > Funded > Repaid) with small chevrons between and mono counts. "All" first. Rejected and Defaulted are reachable through the status filter and the summary row so the pipeline stays linear. Selected tab: card fill + hairline. The counts update with filters.
- **Summary row** (above the table, no card border): three or four inline stats with a "View invoices" text link that applies the matching filter. Business: Total invoiced, Rejected, Overdue. Investor: Available to fund, Funded, Expected repayment. Operator: In review, Rejected, Overdue.
- **Filter bar**: segmented "All / Mine" (business, investor: "My positions"), Due date, Status, "All filters" panel (amount range, issuer, verification verdict), search (invoice number, issuer, tx hash), "Columns" (show or hide columns, saved in local storage). Applied filters appear as removable chips beneath.
- **Table**: sticky header, 52px rows (44px dense), hairline dividers, no zebra, whole row is a link, checkbox column only where bulk actions exist (operator). Column set: Invoice (document icon, issuer name 14px/500, invoice id mono 12px `ink-3`), Amount, Financing, Return, Due date (date plus relative text: "in 6 days", "2 days overdue" in `s-reject`), Verification (verdict chip), Status chip, row action (for example "Fund" for investors on Eligible rows). Amounts right-aligned, mono, tabular. Header sorts on Amount, Due date and Created.
- **Exception marker**: a 3px left edge on the row: amber for under review or due within 3 days, red for rejected, overdue or defaulted. Always accompanied by text in the status or due-date cell (never colour alone).
- **Footer**: range text ("1-50 of 218"), rows per page, page controls.
- **Role variants**: business sees own invoices and the "Submit invoice" primary; investor sees the marketplace (Eligible by default) with Fund as row action and no submit button; operator sees all, with status filter defaulting to Under review.
- **States**: loading = static skeleton rows (no shimmer); empty = `inset` well "No invoices yet. Submit your first invoice." with the primary action; error = "We could not load invoices. Nothing was changed." with Retry.

### 3.4 Submit invoice (business)

Reading-width form in a card, titled "Submit invoice". Sections: Invoice (number, issue date, due date, currency display only), Parties (issuer name, buyer name), Amounts (invoice amount, requested financing with the live "Investor return" helper and an 80 to 95 percent suggestion chip), Document (drop zone). The drop zone shows file name, size and the computed keccak256 hash before submit. A right-hand "What happens next" rail (desktop) shows the 3 steps: Register on Whitechain, Verify, Review result. Primary "Submit invoice" is disabled with a reason until valid; on submit show the step rail (Register, then Verify) with tx links. Errors use plain messages from `errors.ts` and always state whether anything changed.

### 3.5 Invoice detail (core screen)  [Ramp-style structure]

Two columns on desktop (main 2/3, actions 1/3), single column on mobile.

```text
< Invoices
Demo Exports Ltd  INV-1001   [Eligible]                   [Primary action]
Due 5 Dec 2026, in 29 days

Invoice amount   Financing   Investor return   Due date          (key figures)
-----------------------------------------------------------------------------
Main column                              | Actions column
 1 Financial terms (key-value list)      |  Next step card (state specific)
 2 Verification record (evidence panel)  |  Parties card (issuer, buyer ref, holder)
 3 Timeline (status events + tx links)   |  Documents card (issuer and operator only)
```

- **Header**: back link, issuer name, mono invoice id, status chip, one primary action determined by role and state (table below), due date with relative text.
- **Key figures**: 4 figures, 28px mono, hairline separators.
- **Financial terms**: two-column key-value list: invoice amount, financing amount, investor return and percentage, advance rate, currency, issue date, due date, grace period (3 days), receivable holder.
- **Verification record**: evidence panel per DESIGN.md: failed checks first, plain sentences, provenance strip at the bottom with the simulated tag, "Recorded by: application verifier wallet" and the tx link. A collapsed "Technical details" row reveals the report hash, CRE verdict JSON and external reference.
- **Timeline**: vertical hairline with square nodes: Submitted, Verification recorded, Operator decision, Funded, Repaid or Defaulted; each with actor, mono timestamp and tx link.
- **Actions column** shows exactly one "Next step" card matching the state:

| State | Business sees | Investor sees | Operator sees |
|---|---|---|---|
| Submitted | "Verification is running." (or Verify retry) | not listed | Verify now |
| Under review | "Waiting for review. Reason: ..." | not listed | Approve / Reject with reason |
| Eligible | "Open for funding." | Step rail: Approve USDT, Fund | none |
| Rejected | Failed checks and "Submit a corrected invoice" | not listed | none |
| Funded | "Repay by due date" step rail (Approve, Repay) | Position summary, expected repayment | none |
| Repaid | Completed summary | Completed summary and repayment tx | none |
| Defaulted | Marked defaulted notice | Position marked defaulted | none |

Blocked actions (not allowlisted, wrong network, shortfall) never hide the card: they show the reason and the fix. Example: "This wallet is not approved to fund. Ask the operator to approve it." / "You need 9,000.00 USDT. Your balance is 0.00."

### 3.5.1 Fund and repay step rail

Vertical rail in the Next step card: 1 Approve USDT, 2 Fund (or Repay). Each step: idle, waiting for wallet, pending on chain (with tx link and elapsed time), confirmed, failed (reason, "Nothing was changed", Retry). Step 2 stays disabled until step 1 is confirmed. After confirmation the card morphs into the completed summary with the provenance strip. Amount to pay is the one 28px figure in the card.

### 3.6 Positions (investor)

Same pipeline pattern as 3.3 but scoped to the investor's funded invoices: stage tabs Funded, Repaid, Defaulted; columns Invoice, Funded amount, Expected repayment, Return, Due date, Status, Holder; summary row: Capital deployed, Expected repayment, Repaid to date.

### 3.7 Transactions (all roles; own activity)  [Mercury-style activity table]

Table of on-chain events scoped to the signed-in role (business: own invoices; investor: own positions; operator: all). Columns: Time (mono), Event (Submitted, Verification recorded, Funded, Repaid, Default marked, Allowlist changed), Invoice, Counterparty or actor, Amount (USDT where applicable), Status (confirmed, pending, failed), Tx (short hash with explorer arrow). Row expands inline to show full hash, block number, gas used, signer role and raw event fields. Filters: Event type, Date range, Status, Search (hash or invoice). "Export CSV" is a secondary action. Empty state: "No transactions yet. They appear here as invoices move through verification and funding."
Optional D6 (stretch): a slim cashflow bar above the table (USDT in and out by week) that re-computes with the active filters; never block the table on it.

### 3.8 Verification (operator)

A table of verification runs: Time, Invoice, Verdict chip (Eligible, Rejected, Needs review, Error), Failed checks (chips), External reference, Source (always "Simulated ERP record" in this build), Recorded tx. Row expand shows the full CRE report JSON and the CLI log excerpt. A banner at the top states: "Results are produced by the CRE workflow in simulation and recorded by the application's verifier wallet." This page doubles as Chainlink-track evidence.

### 3.9 Operator: Review queue, Investors, Demo tools

- **Review queue**: pipeline list filtered to Under review, bulk-less; opening a row shows the evidence panel with Approve and Reject (reason required, minimum 10 characters) in the Next step card.
- **Investors**: table of approved wallets (address, added date, added by) with "Add investor" (address field with checksum validation) and Remove with confirmation dialog ("Removing blocks new funding and incoming transfers. Existing positions are not affected.").
- **Demo tools**: boxed card with the Simulated tag: choose invoice number and scenario (Match, Amount mismatch, Disputed, Absent), "Write simulated ERP record". Clearly separated from real operator actions, never visible to business or investor roles.

### 3.10 About the trust model

Reading-width prose with a three-row table: Who signs what (business, investor, verifier wallet, operator), what is simulated (the ERP record), what the system cannot guarantee (document authenticity, buyer payment). Linked from the sidebar and from every provenance strip.

## 4. Wallet and network states

| State | Where | Behaviour |
|---|---|---|
| Not installed | Landing and wallet card | "No wallet found. Install a browser wallet to continue." with link; app stays read-only |
| Not connected | Sidebar bottom, landing | Primary "Connect wallet"; protected pages redirect to landing |
| Connecting | Wallet card | Button spinner, text "Waiting for your wallet" |
| Wrong network | Banner + disabled actions | Amber banner "Wrong network" with "Switch to Whitechain Sepolia" (adds the chain if unknown) |
| Connected | Wallet card | Role label, short address, copy, disconnect; network dot green |
| No role data yet | Wallet card | Role label shows "Checking..." (max 2 s) then resolves |
| Low gas (WBT) | Next step card | "You need WBT for gas." with a link to the test faucet |
| Insufficient USDT | Next step card | Shortfall in `s-reject`: "You need 9,000.00 USDT. Your balance is 0.00." |
| Awaiting signature | Step rail | "Confirm in your wallet" with cancel hint |
| Pending on chain | Step rail | Tx link, elapsed time, "You can leave this page" |
| Failed or rejected | Step rail | Plain reason, "Nothing was changed", Retry |
| Disconnected mid-flow | Anywhere | Non-blocking notice; in-flight tx remains visible on Transactions |

## 5. Layout, spacing and type (from DESIGN.md v1.1)

- 8px grid; page gutter 32px (16px narrow); content max width 1120; form reading width 720; card padding 24px (20px dense); card radius 12; control radius 8; dialog radius 16; chips 6.
- Buttons: primary 44px (pine), secondary 40px, dense 32px; one primary per view.
- Type: page title 32/600, section 20/600, card title 16/600, body 14 to 15, labels mono 11 uppercase, key figures 28 to 32 mono 500. Geist Sans and Geist Mono only.
- Motion: 120 to 160ms ease-out for state confirmations only; all disabled under `prefers-reduced-motion`.
- Responsive: three breakpoints, 1024 (sidebar collapses to icons), 768 (two-column detail becomes one), 640 (table becomes stacked cards with the same key fields).

## 6. Accessibility and quality bar

Keyboard operable end to end; visible 2px accent focus ring; tables use real table semantics with sortable headers announcing sort state; step rail and transaction status use live regions; every colour meaning has a text label; touch targets at least 36px; contrast figures in DESIGN.md. Copy rules: sentence case, no em dashes, no "successfully", say what changed and whether funds moved.

## 7. Component inventory (to implement)

Shell: `AppShell`, `Sidebar`, `NavItem`, `TopBar`, `NetworkBanner`, `WalletCard`. Data: `StageTabs`, `SummaryRow`, `FilterBar`, `FilterChip`, `DataTable` (sort, select, expand, pagination, column picker), `StatusChip`, `VerdictChip`, `Amount`, `HashLink`, `TxLink`. Detail: `KeyFigures`, `TermsList`, `EvidencePanel`, `ProvenanceStrip`, `SimulatedTag`, `Timeline`, `NextStepCard`, `StepRail`. Forms: `Field`, `FileDrop`, `ConfirmDialog`. Feedback: `EmptyState`, `ErrorState`, `SkeletonRows`, `InlineNotice`.

## 8. Build order for the UI (after approval)

1. Tokens, fonts, `AppShell`, `WalletCard`, `NetworkBanner`, `StatusChip`, `Amount`, `HashLink`.
2. `DataTable`, `StageTabs`, `FilterBar`; Invoices page (business variant) against live data.
3. Submit invoice form and step rail; invoice detail with evidence panel and timeline.
4. Operator pages and Demo tools; Verification page.
5. Investor variants, fund and repay rails, Positions; Transactions page; Overview.
6. Polish, empty and error states, responsive pass, accessibility pass.
