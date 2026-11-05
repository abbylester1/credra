// Balance and allowance checks in base units (integers only). Used by the fund and repay panels.
export type Shortfall = {
	missingBalance: bigint // 0n when the wallet holds enough
	needsApproval: boolean // true when allowance is below the required amount
	ready: boolean // enough balance and enough allowance
}

export function computeShortfall(p: { balance: bigint; allowance: bigint; required: bigint }): Shortfall {
	const missingBalance = p.balance >= p.required ? 0n : p.required - p.balance
	const needsApproval = p.allowance < p.required
	return { missingBalance, needsApproval, ready: missingBalance === 0n && !needsApproval }
}
