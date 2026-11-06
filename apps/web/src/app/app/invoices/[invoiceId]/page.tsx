'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { use, useState } from 'react'
import { useAccount } from 'wagmi'
import { EvidencePanel, type Verification } from '@/components/Evidence'
import { Amount, Button, Card, Dl, fmtDate, InlineNotice, ProvenanceStrip, relativeDue, StatusChip, TxLink, AddressLink } from '@/components/ui'
import { apiJson, useWalletHeaders } from '@/lib/client'
import { friendlyError } from '@/lib/errors'
import { shorten } from '@/lib/config'
import { useRole } from '@/lib/useRole'
import { PayPanel, DefaultButton } from '@/components/PayPanels'
import { Lifecycle } from '@/components/Lifecycle'
import { GRACE_PERIOD_SECONDS } from '@/lib/config'
import type { InvoiceSummary } from '@/lib/useInvoices'

type Detail = {
	invoice: InvoiceSummary
	verification: Verification | null
	timeline: { status: string; txHash: string | null; source: string; actor: string | null; at: number }[]
	position: { originalInvestor: string; fundedAmount: string; repaidAmount: string; fundedAt: number; repaidAt: number } | null
	holder: string | null
	decision: { decision: string; reason: string; txHash: string; at: number } | null
}

const now = () => Math.floor(Date.now() / 1000)
const SOURCE_LABEL: Record<string, string> = { submit: 'Business wallet', verification: 'Verifier wallet', operator: 'Operator', fund: 'Investor wallet', repay: 'Repayer wallet', default: 'Any wallet' }

