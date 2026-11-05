# Feature Specification: Credra Web App (Invoice Financing Lifecycle)

**Feature Branch**: `001-credra-web-app` (no git branch created; work continues on `main`)

**Created**: 2026-11-05

**Status**: Draft

**Input**: User description: "Build the user-facing Credra application on top of the already-deployed Whitechain contracts and CRE verification workflow, so that a business, an investor and an operator can complete the full invoice-financing lifecycle: submit, verify, fund in USDT, repay."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Business submits an invoice and sees its verification result (Priority: P1)

A business connects its wallet, enters the details of an unpaid invoice and attaches the invoice document. The invoice is registered, automatically verified against the registry of record and the business sees a clear outcome: Eligible, Rejected (with the reasons) or Needs manual review.

**Why this priority**: Without a verified invoice there is nothing to finance. This is the entry point of the whole product and the part the Chainlink track is judged on.

**Independent Test**: With only this story built, a business can submit one invoice and see a verification outcome with explanations and a link to the on-chain record. That alone demonstrates the registration and verification value.

**Acceptance Scenarios**:

1. **Given** a connected business wallet and an invoice whose details match the external record, **When** the business submits it, **Then** the invoice appears as Eligible with a link to its on-chain record.
2. **Given** an invoice whose amount differs from the external record, **When** it is verified, **Then** the business sees Rejected and the specific failed check ("amount mismatch").
3. **Given** an invoice that is disputed in the external record, **When** it is verified, **Then** the business sees Needs manual review.
4. **Given** an invoice that does not exist in the external record, **When** it is verified, **Then** the business sees Rejected with "not found in external registry".
5. **Given** an invoice document or invoice number that was already submitted, **When** the business submits it again, **Then** the submission is refused with a clear duplicate message and nothing new is registered.
6. **Given** the external verification source is unavailable, **When** verification runs, **Then** the invoice is never marked Eligible; it is routed to manual review and the business is told verification could not be completed.

---

### User Story 2 - Investor funds an eligible invoice in USDT (Priority: P1)

An approved investor connects a wallet, browses eligible invoices, reviews the issuer, buyer, amounts, due date and verification evidence, then funds one invoice in official test USDT. The business receives the financing amount directly and the investor receives a receivable representing the right to repayment.

**Why this priority**: The USDT payment inside the main flow is a mandatory requirement for the Whitechain track and the core of the financing value.

**Independent Test**: With one Eligible invoice and one approved investor holding USDT, the investor can fund it and the explorer shows the USDT transfer to the business and the receivable held by the investor.

**Acceptance Scenarios**:

1. **Given** an approved investor with sufficient USDT and an Eligible invoice, **When** the investor approves the spend and funds the invoice, **Then** the business receives the financing amount, the invoice shows Funded and the investor sees the position and a transaction link.
2. **Given** a wallet that is not on the investor allowlist, **When** it tries to fund, **Then** it is blocked with a clear "not approved" message before any payment is attempted.
3. **Given** an invoice that is Rejected, under review or already Funded, **When** an investor opens it, **Then** the fund action is unavailable.
4. **Given** an investor with insufficient USDT or insufficient approval, **When** they attempt to fund, **Then** they see what is missing and no partial state change occurs.
5. **Given** an invoice past its due date, **When** an investor views it, **Then** it cannot be funded.

---

### User Story 3 - Repayment closes the financing (Priority: P2)

The business (or an operator on its behalf) repays the full invoice amount in USDT. The payment goes to whoever currently holds the receivable, the invoice is marked Repaid and both parties can see the completed lifecycle.

**Why this priority**: The Whitechain track requires at least one lifecycle step beyond issuance. Funding already satisfies this, so repayment completes the story and is the second step to show.

**Independent Test**: Given one Funded invoice, the repayer pays the full amount; the investor's balance increases by the invoice amount and the status becomes Repaid.

**Acceptance Scenarios**:

1. **Given** a Funded invoice, **When** the repayer approves and pays the full invoice amount, **Then** the investor receives it, the status becomes Repaid and a transaction link is shown.
2. **Given** a Repaid or Defaulted invoice, **When** repayment is attempted again, **Then** it is refused.
3. **Given** a Funded invoice past its due date plus grace period, **When** anyone triggers the default action, **Then** the invoice is marked Defaulted and further repayment is refused.
4. **Given** the receivable was transferred to another approved investor, **When** repayment is made, **Then** the new holder is paid.

---

### User Story 4 - Operator reviews exceptions and manages investors (Priority: P2)

An operator sees invoices flagged for manual review with the verification evidence, can approve or reject each one, and can add or remove investor wallets from the approved list.

