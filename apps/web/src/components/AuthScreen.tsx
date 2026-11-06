'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useConnect } from 'wagmi'
import { useConnectMode } from './Providers'
import { Button } from './ui'

/** Shown instead of the app shell while nobody is signed in. Same visual language as the landing page. */
export function AuthScreen() {
	const { connectors, connect, isPending, error } = useConnect()
	const mode = useConnectMode()
	const inj = connectors[0]
	const go = () => (mode.login ? mode.login() : inj && connect({ connector: inj }))
	const steps = ['Sign in with email, Google or a wallet', 'Submit an invoice or browse eligible ones', 'Funding and repayment settle in USDT']
	return (
		<div className="grid min-h-screen lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
			{/* brand panel */}
			<div className="relative hidden overflow-hidden bg-pine p-12 text-white lg:flex lg:flex-col lg:justify-between">
				<div className="linegrid absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_60%_40%,#000_25%,transparent_80%)]" />
				<Link href="/" className="relative" aria-label="Credra home"><Image src="/logo-white.png" alt="Credra" width={123} height={24} className="h-6 w-auto object-contain" priority /></Link>
				<div className="relative">
					<h1 className="max-w-[460px] text-[48px] font-semibold leading-[1.03] tracking-[-0.035em]">Verified invoices. <span className="text-white/55">Instant capital.</span></h1>
					<div className="animate-floaty mt-10 w-[260px] rounded-card bg-card p-4 text-ink shadow-[0_24px_50px_-18px_rgba(0,0,0,0.5)]">
						<div className="flex items-center justify-between"><span className="font-mono text-[11px] text-ink-2">INV-1001</span><span className="inline-flex items-center gap-1.5 rounded-chip bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent"><span className="h-1.5 w-1.5 bg-current" />Eligible</span></div>
						<p className="mt-2 font-mono text-[22px] font-medium">10,000.00 <span className="text-[11px] text-ink-3">USDT</span></p>
						<p className="text-[11px] text-ink-3">Illustrative demo data</p>
					</div>
				</div>
				<p className="relative max-w-[420px] text-[12px] leading-[1.6] text-white/55">Testnet demo. Verification data is simulated and verdicts are recorded by an application wallet.</p>
			</div>

			{/* sign-in */}
			<div className="flex flex-col justify-center px-6 py-12 sm:px-14">
				<div className="mx-auto w-full max-w-[420px]">
					<Link href="/" className="mb-10 block lg:hidden"><Image src="/logo.png" alt="Credra" width={113} height={22} className="h-[22px] w-auto object-contain" /></Link>
					<p className="mb-3 font-mono text-[11px] uppercase tracking-[0.06em] text-accent">Credra app</p>
					<h2 className="text-[34px] font-semibold leading-[1.08] tracking-[-0.03em]">Sign in <span className="text-ink-3">to continue.</span></h2>
					<ol className="mt-6 space-y-3">
						{steps.map((s, i) => (
							<li key={s} className="flex items-center gap-3 text-[14px] text-ink-2"><span className="flex h-6 w-6 items-center justify-center rounded-chip bg-inset font-mono text-[11px] text-ink-3">{i + 1}</span>{s}</li>
						))}
					</ol>
					<Button variant="primary" className="mt-8 w-full !h-12" disabled={mode.login ? false : !inj || isPending} onClick={go}>
						{isPending ? 'Waiting for your wallet' : mode.privy ? 'Sign in' : 'Connect wallet'}
					</Button>
					{error && <p className="mt-2 text-[12px] text-s-reject">Connection was not approved. Check your wallet and try again.</p>}
					<div className="mt-6 flex items-center justify-between text-[13px]">
						<Link href="/app/operator" className="text-ink-3 hover:text-ink">Operator? Enter passcode</Link>
						<Link href="/" className="text-ink-3 hover:text-ink">Back to site</Link>
					</div>
				</div>
			</div>
		</div>
	)
}
