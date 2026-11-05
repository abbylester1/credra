import { fail, isBytes32, json } from '@/lib/api'
import { readHolder, readInvoice, readPosition } from '@/lib/chain'
import { eventsFor, getInvoiceRow, latestDecision, latestRun } from '@/lib/repo'
import { Status } from '@/lib/status'
import { parseRun, summarize } from '@/lib/summary'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, ctx: { params: Promise<{ invoiceId: string }> }) {
	const { invoiceId } = await ctx.params
	if (!isBytes32(invoiceId)) return fail(400, 'bad_id', 'Invalid invoice id.')
	const row = getInvoiceRow(invoiceId)
	if (!row) return fail(404, 'not_found', 'Invoice not found.')

	let chain
	try {
		chain = await readInvoice(invoiceId)
	} catch {
		return fail(502, 'chain_unavailable', 'Could not read the chain right now. Nothing was changed. Try again.')
	}
	const run = latestRun(invoiceId)
	let position = null
	let holder: string | null = null
	if (chain.status >= Status.Funded) {
		holder = await readHolder(invoiceId)
		try {
			const p = await readPosition(invoiceId)
			position = {
				originalInvestor: p.originalInvestor,
				fundedAmount: p.fundedAmount.toString(),
				repaidAmount: p.repaidAmount.toString(),
				fundedAt: Number(p.fundedAt),
				repaidAt: Number(p.repaidAt),
			}
		} catch {
			position = null
		}
	}
	return json({
		invoice: summarize(row, chain, run),
		verification: parseRun(run),
		timeline: eventsFor(invoiceId).map((e) => ({ status: e.status, txHash: e.tx_hash, source: e.source, actor: e.actor, at: e.created_at })),
		position,
		holder,
		decision: (() => { const d = latestDecision(invoiceId); return d ? { decision: d.decision, reason: d.reason, txHash: d.tx_hash, at: d.created_at } : null })(),
	})
}
