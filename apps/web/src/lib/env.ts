import 'server-only'
import path from 'node:path'

// Server-only configuration. Secrets here must never reach the browser (constitution III).
export const env = {
	get verifierKey() {
		return req('PRIVATE_KEY_VERIFIER') as `0x${string}`
	},
	get adminKey() {
		return req('PRIVATE_KEY_DEPLOYER') as `0x${string}`
	},
	get operatorPasscode() {
		return process.env.OPERATOR_PASSCODE ?? ''
	},
	get mockRegistryUrl() {
		return process.env.MOCK_REGISTRY_URL ?? 'http://127.0.0.1:8787'
	},
	get creDir() {
		return process.env.CRE_DIR ?? path.resolve(process.cwd(), '../../cre')
	},
	/** libSQL URL: a hosted database (libsql://...) on Vercel, or a local file in development. */
	get databaseUrl() {
		if (process.env.DATABASE_URL) return process.env.DATABASE_URL
		const file = process.env.DB_FILE ?? path.resolve(process.cwd(), 'credra.db')
		return `file:${file}`
	},
	get databaseAuthToken() {
		return process.env.DATABASE_AUTH_TOKEN ?? ''
	},
	/**
	 * 'cre': run the real CRE workflow simulation with the CRE CLI (local development, the recorded demo).
	 * 'inprocess': run the same eligibility rules inside the app (hosted demo, where the CLI is not installed).
	 */
	get verifyMode(): 'cre' | 'inprocess' {
		const v = process.env.VERIFY_MODE
		if (v === 'cre' || v === 'inprocess') return v
		return process.env.VERCEL ? 'inprocess' : 'cre'
	},
	
}

function req(name: string): string {
	const v = process.env[name]
	if (!v) throw new Error(`Missing environment variable ${name}`)
	return v
}
