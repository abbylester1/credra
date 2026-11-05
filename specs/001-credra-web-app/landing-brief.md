# Landing Page Brief (reconciled): Credra

**Feature**: 001-credra-web-app, User Story 6 (P3) | **Status**: Draft for approval | **Date**: 2026-11-06
**Source**: the full founder brief ("Final Landing Page Strategy and Implementation Brief"), condensed here with conflicts against the repository resolved. If this file and the original brief differ, this file wins because it is checked against the constitution, `DESIGN.md` and what is actually built.

## 1. Positioning (kept as written)

- Name: **Credra**. Tagline: Trust-backed financing infrastructure.
- H1: **Turn verified invoices into working capital.**
- Subline: Trust-backed financing infrastructure connecting verified business receivables with on-chain capital. Three chips: Invoice verification, Transparent financing, On-chain settlement.
- Audiences: businesses (financing against verified receivables) and investors (transparent invoice-backed opportunities), with distinct CTAs.
- Lead with financial outcomes, not crypto. No guaranteed returns, no instant-funding claims, no implication that every invoice qualifies, and verification is not legal enforceability or creditworthiness.
- Proof comes from the product itself. No invented customer numbers, logos or testimonials.

## 2. Page structure (kept)

1. Navigation (sticky, 72px): logo left; How it works, For businesses, For investors, Trust and verification (anchor links); right: **Launch app** (only filled action).
2. Hero: eyebrow "INVOICE FINANCING, BUILT ON TRUST", H1, supporting copy, CTAs **Explore financing** and **See how it works**, trust statement, and a three-panel product composition (Invoice, Financing, Verification) joined by thin connecting lines.
3. The Credra approach (four cards): Invoice verification, Duplicate detection, Transparent financing, Auditable transactions.
4. How it works (five steps): Submit, Verify, Establish eligibility, Fund, Track. Horizontal on desktop, vertical on mobile.
5. Product showcase (three alternating stories): Know what you are financing; Understand the economics before you fund; Follow every stage of the transaction.
6. For businesses: "Make your receivables work harder." CTA Explore financing. For investors: "Explore financing backed by verified receivables." CTA Explore opportunities.
7. Trust and technology: "Trust should be backed by evidence." Four items: invoice evidence, verification orchestration, on-chain infrastructure, transaction transparency.
8. Final CTA band: "Bring greater transparency to invoice financing." CTAs **Launch Credra** and **Explore how it works**.
9. Footer with brand line, link groups and the risk and demo disclaimer.

Full copy for each section is in the original brief and is reused verbatim except where section 3 below changes it.

## 3. Reconciliation with the repository (decisions)

| # | Brief says | Conflict | Decision |
|---|---|---|---|
| 1 | Palette table (secondary `#586A63`, border `#DCE3DE`, muted `#EAEDEA`, status greens and reds) | `DESIGN.md` already defines tokens; two sources would drift | Use the `DESIGN.md` tokens (`ink-3`, `hair`, `inset`, status hues). Add one token, `pine-hover #092E29`, for button hover. |
| 2 | Marketing type scale 64 / 44 / 22 / 18 | App scale is smaller | Add a separate "marketing scale" to `DESIGN.md`; the app scale is unchanged. |
| 3 | Final CTA on a deep pine background | `DESIGN.md` forbids dark or saturated page sections | **Needs your approval:** allow one pine CTA band on the marketing page only, documented as an exception. Everything else stays on canvas. |
| 4 | "On-chain attestation" in the hero and evidence list | Our verdict is recorded by the verifier wallet, not an attestation; constitution principle I | Say "Recorded onchain by the verifier wallet" with the transaction link. Never use "attestation". |
| 5 | "Chainlink CRE supports orchestration of external verification" | True only in simulation here | Add "demonstrated in the CRE simulator" to that item and keep the trust page's plain statement. |
| 6 | Hero shows INV-1001, Verified, 9,000 and 1,000 USDT | A "Verified" tag is allowed only if it really passed; no live activity may be invented | Render the panels from the real demo invoice via the real components. Mark the composition "Illustrative demo data" and show Verified only when the registry status is Eligible with a recorded transaction. |
| 7 | "Sign in" in the navigation | There is no account system, only wallet connect | Remove it. Keep Launch app. |
| 8 | Footer links: Documentation, About, Contact, Terms, Privacy, Risk disclosures | Most destinations do not exist, and fake legal text is not acceptable | Footer lists only real destinations: Product anchors, About the trust model (`/app/about`), Transaction explorer (link to the registry contract), and one **Risk and demo notice** page. Omit Documentation, Contact, Terms and Privacy until real. Real legal text needs counsel, not generated copy. |
| 9 | "Preserve existing logo assets exactly" | No Credra logo file exists in the repository | Use the text wordmark and pine square from `DESIGN.md` as a placeholder. **Need from you:** the real logo file, if one exists. |
| 10 | CTAs route to business and investor journeys | Investor journey needs US2 (funding), which needs sponsor USDT | "Explore opportunities" is shown only once the investor marketplace route exists; until then it is hidden, not dead. |
| 11 | Landing at the root and the app behind Launch app | `ui-spec.md` 3.1 used the root as a connect screen | Marketing lives at `/`; the application lives under `/app/*`. The connect screen in `ui-spec.md` becomes `/app`. |
| 12 | Lighthouse 90+ and 95+, SEO schema, performance audit | Targets, not results; time is short | Implement title, meta, Open Graph, canonical, robots and sitemap. Skip structured data and formal Lighthouse tuning. Never claim scores that were not measured. |

## 4. Scope and priority

- Story 6 is **P3**: build it only after the MVP (US1) and funding (US2) work. The brief itself says not to spend time on decorative animation before the core funding journey works.
- Minimum landing page: navigation, hero with product composition, approach cards, process, audience sections, technology section, final CTA, footer and the risk notice. The three product showcase stories reuse the same real components and can be cut to one.
- Motion: CSS only, one fade-up on the hero panels, reveal on the process steps, all disabled under `prefers-reduced-motion`.
- Acceptance (from the brief, kept): clear message in five seconds, both audiences addressed with distinct CTAs, no unsupported financial claims, no fabricated statistics, every visible CTA works, no horizontal scroll at 375, 390, 430, 768, 1024, 1280 and 1440px, 44px touch targets, no console errors.
