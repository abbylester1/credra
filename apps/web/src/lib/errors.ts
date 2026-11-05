// Maps contract / ERC-20 / wallet errors to user-facing messages (contracts/onchain.md).
const RULES: [RegExp, string][] = [
	[/DuplicateInvoice|DuplicateDocument/i, 'This invoice or document was already submitted.'],
	[/InvalidTerms/i, 'Invoice terms are invalid: amount must be positive, financing below the invoice amount, due date in the future.'],
	[/NotAllowlisted/i, 'This wallet is not approved as an investor.'],
	[/NotEligible/i, 'This invoice is no longer available for funding.'],
	[/NotFunded/i, 'This invoice is not awaiting repayment.'],
	[/NotYetDefaulted/i, 'The grace period has not ended yet.'],
	[/ERC20InsufficientAllowance|allowance/i, 'USDT allowance is too low. Approve the amount first.'],
	[/ERC20InsufficientBalance|insufficient (funds|balance)/i, 'Not enough USDT (or WBT for gas) in this wallet.'],
	[/User rejected|User denied|rejected the request/i, 'Transaction cancelled in the wallet. Nothing was changed.'],
	[/chain|network/i, 'Wrong network. Switch your wallet to Whitechain Sepolia (1874).'],
]

export function friendlyError(err: unknown): string {
	const text = err instanceof Error ? `${err.name} ${err.message}` : String(err)
	for (const [re, msg] of RULES) if (re.test(text)) return msg
	return 'Something went wrong. Please try again.'
}
