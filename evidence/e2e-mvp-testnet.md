# End-to-end MVP run on Whitechain Sepolia (chain 1874)

Script: `apps/web/scripts/e2e-mvp.ts` (acts as the business wallet against the real web API). Flow per scenario: `submitInvoice` onchain (business wallet) -> save record (wallet-signed request) -> simulated external record written -> `POST /api/invoices/{id}/verify` runs the **real CRE workflow simulation** -> verdict recorded onchain by the verifier wallet (`recordVerification`). The external record is SIMULATED (apps/mock-registry). The verdict is recorded by an application-authorised transaction, not a DON-signed write.

| Scenario | CRE verdict | Failed checks / reasons | Onchain status after | Verdict record tx |
|---|---|---|---|---|
| Matching record | ELIGIBLE | none | Eligible (3) | [0x6494da7f...f56](https://explorer.testnet.whitechain.io/tx/0x6494da7ff562fd80c4feee1b0dcf1205a2bed15a258e1207d7f2d46089f15f56) |
| Amount differs | REJECTED | amount_mismatch | Rejected (4) | [0x9df4aa11...b9b](https://explorer.testnet.whitechain.io/tx/0x9df4aa11fefc62bf3d0037c9e91c10af8b163fc5688db63858f7d4758929eb9b) |
| Disputed | MANUAL_REVIEW | invoice_disputed_in_external_registry | Under review (2) | [0x6332a23c...56a](https://explorer.testnet.whitechain.io/tx/0x6332a23cf00fef3d12e40c8c9e4966ba1c7a4718a4ff46234ff1e6c5368b256a) |
| Absent from external record | REJECTED | invoice_not_found_in_external_registry | Rejected (4) | [0x4e66b042...3de](https://explorer.testnet.whitechain.io/tx/0x4e66b0422fb5af4d8d4641720d4d56072b06ad67214d6e7af1b79cbb533553de) |
| External registry stopped (outage) | MANUAL_REVIEW | external_api_unavailable | Under review (2), never Eligible | [0x8368f712...a219](https://explorer.testnet.whitechain.io/tx/0x8368f71242ed54f4b2f477101ab777cc2cdbd7dea50bf5f50ffb6aa14e73a219) |
| Same document, new invoice number | refused onchain (`DuplicateDocument`) | n/a | unchanged | n/a (simulated call reverted) |

First matching run: invoice registration tx [0x4c13c492...984](https://explorer.testnet.whitechain.io/tx/0x4c13c4920cefacefe382bb5c594e31feb49502ff9566a5d12030073121a94984).
