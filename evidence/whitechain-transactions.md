# Whitechain Sepolia (chain 1874) transactions

Explorer: https://explorer.testnet.whitechain.io

Current deployment (token `Credra Receivable` / `CRDR`). All contracts are source-verified on the explorer.

## Contracts

| Contract | Address |
|---|---|
| InvoiceRegistry | [0xc11162a72f388efb6ddd0b73eea578598d733122](https://explorer.testnet.whitechain.io/address/0xc11162a72f388efb6ddd0b73eea578598d733122) |
| InvestorAllowlist | [0xe27c2c0bf2a6c34749257f0fd519c9e531ff4b51](https://explorer.testnet.whitechain.io/address/0xe27c2c0bf2a6c34749257f0fd519c9e531ff4b51) |
| ReceivableFinance | [0x3025fdea4aa3a96dec46451b7eec2e83188307b6](https://explorer.testnet.whitechain.io/address/0x3025fdea4aa3a96dec46451b7eec2e83188307b6) |

## Deployment transactions

| # | Action | Tx | Block |
|---|---|---|---|
| 1 | Deploy InvoiceRegistry | [0xeeccb3339596d95ffb1c8fab384ed90c95fa8728e0b3d97787997d1f616544d1](https://explorer.testnet.whitechain.io/tx/0xeeccb3339596d95ffb1c8fab384ed90c95fa8728e0b3d97787997d1f616544d1) | 12299635 |
| 2 | Deploy InvestorAllowlist | [0x6b730175338d830848ddf8a3f9910e356bc8b61e0699f61edf50a1b7d9f56b2a](https://explorer.testnet.whitechain.io/tx/0x6b730175338d830848ddf8a3f9910e356bc8b61e0699f61edf50a1b7d9f56b2a) | 12299638 |
| 3 | Deploy ReceivableFinance | [0xa48c7ba149c0f15c4c428e491ae3e0beca965f773dea47e4a65c243f212a99d1](https://explorer.testnet.whitechain.io/tx/0xa48c7ba149c0f15c4c428e491ae3e0beca965f773dea47e4a65c243f212a99d1) | 12299641 |
| 4 | grantRole | [0x553f5a332ee3be1da2b18dd2ea3048cfe72f150333ef71f7915fc7f6eb24d053](https://explorer.testnet.whitechain.io/tx/0x553f5a332ee3be1da2b18dd2ea3048cfe72f150333ef71f7915fc7f6eb24d053) | 12299644 |
| 5 | grantRole | [0x11eec8856581641a704fa4c493f119f02930f18b0fb4ae998014df5d88601ced](https://explorer.testnet.whitechain.io/tx/0x11eec8856581641a704fa4c493f119f02930f18b0fb4ae998014df5d88601ced) | 12299648 |
| 6 | add | [0xcb4fee7e646156947553189529481ec579065de0fa7b79bc91de072d5af8ab46](https://explorer.testnet.whitechain.io/tx/0xcb4fee7e646156947553189529481ec579065de0fa7b79bc91de072d5af8ab46) | 12299651 |

## Superseded

An earlier deployment with token name `Invoice Receivable` / `RCVBL` was replaced before any funding took place:
InvoiceRegistry `0x37645b05895b66E4ed4a4578D3Ed1A091E9ab209`, InvestorAllowlist `0xf35310d844E50AECeA899CeB888965e9Be50a65A`, ReceivableFinance `0xdCc3464deb1779be5D8e59E8f2385b190E8C04f6`.

## Funding and repayment (official USDT 0xcedfB56113143d55b2358b8CFbB0dEB5Ad2f55a7)

Invoice `E2E-mw3ziwws-match` — amount 60.00 USDT, financing 54.00 USDT, discount 6.00 USDT.

USDT obtained by swapping ~1 WBT for 73.089 USDT through YetiTrade's SwapRouter02 (pool WWBT/USDT 0.3%, router `0xe208cC685cD95D56E8ec6DEC9816476567fc6962`). There is no public USDT faucet on Whitechain testnet.

| # | Step | Tx |
|---|---|---|
| 1 | Investor approves USDT | [0x3a61aba2c978050cdaf87f2d592727d2cfafff85df5f43e8e0369557effc4f58](https://explorer.testnet.whitechain.io/tx/0x3a61aba2c978050cdaf87f2d592727d2cfafff85df5f43e8e0369557effc4f58) |
| 2 | Investor funds the invoice (54.00 USDT to business, CRDR receivable minted) | [0xf350c714feee6e7e1a31b4a86de0320a44b51d0499d61b7d4dafa832603ea125](https://explorer.testnet.whitechain.io/tx/0xf350c714feee6e7e1a31b4a86de0320a44b51d0499d61b7d4dafa832603ea125) |
| 3 | Investor sends 6.00 USDT to business (discount, so business can repay in full) | [0x367628394025003506a6499509a24d81b080a5947cff5b95940a47bf78942db2](https://explorer.testnet.whitechain.io/tx/0x367628394025003506a6499509a24d81b080a5947cff5b95940a47bf78942db2) |
| 4 | Business approves USDT | [0x5013167b642172c31eebd9f423548d4093bcb5f390c68cb68944ac984c09031c](https://explorer.testnet.whitechain.io/tx/0x5013167b642172c31eebd9f423548d4093bcb5f390c68cb68944ac984c09031c) |
| 5 | Business repays the full 60.00 USDT to the receivable holder | [0xa5ec21f89028eedc2bc83fac31f1f1dbaaba3a99073f19c2e661de19c7e7dbe0](https://explorer.testnet.whitechain.io/tx/0xa5ec21f89028eedc2bc83fac31f1f1dbaaba3a99073f19c2e661de19c7e7dbe0) |

Final state: invoice status **Repaid** (6), receivable holder is the investor (`0x195194047B45c06c946603ef1CD7cE22abc990D6`), finance contract holds 0 USDT.

## Web app run through Privy embedded wallets (official USDT)

Invoice `INV-4HABX5` (Demo Exports Ltd to Acme Corp), amount 20.00 USDT, financing 18.00 USDT, discount 2.00 USDT. Every step below was done from the web app with Privy email sign-in and embedded wallets. The business wallet is `0x2db88d68C80B1353Bc7ea4f845992FE3535f495a` and the investor wallet is `0x0b0eE5F3F7aD62CeF2BADe1AB285323C59529Ca6` (allowlisted by the operator).

The investor wallet also repaid, so it was the payer and the receivable holder. The earlier run above has the business repaying.

| # | Step | Tx |
|---|---|---|
| 1 | Business registers the invoice (INV-4HABX5, 20.00 USDT, financing 18.00) | [0x6f5de9d9b75b44dd568371012c4e6c40803491fdc75293c27b95f8df0f024f30](https://explorer.testnet.whitechain.io/tx/0x6f5de9d9b75b44dd568371012c4e6c40803491fdc75293c27b95f8df0f024f30) |
| 2 | Verifier wallet records the CRE verdict (Eligible) | [0xe29b71a2ba2422dcb3a09ab3292f2e907619de82419285b793a73d3995f81263](https://explorer.testnet.whitechain.io/tx/0xe29b71a2ba2422dcb3a09ab3292f2e907619de82419285b793a73d3995f81263) |
| 3 | Investor approves 18.00 USDT | [0x7efed026f39db7d78ddb60289acd4a0b044c30f04a246025f9de016c6f534535](https://explorer.testnet.whitechain.io/tx/0x7efed026f39db7d78ddb60289acd4a0b044c30f04a246025f9de016c6f534535) |
| 4 | Investor funds the invoice (18.00 USDT to the business, CRDR receivable minted) | [0xc58516d40c1f9f4e103ea680f8c095beb8ced1538fcdcfcccabe8900dfa9b12d](https://explorer.testnet.whitechain.io/tx/0xc58516d40c1f9f4e103ea680f8c095beb8ced1538fcdcfcccabe8900dfa9b12d) |
| 5 | Investor wallet approves 20.00 USDT for repayment | [0x11ba6d124e93c0c0ee63210d7f05ed980654786c2e97f6376cf69431b744ea4a](https://explorer.testnet.whitechain.io/tx/0x11ba6d124e93c0c0ee63210d7f05ed980654786c2e97f6376cf69431b744ea4a) |
| 6 | Repayment of the full 20.00 USDT to the receivable holder | [0x485b75ce9f2eb377fd6a7b147a821270942efdffc87d350eba6e9792904b0772](https://explorer.testnet.whitechain.io/tx/0x485b75ce9f2eb377fd6a7b147a821270942efdffc87d350eba6e9792904b0772) |

Final state: invoice status **Repaid** (6). Testnet only, no real funds.
