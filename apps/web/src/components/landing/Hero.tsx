'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { RPC_PRIMARY } from '@/lib/config'
import { ChainlinkMark, Chip, ExternalArrow, Mono, Tick, UsdtMark, WhitechainLogo, TX, EXPLORER } from './shared'

const CHECKS = [
	['Amount', '50,000.00', '50,000.00'],
	['Issuer wallet', '0x1951…90D6', '0x1951…90D6'],
	['Buyer reference', 'ACME-BUYER-7', 'ACME-BUYER-7'],
	['Due date', '30 Nov 2026', '30 Nov 2026'],
	['Document hash', '0x9a1f…c2e0', '0x9a1f…c2e0'],
]
const STEPS = CHECKS.length + 4 // 0 idle, checks, verdict, toast, funded toast, hold

function AppWindow() {
	// Static: the hero shows the finished, funded state. No looping animation (Privy's hero is still).
	const n = STEPS
	const done = Math.min(n, CHECKS.length)
	const verdict = n > CHECKS.length
	const funded = n > CHECKS.length + 2

	return (
		<div className="relative">
			<div className="overflow-hidden rounded-[14px] border border-hair bg-card shadow-[0_24px_60px_-24px_rgba(18,17,15,0.35)]">
				{/* window chrome */}
				<div className="flex items-center gap-2 border-b border-hair bg-canvas px-4 py-2.5">
					<span className="h-2.5 w-2.5 rounded-full bg-hair" /><span className="h-2.5 w-2.5 rounded-full bg-hair" /><span className="h-2.5 w-2.5 rounded-full bg-hair" />
					<span className="mx-auto font-mono text-[11px] text-ink-3">credra / invoices / INV-1001</span>
					<span className="w-10" />
				</div>
				<div className="grid md:grid-cols-[200px_1fr]">
					{/* list */}
					<div className="hidden border-r border-hair bg-canvas/60 p-3 md:block">
						<p className="label mb-2 px-1">Invoices</p>
						{[
							['Acme Corp', 'INV-1001', verdict ? 'accent' : 'review', verdict ? 'Eligible' : 'Under review'],
							['Northwind Ltd', 'INV-1002', 'review', 'Under review'],
							['Globex Supply', 'INV-1003', 'reject', 'Rejected'],
						].map(([name, id, tone, label], i) => (
							<div key={id} className={`mb-1.5 rounded-ctl border p-2.5 transition-colors ${i === 0 ? 'border-hair bg-card' : 'border-transparent'}`}>
								<p className="text-[13px] font-medium text-ink">{name}</p>
								<p className="mb-1.5 font-mono text-[10px] text-ink-3">{id}</p>
								<Chip tone={tone as 'accent'}>{label}</Chip>
							</div>
						))}
					</div>
					{/* detail */}
					<div className="p-5 md:p-6">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div>
								<p className="label">Invoice · Acme Corp</p>
								<p className="mt-1.5 font-mono text-[28px] font-medium leading-none tracking-[-0.01em] text-ink md:text-[34px]">
									50,000.00 <span className="text-[12px] text-ink-3">USDT</span>
								</p>
							</div>
							<div className="h-6">
								{verdict
									? <span key="v" className="inline-block"><Chip tone={funded ? 'funded' : 'accent'}>{funded ? 'Funded' : 'Eligible'}</Chip></span>
									: <Chip tone="review">Verifying</Chip>}
							</div>
						</div>

						<div className="mt-5 rounded-ctl border border-hair">
							<div className="grid grid-cols-[1.2fr_1fr_1fr_20px] gap-3 border-b border-hair px-3 py-2 text-[11px] text-ink-3">
								<span>Check</span><span>Onchain</span><span>External record</span><span />
							</div>
							{CHECKS.map(([k, a, b], i) => (
								<div key={k} className="grid grid-cols-[1.2fr_1fr_1fr_20px] items-center gap-3 border-b border-hair px-3 py-2 text-[12px] last:border-0">
									<span className="text-ink-2">{k}</span>
									<Mono className="text-ink">{a}</Mono>
									<Mono className={`transition-opacity duration-300 ${i < done ? 'text-ink opacity-100' : 'opacity-20'}`}>{i < done ? b : '···'}</Mono>
									<Tick on={i < done} />
								</div>
							))}
						</div>

						<div className="mt-4 grid grid-cols-3 gap-3">
							{[['Financing', '48,000.00'], ['Discount', '2,000.00'], ['Return', '4.2%']].map(([k, v], i) => (
								<div key={k} className="rounded-ctl bg-canvas px-3 py-2.5">
									<p className="text-[11px] text-ink-3">{k}</p>
									<p className={`font-mono text-[15px] font-medium ${i === 2 ? 'text-verified' : 'text-ink'}`}>{v}</p>
								</div>
							))}
						</div>
						<div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-ctl bg-inset px-3 py-2 font-mono text-[11px] text-ink-2">
							<span className="rounded-chip border border-dashed border-s-review px-1.5 text-[10px] uppercase text-s-review">Simulated</span>
							<span>Verifier wallet</span>
						</div>
					</div>
				</div>
			</div>

		</div>
	)
}

