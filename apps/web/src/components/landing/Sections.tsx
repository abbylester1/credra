'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Chip, CountUp, EXPLORER, ExternalArrow, Eyebrow, Heading, Mono, Reveal, Tick, TX, short, useInView, useTween } from './shared'

/* ─────────── Proof: claims you can check yourself. Quiet, one row, whole item is the link. ─────────── */
const STATS = [
	{ n: 3, label: 'Contracts verified', sub: 'Source-verified on Blockscout.', href: `${EXPLORER}/address/0xc11162A72F388Efb6Ddd0B73Eea578598d733122` },
	{ n: 102, label: 'Tests passing', sub: '29 contract, 11 rule, 62 app tests.', href: 'https://github.com/abbylester1/credra' },
	{ n: 5, label: 'Fields cross-checked', sub: 'On every invoice.', href: '#approach' },
	{ n: 0, label: 'USDT held by contracts', sub: 'Money moves wallet to wallet.', href: `${EXPLORER}/address/0x3025FDea4Aa3A96deC46451b7Eec2e83188307B6` },
]
export function Stats() {
	return (
		<section className="bg-canvas py-10 md:py-12">
			<div className="mx-auto max-w-[1200px] px-5 md:px-8">
				<Reveal>
					<Eyebrow>Proof</Eyebrow>
					<Heading lead="Check it yourself." rest="Every claim links out." className="max-w-[900px] !text-[24px] md:!text-[30px]" />
				</Reveal>
				<div className="mt-7 grid grid-cols-2 gap-y-7 md:grid-cols-4">
					{STATS.map((s, i) => (
						<Reveal key={s.label} delay={i * 60} className="md:border-l md:border-hair md:pl-6 md:first:border-l-0 md:first:pl-0">
							<a
								href={s.href}
								{...(s.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
								className="group block pr-4"
							>
								<p className="num-display text-[32px] leading-[1.15] text-ink md:text-[40px] md:leading-[48px]"><CountUp to={s.n} /></p>
								<p className="mt-1.5 flex items-center gap-1.5 text-[14px] font-medium leading-6 text-ink">
									<span className="underline decoration-transparent decoration-1 underline-offset-[3px] transition-colors group-hover:decoration-ink/40">{s.label}</span>
									{s.href.startsWith('http') && <span className="text-ink-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100"><ExternalArrow /></span>}
								</p>
								<p className="text-[13px] leading-5 text-ink-3">{s.sub}</p>
							</a>
						</Reveal>
					))}
				</div>
			</div>
		</section>
	)
}

/* ─────────── Showcase shell ─────────── */
function Row({ id, eyebrow, lead, rest, body, bullets, flip, children }: { id?: string; eyebrow: string; lead: string; rest: string; body: string; bullets?: string[]; flip?: boolean; children: React.ReactNode }) {
	return (
		<Reveal>
			<div id={id} className="scroll-mt-[96px] grid items-center gap-10 md:grid-cols-2 md:gap-16">
				<div className={flip ? 'md:order-2' : ''}>
					<Eyebrow>{eyebrow}</Eyebrow>
					<h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.025em] text-ink md:text-[40px]">{lead} <span className="text-ink-3">{rest}</span></h2>
					<p className="mt-4 max-w-[480px] text-[16px] leading-[1.6] text-ink-2">{body}</p>
					{bullets && (
						<ul className="mt-6 space-y-2.5">
							{bullets.map((b) => <li key={b} className="flex items-center gap-2.5 text-[14px] text-ink-2"><Tick on />{b}</li>)}
						</ul>
					)}
				</div>
				<div className={`dotgrid rounded-[20px] border border-hair bg-inset p-4 md:p-8 ${flip ? 'md:order-1' : ''}`}>{children}</div>
			</div>
		</Reveal>
	)
}

/* ─────────── Verification record ─────────── */
const RECORD: [string, string, string][] = [
	['Record found', 'registered', 'found'],
	['Amount', '50,000.00', '50,000.00'],
	['Issuer wallet', '0x1951…90D6', '0x1951…90D6'],
	['Buyer', 'ACME-7', 'ACME-7'],
	['Due date', '30 Nov 2026', '30 Nov 2026'],
	['Document hash', '0x9a1f…c2e0', '0x9a1f…c2e0'],
]
function VerificationRecord() {
	const [ref, seen] = useInView<HTMLDivElement>(0.3)
	const passed = RECORD.length
	const pct = useTween(seen ? 1 : 0, 1400, seen)
	const C = 2 * Math.PI * 26
	return (
		<div ref={ref} className="rounded-card border border-hair bg-card shadow-[0_20px_50px_-30px_rgba(18,17,15,0.4)]">
			<div className="flex items-center justify-between gap-4 border-b border-hair p-5">
				<div className="flex items-center gap-4">
					<div className="relative h-14 w-14">
						<svg viewBox="0 0 60 60" className="-rotate-90"><circle cx="30" cy="30" r="26" fill="none" stroke="var(--color-inset)" strokeWidth="5" /><circle cx="30" cy="30" r="26" fill="none" stroke="var(--color-accent)" strokeWidth="5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} /></svg>
						<span className="absolute inset-0 flex items-center justify-center font-mono text-[13px] font-medium text-ink">{Math.round(pct * passed)}/{passed}</span>
					</div>
					<div>
						<p className="text-[15px] font-semibold text-ink">Verification record</p>
						<p className="font-mono text-[12px] text-ink-3">INV-1001 · Acme Corp</p>
					</div>
				</div>
				<Chip tone="accent">Eligible</Chip>
			</div>
			<div className="grid grid-cols-[1.3fr_1fr_1fr_20px] gap-x-3 border-b border-hair bg-canvas px-5 py-2 text-[11px] text-ink-3"><span>Check</span><span>Onchain</span><span>External record</span><span /></div>
			{RECORD.map(([k, a, b], i) => {
				const on = pct * passed > i + 0.4
				return (
					<div key={k} className="grid grid-cols-[1.3fr_1fr_1fr_20px] items-center gap-x-3 border-b border-hair px-5 py-3 text-[12px]">
						<span className="text-ink-2">{k}</span>
						<Mono className="text-ink">{a}</Mono>
						<Mono className={`transition-opacity duration-300 ${on ? 'opacity-100' : 'opacity-15'}`}>{b}</Mono>
						<Tick on={on} />
					</div>
				)
			})}
			<div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-4 font-mono text-[12px] text-ink-2">
				<span className="rounded-chip border border-dashed border-s-review px-1.5 text-[10px] uppercase text-s-review">Simulated</span>
				<span>Verifier wallet</span>
				<a href={`${EXPLORER}/tx/${TX.role}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">tx {short(TX.role)} <ExternalArrow /></a>
			</div>
		</div>
	)
}

/* ─────────── Economics calculator ─────────── */
const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
function Slider({ label, value, min, max, step, onChange, display }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; display: string }) {
	const pct = ((value - min) / (max - min)) * 100
	return (
		<label className="block">
			<span className="mb-2.5 flex items-baseline justify-between gap-2 whitespace-nowrap"><span className="text-[13px] text-ink-2">{label}</span><span className="num-display text-[15px] text-ink">{display}</span></span>
			<input
				type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
				className="credra-range h-1 w-full cursor-pointer appearance-none rounded-full"
				style={{ background: `linear-gradient(90deg, var(--color-pine) ${pct}%, var(--color-hair) ${pct}%)` }}
			/>
		</label>
	)
}
function Economics() {
	const [amount, setAmount] = useState(50000)
	const [disc, setDisc] = useState(4)
	const [days, setDays] = useState(45)
	const discount = (amount * disc) / 100
	const financing = amount - discount
	const ret = (discount / financing) * 100
	const apr = ret * (365 / days)
	const tf = useTween(financing, 500), td = useTween(discount, 500), tr = useTween(ret, 500), ta = useTween(apr, 500)
	return (
		<div className="rounded-win border border-hair bg-card p-5 md:p-6">
			<div className="flex items-center justify-between">
				<p className="text-[15px] font-semibold text-ink">Financing terms</p>
				<span className="rounded-chip bg-inset px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.04em] text-ink-3">Demo</span>
			</div>
			<div className="mt-5 grid gap-4">
				<div className="flex gap-1.5">{[5000, 50000, 250000].map((v) => <button key={v} type="button" onClick={() => setAmount(v)} className={`rounded-chip px-2.5 py-1 text-[12px] font-medium transition-colors ${amount === v ? 'bg-ink text-white' : 'bg-inset text-ink-2 hover:text-ink'}`}>{v >= 1000 ? `${v / 1000}k` : v}</button>)}</div>
				<Slider label="Invoice amount" value={amount} min={1000} max={250000} step={1000} onChange={setAmount} display={`${fmt(amount)} USDT`} />
				<div className="grid grid-cols-2 gap-4">
					<Slider label="Discount" value={disc} min={1} max={10} step={1} onChange={setDisc} display={`${disc}%`} />
					<Slider label="Days to due" value={days} min={15} max={180} step={5} onChange={setDays} display={`${days}d`} />
				</div>
			</div>

			<div className="mt-5 border-t border-hair pt-4">
				<div className="flex items-end justify-between gap-4">
					<div>
						<p className="text-[13px] text-ink-3">Business receives now</p>
						<p className="num-display mt-1 flex items-baseline gap-1.5 text-[28px] leading-none text-ink md:text-[32px]">{fmt(tf)}<span className="text-[14px] text-ink-3">USDT</span></p>
					</div>
					<div className="text-right">
						<p className="text-[12px] text-ink-3">Investor discount</p>
						<p className="num-display text-[18px] text-verified">{fmt(td)}</p>
					</div>
				</div>
				<div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-inset" role="img" aria-label={`${100 - disc}% paid now, ${disc}% investor discount`}>
					<div className="h-full bg-pine transition-[width] duration-500" style={{ width: `${100 - disc}%` }} />
					<div className="h-full bg-verified transition-[width] duration-500" style={{ width: `${disc}%` }} />
				</div>
			</div>

			<div className="mt-4 grid grid-cols-3 gap-4 border-t border-hair pt-4">
				{([['Return on financing', `${tr.toFixed(1)}%`], ['Annualised', `${ta.toFixed(1)}%`], ['Repaid at due', fmt(amount)]] as const).map(([k, v]) => (
					<div key={k}>
						<p className="text-[12px] leading-tight text-ink-3">{k}</p>
						<p className="num-display mt-1 text-[17px] text-ink">{v}</p>
					</div>
				))}
			</div>
			<p className="mt-4 flex items-center justify-between border-t border-hair pt-3 text-[13px]"><span className="text-ink-2">Platform fee</span><span className="num-display text-ink">0.00 USDT</span></p>
		</div>
	)
}

/* ─────────── Transparency timeline ─────────── */
function Timeline() {
	const [ref, seen] = useInView<HTMLDivElement>(0.3)
	const ev: [string, string, string, 'neutral' | 'accent' | 'funded' | 'repaid', string?][] = [
		['Submitted', 'Business wallet', 'Invoice registered', 'neutral'],
		['Eligible', 'Verifier wallet', 'Verdict recorded', 'accent'],
		['Funded', 'Investor wallet', '54.00 USDT to business', 'funded', TX.fund],
		['Repaid', 'Business wallet', '60.00 USDT to holder', 'repaid', TX.repay],
	]
	return (
		<div ref={ref} className="rounded-card border border-hair bg-card p-5 shadow-[0_20px_50px_-30px_rgba(18,17,15,0.4)] md:p-6">
			<div className="mb-4 flex items-center justify-between"><p className="text-[15px] font-semibold text-ink">Invoice timeline</p><Chip tone="repaid">Repaid</Chip></div>
			<ol>
				{ev.map(([s, who, d, tone, tx], i) => (
					<li key={s} className="relative flex gap-4 pb-6 last:pb-0">
						{i < ev.length - 1 && <span className="absolute left-[7px] top-4 h-full w-px bg-hair"><span className="block w-full origin-top bg-verified transition-transform ease-out" style={{ height: '100%', transform: seen ? 'scaleY(1)' : 'scaleY(0)', transitionDuration: '700ms', transitionDelay: `${i * 600}ms` }} /></span>}
						<span className={`relative z-10 mt-1 h-[15px] w-[15px] shrink-0 rounded-full border-2 border-card transition-all duration-500 ${seen ? 'scale-100 bg-verified' : 'scale-50 bg-hair'}`} style={{ transitionDelay: `${i * 600}ms` }} />
						<div className={`flex-1 transition-all duration-500 ${seen ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`} style={{ transitionDelay: `${i * 600}ms` }}>
							<div className="flex flex-wrap items-center gap-2"><Chip tone={tone}>{s}</Chip><span className="text-[12px] text-ink-3">{who}</span></div>
							<p className="mt-1.5 text-[13px] text-ink-2">{d}</p>
							{tx && <a href={`${EXPLORER}/tx/${tx}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-accent hover:underline">tx {short(tx)} <ExternalArrow /></a>}
						</div>
					</li>
				))}
			</ol>
		</div>
	)
}

