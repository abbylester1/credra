// Mirrors InvoiceRegistry.Status
export const Status = {
	None: 0,
	Submitted: 1,
	UnderReview: 2,
	Eligible: 3,
	Rejected: 4,
	Funded: 5,
	Repaid: 6,
	Defaulted: 7,
} as const
export type StatusCode = (typeof Status)[keyof typeof Status]

export const STATUS_LABEL: Record<number, string> = {
	0: 'Not registered',
	1: 'Submitted',
	2: 'Under review',
	3: 'Eligible',
	4: 'Rejected',
	5: 'Funded',
	6: 'Repaid',
	7: 'Defaulted',
}

/** Allowed transitions enforced by the contracts. Rejected, Repaid, Defaulted are terminal. */
export const TRANSITIONS: Record<number, number[]> = {
	0: [Status.Submitted],
	1: [Status.UnderReview, Status.Eligible, Status.Rejected],
	2: [Status.UnderReview, Status.Eligible, Status.Rejected],
	3: [Status.Funded],
	4: [],
	5: [Status.Repaid, Status.Defaulted],
	6: [],
	7: [],
}

export const canVerify = (s: number) => s === Status.Submitted || s === Status.UnderReview
export const statusLabel = (s: number) => STATUS_LABEL[s] ?? 'Unknown'
