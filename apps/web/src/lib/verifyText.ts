// Plain-language text for verification codes (UI never shows raw codes first).
export const CHECK_TEXT: Record<string, string> = {
	amount_mismatch: 'The amount in the external record differs from the invoice.',
	issuer_mismatch: 'The issuer wallet in the external record differs from the submitting wallet.',
	buyer_mismatch: 'The buyer in the external record differs from the invoice.',
	due_date_mismatch: 'The due date in the external record differs from the invoice.',
	document_hash_mismatch: 'The document fingerprint in the external record differs from the uploaded document.',
	invoice_not_found_in_external_registry: 'No matching invoice was found in the external record.',
	invoice_not_registered_onchain: 'The invoice is not registered onchain.',
	invoice_already_processed_or_financed: 'This invoice was already processed or financed.',
	amount_not_positive: 'The invoice amount must be above zero.',
	financing_amount_invalid: 'The financing amount must be above zero and below the invoice amount.',
	due_date_not_in_future: 'The due date has passed.',
	invalid_amounts: 'The amounts could not be read.',
	external_status_not_valid: 'The external record marks this invoice as not valid.',
}

export const REVIEW_TEXT: Record<string, string> = {
	external_api_unavailable: 'The external record could not be reached, so verification could not complete.',
	invoice_disputed_in_external_registry: 'The external record marks this invoice as disputed.',
	record_failed: 'The result could not be recorded onchain. The status did not change.',
	timeout: 'Verification took too long and was stopped.',
	cli_not_found: 'The verification workflow could not be started.',
	no_result_in_output: 'Verification produced no result.',
	unparsable_output: 'The verification result could not be read.',
	unknown_verdict: 'Verification returned an unknown result.',
	invoice_id_mismatch: 'The verification result was for a different invoice.',
	unexpected_result_shape: 'The verification result was in an unexpected format.',
}

export const text = (code: string) => CHECK_TEXT[code] ?? REVIEW_TEXT[code] ?? code.replaceAll('_', ' ')

/** The six comparisons the workflow makes against the external record. */
export const COMPARISONS: { code: string; label: string }[] = [
	{ code: 'amount_mismatch', label: 'Invoice amount matches the external record' },
	{ code: 'issuer_mismatch', label: 'Issuer wallet matches' },
	{ code: 'buyer_mismatch', label: 'Buyer matches' },
	{ code: 'due_date_mismatch', label: 'Due date matches' },
	{ code: 'document_hash_mismatch', label: 'Document fingerprint matches' },
	{ code: 'invoice_not_found_in_external_registry', label: 'Invoice exists in the external record' },
]
