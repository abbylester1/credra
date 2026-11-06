'use client'

import { explorerAddress, explorerTx, shorten } from '@/lib/config'
import { formatUsdt } from '@/lib/money'
import { statusLabel } from '@/lib/status'
import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ')

/* ---------- Buttons ---------- */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'text' | 'danger'; dense?: boolean; loading?: boolean }
export function Spinner({ className }: { className?: string }) {
	return <span aria-hidden className={cx('animate-spin-fast inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent', className)} />
}
/** Shimmering placeholder shown while data loads. */
export function Skeleton({ className }: { className?: string }) {
	return <div aria-hidden className={cx('skeleton', className)} />
}
export function Button({ variant = 'secondary', dense, loading, className, children, ...p }: BtnProps) {
	const base = 'inline-flex items-center justify-center gap-2 rounded-ctl text-[14px] font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50'
	const size = dense ? 'h-8 px-3' : variant === 'primary' ? 'h-11 px-[18px]' : 'h-10 px-4'
	const look =
		variant === 'primary'
			? 'bg-pine text-white hover:bg-pine-hover'
			: variant === 'danger'
				? 'border border-s-reject bg-card text-s-reject hover:bg-s-reject-soft'
				: variant === 'text'
					? 'text-accent hover:underline px-0'
					: 'border border-field bg-card text-ink hover:bg-inset'
	return (
		<button {...p} aria-busy={loading || undefined} disabled={p.disabled || loading} className={cx(base, size, look, 'active:scale-[0.98]', className)}>
			{loading && <Spinner />}
			{children}
		</button>
	)
}

/* ---------- Status ---------- */
const STATUS_STYLE: Record<number, { fg: string; bg: string }> = {
	1: { fg: 'text-s-neutral', bg: 'bg-s-neutral-soft' },
	2: { fg: 'text-s-review', bg: 'bg-s-review-soft' },
	3: { fg: 'text-verified', bg: 'bg-verified-soft' },
	4: { fg: 'text-s-reject', bg: 'bg-s-reject-soft' },
	5: { fg: 'text-s-funded', bg: 'bg-s-funded-soft' },
	6: { fg: 'text-s-repaid', bg: 'bg-s-repaid-soft' },
	7: { fg: 'text-s-default', bg: 'bg-s-default-soft' },
}
export function StatusChip({ status }: { status: number }) {
	const s = STATUS_STYLE[status] ?? STATUS_STYLE[1]
	return (
		<span key={status} className={cx('animate-popin inline-flex items-center gap-1.5 rounded-chip px-2.5 py-1 text-[12px] font-medium', s.fg, s.bg)}>
			<span className="h-1.5 w-1.5 bg-current" aria-hidden />
			{statusLabel(status)}
		</span>
	)
}

const VERDICT: Record<string, { label: string; fg: string; bg: string }> = {
	ELIGIBLE: { label: 'Passed', fg: 'text-verified', bg: 'bg-verified-soft' },
	REJECTED: { label: 'Failed', fg: 'text-s-reject', bg: 'bg-s-reject-soft' },
	MANUAL_REVIEW: { label: 'Needs review', fg: 'text-s-review', bg: 'bg-s-review-soft' },
	ERROR: { label: 'Could not complete', fg: 'text-s-review', bg: 'bg-s-review-soft' },
}
export function VerdictChip({ verdict }: { verdict: string | null }) {
	if (!verdict) return <span className="text-[13px] text-ink-3">Not run</span>
	const v = VERDICT[verdict] ?? VERDICT.ERROR
	return <span key={verdict} className={cx('animate-popin inline-flex rounded-chip px-2.5 py-1 text-[12px] font-medium', v.fg, v.bg)}>{v.label}</span>
}

/* ---------- Data ---------- */
export function Amount({ value, unit = 'USDT', figure, tone }: { value: string | bigint; unit?: string; figure?: boolean; tone?: 'accent' | 'danger' }) {
	const text = formatUsdt(BigInt(value))
	const [w, f = ''] = text.split('.')
	const shown = `${Number(w).toLocaleString('en-US')}.${f.padEnd(2, '0')}`
	return (
		<span className={cx('num', figure ? 'text-[28px] font-medium leading-none' : 'text-[14px]', tone === 'accent' && 'text-verified', tone === 'danger' && 'text-s-reject')}>
			{shown}
			<span className={cx('ml-1 text-ink-3', figure ? 'text-[12px]' : 'text-[11px]')}>{unit}</span>
		</span>
	)
}

