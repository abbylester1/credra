import { z } from 'zod'
import { fail, isBytes32, json } from '@/lib/api'
import { publicClient, readHolder, readInvoice } from '@/lib/chain'
import { ADDRESSES } from '@/lib/config'
import { eventExistsForTx, getInvoiceRow, insertEvent } from '@/lib/repo'
import { statusLabel } from '@/lib/status'

export const dynamic = 'force-dynamic'

const ACTOR: Record<string, string> = { fund: 'investor wallet', repay: 'repayer wallet', default: 'any wallet' }

/**
 * After a wallet-signed fund / repay / default transaction, record it in the timeline.
 * Status is never taken from the client: the receipt and the chain are read here (data-model.md).
 */
export async function POST(req: Request, ctx: { params: Promise<{ invoiceId: string }> }) {
	const { invoiceId } = await ctx.params
	if (!isBytes32(invoiceId)) return fail(400, 'bad_id', 'Invalid invoice id.')
	if (!getInvoiceRow(invoiceId)) return fail(404, 'not_found', 'Invoice not found.')
	const body = z.object({ txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/), kind: z.enum(['fund', 'repay', 'default']) }).safeParse(await req.json().catch(() => null))
	if (!body.success) return fail(400, 'invalid_fields', 'Send a transaction hash and kind.')
	const { txHash, kind } = body.data

	if (eventExistsForTx(txHash)) return json({ recorded: false, reason: 'already_recorded' })

	let receipt
	try {
		receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` })
	} catch {
		return fail(409, 'receipt_not_found', 'The transaction is not confirmed yet. Try again in a moment.')
	}
	if (receipt.status !== 'success') return fail(400, 'tx_failed', 'That transaction did not succeed.')
	if (receipt.to?.toLowerCase() !== ADDRESSES.finance.toLowerCase()) return fail(400, 'wrong_contract', 'That transaction was not sent to the finance contract.')

	const chain = await readInvoice(invoiceId)
	const holder = await readHolder(invoiceId)
	insertEvent({ invoice_id: invoiceId, status: statusLabel(chain.status), tx_hash: txHash, source: kind, actor: ACTOR[kind] })
	return json({ recorded: true, status: chain.status, holder })
}
