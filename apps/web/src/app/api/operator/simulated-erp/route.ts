import { z } from 'zod'
import { fail, json } from '@/lib/api'
import { readInvoice } from '@/lib/chain'
import { removeRegistry, writeRegistry } from '@/lib/registry'
import { getInvoiceByNumber } from '@/lib/repo'
import { isOperator } from '@/lib/session'
import { verifyWalletHeaders } from '@/lib/walletAuth'

export const dynamic = 'force-dynamic'

const body = z.object({
	invoiceNumber: z.string().min(1).max(64),
	scenario: z.enum(['match', 'amount_mismatch', 'disputed', 'absent']),
})

/**
 * DEMO control. Writes a record into the SIMULATED external registry (apps/mock-registry) so a UI-submitted
 * invoice has something to be verified against. Operator session, or the invoice's own issuer wallet.
 */
export async function POST(req: Request) {
	const parsed = body.safeParse(await req.json().catch(() => null))
	if (!parsed.success) return fail(400, 'invalid_fields', 'Choose an invoice number and a scenario.')
	const { invoiceNumber, scenario } = parsed.data

	const row = await getInvoiceByNumber(invoiceNumber)
	if (!row) return fail(404, 'not_found', 'No invoice with that number is registered.')
	const operator = await isOperator()
	if (!operator && (await verifyWalletHeaders(req.headers)) !== row.issuer_wallet) {
		return fail(403, 'forbidden', 'Only the operator or the invoice issuer can write demo records.')
	}

	try {
		if (scenario === 'absent') {
			await removeRegistry(invoiceNumber)
			return json({ ok: true, scenario, simulated: true })
		}
		const chain = await readInvoice(row.invoice_id as `0x${string}`)
		const amount = scenario === 'amount_mismatch' ? chain.amount - 500_000_000n : chain.amount
		await writeRegistry({
			invoiceNumber,
			issuerName: row.issuer_name,
			issuerWallet: chain.issuer,
			buyerName: row.buyer_name,
			buyerRef: chain.buyerRef,
			amount: amount.toString(),
			dueDate: Number(chain.dueDate),
			documentHash: chain.documentHash,
			status: scenario === 'disputed' ? 'disputed' : 'valid',
		})
		return json({ ok: true, scenario, simulated: true })
	} catch (e) {
		console.error('simulated-erp failed:', e)
		return fail(502, 'mock_unavailable', 'The simulated registry is not reachable. Locally, start apps/mock-registry and retry.')
	}
}
