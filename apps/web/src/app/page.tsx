'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

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
		{ label: 'For investors', href: '#investors' },
		{ label: 'Trust & verification', href: '#trust' },
	]
	return (
		<nav
			className={`fixed top-0 inset-x-0 z-50 h-[72px] flex items-center transition-all duration-150 ${scrolled ? 'bg-canvas/95 backdrop-blur-sm border-b border-hair' : 'bg-canvas'}`}
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

/* ─── Reveal wrapper ─── */
function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
	const ref = useRef<HTMLDivElement>(null)
	const [vis, setVis] = useState(false)
	useEffect(() => {
		const el = ref.current
		if (!el) return
		const mm = window.matchMedia('(prefers-reduced-motion: reduce)')
		if (mm.matches) { setVis(true); return }
		const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect() } }, { threshold: 0.15 })
		obs.observe(el)
		return () => obs.disconnect()
	}, [])
	return (
		<div
			ref={ref}
			className={`transition-all duration-700 ease-out ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
		>
			{children}
		</div>
	)
}

/* ─── Hero ─── */
function Hero() {
	return (
		<section className="pt-[72px]">
			<div className="max-w-[1200px] mx-auto px-5 md:px-8 pt-20 md:pt-28 pb-20 md:pb-28">
				<div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
					<div>
						<p className="font-mono text-[11px] uppercase tracking-[0.06em] text-accent mb-4">
							Trust-backed invoice financing
						</p>
						<h1 className="text-[40px] md:text-[64px] font-semibold leading-[1.05] tracking-[-0.03em] text-ink mb-6">
							Verified invoices.{' '}
							<span className="text-ink-3">Instant capital.</span>
						</h1>
						<p className="text-[16px] md:text-[18px] text-ink-2 leading-[1.6] mb-8 max-w-[520px]">
							Submit, verify and fund invoices in USDT — all onchain, all auditable.
						</p>
						<div className="flex flex-wrap gap-3 mb-8">
							<Link
								href="/app"
								className="bg-pine hover:bg-pine-hover text-white text-[14px] font-semibold px-[18px] h-[48px] rounded-ctl flex items-center transition-colors"
							>
								Launch app
							</Link>
							<a
								href="#process"
								className="border border-field text-ink text-[14px] font-medium px-[18px] h-[44px] rounded-ctl flex items-center hover:border-ink transition-colors"
							>
								How it works
							</a>
						</div>
						<div className="flex flex-wrap gap-2">
							{['Verification', 'Stablecoin settlement', 'Full audit trail'].map((t) => (
								<span
									key={t}
									className="text-[12px] font-mono uppercase tracking-[0.04em] text-accent bg-accent-soft px-3 py-1 rounded-chip"
								>
									{t}
								</span>
							))}
						</div>
					</div>
					{/* Product composition — three connected panels */}
					<Reveal className="hidden md:block">
						<div className="relative">
							{/* Invoice panel */}
							<div className="bg-card border border-hair rounded-card p-5 mb-3 shadow-[0_1px_2px_rgba(15,26,22,0.05)]">
								<p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3 mb-3">Invoice</p>
								<p className="font-mono text-[28px] font-medium tracking-[-0.01em] text-ink leading-[1.1]">
									10,000.00 <span className="text-ink-3 text-[80%]">USDT</span>
								</p>
								<div className="mt-3 flex items-center gap-2">
									<span className="inline-flex items-center gap-1.5 bg-accent-soft text-accent text-[12px] font-medium px-2 py-0.5 rounded-chip">
										<span className="w-1.5 h-1.5 bg-accent rounded-[1px]" />
										Eligible
									</span>
									<span className="text-[13px] text-ink-3">INV-1001 · Acme Corp</span>
								</div>
							</div>
							{/* Connector line */}
							<div className="w-px h-4 bg-hair mx-auto" />
							{/* Financing panel */}
							<div className="bg-card border border-hair rounded-card p-5 mb-3 shadow-[0_1px_2px_rgba(15,26,22,0.05)]">
								<p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3 mb-3">Financing</p>
								<div className="grid grid-cols-3 gap-4">
									<div>
										<p className="text-[12px] text-ink-3 mb-1">Amount</p>
										<p className="font-mono text-[16px] font-medium text-ink">9,000.00</p>
									</div>
									<div>
										<p className="text-[12px] text-ink-3 mb-1">Discount</p>
										<p className="font-mono text-[16px] font-medium text-ink">1,000.00</p>
									</div>
									<div>
										<p className="text-[12px] text-ink-3 mb-1">Return</p>
										<p className="font-mono text-[16px] font-medium text-accent">11.1%</p>
									</div>
								</div>
							</div>
							{/* Connector line */}
							<div className="w-px h-4 bg-hair mx-auto" />
							{/* Verification panel */}
							<div className="bg-card border border-hair rounded-card p-5 shadow-[0_1px_2px_rgba(15,26,22,0.05)]">
								<p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3 mb-3">Verification</p>
								<div className="space-y-1.5">
									{['Amount matches', 'Issuer wallet matches', 'Buyer matches', 'Due date matches', 'Document fingerprint matches'].map((c) => (
										<div key={c} className="flex items-center gap-2">
											<span className="text-accent text-[13px]">✓</span>
											<span className="text-[13px] text-ink-2">{c}</span>
										</div>
									))}
								</div>
								<div className="mt-3 bg-inset rounded-chip px-3 py-1.5">
									<span className="font-mono text-[11px] text-ink-3">
										Recorded by: application verifier wallet · tx 0x553f…d053 ↗
									</span>
								</div>
							</div>
							{/* Demo data tag */}
							<div className="absolute top-3 right-3">
								<span className="font-mono text-[10px] uppercase tracking-[0.06em] text-s-review border border-dashed border-s-review px-2 py-0.5 rounded-chip">
									Illustrative demo data
								</span>
							</div>
						</div>
					</Reveal>
				</div>
			</div>
		</section>
	)
}

/* ─── Partner strip ─── */
function Partners() {
	return (
		<section className="border-y border-hair py-10 md:py-12">
			<div className="max-w-[1200px] mx-auto px-5 md:px-8">
				<p className="text-[12px] font-mono uppercase tracking-[0.06em] text-ink-3 text-center mb-6">
					Built on
				</p>
				<div className="flex items-center justify-center gap-10 md:gap-16 flex-wrap">
					{/* Whitechain */}
					<div className="flex items-center gap-2.5 text-ink-2">
						<Image src="/whitechain.svg" alt="Whitechain" width={28} height={28} className="rounded-[6px]" />
						<span className="text-[16px] font-semibold tracking-[-0.01em]">Whitechain</span>
					</div>
					{/* Chainlink */}
					<div className="flex items-center gap-2.5 text-ink-2">
						<Image src="/chainlink.svg" alt="Chainlink" width={28} height={28} className="rounded-[6px]" />
						<span className="text-[16px] font-semibold tracking-[-0.01em]">Chainlink CRE</span>
					</div>
					{/* USDT */}
					<div className="flex items-center gap-2.5 text-ink-2">
						<Image src="/usdt.svg" alt="USDT" width={28} height={28} className="rounded-[6px]" />
						<span className="text-[16px] font-semibold tracking-[-0.01em]">USDT</span>
					</div>
				</div>
			</div>
		</section>
	)
}

/* ─── Approach cards ─── */
const approaches = [
	{
		title: 'Verified before funded',
		desc: 'Every invoice is checked against an external record before financing opens.',
		icon: (
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
				<path d="M6 10l3 3 5-6" />
				<rect x="2" y="3" width="16" height="14" rx="2" />
			</svg>
		),
	},
	{
		title: 'No double financing',
		desc: 'Duplicate invoice IDs and document hashes are rejected onchain.',
		icon: (
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
				<rect x="3" y="3" width="10" height="12" rx="2" />
				<rect x="7" y="5" width="10" height="12" rx="2" />
			</svg>
		),
	},
	{
		title: 'Direct settlement',
		desc: 'USDT moves straight between parties. No platform custody.',
		icon: (
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
				<path d="M2 10h16M6 6l-4 4 4 4M14 6l4 4-4 4" />
			</svg>
		),
	},
	{
		title: 'Full audit trail',
		desc: 'Every step from submission to repayment is onchain with explorer links.',
		icon: (
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
				<rect x="3" y="2" width="14" height="16" rx="2" />
				<path d="M7 7h6M7 10h6M7 13h4" />
			</svg>
		),
	},
]

function Approach() {
	return (
		<section className="py-[88px] md:py-[112px] bg-inset">
			<div className="max-w-[1200px] mx-auto px-5 md:px-8">
				<Reveal>
					<p className="font-mono text-[11px] uppercase tracking-[0.06em] text-accent mb-3">Approach</p>
					<h2 className="text-[32px] md:text-[44px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink mb-4 max-w-[600px]">
						Evidence first,{' '}
						<span className="text-ink-3">not assumptions.</span>
					</h2>
					<p className="text-[16px] md:text-[18px] text-ink-2 leading-[1.6] mb-12 max-w-[560px]">
						Verify against an external record, register onchain, fund in USDT. Every step auditable.
					</p>
				</Reveal>
				<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
					{approaches.map((a) => (
						<Reveal key={a.title}>
							<div className="bg-card border border-hair rounded-card p-7 h-full shadow-[0_1px_3px_rgba(15,26,22,0.04)] hover:border-field transition-colors">
								<div className="w-12 h-12 rounded-ctl bg-accent-soft flex items-center justify-center text-accent mb-5">
									{a.icon}
								</div>
								<h3 className="text-[16px] font-semibold text-ink mb-2">{a.title}</h3>
								<p className="text-[14px] text-ink-2 leading-[1.6]">{a.desc}</p>
							</div>
						</Reveal>
					))}
				</div>
			</div>
		</section>
	)
}

/* ─── Process steps ─── */
const steps = [
	{ num: '01', title: 'Submit', desc: 'Register an invoice onchain with a document fingerprint, amounts and due date.' },
	{ num: '02', title: 'Verify', desc: 'A CRE workflow reads the record, calls an external source and returns a verdict.' },
	{ num: '03', title: 'Determine eligibility', desc: 'Eligible invoices open for funding. Failures fall to manual review — never eligible.' },
	{ num: '04', title: 'Fund', desc: 'An approved investor funds in USDT. The business is paid directly; the investor gets a receivable token.' },
	{ num: '05', title: 'Settle', desc: 'Full invoice amount repaid to the token holder. Every step onchain.' },
]

function Process() {
	return (
		<section id="process" className="py-[88px] md:py-[112px] scroll-mt-[72px]">
			<div className="max-w-[1200px] mx-auto px-5 md:px-8">
				<Reveal>
					<p className="font-mono text-[11px] uppercase tracking-[0.06em] text-accent mb-3">How it works</p>
					<h2 className="text-[32px] md:text-[44px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink mb-4 max-w-[600px]">
						Invoice to settlement{' '}
						<span className="text-ink-3">in five steps.</span>
					</h2>
					<p className="text-[16px] md:text-[18px] text-ink-2 leading-[1.6] mb-14 max-w-[560px]">
						Every step onchain. Every participant can inspect the trail.
					</p>
				</Reveal>
				{/* Horizontal timeline on desktop */}
				<div className="hidden lg:grid grid-cols-5 gap-6">
					{steps.map((s, i) => (
						<Reveal key={s.num}>
							<div className="relative">
								{i < steps.length - 1 && (
									<div className="absolute top-5 left-[calc(50%+20px)] right-[-12px] h-px bg-hair" />
								)}
								<div className="flex items-center gap-3 mb-4">
									<div className="w-10 h-10 rounded-ctl bg-accent-soft text-accent font-mono text-[14px] font-medium flex items-center justify-center shrink-0">
										{s.num}
									</div>
								</div>
								<h3 className="text-[16px] font-semibold text-ink mb-2">{s.title}</h3>
								<p className="text-[14px] text-ink-2 leading-[1.6]">{s.desc}</p>
							</div>
						</Reveal>
					))}
				</div>
				{/* Vertical mobile with connector line */}
				<div className="lg:hidden">
					{steps.map((s, i) => (
						<Reveal key={s.num}>
							<div className="flex gap-4">
								<div className="flex flex-col items-center">
									<div className="w-10 h-10 rounded-ctl bg-accent-soft text-accent font-mono text-[14px] font-medium flex items-center justify-center shrink-0">
										{s.num}
									</div>
									{i < steps.length - 1 && <div className="w-px flex-1 bg-hair min-h-[24px]" />}
								</div>
								<div className="pb-6">
									<h3 className="text-[16px] font-semibold text-ink mb-1">{s.title}</h3>
									<p className="text-[14px] text-ink-2 leading-[1.6]">{s.desc}</p>
								</div>
							</div>
						</Reveal>
					))}
				</div>
			</div>
		</section>
	)
}

/* ─── Stats strip ─── */
function Stats() {
	const stats = [
		{ value: '3', label: 'Verified contracts' },
		{ value: '66', label: 'Tests passing' },
		{ value: '5', label: 'On-chain checks' },
		{ value: '0', label: 'Funds held by contracts' },
	]
	return (
		<section className="border-y border-hair py-12 md:py-16 bg-inset">
			<div className="max-w-[1200px] mx-auto px-5 md:px-8">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
					{stats.map((s) => (
						<Reveal key={s.label}>
							<div className="text-center">
								<p className="font-mono text-[36px] md:text-[44px] font-semibold tracking-[-0.02em] text-ink leading-[1]">
									{s.value}
								</p>
								<p className="text-[13px] text-ink-3 mt-2">{s.label}</p>
							</div>
						</Reveal>
					))}
				</div>
			</div>
		</section>
	)
}

/* ─── Product showcase ─── */
function Showcase() {
	return (
		<section className="py-[88px] md:py-[112px]">
			<div className="max-w-[1200px] mx-auto px-5 md:px-8 space-y-20 md:space-y-28">
				{/* Story 1 */}
				<Reveal>
					<div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
						<div>
							<p className="font-mono text-[11px] uppercase tracking-[0.06em] text-accent mb-3">For investors</p>
							<h2 className="text-[28px] md:text-[36px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink mb-4">
								Know what you are funding.
							</h2>
							<p className="text-[16px] text-ink-2 leading-[1.6]">
								Full verification record before you commit: checks passed, external source, who recorded the verdict.
							</p>
						</div>
						<div className="bg-card border border-hair rounded-card p-7 shadow-[0_1px_3px_rgba(15,26,22,0.04)]">
							<p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3 mb-4">Verification record</p>
							<div className="space-y-2.5">
								{['Invoice amount matches the external record', 'Issuer wallet matches', 'Buyer reference matches', 'Document fingerprint matches', 'Invoice exists in the external record'].map((c) => (
									<div key={c} className="flex items-center gap-2.5">
										<span className="text-accent font-medium">✓</span>
										<span className="text-[14px] text-ink-2">{c}</span>
									</div>
								))}
							</div>
							<div className="mt-4 bg-inset rounded-chip px-3 py-2">
								<span className="font-mono text-[11px] text-ink-3 leading-relaxed">
									Source: simulated ERP record · Recorded by: application verifier wallet
								</span>
							</div>
						</div>
					</div>
				</Reveal>

				{/* Story 2 */}
				<Reveal>
					<div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
						<div className="md:order-2">
							<p className="font-mono text-[11px] uppercase tracking-[0.06em] text-accent mb-3">Economics</p>
							<h2 className="text-[28px] md:text-[36px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink mb-4">
								Clear economics, no surprises.
							</h2>
							<p className="text-[16px] text-ink-2 leading-[1.6]">
								Amount, discount and return shown upfront. Funds move directly between parties.
							</p>
						</div>
						<div className="bg-card border border-hair rounded-card p-7 shadow-[0_1px_3px_rgba(15,26,22,0.04)] md:order-1">
							<p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3 mb-4">Financial terms</p>
							<div className="grid grid-cols-2 gap-y-5 gap-x-8">
								<div>
									<p className="text-[12px] text-ink-3 mb-0.5">Invoice amount</p>
									<p className="font-mono text-[22px] font-medium text-ink tracking-[-0.01em]">10,000.00 <span className="text-ink-3 text-[60%]">USDT</span></p>
								</div>
								<div>
									<p className="text-[12px] text-ink-3 mb-0.5">Financing amount</p>
									<p className="font-mono text-[22px] font-medium text-ink tracking-[-0.01em]">9,000.00 <span className="text-ink-3 text-[60%]">USDT</span></p>
								</div>
								<div>
									<p className="text-[12px] text-ink-3 mb-0.5">Discount</p>
									<p className="font-mono text-[18px] font-medium text-ink">1,000.00</p>
								</div>
								<div>
									<p className="text-[12px] text-ink-3 mb-0.5">Implied return</p>
									<p className="font-mono text-[18px] font-medium text-accent">11.1%</p>
								</div>
							</div>
						</div>
					</div>
				</Reveal>

				{/* Story 3 */}
				<Reveal>
					<div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
						<div>
							<p className="font-mono text-[11px] uppercase tracking-[0.06em] text-accent mb-3">Transparency</p>
							<h2 className="text-[28px] md:text-[36px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink mb-4">
								Every step, every actor, onchain.
							</h2>
							<p className="text-[16px] text-ink-2 leading-[1.6]">
								State changes, timestamps and explorer links. Anyone can audit the full history.
							</p>
						</div>
						<div className="bg-card border border-hair rounded-card p-7 shadow-[0_1px_3px_rgba(15,26,22,0.04)]">
							<p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3 mb-4">Timeline</p>
							<div className="space-y-0">
								{[
									{ status: 'Submitted', actor: 'Business wallet', color: 'bg-s-neutral' },
									{ status: 'Eligible', actor: 'Verifier wallet', color: 'bg-accent' },
									{ status: 'Funded', actor: 'Investor wallet', color: 'bg-s-funded' },
									{ status: 'Repaid', actor: 'Business wallet', color: 'bg-s-repaid' },
								].map((e, i, arr) => (
									<div key={e.status} className="flex gap-4">
										<div className="flex flex-col items-center">
											<div className={`w-2 h-2 rounded-[1px] ${e.color} shrink-0 mt-1.5`} />
											{i < arr.length - 1 && <div className="w-px flex-1 bg-hair min-h-[32px]" />}
										</div>
										<div className="pb-4">
											<p className="text-[14px] font-medium text-ink">{e.status}</p>
											<p className="text-[12px] text-ink-3 font-mono">{e.actor} · tx ↗</p>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</Reveal>
			</div>
		</section>
	)
}

/* ─── Audience sections ─── */
function Audiences() {
	return (
		<section className="py-[88px] md:py-[112px]">
			<div className="max-w-[1200px] mx-auto px-5 md:px-8">
				<div className="grid md:grid-cols-2 gap-6">
					<Reveal>
						<div id="businesses" className="scroll-mt-[72px] bg-card border border-hair rounded-card p-8 md:p-10 h-full flex flex-col shadow-[0_1px_3px_rgba(15,26,22,0.04)]">
							<p className="font-mono text-[11px] uppercase tracking-[0.06em] text-accent mb-3">For businesses</p>
							<h2 className="text-[24px] md:text-[28px] font-semibold leading-[1.15] tracking-[-0.01em] text-ink mb-3">
								Get paid before the buyer pays.
							</h2>
							<p className="text-[15px] text-ink-2 leading-[1.6] mb-8 flex-1">
								Submit an invoice, get it verified, access USDT financing. No waiting.
							</p>
							<Link
								href="/app"
								className="bg-pine hover:bg-pine-hover text-white text-[14px] font-semibold px-[18px] h-[48px] rounded-ctl flex items-center justify-center transition-colors w-full sm:w-auto sm:inline-flex"
							>
								Explore financing
							</Link>
						</div>
					</Reveal>
					<Reveal>
						<div id="investors" className="scroll-mt-[72px] bg-card border border-hair rounded-card p-8 md:p-10 h-full flex flex-col shadow-[0_1px_3px_rgba(15,26,22,0.04)]">
							<p className="font-mono text-[11px] uppercase tracking-[0.06em] text-accent mb-3">For investors</p>
							<h2 className="text-[24px] md:text-[28px] font-semibold leading-[1.15] tracking-[-0.01em] text-ink mb-3">
								Fund verified receivables in USDT.
							</h2>
							<p className="text-[15px] text-ink-2 leading-[1.6] mb-8 flex-1">
								Fund eligible invoices, receive a receivable token, track repayment onchain.
							</p>
							<Link
								href="/app"
								className="border border-field text-ink text-[14px] font-medium px-[18px] h-[44px] rounded-ctl flex items-center justify-center hover:border-ink transition-colors w-full sm:w-auto sm:inline-flex"
							>
								Explore opportunities
							</Link>
						</div>
					</Reveal>
				</div>
			</div>
		</section>
	)
}

/* ─── Trust section ─── */
const trustItems = [
	{
		title: 'Document fingerprints',
		desc: 'A keccak256 hash proves the document has not changed since submission.',
	},
	{
		title: 'CRE verification',
		desc: 'A Chainlink CRE workflow reads the onchain record, calls an external source and applies eligibility rules.',
	},
	{
		title: 'Source-verified contracts',
		desc: 'Whitechain Sepolia contracts enforce duplicate rejection, allowlist-gated receivables and direct settlement.',
	},
	{
		title: 'Provenance on every action',
		desc: 'Every status change recorded with the actor, timestamp and explorer link.',
	},
]

function Trust() {
	return (
		<section id="trust" className="py-[88px] md:py-[112px] scroll-mt-[72px] bg-inset">
			<div className="max-w-[1200px] mx-auto px-5 md:px-8">
				<Reveal>
					<p className="font-mono text-[11px] uppercase tracking-[0.06em] text-accent mb-3">Trust & verification</p>
					<h2 className="text-[32px] md:text-[44px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink mb-4 max-w-[600px]">
						Trust backed by{' '}
						<span className="text-ink-3">evidence, not promises.</span>
					</h2>
					<p className="text-[16px] md:text-[18px] text-ink-2 leading-[1.6] mb-12 max-w-[560px]">
						Every step inspectable. No hidden intermediaries.
					</p>
				</Reveal>
				<div className="grid sm:grid-cols-2 gap-6">
					{trustItems.map((t) => (
						<Reveal key={t.title}>
							<div className="bg-card border border-hair rounded-card p-7 h-full shadow-[0_1px_3px_rgba(15,26,22,0.04)]">
								<h3 className="text-[16px] font-semibold text-ink mb-2">{t.title}</h3>
								<p className="text-[14px] text-ink-2 leading-[1.6]">{t.desc}</p>
							</div>
						</Reveal>
					))}
				</div>
			</div>
		</section>
	)
}

/* ─── Final CTA band (pine background, the one allowed dark section) ─── */
function CtaBand() {
	return (
		<section className="py-[88px] md:py-[112px]">
			<div className="max-w-[1200px] mx-auto px-5 md:px-8">
				<div className="bg-pine rounded-win p-10 md:p-16 text-center max-w-[760px] mx-auto">
					<h2 className="text-[28px] md:text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-white mb-4">
						Invoice financing you can verify.
					</h2>
					<p className="text-[16px] text-white/70 leading-[1.6] mb-8 max-w-[480px] mx-auto">
						Submit. Verify. Fund. Settle. Every step onchain.
					</p>
					<div className="flex flex-col sm:flex-row gap-3 justify-center">
						<Link
							href="/app"
							className="bg-white text-pine text-[14px] font-semibold px-[18px] h-[48px] rounded-ctl flex items-center justify-center hover:bg-white/90 transition-colors"
						>
							Launch app
						</Link>
						<a
							href="https://github.com/abbylester1/credra"
							target="_blank"
							rel="noopener noreferrer"
							className="text-white/80 text-[14px] font-medium px-[18px] h-[44px] flex items-center justify-center hover:text-white transition-colors"
						>
							View on GitHub ↗
						</a>
					</div>
				</div>
			</div>
		</section>
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
							<a href="#investors" className="block text-[14px] text-ink-2 hover:text-ink transition-colors">For investors</a>
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
						Verdicts are recorded by an application wallet, not by the Chainlink network.
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
		<div className="bg-canvas min-h-screen">
			<Nav />
			<Hero />
			<Partners />
			<Approach />
			<Process />
			<Stats />
			<Showcase />
			<Audiences />
			<Trust />
			<CtaBand />
			<Footer />
		</div>
	)
}