**Why this priority**: Manual review is the safety valve required by the product principle that a verification failure must never silently approve an invoice; the allowlist makes the investor restriction demonstrable.

**Independent Test**: Given one invoice in manual review and one unapproved wallet, the operator approves the invoice and adds the wallet; both changes are visible to the affected users.

**Acceptance Scenarios**:

1. **Given** an invoice in manual review, **When** the operator approves it, **Then** it becomes Eligible and appears to investors.
2. **Given** an invoice in manual review, **When** the operator rejects it, **Then** it becomes Rejected with the operator's reason visible to the business.
3. **Given** a wallet that is not approved, **When** the operator adds it, **Then** that wallet can fund; **When** removed, **Then** it can no longer fund or receive receivables.
4. **Given** a user without operator rights, **When** they open operator functions, **Then** access is denied.

---

### User Story 5 - Transparent trail and honest labelling (Priority: P3)

Every financing step shows its transaction link on the block explorer, and every simulated or unavailable data source is clearly labelled in the interface so a judge or user is never misled.

**Why this priority**: Both sponsor checklists require visible, verifiable evidence and honest disclosure; it adds trust but does not change the core flow.

**Independent Test**: Walk one invoice through the lifecycle and confirm every step has a working explorer link and the interface states which checks are simulated.

**Acceptance Scenarios**:

1. **Given** any registered, verified, funded or repaid invoice, **When** a user opens its detail view, **Then** each completed step shows a working explorer link.
2. **Given** a verification that used the simulated external source, **When** results are shown, **Then** they are labelled "simulated data".
3. **Given** the verification result was recorded by the application rather than by the verification network itself, **When** the trust model is shown, **Then** it states this plainly.

---

---

### User Story 6 - Visitors understand Credra and enter the right journey (Priority: P3)

A visitor lands on a marketing page that explains in plain language how verified invoices become working capital, shows the real product (invoice, financing terms, verification record), and sends businesses and investors into their own journeys.

**Why this priority**: It builds credibility but does not change the core financing flow, so it follows the lifecycle stories.

**Independent Test**: Open the root page on desktop and phone widths; the message is clear, every visible call to action reaches a working destination, and no claim, figure or status is shown that the product cannot back up.

**Acceptance Scenarios**:

1. **Given** a first-time visitor, **When** the page loads, **Then** the headline, one supporting sentence and a product preview explain the offer without crypto jargon.
2. **Given** the product preview, **When** it shows an invoice as verified, **Then** that status reflects a real recorded result and the preview is labelled as demo data.
3. **Given** a business visitor and an investor visitor, **When** each clicks their call to action, **Then** each reaches a different, working journey; a journey that does not exist yet is not offered.
4. **Given** any page content, **When** reviewed, **Then** it contains no guaranteed returns, no invented customer numbers and no claim that verification equals legal enforceability.
5. **Given** the footer, **When** read, **Then** it states the demo and risk limitations and links only to real destinations.

### Edge Cases

- A user connects a wallet on the wrong network: the app prompts a switch and blocks actions until corrected.
- A wallet transaction is rejected or fails midway (for example while approving spend): the interface reports the failure and the invoice status does not change.
- Two investors try to fund the same invoice at the same time: exactly one succeeds; the other sees it is no longer available.
- The verification result is recorded but the on-chain update fails: the invoice stays in its previous status and the operator can retry.
- Amounts are shown in the token's six-decimal precision; no rounding errors appear in displayed totals or yield.
- The business wallet lacks enough USDT to repay: repayment is blocked with a clear shortfall message.
- Uploaded documents are very large or of an unsupported type: the upload is refused with a clear reason.
- Invoice documents and personal data must never be published on-chain; only a fingerprint and minimum metadata are.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to connect a wallet and see which role they act in (business, investor or operator) based on their wallet.
- **FR-002**: The app MUST require the correct network and prompt the user to switch if they are on a different one.
- **FR-003**: A business MUST be able to submit an invoice with invoice number, issuer and buyer details, amount, currency, invoice date, due date, requested financing amount and an attached document.
- **FR-004**: The system MUST compute a reproducible fingerprint of the uploaded document and reject any invoice whose fingerprint or invoice number was already submitted.
- **FR-005**: The system MUST validate that the amount is positive, that the financing amount is less than the invoice amount, and that the due date is in the future before registering the invoice.
- **FR-006**: The system MUST run verification on every submitted invoice using the verification workflow, comparing on-chain data with the external record, and produce exactly one of: Eligible, Rejected (with failed checks) or Needs manual review.
- **FR-007**: A verification failure or an unavailable external source MUST NEVER result in an Eligible status.
- **FR-008**: The verification outcome, failed checks, external reference and timestamp MUST be stored and shown to the business, the operator and, for Eligible invoices, to investors.
- **FR-009**: Investors MUST be able to list Eligible invoices and open a detail view showing issuer, buyer, invoice amount, financing amount, implied investor return, due date, verification evidence and risk flags.
- **FR-010**: Only wallets on the approved investor list MUST be able to fund; others MUST be blocked with a clear message.
- **FR-011**: Funding MUST transfer the financing amount in the official USDT directly from the investor to the business and record the investor as the holder of the receivable.
- **FR-012**: The app MUST guide the investor through the spend approval and the funding as clearly separated steps and report failures without changing invoice status.
- **FR-013**: Repayment MUST require the full invoice amount in USDT, pay the current receivable holder and set the invoice to Repaid.
- **FR-014**: The system MUST allow marking a Funded invoice Defaulted only after its due date plus the grace period.
- **FR-015**: An operator MUST be able to approve or reject invoices in manual review, with a recorded reason, and to add or remove approved investor wallets.
- **FR-016**: Operator functions MUST be inaccessible to non-operators.
- **FR-017**: Every on-chain step (registration, verification result, funding, repayment, default) MUST display a link to the block explorer.
- **FR-018**: The interface MUST clearly label simulated or unavailable verification data, and MUST state that verification results are recorded by the application, not by the verification network.
- **FR-019**: Confidential invoice documents and personal data MUST NOT be published on-chain or exposed to users other than the issuer and the operator.
- **FR-020**: Each invoice MUST have a status history showing the order and time of each change.
- **FR-021**: The business MUST see its own invoices with current status; an investor MUST see their funded positions with expected repayment and status.
- **FR-022**: Secret keys MUST never be exposed to the browser or shown in any interface.

