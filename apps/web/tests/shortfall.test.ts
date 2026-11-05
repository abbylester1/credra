import { describe, expect, test } from 'vitest'
import { computeShortfall } from '../src/lib/shortfall'

const R = 9_000_000_000n
describe('computeShortfall', () => {
	test('ready only with enough balance and allowance', () => {
		expect(computeShortfall({ balance: R, allowance: R, required: R })).toEqual({ missingBalance: 0n, needsApproval: false, ready: true })
	})
	test('reports the exact missing balance', () => {
		const s = computeShortfall({ balance: 0n, allowance: 0n, required: R })
		expect(s.missingBalance).toBe(R)
		expect(s.needsApproval).toBe(true)
		expect(s.ready).toBe(false)
		expect(computeShortfall({ balance: R - 1n, allowance: R, required: R }).missingBalance).toBe(1n)
	})
	test('allowance one unit short still needs approval', () => {
		const s = computeShortfall({ balance: R, allowance: R - 1n, required: R })
		expect(s.needsApproval).toBe(true)
		expect(s.ready).toBe(false)
	})
	test('extra balance and allowance are fine', () => {
		expect(computeShortfall({ balance: R * 2n, allowance: R * 3n, required: R }).ready).toBe(true)
	})
})
