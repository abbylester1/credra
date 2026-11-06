import 'server-only'
import { createWalletClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { publicClient, transport, whitechain } from './chain'
import { ADDRESSES } from './config'
import { allowlistAbi, registryAbi } from './abi'
import { env } from './env'

// Server-side signers (constitution III): keys are read from the environment at call time and never exported.
const verifierClient = () =>
	createWalletClient({ account: privateKeyToAccount(env.verifierKey), chain: whitechain, transport: transport() })
const adminClient = () =>
	createWalletClient({ account: privateKeyToAccount(env.adminKey), chain: whitechain, transport: transport() })

async function confirm(hash: `0x${string}`) {
	const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 90_000 })
	if (receipt.status !== 'success') throw new Error('transaction_reverted')
	return hash
}

/** Records a verification outcome with the verifier wallet (VERIFIER_ROLE). Application-authorised, not a DON write. */
export async function recordVerification(invoiceId: `0x${string}`, status: number, ref: `0x${string}`) {
	const hash = await verifierClient().writeContract({
		address: ADDRESSES.registry,
		abi: registryAbi,
		functionName: 'recordVerification',
		args: [invoiceId, status, ref],
	})
	return confirm(hash)
}

export async function setInvestor(address: `0x${string}`, action: 'add' | 'remove') {
	const hash = await adminClient().writeContract({
		address: ADDRESSES.allowlist,
		abi: allowlistAbi,
		functionName: action,
		args: [address],
	})
	return confirm(hash)
}

export const verifierAddress = () => privateKeyToAccount(env.verifierKey).address
export const adminAddress = () => privateKeyToAccount(env.adminKey).address
