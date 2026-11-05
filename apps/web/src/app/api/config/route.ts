import { ADDRESSES, CHAIN_ID, EXPLORER } from '@/lib/config'
import { json } from '@/lib/api'

export async function GET() {
	return json({ chainId: CHAIN_ID, ...ADDRESSES, explorer: EXPLORER, usdtDecimals: 6 })
}
