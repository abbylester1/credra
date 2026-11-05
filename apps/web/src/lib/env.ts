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
	get uploadsDir() {
		return process.env.UPLOADS_DIR ?? path.resolve(process.cwd(), 'uploads')
	},
	get dbFile() {
		return process.env.DB_FILE ?? path.resolve(process.cwd(), 'credra.db')
	},
}

function req(name: string): string {
	const v = process.env[name]
	if (!v) throw new Error(`Missing environment variable ${name}`)
	return v
}
