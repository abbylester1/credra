import { describe, expect, test } from 'vitest'
import { parseCreOutput } from '../src/lib/creParse'

const ID = '0xe4f729cc5c74e26942b90175714ea77f0711eb25e5ea3b3620ff097d6805a571'
const report = (o: object) => JSON.stringify(JSON.stringify(o))
const out = (line: string) => `Initializing...\n[USER LOG] verdict\n\n✓ Workflow Simulation Result:\n${line}\n\n[SIMULATION] done`

describe('parseCreOutput', () => {
	test('parses an ELIGIBLE result', () => {
		const r = parseCreOutput(
			out(report({ invoiceId: ID, verdict: 'ELIGIBLE', failedChecks: [], reviewReasons: [], externalReference: 'ERP-SIM-INV-1001', timestamp: 1 })),
			ID,
		)
		expect(r.verdict).toBe('ELIGIBLE')
		expect(r.externalReference).toBe('ERP-SIM-INV-1001')
	})
	test('parses REJECTED with failed checks and MANUAL_REVIEW', () => {
		const rej = parseCreOutput(out(report({ invoiceId: ID, verdict: 'REJECTED', failedChecks: ['amount_mismatch'] })), ID)
		expect(rej.verdict).toBe('REJECTED')
		expect(rej.failedChecks).toEqual(['amount_mismatch'])
		expect(parseCreOutput(out(report({ invoiceId: ID, verdict: 'MANUAL_REVIEW', reviewReasons: ['invoice_disputed_in_external_registry'] })), ID).verdict).toBe('MANUAL_REVIEW')
	})
	test('strips ANSI colour codes', () => {
		const r = parseCreOutput('\u001b[32m' + out(report({ invoiceId: ID, verdict: 'REJECTED' })) + '\u001b[0m', ID)
		expect(r.verdict).toBe('REJECTED')
	})
	test.each([
		['empty output', ''],
		['garbage', 'segfault core dumped'],
		['malformed json', out('"{not json}"')],
		['unknown verdict', out(report({ invoiceId: ID, verdict: 'APPROVED' }))],
		['missing verdict', out(report({ invoiceId: ID }))],
		['verdict in wrong case', out(report({ invoiceId: ID, verdict: 'eligible' }))],
		['not a string literal', out('{"invoiceId":"x","verdict":"ELIGIBLE"}')],
	])('%s becomes ERROR, never ELIGIBLE', (_n, text) => {
		expect(parseCreOutput(text, ID).verdict).toBe('ERROR')
	})
	test('a result for a different invoice is ERROR', () => {
		expect(parseCreOutput(out(report({ invoiceId: '0x' + '11'.repeat(32), verdict: 'ELIGIBLE' })), ID).verdict).toBe('ERROR')
	})
})
