'use client'

import { useEffect, useState } from 'react'
import { Chip, Eyebrow, Heading, Mono, Reveal, Tick, UsdtMark, ChainlinkMark } from './shared'

const STEPS = [
	{ title: 'Submit', who: 'Business', desc: 'Register amount, due date, buyer and a document hash onchain.' },
	{ title: 'Verify', who: 'Chainlink CRE', desc: 'A CRE workflow checks the record against an external source.' },
	{ title: 'Decide', who: 'Verifier wallet', desc: 'Verdict goes onchain. Any failure means manual review.' },
	{ title: 'Fund', who: 'Investor', desc: 'An approved investor pays the business in USDT and gets the receivable.' },
	{ title: 'Settle', who: 'Payer', desc: 'Full amount goes to the receivable holder. No contract holds funds.' },
]
const DURATION = 6500

/* ── per-step illustrations (remounted on step change so their animations replay) ── */
function Field({ k, v, delay = 0 }: { k: string; v: string; delay?: number }) {
	return (
		<div className="animate-slidein flex items-center justify-between border-b border-hair py-2.5 last:border-0" style={{ animationDelay: `${delay}ms` }}>
			<span className="text-[12px] text-ink-3">{k}</span><Mono className="text-[13px] text-ink">{v}</Mono>
		</div>
	)
}
function Shell({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="animate-popin w-full max-w-[460px] rounded-card border border-hair bg-card p-5 shadow-[0_20px_50px_-28px_rgba(18,17,15,0.4)]">
			<p className="label mb-3">{title}</p>
			{children}
		</div>
	)
}

function Submit() {
	return (
		<Shell title="New invoice">
			<Field k="Invoice number" v="INV-1001" delay={0} />
			<Field k="Amount" v="10,000.00 USDT" delay={120} />
			<Field k="Financing amount" v="9,000.00 USDT" delay={240} />
			<Field k="Due date" v="30 Nov 2026" delay={360} />
			<Field k="keccak256(document)" v="0x9a1f…c2e0" delay={480} />
			<div className="animate-popin mt-4 flex items-center justify-between rounded-ctl bg-pine px-4 py-2.5 text-white" style={{ animationDelay: '800ms' }}>
				<span className="text-[13px] font-medium">Submit onchain</span>
				<span className="font-mono text-[11px] text-white/70">InvoiceRegistry.submit()</span>
			</div>
		</Shell>
	)
}
function Verify() {
	const lines: [string, string][] = [
		['read', 'invoice 0x4c2a… from Whitechain'],
		['http', 'GET mock-registry /invoices/INV-1001'],
		['rule', 'amount, issuer, buyer, due date, hash'],
		['rule', 'terms valid · status submitted'],
		['done', 'verdict ELIGIBLE'],
	]
	return (
		<div className="animate-popin w-full max-w-[460px] overflow-hidden rounded-card bg-ink p-5 font-mono text-[12px] text-white/80 shadow-[0_20px_50px_-28px_rgba(9,46,41,0.8)]">
			<div className="mb-3 flex items-center gap-2 text-white"><ChainlinkMark size={16} /><span className="text-[12px]">cre workflow simulate invoice-verification</span></div>
			{lines.map(([k, v], i) => (
				<p key={v} className="animate-slidein py-1" style={{ animationDelay: `${i * 450}ms` }}>
					<span className="mr-3 text-white/40">{k}</span>
					<span className={i === 4 ? 'text-[#7FE0C8]' : ''}>{v}</span>
				</p>
			))}
		</div>
	)
}
function Decide() {
	const outcomes: [string, 'accent' | 'review' | 'reject', string, boolean][] = [
		['Eligible', 'accent', 'Every check matches', true],
		['Manual review', 'review', 'Outage, dispute or ambiguity', false],
		['Rejected', 'reject', 'A field does not match', false],
	]
	return (
		<Shell title="Verdict written onchain">
			<div className="space-y-2.5">
				{outcomes.map(([l, tone, d, on], i) => (
					<div key={l} className={`animate-slidein flex items-center justify-between rounded-card border p-3.5 ${on ? 'border-verified bg-verified-soft/50' : 'border-hair opacity-60'}`} style={{ animationDelay: `${i * 140}ms` }}>
						<div><Chip tone={tone}>{l}</Chip><p className="mt-1.5 text-[12px] text-ink-3">{d}</p></div>
						{on && <Tick on />}
					</div>
				))}
			</div>
		</Shell>
	)
}
function Fund() {
	return (
		<Shell title="Fund invoice">
			<div className="flex items-center justify-between rounded-card bg-canvas p-4">
				<div className="flex items-center gap-2.5"><UsdtMark size={28} /><div><p className="font-mono text-[18px] font-medium text-ink">9,000.00</p><p className="text-[11px] text-ink-3">USDT to the business</p></div></div>
				<Chip tone="funded">Funded</Chip>
			</div>
			<div className="animate-popin relative mt-4 h-[104px] overflow-hidden rounded-[12px] bg-pine p-4 text-white" style={{ animationDelay: '600ms' }}>
				<div className="linegrid absolute inset-0 opacity-60" />
				<div className="relative flex h-full flex-col justify-between">
					<div className="flex justify-between"><span className="text-[14px] font-semibold">credra</span><span className="font-mono text-[10px] text-white/60">CRDR · ERC-721</span></div>
					<div><p className="font-mono text-[10px] uppercase text-white/60">Receivable minted to investor</p><p className="font-mono text-[15px]">10,000.00 USDT due 30 Nov</p></div>
				</div>
			</div>
		</Shell>
	)
}
function Settle() {
	return (
		<Shell title="Repayment">
			<p className="font-mono text-[28px] font-medium leading-none text-ink">10,000.00 <span className="text-[12px] text-ink-3">USDT</span></p>
			<p className="mt-1 text-[12px] text-ink-3">paid to the current receivable holder</p>
			<div className="mt-4 flex h-3 overflow-hidden rounded-full bg-inset">
				<div className="animate-fillbar h-full bg-pine" style={{ width: '90%' }} />
				<div className="animate-fillbar h-full bg-verified" style={{ width: '10%', animationDelay: '500ms' }} />
			</div>
			<div className="mt-2 flex justify-between text-[11px]"><span className="text-ink-2">Principal 9,000.00</span><span className="text-verified">Discount 1,000.00</span></div>
			<div className="mt-4"><Chip tone="repaid">Repaid</Chip></div>
		</Shell>
	)
}
const VIEWS = [Submit, Verify, Decide, Fund, Settle]

