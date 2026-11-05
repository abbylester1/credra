import { isAddress } from 'viem'
import { z } from 'zod'
import { fail, json } from '@/lib/api'
import { publicClient } from '@/lib/chain'
import { allowlistAbi } from '@/lib/abi'
import { ADDRESSES } from '@/lib/config'
import { isOperator } from '@/lib/session'
import { setInvestor } from '@/lib/signer'

export const dynamic = 'force-dynamic'
const FROM_BLOCK = 12_299_000n // just before the current deployment

/** Current allowlist reconstructed from InvestorAdded / InvestorRemoved events, confirmed against isAllowed. */
export async function GET() {
	if (!(await isOperator())) return fail(403, 'operator_only', 'Operator access required.')
	try {
		// The RPC caps getLogs at 10,000 blocks per call, so read in chunks.
		const latest = await publicClient.getBlockNumber()
		const events: { args: unknown }[] = []
		for (let from = FROM_BLOCK; from <= latest; from += 9_000n) {
			const to = from + 8_999n > latest ? latest : from + 8_999n
			for (const eventName of ['InvestorAdded', 'InvestorRemoved'] as const) {
				events.push(...(await publicClient.getContractEvents({ address: ADDRESSES.allowlist, abi: allowlistAbi, eventName, fromBlock: from, toBlock: to })))
			}
		}
		const candidates = [...new Set(events.map((l) => (l.args as { investor: string }).investor.toLowerCase()))]
		const checked = await Promise.all(
			candidates.map(async (a) => ({
				address: a,
				allowed: await publicClient.readContract({ address: ADDRESSES.allowlist, abi: allowlistAbi, functionName: 'isAllowed', args: [a as `0x${string}`] }),
			})),
		)
		return json(checked.filter((c) => c.allowed))
	} catch {
		return fail(502, 'chain_unavailable', 'Could not read the allowlist right now. Nothing was changed.')
	}
}

export async function POST(req: Request) {
	if (!(await isOperator())) return fail(403, 'operator_only', 'Operator access required.')
	const body = z.object({ address: z.string(), action: z.enum(['add', 'remove']) }).safeParse(await req.json().catch(() => null))
	if (!body.success || !isAddress(body.data.address)) return fail(400, 'invalid_fields', 'Enter a valid wallet address.')
	try {
		const tx = await setInvestor(body.data.address, body.data.action)
		return json({ txHash: tx })
	} catch {
		return fail(502, 'tx_failed', 'The change could not be recorded onchain. Nothing was changed.')
	}
}
