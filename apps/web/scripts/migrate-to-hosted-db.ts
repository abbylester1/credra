// Copies the local demo data into a hosted libSQL database (Turso) so the Vercel deployment starts with the same history.
// Usage (from apps/web):
//   DATABASE_URL=libsql://<db>.turso.io DATABASE_AUTH_TOKEN=<token> bun scripts/migrate-to-hosted-db.ts
// Source defaults to the local file credra.db; override with SOURCE_URL. Safe to re-run (rows are replaced by key).
import { createClient } from '@libsql/client'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { SCHEMA } from '../src/lib/schema'

const target = process.env.DATABASE_URL
if (!target) throw new Error('Set DATABASE_URL (and DATABASE_AUTH_TOKEN for a hosted database).')
const src = createClient({ url: process.env.SOURCE_URL ?? `file:${path.resolve(__dirname, '../credra.db')}` })
const dst = createClient({ url: target, authToken: process.env.DATABASE_AUTH_TOKEN || undefined })

async function main() {
	await dst.executeMultiple(SCHEMA)
	try { await dst.execute('ALTER TABLE documents ADD COLUMN content BLOB') } catch { /* already there */ }

	const tables: [string, string[]][] = [
		['invoices', ['invoice_id', 'invoice_number', 'issuer_wallet', 'issuer_name', 'buyer_name', 'buyer_ref', 'currency', 'amount', 'financing_amount', 'invoice_date', 'due_date', 'document_hash', 'submit_tx', 'created_at']],
		['verification_runs', ['id', 'invoice_id', 'verdict', 'failed_checks', 'review_reasons', 'external_reference', 'report_json', 'verification_ref', 'record_tx', 'source_simulated', 'created_at']],
		['operator_decisions', ['id', 'invoice_id', 'decision', 'reason', 'tx_hash', 'created_at']],
		['status_events', ['id', 'invoice_id', 'status', 'tx_hash', 'source', 'actor', 'created_at']],
		['wallet_labels', ['wallet', 'name', 'role']],
	]
	for (const [table, cols] of tables) {
		const rows = (await src.execute(`SELECT ${cols.join(', ')} FROM ${table}`)).rows
		for (const r of rows) {
			await dst.execute({ sql: `INSERT OR REPLACE INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`, args: cols.map((c) => r[c] as never) })
		}
		console.log(`${table}: ${rows.length} rows`)
	}

	// Documents: keep the bytes in the database. Older rows only have a file path, so read the file if it is still on disk.
	const srcCols = (await src.execute('PRAGMA table_info(documents)')).rows.map((r) => String(r.name))
	const hasContent = srcCols.includes('content') // older local databases keep documents on disk only
	const docs = (await src.execute(`SELECT id, invoice_id, storage_path, document_hash, mime_type, size_bytes${hasContent ? ', content' : ''} FROM documents`)).rows
	let copied = 0, missing = 0
	for (const d of docs) {
		let content: Uint8Array | null = d.content ? new Uint8Array(d.content as ArrayBuffer) : null
		if (!content && d.storage_path && existsSync(String(d.storage_path))) content = new Uint8Array(readFileSync(String(d.storage_path)))
		if (!content) missing++
		await dst.execute({
			sql: 'INSERT OR REPLACE INTO documents (id, invoice_id, storage_path, document_hash, mime_type, size_bytes, content) VALUES (?,?,?,?,?,?,?)',
			args: [d.id as number, d.invoice_id as string, '', d.document_hash as string, d.mime_type as string, d.size_bytes as number, content],
		})
		if (content) copied++
	}
	console.log(`documents: ${docs.length} rows (${copied} with file content, ${missing} without)`)

	// Simulated registry records (apps/mock-registry/data.json) -> mock_registry table
	const regFile = path.resolve(__dirname, '../../mock-registry/data.json')
	if (existsSync(regFile)) {
		const reg = JSON.parse(readFileSync(regFile, 'utf-8')) as Record<string, unknown>
		for (const [num, rec] of Object.entries(reg)) await dst.execute({ sql: 'INSERT OR REPLACE INTO mock_registry (invoice_number, record) VALUES (?,?)', args: [num, JSON.stringify(rec)] })
		console.log(`mock_registry: ${Object.keys(reg).length} records`)
	}
	console.log('Done.')
}
main().catch((e) => { console.error(e); process.exit(1) })
