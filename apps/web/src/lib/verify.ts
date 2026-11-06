import 'server-only'
import type { CreResult } from './creParse'
import { env } from './env'

/** Local and the recorded demo run the real CRE CLI simulation. The hosted demo runs the same rules in-process. */
export async function runVerification(invoiceId: string, invoiceNumber: string): Promise<CreResult> {
	if (env.verifyMode === 'cre') return (await import('./cre')).runCreVerification(invoiceId, invoiceNumber)
	return (await import('./verifyInProcess')).runInProcessVerification(invoiceId, invoiceNumber)
}
