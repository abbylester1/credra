import 'server-only'
import type { OnchainInvoice } from './chain'
import type { InvoiceRow, RunRow } from './repo'

export function summarize(row: InvoiceRow, chain: OnchainInvoice, run?: RunRow) {
	return {
		invoiceId: row.invoice_id,
		invoiceNumber: row.invoice_number,
		issuerName: row.issuer_name,
		issuerWallet: chain.issuer,
		buyerName: row.buyer_name,
		currency: row.currency,
		amount: chain.amount.toString(),
		financingAmount: chain.financingAmount.toString(),
		dueDate: Number(chain.dueDate),
		invoiceDate: row.invoice_date,
		status: chain.status, // from the chain
		documentHash: chain.documentHash,
		submitTx: row.submit_tx,
		verdict: run?.verdict ?? null,
		grade: run?.risk_grade ?? null,
		createdAt: row.created_at,
	}
}

function parseRisk(json: string | null) {
	if (!json) return null
	try {
		return JSON.parse(json) as { model: string; simulated: true; rating: string; score: number | null; factors: { key: string; label: string; points: number; detail: string }[]; note?: string; minGrade: string; downgraded: boolean }
	} catch {
		return null
	}
}

export const parseRun = (run?: RunRow) =>
	run
		? {
				verdict: run.verdict,
				failedChecks: JSON.parse(run.failed_checks) as string[],
				reviewReasons: JSON.parse(run.review_reasons) as string[],
				externalReference: run.external_reference,
				verificationRef: run.verification_ref,
				recordTx: run.record_tx,
				simulated: run.source_simulated === 1,
				recordedBy: 'application-verifier-wallet',
				createdAt: run.created_at,
				reportJson: run.report_json,
				risk: parseRisk(run.risk_json),
			}
		: null