export function TxLink({ hash }: { hash: string }) {
	return (
		<a href={explorerTx(hash)} target="_blank" rel="noreferrer" className="num text-[12px] text-accent hover:underline" title={hash}>
			tx {shorten(hash, 6, 4)} <span aria-hidden>{'↗'}</span>
			<span className="sr-only"> (opens the block explorer)</span>
		</a>
	)
}
export function AddressLink({ address }: { address: string }) {
	return (
		<a href={explorerAddress(address)} target="_blank" rel="noreferrer" className="num text-[12px] text-accent hover:underline" title={address}>
			{shorten(address, 6, 4)}
		</a>
	)
}

const ROLE_TONE: Record<string, string> = {
	Investor: 'bg-s-funded-soft text-s-funded',
	Business: 'bg-accent-soft text-accent',
	Verifier: 'bg-s-review-soft text-s-review',
	Operator: 'bg-s-neutral-soft text-s-neutral',
}

/** A wallet shown as a person: name and role. The address stays hidden until the name is clicked. */
export function WalletTag({ address, label, align = 'right', fallbackName = 'Unnamed wallet', showRole = true }: { address: string; label?: { name: string; role: string } | null; align?: 'left' | 'right'; fallbackName?: string; showRole?: boolean }) {
	const [open, setOpen] = useState(false)
	const [copied, setCopied] = useState(false)
	const name = label?.name ?? fallbackName
	async function copy() {
		try { await navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 1200) } catch {}
	}
	return (
		<span className={cx('inline-flex flex-col gap-1.5', align === 'right' ? 'items-end text-right' : 'items-start text-left')}>
			<button type="button" onClick={() => setOpen(!open)} aria-expanded={open} title={open ? 'Hide address' : 'Show wallet address'} className="group inline-flex min-h-6 flex-wrap items-center gap-x-2 gap-y-0.5 rounded-chip text-left text-[14px] font-medium leading-5 text-ink hover:text-accent">
				{name}
				{label && showRole && <span className={cx('rounded-chip px-1.5 py-px text-[11px] font-medium', ROLE_TONE[label.role] ?? ROLE_TONE.Operator)}>{label.role}</span>}
				<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cx('text-ink-3 transition-transform duration-200', open && 'rotate-180')} aria-hidden><path d="M2 3.5l3 3 3-3" /></svg>
			</button>
			{open && (
				<span className="animate-popin flex flex-wrap items-center gap-x-2 gap-y-1 rounded-ctl bg-inset px-2.5 py-1.5">
					<span className="num break-all text-[12px] text-ink-2">{address}</span>
					<button type="button" onClick={copy} className="text-[12px] font-medium text-accent hover:underline">{copied ? 'Copied' : 'Copy'}</button>
					<a href={explorerAddress(address)} target="_blank" rel="noreferrer" className="text-[12px] font-medium text-accent hover:underline">Explorer {'↗'}</a>
				</span>
			)}
		</span>
	)
}

export function SimulatedTag({ children = 'Simulated data' }: { children?: ReactNode }) {
	return (
		<span className="inline-block rounded-chip border border-dashed border-s-review px-1.5 py-px font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-s-review">
			{children}
		</span>
	)
}

/** Source, signer and transaction for any result (principles I and III). */
export function ProvenanceStrip({ simulated, recordedBy, tx }: { simulated?: boolean; recordedBy?: string; tx?: string | null }) {
	return (
		<div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-ctl bg-inset px-3 py-2 font-mono text-[12px] text-ink-2">
			{simulated && <SimulatedTag />}
			{simulated && <span>Source: simulated ERP record</span>}
			{recordedBy && <span>Recorded by: {recordedBy}</span>}
			{tx ? <TxLink hash={tx} /> : <span className="text-ink-3">No transaction yet</span>}
		</div>
	)
}

/* ---------- Layout ---------- */
export function Card({ children, className, pad = true }: { children: ReactNode; className?: string; pad?: boolean }) {
	return <section className={cx('rounded-[16px] border border-hair bg-card', pad && 'p-6', className)}>{children}</section>
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
	return (
		<header className="mb-8 flex flex-wrap items-start justify-between gap-4">
			<div>
				<h1 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.03em]">{title}</h1>
				{description && <p className="mt-1.5 max-w-[60ch] text-[15px] text-ink-3">{description}</p>}
			</div>
			<div className="flex items-center gap-2">{actions}</div>
		</header>
	)
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
	return (
		<div className="rounded-card bg-inset px-6 py-10 text-center">
			<p className="text-[16px] font-semibold">{title}</p>
			{body && <p className="mx-auto mt-1 max-w-[52ch] text-[14px] text-ink-2">{body}</p>}
			{action && <div className="mt-4 flex justify-center">{action}</div>}
		</div>
	)
}

