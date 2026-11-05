import { describe, expect, test } from 'vitest'
import { buyerRef, documentHash, invoiceId, reportRef } from '../src/lib/hash'

describe('hash', () => {
	test('invoiceId matches the seeded INV-1001 id', () => {
		expect(invoiceId('INV-1001')).toBe('0xe4f729cc5c74e26942b90175714ea77f0711eb25e5ea3b3620ff097d6805a571')
	})
	test('same bytes give the same hash; different bytes differ', () => {
		const a = new Uint8Array([1, 2, 3])
		expect(documentHash(a)).toBe(documentHash(new Uint8Array([1, 2, 3])))
		expect(documentHash(a)).not.toBe(documentHash(new Uint8Array([1, 2, 4])))
	})
	test('buyerRef is a bytes32 hash, not plaintext', () => {
		expect(buyerRef('Acme Corp')).toMatch(/^0x[0-9a-f]{64}$/)
	})
	test('reportRef is deterministic', () => {
		expect(reportRef('{"a":1}')).toBe(reportRef('{"a":1}'))
	})
})
