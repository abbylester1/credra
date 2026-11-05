import { describe, expect, test } from 'vitest'
import { verdictToStatus } from '../src/lib/verdictMap'
import { reportRef } from '../src/lib/hash'
import { Status } from '../src/lib/status'

describe('verdictToStatus (constitution II)', () => {
	test('maps each verdict', () => {
		expect(verdictToStatus('ELIGIBLE')).toBe(Status.Eligible)
		expect(verdictToStatus('REJECTED')).toBe(Status.Rejected)
		expect(verdictToStatus('MANUAL_REVIEW')).toBe(Status.UnderReview)
		expect(verdictToStatus('ERROR')).toBe(Status.UnderReview)
	})
	test('nothing except the exact string ELIGIBLE can yield Eligible', () => {
		for (const v of ['', 'eligible', 'APPROVED', 'OK', 'true', 'undefined', 'ELIGIBLE ', 'ELIGIBLE\n']) {
			expect(verdictToStatus(v)).not.toBe(Status.Eligible)
		}
	})
	test('verificationRef is keccak256 of the report json and deterministic', () => {
		expect(reportRef('{"a":1}')).toMatch(/^0x[0-9a-f]{64}$/)
		expect(reportRef('{"a":1}')).toBe(reportRef('{"a":1}'))
		expect(reportRef('{"a":1}')).not.toBe(reportRef('{"a":2}'))
	})
})
