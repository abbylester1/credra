# Credra Style Reference
> Quiet paper, deep ink, one pine green. Every number shows where it came from.

**Theme:** light. This is the source of truth for the Credra web app (`apps/web`). Defined from scratch for this project on 2026-11-05. Read it before changing any screen. If a rule here is wrong, fix the rule and the tokens together. Governed by the constitution: the design must never hide who signed what or which data is simulated (principle I).

## Character

A calm financial ledger. Credra moves money and makes trust claims, so the interface is plain, exact and legible rather than decorative. Cool sage-tinted paper, near-black green ink, hairline rules, flat surfaces. Monospace for anything a person might need to verify (amounts, hashes, addresses, transaction ids). One accent colour (pine teal) means "verified or interactive". A small, fixed set of status hues tells invoice states apart and is used for nothing else. The signature element is the **provenance strip**: a compact row on every important result that states the source of the data, who recorded it and the transaction link.

## Principles

1. **Show provenance, not just results.** A verdict without its source, signer and tx link is incomplete.
2. **Exact numbers.** Amounts are integers in base units rendered with fixed decimals in monospace. Never rounded, never approximated.
3. **Honest labels.** Simulated data and application-recorded results are visibly marked, in the same place every time.
4. **One next action.** Each screen has one primary action. Blocked actions say why and what would unblock them.
5. **Calm by default.** No gradients, glow, parallax or animated backgrounds. Motion only confirms a state change.

## Surfaces

| Level | Name | Token | Value | Use |
|---|---|---|---|---|
| 1 | Canvas | `canvas` | `#F3F5F2` | Page background on every screen |
| 2 | Card | `card` | `#FFFFFF` | Panels, tables, forms, dialogs |
| 3 | Inset | `inset` | `#EAEEEA` | Quiet wells inside cards (code, hashes, empty states) |
| - | Hairline | `hair` | `#DCE2DD` | 1px rules and card borders |
| - | Field | `field` | `#74807A` | Input and control borders (3.75:1 on canvas) |

White is the card layer on top of the canvas. Separate with hairlines before reaching for a shadow. Page background is never pure white.

## Colour

| Role | Token | Value | Contrast on canvas / card |
|---|---|---|---|
| Ink | `ink` | `#0F1A16` | 16.2 / 17.8 |
| Body text | `ink-2` | `#44544B` | 7.3 / 8.0 |
| Support text | `ink-3` | `#5C6B63` | 5.1 / 5.6 |
| Accent (links, verified marks, focus) | `accent` | `#0A6C63` | 5.7 / 6.3 |
| Accent soft | `accent-soft` | `#E3F1EE` | surface only |
| Primary button fill | `pine` | `#0D3B35` | white text 12.4 |

### Status hues (invoice states only)

Each hue has a soft tint for chip backgrounds. Text on its own soft tint is at least 4.5:1.

| State | Chip label | Token | Text | Soft tint |
|---|---|---|---|---|
| Submitted | Submitted | `s-neutral` | `#5C6B63` | `#EAEEEA` |
| Under review | Under review | `s-review` | `#8F5200` | `#FBEFD9` |
| Eligible | Eligible | `accent` | `#0A6C63` | `#E3F1EE` |
| Rejected | Rejected | `s-reject` | `#B03A2E` | `#FBE6E3` |
| Funded | Funded | `s-funded` | `#2F4FBF` | `#E6EBFA` |
| Repaid | Repaid | `s-repaid` | `#2B7A3E` | `#E2F2E6` |
| Defaulted | Defaulted | `s-default` | `#7A1F2B` | `#F3E1E4` |

Status hues never appear on links, buttons or decoration. Accent is the only colour for interactive text. Simulated data uses amber (`s-review`) with a dashed outline so it is never mistaken for a status.

## Typography

- **Geist Sans** for interface text and **Geist Mono** for data, both self-hosted through the `geist` package (no network fetch at build or run time). No other families.
- Monospace is mandatory for: amounts, addresses, transaction hashes, invoice ids, document hashes, block numbers, small uppercase labels.
- Amounts use tabular figures and right alignment in tables.

