'use client'

import { useLoginWithEmail, useLoginWithOAuth, usePrivy } from '@privy-io/react-auth'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useConnect } from 'wagmi'
import { useConnectMode } from './Providers'
import { Button, Spinner } from './ui'

/* ───────── right-hand panel: product pillars on a quiet textured canvas ───────── */
const PILLARS = [
	{ t: 'Verify', d: 'Every invoice is checked against an external record before it can be funded.', href: '/#approach', icon: 'M5 12l5 5L20 7' },
	{ t: 'Fund', d: 'Approved investors pay the business directly in USDT.', href: '/#process', icon: 'M16.7 8a3 3 0 0 0-2.7-2h-4a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6h-4a3 3 0 0 1-2.7-2M12 3v3m0 12v3' },
	{ t: 'Settle', d: 'Repayment goes to whoever holds the receivable.', href: '/#economics', icon: 'M5 12h14M15 8l4 4-4 4' },
	{ t: 'Audit', d: 'Every step is onchain with a link you can open.', href: '/#transparency', icon: 'M14 3v4a1 1 0 0 0 1 1h4M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2zM9 13h6M9 17h6M9 9h1' },
]

function Showcase() {
	return (
		<div className="paper relative hidden flex-col justify-between overflow-hidden p-12 lg:flex xl:p-16">
			<div className="relative max-w-[640px] pt-10 xl:pt-16">
				<h1 className="text-[52px] font-semibold leading-[1.02] tracking-[-0.035em] text-ink xl:text-[64px]">Verified invoices. <span className="text-ink-3">Instant capital.</span></h1>
				<p className="mt-5 max-w-[460px] text-[17px] leading-[1.55] text-ink-2">Submit, verify and fund invoices in USDT. Every step onchain.</p>
			</div>
			<div className="relative">
				<p className="mb-4 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">How it works</p>
				<div className="grid gap-px overflow-hidden rounded-card border border-hair bg-hair xl:grid-cols-4 md:grid-cols-2">
					{PILLARS.map((p) => (
						<Link key={p.t} href={p.href} className="group flex min-h-[170px] flex-col justify-between bg-card/85 p-5 backdrop-blur-sm transition-colors hover:bg-card">
							<div>
								<span className="flex h-8 w-8 items-center justify-center rounded-ctl border border-hair bg-canvas text-ink">
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={p.icon} /></svg>
								</span>
								<p className="mt-4 text-[16px] font-semibold text-ink">{p.t}</p>
								<p className="mt-1 text-[13px] leading-[1.5] text-ink-3">{p.d}</p>
							</div>
							<span className="mt-3 text-ink-3 transition-transform group-hover:translate-x-1" aria-hidden>→</span>
						</Link>
					))}
				</div>
			</div>
		</div>
	)
}

/* ───────── shared bits ───────── */
const GoogleG = () => (
	<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
		<path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.87 2.68-6.62z" />
		<path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.7H.96v2.33A9 9 0 009 18z" />
		<path fill="#FBBC05" d="M3.96 10.72A5.4 5.4 0 013.68 9c0-.6.1-1.18.28-1.72V4.95H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.05l3-2.33z" />
		<path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.96 4.95l3 2.33C4.67 5.16 6.66 3.58 9 3.58z" />
	</svg>
)

const fieldCls = 'h-12 w-full rounded-ctl border border-field bg-card pl-11 pr-3 text-[15px] text-ink placeholder:text-ink-3 focus-visible:outline-2 focus-visible:outline-ink'

function Frame({ children }: { children: React.ReactNode }) {
	return (
		<div className="grid min-h-screen lg:grid-cols-[minmax(420px,480px)_minmax(0,1fr)]">
			<div className="flex min-h-screen flex-col bg-card px-6 py-8 sm:px-12">
				<Link href="/" aria-label="Credra home"><Image src="/logo.png" alt="Credra" width={113} height={22} className="h-[22px] w-auto object-contain" priority /></Link>
				<div className="mx-auto flex w-full max-w-[360px] flex-1 flex-col justify-center py-10">{children}</div>
				<div className="space-y-3 text-center">
					<Link href="/app/operator" className="block text-[13px] text-ink-3 hover:text-ink">Operator? Enter passcode</Link>
					<p className="text-[12px] text-ink-3">Testnet demo. Protected by Privy.</p>
				</div>
			</div>
			<Showcase />
		</div>
	)
}

