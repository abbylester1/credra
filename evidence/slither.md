# Slither static analysis

Slither 0.11.6, 81 detectors, run on `contracts/src` (libraries, tests and scripts excluded). Informational findings excluded. Static analysis is a first pass, not an audit.

Command: `cd contracts && slither . --filter-paths "lib|test|script" --exclude-informational`

Result: 5 findings, all Low impact, no High or Medium.

| Finding | Where | Assessment |
|---|---|---|
| reentrancy-benign | `ReceivableFinance.repay` | Call goes to our own `InvoiceRegistry` (FINANCE_ROLE gated, no callbacks); `repay` is `nonReentrant`. Benign. Could reorder to write position fields before the registry call. |
| reentrancy-events | `ReceivableFinance.markDefaulted` | Event emitted after a call to the trusted registry. Benign. |
| timestamp (x3) | `submitInvoice`, `fund`, `markDefaulted` | Intentional: due dates and a 3-day grace period are day-scale, so block timestamp skew is irrelevant. |

Possible hardening before any production use: checks-effects-interactions ordering in `repay`; `nonReentrant` on `markDefaulted`; invariant tests (contracts never hold USDT, status never regresses).
