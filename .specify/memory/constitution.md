# Credra Constitution

## Core Principles

### I. Honest Trust Model (NON-NEGOTIABLE)
Credra MUST describe exactly who does what. Verification results are recorded onchain by an
application-authorised transaction from the verifier wallet; they MUST NOT be described as
DON-signed or CRE-attested writes. Any data source that is simulated, mocked or unavailable MUST be
labelled as such in the UI, the README and the evidence files. A demo MUST NOT imply that an
external buyer payment was detected unless that integration exists; repayment is an explicit
transaction.
Rationale: both sponsor tracks reward verifiable claims, and a misleading claim is worse than a
missing feature.

### II. Fail-Safe Verification
An invoice MUST become Eligible only through a successfully parsed ELIGIBLE verdict from the CRE
workflow or an explicit, recorded operator approval. Any error, timeout, outage, unparsable output
or unknown verdict MUST resolve to manual review (UnderReview), never Eligible. The CRE workflow
MUST be in the real eligibility path; the eligibility rules MUST NOT be reimplemented in the app
to bypass it.
Rationale: financing decisions must not silently approve on failure, and the workflow must be used
meaningfully, not decoratively.

### III. Keys and Secrets Stay Server-Side and Testnet-Only
Private keys, passcodes and CRE credentials MUST live only in gitignored environment files or the
server process. They MUST NOT appear in browser bundles, `NEXT_PUBLIC_` variables, logs, commits,
chat output or documents. Keys in this project MUST be throwaway testnet keys; no key holding real
value is permitted. The `.env` files MUST remain gitignored.
Rationale: the demo repository is public and the testing tools run with broad local access.

### IV. Privacy by Design
Confidential invoice documents and personal data MUST NOT be stored or published onchain. Only
document fingerprints (keccak256), hashed buyer references and the minimum terms needed for
settlement go onchain. Documents are stored off-chain and served only to the issuer and the
operator.
Rationale: onchain data is public and permanent.

### V. Official Settlement Asset
All financing and repayment payments MUST use the official Whitechain test USDT contract
(`0xcedfB56113143d55b2358b8CFbB0dEB5Ad2f55a7`). A replacement or mock token MUST NOT be used in the
main application flow; mock tokens are permitted only inside unit tests. Contracts MUST never
custody investor funds and MUST NOT provide an administrator withdrawal path. Token amounts MUST be
handled as integers in base units (6 decimals), never as floating point.
Rationale: the Whitechain track requires official USDT payments in the main flow, and non-custodial
settlement removes a class of risk.

### VI. Evidence and Proof
Every claimed lifecycle step MUST be backed by evidence in the repository: a verified-contract
explorer link, a transaction hash, or a captured CRE simulation log. Behaviour that protects funds
or eligibility MUST be covered by an automated test, and existing suites (`forge test`, `bun test`)
MUST stay green. Commits MUST be small and frequent so the history shows continuous development.
Rationale: judges inspect the public repository, and untested claims cannot be trusted.

## Scope and Technical Constraints

- Network: Whitechain Sepolia, chain id 1874, only. Cross-chain, CCIP and multi-chain features
  are out of scope.
- Scope MUST follow the PRD for V1: single investor per invoice, no credit scoring, no real KYC,
  no automated bank or buyer payment detection, no secondary-market trading. Additions require a
  documented amendment to the spec first.
- The three deployed contracts (InvoiceRegistry, InvestorAllowlist, ReceivableFinance) are fixed.
  A redeploy requires a written reason, re-verification on the explorer, re-seeding and refreshed
  evidence.
- The web app is a single Next.js TypeScript application; no additional backend services are added
  without a documented need. The simulated external verification API stays a separate process.
- RPC access MUST use a fallback transport with timeouts because both public RPCs are intermittently
  unreliable.
- Deploy access to the CRE network is not enabled; the CRE workflow is exercised through the CLI
  simulator.

## Development Workflow

- Work follows Spec Kit: specify, plan, tasks, implement, with the plan's Constitution Check gated
  on this document.
- Each plan MUST map every principle to PASS or a justified violation in Complexity Tracking.
- Before any user-facing claim is added to the README or demo script, the matching evidence file
  MUST exist.
- Changes to contract code, the CRE workflow or the simulated API MUST be accompanied by updated
  tests and, where onchain, updated evidence.
- `CLAUDE.md` MUST be kept current with commands, addresses and decisions.

## Governance

This constitution supersedes other practices in this repository. Amendments require a written
change to this file stating the rationale, a version bump, and an update to any plan or spec whose
gates change. Versioning follows semantic versioning: MAJOR for removing or redefining a
principle, MINOR for adding a principle or materially expanding guidance, PATCH for wording
clarifications. Compliance is reviewed at each plan (Constitution Check) and before any release or
submission; violations MUST be fixed or justified in the plan's Complexity Tracking table. Runtime
guidance lives in `CLAUDE.md`.

**Version**: 1.0.0 | **Ratified**: 2026-11-05 | **Last Amended**: 2026-11-05
