'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ADDRESSES, EXPLORER, shorten } from '@/lib/config'
import { HOSTED_DEMO } from '@/lib/hosted'
import type { InvoiceSummary } from '@/lib/useInvoices'
import { statusLabel } from '@/lib/status'
import { Amount, fmtDate, StatusChip } from './ui'

/* ───────── Welcome banner ───────── */
export function Welcome({ role, name }: { role: 'business' | 'investor' | 'operator'; name?: string }) {
	const copy = {
		business: { title: 'Turn invoices into capital.', body: 'Submit an invoice, get it verified, and receive USDT once an investor funds it.', cta: ['Submit invoice', '/app/invoices/new'] as const },
		investor: { title: 'Fund verified receivables.', body: 'Review the verification record, fund eligible invoices and track repayment from the receivable you hold.', cta: ['Browse invoices', '/app/invoices'] as const },
		operator: { title: 'Run the verification desk.', body: 'Seed the simulated registry, review flagged invoices and manage the investor allowlist.', cta: ['Open console', '/app/operator'] as const },
	}[role]
	return (
		<div className="mb-6 rounded-[20px] border border-hair bg-card p-7 md:p-9">
			<div className="max-w-[520px]">
				<p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">{name ? `${name} · ` : ''}{role}</p>
				<h2 className="mt-2 text-[28px] font-semibold leading-[1.1] tracking-[-0.025em] text-ink md:text-[34px]">{copy.title}</h2>
				<p className="mt-2 text-[15px] leading-[1.55] text-ink-2">{copy.body}</p>
				<Link href={copy.cta[1]} className="mt-5 inline-flex h-11 items-center gap-2 rounded-ctl bg-pine px-5 text-[14px] font-semibold text-white transition-colors hover:bg-pine-hover">{copy.cta[0]} <span aria-hidden>→</span></Link>
			</div>
		</div>
	)
}

/* ───────── Pipeline distribution ───────── */
const STAGES: [number[], string, string][] = [
	[[1], 'Submitted', 'bg-s-neutral'],
	[[2], 'In review', 'bg-s-review'],
	[[3], 'Eligible', 'bg-verified'],
	[[5], 'Funded', 'bg-s-funded'],
	[[6], 'Repaid', 'bg-s-repaid'],
	[[4, 7], 'Rejected', 'bg-s-reject'],
]
export function Pipeline({ items, compact }: { items: InvoiceSummary[]; compact?: boolean }) {
	const counts = STAGES.map(([codes]) => items.filter((i) => codes.includes(i.status)).length)
	const total = counts.reduce((a, b) => a + b, 0)
	if (compact) {
		return (
			<div className="rounded-[16px] border border-hair bg-card px-5 py-4">
				<div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-inset">
					{total > 0 && STAGES.map(([, label, bg], i) => counts[i] > 0 && <div key={label} title={`${label}: ${counts[i]}`} className={`animate-fillbar h-full ${bg}`} style={{ width: `${(counts[i] / total) * 100}%`, animationDelay: `${i * 80}ms` }} />)}
				</div>
				<p className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-ink-3">
					{STAGES.map(([, label, bg], i) => counts[i] > 0 && <span key={label} className="flex items-center gap-1.5"><span className={`h-2 w-2 ${bg}`} />{label} <span className="num text-ink">{counts[i]}</span></span>)}
					{total === 0 && <span>No invoices yet</span>}
				</p>
			</div>
		)
	}
	return (
		<section className="self-start rounded-[16px] border border-hair bg-card p-6">
			<div className="flex items-baseline justify-between">
				<h2 className="text-[16px] font-semibold">Pipeline</h2>
				<span className="num text-[12px] text-ink-3">{total} {total === 1 ? 'invoice' : 'invoices'}</span>
			</div>
			<div className="mt-4 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-inset">
				{total > 0 && STAGES.map(([, label, bg], i) => counts[i] > 0 && (
					<div key={label} title={`${label}: ${counts[i]}`} className={`animate-fillbar h-full ${bg}`} style={{ width: `${(counts[i] / total) * 100}%`, animationDelay: `${i * 80}ms` }} />
				))}
			</div>
			<ul className="mt-3 divide-y divide-hair">
				{STAGES.map(([, label, bg], i) => (
					<li key={label} className={`flex items-center justify-between py-2.5 text-[14px] ${counts[i] === 0 ? 'text-ink-3' : 'text-ink'}`}>
						<span className="flex items-center gap-2.5 whitespace-nowrap"><span className={`h-2 w-2 shrink-0 ${bg} ${counts[i] === 0 ? 'opacity-40' : ''}`} />{label}</span>
						<span className="num">{counts[i]}</span>
					</li>
				))}
			</ul>
		</section>
	)
}