export function Process() {
	const [active, setActive] = useState(0)
	const [paused, setPaused] = useState(false)
	const [ticks, setTicks] = useState(0)

	useEffect(() => {
		if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
		const id = setTimeout(() => { setActive((a) => (a + 1) % STEPS.length); setTicks((t) => t + 1) }, DURATION)
		return () => clearTimeout(id)
	}, [active, paused])

	const View = VIEWS[active]
	return (
		<section id="process" className="scroll-mt-[72px] bg-card py-[72px] md:py-[104px]">
			<div className="mx-auto max-w-[1200px] px-5 md:px-8">
				<Reveal>
					<Eyebrow>How it works</Eyebrow>
					<Heading lead="From invoice to settlement" rest="in five steps." className="max-w-[760px]" />
					<p className="mb-12 mt-5 max-w-[480px] text-[17px] leading-[1.55] text-ink-2">Every step is a transaction you can open on the explorer.</p>
				</Reveal>
				<div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
					<ol className="space-y-2">
						{STEPS.map((s, i) => {
							const on = i === active
							return (
								<li key={s.title}>
									<button
										onClick={() => setActive(i)}
										aria-current={on ? 'step' : undefined}
										className={`relative w-full overflow-hidden rounded-card border p-5 text-left transition-all duration-300 ${on ? 'border-hair bg-canvas' : 'border-transparent hover:bg-canvas/60'}`}
									>
										<div className="flex items-center gap-4">
											<span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-ctl font-mono text-[13px] font-medium transition-colors ${on ? 'bg-pine text-white' : 'bg-inset text-ink-3'}`}>{String(i + 1).padStart(2, '0')}</span>
											<div className="flex-1">
												<div className="flex items-baseline justify-between gap-3">
													<h3 className={`text-[18px] font-semibold tracking-[-0.01em] ${on ? 'text-ink' : 'text-ink-2'}`}>{s.title}</h3>
													<span className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-3">{s.who}</span>
												</div>
												<div className={`grid transition-all duration-300 ${on ? 'mt-2 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
													<p className="overflow-hidden text-[14px] leading-[1.6] text-ink-2">{s.desc}</p>
												</div>
											</div>
										</div>
										{on && (
											<span className="absolute inset-x-0 bottom-0 h-[2px] bg-hair">
												<span key={`${active}-${ticks}-${paused}`} className="block h-full origin-left bg-accent" style={{ animation: paused ? undefined : `fillbar ${DURATION}ms linear both`, transform: paused ? 'scaleX(1)' : undefined }} />
											</span>
										)}
									</button>
								</li>
							)
						})}
					</ol>
					<div className="dotgrid flex min-h-[420px] items-center justify-center rounded-[20px] border border-hair bg-inset p-6 md:p-10">
						<View key={`${active}-${ticks}`} />
					</div>
				</div>
			</div>
		</section>
	)
}
