import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import { fail, json } from '@/lib/api'
import { readInvoice } from '@/lib/chain'
import { env } from '@/lib/env'
import { buyerRef, documentHash, invoiceId as makeInvoiceId } from '@/lib/hash'
import { isOperator } from '@/lib/session'
import { findByNumberOrHash, getInvoiceRow, insertDocument, insertEvent, insertInvoice, latestRun, listInvoiceRows } from '@/lib/repo'
import { Status } from '@/lib/status'
import { summarize } from '@/lib/summary'
import { verifyWalletHeaders } from '@/lib/walletAuth'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED: Record<string, string> = { 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg' }

const form = z.object({
	invoiceNumber: z.string().min(1).max(64).regex(/^[A-Za-z0-9._\-/]+$/),
	issuerName: z.string().min(1).max(120),
	buyerName: z.string().min(1).max(120),
	currency: z.string().regex(/^[A-Za-z]{3}$/),
	amount: z.string().regex(/^\d+$/),
	financingAmount: z.string().regex(/^\d+$/),
	invoiceDate: z.coerce.number().int().positive(),
	dueDate: z.coerce.number().int().positive(),
	submitTx: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
})

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Registers off-chain data AFTER the business wallet sent submitInvoice onchain. */
export async function POST(req: Request) {
	const wallet = await verifyWalletHeaders(req.headers)
	if (!wallet) return fail(401, 'wallet_auth_required', 'Sign in with your wallet to submit an invoice.')

	let fd: FormData
	try {
		fd = await req.formData()
	} catch {
		return fail(400, 'bad_form', 'The submission could not be read.')
	}
	const parsed = form.safeParse(Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === 'string')))
	if (!parsed.success) return fail(400, 'invalid_fields', 'Some invoice fields are missing or invalid.')
	const f = parsed.data

	const file = fd.get('file')
	if (!(file instanceof File)) return fail(400, 'file_required', 'Attach the invoice document.')
	const ext = ALLOWED[file.type]
	if (!ext) return fail(400, 'file_type', 'Only PDF, PNG or JPG documents are accepted.')
	if (file.size > MAX_BYTES || file.size === 0) return fail(400, 'file_size', 'The document must be under 10 MB.')

	const amount = BigInt(f.amount)
	const financing = BigInt(f.financingAmount)
	if (amount <= 0n || financing <= 0n || financing >= amount) return fail(400, 'invalid_terms', 'Financing must be above zero and below the invoice amount.')
	if (f.dueDate <= Math.floor(Date.now() / 1000)) return fail(400, 'invalid_terms', 'The due date must be in the future.')

	const bytes = new Uint8Array(await file.arrayBuffer())
	const hash = documentHash(bytes)
	const id = makeInvoiceId(f.invoiceNumber)

	if (findByNumberOrHash(f.invoiceNumber, hash) || getInvoiceRow(id)) {
		return fail(409, 'duplicate_invoice', 'This invoice number or document was already submitted.')
	}

	// The chain is the source of truth: the invoice must already exist and match what was submitted.
	let chain = await readInvoice(id)
	for (let i = 0; i < 4 && chain.status === Status.None; i++) {
		await sleep(2000)
		chain = await readInvoice(id)
	}
	if (chain.status === Status.None) return fail(409, 'not_onchain', 'The onchain registration was not found yet. Wait a moment and retry.')
	if (chain.issuer.toLowerCase() !== wallet) return fail(403, 'not_issuer', 'This wallet did not register the invoice.')
	if (chain.documentHash.toLowerCase() !== hash.toLowerCase()) return fail(400, 'hash_mismatch', 'The document does not match the fingerprint registered onchain.')
	if (chain.amount !== amount || chain.financingAmount !== financing || Number(chain.dueDate) !== f.dueDate) {
		return fail(400, 'terms_mismatch', 'The amounts or due date differ from the onchain registration.')
	}

	await mkdir(env.uploadsDir, { recursive: true })
	const storagePath = path.join(/*turbopackIgnore: true*/ env.uploadsDir, `${hash}.${ext}`)
	await writeFile(storagePath, bytes)

	insertInvoice({
		invoice_id: id.toLowerCase(),
		invoice_number: f.invoiceNumber,
		issuer_wallet: wallet,
		issuer_name: f.issuerName,
		buyer_name: f.buyerName,
		buyer_ref: buyerRef(f.buyerName),
		currency: f.currency.toUpperCase(),
		amount: f.amount,
		financing_amount: f.financingAmount,
		invoice_date: f.invoiceDate,
		due_date: f.dueDate,
		document_hash: hash.toLowerCase(),
		submit_tx: f.submitTx,
	})
	insertDocument({ invoice_id: id.toLowerCase(), storage_path: storagePath, document_hash: hash.toLowerCase(), mime_type: file.type, size_bytes: file.size })
	insertEvent({ invoice_id: id, status: 'Submitted', tx_hash: f.submitTx, source: 'submit', actor: 'business wallet' })

	return json({ invoiceId: id.toLowerCase(), status: 'Submitted' }, 201)
}

/** scope=mine (wallet auth) | marketplace (Eligible only, public) | all (operator). */
export async function GET(req: Request) {
	const scope = new URL(req.url).searchParams.get('scope') ?? 'marketplace'
	let rows
	if (scope === 'mine') {
		const wallet = await verifyWalletHeaders(req.headers)
		if (!wallet) return fail(401, 'wallet_auth_required', 'Sign in with your wallet to see your invoices.')
		rows = listInvoiceRows(wallet)
	} else if (scope === 'all') {
		if (!(await isOperator())) return fail(403, 'operator_only', 'Operator access required.')
		rows = listInvoiceRows()
	} else {
		rows = listInvoiceRows()
	}
	const items = await Promise.all(
		rows.map(async (row) => {
			try {
				const chain = await readInvoice(row.invoice_id as `0x${string}`)
				return summarize(row, chain, latestRun(row.invoice_id))
			} catch {
				return null // transient RPC failure: omit rather than show a wrong status
			}
		}),
	)
	const list = items.filter((x): x is NonNullable<typeof x> => x !== null)
	return json(scope === 'marketplace' ? list.filter((i) => i.status === Status.Eligible) : list)
}
