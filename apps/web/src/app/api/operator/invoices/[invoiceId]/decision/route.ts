import { z } from 'zod'
import { fail, isBytes32, json } from '@/lib/api'
import { readInvoice } from '@/lib/chain'
import { reportRef } from '@/lib/hash'
import { getInvoiceRow, insertDecision, insertEvent } from '@/lib/repo'
import { isOperator } from '@/lib/session'
import { recordVerification } from '@/lib/signer'
import { Status, statusLabel } from '@/lib/status'

export const dynamic = 'force-dynamic'

/** Operator approves or rejects an invoice that is under review. A written reason is required. */
export async function POST(req: Request, ctx: { params: Promise<{ invoiceId: string }> }) {
	if (!(await isOperator())) return fail(403, 'operator_only', 'Operator access required.')
	const { invoiceId } = await ctx.params
	if (!isBytes32(invoiceId)) return fail(400, 'bad_id', 'Invalid invoice id.')
	if (!getInvoiceRow(invoiceId)) return fail(404, 'not_found', 'Invoice not found.')
	const body = z.object({ decision: z.enum(['APPROVE', 'REJECT']), reason: z.string().trim().min(10).max(500) }).safeParse(await req.json().catch(() => null))
	if (!body.success) return fail(400, 'invalid_fields', 'Choose a decision and give a reason of at least 10 characters.')

	let chain
	try {
		chain = await readInvoice(invoiceId)
	} catch {
		return fail(502, 'chain_unavailable', 'Could not read the chain right now. Nothing was changed.')
	}
	if (chain.status !== Status.UnderReview) return fail(409, 'not_under_review', 'Only invoices under review can be decided.')

	const status = body.data.decision === 'APPROVE' ? Status.Eligible : Status.Rejected
	const ref = reportRef(JSON.stringify({ operatorDecision: body.data.decision, reason: body.data.reason, invoiceId }))
	let tx: string
	try {
		tx = await recordVerification(invoiceId, status, ref)
	} catch {
		return fail(502, 'record_failed', 'The decision could not be recorded onchain. The status did not change.')
	}
	insertDecision({ invoice_id: invoiceId, decision: body.data.decision, reason: body.data.reason, tx_hash: tx })
	insertEvent({ invoice_id: invoiceId, status: statusLabel(status), tx_hash: tx, source: 'operator', actor: 'operator' })
	return json({ status, txHash: tx })
}
