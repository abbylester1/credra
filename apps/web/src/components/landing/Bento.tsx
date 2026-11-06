'use client'

import { useEffect, useState } from 'react'
import { Chip, EXPLORER, Eyebrow, ExternalArrow, Heading, Mono, Reveal, Tick, TX, UsdtMark, short, useInView } from './shared'

/** Sequence helper: returns how many steps have elapsed once the node is in view. */
function useSteps(total: number, ms: number) {
	const [ref, seen] = useInView<HTMLDivElement>(0.35)
	const [n, setN] = useState(0)
	useEffect(() => {
		if (!seen) return
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(total); return }
		let i = 0
		const id = setInterval(() => { i += 1; setN(i); if (i >= total) clearInterval(id) }, ms)
		return () => clearInterval(id)
	}, [seen, total, ms])
	return [ref, n] as const
}

function Card({ href, title, rest, className = '', children }: { href: string; title: string; rest: string; className?: string; children: React.ReactNode }) {
	const external = href.startsWith('http')
	return (
		<article className={`group relative flex flex-col overflow-hidden rounded-[20px] border border-hair bg-inset transition-shadow duration-300 hover:shadow-[0_18px_40px_-24px_rgba(15,26,22,0.35)] ${className}`}>
			<div className="flex items-start justify-between gap-4 p-7 pb-0">
				<h3 className="max-w-[360px] text-[22px] font-semibold leading-[1.2] tracking-[-0.02em] text-ink md:text-[24px]">
					{title} <span className="text-ink-3">{rest}</span>
				</h3>
				<a
					href={href}
					{...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
					aria-label={`${title}: learn more`}
					className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ctl border border-hair bg-card text-ink transition-all duration-300 group-hover:border-pine group-hover:bg-pine group-hover:text-white"
				>
					<ExternalArrow />
				</a>
			</div>
			<div className="relative mt-6 flex-1 px-7">{children}</div>
		</article>
	)
}

/* ── 1. Verified before funded ── */
const ROWS: [string, string, string][] = [
	['Amount', '10,000.00', '10,000.00'],
	['Issuer wallet', '0x1951…90D6', '0x1951…90D6'],
	['Buyer', 'ACME-BUYER-7', 'ACME-BUYER-7'],
	['Due date', '30 Nov 2026', '30 Nov 2026'],
	['Document hash', '0x9a1f…c2e0', '0x9a1f…c2e0'],
]
function VerifyIllustration() {
	const [ref, n] = useSteps(ROWS.length + 1, 650)
	return (
		<div ref={ref} className="absolute inset-x-7 top-0 rounded-t-[14px] border border-b-0 border-hair bg-card p-5 shadow-[0_-8px_30px_-20px_rgba(15,26,22,0.3)]">
			<div className="mb-3 flex items-center justify-between">
				<div>
					<p className="label">Verification</p>
					<p className="font-mono text-[12px] text-ink-2">INV-1001 · demo values</p>
				</div>
				<span className="h-6">{n > ROWS.length ? <span className="animate-popin inline-block"><Chip tone="accent">Eligible</Chip></span> : <Chip tone="review">Checking</Chip>}</span>
			</div>
			<div className="grid grid-cols-[1fr_1fr_1fr_20px] gap-x-3 border-b border-hair pb-1.5 text-[11px] text-ink-3"><span>Field</span><span>Onchain</span><span>External</span><span /></div>
			{ROWS.map(([k, a, b], i) => (
				<div key={k} className="grid grid-cols-[1fr_1fr_1fr_20px] items-center gap-x-3 border-b border-hair py-2 text-[12px] last:border-0">
					<span className="text-ink-2">{k}</span>
					<Mono className="text-ink">{a}</Mono>
					<Mono className={`transition-opacity duration-300 ${i < n ? 'opacity-100' : 'opacity-15'}`}>{b}</Mono>
					<Tick on={i < n} />
				</div>
			))}
		</div>
	)
}

/* ── 2. No double financing ── */
function DuplicateIllustration() {
	const [ref, n] = useSteps(3, 900)
	return (
		<div ref={ref} className="absolute inset-x-7 top-0 space-y-3">
			<div className={`rounded-card border border-hair bg-card p-4 transition-all duration-500 ${n >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}>
				<div className="flex items-center justify-between">
					<span className="font-mono text-[12px] text-ink">INV-1001 · Acme Corp</span>
					<Chip tone="accent">Registered</Chip>
				</div>
				<p className="mt-1 font-mono text-[11px] text-ink-3">document hash 0x9a1f…c2e0</p>
			</div>
			<div className={`rounded-card border border-s-reject/40 bg-card p-4 ${n >= 2 ? 'animate-shake opacity-100' : 'opacity-0'}`}>
				<div className="flex items-center justify-between">
					<span className="font-mono text-[12px] text-ink">INV-1001 · submitted again</span>
					<Chip tone="reject">Reverted</Chip>
				</div>
				<p className="mt-1 font-mono text-[11px] text-s-reject">DuplicateInvoice()</p>
			</div>
			<div className={`rounded-card border border-s-reject/40 bg-card p-4 ${n >= 3 ? 'animate-shake opacity-100' : 'opacity-0'}`}>
				<div className="flex items-center justify-between">
					<span className="font-mono text-[12px] text-ink">INV-2044 · same document</span>
					<Chip tone="reject">Reverted</Chip>
				</div>
				<p className="mt-1 font-mono text-[11px] text-s-reject">DuplicateDocument()</p>
			</div>
		</div>
	)
}

/* ── 3. Direct settlement ── */
function FlowIllustration() {
	return (
		<div className="absolute inset-x-7 top-0">
			<div className="rounded-card border border-hair bg-card p-5">
				<div className="flex items-center justify-between gap-2">
					<Wallet label="Investor" />
					<Pipe label="9,000.00" />
					<Wallet label="Business" />
				</div>
				<div className="my-4 border-t border-dashed border-hair" />
				<div className="flex items-center justify-between gap-2">
					<Wallet label="Payer" />
					<Pipe label="10,000.00" />
					<Wallet label="Token holder" />
				</div>
				<p className="mt-4 rounded-ctl bg-inset px-3 py-2 text-center font-mono text-[11px] text-ink-2">Contract balance: 0.00 USDT</p>
			</div>
		</div>
	)
}
const Wallet = ({ label }: { label: string }) => (
	<div className="flex w-[78px] flex-col items-center gap-1.5">
		<span className="flex h-9 w-9 items-center justify-center rounded-ctl border border-hair bg-canvas"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-ink-2"><rect x="1.5" y="3.5" width="13" height="9" rx="2" /><path d="M11 8h2" strokeLinecap="round" /></svg></span>
		<span className="text-center text-[11px] text-ink-2">{label}</span>
	</div>
)
const Pipe = ({ label }: { label: string }) => (
	<div className="flex flex-1 flex-col items-center gap-1">
		<span className="flex items-center gap-1 font-mono text-[11px] text-ink"><UsdtMark size={14} />{label}</span>
		<svg viewBox="0 0 100 8" className="h-2 w-full text-accent" preserveAspectRatio="none"><line x1="0" y1="4" x2="96" y2="4" stroke="currentColor" strokeWidth="1.6" strokeDasharray="5 4" className="animate-flow" /><path d="M92 1l5 3-5 3" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
	</div>
)

/* ── 4. Audit trail ── */
function AuditIllustration() {
	const [ref, n] = useSteps(4, 700)
	const items: [string, string, string, 'neutral' | 'accent' | 'funded' | 'repaid'][] = [
		['Submitted', 'Business wallet', '', 'neutral'],
		['Eligible', 'Verifier wallet', '', 'accent'],
		['Funded', 'Investor wallet', short(TX.fund), 'funded'],
		['Repaid', 'Business wallet', short(TX.repay), 'repaid'],
	]
	return (
		<div ref={ref} className="absolute inset-x-7 top-0 rounded-card border border-hair bg-card p-4">
			{items.map(([s, who, tx, tone], i) => (
				<div key={s} className={`flex items-center justify-between gap-3 border-b border-hair py-2 transition-all duration-500 last:border-0 ${i < n ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}`}>
					<div className="flex items-center gap-2.5"><Chip tone={tone}>{s}</Chip><span className="text-[12px] text-ink-3">{who}</span></div>
					{tx ? <a href={`${EXPLORER}/tx/${i === 2 ? TX.fund : TX.repay}`} target="_blank" rel="noreferrer" className="font-mono text-[11px] text-accent hover:underline">{tx} ↗</a> : <span className="font-mono text-[11px] text-ink-3">onchain</span>}
				</div>
			))}
		</div>
	)
}

/* ── 5. Fails safe ── */
function FailSafeIllustration() {
	const [ref, n] = useSteps(4, 800)
	const lines: [string, string, string][] = [
		['read', 'InvoiceRegistry.getInvoice()', 'text-ink-2'],
		['call', 'GET /verify  ·  timeout 5s', 'text-ink-2'],
		['warn', 'external_api_unavailable', 'text-s-review'],
		['verdict', 'MANUAL_REVIEW  (never ELIGIBLE)', 'text-accent'],
	]
	return (
		<div ref={ref} className="absolute inset-x-7 top-0 rounded-card bg-pine p-4 font-mono text-[11px] text-white/80">
			<div className="mb-2 flex gap-1.5"><span className="h-2 w-2 rounded-full bg-white/20" /><span className="h-2 w-2 rounded-full bg-white/20" /><span className="h-2 w-2 rounded-full bg-white/20" /></div>
			{lines.map(([k, v, c], i) => (
				<p key={k} className={`py-0.5 transition-all duration-500 ${i < n ? 'opacity-100' : 'opacity-0'}`}>
					<span className="mr-2 text-white/40">{k.padEnd(7, ' ')}</span>
					<span className={i === 2 ? 'text-[#F4C77A]' : i === 3 ? 'text-[#7FE0C8]' : c === 'text-ink-2' ? 'text-white/80' : ''}>{v}</span>
				</p>
			))}
			<span className="animate-blink inline-block h-3 w-1.5 bg-white/70" />
		</div>
	)
}

export function Bento() {
	return (
		<section id="approach" className="scroll-mt-[72px] py-[72px] md:py-[104px]">
			<div className="mx-auto max-w-[1200px] px-5 md:px-8">
				<Reveal>
					<Eyebrow>Approach</Eyebrow>
					<Heading lead="Evidence first." rest="Every claim is checked, then recorded." className="max-w-[760px]" />
					<p className="mb-12 mt-5 max-w-[560px] text-[17px] leading-[1.55] text-ink-2">
						Credra funds an invoice only after its onchain record matches an external one. The rules are in code, not in a policy document. Illustrations use demo values; the Funded and Repaid links are real testnet transactions.
					</p>
				</Reveal>
				<div className="grid gap-5 lg:grid-cols-2">
					<Reveal><Card href="#process" title="Verified before funded" rest="so nothing opens until the record matches." className="h-[460px]"><VerifyIllustration /></Card></Reveal>
					<Reveal delay={100}><Card href="https://github.com/abbylester1/credra/blob/main/contracts/src/InvoiceRegistry.sol" title="No double financing" rest="because duplicates revert onchain." className="h-[460px]"><DuplicateIllustration /></Card></Reveal>
				</div>
				<div className="mt-5 grid gap-5 lg:grid-cols-3">
					<Reveal><Card href="#economics" title="Direct settlement" rest="with no custody in between." className="h-[400px]"><FlowIllustration /></Card></Reveal>
					<Reveal delay={100}><Card href="#transparency" title="A full audit trail" rest="with an explorer link per step." className="h-[400px]"><AuditIllustration /></Card></Reveal>
					<Reveal delay={200}><Card href="#trust" title="Fails safe" rest="to manual review, never to eligible." className="h-[400px]"><FailSafeIllustration /></Card></Reveal>
				</div>
			</div>
		</section>
	)
}
