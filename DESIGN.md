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
5. **Calm by default.** No gradients, glow or parallax. In the app, motion only confirms a state change. The marketing landing page (`/`) may use purposeful motion: scroll reveals, sequenced illustrations, count-ups and a marquee ticker. All of it must stop under `prefers-reduced-motion`, and illustrations using demo values must say so.

## Design direction (v1.1, 2026-11-06)

Two qualities guide every screen. **Feel:** calm and premium, with generous whitespace, few competing elements and numbers that are easy to scan. **Structure:** workflow-led navigation, operational tables, contextual actions that change with the invoice state, and flat bordered surfaces. Credra keeps its own pine palette, Geist type and 8px-radius controls; no pill buttons.

Rule of thumb: calm to look at, precise to operate, and clear about trust. Blockchain detail is shown when a user needs evidence (provenance strip, transaction links), not everywhere; the main surfaces speak in invoices, verification and funding.

Full screen-by-screen behaviour lives in `specs/001-credra-web-app/ui-spec.md`.

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
| Primary button hover | `pine-hover` | `#092E29` | white text 14.6 |

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

- **Radius scale (the only one):** 6px chips and tags, 8px controls (buttons, inputs, menus), 12px cards and panels, 16px dialogs and large windows, 50% for dots only. No pills.
- **Spacing:** 8px grid (4px for tight internal gaps). Card padding 20px (dense) or 24px. Page gutter 32px on wide screens, 16px on narrow. Content max width 1120px; reading width 720px for forms.
- **Depth:** 1px `hair` border. At most a very light shadow (`0 1px 2px rgba(15,26,22,0.05)`) on raised panels such as menus and dialogs. No coloured shadows.
- **Focus:** 2px `accent` ring with 2px offset on every interactive element, drawn inset when the element touches a clipped edge.

## Components

**Buttons.** Primary: `pine` fill, white text, 8px, weight 500, 44px tall. Secondary: card fill, `field` border, ink text, 40px tall. Dense (tables, operator console): 32px. Text button: `accent`, underline on hover. Danger: card fill, `s-reject` text and border. One primary per group. A disabled button always shows the reason beneath or beside it.

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

- **Shell:** a compact left sidebar (232px, icons-only at 64px under 1024px) with role-aware navigation; the connected network and wallet sit at the bottom of the sidebar; a slim top bar holds the page title and the one primary action. The network banner appears under the top bar when needed. Details in `ui-spec.md`.
- **Stages are separate screens:** discovery, verification, financing decision, funding and repayment each get their own screen or panel; no screen shows every action at once.
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
- No dark or saturated page sections, with one exception: the closing call-to-action band on the marketing page may use `pine` (see Marketing site). No pure white page background.
- No new font families, no inline hex colours: add or reuse a token.
- No pills; no radii outside 6 / 8 / 12 / 16.
- No colour-only meaning; every state has a text label.
- No claim that implies a DON-signed write or a real external registry.

## Accessibility

Body text 7.3:1, support text 5.1:1, accent text 5.7:1 on the canvas; every status text colour is at least 4.5:1 on its own soft tint and on card. Control borders at least 3:1. 2px accent focus ring everywhere. Fully keyboard operable; dialogs trap focus and close on Escape. Status, errors and transaction progress are announced through live regions. Target size at least 36px. Respect `prefers-reduced-motion` and `prefers-color-scheme` is not used (light only).

## Marketing site (landing page)

Applies to the public page at `/`. The application under `/app/*` keeps the product rules above. Same tokens, palette, fonts and voice; only scale and layout differ. Screen content lives in `specs/001-credra-web-app/landing-brief.md`.

**Positioning rules (design-level).** Lead with the financial outcome, not the technology. Blockchain is described as infrastructure. Never promise guaranteed returns, guaranteed financing or instant funding; never imply every invoice qualifies; never equate verification with legal enforceability or creditworthiness. Proof comes from the product itself: no invented customer numbers, logos, testimonials or live activity. Anything shown as verified, confirmed or repaid must reflect a real recorded result; otherwise it carries the "Illustrative demo data" tag. Say "recorded onchain by the verifier wallet", never "attestation".

**Marketing type scale** (Geist Sans, Geist Mono for figures and hashes):

