import 'server-only'
import { getDb } from './db'

export type InvoiceRow = {
	invoice_id: string
	invoice_number: string
	issuer_wallet: string
	issuer_name: string
	buyer_name: string
	buyer_ref: string
	currency: string
	amount: string
	financing_amount: string
	invoice_date: number
	due_date: number
	document_hash: string
	submit_tx: string
	created_at: number
}

export type RunRow = {
	id: number
	invoice_id: string
	verdict: string
	failed_checks: string
	review_reasons: string
	external_reference: string | null
	report_json: string
	verification_ref: string
	record_tx: string | null
	source_simulated: number
	created_at: number
}

export type EventRow = {
	id: number
	invoice_id: string
	status: string
	tx_hash: string | null
	source: string
	actor: string | null
	created_at: number
}

const now = () => Math.floor(Date.now() / 1000)

export function insertInvoice(r: Omit<InvoiceRow, 'created_at'>) {
	getDb()
		.prepare(
			`INSERT INTO invoices (invoice_id, invoice_number, issuer_wallet, issuer_name, buyer_name, buyer_ref, currency,
			 amount, financing_amount, invoice_date, due_date, document_hash, submit_tx, created_at)
			 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
		)
		.run(
			r.invoice_id, r.invoice_number, r.issuer_wallet, r.issuer_name, r.buyer_name, r.buyer_ref, r.currency,
			r.amount, r.financing_amount, r.invoice_date, r.due_date, r.document_hash, r.submit_tx, now(),
		)
}

export const getInvoiceRow = (id: string) =>
	getDb().prepare('SELECT * FROM invoices WHERE invoice_id = ?').get(id.toLowerCase()) as InvoiceRow | undefined

export const findByNumberOrHash = (number: string, hash: string) =>
	getDb()
		.prepare('SELECT invoice_id FROM invoices WHERE invoice_number = ? OR document_hash = ?')
		.get(number, hash.toLowerCase()) as { invoice_id: string } | undefined

export const listInvoiceRows = (issuer?: string) =>
	(issuer
		? getDb().prepare('SELECT * FROM invoices WHERE issuer_wallet = ? ORDER BY created_at DESC').all(issuer.toLowerCase())
		: getDb().prepare('SELECT * FROM invoices ORDER BY created_at DESC').all()) as InvoiceRow[]

export function insertDocument(d: { invoice_id: string; storage_path: string; document_hash: string; mime_type: string; size_bytes: number }) {
	getDb()
		.prepare('INSERT INTO documents (invoice_id, storage_path, document_hash, mime_type, size_bytes) VALUES (?,?,?,?,?)')
		.run(d.invoice_id, d.storage_path, d.document_hash, d.mime_type, d.size_bytes)
}

export const getDocumentRow = (invoiceId: string) =>
	getDb().prepare('SELECT * FROM documents WHERE invoice_id = ? ORDER BY id DESC LIMIT 1').get(invoiceId.toLowerCase()) as
		| { storage_path: string; mime_type: string; document_hash: string; size_bytes: number }
		| undefined

export function insertRun(r: Omit<RunRow, 'id' | 'created_at'>) {
	getDb()
		.prepare(
			`INSERT INTO verification_runs (invoice_id, verdict, failed_checks, review_reasons, external_reference, report_json,
			 verification_ref, record_tx, source_simulated, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
		)
		.run(
			r.invoice_id, r.verdict, r.failed_checks, r.review_reasons, r.external_reference, r.report_json,
			r.verification_ref, r.record_tx, r.source_simulated, now(),
		)
}

export const latestRun = (invoiceId: string) =>
	getDb().prepare('SELECT * FROM verification_runs WHERE invoice_id = ? ORDER BY id DESC LIMIT 1').get(invoiceId.toLowerCase()) as
		| RunRow
		| undefined

export const allRuns = () =>
	getDb().prepare('SELECT * FROM verification_runs ORDER BY id DESC LIMIT 200').all() as RunRow[]

export function insertEvent(e: { invoice_id: string; status: string; tx_hash?: string | null; source: string; actor?: string | null }) {
	getDb()
		.prepare('INSERT INTO status_events (invoice_id, status, tx_hash, source, actor, created_at) VALUES (?,?,?,?,?,?)')
		.run(e.invoice_id.toLowerCase(), e.status, e.tx_hash ? e.tx_hash.toLowerCase() : null, e.source, e.actor ?? null, now())
}

export const eventsFor = (invoiceId: string) =>
	getDb().prepare('SELECT * FROM status_events WHERE invoice_id = ? ORDER BY id ASC').all(invoiceId.toLowerCase()) as EventRow[]

export const eventExistsForTx = (txHash: string) =>
	!!getDb().prepare('SELECT 1 FROM status_events WHERE tx_hash = ? LIMIT 1').get(txHash.toLowerCase())

export function insertDecision(d: { invoice_id: string; decision: 'APPROVE' | 'REJECT'; reason: string; tx_hash: string }) {
	getDb()
		.prepare('INSERT INTO operator_decisions (invoice_id, decision, reason, tx_hash, created_at) VALUES (?,?,?,?,?)')
		.run(d.invoice_id.toLowerCase(), d.decision, d.reason, d.tx_hash, now())
}

export const latestDecision = (invoiceId: string) =>
	getDb().prepare('SELECT * FROM operator_decisions WHERE invoice_id = ? ORDER BY id DESC LIMIT 1').get(invoiceId.toLowerCase()) as
		| { decision: string; reason: string; tx_hash: string; created_at: number }
		| undefined

/** Human-readable names for wallets. Issuers are named from their invoices; investors are named by the operator. */
export type WalletLabel = { name: string; role: 'Business' | 'Investor' }

export function setWalletLabel(wallet: string, name: string, role: WalletLabel['role']) {
	getDb()
		.prepare('INSERT INTO wallet_labels (wallet, name, role) VALUES (?,?,?) ON CONFLICT(wallet) DO UPDATE SET name = excluded.name, role = excluded.role')
		.run(wallet.toLowerCase(), name.trim().slice(0, 60), role)
}

export function walletLabels(wallets: string[]): Record<string, WalletLabel> {
	const out: Record<string, WalletLabel> = {}
	for (const w of new Set(wallets.map((x) => x.toLowerCase()))) {
		const l = getDb().prepare('SELECT name, role FROM wallet_labels WHERE wallet = ?').get(w) as WalletLabel | undefined
		if (l) { out[w] = l; continue }
		const b = getDb().prepare('SELECT issuer_name FROM invoices WHERE issuer_wallet = ? ORDER BY created_at DESC LIMIT 1').get(w) as { issuer_name: string } | undefined
		if (b) out[w] = { name: b.issuer_name, role: 'Business' }
	}
	return out
}
