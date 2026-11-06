import { json } from '@/lib/api'
import { readInvoice } from '@/lib/chain'
import { listInvoiceRows } from '@/lib/repo'
import { Status } from '@/lib/status'

export const dynamic = 'force-dynamic'

type Stats = { financedCount: number; financedUsdt: number; repaidCount: number; defaultedCount: number; avgReturnPct: number | null }
let cache: { at: number; value: Stats } | null = null

/**
 * Public, aggregate-only totals for the landing page. Status comes from the chain (the source of truth);
 * amounts come from the stored invoice rows. No per-invoice or personal data leaves this route.
 */
export async function GET() {
	if (cache && Date.now() - cache.at < 30_000) return json(cache.value)
	const rows = listInvoiceRows()
	const chain = await Promise.all(rows.map((r) => readInvoice(r.invoice_id as `0x${string}`).then((c) => c.status).catch(() => null)))
	let financedCount = 0, repaidCount = 0, defaultedCount = 0
	let financedBase = 0n
	let returnSum = 0
	rows.forEach((r, i) => {
		const s = chain[i]
		if (s !== Status.Funded && s !== Status.Repaid && s !== Status.Defaulted) return
		financedCount += 1
		if (s === Status.Repaid) repaidCount += 1
		if (s === Status.Defaulted) defaultedCount += 1
		const amount = BigInt(r.amount), financing = BigInt(r.financing_amount)
		financedBase += financing
		returnSum += Number(amount - financing) / Number(financing)
	})
	const value: Stats = {
		financedCount,
		financedUsdt: Number(financedBase) / 1e6,
		repaidCount,
		defaultedCount,
		avgReturnPct: financedCount ? Math.round((returnSum / financedCount) * 1000) / 10 : null,
	}
	cache = { at: Date.now(), value }
	return json(value)
}
