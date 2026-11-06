'use client'

import Link from 'next/link'
import { InvoiceTable } from '@/components/InvoiceTable'
import { Pipeline } from '@/components/OverviewExtras'
import { SignInGate } from '@/components/SignInGate'
import { Button, EmptyState, InlineNotice, PageHeader, TableSkeleton } from '@/components/ui'
import { useInvoices, type Scope } from '@/lib/useInvoices'
import { useRole } from '@/lib/useRole'

function List({ scope, headers }: { scope: Scope; headers?: Record<string, string> }) {
	const q = useInvoices(scope, headers)
	if (q.isLoading) return <TableSkeleton />
	if (q.error) return <InlineNotice tone="error">We could not load invoices. Nothing was changed. {(q.error as Error).message}</InlineNotice>
	return (
		<div className="space-y-6">
			<Pipeline compact items={q.data ?? []} />
			<InvoiceTable items={q.data ?? []} />
		</div>
	)
}

export default function InvoicesPage() {
	const { role, loading } = useRole()
	const action = role === 'business' ? <Link href="/app/invoices/new"><Button variant="primary">Submit invoice</Button></Link> : undefined
	return (
		<>
			<PageHeader
				title="Invoices"
				description={role === 'investor' ? 'Eligible invoices open for funding.' : role === 'operator' ? 'All invoices on the platform.' : 'Your submitted invoices.'}
				actions={action}
			/>
			{loading ? (
				<TableSkeleton />
			) : role === 'operator' ? (
				<List scope="all" />
			) : role === 'investor' ? (
				<List scope="marketplace" />
			) : (
				<SignInGate>{(h) => <List scope="mine" headers={h} />}</SignInGate>
			)}
			{!loading && role === 'business' && (
				<div className="mt-8"><EmptyState title="Need to finance an invoice?" body="Submit an invoice and its document. It gets registered onchain and verified before funding." action={<Link href="/app/invoices/new"><Button>Submit invoice</Button></Link>} /></div>
			)}
		</>
	)
}
