import { fail, isBytes32, json } from '@/lib/api'
import { readInvoice } from '@/lib/chain'
import { reportRef } from '@/lib/hash'
import { getInvoiceRow, insertEvent, insertRun } from '@/lib/repo'
import { isOperator } from '@/lib/session'
import { recordVerification } from '@/lib/signer'
import { canVerify, statusLabel } from '@/lib/status'
import { runRiskCheck } from '@/lib/riskService'
import { runVerification } from '@/lib/verify'
import { verdictToStatus } from '@/lib/verdictMap'
import { verifyWalletHeaders } from '@/lib/walletAuth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Runs the real CRE workflow, then records the verdict onchain with the verifier wallet.
 * This is an application-authorised transaction, not a DON-signed write (constitution I).
 * Any CRE failure maps to UnderReview, never Eligible (constitution II).
 */
export async function POST(req: Request, ctx: { params: Promise<{ invoiceId: string }> }) {
	const { invoiceId } = await ctx.params
	if (!isBytes32(invoiceId)) return fail(400, 'bad_id', 'Invalid invoice id.')
	const row = await getInvoiceRow(invoiceId)
	if (!row) return fail(404, 'not_found', 'Invoice not found.')

	const operator = await isOperator()
	const wallet = operator ? null : await verifyWalletHeaders(req.headers)
	if (!operator && wallet !== row.issuer_wallet) return fail(403, 'forbidden', 'Only the issuer or the operator can verify this invoice.')

	let chain
	try {
		chain = await readInvoice(invoiceId)
	} catch {
		return fail(502, 'chain_unavailable', 'Could not read the chain right now. Nothing was changed. Try again.')
	}
	if (!canVerify(chain.status)) return fail(409, 'not_verifiable', `This invoice is ${statusLabel(chain.status).toLowerCase()} and cannot be verified again.`)

	const cre = await runVerification(invoiceId, row.invoice_number)
	// Backend risk engine: grade the invoice and apply the minimum-grade policy. It can only make the outcome more cautious.
	const outcome = await runRiskCheck(row, chain, cre.verdict, cre.reviewReasons)
	const verdict = outcome.verdict
	const reviewReasons = outcome.reviewReasons
	const riskJson = JSON.stringify({ ...outcome.risk, minGrade: outcome.minGrade, downgraded: outcome.downgraded })
	const status = verdictToStatus(verdict)
	const ref = reportRef(`${cre.reportJson}\n${riskJson}`)
	const riskCols = { risk_grade: outcome.risk?.rating ?? null, risk_score: outcome.risk?.score ?? null, risk_json: riskJson }

	let txHash: string | null = null
	try {
		txHash = await recordVerification(invoiceId, status, ref)
	} catch {
		await insertRun({
			invoice_id: row.invoice_id, verdict, failed_checks: JSON.stringify(cre.failedChecks),
			review_reasons: JSON.stringify([...reviewReasons, 'record_failed']), external_reference: cre.externalReference,
			report_json: cre.reportJson, verification_ref: ref, record_tx: null, source_simulated: 1, ...riskCols,
		})
		return fail(502, 'record_failed', 'Verification ran but the result could not be recorded onchain. The invoice status did not change. Try again.')
	}

	await insertRun({
		invoice_id: row.invoice_id, verdict, failed_checks: JSON.stringify(cre.failedChecks),
		review_reasons: JSON.stringify(reviewReasons), external_reference: cre.externalReference,
		report_json: cre.reportJson, verification_ref: ref, record_tx: txHash, source_simulated: 1, ...riskCols,
	})
	await insertEvent({ invoice_id: row.invoice_id, status: statusLabel(status), tx_hash: txHash, source: 'verification', actor: 'verifier wallet' })

	return json({
		verdict,
		failedChecks: cre.failedChecks,
		reviewReasons,
		risk: outcome.risk ? { rating: outcome.risk.rating, score: outcome.risk.score, minGrade: outcome.minGrade, downgraded: outcome.downgraded } : null,
		externalReference: cre.externalReference,
		status,
		recordTx: txHash,
		simulated: true,
		engine: cre.reportJson.includes('in-process-rules') ? 'in-process-rules' : 'cre-simulation',
		recordedBy: 'application-verifier-wallet',
	})
}