/* ───────── Privy: email code + Google + wallet, all on this screen ───────── */
function PrivySignIn() {
	const { login } = usePrivy()
	const email = useLoginWithEmail()
	const oauth = useLoginWithOAuth()
	const [addr, setAddr] = useState('')
	const [code, setCode] = useState('')
	const codeRef = useRef<HTMLInputElement>(null)

	const status = email.state.status
	const awaitingCode = status === 'awaiting-code-input' || status === 'submitting-code' || (status === 'error' && code.length > 0)
	const busyEmail = status === 'sending-code' || status === 'submitting-code'
	const busyGoogle = oauth.state.status === 'loading'
	const errText = status === 'error' ? (awaitingCode ? 'That code did not work. Check it and try again.' : 'Could not send the code. Check the address and try again.') : oauth.state.status === 'error' ? 'Google sign-in did not complete. Try again.' : null

	useEffect(() => { if (awaitingCode) codeRef.current?.focus() }, [awaitingCode])

	if (status === 'done' || oauth.state.status === 'done') {
		return <p className="flex items-center gap-2.5 text-[15px] text-ink-2"><Spinner className="h-4 w-4" />Signing you in</p>
	}

	if (awaitingCode) {
		return (
			<div>
				<h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.03em]">Check your email</h2>
				<p className="mt-2 text-[14px] leading-[1.55] text-ink-2">We sent a 6-digit code to <span className="font-medium text-ink">{addr}</span>.</p>
				<form className="mt-7" onSubmit={(e) => { e.preventDefault(); if (code.length === 6) void email.loginWithCode({ code }) }}>
					<input
						ref={codeRef} value={code} inputMode="numeric" autoComplete="one-time-code" maxLength={6} aria-label="6-digit code" placeholder="000000"
						onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setCode(v); if (v.length === 6) void email.loginWithCode({ code: v }) }}
						className="h-14 w-full rounded-ctl border border-field bg-card text-center font-mono text-[24px] tracking-[0.5em] text-ink placeholder:text-ink-3/50 focus-visible:outline-2 focus-visible:outline-ink"
					/>
					{errText && <p role="alert" className="mt-2 text-[13px] text-s-reject">{errText}</p>}
					<Button type="submit" variant="primary" className="mt-4 w-full !h-12" loading={busyEmail} disabled={code.length !== 6}>Verify</Button>
				</form>
				<div className="mt-4 flex items-center justify-between text-[13px]">
					<button className="text-ink-3 hover:text-ink" onClick={() => { setCode(''); void email.sendCode({ email: addr }) }}>Resend code</button>
					<button className="text-ink-3 hover:text-ink" onClick={() => { setCode(''); window.location.reload() }}>Use a different email</button>
				</div>
			</div>
		)
	}

	return (
		<div>
			<h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.03em]">Sign in</h2>
			<p className="mt-2 text-[14px] leading-[1.55] text-ink-2">Use your email or Google. We create a wallet for you.</p>
			<form className="mt-7" onSubmit={(e) => { e.preventDefault(); if (addr.trim()) void email.sendCode({ email: addr.trim() }) }}>
				<div className="relative">
					<svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="2.5" y="4.5" width="15" height="11" rx="2" /><path d="M3 6l7 5 7-5" /></svg>
					<input type="email" value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="your@email.com" autoComplete="email" aria-label="Email address" className={fieldCls} />
				</div>
				{errText && <p role="alert" className="mt-2 text-[13px] text-s-reject">{errText}</p>}
				<Button type="submit" variant="primary" className="mt-3 w-full !h-12" loading={status === 'sending-code'} disabled={!addr.includes('@')}>Continue</Button>
			</form>
			<div className="my-5 flex items-center gap-3 text-[12px] text-ink-3"><span className="h-px flex-1 bg-hair" />or<span className="h-px flex-1 bg-hair" /></div>
			<div className="space-y-2.5">
				<button onClick={() => void oauth.initOAuth({ provider: 'google' })} disabled={busyGoogle} className="flex h-12 w-full items-center justify-center gap-2.5 rounded-ctl border border-field bg-card text-[14px] font-medium text-ink transition-colors hover:bg-inset disabled:opacity-60">
					{busyGoogle ? <Spinner /> : <GoogleG />}Continue with Google
				</button>
				<button onClick={() => login({ loginMethods: ['wallet'] })} className="flex h-12 w-full items-center justify-center gap-2.5 rounded-ctl border border-hair bg-card text-[14px] font-medium text-ink-2 transition-colors hover:bg-inset hover:text-ink">
					<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="2.5" y="5" width="15" height="11" rx="2" /><path d="M13.5 10.5h1.5" /></svg>
					Connect a wallet
				</button>
			</div>
		</div>
	)
}

/* ───────── No Privy app id: plain browser wallet ───────── */
function BrowserWalletSignIn() {
	const { connectors, connect, isPending, error } = useConnect()
	const inj = connectors[0]
	return (
		<div>
			<h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.03em]">Sign in</h2>
			<p className="mt-2 text-[14px] leading-[1.55] text-ink-2">Connect your browser wallet to continue.</p>
			<Button variant="primary" className="mt-7 w-full !h-12" loading={isPending} disabled={!inj} onClick={() => inj && connect({ connector: inj })}>Connect wallet</Button>
			{error && <p className="mt-2 text-[13px] text-s-reject">Connection was not approved. Check your wallet and try again.</p>}
		</div>
	)
}

/** Shown instead of the app shell while nobody is signed in. */
export function AuthScreen() {
	const mode = useConnectMode()
	return <Frame>{mode.privy ? <PrivySignIn /> : <BrowserWalletSignIn />}</Frame>
}
