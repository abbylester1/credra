// End-to-end check of the MVP flow on Whitechain testnet, acting as the business wallet.
// Usage: bun scripts/e2e-mvp.ts (run from apps/web) [scenario ...]   (default: match amount_mismatch disputed absent duplicate)
// Run: bun --env-file ../../.env scripts/e2e-mvp.ts [scenario ...]  (from apps/web)
// Needs the web app on :3000, the mock registry on :8787 and the throwaway keys in the root .env. Never prints keys.
import { createPublicClient, createWalletClient, fallback, http, keccak256, stringToBytes, defineChain } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'


const BASE = process.env.WEB_URL ?? 'http://localhost:3000'
const REGISTRY = '0xc11162A72F388Efb6Ddd0B73Eea578598d733122'
const chain = defineChain({ id: 1874, name: 'Whitechain Sepolia', nativeCurrency: { name: 'WBT', symbol: 'WBT', decimals: 18 }, rpcUrls: { default: { http: ['https://rpc.testnet.whitechain.io'] } } })
const transport = fallback([http('https://rpc.testnet.whitechain.io', { timeout: 15000 }), http('https://rpc.ankr.com/whitechain_testnet', { timeout: 15000 })])
const account = privateKeyToAccount(process.env.PRIVATE_KEY_BUSINESS as `0x${string}`)
const pub = createPublicClient({ chain, transport })
const wallet = createWalletClient({ account, chain, transport })

const abi = [{ type: 'function', name: 'submitInvoice', stateMutability: 'nonpayable', inputs: [{ name: 'invoiceId', type: 'bytes32' }, { name: 'documentHash', type: 'bytes32' }, { name: 'buyerRef', type: 'bytes32' }, { name: 'amount', type: 'uint256' }, { name: 'financingAmount', type: 'uint256' }, { name: 'dueDate', type: 'uint64' }], outputs: [] }, { type: 'error', name: 'DuplicateInvoice', inputs: [] }, { type: 'error', name: 'DuplicateDocument', inputs: [] }, { type: 'error', name: 'InvalidTerms', inputs: [] }] as const

async function authHeaders() {
	const issued = Math.floor(Date.now() / 1000)
	const message = `Credra access\nwallet: ${account.address.toLowerCase()}\nissued: ${issued}`
	return { 'x-wallet': account.address.toLowerCase(), 'x-issued': String(issued), 'x-signature': await account.signMessage({ message }) }
}

async function submit(number: string, scenario: string, reuseHash?: Uint8Array) {
	const amount = 10_000_000_000n
	const financing = 9_000_000_000n
	const due = Math.floor(Date.now() / 1000) + 30 * 86400
	const bytes = reuseHash ?? new TextEncoder().encode(`%PDF-1.4 demo invoice ${number} ${Math.random()}`)
	const docHash = keccak256(bytes)
	const id = keccak256(stringToBytes(number))
	const buyer = keccak256(stringToBytes('buyer:Acme Corp'))

	const hash = await wallet.writeContract({ address: REGISTRY, abi, functionName: 'submitInvoice', args: [id, docHash, buyer, amount, financing, BigInt(due)] })
	const rc = await pub.waitForTransactionReceipt({ hash, timeout: 90_000 })
	if (rc.status !== 'success') throw new Error('submit reverted')

	const auth = await authHeaders()
	const fd = new FormData()
	for (const [k, v] of Object.entries({ invoiceNumber: number, issuerName: 'Demo Exports Ltd', buyerName: 'Acme Corp', currency: 'USD', amount: amount.toString(), financingAmount: financing.toString(), invoiceDate: String(Math.floor(Date.now() / 1000)), dueDate: String(due), submitTx: hash })) fd.set(k, v)
	fd.set('file', new File([bytes as unknown as BlobPart], `${number}.pdf`, { type: 'application/pdf' }))
	const reg = await fetch(`${BASE}/api/invoices`, { method: 'POST', headers: auth, body: fd })
	const regBody = await reg.json()
	if (!reg.ok) return { number, step: 'register', status: reg.status, ...regBody }

	if (scenario !== 'none') {
		const erp = await fetch(`${BASE}/api/operator/simulated-erp`, { method: 'POST', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify({ invoiceNumber: number, scenario }) })
		if (!erp.ok) return { number, step: 'erp', status: erp.status, ...(await erp.json()) }
	}
	const ver = await fetch(`${BASE}/api/invoices/${id}/verify`, { method: 'POST', headers: auth })
	return { number, scenario, status: ver.status, tx: hash, ...(await ver.json()) }
}

const want = process.argv.slice(2)
const scenarios = want.length ? want : ['match', 'amount_mismatch', 'disputed', 'absent', 'duplicate']
const stamp = Date.now().toString(36)
const results: unknown[] = []
for (const s of scenarios) {
	const number = `E2E-${stamp}-${s}`
	try {
		if (s === 'duplicate') {
			const bytes = new TextEncoder().encode(`dup doc ${stamp}`)
			const first = await submit(`${number}-a`, 'match', bytes)
			// same document, new invoice number: the contract must refuse it
			let refused = false
			try {
				const id = keccak256(stringToBytes(`${number}-b`))
				await pub.simulateContract({ address: REGISTRY, abi, functionName: 'submitInvoice', args: [id, keccak256(bytes), keccak256(stringToBytes('buyer:Acme Corp')), 10_000_000_000n, 9_000_000_000n, BigInt(Math.floor(Date.now() / 1000) + 86400)], account })
			} catch (e) {
				refused = /DuplicateDocument/i.test(String(e))
			}
			results.push({ scenario: s, firstVerdict: (first as { verdict?: string }).verdict, duplicateRefusedOnchain: refused })
		} else {
			results.push({ scenario: s, ...(await submit(number, s)) })
		}
	} catch (e) {
		results.push({ scenario: s, error: String(e).slice(0, 200) })
	}
	console.log(JSON.stringify(results.at(-1)))
}
