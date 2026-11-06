'use client'

import { useState } from 'react'
import { COMPARISONS, text } from '@/lib/verifyText'
import { ProvenanceStrip, VerdictChip } from './ui'

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
}

const Mark = ({ kind }: { kind: 'pass' | 'fail' | 'attn' }) => (
	<span
		aria-hidden
		className={`mt-px w-4 text-center text-[14px] font-semibold ${kind === 'pass' ? 'text-accent' : kind === 'fail' ? 'text-s-reject' : 'text-s-review'}`}
	>
		{kind === 'pass' ? '✓' : kind === 'fail' ? '✕' : '!'}
	</span>
)

export function EvidencePanel({ v }: { v: Verification | null }) {
	const [open, setOpen] = useState(false)
	if (!v) {
		return (
			<div>
				<h2 className="text-[16px] font-semibold">Verification record</h2>
				<p className="mt-2 text-[14px] text-ink-2">Verification has not run for this invoice yet.</p>
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
			<button className="mt-3 text-[13px] text-accent hover:underline" aria-expanded={open} onClick={() => setOpen(!open)}>
				{open ? 'Hide technical details' : 'Technical details'}
			</button>
			{open && (
				<div className="mt-2 space-y-2 rounded-ctl bg-inset p-3 font-mono text-[12px] text-ink-2">
					<div>External reference: {v.externalReference ?? 'none'}</div>
					<div className="break-all">Report hash: {v.verificationRef}</div>
					<pre className="overflow-x-auto whitespace-pre-wrap break-all">{(() => { try { return JSON.stringify(JSON.parse(v.reportJson), null, 2) } catch { return v.reportJson } })()}</pre>
					<p className="font-sans text-[12px] text-ink-3">The result was produced by the CRE workflow in simulation and recorded onchain by the application's verifier wallet. It is not a DON-signed write.</p>
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
							s.state === 'done' ? 'bg-accent-soft text-accent' : s.state === 'failed' ? 'bg-s-reject-soft text-s-reject' : s.state === 'active' ? 'bg-pine text-white' : 'bg-inset text-ink-2'
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
