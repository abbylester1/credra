'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { RPC_PRIMARY } from '@/lib/config'
import { ChainlinkMark, Chip, ExternalArrow, Mono, Tick, UsdtMark, WhitechainLogo, short, TX, EXPLORER } from './shared'

const CHECKS = [
	['Amount', '10,000.00', '10,000.00'],
	['Issuer wallet', '0x1951…90D6', '0x1951…90D6'],
	['Buyer reference', 'ACME-BUYER-7', 'ACME-BUYER-7'],
	['Due date', '30 Nov 2026', '30 Nov 2026'],
	['Document hash', '0x9a1f…c2e0', '0x9a1f…c2e0'],
]
const STEPS = CHECKS.length + 4 // 0 idle, checks, verdict, toast, funded toast, hold

function useLoop(max: number, ms: number) {
	const [n, setN] = useState(0)
	useEffect(() => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(max); return }
		const id = setInterval(() => setN((x) => (x >= max + 3 ? 0 : x + 1)), ms)
		return () => clearInterval(id)
	}, [max, ms])
	return n
}

function AppWindow() {
	const n = useLoop(STEPS, 750)
	const done = Math.min(n, CHECKS.length)
	const verdict = n > CHECKS.length
	const toast = n > CHECKS.length + 1
	const funded = n > CHECKS.length + 2

	return (
		<div className="relative">
			<div className="overflow-hidden rounded-[14px] border border-hair bg-card shadow-[0_24px_60px_-24px_rgba(15,26,22,0.35)]">
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
									10,000.00 <span className="text-[12px] text-ink-3">USDT</span>
								</p>
							</div>
							<div className="h-6">
								{verdict
									? <span key="v" className="animate-popin inline-block"><Chip tone={funded ? 'funded' : 'accent'}>{funded ? 'Funded' : 'Eligible'}</Chip></span>
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
							{[['Financing', '9,000.00'], ['Discount', '1,000.00'], ['Return', '11.1%']].map(([k, v], i) => (
								<div key={k} className="rounded-ctl bg-canvas px-3 py-2.5">
									<p className="text-[11px] text-ink-3">{k}</p>
									<p className={`font-mono text-[15px] font-medium ${i === 2 ? 'text-accent' : 'text-ink'}`}>{v}</p>
								</div>
							))}
						</div>
						<div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-ctl bg-inset px-3 py-2 font-mono text-[11px] text-ink-2">
							<span className="rounded-chip border border-dashed border-s-review px-1.5 text-[10px] uppercase text-s-review">Simulated</span>
							<span>Source: simulated ERP record</span>
							<span className="text-ink-3">·</span>
							<span>Recorded by: verifier wallet</span>
						</div>
					</div>
				</div>
			</div>

			{/* floating toasts */}
			{toast && (
				<div key="t1" className="animate-popin absolute bottom-full right-0 z-10 mb-3 hidden w-[250px] rounded-card border border-hair bg-card p-3 shadow-[0_12px_30px_-12px_rgba(15,26,22,0.35)] md:block">
					<div className="flex items-center gap-2">
						<span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-accent"><Tick on className="!h-[18px] !w-[18px]" /></span>
						<p className="text-[13px] font-medium text-ink">Verdict recorded onchain</p>
					</div>
					<p className="mt-1 font-mono text-[11px] text-ink-3">tx {short(TX.role)} ↗</p>
				</div>
			)}
			{funded && (
				<div key="t2" className="animate-popin absolute left-0 top-full z-10 mt-3 hidden w-[270px] rounded-card border border-hair bg-card p-3 shadow-[0_12px_30px_-12px_rgba(15,26,22,0.35)] md:block">
					<div className="flex items-center gap-2.5">
						<UsdtMark size={24} />
						<div>
							<p className="text-[13px] font-medium text-ink">9,000.00 USDT sent to Acme Corp</p>
							<p className="font-mono text-[11px] text-ink-3">Receivable CRDR #1 minted</p>
						</div>
					</div>
				</div>
			)}

			{/* receivable token card (Ramp-style physical card, but a CRDR receivable) */}
			<div className="animate-floaty absolute right-0 top-full z-[5] mt-3 hidden h-[112px] w-[200px] overflow-hidden rounded-[14px] bg-pine p-4 text-white shadow-[0_20px_40px_-16px_rgba(9,46,41,0.7)] lg:block">
				<div className="linegrid absolute inset-0 opacity-60" />
				<div className="relative flex h-full flex-col justify-between">
					<div className="flex items-center justify-between">
						<span className="text-[15px] font-semibold tracking-[-0.02em]">credra</span>
						<span className="font-mono text-[10px] text-white/60">CRDR · ERC-721</span>
					</div>
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.06em] text-white/60">Receivable #0001</p>
						<p className="font-mono text-[16px] font-medium">10,000.00 USDT</p>
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
						<span className="animate-pulse-ring h-2 w-2 rounded-full bg-accent" />
						block {block ? block.toLocaleString('en-US') : '···'}
					</span>
				</div>
				<h1 className="max-w-[900px] text-[44px] font-semibold leading-[1.02] tracking-[-0.035em] text-ink md:text-[76px]">
					Verified invoices.<br className="hidden md:block" /> <span className="text-ink-3">Instant capital.</span>
				</h1>
				<p className="mt-6 max-w-[560px] text-[17px] leading-[1.55] text-ink-2 md:text-[19px]">
					Submit, verify and fund invoices in USDT. Every step onchain.
				</p>
				<div className="mt-8 flex flex-wrap items-center gap-3">
					<Link href="/app" className="group inline-flex h-12 items-center gap-2 rounded-ctl bg-pine px-5 text-[14px] font-semibold text-white transition-colors hover:bg-pine-hover">
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

			{/* stage */}
			<div className="mx-auto max-w-[1200px] px-5 pb-10 md:px-8 md:pb-16">
				<div className="dotgrid relative overflow-hidden rounded-[20px] border border-hair bg-inset px-4 pb-14 pt-12 md:px-14 md:pb-36 md:pt-24">
					<div className="absolute left-4 top-4 z-10">
						<span className="rounded-chip border border-dashed border-s-review bg-canvas/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-s-review">Illustrative demo data</span>
					</div>
					<div className="mx-auto max-w-[920px]"><AppWindow /></div>
				</div>
			</div>
		</section>
	)
}

