import { isAddress, verifyMessage } from 'viem'

// Demo-grade wallet authentication: the browser wallet signs a timestamped message; the server
// verifies the signature and a 10 minute window. There is no nonce store (replay inside the window
// is possible), which is acceptable for a testnet demo and is documented in the threat model.
export const WALLET_AUTH_WINDOW_SECONDS = 600

export const authMessage = (wallet: string, issuedAt: number) =>
	`Credra access\nwallet: ${wallet.toLowerCase()}\nissued: ${issuedAt}`

export async function verifyWalletHeaders(
	headers: Headers,
	nowSec = Math.floor(Date.now() / 1000),
): Promise<`0x${string}` | null> {
	const wallet = headers.get('x-wallet')
	const sig = headers.get('x-signature')
	const issued = Number(headers.get('x-issued'))
	if (!wallet || !sig || !Number.isFinite(issued) || !isAddress(wallet)) return null
	if (Math.abs(nowSec - issued) > WALLET_AUTH_WINDOW_SECONDS) return null
	try {
		const ok = await verifyMessage({
			address: wallet,
			message: authMessage(wallet, issued),
			signature: sig as `0x${string}`,
		})
		return ok ? (wallet.toLowerCase() as `0x${string}`) : null
	} catch {
		return null
	}
}