/** Latest Whitechain Sepolia block, polled from the public RPC. Shows a dash until it answers. */
function useBlock() {
	const [b, setB] = useState<number | null>(null)
	useEffect(() => {
		let on = true
		const load = async () => {
			try {
				const r = await fetch(RPC_PRIMARY, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }) })
				const j = await r.json()
				if (on && j.result) setB(parseInt(j.result, 16))
			} catch { /* RPC is flaky; keep the last value */ }
		}
		load()
		const id = setInterval(load, 8000)
		return () => { on = false; clearInterval(id) }
	}, [])
	return b
}

export function Announcement() {
	const [open, setOpen] = useState(true)
	if (!open) return null
	return (
		<div className="relative bg-ink px-10 py-2 text-center text-[13px] text-white">
			Invoice funded and repaid with official USDT on testnet.{' '}
			<a href={`${EXPLORER}/tx/${TX.repay}`} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-white/80">View the transaction</a>
			<button aria-label="Dismiss" onClick={() => setOpen(false)} className="absolute right-3 top-1/2 -translate-y-1/2 px-1 text-white/60 hover:text-white">✕</button>
		</div>
	)
}

export function Hero() {
	const block = useBlock()
	return (
		<section>
			<div className="mx-auto max-w-[1200px] px-5 pb-6 pt-14 md:px-8 md:pt-20">
				<div className="mb-6 flex flex-wrap items-center gap-3">
					<span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">Live on Whitechain Sepolia</span>
					<span className="inline-flex items-center gap-2 rounded-chip bg-card px-2.5 py-1 font-mono text-[12px] text-ink ring-1 ring-hair">
						<span className="h-2 w-2 rounded-full bg-verified" />
						block {block ? block.toLocaleString('en-US') : '···'}
					</span>
				</div>
				<h1 className="max-w-[760px] text-[38px] font-medium leading-[1.08] tracking-[-0.03em] text-ink md:text-[56px]">
					Verified invoices.<br className="hidden md:block" /> <span className="text-ink-3">Instant capital.</span>
				</h1>
				<p className="mt-5 max-w-[560px] text-[17px] leading-[1.55] text-ink-2 md:text-[20px]">
					Submit, verify and fund invoices in USDT. Every step onchain.
				</p>
				<div className="mt-8 flex flex-wrap items-center gap-3">
					<Link href="/app" className="group inline-flex h-12 items-center gap-2 whitespace-nowrap rounded-ctl bg-pine px-5 text-[14px] font-semibold text-white transition-colors hover:bg-pine-hover">
						Launch app
						<span className="transition-transform group-hover:translate-x-0.5" aria-hidden>→</span>
					</Link>
					<a href="#process" className="inline-flex h-12 items-center rounded-ctl bg-inset px-5 text-[14px] font-medium text-ink transition-colors hover:bg-hair">
						See how it works
					</a>
					<a href={`${EXPLORER}/tx/${TX.repay}`} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center gap-1.5 px-2 text-[14px] text-accent hover:underline">
						View a settled invoice <ExternalArrow />
					</a>
				</div>
			</div>

			{/* stage — on phones the window keeps its real proportions and bleeds off the right (Privy-style), rather than cramming the table into ~340px */}
			<div className="mx-auto max-w-[1200px] px-5 pb-10 md:px-8 md:pb-16">
				<div className="dotgrid relative overflow-hidden rounded-[20px] border border-hair bg-inset px-4 pb-14 pt-10 md:px-14 md:pb-24 md:pt-16">
					<div className="w-[540px] max-w-none md:mx-auto md:w-auto md:max-w-[920px]"><AppWindow /></div>
				</div>
			</div>
		</section>
	)
}

