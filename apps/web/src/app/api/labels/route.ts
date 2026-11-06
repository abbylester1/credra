import { isAddress } from 'viem'
import { json } from '@/lib/api'
import { walletLabels } from '@/lib/repo'

export const dynamic = 'force-dynamic'

/** Public: names and roles for wallets that appear on invoices. GET /api/labels?wallets=0x..,0x.. */
export async function GET(req: Request) {
	const raw = new URL(req.url).searchParams.get('wallets') ?? ''
	const wallets = raw.split(',').filter((w) => isAddress(w)).slice(0, 25)
	return json(await walletLabels(wallets))
}
