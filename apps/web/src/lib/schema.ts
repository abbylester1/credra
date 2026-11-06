// Shared by the app (lib/db.ts) and scripts/migrate-to-hosted-db.ts. No server-only import, so scripts can use it.
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS invoices (
	invoice_id TEXT PRIMARY KEY,
	invoice_number TEXT NOT NULL UNIQUE,
	issuer_wallet TEXT NOT NULL,
	issuer_name TEXT NOT NULL,
	buyer_name TEXT NOT NULL,
	buyer_ref TEXT NOT NULL,
	currency TEXT NOT NULL,
	amount TEXT NOT NULL,
	financing_amount TEXT NOT NULL,
	invoice_date INTEGER NOT NULL,
	due_date INTEGER NOT NULL,
	document_hash TEXT NOT NULL UNIQUE,
	submit_tx TEXT NOT NULL,
	created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS documents (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	invoice_id TEXT NOT NULL,
	storage_path TEXT NOT NULL DEFAULT '',
	document_hash TEXT NOT NULL,
	mime_type TEXT NOT NULL,
	size_bytes INTEGER NOT NULL,
	content BLOB
);
CREATE TABLE IF NOT EXISTS verification_runs (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	invoice_id TEXT NOT NULL,
	verdict TEXT NOT NULL,
	failed_checks TEXT NOT NULL,
	review_reasons TEXT NOT NULL,
	external_reference TEXT,
	report_json TEXT NOT NULL,
	verification_ref TEXT NOT NULL,
	record_tx TEXT,
	source_simulated INTEGER NOT NULL DEFAULT 1,
	created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS operator_decisions (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	invoice_id TEXT NOT NULL,
	decision TEXT NOT NULL,
	reason TEXT NOT NULL,
	tx_hash TEXT NOT NULL,
	created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS status_events (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	invoice_id TEXT NOT NULL,
	status TEXT NOT NULL,
	tx_hash TEXT,
	source TEXT NOT NULL,
	actor TEXT,
	created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS wallet_labels (
	wallet TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	role TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS mock_registry (
	invoice_number TEXT PRIMARY KEY,
	record TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_invoice ON status_events (invoice_id);
CREATE INDEX IF NOT EXISTS idx_runs_invoice ON verification_runs (invoice_id);
`
