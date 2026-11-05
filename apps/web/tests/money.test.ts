import { describe, expect, test } from 'vitest'
import { formatUsdt, parseUsdt } from '../src/lib/money'

describe('money', () => {
	test('parses whole and fractional amounts', () => {
		expect(parseUsdt('10000')).toBe(10_000_000_000n)
		expect(parseUsdt('10000.5')).toBe(10_000_500_000n)
		expect(parseUsdt('10000.000001')).toBe(10_000_000_001n)
		expect(parseUsdt('0')).toBe(0n)
	})
	test('rejects more than 6 decimals, negatives and junk', () => {
		expect(() => parseUsdt('1.0000001')).toThrow('too_many_decimals')
		expect(() => parseUsdt('-1')).toThrow('invalid_amount')
		expect(() => parseUsdt('abc')).toThrow('invalid_amount')
		expect(() => parseUsdt('')).toThrow('invalid_amount')
	})
	test('formats and round-trips without float error', () => {
		expect(formatUsdt(10_000_500_000n)).toBe('10000.5')
		expect(formatUsdt(1n)).toBe('0.000001')
		expect(formatUsdt(0n)).toBe('0')
		for (const s of ['9000', '0.1', '123456.789012']) expect(formatUsdt(parseUsdt(s))).toBe(s)
	})
})
