'use client'

import Link from 'next/link'
import { SignInGate } from '@/components/SignInGate'
import { Amount, Button, Card, EmptyState, fmtDate, InlineNotice, PageHeader, StatusChip } from '@/components/ui'
import { useInvoices, type InvoiceSummary, type Scope } from '@/lib/useInvoices'
import { useRole } from '@/lib/useRole'

function Metric({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<Card className="!p-6">
			<div className="text-[13px] text-ink-3">{label}</div>
			<div className="mt-2">{children}</div>
		</Card>
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

	const attention = items.filter((i) => (role === 'operator' ? i.status === 2 : role === 'business' ? i.status === 3 || i.status === 4 || i.status === 2 : true)).slice(0, 5)
	return (
		<>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{metrics.map(([l, v]) => <Metric key={l as string} label={l as string}>{v}</Metric>)}
			</div>
			<Card className="mt-6" pad={false}>
				<div className="flex items-center justify-between px-6 py-4">
					<h2 className="text-[16px] font-semibold">{role === 'investor' ? 'Open invoices' : 'Needs attention'}</h2>
					<Link href="/app/invoices" className="text-[13px] text-accent hover:underline">View all</Link>
				</div>
				{attention.length === 0 ? (
					<div className="px-6 pb-6"><EmptyState title="Nothing needs attention" body="Invoices that need action appear here." /></div>
				) : (
					<ul className="divide-y divide-hair border-t border-hair">
						{attention.map((i) => (
							<li key={i.invoiceId}>
								<Link href={`/app/invoices/${i.invoiceId}`} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 hover:bg-canvas">
									<span><span className="font-medium">{i.issuerName}</span> <span className="num text-[12px] text-ink-3">{i.invoiceNumber}</span></span>
									<span className="flex items-center gap-4"><Amount value={i.amount} /><StatusChip status={i.status} /></span>
								</Link>
							</li>
						))}
					</ul>
				)}
			</Card>
		</>
	)
}

export default function OverviewPage() {
	const { role, loading } = useRole()
	return (
		<>
			<PageHeader
				title="Overview"
				description="Financing activity and open items."
				actions={role === 'business' ? <Link href="/app/invoices/new"><Button variant="primary">Submit invoice</Button></Link> : undefined}
			/>
			{loading ? (
				<p className="text-[14px] text-ink-3">Checking your wallet</p>
			) : role === 'operator' ? (
				<Overview scope="all" role="operator" />
			) : role === 'investor' ? (
				<Overview scope="marketplace" role="investor" />
			) : (
				<SignInGate>{(h) => <Overview scope="mine" role="business" headers={h} />}</SignInGate>
			)}
		</>
	)
}
