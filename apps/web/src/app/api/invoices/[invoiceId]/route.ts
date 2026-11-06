import { fail, isBytes32, json } from '@/lib/api'
import { publicClient, readHolder, readInvoice, readPosition } from '@/lib/chain'
import { eventsFor, getInvoiceRow, latestDecision, latestRun, walletLabels } from '@/lib/repo'
import { Status } from '@/lib/status'
import { parseRun, summarize } from '@/lib/summary'

export const dynamic = 'force-dynamic'

// The wallet that sent a transaction never changes, so look each one up once.
const senderCache = new Map<string, string | null>()
async function senderOf(tx: string | null): Promise<string | null> {
	if (!tx) return null
	if (senderCache.has(tx)) return senderCache.get(tx) ?? null
	try {
		const from = (await publicClient.getTransaction({ hash: tx as `0x${string}` })).from
		senderCache.set(tx, from)
		return from
	} catch {
		return null // RPC hiccup: show the generic actor text, retry next load
	}
}

export async function GET(_req: Request, ctx: { params: Promise<{ invoiceId: string }> }) {
	const { invoiceId } = await ctx.params
	if (!isBytes32(invoiceId)) return fail(400, 'bad_id', 'Invalid invoice id.')
	const row = await getInvoiceRow(invoiceId)
	if (!row) return fail(404, 'not_found', 'Invoice not found.')

	let chain
	try {
		chain = await readInvoice(invoiceId)
	} catch {
		return fail(502, 'chain_unavailable', 'Could not read the chain right now. Nothing was changed. Try again.')
	}
	const run = await latestRun(invoiceId)
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
	const events = await eventsFor(invoiceId)
	const decisionRow = await latestDecision(invoiceId)
	const senders = await Promise.all(events.map((e) => senderOf(e.tx_hash)))
	return json({
		invoice: summarize(row, chain, run),
		verification: parseRun(run),
		timeline: events.map((e, k) => ({ status: e.status, txHash: e.tx_hash, source: e.source, actor: e.actor, wallet: senders[k], at: e.created_at })),
		position,
		holder,
		labels: await walletLabels([row.issuer_wallet, holder ?? '', position?.originalInvestor ?? '', ...senders].filter((w): w is string => !!w)),
		decision: decisionRow ? { decision: decisionRow.decision, reason: decisionRow.reason, txHash: decisionRow.tx_hash, at: decisionRow.created_at } : null,
	})
}
