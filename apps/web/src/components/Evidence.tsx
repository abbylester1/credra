'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiJson } from '@/lib/client'
import { VERIFY_ENGINE_NOTE } from '@/lib/hosted'
import { COMPARISONS, text } from '@/lib/verifyText'
import { GradeChip, ProvenanceStrip, VerdictChip } from './ui'

export type Verification = {
	verdict: string
	failedChecks: string[]
	reviewReasons: string[]
	externalReference: string | null
	verificationRef: string
	recordTx: string | null
	simulated: boolean
	recordedBy: string
	createdAt: number
	reportJson: string
	risk?: Risk | null
}

export type Risk = {
	model: string
	simulated: true
	rating: string
	score: number | null
	factors: { key: string; label: string; points: number; detail: string }[]
	note?: string
	minGrade: string
	downgraded: boolean
}

/** Minimum grade an invoice needs to be offered for funding. Set in the backend; shown here briefly. */
export function useMinGrade() {
	return useQuery({ queryKey: ['risk-min'], queryFn: () => apiJson<{ minGrade: string }>('/api/risk'), staleTime: 60_000 })
}

const sign = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0')

/** One line for the grade, with the model breakdown behind a toggle. */
export function RiskBlock({ risk }: { risk: Risk | null | undefined }) {
	const [open, setOpen] = useState(false)
	if (!risk) return null
	const notRated = risk.rating === 'NR'
	return (
		<div className="mt-4 rounded-ctl border border-hair p-3">
			<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
				<GradeChip grade={risk.rating} />
				<span className="text-[14px] text-ink">{notRated ? 'Not rated' : `Risk grade ${risk.rating}`}{risk.score !== null && <span className="num text-ink-3"> {'·'} {risk.score}/100</span>}</span>
				<span className="text-[13px] text-ink-3">Minimum to fund {risk.minGrade.replace('-', '−')}</span>
			</div>
			{risk.downgraded && <p className="mt-2 text-[13px] text-s-review">Below the minimum, so this invoice is held for manual review.</p>}
			{notRated && risk.note && <p className="mt-1 text-[13px] text-ink-3">{risk.note}</p>}
			{!notRated && (
				<>
					<button className="mt-2 text-[13px] text-accent hover:underline" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Hide how it is graded' : 'How it is graded'}</button>
					{open && (
						<div className="animate-popin mt-2">
							<ul className="divide-y divide-hair text-[13px]">
								<li className="flex justify-between py-1.5 text-ink-3"><span>Starting score</span><span className="num">100</span></li>
								{risk.factors.map((f) => (
									<li key={f.key} className="flex items-baseline justify-between gap-3 py-1.5"><span className="text-ink-2">{f.label} <span className="text-ink-3">{'·'} {f.detail}</span></span><span className="num">{sign(f.points)}</span></li>
								))}
							</ul>
							<p className="mt-2 text-[12px] text-ink-3">Indicative grade from a simulated model. It is not a credit rating.</p>
						</div>
					)}
				</>
			)}
		</div>
	)
}

const engineLabel = (reportJson: string) => {
	try { if (JSON.parse(reportJson).engine === 'in-process-rules') return 'In-process rules (hosted build)' } catch {}
	return 'Chainlink CRE workflow (simulation)'
}

const VERIFY_STEPS = [
	'Read the invoice from Whitechain',
	'Ask the external registry (simulated)',
	'Match issuer, buyer, amount, due date and document',
	'Apply the eligibility rules',
	'Risk check and grade',
	'Record the verdict onchain',
]

/** Live progress while verification runs, or the finished checklist from the stored record. */
export function VerifySteps({ running, v }: { running: boolean; v: Verification | null }) {
	const [tick, setTick] = useState(0)
	useEffect(() => {
		if (!running) { setTick(0); return }
		const t = setInterval(() => setTick((x) => Math.min(x + 1, VERIFY_STEPS.length - 1)), 1400)
		return () => clearInterval(t)
	}, [running])

	const failed = new Set(v?.failedChecks ?? [])
	const unreachable = !!v?.reviewReasons.includes('external_api_unavailable')
	const noRecord = !running && !v
	const states: StepState[] = VERIFY_STEPS.map((_, i) => {
		if (running) return i < tick ? 'done' : i === tick ? 'active' : 'idle'
		if (!v) return 'idle'
		if (i === 1) return unreachable ? 'failed' : failed.has('invoice_not_found_in_external_registry') ? 'failed' : 'done'
		if (i === 2) return unreachable || failed.has('invoice_not_found_in_external_registry') ? 'idle' : COMPARISONS.some((c) => failed.has(c.code)) ? 'failed' : 'done'
		if (i === 3) return v.failedChecks.length > 0 ? 'failed' : 'done'
		if (i === 5) return v.recordTx ? 'done' : 'failed'
		return 'done'
	})
	const notes: (React.ReactNode | undefined)[] = VERIFY_STEPS.map((_, i) => {
		if (running || !v) return undefined
		if (i === 4) return v.risk ? (v.risk.rating === 'NR' ? 'Not rated until verification passes' : `Grade ${v.risk.rating}, minimum ${v.risk.minGrade.replace('-', '−')}`) : 'Not run'
		if (i === 3) return v.verdict === 'ELIGIBLE' ? 'Eligible' : v.verdict === 'REJECTED' ? 'Rejected' : 'Needs review'
		return undefined
	})
	if (noRecord) return null
	return (
		<div>
			<StepRail steps={VERIFY_STEPS.map((label, i) => ({ label, state: states[i], note: notes[i] }))} />
			<p className="mt-3 text-[12px] text-ink-3">Engine: {v ? engineLabel(v.reportJson) : 'selected by the server'}. Source data is simulated. The verdict is written by the verifier wallet.</p>
		</div>
	)
}

