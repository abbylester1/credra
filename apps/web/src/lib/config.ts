// Public, non-secret configuration shared by client and server. Addresses are public onchain data.
export const CHAIN_ID = 1874
export const EXPLORER = 'https://explorer.testnet.whitechain.io'
export const RPC_PRIMARY = 'https://rpc.testnet.whitechain.io'
export const RPC_FALLBACK = 'https://rpc.ankr.com/whitechain_testnet'

export const ADDRESSES = {
	registry: '0xc11162A72F388Efb6Ddd0B73Eea578598d733122',
	allowlist: '0xE27c2C0BF2A6C34749257f0FD519c9e531ff4B51',
	finance: '0x3025FDea4Aa3A96deC46451b7Eec2e83188307B6',
	usdt: '0xcedfB56113143d55b2358b8CFbB0dEB5Ad2f55a7',
} as const

export const GRACE_PERIOD_SECONDS = 259200

export const explorerTx = (hash: string) => `${EXPLORER}/tx/${hash}`
export const explorerAddress = (addr: string) => `${EXPLORER}/address/${addr}`

export const shorten = (v: string, head = 6, tail = 4) =>
	v.length <= head + tail + 1 ? v : `${v.slice(0, head)}…${v.slice(-tail)}`
