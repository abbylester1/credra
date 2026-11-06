import 'server-only'
import { getSetting, buyerShare, issuerHistory, type InvoiceRow } from './repo'
import { applyMinimum, assess, DEFAULT_MIN_GRADE, parseGrade, type Grade, type RiskAssessment, type Verdict } from './risk'

const KEY = 'risk_min_grade'

/** Operator setting first, then RISK_MIN_GRADE, then the default. An unparsable value falls back, never to "no minimum". */
export async function currentMinGrade(): Promise<Grade> {
	return parseGrade(await getSetting(KEY)) ?? parseGrade(process.env.RISK_MIN_GRADE) ?? DEFAULT_MIN_GRADE
}
export const MIN_GRADE_KEY = KEY

export type RiskOutcome = {
	verdict: Verdict
	reviewReasons: string[]
	risk: RiskAssessment | null
	minGrade: Grade
	downgraded: boolean
}

/**
 * Runs after the verification workflow. Grades the invoice, applies the minimum-grade policy, and can only make the
 * outcome more cautious. If the risk check itself fails, an eligible invoice goes to manual review.
 */
export async function runRiskCheck(
	row: InvoiceRow,
	chain: { amount: bigint; financingAmount: bigint; dueDate: bigint },
	verdict: Verdict,
	reviewReasons: string[],
): Promise<RiskOutcome> {
	const minGrade = await currentMinGrade()
	let risk: RiskAssessment | null = null
	try {
		const [hist, share] = await Promise.all([issuerHistory(row.issuer_wallet), buyerShare(row.buyer_ref)])
		risk = assess({
			verdict,
			amount: chain.amount.toString(),
			financingAmount: chain.financingAmount.toString(),
			dueDate: Number(chain.dueDate),
			nowSec: Math.floor(Date.now() / 1000),
			issuerRepaid: hist.repaid,
			issuerDefaulted: hist.defaulted,
			buyerShare: share,
		})
	} catch {
		risk = null
	}
	const gate = applyMinimum(verdict, risk, minGrade)
	return {
		verdict: gate.verdict,
		reviewReasons: gate.reviewReason ? [...reviewReasons, gate.reviewReason] : reviewReasons,
		risk,
		minGrade,
		downgraded: gate.verdict !== verdict,
	}
}
