'use client'

import { useEffect, useRef, useState } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { useWalletChainId } from '@/lib/useWalletChain'
import { useConnectMode } from './Providers'
import { CHAIN_ID } from '@/lib/config'
import { friendlyError } from '@/lib/errors'
import { useWalletHeaders } from '@/lib/client'
import { Button, InlineNotice } from './ui'

/** Requires a connected wallet on the right network and a signed access message before showing children. */
export function SignInGate({ children }: { children: (headers: Record<string, string>) => React.ReactNode }) {
	const { isConnected } = useAccount()
	const { connectors, connect, isPending } = useConnect()
	const chainId = useWalletChainId()
	const mode = useConnectMode()
	const getHeaders = useWalletHeaders()
	const [headers, setHeaders] = useState<Record<string, string> | null>(null)
	const [err, setErr] = useState<string | null>(null)
	const [signing, setSigning] = useState(false)
	const { address } = useAccount()
	const signingRef = useRef(false)

	useEffect(() => { setHeaders(null); setErr(null) }, [address])

	// For Privy embedded wallets, sign silently as soon as the wallet is ready — no prompt needed.
	// Retries up to 3 times with a short back-off before surfacing an error.
	useEffect(() => {
		if (!mode.privy || !isConnected || chainId !== CHAIN_ID || headers || signingRef.current) return
		signingRef.current = true
		setSigning(true)
		let attempt = 0
		const MAX = 3
		const run = (): void => {
			getHeaders()
				.then(setHeaders)
				.catch((e) => {
					attempt++
					if (attempt < MAX) {
						setTimeout(run, 1_500 * attempt)
					} else {
						console.error('auto sign-in failed after retries', e)
						setErr(friendlyError(e))
						setSigning(false)
						signingRef.current = false
					}
				})
		}
		run()
	}, [mode.privy, isConnected, chainId, headers, getHeaders])

	if (!isConnected) {
		// Privy user is authenticated but wallet is still pending — neutral skeleton.
		if (mode.privy && mode.authenticated) {
			return <div className="h-24 animate-pulse rounded-[14px] border border-hair bg-inset" />
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
	// Privy: auto-signing in progress — show skeleton.
	if (mode.privy && (signing || !headers)) {
		if (err) {
			return (
				<div className="flex flex-col gap-3 rounded-[14px] border border-hair bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-[15px] font-medium text-ink">Could not verify your wallet</p>
						<div className="mt-2"><InlineNotice tone="error">{err}</InlineNotice></div>
					</div>
					<Button variant="primary" className="shrink-0" onClick={async () => {
						setErr(null); setSigning(true)
						try { setHeaders(await getHeaders()) } catch (e) { setErr(friendlyError(e)) } finally { setSigning(false) }
					}}>Retry</Button>
				</div>
			)
		}
		return <div className="h-24 animate-pulse rounded-[14px] border border-hair bg-inset" />
	}
	// Non-Privy: external wallet — keep the explicit sign prompt.
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
						try { setHeaders(await getHeaders()) } catch (e) { console.error('wallet sign-in failed', e); setErr(friendlyError(e)) }
					}}
				>
					Sign in
				</Button>
			</div>
		)
	}
	return <>{children(headers)}</>
}
