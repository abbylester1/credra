'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { Amount, EmptyState, MetricCard, fmtDate, InlineNotice, PageHeader, relativeDue, StatusChip, TableSkeleton } from '@/components/ui'
import { apiJson } from '@/lib/client'
import type { InvoiceSummary } from '@/lib/useInvoices'

type Position = InvoiceSummary & { holder: string; fundedAmount: string; repaidAmount: string; fundedAt: number; repaidAt: number }

export default function PositionsPage() {
	const { address } = useAccount()
	const q = useQuery({
		queryKey: ['positions', address],
		queryFn: () => apiJson<Position[]>(`/api/positions?wallet=${address}`),
		enabled: !!address,
		refetchInterval: 15_000,
	})
	const items = q.data ?? []
	const sum = (f: (p: Position) => string, filter: (p: Position) => boolean = () => true) => items.filter(filter).reduce((s, p) => s + BigInt(f(p)), 0n)
	return (
		<>
			<PageHeader title="Positions" description="Your receivables. Repayment goes to the current holder." />
			{!address ? (
				<InlineNotice tone="warn">Connect your wallet to see your positions.</InlineNotice>
			) : q.isLoading ? (
				<TableSkeleton rows={3} />
			) : q.error ? (
				<InlineNotice tone="error">We could not load positions. Nothing was changed.</InlineNotice>
			) : items.length === 0 ? (
				<EmptyState title="No positions yet" body="When you fund an eligible invoice, the receivable appears here." action={<Link href="/app/invoices" className="text-[14px] text-accent hover:underline">Browse invoices</Link>} />
			) : (
				<>
					<div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
						<MetricCard i={0} label="Capital deployed"><Amount value={sum((p) => p.fundedAmount)} figure /></MetricCard>
						<MetricCard i={1} label="Expected repayment"><Amount value={sum((p) => p.amount, (p) => p.status === 5)} figure /></MetricCard>
						<MetricCard i={2} label="Repaid to date"><Amount value={sum((p) => p.repaidAmount)} figure tone="accent" /></MetricCard>
					</div>
					<div className="overflow-x-auto rounded-[16px] border border-hair bg-card">
						<table className="w-full min-w-[760px] border-collapse text-left text-[14px]">
							<thead><tr className="border-b border-hair text-[12px] text-ink-3">
								<th className="px-4 py-3 font-medium">Invoice</th>
								<th className="px-4 py-3 text-right font-medium">Funded</th>
								<th className="px-4 py-3 text-right font-medium">Expected repayment</th>
								<th className="px-4 py-3 text-right font-medium">Return</th>
								<th className="px-4 py-3 font-medium">Due date</th>
								<th className="px-4 py-3 font-medium">Status</th>
							</tr></thead>
							<tbody>
								{items.map((p, k) => {
									const due = relativeDue(p.dueDate)
									return (
										<tr key={p.invoiceId} style={{ animationDelay: `${k * 50}ms` }} className="animate-slidein border-b border-hair last:border-0 hover:bg-canvas">
											<td className="px-4 py-2.5"><Link href={`/app/invoices/${p.invoiceId}`} className="font-medium hover:underline">{p.issuerName}</Link><div className="num text-[12px] text-ink-3">{p.invoiceNumber}</div></td>
											<td className="px-4 py-2.5 text-right"><Amount value={p.fundedAmount} /></td>
											<td className="px-4 py-2.5 text-right"><Amount value={p.amount} /></td>
											<td className="px-4 py-2.5 text-right"><Amount value={BigInt(p.amount) - BigInt(p.fundedAmount)} tone="accent" /></td>
											<td className="px-4 py-2.5"><div>{fmtDate(p.dueDate)}</div><div className={`text-[12px] ${due.late ? 'text-s-reject' : 'text-ink-3'}`}>{due.text}</div></td>
											<td className="px-4 py-2.5"><StatusChip status={p.status} /></td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
				</>
			)}
		</>
	)
}
