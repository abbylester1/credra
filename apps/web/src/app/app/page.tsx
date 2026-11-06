'use client'

import Link from 'next/link'
import { SignInGate } from '@/components/SignInGate'
import { Activity, GettingStarted, Pipeline, Protocol, Welcome } from '@/components/OverviewExtras'
import { Amount, Button, Card, fmtDate, InlineNotice, PageHeader } from '@/components/ui'
import { useInvoices, type InvoiceSummary, type Scope } from '@/lib/useInvoices'
import { useRole } from '@/lib/useRole'

function Metric({ label, children, i = 0 }: { label: string; children: React.ReactNode; i?: number }) {
	return (
		<div className="animate-popin" style={{ animationDelay: `${i * 70}ms` }}>
			<Card className="!p-6 transition-shadow duration-300 hover:shadow-[0_14px_30px_-22px_rgba(15,26,22,0.35)]">
				<div className="text-[13px] text-ink-3">{label}</div>
				<div className="mt-3">{children}</div>
			</Card>
		</div>
	)
}
const Count = ({ n }: { n: number }) => <span className="num text-[32px] font-medium leading-none">{n}</span>

function Overview({ scope, role, headers }: { scope: Scope; role: string; headers?: Record<string, string> }) {
	const q = useInvoices(scope, headers)
	if (q.isLoading) return <p className="text-[14px] text-ink-3">Loading</p>
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
			<div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
				<Activity items={items} />
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
				description="Your financing activity, the pipeline and where to go next."
			/>
			<Welcome role={role} />
			{loading ? (
				<p className="text-[14px] text-ink-3">Checking your wallet</p>
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
