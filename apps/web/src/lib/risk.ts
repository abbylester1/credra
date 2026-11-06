// Credra indicative risk engine. Pure functions, no I/O, so it is unit-testable and importable from scripts.
//
// This is NOT a credit rating. It is a transparent, rules-based score from data Credra already holds, presented on a
// familiar bond-style letter scale. There is no established A/B/C scale for invoice finance, so this one is ours, and
// every point is visible in `factors`. It runs after the verification workflow (CRE simulation or in-process rules) and
// can only make an outcome more cautious: an eligible invoice below the minimum grade goes to manual review, never up.

export const MODEL = 'credra-indicative-v1'
export const GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C'] as const
export type Grade = (typeof GRADES)[number]
export type Rating = Grade | 'NR'
export const DEFAULT_MIN_GRADE: Grade = 'B-'

export type Verdict = 'ELIGIBLE' | 'REJECTED' | 'MANUAL_REVIEW' | 'ERROR'

export type RiskInput = {
	verdict: Verdict
	amount: string // base units (6 decimals)
	financingAmount: string
	dueDate: number // unix seconds
	nowSec: number
	issuerRepaid: number // this issuer's invoices that ended Repaid
	issuerDefaulted: number // ... that ended Defaulted
	buyerShare: number | null // buyer's share of all invoice value on the platform, 0..1; null when too little data
}

export type Factor = { key: string; label: string; points: number; detail: string }
export type RiskAssessment = { model: typeof MODEL; simulated: true; rating: Rating; score: number | null; factors: Factor[]; note?: string }

const DAY = 86_400
const usdt = (base: string) => Number(BigInt(base)) / 1e6

/** Score bands, best first. */
const BANDS: [number, Grade][] = [[95, 'A+'], [90, 'A'], [85, 'A-'], [80, 'B+'], [75, 'B'], [70, 'B-']]
export const gradeFromScore = (score: number): Grade => BANDS.find(([min]) => score >= min)?.[1] ?? 'C'

/** Accepts "B-" or "B−" (typographic minus). Returns null for anything that is not a grade. */
export function parseGrade(s: unknown): Grade | null {
	if (typeof s !== 'string') return null
	const g = s.trim().toUpperCase().replace(/[−–]/g, '-')
	return (GRADES as readonly string[]).includes(g) ? (g as Grade) : null
}

const rank = (g: Grade) => GRADES.indexOf(g)

/** True when `rating` is at or above `min`. Not-rated never meets a minimum. */
export const meetsMinimum = (rating: Rating, min: Grade) => rating !== 'NR' && rank(rating) <= rank(min)

export function assess(i: RiskInput): RiskAssessment {
	if (i.verdict !== 'ELIGIBLE') {
		return { model: MODEL, simulated: true, rating: 'NR', score: null, factors: [], note: 'Not rated until the invoice passes verification.' }
	}
	const factors: Factor[] = []
	const add = (key: string, label: string, points: number, detail: string) => factors.push({ key, label, points, detail })

	// Tenor: longer exposure, more can go wrong.
	const days = Math.max(0, Math.ceil((i.dueDate - i.nowSec) / DAY))
	const tenor = days <= 30 ? 0 : days <= 60 ? -3 : days <= 90 ? -6 : days <= 180 ? -12 : -20
	add('tenor', 'Time to due date', tenor, `${days} days`)

	// Advance rate: a higher advance leaves the investor less cushion.
	const rate = usdt(i.financingAmount) / usdt(i.amount)
	const advance = rate <= 0.8 ? 0 : rate <= 0.9 ? -4 : rate <= 0.95 ? -10 : -18
	add('advance', 'Advance rate', advance, `${Math.round(rate * 1000) / 10}% of invoice value`)

	// Size: bigger tickets concentrate loss.
	const size = usdt(i.amount)
	add('size', 'Invoice size', size <= 10_000 ? 0 : size <= 100_000 ? -3 : -8, `${size.toLocaleString('en-US')} USDT`)

	// Issuer track record on this platform.
	if (i.issuerDefaulted > 0) add('history', 'Issuer history', -Math.min(40, 25 * i.issuerDefaulted), `${i.issuerDefaulted} defaulted`)
	else if (i.issuerRepaid >= 3) add('history', 'Issuer history', 7, `${i.issuerRepaid} repaid, none defaulted`)
	else if (i.issuerRepaid >= 1) add('history', 'Issuer history', 4, `${i.issuerRepaid} repaid, none defaulted`)
	else add('history', 'Issuer history', -4, 'No history yet')

	// Buyer concentration (only when there is enough data to be meaningful).
	if (i.buyerShare !== null) {
		const c = i.buyerShare > 0.5 ? -8 : i.buyerShare > 0.35 ? -4 : 0
		add('concentration', 'Buyer concentration', c, `${Math.round(i.buyerShare * 100)}% of platform volume`)
	}

	const score = Math.max(0, Math.min(100, 100 + factors.reduce((s, f) => s + f.points, 0)))
	return { model: MODEL, simulated: true, rating: gradeFromScore(score), score, factors }
}

/**
 * Minimum-grade policy. Only ever downgrades: an ELIGIBLE invoice that is below the minimum, or that could not be
 * graded, goes to MANUAL_REVIEW. Rejected and review verdicts pass through unchanged. Fail safe, never up.
 */
export function applyMinimum(verdict: Verdict, risk: RiskAssessment | null, min: Grade): { verdict: Verdict; reviewReason: string | null } {
	if (verdict !== 'ELIGIBLE') return { verdict, reviewReason: null }
	if (!risk) return { verdict: 'MANUAL_REVIEW', reviewReason: 'risk_check_unavailable' }
	if (!meetsMinimum(risk.rating, min)) return { verdict: 'MANUAL_REVIEW', reviewReason: 'grade_below_minimum' }
	return { verdict, reviewReason: null }
}