### Key Entities

- **Invoice**: A receivable submitted for financing. Attributes: invoice number, issuer (business wallet), buyer reference, amount, financing amount, due date, document fingerprint, status (Submitted, Under review, Eligible, Rejected, Funded, Repaid, Defaulted).
- **Verification Run**: The outcome of one verification of an invoice. Attributes: verdict, failed checks, review reasons, external reference, timestamp, link to the on-chain record.
- **Position**: An investor's funded claim on an invoice. Attributes: holder, funded amount, repaid amount, funded time, repaid time, explorer links.
- **Approved Investor**: A wallet allowed to fund and hold receivables.
- **Document**: The confidential invoice file kept off-chain, with its fingerprint.
- **Operator Decision**: A manual approve or reject with reason, who made it and when.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A business can go from opening the app to seeing a verification outcome for a new invoice in under 3 minutes.
- **SC-002**: In the demo set, 100% of the four prepared invoice scenarios (valid, amount mismatch, disputed, not in external record) produce the expected outcome (Eligible, Rejected, Needs review, Rejected).
- **SC-003**: 100% of attempts to resubmit a previously submitted invoice are refused, and 0 duplicate invoices are registered.
- **SC-004**: An approved investor can fund an Eligible invoice in under 2 minutes, and the USDT transfer is visible on the block explorer.
- **SC-005**: 100% of attempts by non-approved wallets to fund are blocked before any payment is made.
- **SC-006**: One complete lifecycle (submit, verify, fund, repay) is demonstrated end-to-end with a working explorer link for every on-chain step.
- **SC-007**: In no tested situation (external source down, mismatched data, failed update) does an invoice become Eligible without a passing verification or an explicit operator approval.
- **SC-008**: A reviewer unfamiliar with the project can understand from the interface alone which data is simulated and who records verification results, in under 1 minute.
- **SC-009**: The full demo flow fits within a 3-minute recorded walkthrough showing each party (business, investor, operator).

## Assumptions

- The contracts, the verification workflow, the simulated external verification source and the test wallets already exist (see project documentation); this feature adds the user-facing application and the step that records verification results.
- All activity happens on the Whitechain test network with valueless test tokens; this is a demonstration, not a live lending product.
- The official test USDT is supplied by the sponsor; funding and repayment can only be demonstrated once the investor and business wallets hold enough USDT.
- Roles are determined by wallet address: operator and verifier wallets are configured by the team, investors come from the approved list, and any other connected wallet acts as a business.
- One investor funds each invoice in full; multiple investors and secondary trading are out of scope.
- The verification workflow is exercised through the simulator, not a deployed network; the application records its result on-chain, and this is disclosed in the interface.
- No real identity checks, credit scoring, bank integrations, cross-chain features or automatic detection of the buyer's payment are included; repayment is an explicit transaction.
- Desktop browsers with a standard wallet extension are the supported environment; mobile layout is a nice-to-have.
- Invoice documents are stored privately off-chain for the duration of the demo and are not retained beyond it.