| Role | Size | Weight | Line height | Tracking |
|---|---|---|---|---|
| Page title | 30px | 600 | 1.15 | -0.02em |
| Section heading | 20px | 600 | 1.25 | -0.01em |
| Card title | 16px | 600 | 1.3 | 0 |
| Body | 15px | 400 | 1.55 | 0 |
| Dense UI (tables, chips) | 13px | 400/500 | 1.4 | 0 |
| Label (mono, uppercase) | 11px | 500 | 1.4 | +0.06em |
| Figure (key amount) | 28px mono | 500 | 1.1 | -0.01em |

- Sentence case everywhere. Avoid em dashes in copy; use a comma or a full stop.
- Line length capped at about 68 characters for prose.

## Shape, spacing, depth

- **Radius scale (the only one):** 6px controls and chips, 10px cards and panels, 14px dialogs and large windows, 50% for dots only. No pills.
- **Spacing:** 4px base. Card padding 20px (dense) or 24px. Page gutter 24px (16px on narrow screens). Content max width 1120px; reading width 720px for forms.
- **Depth:** 1px `hair` border. At most a very light shadow (`0 1px 2px rgba(15,26,22,0.05)`) on raised panels such as menus and dialogs. No coloured shadows.
- **Focus:** 2px `accent` ring with 2px offset on every interactive element, drawn inset when the element touches a clipped edge.

## Components

**Buttons.** Primary: `pine` fill, white text, 6px, weight 500, 40px tall (36px dense). Secondary: card fill, `field` border, ink text. Text button: `accent`, underline on hover. Danger: card fill, `s-reject` text and border. One primary per group. A disabled button always shows the reason beneath or beside it.

**Status chip.** 6px radius, soft tint background, status text colour, 12px weight 500, with a 6px square mark to the left (not a circle). Label text only, never colour alone.

**Provenance strip.** A single row under any verdict, balance change or status change, mono 12px on `inset`: `Source: simulated ERP record · Recorded by: application verifier wallet · tx 0x12ab…98ef ↗`. Each segment is optional only when it truly does not apply. The tx segment is always a link to the explorer. This is the primary carrier of principles I and III.

**Evidence panel (verification record).** A card titled "Verification record". Rows list each check: result mark, check name, one plain sentence. Marks: pass `✓` in accent, fail `✕` in `s-reject`, needs attention `!` in `s-review`, all with the word beside them. Failed checks come first. Footer holds the provenance strip. Failed-check codes are translated to plain language (for example "Amount in the registry differs from the invoice").

**Simulated tag.** Amber dashed 6px outline, 11px mono uppercase "Simulated data". Placed next to the data it qualifies and inside the provenance strip. Never hidden behind hover.

**Amount.** Mono, tabular, `1,250.00` with the unit `USDT` in `ink-3` at 80% size. Key amounts use the 28px figure style. Negative or shortfall amounts use `s-reject`.

**Hash, address, tx.** Mono, middle-ellipsis (`0x3025…07B6`), copy button on hover and focus, trailing arrow glyph when it opens the explorer. Full value available in the accessible name and a title.

**Step rail (approve, then fund).** Vertical numbered steps in a card. Each step shows idle, waiting for wallet, pending on chain, confirmed (with tx link) or failed (with plain reason and retry). The next step stays disabled until the previous one is confirmed.

**Network banner.** When the wallet is on the wrong chain: a full-width amber strip under the header with one button, "Switch to Whitechain Sepolia". All action buttons are disabled with the reason "Wrong network".

**Wallet button.** Shows role label (Business, Investor, Operator) in mono, shortened address, and a menu to disconnect. Not connected: a primary "Connect wallet".

**Timeline.** Vertical hairline with 8px square nodes in the status hue. Each entry: status chip, timestamp (mono), actor ("Business wallet", "Verifier wallet", "Operator"), tx link.

**Forms.** Labels above fields, 6px radius, `field` border, helper text in `ink-3`, inline error in `s-reject` with an icon and text, never colour alone. File drop shows name, size and the computed document hash before submit.

