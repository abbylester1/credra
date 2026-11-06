import 'server-only'
import { createClient, type Client, type InValue } from '@libsql/client'
import { env } from './env'
import { SCHEMA } from './schema'

// Off-chain data only. The chain is the source of truth for invoice status (data-model.md).
// libSQL speaks SQLite: a local file in development, a hosted database (Turso) on Vercel.
// Set DATABASE_URL (and DATABASE_AUTH_TOKEN) to use a hosted database; otherwise it uses file:credra.db.


let client: Client | null = null
let ready: Promise<Client> | null = null

/** Returns the shared client once the schema exists. Safe to call on every request. */
export function db(): Promise<Client> {
	if (ready) return ready
	ready = (async () => {
		client = createClient({ url: env.databaseUrl, authToken: env.databaseAuthToken || undefined })
		await client.executeMultiple(SCHEMA)
		// Databases created before documents moved into the database have no content column yet.
		try {
			await client.execute('ALTER TABLE documents ADD COLUMN content BLOB')
		} catch {
			// column already exists
		}
		return client
	})()
	ready.catch(() => { ready = null })
	return ready
}

type Row = Record<string, unknown>

/** All rows as plain objects. */
export async function all<T = Row>(sql: string, args: InValue[] = []): Promise<T[]> {
	const c = await db()
	const res = await c.execute({ sql, args })
	return res.rows.map((r) => Object.fromEntries(res.columns.map((col) => [col, r[col]]))) as T[]
}

/** First row, or undefined. */
export async function get<T = Row>(sql: string, args: InValue[] = []): Promise<T | undefined> {
	return (await all<T>(sql, args))[0]
}

/** Runs a write. */
export async function run(sql: string, args: InValue[] = []): Promise<void> {
	const c = await db()
	await c.execute({ sql, args })
}
