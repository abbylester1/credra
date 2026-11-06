'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { HOSTED_DEMO } from '@/lib/hosted'
import { Announcement, BuiltOn, Hero, Ticker } from '@/components/landing/Hero'
import { Bento } from '@/components/landing/Bento'
import { Process } from '@/components/landing/Process'
import { Audiences, CtaBanner, Showcase, Stats, Trust } from '@/components/landing/Sections'

/* ─── Logo ─── */
function Logo({ size = 'default' }: { size?: 'default' | 'small' }) {
	const h = size === 'small' ? 24 : 32
	return (
		<Image
			src="/logo.png"
			alt="Credra"
			width={Math.round(h * 3.5)}
			height={h}
			className="object-contain"
			priority
		/>
	)
}

/* ─── Nav ─── */
function Nav() {
	const [scrolled, setScrolled] = useState(false)
	const [menuOpen, setMenuOpen] = useState(false)
	useEffect(() => {
		const fn = () => setScrolled(window.scrollY > 10)
		window.addEventListener('scroll', fn, { passive: true })
		return () => window.removeEventListener('scroll', fn)
	}, [])
	const links = [
		{ label: 'How it works', href: '#process' },
		{ label: 'For businesses', href: '#businesses' },
		{ label: 'For investors', href: '#investors-cta' },
		{ label: 'Trust & verification', href: '#trust' },
	]
	return (
		<nav
			className={`sticky top-0 inset-x-0 z-50 h-[72px] flex items-center transition-all duration-150 ${scrolled ? 'bg-canvas/95 backdrop-blur-sm border-b border-hair' : 'bg-canvas'}`}
		>
			<div className="w-full max-w-[1200px] mx-auto px-5 md:px-8 flex items-center justify-between">
				<Logo />
				{/* Desktop links */}
				<div className="hidden md:flex items-center gap-8">
					{links.map((l) => (
						<a
							key={l.href}
							href={l.href}
							className="text-[14px] text-ink-2 hover:text-ink transition-colors"
						>
							{l.label}
						</a>
					))}
				</div>
				<div className="flex items-center gap-3">
					<Link
						href="/app"
						className="bg-pine hover:bg-pine-hover text-white text-[14px] font-medium px-5 h-[44px] rounded-ctl flex items-center transition-colors"
					>
						Launch app
					</Link>
					{/* Mobile menu toggle */}
					<button
						onClick={() => setMenuOpen(!menuOpen)}
						className="md:hidden w-10 h-10 flex items-center justify-center"
						aria-label="Menu"
					>
						<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
							{menuOpen ? (
								<path d="M5 5l10 10M15 5L5 15" />
							) : (
								<path d="M3 6h14M3 10h14M3 14h14" />
							)}
						</svg>
					</button>
				</div>
			</div>
			{/* Mobile menu */}
			{menuOpen && (
				<div className="md:hidden absolute top-[72px] inset-x-0 bg-canvas border-b border-hair px-5 py-4 flex flex-col gap-3">
					{links.map((l) => (
						<a
							key={l.href}
							href={l.href}
							onClick={() => setMenuOpen(false)}
							className="text-[15px] text-ink-2 py-2"
						>
							{l.label}
						</a>
					))}
				</div>
			)}
		</nav>
	)
}

/* ─── Footer ─── */
function Footer() {
	return (
		<footer className="border-t border-hair py-12 md:py-16">
			<div className="max-w-[1200px] mx-auto px-5 md:px-8">
				<div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
					<div>
						<Logo size="small" />
						<p className="text-[13px] text-ink-3 mt-2 leading-[1.6]">
							Trust-backed financing infrastructure.
						</p>
					</div>
					<div>
						<p className="text-[12px] font-mono uppercase tracking-[0.06em] text-ink-3 mb-3">Product</p>
						<div className="space-y-2">
							<a href="#process" className="block text-[14px] text-ink-2 hover:text-ink transition-colors">How it works</a>
							<a href="#businesses" className="block text-[14px] text-ink-2 hover:text-ink transition-colors">For businesses</a>
							<a href="#investors-cta" className="block text-[14px] text-ink-2 hover:text-ink transition-colors">For investors</a>
							<a href="#trust" className="block text-[14px] text-ink-2 hover:text-ink transition-colors">Trust & verification</a>
						</div>
					</div>
					<div>
						<p className="text-[12px] font-mono uppercase tracking-[0.06em] text-ink-3 mb-3">Resources</p>
						<div className="space-y-2">
							<Link href="/app" className="block text-[14px] text-ink-2 hover:text-ink transition-colors">Launch app</Link>
							<a
								href="https://explorer.testnet.whitechain.io/address/0xc11162A72F388Efb6Ddd0B73Eea578598d733122"
								target="_blank"
								rel="noopener noreferrer"
								className="block text-[14px] text-ink-2 hover:text-ink transition-colors"
							>
								Explorer ↗
							</a>
							<a
								href="https://github.com/abbylester1/credra"
								target="_blank"
								rel="noopener noreferrer"
								className="block text-[14px] text-ink-2 hover:text-ink transition-colors"
							>
								GitHub ↗
							</a>
						</div>
					</div>
					<div>
						<p className="text-[12px] font-mono uppercase tracking-[0.06em] text-ink-3 mb-3">Built at</p>
						<div className="space-y-2">
							<p className="text-[14px] text-ink-2">ETHGlobal Mumbai 2026</p>
							<p className="text-[14px] text-ink-2">Whitechain · Chainlink CRE</p>
						</div>
					</div>
				</div>
				<div className="border-t border-hair pt-6">
					<p className="text-[13px] text-ink-3 leading-[1.6] max-w-[720px]">
						<strong className="font-medium text-ink-2">Risk and demo notice.</strong>{' '}
						This is testnet software built at a hackathon. Tokens have no value. It is not a live lending or investment product, and not legal, credit or compliance advice.
						The external verification source is simulated. Verification is not legal enforceability or creditworthiness.
						Verdicts are recorded by an application wallet, not by the Chainlink network.{HOSTED_DEMO && ' On this hosted demo the eligibility rules run inside the app; the real CRE workflow simulation runs locally and is shown in the demo video.'}
					</p>
					<p className="text-[12px] text-ink-3 mt-4">
						© 2026 Credra. MIT License.
					</p>
				</div>
			</div>
		</footer>
	)
}

/* ─── Page ─── */
export default function LandingPage() {
	return (
		<div className="min-h-screen bg-canvas">
			<Announcement />
			<Nav />
			<Hero />
			<Ticker />
			<BuiltOn />
			<Bento />
			<Process />
			<Stats />
			<Showcase />
			<Audiences />
			<Trust />
			<CtaBanner />
			<Footer />
		</div>
	)
}
