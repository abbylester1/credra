import { z } from 'zod'
import { fail, isBytes32, json } from '@/lib/api'
import { publicClient, readHolder, readInvoice } from '@/lib/chain'
import { ADDRESSES } from '@/lib/config'
import { eventExistsForTx, getInvoiceRow, insertEvent } from '@/lib/repo'

export const dynamic = 'force-dynamic'

const ACTOR: Record<string, string> = { fund: 'investor wallet', repay: 'repayer wallet', default: 'any wallet' }
// The event is labelled by what the transaction did, not by the invoice's status when the sync runs.
const LABEL: Record<string, string> = { fund: 'Funded', repay: 'Repaid', default: 'Defaulted' }
// Lowest InvoiceRegistry.Status each action implies (Funded 5, Repaid 6, Defaulted 7).
const MIN_STATUS: Record<string, number> = { fund: 5, repay: 6, default: 7 }

/**
 * After a wallet-signed fund / repay / default transaction, record it in the timeline.
 * Status is never taken from the client: the receipt and the chain are read here (data-model.md).
 */
export async function POST(req: Request, ctx: { params: Promise<{ invoiceId: string }> }) {
	const { invoiceId } = await ctx.params
	if (!isBytes32(invoiceId)) return fail(400, 'bad_id', 'Invalid invoice id.')
	if (!(await getInvoiceRow(invoiceId))) return fail(404, 'not_found', 'Invoice not found.')
	const body = z.object({ txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/), kind: z.enum(['fund', 'repay', 'default']) }).safeParse(await req.json().catch(() => null))
	if (!body.success) return fail(400, 'invalid_fields', 'Send a transaction hash and kind.')
	const { txHash, kind } = body.data

	if (await eventExistsForTx(txHash)) return json({ recorded: false, reason: 'already_recorded' })

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
	if (chain.status < MIN_STATUS[kind]) return fail(409, 'status_mismatch', 'The invoice has not reached that state onchain yet.')
	await insertEvent({ invoice_id: invoiceId, status: LABEL[kind], tx_hash: txHash, source: kind, actor: ACTOR[kind] })
	return json({ recorded: true, status: chain.status, holder })
}