export default function InvoiceDetail({ params }: { params: Promise<{ invoiceId: string }> }) {
	const { invoiceId } = use(params)
	const { address } = useAccount()
	const { role } = useRole()
	const qc = useQueryClient()
	const getHeaders = useWalletHeaders()
	const [busy, setBusy] = useState(false)
	const [msg, setMsg] = useState<{ tone: 'error' | 'ok'; text: string } | null>(null)

	const q = useQuery({ queryKey: ['invoice', invoiceId], queryFn: () => apiJson<Detail>(`/api/invoices/${invoiceId}`), refetchInterval: 15_000 })
	if (q.isLoading) return <p className="text-[14px] text-ink-3">Loading invoice</p>
	if (q.error || !q.data) return <InlineNotice tone="error">{(q.error as Error)?.message ?? 'Invoice not found.'} Nothing was changed.</InlineNotice>

	const { invoice: i, verification: v, timeline, position, holder, decision } = q.data
	const isIssuer = !!address && address.toLowerCase() === i.issuerWallet.toLowerCase()
	const canManage = isIssuer || role === 'operator'
	const due = relativeDue(i.dueDate)
	const returnAmt = BigInt(i.amount) - BigInt(i.financingAmount)
	const pct = ((Number(returnAmt) / Number(i.financingAmount)) * 100).toFixed(1)

	async function verify() {
		setBusy(true); setMsg(null)
		try {
			const h = role === 'operator' ? {} : await getHeaders()
			const r = await apiJson<{ verdict: string }>(`/api/invoices/${invoiceId}/verify`, { method: 'POST', headers: h })
			setMsg({ tone: 'ok', text: r.verdict === 'ELIGIBLE' ? 'Verification passed and was recorded onchain.' : 'Verification finished and the result was recorded onchain.' })
			await qc.invalidateQueries({ queryKey: ['invoice', invoiceId] })
		} catch (e) {
			setMsg({ tone: 'error', text: (e as { code?: string }).code ? (e as Error).message : friendlyError(e) })
		} finally {
			setBusy(false)
		}
	}

	async function openDocument() {
		setMsg(null)
		try {
			const h = role === 'operator' ? {} : await getHeaders()
			const res = await fetch(`/api/invoices/${invoiceId}/document`, { headers: h })
			if (!res.ok) throw new Error((await res.json()).message)
			window.open(URL.createObjectURL(await res.blob()), '_blank')
		} catch (e) {
			setMsg({ tone: 'error', text: (e as Error).message })
		}
	}

	return (
		<>
			<Link href="/app/invoices" className="inline-flex items-center gap-1 text-[13px] text-ink-3 transition-colors hover:text-ink">{'‹'} Back to invoices</Link>
			<header className="mb-6 mt-3 flex flex-wrap items-start justify-between gap-4">
				<div>
					<div className="flex flex-wrap items-center gap-3">
						<h1 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.03em]">{i.issuerName}</h1>
						<StatusChip status={i.status} />
					</div>
					<p className="mt-1 text-[14px] text-ink-3"><span className="num">{i.invoiceNumber}</span> {'·'} Due {fmtDate(i.dueDate)}, <span className={due.late ? 'text-s-reject' : ''}>{due.text}</span></p>
				</div>
				{canManage && (i.status === 1 || i.status === 2) && (
					<Button variant="primary" disabled={busy} onClick={verify}>{busy ? 'Verifying' : i.status === 1 ? 'Run verification' : 'Verify again'}</Button>
				)}
			</header>
			{msg && <div className="mb-4"><InlineNotice tone={msg.tone}>{msg.text}</InlineNotice></div>}

			<Lifecycle status={i.status} />

			<div className="mb-6 grid grid-cols-2 gap-4 rounded-card border border-hair bg-card p-6 sm:grid-cols-4">
				<div><div className="text-[13px] text-ink-3">Invoice amount</div><Amount value={i.amount} figure /></div>
				<div><div className="text-[13px] text-ink-3">Financing</div><Amount value={i.financingAmount} figure /></div>
				<div><div className="text-[13px] text-ink-3">Investor return</div><Amount value={returnAmt} figure tone="accent" /><div className="num text-[12px] text-ink-3">{pct}%</div></div>
				<div><div className="text-[13px] text-ink-3">Due date</div><div className="num text-[20px] font-medium">{fmtDate(i.dueDate)}</div></div>
			</div>

			<div className="mb-6 rounded-card border border-hair bg-card p-6">
				<div className="mb-3 flex items-baseline justify-between"><h2 className="text-[16px] font-semibold">Where the money goes</h2><span className="num text-[12px] text-ink-3">Advance rate {((Number(i.financingAmount) / Number(i.amount)) * 100).toFixed(1)}%</span></div>
				<div className="flex h-3 overflow-hidden rounded-full bg-inset">
					<div className="animate-fillbar h-full bg-pine" style={{ width: `${(Number(i.financingAmount) / Number(i.amount)) * 100}%` }} />
					<div className="animate-fillbar h-full bg-accent" style={{ width: `${(Number(returnAmt) / Number(i.amount)) * 100}%`, animationDelay: '400ms' }} />
				</div>
				<div className="mt-3 grid gap-3 text-[13px] sm:grid-cols-2">
					<div className="flex items-center gap-2 text-ink-2"><span className="h-2 w-2 bg-pine" />Investor pays the business <Amount value={i.financingAmount} /> at funding</div>
					<div className="flex items-center gap-2 text-ink-2"><span className="h-2 w-2 bg-accent" />Payer repays <Amount value={i.amount} /> to the holder, a discount of <Amount value={returnAmt} tone="accent" /></div>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
				<div className="space-y-6">
					<Card>
						<h2 className="mb-1 text-[16px] font-semibold">Financial terms</h2>
						<Dl rows={[
							['Invoice amount', <Amount key="a" value={i.amount} />],
							['Financing amount', <Amount key="b" value={i.financingAmount} />],
							['Investor return', <Amount key="c" value={returnAmt} tone="accent" />],
							['Advance rate', <span key="d" className="num">{((Number(i.financingAmount) / Number(i.amount)) * 100).toFixed(1)}%</span>],
							['Invoice date', fmtDate(i.invoiceDate)],
							['Due date', fmtDate(i.dueDate)],
							['Buyer', i.buyerName],
							['Document fingerprint', <span key="h" className="num text-[12px]" title={i.documentHash}>{shorten(i.documentHash, 10, 6)}</span>],
						]} />
					</Card>
					<Card>
						<EvidencePanel v={v} />
						{decision && (
							<div className="mt-4 rounded-ctl border border-hair bg-canvas p-3 text-[14px]">
								<div className="font-medium">Operator {decision.decision === 'APPROVE' ? 'approved' : 'rejected'} this invoice</div>
								<p className="mt-1 text-ink-2">{decision.reason}</p>
								<div className="mt-1"><TxLink hash={decision.txHash} /></div>
							</div>
						)}
					</Card>
					<Card>
						<h2 className="mb-3 text-[16px] font-semibold">Timeline</h2>
						{timeline.length === 0 ? <p className="text-[14px] text-ink-2">No activity recorded yet.</p> : (
							<ol className="relative space-y-4 border-l border-hair pl-5">
								{timeline.map((t, idx) => (
									<li key={idx} className="relative">
										<span aria-hidden className="absolute -left-[25px] top-1.5 h-2 w-2 bg-pine" />
										<div className="flex flex-wrap items-center gap-2"><span className="text-[14px] font-medium">{t.status}</span><span className="text-[12px] text-ink-3">{SOURCE_LABEL[t.source] ?? t.actor}</span></div>
										<div className="num text-[12px] text-ink-3">{new Date(t.at * 1000).toLocaleString('en-GB')}</div>
										{t.txHash && <TxLink hash={t.txHash} />}
									</li>
								))}
							</ol>
						)}
					</Card>
				</div>

				<div className="space-y-6">
					<Card>
						<h2 className="mb-3 text-[16px] font-semibold">Next step</h2>
						{i.status === 1 && <p className="text-[14px] text-ink-2">{canManage ? 'Run verification to check this invoice against the external record.' : 'Verification has not run yet.'}</p>}
						{i.status === 2 && (
							<>
								<p className="text-[14px] text-ink-2">This invoice is under review and cannot be funded until review finishes.{canManage && role !== 'operator' ? ' You can verify it again once the cause is fixed.' : ''}</p>
								{role === 'operator' && <OperatorDecision invoiceId={invoiceId} />}
							</>
						)}
						{i.status === 3 && (isIssuer
							? <p className="text-[14px] text-ink-2">This invoice is eligible and open for funding by approved investors.</p>
							: relativeDue(i.dueDate).late
								? <p className="text-[14px] text-ink-2">The due date has passed, so this invoice can no longer be funded.</p>
								: <PayPanel invoiceId={invoiceId as `0x${string}`} required={BigInt(i.financingAmount)} kind="fund" requireAllowlist />)}
						{i.status === 4 && <p className="text-[14px] text-ink-2">This invoice was rejected.{isIssuer ? ' Submit a corrected invoice with a new number.' : ''}</p>}
						{i.status === 5 && (
							<div className="space-y-4">
								<p className="text-[14px] text-ink-2">Funded. Repayment of the full invoice amount goes to the current receivable holder{holder ? <> (<AddressLink address={holder} />)</> : ''}.</p>
								{now() > i.dueDate + GRACE_PERIOD_SECONDS && <DefaultButton invoiceId={invoiceId as `0x${string}`} />}
								<PayPanel invoiceId={invoiceId as `0x${string}`} required={BigInt(i.amount)} kind="repay" />
							</div>
						)}
						{i.status === 6 && <p className="text-[14px] text-ink-2">Repaid in full. The receivable holder received {<Amount value={i.amount} />}.</p>}
						{i.status === 7 && <p className="text-[14px] text-ink-2">This invoice was marked defaulted. Repayment is no longer accepted.</p>}
					</Card>
					<Card>
						<h2 className="mb-1 text-[16px] font-semibold">Parties</h2>
						<Dl rows={[
							['Issuer wallet', <AddressLink key="a" address={i.issuerWallet} />],
							['Registration', <TxLink key="b" hash={i.submitTx} />],
							...(position && position.fundedAt ? ([['Original investor', <AddressLink key="c" address={position.originalInvestor} />], ['Receivable holder', holder ? <AddressLink key="h" address={holder} /> : 'Unknown']] as [string, React.ReactNode][]) : []),
						]} />
						<ProvenanceStrip tx={i.submitTx} recordedBy="business wallet" />
					</Card>
					{canManage && (
						<Card>
							<h2 className="mb-1 text-[16px] font-semibold">Document</h2>
							<p className="mb-3 text-[13px] text-ink-3">Only you and the operator can open the file.</p>
							<Button onClick={openDocument}>Open document</Button>
						</Card>
					)}
				</div>
			</div>
		</>
	)
}

function OperatorDecision({ invoiceId }: { invoiceId: string }) {
	const qc = useQueryClient()
	const [reason, setReason] = useState('')
	const [busy, setBusy] = useState(false)
	const [err, setErr] = useState<string | null>(null)
	async function decide(decision: 'APPROVE' | 'REJECT') {
		setBusy(true); setErr(null)
		try {
			await apiJson(`/api/operator/invoices/${invoiceId}/decision`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ decision, reason }) })
			await qc.invalidateQueries({ queryKey: ['invoice', invoiceId] })
		} catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
	}
	return (
		<div className="mt-3 space-y-3">
			<label className="block text-[13px] font-medium">Reason (required, at least 10 characters)
				<textarea className="mt-1 w-full rounded-ctl border border-field bg-card p-3 text-[14px]" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
			</label>
			{err && <InlineNotice tone="error">{err}</InlineNotice>}
			<div className="flex gap-2">
				<Button variant="primary" disabled={busy || reason.trim().length < 10} onClick={() => decide('APPROVE')}>Approve</Button>
				<Button variant="danger" disabled={busy || reason.trim().length < 10} onClick={() => decide('REJECT')}>Reject</Button>
			</div>
		</div>
	)
}
