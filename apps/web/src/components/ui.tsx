'use client'

import { explorerAddress, explorerTx, shorten } from '@/lib/config'
import { formatUsdt } from '@/lib/money'
import { statusLabel } from '@/lib/status'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ')

/* ---------- Buttons ---------- */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'text' | 'danger'; dense?: boolean }
export function Button({ variant = 'secondary', dense, className, ...p }: BtnProps) {
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
	return <button {...p} className={cx(base, size, look, className)} />
}

/* ---------- Status ---------- */
const STATUS_STYLE: Record<number, { fg: string; bg: string }> = {
	1: { fg: 'text-s-neutral', bg: 'bg-s-neutral-soft' },
	2: { fg: 'text-s-review', bg: 'bg-s-review-soft' },
	3: { fg: 'text-accent', bg: 'bg-accent-soft' },
	4: { fg: 'text-s-reject', bg: 'bg-s-reject-soft' },
	5: { fg: 'text-s-funded', bg: 'bg-s-funded-soft' },
	6: { fg: 'text-s-repaid', bg: 'bg-s-repaid-soft' },
	7: { fg: 'text-s-default', bg: 'bg-s-default-soft' },
}
export function StatusChip({ status }: { status: number }) {
	const s = STATUS_STYLE[status] ?? STATUS_STYLE[1]
	return (
		<span className={cx('inline-flex items-center gap-1.5 rounded-chip px-2.5 py-1 text-[12px] font-medium', s.fg, s.bg)}>
			<span className="h-1.5 w-1.5 bg-current" aria-hidden />
			{statusLabel(status)}
		</span>
	)
}

const VERDICT: Record<string, { label: string; fg: string; bg: string }> = {
	ELIGIBLE: { label: 'Passed', fg: 'text-accent', bg: 'bg-accent-soft' },
	REJECTED: { label: 'Failed', fg: 'text-s-reject', bg: 'bg-s-reject-soft' },
	MANUAL_REVIEW: { label: 'Needs review', fg: 'text-s-review', bg: 'bg-s-review-soft' },
	ERROR: { label: 'Could not complete', fg: 'text-s-review', bg: 'bg-s-review-soft' },
}
export function VerdictChip({ verdict }: { verdict: string | null }) {
	if (!verdict) return <span className="text-[13px] text-ink-3">Not run</span>
	const v = VERDICT[verdict] ?? VERDICT.ERROR
	return <span className={cx('inline-flex rounded-chip px-2.5 py-1 text-[12px] font-medium', v.fg, v.bg)}>{v.label}</span>
}

/* ---------- Data ---------- */
export function Amount({ value, unit = 'USDT', figure, tone }: { value: string | bigint; unit?: string; figure?: boolean; tone?: 'accent' | 'danger' }) {
	const text = formatUsdt(BigInt(value))
	const [w, f = ''] = text.split('.')
	const shown = `${Number(w).toLocaleString('en-US')}.${f.padEnd(2, '0')}`
	return (
		<span className={cx('num', figure ? 'text-[28px] font-medium leading-none' : 'text-[14px]', tone === 'accent' && 'text-accent', tone === 'danger' && 'text-s-reject')}>
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
		ok: 'bg-accent-soft text-accent',
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

export function Dl({ rows }: { rows: [string, ReactNode][] }) {
	return (
		<dl className="divide-y divide-hair">
			{rows.map(([k, v]) => (
				<div key={k} className="flex items-baseline justify-between gap-4 py-2.5 text-[14px]">
					<dt className="text-ink-3">{k}</dt>
					<dd className="text-right text-ink">{v}</dd>
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