/* ─── Stats band: real testnet totals from /api/stats. Static on purpose: figures are read, not chased. ─── */
type Fact = { v: string; k: string }
type Stats = { financedCount: number; financedUsdt: number; repaidCount: number; defaultedCount: number; avgReturnPct: number | null }

function toFacts(s: Stats): Fact[] {
	const resolved = s.repaidCount + s.defaultedCount
	const pct = (n: number) => `${Math.round(n * 10) / 10}%`
	return [
		{ v: String(s.financedCount), k: 'Invoices financed' },
		{ v: s.financedUsdt.toLocaleString('en-US', { maximumFractionDigits: 2 }), k: 'USDT paid to businesses' },
		{ v: resolved ? pct((s.repaidCount / resolved) * 100) : '\u2014', k: 'Repaid in full' },
		{ v: s.avgReturnPct === null ? '\u2014' : pct(s.avgReturnPct), k: 'Average investor return' },
	]
}

export function StatsBand() {
	const [facts, setFacts] = useState<Fact[] | null>(null)
	useEffect(() => {
		let on = true
		fetch('/api/stats').then((r) => (r.ok ? r.json() : Promise.reject())).then((s: Stats) => on && setFacts(toFacts(s))).catch(() => on && setFacts([]))
		return () => { on = false }
	}, [])
	const failed = facts !== null && facts.length === 0
	return (
		<section className="dot-edge-top relative bg-card" aria-label="Credra in numbers">
			<div className="mx-auto max-w-[1200px] px-5 pb-8 pt-10 md:px-8 md:pb-9 md:pt-12">
				<div className="grid grid-cols-2 gap-y-7 md:grid-cols-4">
					{(facts?.length ? facts : [0, 1, 2, 3].map(() => null)).map((f, i) => (
						<div key={i} className="animate-popin flex flex-col items-center text-center" style={{ animationDelay: `${i * 60}ms` }}>
							{f ? (
								<>
									<p className="num-display text-[32px] leading-[1.15] text-ink md:text-[40px] md:leading-[48px] xl:text-[52px] xl:leading-[60px]">{f.v}</p>
									<p className="mt-1.5 text-[14px] leading-6 text-ink-2">{f.k}</p>
								</>
							) : (
								<>
									<div className="skeleton h-[38px] w-28 md:h-[48px] md:w-32 xl:h-[60px] xl:w-40" aria-label="Loading" />
									<div className="skeleton mt-2.5 h-4 w-28" />
								</>
							)}
						</div>
					))}
				</div>
				<p className="mt-6 text-center text-[12px] leading-5 text-ink-3">
					{failed ? 'Figures are unavailable right now. ' : 'Live testnet figures, no real funds. '}
					<a className="text-accent" href={`${EXPLORER}/address/0x3025FDea4Aa3A96deC46451b7Eec2e83188307B6`} target="_blank" rel="noreferrer">Check them onchain <span aria-hidden>{'\u2197'}</span></a>
				</p>
			</div>
		</section>
	)
}

/* ─── Built on: quiet marks, one row. Muted until hovered; colour is not needed to read them. ─── */
export function BuiltOn() {
	const mark = 'group flex items-center gap-2.5 whitespace-nowrap opacity-70 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0'
	const word = 'text-[17px] font-medium tracking-[-0.02em] text-ink'
	return (
		<section className="mx-auto max-w-[1200px] px-5 py-9 md:px-8 md:py-11" aria-label="Built on">
			<ul className="flex flex-wrap items-center justify-center gap-x-12 gap-y-5 md:gap-x-16">
				<li className={mark} title="Whitechain Sepolia"><WhitechainLogo height={22} /></li>
				<li className={mark} title="Chainlink CRE, the workflow runtime"><ChainlinkMark size={22} /><span className={word}>Chainlink</span></li>
				<li className={mark} title="Official USDT, the settlement token"><UsdtMark size={22} /><span className={word}>Tether USDT</span></li>
				<li className={mark} title="Allowlist-gated ERC-721 receivables"><span className={word}>ERC-721 <span className="text-ink-3">receivables</span></span></li>
			</ul>
		</section>
	)
}
