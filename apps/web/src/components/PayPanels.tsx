'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useAccount, usePublicClient, useReadContract, useWriteContract } from 'wagmi'
import { useWalletChainId } from '@/lib/useWalletChain'
import { allowlistAbi, erc20Abi, financeAbi } from '@/lib/abi'
import { apiJson } from '@/lib/client'
import { ADDRESSES, CHAIN_ID } from '@/lib/config'
import { friendlyError } from '@/lib/errors'
import { computeShortfall } from '@/lib/shortfall'
import { Amount, Button, InlineNotice, TxLink } from './ui'
import { StepRail, type StepState } from './Evidence'

type Kind = 'fund' | 'repay'
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Approve USDT, then fund or repay. Each step is separate and reports failures without changing the invoice. */
export function PayPanel({ invoiceId, required, kind, requireAllowlist }: { invoiceId: `0x${string}`; required: bigint; kind: Kind; requireAllowlist?: boolean }) {
	const { address, isConnected } = useAccount()
	const chainId = useWalletChainId()
	const publicClient = usePublicClient()
	const { writeContractAsync } = useWriteContract()
	const qc = useQueryClient()

	const [approve, setApprove] = useState<StepState>('idle')
	const [act, setAct] = useState<StepState>('idle')
	const [approveTx, setApproveTx] = useState<string | null>(null)
	const [actTx, setActTx] = useState<string | null>(null)
	const [err, setErr] = useState<string | null>(null)
	const [done, setDone] = useState(false)

	const enabled = !!address
	const balance = useReadContract({ address: ADDRESSES.usdt, abi: erc20Abi, functionName: 'balanceOf', args: address ? [address] : undefined, query: { enabled, refetchInterval: 10_000 } })
	const allowance = useReadContract({ address: ADDRESSES.usdt, abi: erc20Abi, functionName: 'allowance', args: address ? [address, ADDRESSES.finance] : undefined, query: { enabled, refetchInterval: 10_000 } })
	const allowed = useReadContract({ address: ADDRESSES.allowlist, abi: allowlistAbi, functionName: 'isAllowed', args: address ? [address] : undefined, query: { enabled: enabled && !!requireAllowlist } })

	const verb = kind === 'fund' ? 'Fund' : 'Repay'
	const loading = balance.isLoading || allowance.isLoading || (requireAllowlist && allowed.isLoading)
	const sf = computeShortfall({ balance: balance.data ?? 0n, allowance: allowance.data ?? 0n, required })

	let blocked: string | null = null
	if (!isConnected) blocked = 'Connect your wallet to continue.'
	else if (chainId !== CHAIN_ID) blocked = 'Wrong network. Switch to Whitechain Sepolia using the banner above.'
	else if (requireAllowlist && allowed.data === false) blocked = 'This wallet is not approved to fund. Ask the operator to approve it.'
	else if (!loading && sf.missingBalance > 0n) blocked = 'shortfall'

	async function runApprove() {
		if (!publicClient || !address) return
		setErr(null); setApprove('active')
		try {
			const h = await writeContractAsync({ address: ADDRESSES.usdt, abi: erc20Abi, functionName: 'approve', args: [ADDRESSES.finance, required] })
			setApproveTx(h)
			const r = await publicClient.waitForTransactionReceipt({ hash: h, timeout: 90_000 })
			if (r.status !== 'success') throw new Error('The approval did not succeed.')
			await allowance.refetch()
			setApprove('done')
		} catch (e) {
			setApprove('failed'); setErr(`${friendlyError(e)} Nothing was changed.`)
		}
	}

	async function runAct() {
		if (!publicClient || !address) return
		setErr(null); setAct('active')
		try {
			await publicClient.simulateContract({ address: ADDRESSES.finance, abi: financeAbi, functionName: kind, args: [invoiceId], account: address })
			const h = await writeContractAsync({ address: ADDRESSES.finance, abi: financeAbi, functionName: kind, args: [invoiceId] })
			setActTx(h)
			const r = await publicClient.waitForTransactionReceipt({ hash: h, timeout: 90_000 })
			if (r.status !== 'success') throw new Error('The transaction did not succeed.')
			setAct('done')
			for (let i = 0; i < 4; i++) {
				try { await apiJson(`/api/invoices/${invoiceId}/sync`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ txHash: h, kind }) }); break }
				catch { await sleep(3000) }
			}
			setDone(true)
			await Promise.all([qc.invalidateQueries({ queryKey: ['invoice', invoiceId] }), qc.invalidateQueries({ queryKey: ['invoices'] }), qc.invalidateQueries({ queryKey: ['positions'] })])
		} catch (e) {
			setAct('failed'); setErr(`${friendlyError(e)} Nothing was changed.`)
		}
	}

	if (done) {
		return <InlineNotice tone="ok">{kind === 'fund' ? 'Funded. The financing amount was paid to the business and you now hold the receivable.' : 'Repaid. The full invoice amount was paid to the receivable holder.'}{actTx && <> <TxLink hash={actTx} /></>}</InlineNotice>
	}

	const needsApprove = sf.needsApproval && approve !== 'done'
	const approveState: StepState = !needsApprove && approve === 'idle' ? 'done' : approve
	const actState: StepState = act
	const primaryDisabled = !!blocked || loading || approve === 'active' || act === 'active'

	return (
		<div className="space-y-4">
			<div>
				<div className="text-[13px] text-ink-3">{kind === 'fund' ? 'You pay' : 'You repay'}</div>
				<Amount value={required} figure />
				{balance.data !== undefined && <div className="mt-1 text-[12px] text-ink-3">Your balance: <Amount value={balance.data} /></div>}
			</div>
			<StepRail steps={[
				{ label: 'Approve USDT', state: approveState, note: approveTx ? <TxLink hash={approveTx} /> : needsApprove ? 'Lets the contract move this amount.' : 'Already approved.' },
				{ label: `${verb} invoice`, state: actState, note: actTx ? <TxLink hash={actTx} /> : approveState === 'done' ? 'Confirm in your wallet.' : 'Unlocks after approval.' },
			]} />
			{blocked === 'shortfall' && <InlineNotice tone="error">You need <Amount value={required} tone="danger" />. You are short by <Amount value={sf.missingBalance} tone="danger" />.</InlineNotice>}
			{blocked && blocked !== 'shortfall' && <InlineNotice tone="warn">{blocked}</InlineNotice>}
			{err && <InlineNotice tone="error">{err}</InlineNotice>}
			{needsApprove ? (
				<Button variant="primary" className="w-full" disabled={primaryDisabled} onClick={runApprove}>{approve === 'active' ? 'Waiting for approval' : 'Approve USDT'}</Button>
			) : (
				<Button variant="primary" className="w-full" disabled={primaryDisabled} onClick={runAct}>{act === 'active' ? 'Waiting for confirmation' : `${verb} invoice`}</Button>
			)}
		</div>
	)
}

