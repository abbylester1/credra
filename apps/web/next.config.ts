import type { NextConfig } from 'next'
import path from 'node:path'

// Load the repository-root .env (testnet-only keys). Server code only; nothing is exposed to the browser.
try {
	process.loadEnvFile(path.resolve(__dirname, '../../.env'))
} catch {
	// .env is optional at build time
}

const nextConfig: NextConfig = {
	turbopack: {
		root: path.resolve(__dirname, '../..'),
		rules: {
			'*.css': {
				loaders: ['@tailwindcss/turbopack'],
				as: '*.css',
			},
		},
	},
	serverExternalPackages: ['node:sqlite'],
}

export default nextConfig
