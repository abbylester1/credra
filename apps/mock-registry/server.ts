// SIMULATED external verification API (stands in for an ERP / business registry).
// All data is test data. GET /invoices/:number is what the CRE workflow calls.
//   POST /admin/invoices  upserts a record (used by the demo seed script)
//   GET  /health
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

type Rec = {
	invoiceNumber: string
	issuerName: string
	issuerWallet: string
	buyerName: string
	buyerRef: string
	amount: string
	dueDate: number
	documentHash: string
	status: 'valid' | 'disputed' | 'void'
	reference: string
}

const FILE = new URL('./data.json', import.meta.url).pathname
const db: Record<string, Rec> = existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf-8')) : {}
const save = () => writeFileSync(FILE, JSON.stringify(db, null, 2))
const json = (b: unknown, status = 200) =>
	new Response(JSON.stringify(b), { status, headers: { 'content-type': 'application/json' } })

const port = Number(process.env.PORT ?? 8787)
Bun.serve({
	port,
	hostname: '0.0.0.0',
	async fetch(req) {
		const url = new URL(req.url)
		if (url.pathname === '/health') return json({ ok: true, simulated: true })
		if (req.method === 'GET' && url.pathname.startsWith('/invoices/')) {
			const rec = db[decodeURIComponent(url.pathname.slice('/invoices/'.length))]
			return rec ? json({ ...rec, simulated: true }) : json({ error: 'not_found' }, 404)
		}
		if (req.method === 'POST' && url.pathname === '/admin/invoices') {
			const r = (await req.json()) as Rec
			r.reference ||= `ERP-SIM-${r.invoiceNumber}`
			db[r.invoiceNumber] = r
			save()
			return json({ ok: true, reference: r.reference })
		}
		return json({ error: 'not_found' }, 404)
	},
})
console.log(`mock-registry (SIMULATED) listening on :${port}`)
