'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAccount, usePublicClient, useWriteContract } from 'wagmi'
import { StepRail, type StepState } from '@/components/Evidence'
import { SignInGate } from '@/components/SignInGate'
import { Amount, Button, Card, Field, inputCls, InlineNotice, PageHeader, SimulatedTag, TxLink } from '@/components/ui'
import { registryAbi } from '@/lib/abi'
import { apiJson, useWalletHeaders } from '@/lib/client'
import { ADDRESSES } from '@/lib/config'
import { friendlyError } from '@/lib/errors'
import { buyerRef, documentHash, invoiceId } from '@/lib/hash'
import { parseUsdt } from '@/lib/money'

type Steps = { register: StepState; save: StepState; verify: StepState }
const SCENARIOS = [
	['match', 'Matches the invoice'],
	['amount_mismatch', 'Amount differs'],
	['disputed', 'Marked disputed'],
	['absent', 'Not found'],
	['none', 'Leave unchanged'],
] as const

function Form({ headers }: { headers: Record<string, string> }) {
	const router = useRouter()
	const { address } = useAccount()
	const publicClient = usePublicClient()
	const { writeContractAsync } = useWriteContract()
	const getHeaders = useWalletHeaders()

	const [f, setF] = useState({ number: '', issuer: '', buyer: '', currency: 'USD', amount: '', financing: '', invoiceDate: new Date().toISOString().slice(0, 10), dueDate: '' })
	const [file, setFile] = useState<File | null>(null)
	const [hash, setHash] = useState<string | null>(null)
	const [scenario, setScenario] = useState<(typeof SCENARIOS)[number][0]>('match')
	const [err, setErr] = useState<string | null>(null)
	const [busy, setBusy] = useState(false)
	const [steps, setSteps] = useState<Steps>({ register: 'idle', save: 'idle', verify: 'idle' })
	const [tx, setTx] = useState<string | null>(null)
	const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })

	let amountBase: bigint | null = null
	let financingBase: bigint | null = null
	try { amountBase = f.amount ? parseUsdt(f.amount) : null } catch {}
	try { financingBase = f.financing ? parseUsdt(f.financing) : null } catch {}
	const termsOk = amountBase !== null && financingBase !== null && amountBase > 0n && financingBase > 0n && financingBase < amountBase
	const advance = termsOk && amountBase && financingBase ? Number((financingBase * 100n) / amountBase) : null
	const dueTs = f.dueDate ? Math.floor(new Date(`${f.dueDate}T23:59:59Z`).getTime() / 1000) : 0
	const ready = !!(f.number && f.issuer && f.buyer && file && termsOk && dueTs > Date.now() / 1000)
	const reason = !f.number || !f.issuer || !f.buyer ? 'Fill in the invoice details.' : !file ? 'Attach the invoice document.' : !termsOk ? 'Financing must be above zero and below the invoice amount.' : dueTs <= Date.now() / 1000 ? 'The due date must be in the future.' : ''

	/** Fills the form with unique demo values and attaches a generated PNG invoice, so the whole flow can be tried in a minute. */
	async function useSample() {
		const stamp = Date.now().toString(36).slice(-6).toUpperCase()
		const number = `INV-${stamp}`
		const due = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10)
		const vals = { number, issuer: 'Demo Exports Ltd', buyer: 'Acme Corp', currency: 'USD', amount: '20', financing: '18', invoiceDate: new Date().toISOString().slice(0, 10), dueDate: due }
		setF(vals)
		const c = document.createElement('canvas'); c.width = 800; c.height = 1000
		const g = c.getContext('2d')!
		g.fillStyle = '#fff'; g.fillRect(0, 0, 800, 1000)
		g.fillStyle = '#0F1A16'; g.font = '600 40px sans-serif'; g.fillText('INVOICE', 60, 100)
		g.font = '16px monospace'; g.fillStyle = '#5C6B63'; g.fillText('Sample document for the Credra testnet demo', 60, 130)
		g.fillStyle = '#0F1A16'; g.font = '20px monospace'
		;[['Invoice no.', number], ['Issued', vals.invoiceDate], ['Due', due], ['From', vals.issuer], ['Bill to', vals.buyer], ['Description', 'Export services, March batch'], ['Amount due', `${vals.amount}.00 USDT`]].forEach(([k, v], i) => {
			g.fillStyle = '#5C6B63'; g.fillText(k, 60, 220 + i * 52); g.fillStyle = '#0F1A16'; g.fillText(v, 280, 220 + i * 52)
		})
		g.strokeStyle = '#DCE2DD'; g.strokeRect(40, 180, 720, 400)
		g.fillStyle = '#8F5200'; g.font = '14px monospace'; g.fillText('Illustrative data. Not a real invoice.', 60, 640)
		const blob: Blob = await new Promise((r) => c.toBlob((b) => r(b!), 'image/png'))
		const file = new File([blob], `${number}.png`, { type: 'image/png' })
		setFile(file)
		setHash(documentHash(new Uint8Array(await file.arrayBuffer())))
	}

	async function pick(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0] ?? null
		setFile(file)
		setHash(file ? documentHash(new Uint8Array(await file.arrayBuffer())) : null)
	}

	async function submit() {
		if (!ready || !file || !amountBase || !financingBase || !address || !publicClient) return
		setErr(null); setBusy(true); setTx(null)
		setSteps({ register: 'active', save: 'idle', verify: 'idle' })
		const id = invoiceId(f.number)
		try {
			const bytes = new Uint8Array(await file.arrayBuffer())
			const args = [id, documentHash(bytes), buyerRef(f.buyer), amountBase, financingBase, BigInt(dueTs)] as const
			await publicClient.simulateContract({ address: ADDRESSES.registry, abi: registryAbi, functionName: 'submitInvoice', args, account: address })
			const h = await writeContractAsync({ address: ADDRESSES.registry, abi: registryAbi, functionName: 'submitInvoice', args })
			setTx(h)
			const receipt = await publicClient.waitForTransactionReceipt({ hash: h, timeout: 90_000 })
			if (receipt.status !== 'success') throw new Error('Registration failed onchain.')
			setSteps({ register: 'done', save: 'active', verify: 'idle' })

			const auth = await getHeaders()
			const fd = new FormData()
			fd.set('invoiceNumber', f.number); fd.set('issuerName', f.issuer); fd.set('buyerName', f.buyer); fd.set('currency', f.currency)
			fd.set('amount', amountBase.toString()); fd.set('financingAmount', financingBase.toString())
			fd.set('invoiceDate', String(Math.floor(new Date(f.invoiceDate).getTime() / 1000))); fd.set('dueDate', String(dueTs))
			fd.set('submitTx', h); fd.set('file', file)
			await apiJson('/api/invoices', { method: 'POST', headers: auth, body: fd })
			setSteps({ register: 'done', save: 'done', verify: 'active' })

			if (scenario !== 'none') {
				await apiJson('/api/operator/simulated-erp', { method: 'POST', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify({ invoiceNumber: f.number, scenario }) })
			}
			await apiJson(`/api/invoices/${id}/verify`, { method: 'POST', headers: auth })
			setSteps({ register: 'done', save: 'done', verify: 'done' })
			router.push(`/app/invoices/${id}`)
		} catch (e) {
			const msg = (e as { code?: string }).code ? (e as Error).message : friendlyError(e)
			setErr(`${msg} ${steps.register === 'active' ? 'Nothing was registered.' : 'You can open the invoice and retry verification.'}`)
			setSteps((s) => ({ register: s.register === 'active' ? 'failed' : s.register, save: s.save === 'active' ? 'failed' : s.save, verify: s.verify === 'active' ? 'failed' : s.verify }))
			setBusy(false)
		}
	}

	return (
		<div className="grid gap-6 lg:grid-cols-[minmax(0,720px)_minmax(0,1fr)]">
			<Card>
				<form onSubmit={(e) => { e.preventDefault(); void submit() }} className="space-y-8">
					<fieldset className="space-y-4" disabled={busy}>
						<legend className="mb-1 flex w-full items-center justify-between text-[16px] font-semibold">Invoice
							<button type="button" onClick={() => void useSample()} className="rounded-ctl border border-hair bg-inset px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-hair">Use sample invoice</button>
						</legend>
						<div className="grid gap-4 sm:grid-cols-2">
							<Field label="Invoice number" hint="Letters, numbers, dots, dashes."><input className={inputCls} value={f.number} onChange={set('number')} placeholder="INV-1001" required /></Field>
							<Field label="Currency of the invoice"><input className={inputCls} value={f.currency} onChange={set('currency')} maxLength={3} /></Field>
							<Field label="Invoice date"><input type="date" className={inputCls} value={f.invoiceDate} onChange={set('invoiceDate')} /></Field>
							<Field label="Due date"><input type="date" className={inputCls} value={f.dueDate} onChange={set('dueDate')} min={new Date().toISOString().slice(0, 10)} required /></Field>
						</div>
					</fieldset>
					<fieldset className="space-y-4" disabled={busy}>
						<legend className="mb-1 text-[16px] font-semibold">Parties</legend>
						<div className="grid gap-4 sm:grid-cols-2">
							<Field label="Issuer (your business)"><input className={inputCls} value={f.issuer} onChange={set('issuer')} placeholder="Demo Exports Ltd" required /></Field>
							<Field label="Buyer"><input className={inputCls} value={f.buyer} onChange={set('buyer')} placeholder="Acme Corp" required /></Field>
						</div>
					</fieldset>
					<fieldset className="space-y-4" disabled={busy}>
						<legend className="mb-1 text-[16px] font-semibold">Amounts in USDT</legend>
						<div className="grid gap-4 sm:grid-cols-2">
							<Field label="Invoice amount" error={f.amount && amountBase === null ? 'Use up to 6 decimals.' : undefined}><input inputMode="decimal" className={`${inputCls} num`} value={f.amount} onChange={set('amount')} placeholder="10000" required /></Field>
							<Field label="Requested financing" hint={advance !== null ? `${advance}% advance` : 'Typically 80 to 95 percent of the invoice.'} error={f.financing && financingBase !== null && amountBase !== null && financingBase >= amountBase ? 'Must be below the invoice amount.' : undefined}><input inputMode="decimal" className={`${inputCls} num`} value={f.financing} onChange={set('financing')} placeholder="9000" required /></Field>
						</div>
						{termsOk && amountBase && financingBase && (
							<p className="text-[14px] text-ink-2">Investor return: <Amount value={amountBase - financingBase} tone="accent" /> <span className="mx-2 text-ink-3">·</span>Platform fee: <Amount value={0n} /></p>
						)}
					</fieldset>
					<fieldset className="space-y-3" disabled={busy}>
						<legend className="mb-1 text-[16px] font-semibold">Document</legend>
						<input aria-label="Invoice document" type="file" accept="application/pdf,image/png,image/jpeg" onChange={pick} className="block w-full rounded-ctl border border-dashed border-field bg-card p-3 text-[14px]" />
						{file && hash && (
							<div className="rounded-ctl bg-inset p-3 text-[12px] text-ink-2"><div>{file.name} ({Math.round(file.size / 1024)} KB)</div><div className="num mt-1 break-all">Fingerprint {hash}</div></div>
						)}
						<p className="text-[12px] text-ink-3">PDF, PNG or JPG up to 10 MB. Only the fingerprint goes onchain. The file stays private.</p>
					</fieldset>
					<fieldset className="space-y-3 rounded-card border border-dashed border-s-review p-4" disabled={busy}>
						<legend className="px-1"><SimulatedTag>Demo tools</SimulatedTag></legend>
						<Field label="Simulated external record" hint="Credra verifies against an external record. In this demo that record is simulated. Choose what it contains."><select className={inputCls} value={scenario} onChange={(e) => setScenario(e.target.value as typeof scenario)}>{SCENARIOS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
					</fieldset>
					{err && <InlineNotice tone="error">{err}</InlineNotice>}
					<div>
						<Button type="submit" variant="primary" disabled={!ready} loading={busy}>{busy ? 'Working' : 'Submit invoice'}</Button>
						{!ready && !busy && reason && <p className="mt-2 text-[12px] text-ink-3">{reason}</p>}
					</div>
				</form>
			</Card>
			<div className="space-y-4">
				<Card>
					<h2 className="mb-3 text-[16px] font-semibold">What happens next</h2>
					<StepRail steps={[
						{ label: 'Register on Whitechain', state: steps.register, note: tx ? <TxLink hash={tx} /> : 'Your wallet signs one transaction.' },
						{ label: 'Save the invoice record', state: steps.save, note: 'The document stays private to you and the operator.' },
						{ label: 'Verify', state: steps.verify, note: 'The CRE workflow checks the invoice against the external record.' },
					]} />
				</Card>
			</div>
		</div>
	)
}

export default function NewInvoicePage() {
	return (
		<>
			<PageHeader title="Submit invoice" description="Register it, attach the document, get it verified." />
			<SignInGate>{(h) => <Form headers={h} />}</SignInGate>
		</>
	)
}
