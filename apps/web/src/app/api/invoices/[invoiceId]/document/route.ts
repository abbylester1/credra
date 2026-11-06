import { fail, isBytes32 } from '@/lib/api'
import { getDocumentRow, getInvoiceRow } from '@/lib/repo'
import { isOperator } from '@/lib/session'
import { verifyWalletHeaders } from '@/lib/walletAuth'

export const dynamic = 'force-dynamic'

/** FR-019: only the issuer (wallet signature) or the operator may read the document. */
export async function GET(req: Request, ctx: { params: Promise<{ invoiceId: string }> }) {
	const { invoiceId } = await ctx.params
	if (!isBytes32(invoiceId)) return fail(400, 'bad_id', 'Invalid invoice id.')
	const row = await getInvoiceRow(invoiceId)
	const doc = await getDocumentRow(invoiceId)
	if (!row || !doc) return fail(404, 'not_found', 'Document not found.')

	const wallet = await verifyWalletHeaders(req.headers)
	if (!(await isOperator()) && wallet !== row.issuer_wallet) {
		return fail(403, 'forbidden', 'Only the issuer or the operator can open this document.')
	}
	// Documents live in the database. Rows from before that change only have a file path (local development).
	let bytes: Uint8Array | null = doc.content ? new Uint8Array(doc.content) : null
	if (!bytes && doc.storage_path) {
		try {
			bytes = await (await import('node:fs/promises')).readFile(doc.storage_path)
		} catch {
			bytes = null
		}
	}
	if (!bytes) return fail(404, 'not_found', 'The document file is not available.')
	return new Response(bytes as unknown as BodyInit, { headers: { 'content-type': doc.mime_type, 'content-disposition': `inline; filename="${row.invoice_number}"`, 'cache-control': 'private, no-store' } })
}