export function InlineNotice({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'error' | 'ok'; children: ReactNode }) {
	const t = {
		info: 'bg-inset text-ink-2',
		warn: 'bg-s-review-soft text-s-review',
		error: 'bg-s-reject-soft text-s-reject',
		ok: 'bg-verified-soft text-verified',
	}[tone]
	return (
		<div role={tone === 'error' ? 'alert' : 'status'} className={cx('rounded-ctl px-3 py-2 text-[14px]', t)}>
			{children}
		</div>
	)
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
	return (
		<label className="block">
			<span className="mb-1 block text-[13px] font-medium text-ink">{label}</span>
			{children}
			{hint && !error && <span className="mt-1 block text-[12px] text-ink-3">{hint}</span>}
			{error && <span className="mt-1 block text-[12px] text-s-reject">{error}</span>}
		</label>
	)
}
export const inputCls =
	'h-11 w-full rounded-ctl border border-field bg-card px-3 text-[14px] text-ink placeholder:text-ink-3 focus-visible:outline-2 focus-visible:outline-accent'

/** Key-value list. `stacked` puts the label above the value, for narrow columns. */
export function Dl({ rows, stacked }: { rows: [string, ReactNode][]; stacked?: boolean }) {
	return (
		<dl className="divide-y divide-hair">
			{rows.map(([k, v]) => (
				<div key={k} className={stacked ? 'space-y-1 py-3 text-[14px]' : 'flex items-baseline justify-between gap-4 py-2.5 text-[14px]'}>
					<dt className={stacked ? 'text-[12px] text-ink-3' : 'shrink-0 text-ink-3'}>{k}</dt>
					<dd className={stacked ? 'text-ink' : 'min-w-0 text-right text-ink'}>{v}</dd>
				</div>
			))}
		</dl>
	)
}

export const fmtDate = (sec: number) =>
	new Date(sec * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export function relativeDue(sec: number, nowMs = Date.now()): { text: string; late: boolean } {
	const days = Math.round((sec * 1000 - nowMs) / 86_400_000)
	if (days < 0) return { text: `${-days} day${-days === 1 ? '' : 's'} overdue`, late: true }
	if (days === 0) return { text: 'due today', late: false }
	return { text: `in ${days} day${days === 1 ? '' : 's'}`, late: false }
}

export function MetricsSkeleton() {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading">
			{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[132px] !rounded-[20px]" />)}
		</div>
	)
}
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
	return (
		<div className="overflow-hidden rounded-[16px] border border-hair bg-card" aria-label="Loading">
			{Array.from({ length: rows }).map((_, i) => (
				<div key={i} className="flex items-center gap-4 border-b border-hair px-4 py-3.5 last:border-0">
					<Skeleton className="h-8 w-8 !rounded-full" />
					<div className="flex-1 space-y-2"><Skeleton className="h-3 w-1/3" /><Skeleton className="h-2.5 w-1/5" /></div>
					<Skeleton className="h-3 w-20" /><Skeleton className="h-6 w-20" />
				</div>
			))}
		</div>
	)
}
export function DetailSkeleton() {
	return (
		<div className="space-y-6" aria-label="Loading">
			<Skeleton className="h-9 w-72" /><Skeleton className="h-[92px] w-full !rounded-[16px]" /><Skeleton className="h-[110px] w-full !rounded-[16px]" />
			<div className="grid gap-6 lg:grid-cols-[2fr_1fr]"><Skeleton className="h-[320px] !rounded-[16px]" /><Skeleton className="h-[320px] !rounded-[16px]" /></div>
		</div>
	)
}

const METRIC_ICONS = ['M4 4h12v12H4zM8 8h4M8 12h4', 'M4 10l4 4 8-8', 'M10 3v14M6 7h8M6 13h8', 'M5 3v14M5 5h10l-2 3 2 3H5']
/** Tinted summary tile used on Overview and Positions, same language as the landing page cards. */
export function MetricCard({ label, children, i = 0 }: { label: string; children: ReactNode; i?: number }) {
	return (
		<div className="animate-popin" style={{ animationDelay: `${i * 70}ms` }}>
			<div className="rounded-[20px] border border-hair bg-inset p-5 transition-shadow duration-300 hover:shadow-[0_18px_40px_-24px_rgba(18,17,15,0.35)]">
				<span className="flex h-9 w-9 items-center justify-center rounded-ctl border border-hair bg-card text-accent">
					<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={METRIC_ICONS[i % METRIC_ICONS.length]} /></svg>
				</span>
				<div className="mt-5 text-[13px] text-ink-3">{label}</div>
				<div className="mt-1.5">{children}</div>
			</div>
		</div>
	)
}