**Tables.** Hairline row dividers, no zebra, sticky header, amounts right-aligned in mono, status chip last column, whole row link.

**Empty and error states.** An `inset` well with one sentence and one action. Errors say what happened, whether funds moved, and what to do next ("Nothing was changed.").

**Operator console.** Same system, denser (13px, 36px controls). Demo controls sit in a clearly boxed "Demo tools" card with a simulated tag, separated from real operator actions.

## Motion

Only to confirm a state change: a 120ms fade on status chip updates, a 160ms expand on disclosures, a step rail node filling on confirmation. Easing `ease-out`. All of it disabled under `prefers-reduced-motion`. No page transitions, no skeleton shimmer beyond a static placeholder, no counting animations.

## Iconography and imagery

Thin monoline icons (1.5px stroke) at 16 and 20px, used only to support a label. No illustrations, stock imagery, gradients or 3D. The Credra wordmark is text in Geist Sans 600 with a small pine square mark; a logo file can replace it later. Data visualisation, if any, uses accent and `ink-3` only.

## Page patterns

- **Header:** wordmark left, role-aware nav, wallet button right, network banner below when needed.
- **Business:** "My invoices" table, "New invoice" primary action; invoice page with a key-figure row (amount, financing, due date), status chip, verification record, timeline.
- **Investor:** marketplace table of Eligible invoices with implied return as a key figure; detail page ends with the step rail.
- **Operator:** two columns on wide screens: review queue and allowlist, then a boxed "Demo tools" card.
- **About / trust model page:** plain prose at reading width stating who signs what, what is simulated and what the system cannot guarantee.

## Voice and copy

Plain, specific, active. Say what happened and what it means. Use "wallet" and "invoice", not jargon. Examples: "Verification could not complete, so this invoice is under review." "This wallet is not approved to fund." Never overstate: do not say "verified by Chainlink"; say "recorded by the application's verifier wallet after the workflow ran". Label every simulated element.

## Do

- Put the provenance strip under every verdict and status change.
- Keep one primary button per group and explain every disabled state.
- Use monospace for anything a person might copy or compare.
- Keep status hues for status only; use accent for interaction.
- State transaction outcomes, including failures, with a link and plain words.

## Do not

- No gradients, glows, shadows beyond the light raised-panel shadow, or animated backgrounds.
- No dark or saturated page sections; no pure white page background.
- No new font families, no inline hex colours: add or reuse a token.
- No pills; no radii outside 6 / 10 / 14.
- No colour-only meaning; every state has a text label.
- No claim that implies a DON-signed write or a real external registry.

## Accessibility

Body text 7.3:1, support text 5.1:1, accent text 5.7:1 on the canvas; every status text colour is at least 4.5:1 on its own soft tint and on card. Control borders at least 3:1. 2px accent focus ring everywhere. Fully keyboard operable; dialogs trap focus and close on Escape. Status, errors and transaction progress are announced through live regions. Target size at least 36px. Respect `prefers-reduced-motion` and `prefers-color-scheme` is not used (light only).

## Implementation notes

- Tokens live once, in `apps/web/src/app/globals.css` under Tailwind v4 `@theme` (`--color-canvas`, `--color-card`, `--color-inset`, `--color-hair`, `--color-field`, `--color-ink`, `--color-ink-2`, `--color-ink-3`, `--color-accent`, `--color-accent-soft`, `--color-pine`, `--color-s-*` with `-soft` variants, radii `--radius-ctl` 6px, `--radius-card` 10px, `--radius-win` 14px).
- Fonts: install the `geist` package and apply `GeistSans` and `GeistMono` in `layout.tsx`; remove the scaffold's Google font imports.
- Shared components named in `tasks.md` (T021 and T022) implement: `StatusChip`, `ProvenanceStrip`, `SimulatedTag`, `Amount`, `HashLink`, `TxLink`, `StepRail`, `NetworkBanner`, `WalletButton`, `Timeline`, `EvidencePanel`.
- A component or colour not defined here must be added to this file first.
