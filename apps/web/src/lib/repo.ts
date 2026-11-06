import 'server-only'
import { all, get, run } from './db'
import { adminAddress, verifierAddress } from './signer'

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

export async function insertInvoice(r: Omit<InvoiceRow, 'created_at'>) {
	await run(
		`INSERT INTO invoices (invoice_id, invoice_number, issuer_wallet, issuer_name, buyer_name, buyer_ref, currency,
		 amount, financing_amount, invoice_date, due_date, document_hash, submit_tx, created_at)
		 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
		[
			r.invoice_id, r.invoice_number, r.issuer_wallet, r.issuer_name, r.buyer_name, r.buyer_ref, r.currency,
			r.amount, r.financing_amount, r.invoice_date, r.due_date, r.document_hash, r.submit_tx, now(),
		],
	)
}

export const getInvoiceRow = (id: string) => get<InvoiceRow>('SELECT * FROM invoices WHERE invoice_id = ?', [id.toLowerCase()])

export const findByNumberOrHash = (number: string, hash: string) =>
	get<{ invoice_id: string }>('SELECT invoice_id FROM invoices WHERE invoice_number = ? OR document_hash = ?', [number, hash.toLowerCase()])

export const getInvoiceByNumber = (number: string) => get<InvoiceRow>('SELECT * FROM invoices WHERE invoice_number = ?', [number])

export const listInvoiceRows = (issuer?: string) =>
	issuer
		? all<InvoiceRow>('SELECT * FROM invoices WHERE issuer_wallet = ? ORDER BY created_at DESC', [issuer.toLowerCase()])
		: all<InvoiceRow>('SELECT * FROM invoices ORDER BY created_at DESC')

/** The document bytes live in the database so the app works on hosts with no persistent disk. */
export async function insertDocument(d: { invoice_id: string; document_hash: string; mime_type: string; size_bytes: number; content: Uint8Array }) {
	await run('INSERT INTO documents (invoice_id, storage_path, document_hash, mime_type, size_bytes, content) VALUES (?,?,?,?,?,?)', [
		d.invoice_id, '', d.document_hash, d.mime_type, d.size_bytes, d.content,
	])
}

export type DocumentRow = { storage_path: string; mime_type: string; document_hash: string; size_bytes: number; content: ArrayBuffer | null }
export const getDocumentRow = (invoiceId: string) =>
	get<DocumentRow>('SELECT storage_path, mime_type, document_hash, size_bytes, content FROM documents WHERE invoice_id = ? ORDER BY id DESC LIMIT 1', [invoiceId.toLowerCase()])

export async function insertRun(r: Omit<RunRow, 'id' | 'created_at'>) {
	await run(
		`INSERT INTO verification_runs (invoice_id, verdict, failed_checks, review_reasons, external_reference, report_json,
		 verification_ref, record_tx, source_simulated, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
		[
			r.invoice_id, r.verdict, r.failed_checks, r.review_reasons, r.external_reference, r.report_json,
			r.verification_ref, r.record_tx, r.source_simulated, now(),
		],
	)
}

export const latestRun = (invoiceId: string) =>
	get<RunRow>('SELECT * FROM verification_runs WHERE invoice_id = ? ORDER BY id DESC LIMIT 1', [invoiceId.toLowerCase()])

export const allRuns = () => all<RunRow>('SELECT * FROM verification_runs ORDER BY id DESC LIMIT 200')

export async function insertEvent(e: { invoice_id: string; status: string; tx_hash?: string | null; source: string; actor?: string | null }) {
	await run('INSERT INTO status_events (invoice_id, status, tx_hash, source, actor, created_at) VALUES (?,?,?,?,?,?)', [
		e.invoice_id.toLowerCase(), e.status, e.tx_hash ? e.tx_hash.toLowerCase() : null, e.source, e.actor ?? null, now(),
	])
}

export const eventsFor = (invoiceId: string) => all<EventRow>('SELECT * FROM status_events WHERE invoice_id = ? ORDER BY id ASC', [invoiceId.toLowerCase()])

export const eventExistsForTx = async (txHash: string) => !!(await get('SELECT 1 AS x FROM status_events WHERE tx_hash = ? LIMIT 1', [txHash.toLowerCase()]))

export async function insertDecision(d: { invoice_id: string; decision: 'APPROVE' | 'REJECT'; reason: string; tx_hash: string }) {
	await run('INSERT INTO operator_decisions (invoice_id, decision, reason, tx_hash, created_at) VALUES (?,?,?,?,?)', [
		d.invoice_id.toLowerCase(), d.decision, d.reason, d.tx_hash, now(),
	])
}

export const latestDecision = (invoiceId: string) =>
	get<{ decision: string; reason: string; tx_hash: string; created_at: number }>(
		'SELECT * FROM operator_decisions WHERE invoice_id = ? ORDER BY id DESC LIMIT 1',
		[invoiceId.toLowerCase()],
	)

/** Human-readable names for wallets. Issuers are named from their invoices; investors are named by the operator. */
export type WalletLabel = { name: string; role: 'Business' | 'Investor' | 'Verifier' | 'Operator' }

export async function setWalletLabel(wallet: string, name: string, role: WalletLabel['role']) {
	await run(
		'INSERT INTO wallet_labels (wallet, name, role) VALUES (?,?,?) ON CONFLICT(wallet) DO UPDATE SET name = excluded.name, role = excluded.role',
		[wallet.toLowerCase(), name.trim().slice(0, 60), role],
	)
}

/** Application wallets that sign on the platform's behalf. Named so the audit trail never shows a bare address. */
function serviceLabels(): Record<string, WalletLabel> {
	try {
		return {
			[verifierAddress().toLowerCase()]: { name: 'Credra Verifier', role: 'Verifier' },
			[adminAddress().toLowerCase()]: { name: 'Credra Operator', role: 'Operator' },
		}
	} catch {
		return {}
	}
}

export async function walletLabels(wallets: string[]): Promise<Record<string, WalletLabel>> {
	const out: Record<string, WalletLabel> = {}
	const service = serviceLabels()
	for (const w of new Set(wallets.map((x) => x.toLowerCase()))) {
		if (service[w]) { out[w] = service[w]; continue }
		const l = await get<WalletLabel>('SELECT name, role FROM wallet_labels WHERE wallet = ?', [w])
		if (l) { out[w] = l; continue }
		const b = await get<{ issuer_name: string }>('SELECT issuer_name FROM invoices WHERE issuer_wallet = ? ORDER BY created_at DESC LIMIT 1', [w])
		if (b) out[w] = { name: b.issuer_name, role: 'Business' }
	}
	return out
}

/* ---- simulated external registry, stored in the database (used by the hosted demo) ---- */
export type RegistryRecord = {
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

export async function putRegistryRecord(r: Omit<RegistryRecord, 'reference'> & { reference?: string }) {
	const rec: RegistryRecord = { ...r, reference: r.reference || `ERP-SIM-${r.invoiceNumber}` }
	await run('INSERT INTO mock_registry (invoice_number, record) VALUES (?,?) ON CONFLICT(invoice_number) DO UPDATE SET record = excluded.record', [r.invoiceNumber, JSON.stringify(rec)])
}

export async function getRegistryRecord(invoiceNumber: string): Promise<RegistryRecord | undefined> {
	const row = await get<{ record: string }>('SELECT record FROM mock_registry WHERE invoice_number = ?', [invoiceNumber])
	return row ? (JSON.parse(row.record) as RegistryRecord) : undefined
}

export const deleteRegistryRecord = (invoiceNumber: string) => run('DELETE FROM mock_registry WHERE invoice_number = ?', [invoiceNumber])