/** Anyone may flag a funded invoice as defaulted once the due date plus the grace period has passed. */
export function DefaultButton({ invoiceId }: { invoiceId: `0x${string}` }) {
	const { address } = useAccount()
	const chainId = useWalletChainId()
	const publicClient = usePublicClient()
	const { writeContractAsync } = useWriteContract()
	const qc = useQueryClient()
	const [busy, setBusy] = useState(false)
	const [err, setErr] = useState<string | null>(null)
	return (
		<div className="space-y-2">
			<p className="text-[13px] text-ink-2">The due date and grace period have passed. Anyone can mark this invoice defaulted. Repayment is no longer accepted after that.</p>
			{err && <InlineNotice tone="error">{err}</InlineNotice>}
			<Button variant="danger" disabled={busy || !address || chainId !== CHAIN_ID} onClick={async () => {
				if (!publicClient || !address) return
				setBusy(true); setErr(null)
				try {
					await publicClient.simulateContract({ address: ADDRESSES.finance, abi: financeAbi, functionName: 'markDefaulted', args: [invoiceId], account: address })
					const h = await writeContractAsync({ address: ADDRESSES.finance, abi: financeAbi, functionName: 'markDefaulted', args: [invoiceId] })
					await publicClient.waitForTransactionReceipt({ hash: h, timeout: 90_000 })
					for (let i = 0; i < 4; i++) { try { await apiJson(`/api/invoices/${invoiceId}/sync`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ txHash: h, kind: 'default' }) }); break } catch { await sleep(3000) } }
					await qc.invalidateQueries({ queryKey: ['invoice', invoiceId] })
				} catch (e) { setErr(`${friendlyError(e)} Nothing was changed.`) } finally { setBusy(false) }
			}}>{busy ? 'Marking defaulted' : 'Mark as defaulted'}</Button>
		</div>
	)
}
