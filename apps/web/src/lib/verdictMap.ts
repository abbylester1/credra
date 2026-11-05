import { Status } from './status'
import type { Verdict } from './creParse'

/**
 * Constitution II: only a successfully parsed ELIGIBLE verdict can produce Eligible.
 * Everything else, including ERROR and any unknown value, maps to a non-eligible status.
 */
export function verdictToStatus(verdict: Verdict | string): number {
	switch (verdict) {
		case 'ELIGIBLE':
			return Status.Eligible
		case 'REJECTED':
			return Status.Rejected
		default:
			return Status.UnderReview // MANUAL_REVIEW, ERROR, unknown
	}
}
