import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const readInvoice = vi.fn()
const readRegistry = vi.fn()
vi.mock('@/lib/chain', () => ({ readInvoice }))
vi.mock('@/lib/registry', () => ({ readRegistry }))

const ID = '0x' + 'ab'.repeat(32)
const ISSUER = '0x2db88d68C80B1353Bc7ea4f845992FE3535f495a'
const future = Math.floor(Date.now() / 1000) + 30 * 86400
const chain = (over: object = {}) => ({
	status: 1, documentHash: '0x' + '11'.repeat(32), buyerRef: '0x' + '22'.repeat(32), issuer: ISSUER,
	amount: 50_000_000_000n, financingAmount: 45_000_000_000n, dueDate: BigInt(future), ...over,
})
const record = (over: object = {}) => ({
	invoiceNumber: 'N-1', issuerName: 'Meridian Textiles Ltd', issuerWallet: ISSUER, buyerName: 'Acme Corp', buyerRef: '0x' + '22'.repeat(32),
	amount: '50000000000', dueDate: future, documentHash: '0x' + '11'.repeat(32), status: 'valid', reference: 'ERP-SIM-N-1', ...over,
})

describe('runInProcessVerification (hosted demo engine)', () => {
	beforeEach(() => { readInvoice.mockReset(); readRegistry.mockReset() })

	test('a fully matching invoice is ELIGIBLE and the report names the engine', async () => {
		readInvoice.mockResolvedValue(chain()); readRegistry.mockResolvedValue(record())
		const { runInProcessVerification } = await import('@/lib/verifyInProcess')
		const r = await runInProcessVerification(ID, 'N-1')
		expect(r.verdict).toBe('ELIGIBLE')
		expect(JSON.parse(r.reportJson).engine).toBe('in-process-rules')
	})

	test('a mismatching amount is REJECTED', async () => {
		readInvoice.mockResolvedValue(chain()); readRegistry.mockResolvedValue(record({ amount: '49500000000' }))
		const { runInProcessVerification } = await import('@/lib/verifyInProcess')
		const r = await runInProcessVerification(ID, 'N-1')
		expect(r.verdict).toBe('REJECTED')
		expect(r.failedChecks).toContain('amount_mismatch')
	})

	test('an unreachable registry fails safe to MANUAL_REVIEW, never ELIGIBLE', async () => {
		readInvoice.mockResolvedValue(chain()); readRegistry.mockRejectedValue(new Error('down'))
		const { runInProcessVerification } = await import('@/lib/verifyInProcess')
		const r = await runInProcessVerification(ID, 'N-1')
		expect(r.verdict).toBe('MANUAL_REVIEW')
		expect(r.reviewReasons).toContain('external_api_unavailable')
	})

	test('a chain read failure is ERROR, which the caller maps to review', async () => {
		readInvoice.mockRejectedValue(new Error('rpc')); readRegistry.mockResolvedValue(record())
		const { runInProcessVerification } = await import('@/lib/verifyInProcess')
		expect((await runInProcessVerification(ID, 'N-1')).verdict).toBe('ERROR')
	})
})