export function Showcase() {
	return (
		<section className="py-[72px] md:py-[104px]">
			<div className="mx-auto max-w-[1200px] space-y-24 px-5 md:space-y-32 md:px-8">
				<Row
					id="investors" eyebrow="For investors" lead="Know exactly what" rest="you are funding."
					body="Every check, onchain and external value side by side, with the signer and transaction."
					bullets={['Field-by-field, not a score', 'Simulated sources labelled', 'Signer and tx on every record']}
				><VerificationRecord /></Row>
				<Row
					id="economics" flip eyebrow="Economics" lead="Clear economics," rest="no surprises."
					body="Move the sliders. See what the business gets and the investor earns."
					bullets={['Investor pays the business directly', 'Full repayment to the holder', 'No platform fee, no admin withdrawal']}
				><Economics /></Row>
				<Row
					id="transparency" eyebrow="Transparency" lead="Every step, every actor," rest="onchain."
					body="Public statuses, signers and transactions. Funded and Repaid link to real testnet transactions."
				><Timeline /></Row>
			</div>
		</section>
	)
}

/* ─────────── Audience cards ─────────── */
export function Audiences() {
	const cards = [
		{ id: 'businesses', eyebrow: 'For businesses', title: 'Get paid before', rest: 'the buyer pays.', body: 'Submit, get verified, receive USDT before the due date.', cta: 'Submit an invoice', primary: true, tint: 'bg-s-repaid-soft', steps: ['Connect a wallet', 'Submit invoice and document', 'Receive USDT'] },
		{ id: 'investors-cta', eyebrow: 'For investors', title: 'Fund verified', rest: 'receivables in USDT.', body: 'Fund eligible invoices and track repayment onchain.', cta: 'Browse invoices', primary: false, tint: 'bg-s-funded-soft', steps: ['Get allowlisted', 'Fund an eligible invoice', 'Receive repayment'] },
	]
	return (
		<section className="bg-pine-wash py-[72px] md:py-[104px]">
			<div className="mx-auto grid max-w-[1200px] items-start gap-5 px-5 md:grid-cols-2 md:px-8">
				{cards.map((c, i) => (
					<Reveal key={c.id} delay={i * 100}>
						<div id={c.id} className={`scroll-mt-[96px] flex flex-col rounded-[20px] border border-hair/60 ${c.tint} p-7 md:p-9`}>
							<Eyebrow>{c.eyebrow}</Eyebrow>
							<h3 className="mt-1 text-[24px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink md:text-[28px]">{c.title} <span className="text-ink-3">{c.rest}</span></h3>
							<p className="mt-2.5 max-w-[420px] text-[15px] leading-[1.55] text-ink-2">{c.body}</p>
							<p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-ink/10 pt-4 text-[13px] text-ink-3">
								{c.steps.map((s, j) => <span key={s} className="flex items-center gap-2">{j > 0 && <span aria-hidden className="text-ink/25">·</span>}{s}</span>)}
							</p>
							<Link href="/app" className={`mt-6 inline-flex h-11 w-full items-center justify-center rounded-ctl text-[14px] font-semibold transition-colors sm:w-auto sm:self-start sm:px-6 ${c.primary ? 'bg-pine text-white hover:bg-pine-hover' : 'bg-card text-ink ring-1 ring-ink/10 hover:bg-card/70'}`}>{c.cta}</Link>
						</div>
					</Reveal>
				))}
			</div>
		</section>
	)
}

