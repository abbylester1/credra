import 'server-only'
import { readInvoice } from './chain'
import { creError, type CreResult } from './creParse'
import { readRegistry } from './registry'
import { evaluate, type ExternalRecord, type OnchainInvoice } from './rules'

const EMPTY: ExternalRecord = { reachable: false, found: false, issuerWallet: '', buyerRef: '', amount: '', dueDate: 0, documentHash: '', status: '', reference: '' }

/**
 * Hosted-demo verification: the same eligibility rules as the CRE workflow, run inside the app because the CRE CLI is not
 * available on this host. It is NOT a CRE run and the report says so (engine). Any failure maps to ERROR, never to ELIGIBLE.
 */
export async function runInProcessVerification(invoiceId: string, invoiceNumber: string): Promise<CreResult> {
	let onchain: OnchainInvoice
	try {
		const c = await readInvoice(invoiceId as `0x${string}`)
		onchain = {
			exists: c.status !== 0,
			status: c.status,
			documentHash: c.documentHash,
			buyerRef: c.buyerRef,
			issuer: c.issuer,
			amount: c.amount.toString(),
			financingAmount: c.financingAmount.toString(),
			dueDate: Number(c.dueDate),
		}
	} catch {
		return creError('chain_unavailable')
	}

	let ext: ExternalRecord
	try {
		const rec = await readRegistry(invoiceNumber)
		ext = rec
			? { reachable: true, found: true, issuerWallet: rec.issuerWallet, buyerRef: rec.buyerRef, amount: rec.amount, dueDate: rec.dueDate, documentHash: rec.documentHash, status: rec.status, reference: rec.reference }
			: { ...EMPTY, reachable: true, found: false }
	} catch {
		ext = EMPTY // registry unreachable: the rules fail safe to MANUAL_REVIEW
	}

	const nowSec = Math.floor(Date.now() / 1000)
	const result = evaluate(onchain, ext, nowSec)
	const report = {
		invoiceId,
		documentHash: onchain.documentHash,
		verdict: result.verdict,
		failedChecks: result.failedChecks,
		reviewReasons: result.reviewReasons,
		externalReference: ext.reference || null,
		timestamp: nowSec,
		engine: 'in-process-rules',
	}
	return {
		verdict: result.verdict,
		failedChecks: result.failedChecks,
		reviewReasons: result.reviewReasons,
		externalReference: ext.reference || null,
		reportJson: JSON.stringify(report),
	}
}
