'use client'

import { useEffect, useState } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { useWalletChainId } from '@/lib/useWalletChain'
import { CHAIN_ID } from '@/lib/config'
import { friendlyError } from '@/lib/errors'
import { useWalletHeaders } from '@/lib/client'
import { Button, Card, InlineNotice } from './ui'

/** Requires a connected wallet on the right network and a signed access message before showing children. */
export function SignInGate({ children }: { children: (headers: Record<string, string>) => React.ReactNode }) {
	const { isConnected } = useAccount()
	const { connectors, connect, isPending } = useConnect()
	const chainId = useWalletChainId()
	const getHeaders = useWalletHeaders()
	const [headers, setHeaders] = useState<Record<string, string> | null>(null)
	const [err, setErr] = useState<string | null>(null)
	const { address } = useAccount()

	useEffect(() => setHeaders(null), [address])

	if (!isConnected) {
		const inj = connectors[0]
		return (
			<Card className="mx-auto max-w-[720px] text-center">
				<h2 className="text-[20px] font-semibold">Connect your wallet</h2>
				<p className="mx-auto mt-1 max-w-[52ch] text-[14px] text-ink-2">Credra uses your browser wallet to identify you. No account or password is needed.</p>
				<div className="mt-4 flex justify-center">
					<Button variant="primary" disabled={!inj || isPending} onClick={() => inj && connect({ connector: inj })}>
						{isPending ? 'Waiting for your wallet' : 'Connect wallet'}
					</Button>
				</div>
			</Card>
		)
	}
	if (chainId !== CHAIN_ID) {
		return <InlineNotice tone="warn">Wrong network. Switch to Whitechain Sepolia using the banner above.</InlineNotice>
	}
	if (!headers) {
		return (
			<Card className="mx-auto max-w-[720px]">
				<h2 className="text-[20px] font-semibold">Sign in with your wallet</h2>
				<p className="mt-1 text-[14px] text-ink-2">Sign a short message to prove this wallet is yours. It costs no gas and sends no transaction.</p>
				{err && <div className="mt-3"><InlineNotice tone="error">{err}</InlineNotice></div>}
				<div className="mt-4">
					<Button
						variant="primary"
						onClick={async () => {
							setErr(null)
							try {
								setHeaders(await getHeaders())
							} catch (e) {
								console.error('wallet sign-in failed', e)
								setErr(friendlyError(e))
							}
						}}
					>
						Sign in
					</Button>
				</div>
			</Card>
		)
	}
	return <>{children(headers)}</>
}
