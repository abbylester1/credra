# Interface Contract: Deployed Whitechain Contracts

Network: Whitechain Sepolia, chain id 1874. Explorer: https://explorer.testnet.whitechain.io. All three are source-verified. These contracts are **fixed** for this feature (no redeploy).

| Contract | Address |
|---|---|
| InvoiceRegistry | `0xc11162A72F388Efb6Ddd0B73Eea578598d733122` |
| InvestorAllowlist | `0xE27c2C0BF2A6C34749257f0FD519c9e531ff4B51` |
| ReceivableFinance (ERC-721 "Credra Receivable", CRDR) | `0x3025FDea4Aa3A96deC46451b7Eec2e83188307B6` |
| Official USDT (6 decimals, not ours) | `0xcedfB56113143d55b2358b8CFbB0dEB5Ad2f55a7` |

## InvoiceRegistry

Writes used by the app:
- `submitInvoice(bytes32 invoiceId, bytes32 documentHash, bytes32 buyerRef, uint256 amount, uint256 financingAmount, uint64 dueDate)`: caller becomes issuer. Reverts: `DuplicateInvoice`, `DuplicateDocument`, `InvalidTerms`, paused. **Signed by the business wallet.**
- `recordVerification(bytes32 invoiceId, Status newStatus, bytes32 verificationRef)`: `VERIFIER_ROLE`; newStatus in {UnderReview(2), Eligible(3), Rejected(4)}; only from Submitted/UnderReview. **Signed by the server verifier key.**

Reads: `getInvoice(bytes32) -> Invoice{invoiceId, documentHash, buyerRef, verificationRef, issuer, amount, financingAmount, dueDate, status}`, `statusOf`, `exists`, `isHashUsed`.

Events: `InvoiceSubmitted`, `VerificationRecorded`, `StatusChanged`.

## InvestorAllowlist

Reads: `isAllowed(address)`. Writes (admin key, server-side): `add(address)`, `remove(address)`. Events: `InvestorAdded`, `InvestorRemoved`.

## ReceivableFinance

- `fund(bytes32 invoiceId)`: caller must be allowlisted; invoice Eligible and not past due; investor must first `approve(finance, financingAmount)` on USDT. Pays the issuer directly and mints token id `uint256(invoiceId)` to the investor. Reverts: `NotAllowlisted`, `NotEligible`. **Signed by the investor wallet.**
- `repay(bytes32 invoiceId)`: invoice must be Funded; payer must first `approve(finance, amount)`; pays the full `amount` to the current token holder. Reverts: `NotFunded`. **Signed by the repayer wallet.**
- `markDefaulted(bytes32 invoiceId)`: anyone, after `dueDate + gracePeriod (259200 s)`.
- Reads: `positions(invoiceId) -> (originalInvestor, fundedAmount, repaidAmount, fundedAt, repaidAt)`, `ownerOf(uint256)`, `name()`, `symbol()`.
- Transfers of the receivable revert unless the recipient is allowlisted.
- Events: `Funded`, `Repaid`, `DefaultMarked`.

## USDT (ERC-20, proxy)

Used: `balanceOf`, `allowance`, `approve`, `decimals`. The app must display a clear shortfall (balance or allowance) before sending `fund`/`repay`.

## Roles and keys (testnet-only, server-side `.env`)

| Role | Holder |
|---|---|
| Contract admin / allowlist admin | deployer wallet (`PRIVATE_KEY_DEPLOYER`) |
| VERIFIER_ROLE | verifier wallet (`PRIVATE_KEY_VERIFIER`) |
| FINANCE_ROLE (registry) | ReceivableFinance contract |
| Business, Investor | users' own browser wallets (throwaway keys imported into the extension) |

## Error mapping (UI)

`DuplicateInvoice`/`DuplicateDocument` -> "already submitted"; `InvalidTerms` -> field-level message; `NotAllowlisted` -> "wallet not approved"; `NotEligible` -> "no longer available"; `NotFunded` -> "not awaiting repayment"; ERC-20 allowance/balance errors -> shortfall message; wrong chain -> switch-network prompt.