/* ─── Ticker strip (Ramp's live counters, but real, checkable facts) ─── */
const FACTS: [string, string][] = [
	['Contracts verified on Blockscout', '3'],
	['Automated tests passing', '40'],
	['Fields cross-checked per invoice', '5'],
	['USDT held by contracts', '0'],
	['Outage falls back to', 'Manual review'],
	['Duplicate invoices', 'Blocked onchain'],
	['Settlement token', 'Official USDT'],
]
export function Ticker() {
	const row = [...FACTS, ...FACTS]
	return (
		<div className="pause-on-hover border-y border-hair bg-card py-3.5">
			<div className="mask-fade-x overflow-hidden">
				<div className="animate-marquee flex w-max gap-10 pr-10">
					{row.map(([k, v], i) => (
						<div key={i} className="flex shrink-0 items-center gap-3 whitespace-nowrap">
							<span className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-3">{k}</span>
							<span className="rounded-chip bg-canvas px-2 py-0.5 font-mono text-[12px] text-ink ring-1 ring-hair">{v}</span>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

/* ─── Built on (bordered logo cells, as on Ramp's customer grid) ─── */
export function BuiltOn() {
	const cells = [
		{ k: 'Chain', node: <WhitechainLogo height={24} />, sub: 'Whitechain Sepolia' },
		{ k: 'Verification', node: <span className="flex items-center gap-2.5"><ChainlinkMark size={26} /><span className="text-[19px] font-semibold tracking-[-0.02em] text-ink">Chainlink <span className="text-ink-3">CRE</span></span></span>, sub: 'Workflow runtime' },
		{ k: 'Settlement', node: <span className="flex items-center gap-2.5"><UsdtMark size={26} /><span className="text-[19px] font-semibold tracking-[-0.02em] text-ink">Tether <span className="text-ink-3">USDT</span></span></span>, sub: 'Official token, 6 decimals' },
		{ k: 'Standards', node: <span className="text-[19px] font-semibold tracking-[-0.02em] text-ink">ERC-721 <span className="text-ink-3">receivables</span></span>, sub: 'Allowlist-gated transfers' },
	]
	return (
		<section className="mx-auto max-w-[1200px] px-5 py-14 md:px-8 md:py-20">
			<p className="mb-6 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">Built on</p>
			<div className="grid gap-px overflow-hidden rounded-card border border-hair bg-hair sm:grid-cols-2 lg:grid-cols-4">
				{cells.map((c) => (
					<div key={c.k} className="group flex min-h-[132px] flex-col justify-between bg-card p-6 transition-colors hover:bg-canvas">
						<span className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-3">{c.k}</span>
						<div>
							<div className="flex h-8 items-center transition-transform duration-300 group-hover:-translate-y-0.5">{c.node}</div>
							<p className="mt-1.5 text-[12px] text-ink-3">{c.sub}</p>
						</div>
					</div>
				))}
			</div>
		</section>
	)
}