/* ───────── Recent activity ───────── */
export function Activity({ items }: { items: InvoiceSummary[] }) {
	const recent = [...items].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6)
	return (
		<section className="rounded-[16px] border border-hair bg-card">
			<div className="flex items-center justify-between px-6 py-4">
				<h2 className="text-[16px] font-semibold">Recent activity</h2>
				<Link href="/app/invoices" className="text-[13px] text-accent hover:underline">All invoices</Link>
			</div>
			{recent.length === 0 ? (
				<p className="border-t border-hair px-6 py-8 text-center text-[14px] text-ink-3">Activity will appear here as invoices are submitted.</p>
			) : (
				<ol className="border-t border-hair">
					{recent.map((i, k) => (
						<li key={i.invoiceId} className="animate-slidein border-b border-hair last:border-0" style={{ animationDelay: `${k * 60}ms` }}>
							<Link href={`/app/invoices/${i.invoiceId}`} className="flex items-center justify-between gap-4 px-6 py-3 hover:bg-canvas">
								<div className="min-w-0">
									<p className="truncate text-[14px] font-medium">{i.issuerName}</p>
									<p className="num text-[12px] text-ink-3">{i.invoiceNumber} · {statusLabel(i.status)} · {fmtDate(i.createdAt)}</p>
								</div>
								<div className="flex items-center gap-4"><Amount value={i.amount} /><StatusChip status={i.status} /></div>
							</Link>
						</li>
					))}
				</ol>
			)}
		</section>
	)
}

/* ───────── Getting started ───────── */
export function GettingStarted({ role }: { role: 'business' | 'investor' | 'operator' }) {
	const steps = {
		business: [
			['Connect your wallet', 'Any wallet on Whitechain Sepolia works. No account needed.', '/app'],
			['Submit an invoice', 'Add the amount, financing ask, due date and the invoice document.', '/app/invoices/new'],
			['Wait for verification', HOSTED_DEMO ? 'The eligibility rules check it against the external record.' : 'The CRE workflow checks it against the external record.', '/app/invoices'],
			['Receive USDT', 'An investor funds it and pays you directly.', '/app/invoices'],
		],
		investor: [
			['Get on the allowlist', 'An operator approves your wallet before you can fund.', '/app'],
			['Review an invoice', 'Open the verification record before you commit.', '/app/invoices'],
			['Fund in USDT', 'Approve USDT and fund. The business is paid directly.', '/app/invoices'],
			['Track your position', 'Repayment is sent to whoever holds the receivable.', '/app/positions'],
		],
		operator: [
			['Seed the registry', 'Write a simulated record for an invoice to verify against.', '/app/operator'],
			['Run verification', 'Trigger the workflow for a submitted invoice.', '/app/invoices'],
			['Resolve reviews', 'Decide invoices that need manual review.', '/app/operator'],
			['Manage investors', 'Add or remove allowlisted wallets.', '/app/operator'],
		],
	}[role]
	return (
		<section className="rounded-[16px] border border-hair bg-card p-6">
			<h2 className="text-[16px] font-semibold">Getting started</h2>
			<ol className="mt-4 space-y-1">
				{steps.map(([t, d, href], i) => (
					<li key={t}>
						<Link href={href} className="group flex items-start gap-3 rounded-ctl p-2.5 transition-colors hover:bg-canvas">
							<span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-chip bg-inset font-mono text-[11px] text-ink-3 transition-colors group-hover:bg-pine group-hover:text-white">{i + 1}</span>
							<span><span className="block text-[14px] font-medium">{t}</span><span className="block text-[13px] text-ink-3">{d}</span></span>
						</Link>
					</li>
				))}
			</ol>
		</section>
	)
}

/* ───────── Protocol facts ───────── */
export function Protocol() {
	const rows: [string, string][] = [
		['InvoiceRegistry', ADDRESSES.registry],
		['InvestorAllowlist', ADDRESSES.allowlist],
		['ReceivableFinance', ADDRESSES.finance],
		['USDT (official)', ADDRESSES.usdt],
	]
	return (
		<section className="rounded-[16px] border border-hair bg-card p-6">
			<div className="flex items-center justify-between">
				<h2 className="text-[16px] font-semibold">Protocol</h2>
				<span className="flex items-center gap-1.5 text-[12px] text-ink-3"><Image src="/whitechain.svg" alt="" width={16} height={16} unoptimized />Whitechain Sepolia</span>
			</div>
			<ul className="mt-3 divide-y divide-hair">
				{rows.map(([k, a]) => (
					<li key={k} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
						<span className="flex items-center gap-2 text-ink-2">
							{k.startsWith('USDT') && <Image src="/usdt.svg" alt="" width={16} height={16} unoptimized />}
							{k}
						</span>
						<a href={`${EXPLORER}/address/${a}`} target="_blank" rel="noreferrer" className="num text-[12px] text-accent hover:underline">{shorten(a, 6, 4)} ↗</a>
					</li>
				))}
			</ul>
			<p className="mt-3 rounded-ctl bg-inset px-3 py-2 text-[12px] leading-[1.5] text-ink-2">Contracts hold no funds. Verification data is simulated and verdicts are recorded by an application wallet.</p>
		</section>
	)
}
