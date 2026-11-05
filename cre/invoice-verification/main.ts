import {
	bytesToHex,
	ConsensusAggregationByFields,
	cre,
	encodeCallMsg,
	type HTTPPayload,
	type HTTPSendRequester,
	identical,
	LATEST_BLOCK_NUMBER,
	Runner,
	type Runtime,
} from '@chainlink/cre-sdk'
import { decodeFunctionResult, encodeFunctionData, parseAbi, zeroAddress, type Address, type Hex } from 'viem'
import { z } from 'zod'
import { evaluate, type ExternalRecord, type OnchainInvoice } from './rules'

export const configSchema = z.object({
	/** Whitechain Sepolia = 1874. Not in the official CRE chain registry, so it is declared
	 *  under `experimental-chains` in project.yaml with this selector. */
	chainSelector: z.string(),
	registryAddress: z.string(),
	/** Base URL of the external verification API (simulated ERP / business registry). */
	verifierApiUrl: z.string(),
})
export type Config = z.infer<typeof configSchema>

const registryAbi = parseAbi([
	'function getInvoice(bytes32 invoiceId) view returns ((bytes32 invoiceId, bytes32 documentHash, bytes32 buyerRef, bytes32 verificationRef, address issuer, uint256 amount, uint256 financingAmount, uint64 dueDate, uint8 status))',
])

type Request = { invoiceId: Hex; invoiceNumber: string }

const readOnchainInvoice = (runtime: Runtime<Config>, invoiceId: Hex): OnchainInvoice => {
	const evm = new cre.capabilities.EVMClient(BigInt(runtime.config.chainSelector))
	const data = encodeFunctionData({ abi: registryAbi, functionName: 'getInvoice', args: [invoiceId] })
	const res = evm
		.callContract(runtime, {
			call: encodeCallMsg({ from: zeroAddress, to: runtime.config.registryAddress as Address, data }),
			blockNumber: LATEST_BLOCK_NUMBER,
		})
		.result()
	const inv = decodeFunctionResult({
		abi: registryAbi,
		functionName: 'getInvoice',
		data: bytesToHex(res.data),
	})
	return {
		exists: inv.status !== 0,
		status: Number(inv.status),
		documentHash: inv.documentHash,
		buyerRef: inv.buyerRef,
		issuer: inv.issuer,
		amount: inv.amount.toString(),
		financingAmount: inv.financingAmount.toString(),
		dueDate: Number(inv.dueDate),
	}
}

const EMPTY_EXTERNAL: ExternalRecord = {
	reachable: false,
	found: false,
	issuerWallet: '',
	buyerRef: '',
	amount: '',
	dueDate: 0,
	documentHash: '',
	status: '',
	reference: '',
}

/** Runs on each DON node; results are aggregated by consensus. Never throws: failures
 *  are reported as `reachable: false` so the rules fail safe to MANUAL_REVIEW. */
const fetchExternal = (sendRequester: HTTPSendRequester, baseUrl: string, invoiceNumber: string): ExternalRecord => {
	try {
		const resp = sendRequester
			.sendRequest({ method: 'GET', url: `${baseUrl}/invoices/${encodeURIComponent(invoiceNumber)}` })
			.result()
		if (resp.statusCode === 404) return { ...EMPTY_EXTERNAL, reachable: true, found: false }
		if (resp.statusCode !== 200) return EMPTY_EXTERNAL
		const j = JSON.parse(Buffer.from(resp.body).toString('utf-8'))
		return {
			reachable: true,
			found: true,
			issuerWallet: String(j.issuerWallet),
			buyerRef: String(j.buyerRef),
			amount: String(j.amount),
			dueDate: Number(j.dueDate),
			documentHash: String(j.documentHash),
			status: String(j.status),
			reference: String(j.reference),
		}
	} catch {
		return EMPTY_EXTERNAL
	}
}

const onHttpTrigger = (runtime: Runtime<Config>, payload: HTTPPayload): string => {
	const req = JSON.parse(Buffer.from(payload.input).toString('utf-8')) as Request
	runtime.log(`[verify] request invoiceId=${req.invoiceId} invoiceNumber=${req.invoiceNumber}`)

	// Step 1: read Whitechain state
	const onchain = readOnchainInvoice(runtime, req.invoiceId)
	runtime.log(`[verify] onchain: exists=${onchain.exists} status=${onchain.status} amount=${onchain.amount} due=${onchain.dueDate}`)

	// Step 2: external verification API
	const http = new cre.capabilities.HTTPClient()
	const ext = http
		.sendRequest(
			runtime,
			fetchExternal,
			ConsensusAggregationByFields<ExternalRecord>({
				reachable: identical,
				found: identical,
				issuerWallet: identical,
				buyerRef: identical,
				amount: identical,
				dueDate: identical,
				documentHash: identical,
				status: identical,
				reference: identical,
			}),
		)(runtime.config.verifierApiUrl, req.invoiceNumber)
		.result()
	runtime.log(`[verify] external: reachable=${ext.reachable} found=${ext.found} status=${ext.status} ref=${ext.reference}`)

	// Step 3-4: compare + eligibility rules
	const nowSec = Math.floor(runtime.now().getTime() / 1000)
	const result = evaluate(onchain, ext, nowSec)

	// Step 5: verification report
	const report = {
		invoiceId: req.invoiceId,
		documentHash: onchain.documentHash,
		verdict: result.verdict,
		failedChecks: result.failedChecks,
		reviewReasons: result.reviewReasons,
		externalReference: ext.reference || null,
		timestamp: nowSec,
	}
	runtime.log(`[verify] verdict=${report.verdict} failed=${report.failedChecks.join(',') || '-'}`)
	return JSON.stringify(report)
}

export const initWorkflow = (_config: Config) => {
	const http = new cre.capabilities.HTTPCapability()
	return [cre.handler(http.trigger({}), onHttpTrigger)]
}

export async function main() {
	const runner = await Runner.newRunner<Config>({ configSchema })
	await runner.run(initWorkflow)
}