| Element | Desktop | Mobile | Line height | Tracking |
|---|---|---|---|---|
| Hero H1 | 64px / 600 | 40px | 1.05 to 1.12 | -0.03em |
| Section H2 | 44px / 600 | 32px | 1.1 to 1.2 | -0.02em |
| Card heading | 22px / 600 | 20px | 1.25 | -0.01em |
| Body large | 18px / 400 | 16px | 1.55 | 0 |
| Body | 16px / 400 | 15 to 16px | 1.5 to 1.65 | 0 |
| Supporting, nav, buttons | 14px | 14px | 1.4 | 0 |
| Eyebrow | 11 to 12px mono uppercase | same | 1.4 | +0.06em |

Keep paragraphs to about 50 to 70 characters per line. Body copy is never bold.

**Layout and spacing.** 8px grid. Container 1200px; mobile padding 20px. Section spacing: 112px (wide), 88px (standard), 72px (tablet), 64px (mobile). Card padding 24px, card gap 24px. Section pattern: eyebrow, heading, one supporting paragraph, then content. Sections sit on the canvas; cards are white with a hairline.

**Marketing components.**
- *Navigation:* 72px tall, canvas background with no border at the top of the page, hairline border once scrolled; logo left, centred anchor links, one filled action ("Launch app", 44px). Mobile: logo, menu button, "Launch app" stays visible.
- *Primary CTA:* 48px, 8px radius, `pine` fill, white 14px / 600 text, 18px horizontal padding, hover `pine-hover` in 150ms, visible focus ring. *Secondary CTA:* 44px, transparent or card fill, 1px `field` border, ink text.
- *Cards:* white, 1px hairline, 12px radius, no shadow, icon at 20px in a thin outline, hover changes only the border colour.
- *Inputs:* 44 to 48px, 8px radius, label above, inline validation text.
- *Product composition (hero):* three connected panels (Invoice, Financing, Verification) built from the real application components, joined by 1px hairline connectors. Never a screenshot of invented activity.
- *Process timeline:* five numbered steps, horizontal on desktop, vertical on mobile; each step has a number, a thin icon, a heading and one short sentence.
- *Product showcase:* alternating text and product visual rows; avoid repeating the same card layout three times.
- *Closing band (the one dark section):* full-width `pine` background, white text, content max width 760px, 16px radius container, 48px primary CTA (white fill with pine text on this band, since pine on pine would vanish) and a secondary text link.
- *Footer:* canvas, hairline top rule, brand line, link groups that point only to real destinations, and the risk and demo disclaimer in 13px `ink-2`.

**Responsive.** Desktop 1200px and up: 12-column grid, two-column hero, four-column feature row, horizontal timeline. Tablet 768 to 1199px: 8 columns, hero H1 48px, two-column feature row, compact menu from about 900px. Mobile below 768px: single column, H1 40px, stacked CTAs, vertical timeline, product panels stacked, no horizontal overflow, 44px minimum touch targets. Verify at 375, 390, 430, 768, 1024, 1280 and 1440px.

**Motion.** CSS transitions only: 150ms for navigation background, borders and buttons; the hero panels may fade up once on load; process steps reveal once as they enter view. No looping animation, no scaling, no parallax. All of it off under `prefers-reduced-motion`.

**Quality bar.** Semantic HTML with one H1 and a logical H2 order; descriptive image alt text; WCAG AA contrast; keyboard-operable menus; `font-display: swap`, preload only the fonts in use; lazy-load below-the-fold imagery; no autoplay video. Performance and accessibility figures are targets to measure, never claims to publish. Every visible call to action must resolve to a working destination; unbuilt destinations are hidden, not dead.

## Implementation notes

- Tokens live once, in `apps/web/src/app/globals.css` under Tailwind v4 `@theme` (`--color-canvas`, `--color-card`, `--color-inset`, `--color-hair`, `--color-field`, `--color-ink`, `--color-ink-2`, `--color-ink-3`, `--color-accent`, `--color-accent-soft`, `--color-pine`, `--color-pine-hover`, `--color-s-*` with `-soft` variants, radii `--radius-chip` 6px, `--radius-ctl` 8px, `--radius-card` 12px, `--radius-win` 16px).
- Fonts: install the `geist` package and apply `GeistSans` and `GeistMono` in `layout.tsx`; remove the scaffold's Google font imports.
- Shared components named in `tasks.md` (T021 and T022) implement: `StatusChip`, `ProvenanceStrip`, `SimulatedTag`, `Amount`, `HashLink`, `TxLink`, `StepRail`, `NetworkBanner`, `WalletButton`, `Timeline`, `EvidencePanel`.
- A component or colour not defined here must be added to this file first.