const Mark = ({ kind }: { kind: 'pass' | 'fail' | 'attn' }) => (
	<span
		aria-hidden
		className={`mt-px w-4 text-center text-[14px] font-semibold ${kind === 'pass' ? 'text-verified' : kind === 'fail' ? 'text-s-reject' : 'text-s-review'}`}
	>
		{kind === 'pass' ? '✓' : kind === 'fail' ? '✕' : '!'}
	</span>
)

function engineNote(reportJson: string): string {
	try {
		if (JSON.parse(reportJson).engine === 'in-process-rules') return VERIFY_ENGINE_NOTE + ' The verdict was recorded onchain by the application\'s verifier wallet, not by the Chainlink network.'
	} catch {}
	return 'The result was produced by the CRE workflow in simulation and recorded onchain by the application\'s verifier wallet. It is not a DON-signed write.'
}

export function EvidencePanel({ v }: { v: Verification | null }) {
	const [open, setOpen] = useState(false)
	const [steps, setSteps] = useState(false)
	const min = useMinGrade()
	if (!v) {
		return (
			<div>
				<h2 className="text-[16px] font-semibold">Verification record</h2>
				<p className="mt-2 text-[14px] text-ink-2">Verification has not run for this invoice yet.</p>
				{min.data && <p className="mt-1 text-[13px] text-ink-3">Minimum grade to fund {min.data.minGrade.replace('-', '−')}</p>}
			</div>
		)
	}
	const failed = new Set(v.failedChecks)
	const attention = v.reviewReasons
	const comparisons = v.verdict === 'ERROR' || (v.verdict === 'MANUAL_REVIEW' && attention.includes('external_api_unavailable')) ? [] : COMPARISONS
	return (
		<div>
			<div className="flex items-center justify-between gap-3">
				<h2 className="text-[16px] font-semibold">Verification record</h2>
				<VerdictChip verdict={v.verdict} />
			</div>
			<ul className="mt-3 divide-y divide-hair">
				{v.failedChecks.map((c) => (
					<li key={c} className="flex gap-2.5 py-2 text-[14px] text-ink-2"><Mark kind="fail" /><span><span className="sr-only">Failed: </span>{text(c)}</span></li>
				))}
				{attention.map((c) => (
					<li key={c} className="flex gap-2.5 py-2 text-[14px] text-ink-2"><Mark kind="attn" /><span><span className="sr-only">Needs attention: </span>{text(c)}</span></li>
				))}
				{comparisons
					.filter((c) => !failed.has(c.code) && !(c.code !== 'invoice_not_found_in_external_registry' && failed.has('invoice_not_found_in_external_registry')))
					.map((c) => (
						<li key={c.code} className="animate-slidein flex gap-2.5 py-2 text-[14px] text-ink-2"><Mark kind="pass" /><span><span className="sr-only">Passed: </span>{c.label}</span></li>
					))}
			</ul>
			<ProvenanceStrip simulated={v.simulated} recordedBy="application verifier wallet" tx={v.recordTx} />
			<RiskBlock risk={v.risk} />
			<button className="mt-3 mr-4 text-[13px] text-accent hover:underline" aria-expanded={steps} onClick={() => setSteps(!steps)}>
				{steps ? 'Hide checks' : 'How it was checked'}
			</button>
			<button className="mt-3 text-[13px] text-accent hover:underline" aria-expanded={open} onClick={() => setOpen(!open)}>
				{open ? 'Hide technical details' : 'Technical details'}
			</button>
			{steps && <div className="animate-popin mt-3"><VerifySteps running={false} v={v} /></div>}
			{open && (
				<div className="mt-2 space-y-2 rounded-ctl bg-inset p-3 font-mono text-[12px] text-ink-2">
					<div>External reference: {v.externalReference ?? 'none'}</div>
					<div className="break-all">Report hash: {v.verificationRef}</div>
					<pre className="overflow-x-auto whitespace-pre-wrap break-all">{(() => { try { return JSON.stringify(JSON.parse(v.reportJson), null, 2) } catch { return v.reportJson } })()}</pre>
					<p className="font-sans text-[12px] text-ink-3">{engineNote(v.reportJson)}</p>
				</div>
			)}
		</div>
	)
}

export type StepState = 'idle' | 'active' | 'done' | 'failed'
export function StepRail({ steps }: { steps: { label: string; state: StepState; note?: React.ReactNode }[] }) {
	return (
		<ol className="space-y-3">
			{steps.map((s, i) => (
				<li key={s.label} className="flex gap-3">
					<span
						className={`flex h-6 w-6 flex-none items-center justify-center rounded-chip text-[12px] font-semibold ${
							s.state === 'done' ? 'bg-verified-soft text-verified' : s.state === 'failed' ? 'bg-s-reject-soft text-s-reject' : s.state === 'active' ? 'bg-pine text-white' : 'bg-inset text-ink-2'
						}`}
					>
						{s.state === 'done' ? '✓' : s.state === 'failed' ? '✕' : s.state === 'active' ? <span aria-hidden className="animate-spin-fast inline-block h-3 w-3 rounded-full border-2 border-white border-t-transparent" /> : i + 1}
					</span>
					<div>
						<div className="text-[14px] font-medium">{s.label}</div>
						{s.note && <div className="text-[12px] text-ink-3">{s.note}</div>}
					</div>
				</li>
			))}
		</ol>
	)
}
