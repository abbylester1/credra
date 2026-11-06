import type { NextConfig } from 'next'
import path from 'node:path'

// Load the repository-root .env (testnet-only keys). Server code only; nothing is exposed to the browser.
// The hosted database settings may live there for scripts (migration), but local dev must keep using its own SQLite file,
// so DATABASE_* is only honoured when it is set in the real environment (for example on Vercel).
const hosted = { url: process.env.DATABASE_URL, token: process.env.DATABASE_AUTH_TOKEN }
try {
	process.loadEnvFile(path.resolve(__dirname, '../../.env'))
} catch {
	// .env is optional at build time
}
for (const [key, before] of [['DATABASE_URL', hosted.url], ['DATABASE_AUTH_TOKEN', hosted.token]] as const) {
	if (before === undefined) delete process.env[key]
	else process.env[key] = before
}

const nextConfig: NextConfig = {
	// NEXT_DIST_DIR lets a production build run next to a live dev server (for example while recording a demo).
	distDir: process.env.NEXT_DIST_DIR || '.next',
	turbopack: {
		// Locally the repo root (for the shared .env); on Vercel the project root, which is the Root Directory apps/web.
		root: process.env.VERCEL ? __dirname : path.resolve(__dirname, '../..'),
		rules: {
			'*.css': {
				loaders: ['@tailwindcss/turbopack'],
				as: '*.css',
			},
		},
	},
	serverExternalPackages: ['@libsql/client', 'libsql'],
}

export default nextConfig
