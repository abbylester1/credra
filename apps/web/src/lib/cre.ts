import 'server-only'
import { spawn } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { creError, parseCreOutput, type CreResult } from './creParse'
import { env } from './env'

const TIMEOUT_MS = 90_000

/**
 * Runs the real CRE workflow simulation for one invoice (plan decision D3).
 * Any failure (missing CLI, not logged in, timeout, bad output) returns verdict ERROR,
 * which the caller maps to manual review and never to Eligible.
 */
export function runCreVerification(invoiceId: string, invoiceNumber: string): Promise<CreResult> {
	return new Promise((resolve) => {
		const payload = JSON.stringify({ invoiceId, invoiceNumber })
		const home = os.homedir()
		const PATH = [path.join(home, '.local/bin'), path.join(home, '.bun/bin'), process.env.PATH ?? ''].join(':')
		let out = ''
		let done = false
		const finish = (r: CreResult) => {
			if (done) return
			done = true
			clearTimeout(timer)
			resolve(r)
		}
		let child
		try {
			child = spawn(
				'cre',
				['workflow', 'simulate', 'invoice-verification', '-T', 'staging-settings', '--non-interactive', '--trigger-index', '0', '--http-payload', payload],
				{ cwd: env.creDir, env: { ...process.env, PATH } },
			)
		} catch {
			return resolve(creError('cli_not_found'))
		}
		const timer = setTimeout(() => {
			child.kill('SIGKILL')
			finish(creError('timeout'))
		}, TIMEOUT_MS)
		child.stdout.on('data', (d) => (out += d.toString()))
		child.stderr.on('data', (d) => (out += d.toString()))
		child.on('error', () => finish(creError('cli_not_found')))
		child.on('close', () => finish(parseCreOutput(out, invoiceId)))
	})
}