/* ─────────── Trust ─────────── */
export function Trust() {
	const items = [
		{ t: 'Document fingerprints', d: 'A keccak256 hash locks the document. Reuse is rejected.', icon: 'M6 3h6l4 4v10H6zM12 3v4h4' },
		{ t: 'CRE verification', d: 'Chainlink CRE checks the record against an external source.', icon: 'M10 2l7 4v8l-7 4-7-4V6z' },
		{ t: 'Source-verified contracts', d: 'Contracts enforce duplicate rejection and direct settlement.', icon: 'M5 10l3 3 7-7' },
		{ t: 'Provenance on every action', d: 'Every status change shows who, when and a tx link.', icon: 'M10 4a3 3 0 100 6 3 3 0 000-6zM4 17c0-3 3-5 6-5s6 2 6 5' },
	]
	return (
		<section id="trust" className="scroll-mt-[72px] border-y border-hair bg-card py-[72px] md:py-[104px]">
			<div className="mx-auto max-w-[1200px] px-5 md:px-8">
				<Reveal>
					<Eyebrow>Trust and verification</Eyebrow>
					<Heading lead="Trust backed by" rest="evidence, not promises." className="max-w-[720px]" />
					<p className="mb-12 mt-5 max-w-[480px] text-[17px] leading-[1.55] text-ink-2">Inspectable end to end. Simulated parts are labelled.</p>
				</Reveal>
				<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
					{items.map((t, i) => (
						<Reveal key={t.t} delay={i * 80}>
							<div className="group h-full rounded-card border border-hair bg-canvas p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-card hover:shadow-[0_18px_40px_-24px_rgba(18,17,15,0.3)]">
								<span className="mb-5 flex h-10 w-10 items-center justify-center rounded-ctl bg-accent-soft text-accent transition-colors group-hover:bg-pine group-hover:text-white"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={t.icon} /></svg></span>
								<h3 className="text-[16px] font-semibold text-ink">{t.t}</h3>
								<p className="mt-2 text-[14px] leading-[1.6] text-ink-2">{t.d}</p>
							</div>
						</Reveal>
					))}
				</div>
			</div>
		</section>
	)
}

