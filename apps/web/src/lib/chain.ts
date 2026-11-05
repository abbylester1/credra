import { createPublicClient, defineChain, fallback, http } from 'viem'
import { ADDRESSES, CHAIN_ID, EXPLORER, RPC_FALLBACK, RPC_PRIMARY } from './config'
import { financeAbi, registryAbi } from './abi'

export const whitechain = defineChain({
	id: CHAIN_ID,
	name: 'Whitechain Sepolia',
	nativeCurrency: { name: 'WBT', symbol: 'WBT', decimals: 18 },
	rpcUrls: { default: { http: [RPC_PRIMARY, RPC_FALLBACK] } },
	blockExplorers: { default: { name: 'Whitechain Explorer', url: EXPLORER } },
	testnet: true,
})

/** Both public RPCs time out intermittently: always read through a fallback transport. */
export const transport = () =>
	fallback([
		http(RPC_PRIMARY, { timeout: 12_000, retryCount: 1 }),
		http(RPC_FALLBACK, { timeout: 12_000, retryCount: 1 }),
	])

export const publicClient = createPublicClient({ chain: whitechain, transport: transport() })

export type OnchainInvoice = {
	invoiceId: `0x${string}`
	documentHash: `0x${string}`
	buyerRef: `0x${string}`
	verificationRef: `0x${string}`
	issuer: `0x${string}`
	amount: bigint
	financingAmount: bigint
	dueDate: bigint
	status: number
}

export async function readInvoice(id: `0x${string}`): Promise<OnchainInvoice> {
	const inv = await publicClient.readContract({
		address: ADDRESSES.registry,
		abi: registryAbi,
		functionName: 'getInvoice',
		args: [id],
	})
	return { ...inv, status: Number(inv.status) } as OnchainInvoice
}

export async function readPosition(id: `0x${string}`) {
	const [originalInvestor, fundedAmount, repaidAmount, fundedAt, repaidAt] = await publicClient.readContract({
		address: ADDRESSES.finance,
		abi: financeAbi,
		functionName: 'positions',
		args: [id],
	})
	return { originalInvestor, fundedAmount, repaidAmount, fundedAt, repaidAt }
}

export async function readHolder(id: `0x${string}`): Promise<`0x${string}` | null> {
	try {
		return await publicClient.readContract({ address: ADDRESSES.finance, abi: financeAbi, functionName: 'ownerOf', args: [BigInt(id)] })
	} catch {
		return null // token not minted yet
	}
}
