'use client'

import { useEffect, useState } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { useWalletChainId } from '@/lib/useWalletChain'
import { useConnectMode } from './Providers'
import { CHAIN_ID } from '@/lib/config'
import { friendlyError } from '@/lib/errors'
import { useWalletHeaders } from '@/lib/client'
import { Button, InlineNotice, Spinner } from './ui'

/** Requires a connected wallet on the right network and a signed access message before showing children. */
export function SignInGate({ children }: { children: (headers: Record<string, string>) => React.ReactNode }) {
	const { isConnected } = useAccount()
	const { connectors, connect, isPending } = useConnect()
	const chainId = useWalletChainId()
	const mode = useConnectMode()
	const getHeaders = useWalletHeaders()
	const [headers, setHeaders] = useState<Record<string, string> | null>(null)
	const [err, setErr] = useState<string | null>(null)
	const { address } = useAccount()

	useEffect(() => setHeaders(null), [address])

	if (!isConnected) {
		// Privy user is logged in but the embedded wallet is still being created/reconnected.
		// Show a neutral wait state rather than a "Sign in" prompt.
		if (mode.privy && mode.authenticated) {
			return (
				<div className="flex items-center gap-2.5 rounded-[14px] border border-hair bg-card px-5 py-4 text-[14px] text-ink-2">
					<Spinner className="h-4 w-4 shrink-0" />
					{mode.hasWallet ? 'Reconnecting your wallet…' : 'Setting up your wallet…'}
				</div>
			)
		}
		const inj = connectors[0]
		return (
			<div className="flex flex-col gap-3 rounded-[14px] border border-hair bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-[15px] font-medium text-ink">{mode.privy ? 'Sign in to view your invoices' : 'Connect a wallet to view your invoices'}</p>
					<p className="mt-0.5 text-[13px] text-ink-3">{mode.privy ? 'Email, Google or a wallet — an embedded wallet is created for you.' : 'No account needed. Credra uses your wallet to identify you.'}</p>
				</div>
				<Button variant="primary" className="shrink-0" disabled={mode.login ? false : !inj || isPending} onClick={() => (mode.login ? mode.login() : inj && connect({ connector: inj }))}>
					{isPending ? 'Connecting…' : mode.privy ? 'Sign in' : 'Connect wallet'}
				</Button>
			</div>
		)
	}
	if (chainId !== CHAIN_ID) {
		return <InlineNotice tone="warn">Wrong network. Switch to Whitechain Sepolia using the banner above.</InlineNotice>
	}
	if (!headers) {
		return (
			<div className="flex flex-col gap-3 rounded-[14px] border border-hair bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-[15px] font-medium text-ink">Verify your wallet to load your invoices</p>
					<p className="mt-0.5 text-[13px] text-ink-3">Sign a short message — no gas, no transaction.</p>
					{err && <div className="mt-2"><InlineNotice tone="error">{err}</InlineNotice></div>}
				</div>
				<Button
					variant="primary"
					className="shrink-0"
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
		)
	}
	return <>{children(headers)}</>
}
