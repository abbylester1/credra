import { describe, expect, test } from 'vitest'
import { applyMinimum, assess, DEFAULT_MIN_GRADE, gradeFromScore, meetsMinimum, parseGrade, type RiskInput } from '@/lib/risk'

const NOW = 1_800_000_000
const base = (over: Partial<RiskInput> = {}): RiskInput => ({
	verdict: 'ELIGIBLE',
	amount: '10000000000', // 10,000 USDT
	financingAmount: '9000000000', // 90%
	dueDate: NOW + 30 * 86400,
	nowSec: NOW,
	issuerRepaid: 0,
	issuerDefaulted: 0,
	buyerShare: null,
	...over,
})

describe('grade bands', () => {
	test.each([[100, 'A+'], [95, 'A+'], [94, 'A'], [90, 'A'], [89, 'A-'], [85, 'A-'], [84, 'B+'], [80, 'B+'], [79, 'B'], [75, 'B'], [74, 'B-'], [70, 'B-'], [69, 'C'], [0, 'C']])('score %i is %s', (s, g) => {
		expect(gradeFromScore(s)).toBe(g)
	})
})

describe('assess', () => {
	test('an unverified or rejected invoice is not rated', () => {
		for (const verdict of ['REJECTED', 'MANUAL_REVIEW', 'ERROR'] as const) {
			const r = assess(base({ verdict }))
			expect(r.rating).toBe('NR')
			expect(r.score).toBeNull()
		}
	})

	test('a short, modest, new-issuer invoice grades A, and every point is explained', () => {
		const r = assess(base())
		expect(r.score).toBe(92) // 100 - 4 (90% advance) - 4 (no history)
		expect(r.rating).toBe('A')
		expect(r.factors.map((f) => f.key)).toEqual(['tenor', 'advance', 'size', 'history'])
		expect(r.simulated).toBe(true)
	})

	test('longer tenor and a higher advance lower the grade', () => {
		const good = assess(base()).score!
		expect(assess(base({ dueDate: NOW + 120 * 86400 })).score!).toBeLessThan(good)
		expect(assess(base({ financingAmount: '9700000000' })).score!).toBeLessThan(good)
	})

	test('a repaid track record helps and a default hurts a lot', () => {
		const none = assess(base()).score!
		expect(assess(base({ issuerRepaid: 3 })).score!).toBeGreaterThan(none)
		expect(assess(base({ issuerDefaulted: 1 })).score!).toBeLessThanOrEqual(none - 20)
	})

	test('buyer concentration is only counted when there is data', () => {
		expect(assess(base({ buyerShare: null })).factors.some((f) => f.key === 'concentration')).toBe(false)
		const hi = assess(base({ buyerShare: 0.6 }))
		expect(hi.factors.find((f) => f.key === 'concentration')?.points).toBe(-8)
	})

	test('the score is clamped to 0..100', () => {
		const worst = assess(base({ dueDate: NOW + 400 * 86400, financingAmount: '9900000000', amount: '10000000000000', issuerDefaulted: 3, buyerShare: 0.9 }))
		expect(worst.score).toBeGreaterThanOrEqual(0)
		expect(worst.rating).toBe('C')
	})
})

describe('minimum grade', () => {
	test('parseGrade accepts a typographic minus and rejects junk', () => {
		expect(parseGrade('B−')).toBe('B-')
		expect(parseGrade(' a+ ')).toBe('A+')
		expect(parseGrade('AAA')).toBeNull()
		expect(parseGrade(undefined)).toBeNull()
	})

	test('meetsMinimum at the boundary', () => {
		expect(meetsMinimum('B-', 'B-')).toBe(true)
		expect(meetsMinimum('B', 'B-')).toBe(true)
		expect(meetsMinimum('C', 'B-')).toBe(false)
		expect(meetsMinimum('NR', 'C')).toBe(false)
	})

	test('an eligible invoice below the minimum is held for manual review', () => {
		const low = { ...assess(base()), rating: 'C' as const }
		expect(applyMinimum('ELIGIBLE', low, DEFAULT_MIN_GRADE)).toEqual({ verdict: 'MANUAL_REVIEW', reviewReason: 'grade_below_minimum' })
	})

	test('an eligible invoice at or above the minimum stays eligible', () => {
		expect(applyMinimum('ELIGIBLE', assess(base()), DEFAULT_MIN_GRADE)).toEqual({ verdict: 'ELIGIBLE', reviewReason: null })
	})

	test('fail safe: no assessment means manual review, never eligible', () => {
		expect(applyMinimum('ELIGIBLE', null, DEFAULT_MIN_GRADE)).toEqual({ verdict: 'MANUAL_REVIEW', reviewReason: 'risk_check_unavailable' })
	})

	test('it never upgrades: rejected and review verdicts pass through', () => {
		const a = assess(base())
		expect(applyMinimum('REJECTED', a, 'C').verdict).toBe('REJECTED')
		expect(applyMinimum('MANUAL_REVIEW', a, 'C').verdict).toBe('MANUAL_REVIEW')
	})

	test('raising the minimum can hold back an invoice that passed before', () => {
		const a = assess(base()) // grade A
		expect(applyMinimum('ELIGIBLE', a, 'A').verdict).toBe('ELIGIBLE')
		expect(applyMinimum('ELIGIBLE', a, 'A+').verdict).toBe('MANUAL_REVIEW')
	})
})
