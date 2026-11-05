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
		createdAt: row.created_at,
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
			}
		: null
