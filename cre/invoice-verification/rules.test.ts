import { describe, expect, test } from 'bun:test'
import { evaluate, type ExternalRecord, type OnchainInvoice } from './rules'

const NOW = 1_800_000_000
const on: OnchainInvoice = {
	exists: true, status: 1, documentHash: '0xaa', buyerRef: '0xbb', issuer: '0xAbC',
	amount: '10000', financingAmount: '9000', dueDate: NOW + 1000,
}
const ext: ExternalRecord = {
	reachable: true, found: true, issuerWallet: '0xabc', buyerRef: '0xBB', amount: '10000',
	dueDate: NOW + 1000, documentHash: '0xAA', status: 'valid', reference: 'ERP-1',
}

describe('evaluate', () => {
	test('matching records are ELIGIBLE (case-insensitive hex)', () => {
		expect(evaluate(on, ext, NOW).verdict).toBe('ELIGIBLE')
	})
	test('API outage fails safe to MANUAL_REVIEW, never ELIGIBLE', () => {
		const r = evaluate(on, { ...ext, reachable: false }, NOW)
		expect(r.verdict).toBe('MANUAL_REVIEW')
		expect(r.reviewReasons).toContain('external_api_unavailable')
	})
	test('not found externally is REJECTED', () => {
		expect(evaluate(on, { ...ext, found: false }, NOW).failedChecks).toContain('invoice_not_found_in_external_registry')
	})
	test('amount mismatch is REJECTED', () => {
		expect(evaluate(on, { ...ext, amount: '9999' }, NOW).verdict).toBe('REJECTED')
	})
	test('issuer / buyer / hash / due date mismatches are each flagged', () => {
		const r = evaluate(on, { ...ext, issuerWallet: '0x1', buyerRef: '0x2', documentHash: '0x3', dueDate: 5 }, NOW)
		expect(r.failedChecks).toEqual(['issuer_mismatch', 'buyer_mismatch', 'due_date_mismatch', 'document_hash_mismatch'])
	})
	test('disputed goes to MANUAL_REVIEW', () => {
		expect(evaluate(on, { ...ext, status: 'disputed' }, NOW).verdict).toBe('MANUAL_REVIEW')
	})
	test('void external status is REJECTED', () => {
		expect(evaluate(on, { ...ext, status: 'void' }, NOW).verdict).toBe('REJECTED')
	})
	test('already funded onchain is REJECTED', () => {
		expect(evaluate({ ...on, status: 5 }, ext, NOW).failedChecks).toContain('invoice_already_processed_or_financed')
	})
	test('unregistered invoice is REJECTED', () => {
		expect(evaluate({ ...on, exists: false }, ext, NOW).verdict).toBe('REJECTED')
	})
	test('past due date is REJECTED', () => {
		expect(evaluate({ ...on, dueDate: NOW - 1 }, { ...ext, dueDate: NOW - 1 }, NOW).failedChecks).toContain('due_date_not_in_future')
	})
	test('advance >= face value is REJECTED', () => {
		expect(evaluate({ ...on, financingAmount: '10000' }, ext, NOW).failedChecks).toContain('financing_amount_invalid')
	})
})
