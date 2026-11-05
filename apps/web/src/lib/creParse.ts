// Pure parsing of `cre workflow simulate` output. Never throws; every failure becomes verdict ERROR.
export type Verdict = 'ELIGIBLE' | 'REJECTED' | 'MANUAL_REVIEW' | 'ERROR'

export type CreResult = {
	verdict: Verdict
	failedChecks: string[]
	reviewReasons: string[]
	externalReference: string | null
	reportJson: string
	errorCode?: string
}

const VERDICTS = new Set(['ELIGIBLE', 'REJECTED', 'MANUAL_REVIEW'])
// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;]*m/g

export const creError = (errorCode: string): CreResult => ({
	verdict: 'ERROR',
	failedChecks: [],
	reviewReasons: [errorCode],
	externalReference: null,
	reportJson: JSON.stringify({ error: errorCode }),
	errorCode,
})

export function parseCreOutput(stdout: string, expectedInvoiceId?: string): CreResult {
	try {
		const clean = stdout.replace(ANSI, '')
		// The result is printed as a JSON string literal on its own line: "{\"invoiceId\":...}"
		const line = clean
			.split('\n')
			.map((l) => l.trim())
			.find((l) => l.startsWith('"{') && l.endsWith('}"'))
		if (!line) return creError('no_result_in_output')
		const inner = JSON.parse(line)
		if (typeof inner !== 'string') return creError('unexpected_result_shape')
		const report = JSON.parse(inner)
		if (!report || typeof report !== 'object') return creError('unexpected_result_shape')
		if (!VERDICTS.has(report.verdict)) return creError('unknown_verdict')
		if (expectedInvoiceId && String(report.invoiceId).toLowerCase() !== expectedInvoiceId.toLowerCase()) {
			return creError('invoice_id_mismatch')
		}
		const arr = (v: unknown) => (Array.isArray(v) ? v.map(String) : [])
		return {
			verdict: report.verdict as Verdict,
			failedChecks: arr(report.failedChecks),
			reviewReasons: arr(report.reviewReasons),
			externalReference: report.externalReference ? String(report.externalReference) : null,
			reportJson: inner,
		}
	} catch {
		return creError('unparsable_output')
	}
}
