'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { InvoiceTable } from '@/components/InvoiceTable'
import { AddressLink, Button, Card, Field, inputCls, InlineNotice, PageHeader, SimulatedTag, TxLink } from '@/components/ui'
import { apiJson } from '@/lib/client'
import { useInvoices } from '@/lib/useInvoices'
import { useRole } from '@/lib/useRole'

const SCENARIOS = [['match', 'Matches the invoice'], ['amount_mismatch', 'Amount differs'], ['disputed', 'Marked disputed'], ['absent', 'Not found']] as const

function Login({ onDone }: { onDone: () => void }) {
	const [pass, setPass] = useState('')
	const [err, setErr] = useState<string | null>(null)
	return (
		<Card className="max-w-[480px]">
			<h2 className="text-[20px] font-semibold">Operator sign in</h2>
			<p className="mt-1 text-[14px] text-ink-2">Enter the operator passcode. This is demo-grade access control.</p>
			<form className="mt-4 space-y-3" onSubmit={async (e) => {
				e.preventDefault(); setErr(null)
				try { await apiJson('/api/operator/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ passcode: pass }) }); onDone() }
				catch (x) { setErr((x as Error).message) }
			}}>
				<Field label="Passcode"><input type="password" className={inputCls} value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="off" /></Field>
				{err && <InlineNotice tone="error">{err}</InlineNotice>}
				<Button type="submit" variant="primary" disabled={!pass}>Sign in</Button>
			</form>
		</Card>
	)
}


function Investors() {
	const qc = useQueryClient()
	const q = useQuery({ queryKey: ['allowlist'], queryFn: () => apiJson<{ address: string }[]>('/api/operator/investors') })
	const [addr, setAddr] = useState('')
	const [busy, setBusy] = useState(false)
	const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string; tx?: string } | null>(null)
	async function change(address: string, action: 'add' | 'remove') {
		setBusy(true); setMsg(null)
		try {
			const r = await apiJson<{ txHash: string }>('/api/operator/investors', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ address, action }) })
			setMsg({ tone: 'ok', text: action === 'add' ? 'Investor approved.' : 'Investor removed. Existing positions are not affected.', tx: r.txHash })
			setAddr(''); await qc.invalidateQueries({ queryKey: ['allowlist'] })
		} catch (e) { setMsg({ tone: 'error', text: (e as Error).message }) } finally { setBusy(false) }
	}
	return (
		<Card>
			<h2 className="text-[16px] font-semibold">Approved investors</h2>
			<p className="mt-1 text-[14px] text-ink-2">Only these wallets can fund invoices or receive receivables. Removing a wallet blocks new funding and incoming transfers.</p>
			<ul className="mt-3 divide-y divide-hair">
				{q.isLoading && <li className="py-2 text-[14px] text-ink-3">Loading</li>}
				{q.data?.length === 0 && <li className="py-2 text-[14px] text-ink-3">No approved investors.</li>}
				{q.data?.map((i) => (
					<li key={i.address} className="flex items-center justify-between py-2"><AddressLink address={i.address} /><Button dense disabled={busy} onClick={() => change(i.address, 'remove')}>Remove</Button></li>
				))}
			</ul>
			<div className="mt-4 flex flex-wrap items-end gap-3">
				<div className="min-w-[260px] flex-1"><Field label="Add a wallet"><input className={inputCls + ' num'} value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="0x..." /></Field></div>
				<Button variant="primary" disabled={busy || !/^0x[0-9a-fA-F]{40}$/.test(addr)} onClick={() => change(addr, 'add')}>{busy ? 'Working' : 'Approve investor'}</Button>
			</div>
			{msg && <div className="mt-3"><InlineNotice tone={msg.tone}>{msg.text}{msg.tx && <> <TxLink hash={msg.tx} /></>}</InlineNotice></div>}
		</Card>
	)
}

function Console() {
	const q = useInvoices('all')
	const [num, setNum] = useState('')
	const [scenario, setScenario] = useState<(typeof SCENARIOS)[number][0]>('match')
	const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
	const items = q.data ?? []
	return (
		<div className="space-y-8">
			<Card className="border-dashed !border-s-review">
				<div className="mb-3 flex items-center gap-2"><h2 className="text-[16px] font-semibold">Demo tools</h2><SimulatedTag /></div>
				<p className="mb-4 text-[14px] text-ink-2">Writes a record into the simulated external registry so an invoice has something to be verified against. This is not real data.</p>
				<div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
					<Field label="Invoice"><select className={inputCls} value={num} onChange={(e) => setNum(e.target.value)}><option value="">Choose an invoice</option>{items.map((i) => <option key={i.invoiceId} value={i.invoiceNumber}>{i.invoiceNumber} ({i.issuerName})</option>)}</select></Field>
					<Field label="Record contains"><select className={inputCls} value={scenario} onChange={(e) => setScenario(e.target.value as typeof scenario)}>{SCENARIOS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
					<Button disabled={!num} onClick={async () => {
						setMsg(null)
						try { await apiJson('/api/operator/simulated-erp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ invoiceNumber: num, scenario }) }); setMsg({ tone: 'ok', text: 'Simulated record written.' }) }
						catch (x) { setMsg({ tone: 'error', text: (x as Error).message }) }
					}}>Write record</Button>
				</div>
				{msg && <div className="mt-3"><InlineNotice tone={msg.tone}>{msg.text}</InlineNotice></div>}
			</Card>
			<Investors />
			<section>
				<h2 className="mb-3 text-[20px] font-semibold">All invoices</h2>
				<InvoiceTable items={items} />
			</section>
		</div>
	)
}

export default function OperatorPage() {
	const { operator, loading, refetchOperator } = useRole()
	return (
		<>
			<PageHeader title="Operator console" description="Demo tools and every invoice on the platform." actions={operator ? <Button dense onClick={async () => { await apiJson('/api/operator/login', { method: 'DELETE' }); await refetchOperator() }}>Sign out</Button> : undefined} />
			{loading ? <p className="text-[14px] text-ink-3">Checking access</p> : operator ? <Console /> : <Login onDone={() => void refetchOperator()} />}
		</>
	)
}
