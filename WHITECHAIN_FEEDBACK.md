# Whitechain Testnet Feedback

Notes from building [Credra](https://github.com/abbylester1/credra) on Whitechain Sepolia (1874) at ETHGlobal Mumbai 2026.

## No public USDT faucet

The official USDT (`0xcedfB56113143d55b2358b8CFbB0dEB5Ad2f55a7`) is owner-only mint. I eventually found a WWBT/USDT pool on YetiTrade and swapped faucet WBT for USDT, but discovering that route took hours. Portal bridge delivers a different `USDT.e` token, not the official one. A simple USDT faucet — or documenting the swap route in the hackathon starter kit — would save every team building a stablecoin flow.

## RPC reliability

Both `rpc.testnet.whitechain.io` and `rpc.ankr.com/whitechain_testnet` have frequent 10–30 second latency spikes, sometimes at the same time. I worked around it with a fallback transport and generous timeouts, but it slowed the development cycle significantly.

## `getLogs` capped at ~10,000 blocks

The RPC silently returns empty results when a `getLogs` range exceeds roughly 10,000 blocks — no error, just nothing. I discovered this when my allowlist reconstruction returned zero events despite confirmed on-chain data. An explicit JSON-RPC error and a documented cap would help.

## WBT faucet is one-drip-per-GitHub-account

Fine for one wallet, but I needed gas in four (deployer, verifier, business, investor). Allowing multiple claims to different addresses from the same account, with a cooldown, would help hackathon teams.

## Whitechain not in Chainlink CRE supported-chains

I declared it as an `experimental-chains` entry (selector 1874) so the CRE workflow could read Whitechain state in simulation. Full DON deployment is not possible. More of a Chainlink item, but worth noting if Whitechain is pursuing CRE integrations.

## Explorer works well

The Blockscout explorer worked reliably throughout. Contract verification with `forge verify-contract` succeeded first try, the token-transfer API returned correct data, and the UI is clean. No complaints.

## Documentation gaps

- No mention of the `getLogs` block-range limit.
- No listing of available ERC-20 tokens on testnet, their addresses, or how to obtain them.
- A "Common tokens on testnet" table in the hackathon starter guide would go a long way.
