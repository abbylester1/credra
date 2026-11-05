// Pure eligibility rules. No I/O, so they are unit-testable outside the CRE runtime.

export type Verdict = 'ELIGIBLE' | 'REJECTED' | 'MANUAL_REVIEW'

/** Invoice as read from the Whitechain InvoiceRegistry. */
export type OnchainInvoice = {
	exists: boolean
	status: number // InvoiceRegistry.Status
	documentHash: string
	buyerRef: string
	issuer: string
	amount: string // base units, decimal string
	financingAmount: string
	dueDate: number // unix seconds
}

/** Record returned by the external verification API (simulated ERP/registry). */
export type ExternalRecord = {
	reachable: boolean // false = network error / 5xx / unparsable
	found: boolean // false = 404
	issuerWallet: string
	buyerRef: string
	amount: string
	dueDate: number
	documentHash: string
	status: string // 'valid' | 'disputed' | ...
	reference: string
}

export type Evaluation = { verdict: Verdict; failedChecks: string[]; reviewReasons: string[] }

// InvoiceRegistry.Status enum values
const STATUS_SUBMITTED = 1
const STATUS_UNDER_REVIEW = 2

const eq = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

export function evaluate(onchain: OnchainInvoice, ext: ExternalRecord, nowSec: number): Evaluation {
	const failed: string[] = []
	const review: string[] = []

	// --- onchain state checks (duplicate / already financed)
	if (!onchain.exists) {
		failed.push('invoice_not_registered_onchain')
		return { verdict: 'REJECTED', failedChecks: failed, reviewReasons: review }
	}
	if (onchain.status !== STATUS_SUBMITTED && onchain.status !== STATUS_UNDER_REVIEW) {
		failed.push('invoice_already_processed_or_financed')
		return { verdict: 'REJECTED', failedChecks: failed, reviewReasons: review }
	}

	// --- term sanity
	let amount = 0n
	let advance = 0n
	try {
		amount = BigInt(onchain.amount)
		advance = BigInt(onchain.financingAmount)
	} catch {
		failed.push('invalid_amounts')
	}
	if (amount <= 0n) failed.push('amount_not_positive')
	if (advance <= 0n || advance >= amount) failed.push('financing_amount_invalid')
	if (onchain.dueDate <= nowSec) failed.push('due_date_not_in_future')

	// --- external verification
	if (!ext.reachable) {
		// Fail safe: an outage must never approve an invoice.
		review.push('external_api_unavailable')
	} else if (!ext.found) {
		failed.push('invoice_not_found_in_external_registry')
	} else {
		if (!eq(ext.issuerWallet, onchain.issuer)) failed.push('issuer_mismatch')
		if (!eq(ext.buyerRef, onchain.buyerRef)) failed.push('buyer_mismatch')
		if (ext.amount !== onchain.amount) failed.push('amount_mismatch')
		if (ext.dueDate !== onchain.dueDate) failed.push('due_date_mismatch')
		if (!eq(ext.documentHash, onchain.documentHash)) failed.push('document_hash_mismatch')
		if (ext.status === 'disputed') review.push('invoice_disputed_in_external_registry')
		else if (ext.status !== 'valid') failed.push('external_status_not_valid')
	}

	if (failed.length > 0) return { verdict: 'REJECTED', failedChecks: failed, reviewReasons: review }
	if (review.length > 0) return { verdict: 'MANUAL_REVIEW', failedChecks: failed, reviewReasons: review }
	return { verdict: 'ELIGIBLE', failedChecks: [], reviewReasons: [] }
}
