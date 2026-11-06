'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { InvoiceSummary } from '@/lib/useInvoices'
import { Amount, EmptyState, fmtDate, relativeDue, StatusChip, VerdictChip } from './ui'

const STAGES: { key: string; label: string; match: (s: number) => boolean }[] = [
	{ key: 'all', label: 'All', match: () => true },
	{ key: 'submitted', label: 'Submitted', match: (s) => s === 1 },
	{ key: 'review', label: 'Under review', match: (s) => s === 2 },
	{ key: 'eligible', label: 'Eligible', match: (s) => s === 3 },
	{ key: 'funded', label: 'Funded', match: (s) => s === 5 },
	{ key: 'repaid', label: 'Repaid', match: (s) => s === 6 },
]

const SORTS = { created: 'Newest', due: 'Due date', amount: 'Amount' } as const

/** Exception marker colour for the row's left edge; always paired with text in the status or due cell. */
function marker(i: InvoiceSummary): string {
	const due = relativeDue(i.dueDate)
	if (i.status === 4 || i.status === 7 || (due.late && i.status === 5)) return 'bg-s-reject'
	if (i.status === 2) return 'bg-s-review'
	return 'bg-transparent'
}

export function InvoiceTable({ items, showReturn = true }: { items: InvoiceSummary[]; showReturn?: boolean }) {
	const [stage, setStage] = useState('all')
	const [q, setQ] = useState('')
	const [sort, setSort] = useState<keyof typeof SORTS>('created')

	const counts = useMemo(() => Object.fromEntries(STAGES.map((s) => [s.key, items.filter((i) => s.match(i.status)).length])), [items])
	const rows = useMemo(() => {
		const stg = STAGES.find((s) => s.key === stage)!
		const needle = q.trim().toLowerCase()
		const out = items.filter(
			(i) => stg.match(i.status) && (!needle || [i.invoiceNumber, i.issuerName, i.buyerName, i.submitTx].some((x) => x.toLowerCase().includes(needle))),
		)
		return out.sort((a, b) =>
			sort === 'due' ? a.dueDate - b.dueDate : sort === 'amount' ? Number(BigInt(b.amount) - BigInt(a.amount)) : b.createdAt - a.createdAt,
		)
	}, [items, stage, q, sort])

	const rejected = items.filter((i) => i.status === 4).length
	const overdue = items.filter((i) => i.status === 5 && relativeDue(i.dueDate).late).length
	const total = items.reduce((s, i) => s + BigInt(i.amount), 0n)

	return (
		<div>
			<div role="tablist" aria-label="Invoice stage" className="flex flex-wrap items-center gap-1 border-b border-hair pb-3">
				{STAGES.map((s, idx) => (
					<span key={s.key} className="flex items-center gap-1">
						<button
							role="tab"
							aria-selected={stage === s.key}
							onClick={() => setStage(s.key)}
							className={`flex h-9 items-center gap-2 rounded-ctl px-3 text-[14px] ${stage === s.key ? 'border border-hair bg-card font-medium' : 'text-ink-2 hover:bg-inset'}`}
						>
							{s.label}
							<span className="num text-[12px] text-ink-3">{counts[s.key]}</span>
						</button>
						{idx > 0 && idx < STAGES.length - 1 && <span aria-hidden className="text-ink-3">{'›'}</span>}
					</span>
				))}
			</div>

			<div className="flex flex-wrap gap-x-10 gap-y-3 py-5">
				<div><div className="text-[13px] text-ink-3">Total invoiced</div><Amount value={total} figure /></div>
				<div><div className="text-[13px] text-ink-3">Rejected</div><div className="num text-[28px] font-medium leading-none">{rejected}</div></div>
				<div><div className="text-[13px] text-ink-3">Overdue</div><div className="num text-[28px] font-medium leading-none">{overdue}</div></div>
			</div>

			<div className="mb-3 flex flex-wrap items-center gap-2">
				<input
					aria-label="Search invoices"
					placeholder="Search invoice, issuer, buyer or tx"
					value={q}
					onChange={(e) => setQ(e.target.value)}
					className="h-10 w-full max-w-[320px] rounded-ctl border border-field bg-card px-3 text-[14px]"
				/>
				<select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as keyof typeof SORTS)} className="h-10 rounded-ctl border border-field bg-card px-3 text-[14px]">
					{Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
				</select>
			</div>

			{rows.length === 0 ? (
				<EmptyState title={items.length === 0 ? 'No invoices yet' : 'No invoices match'} body={items.length === 0 ? 'Invoices appear here once they are submitted.' : 'Try another stage or clear the search.'} />
			) : (
				<div className="overflow-x-auto rounded-[16px] border border-hair bg-card">
					<table className="w-full min-w-[820px] border-collapse text-left text-[14px]">
						<thead>
							<tr className="border-b border-hair text-[12px] text-ink-3">
								<th className="w-1 p-0" aria-hidden />
								<th className="px-4 py-3 font-medium">Invoice</th>
								<th className="px-4 py-3 text-right font-medium">Amount</th>
								<th className="px-4 py-3 text-right font-medium">Financing</th>
								{showReturn && <th className="px-4 py-3 text-right font-medium">Return</th>}
								<th className="px-4 py-3 font-medium">Due date</th>
								<th className="px-4 py-3 font-medium">Verification</th>
								<th className="px-4 py-3 font-medium">Status</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((i) => {
								const due = relativeDue(i.dueDate)
								return (
									<tr key={i.invoiceId} className="border-b border-hair last:border-0 hover:bg-canvas">
										<td className="w-1 p-0"><span className={`block h-[52px] w-[3px] ${marker(i)}`} aria-hidden /></td>
										<td className="px-4 py-2.5">
											<Link href={`/app/invoices/${i.invoiceId}`} className="font-medium hover:underline">{i.issuerName}</Link>
											<div className="num text-[12px] text-ink-3">{i.invoiceNumber}</div>
										</td>
										<td className="px-4 py-2.5 text-right"><Amount value={i.amount} /></td>
										<td className="px-4 py-2.5 text-right"><Amount value={i.financingAmount} /></td>
										{showReturn && <td className="px-4 py-2.5 text-right"><Amount value={BigInt(i.amount) - BigInt(i.financingAmount)} tone="accent" /></td>}
										<td className="px-4 py-2.5">
											<div>{fmtDate(i.dueDate)}</div>
											<div className={`text-[12px] ${due.late ? 'text-s-reject' : 'text-ink-3'}`}>{due.text}</div>
										</td>
										<td className="px-4 py-2.5"><VerdictChip verdict={i.verdict} /></td>
										<td className="px-4 py-2.5"><StatusChip status={i.status} /></td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>
			)}
			<p className="mt-3 text-[12px] text-ink-3">{rows.length} of {items.length} invoices</p>
		</div>
	)
}
