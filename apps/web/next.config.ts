import type { NextConfig } from 'next'
import path from 'node:path'

// Load the repository-root .env (testnet-only keys). Server code only; nothing is exposed to the browser.
try {
	process.loadEnvFile(path.resolve(__dirname, '../../.env'))
} catch {
	// .env is optional at build time
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
