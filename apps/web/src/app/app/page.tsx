'use client'

import Link from 'next/link'
import { SignInGate } from '@/components/SignInGate'
import { Activity, GettingStarted, Pipeline, Protocol } from '@/components/OverviewExtras'
import { Amount, Button, fmtDate, InlineNotice, MetricCard, MetricsSkeleton, PageHeader } from '@/components/ui'
import { useInvoices, type InvoiceSummary, type Scope } from '@/lib/useInvoices'
import { useRole } from '@/lib/useRole'

const Metric = MetricCard
const Count = ({ n }: { n: number }) => <span className="num text-[32px] font-medium leading-none">{n}</span>

function Overview({ scope, role, headers }: { scope: Scope; role: string; headers?: Record<string, string> }) {
	const q = useInvoices(scope, headers)
	if (q.isLoading) return <MetricsSkeleton />
	if (q.error) return <InlineNotice tone="error">We could not load your activity. Nothing was changed.</InlineNotice>
	const items: InvoiceSummary[] = q.data ?? []
	const sum = (f: (i: InvoiceSummary) => boolean, pick: (i: InvoiceSummary) => string) => items.filter(f).reduce((s, i) => s + BigInt(pick(i)), 0n)

	const metrics =
		role === 'business'
			? [
					['Total invoices', <Count key="a" n={items.length} />],
					['Awaiting verification', <Count key="b" n={items.filter((i) => i.status === 1 || i.status === 2).length} />],
					['Financing received', <Amount key="c" value={sum((i) => i.status === 5 || i.status === 6, (i) => i.financingAmount)} figure />],
					['Outstanding to repay', <Amount key="d" value={sum((i) => i.status === 5, (i) => i.amount)} figure />],
				]
			: role === 'investor'
				? [
						['Open for funding', <Count key="a" n={items.length} />],
						['Available financing', <Amount key="b" value={sum(() => true, (i) => i.financingAmount)} figure />],
						['Potential return', <Amount key="c" value={sum(() => true, (i) => (BigInt(i.amount) - BigInt(i.financingAmount)).toString())} figure tone="accent" />],
						['Earliest due', <span key="d" className="num text-[22px] font-medium">{items.length ? fmtDate(Math.min(...items.map((i) => i.dueDate))) : 'None'}</span>],
					]
				: [
						['In review', <Count key="a" n={items.filter((i) => i.status === 2).length} />],
						['Eligible', <Count key="b" n={items.filter((i) => i.status === 3).length} />],
						['Rejected', <Count key="c" n={items.filter((i) => i.status === 4).length} />],
						['Total invoices', <Count key="d" n={items.length} />],
					]

	return (
		<>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{metrics.map(([l, v], i) => <Metric key={l as string} label={l as string} i={i}>{v}</Metric>)}
			</div>
			<div className="dotgrid mt-6 grid gap-4 rounded-[20px] border border-hair bg-inset p-4 md:p-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
				<Activity items={items} label={role === 'investor' ? 'Available invoices' : undefined} />
				<Pipeline items={items} />
			</div>
		</>
	)
}

export default function OverviewPage() {
	const { role, loading } = useRole()
	return (
		<>
			<PageHeader
				title="Overview"
				description={
					role === 'investor' ? 'Verified invoices open for funding. Browse, review and commit.' :
					role === 'operator' ? 'Platform activity across all invoices and investors.' :
					'Your financing activity, the pipeline and where to go next.'
				}
			/>
			{loading ? (
				<MetricsSkeleton />
			) : role === 'operator' ? (
				<Overview scope="all" role="operator" />
			) : role === 'investor' ? (
				<Overview scope="marketplace" role="investor" />
			) : (
				<SignInGate>{(h) => <Overview scope="mine" role="business" headers={h} />}</SignInGate>
			)}
			<div className="mt-6 grid gap-6 lg:grid-cols-2">
				<GettingStarted role={role} />
				<Protocol />
			</div>
		</>
	)
}
