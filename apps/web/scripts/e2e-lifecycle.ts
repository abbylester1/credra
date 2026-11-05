// Full financing lifecycle with the OFFICIAL Whitechain USDT, acting as the investor and business wallets.
// Run (from apps/web): bun --env-file ../../.env scripts/e2e-lifecycle.ts [invoiceNumber] [--dry]
// Flow: investor approves + funds -> investor tops up the business for the discount -> business approves + repays.
// Needs the web app on :3000 (for timeline sync) and USDT in the investor wallet (>= financing amount, plus the discount
// to send to the business). Never prints keys. Prints explorer links for every transaction.
import { createPublicClient, createWalletClient, defineChain, fallback, http, keccak256, stringToBytes } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const BASE = process.env.WEB_URL ?? 'http://localhost:3000'
const USDT = '0xcedfB56113143d55b2358b8CFbB0dEB5Ad2f55a7'
const FINANCE = '0x3025FDea4Aa3A96deC46451b7Eec2e83188307B6'
const REGISTRY = '0xc11162A72F388Efb6Ddd0B73Eea578598d733122'
const EXPLORER = 'https://explorer.testnet.whitechain.io/tx/'

const chain = defineChain({ id: 1874, name: 'Whitechain Sepolia', nativeCurrency: { name: 'WBT', symbol: 'WBT', decimals: 18 }, rpcUrls: { default: { http: ['https://rpc.testnet.whitechain.io'] } } })
const transport = fallback([http('https://rpc.testnet.whitechain.io', { timeout: 15000 }), http('https://rpc.ankr.com/whitechain_testnet', { timeout: 15000 })])
const pub = createPublicClient({ chain, transport })
const investor = privateKeyToAccount(process.env.PRIVATE_KEY_INVESTOR as `0x${string}`)
const business = privateKeyToAccount(process.env.PRIVATE_KEY_BUSINESS as `0x${string}`)
const iw = createWalletClient({ account: investor, chain, transport })
const bw = createWalletClient({ account: business, chain, transport })

const erc20 = [
	{ type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'a', type: 'address' }], outputs: [{ type: 'uint256' }] },
	{ type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{ name: 's', type: 'address' }, { name: 'v', type: 'uint256' }], outputs: [{ type: 'bool' }] },
	{ type: 'function', name: 'transfer', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'v', type: 'uint256' }], outputs: [{ type: 'bool' }] },
] as const
const finance = [
	{ type: 'function', name: 'fund', stateMutability: 'nonpayable', inputs: [{ name: 'invoiceId', type: 'bytes32' }], outputs: [] },
	{ type: 'function', name: 'repay', stateMutability: 'nonpayable', inputs: [{ name: 'invoiceId', type: 'bytes32' }], outputs: [] },
] as const
const registry = [{ type: 'function', name: 'getInvoice', stateMutability: 'view', inputs: [{ name: 'invoiceId', type: 'bytes32' }], outputs: [{ type: 'tuple', components: [{ name: 'invoiceId', type: 'bytes32' }, { name: 'documentHash', type: 'bytes32' }, { name: 'buyerRef', type: 'bytes32' }, { name: 'verificationRef', type: 'bytes32' }, { name: 'issuer', type: 'address' }, { name: 'amount', type: 'uint256' }, { name: 'financingAmount', type: 'uint256' }, { name: 'dueDate', type: 'uint64' }, { name: 'status', type: 'uint8' }] }] }] as const

const fmt = (v: bigint) => (Number(v) / 1e6).toLocaleString('en-US', { minimumFractionDigits: 2 })
const links: string[] = []
const log = (s: string) => console.log(s)

async function send(label: string, kind: 'fund' | 'repay' | null, id: `0x${string}`, fn: () => Promise<`0x${string}`>) {
	const hash = await fn()
	const rc = await pub.waitForTransactionReceipt({ hash, timeout: 90_000 })
	if (rc.status !== 'success') throw new Error(`${label} reverted`)
	links.push(`- ${label}: [${hash}](${EXPLORER}${hash})`)
	log(`ok  ${label}  ${EXPLORER}${hash}`)
	if (kind) await fetch(`${BASE}/api/invoices/${id}/sync`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ txHash: hash, kind }) }).catch(() => {})
}

const number = process.argv.find((a) => !a.startsWith('-') && !a.includes('/') && a !== 'bun' && !a.endsWith('.ts')) ?? 'E2E-mw3ziwws-match'
const dry = process.argv.includes('--dry')
const id = keccak256(stringToBytes(number))
const inv = await pub.readContract({ address: REGISTRY, abi: registry, functionName: 'getInvoice', args: [id] })
const amount = inv.amount, advance = inv.financingAmount

log(`Invoice ${number}  status=${inv.status}  amount=${fmt(amount)}  financing=${fmt(advance)} USDT`)
const [ib, bb] = await Promise.all([
	pub.readContract({ address: USDT, abi: erc20, functionName: 'balanceOf', args: [investor.address] }),
	pub.readContract({ address: USDT, abi: erc20, functionName: 'balanceOf', args: [business.address] }),
])
log(`Investor ${investor.address}  USDT=${fmt(ib)}\nBusiness ${business.address}  USDT=${fmt(bb)}`)

const discount = amount - advance
const needInvestor = advance + discount // fund, then send the discount to the business so it can repay in full
if (inv.status !== 3) { log(`Stop: invoice must be Eligible (3), it is ${inv.status}.`); process.exit(1) }
if (ib < needInvestor) {
	log(`Stop: investor needs ${fmt(needInvestor)} USDT (${fmt(advance)} to fund + ${fmt(discount)} for the business to repay in full). Short by ${fmt(needInvestor - ib)}.`)
	process.exit(dry ? 0 : 1)
}
if (dry) { log('Dry run: balances are sufficient. Nothing sent.'); process.exit(0) }

await send('Investor approves USDT', null, id, () => iw.writeContract({ address: USDT, abi: erc20, functionName: 'approve', args: [FINANCE, advance] }))
await send('Investor funds the invoice (USDT to business, receivable minted)', 'fund', id, () => iw.writeContract({ address: FINANCE, abi: finance, functionName: 'fund', args: [id] }))
const bal2 = await pub.readContract({ address: USDT, abi: erc20, functionName: 'balanceOf', args: [business.address] })
if (bal2 < amount) {
	await send(`Investor sends ${fmt(amount - bal2)} USDT to the business so it can repay in full`, null, id, () => iw.writeContract({ address: USDT, abi: erc20, functionName: 'transfer', args: [business.address, amount - bal2] }))
}
await send('Business approves USDT', null, id, () => bw.writeContract({ address: USDT, abi: erc20, functionName: 'approve', args: [FINANCE, amount] }))
await send('Business repays the full invoice amount (USDT to the receivable holder)', 'repay', id, () => bw.writeContract({ address: FINANCE, abi: finance, functionName: 'repay', args: [id] }))

log(`\nDone. Paste into evidence/whitechain-transactions.md:\n## Funding and repayment (official USDT ${USDT})\nInvoice ${number}\n${links.join('\n')}`)