/* ─────────── Final CTA ─────────── */
export function CtaBanner() {
	return (
		<section className="px-5 py-[56px] md:px-8 md:py-[80px]">
			<Reveal>
				<div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[24px] bg-pine px-6 py-12 text-center md:px-16 md:py-16">
					<div className="linegrid absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_75%)]" />
					<div className="relative">
						<h2 className="mx-auto max-w-[720px] text-[32px] font-semibold leading-[1.06] tracking-[-0.03em] text-white md:text-[48px]">Invoice financing <span className="text-white/55">you can verify.</span></h2>
						<p className="mx-auto mt-3 max-w-[420px] text-[15px] leading-[1.6] text-white/70">Submit, verify, fund, settle. All onchain.</p>
						<div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
							<Link href="/app" className="group inline-flex h-12 items-center gap-2 rounded-ctl bg-white px-6 text-[14px] font-semibold text-pine transition-colors hover:bg-white/90">Launch app <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>→</span></Link>
							<a href="https://github.com/abbylester1/credra" target="_blank" rel="noreferrer" className="inline-flex h-12 items-center gap-1.5 rounded-ctl border border-white/25 px-6 text-[14px] font-medium text-white transition-colors hover:bg-white/10">View on GitHub <ExternalArrow /></a>
						</div>
					</div>
				</div>
			</Reveal>
		</section>
	)
}
