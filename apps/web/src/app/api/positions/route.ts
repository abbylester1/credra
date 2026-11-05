import { isAddress } from 'viem'
import { fail, json } from '@/lib/api'
import { readHolder, readInvoice, readPosition } from '@/lib/chain'
import { latestRun, listInvoiceRows } from '@/lib/repo'
import { Status } from '@/lib/status'
import { summarize } from '@/lib/summary'

export const dynamic = 'force-dynamic'

/** Funded positions currently held by a wallet (the receivable token is the source of truth). */
export async function GET(req: Request) {
	const wallet = new URL(req.url).searchParams.get('wallet') ?? ''
	if (!isAddress(wallet)) return fail(400, 'bad_wallet', 'Provide a wallet address.')
	const rows = listInvoiceRows()
	const out = await Promise.all(
		rows.map(async (row) => {
			try {
				const chain = await readInvoice(row.invoice_id as `0x${string}`)
				if (chain.status < Status.Funded) return null
				const holder = await readHolder(row.invoice_id as `0x${string}`)
				if (!holder || holder.toLowerCase() !== wallet.toLowerCase()) return null
				const p = await readPosition(row.invoice_id as `0x${string}`)
				return {
					...summarize(row, chain, latestRun(row.invoice_id)),
					holder,
					fundedAmount: p.fundedAmount.toString(),
					repaidAmount: p.repaidAmount.toString(),
					fundedAt: Number(p.fundedAt),
					repaidAt: Number(p.repaidAt),
				}
			} catch {
				return null
			}
		}),
	)
	return json(out.filter((x): x is NonNullable<typeof x> => x !== null))
}
