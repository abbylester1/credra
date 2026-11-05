'use client'

import { useCallback } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { authMessage } from './walletAuth'

type Cached = { wallet: string; issued: number; signature: string }
const KEY = 'credra.walletAuth'
const WINDOW = 540 // refresh before the 10 minute server window

function readCache(wallet: string): Cached | null {
	try {
		const c = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as Cached | null
		if (c && c.wallet === wallet.toLowerCase() && Date.now() / 1000 - c.issued < WINDOW) return c
	} catch {}
	return null
}

/** Signs a short-lived access message with the browser wallet; cached per session. No keys leave the wallet. */
export function useWalletHeaders() {
	const { address } = useAccount()
	const { signMessageAsync } = useSignMessage()
	return useCallback(async (): Promise<Record<string, string>> => {
		if (!address) throw new Error('wallet_not_connected')
		let c = readCache(address)
		if (!c) {
			const issued = Math.floor(Date.now() / 1000)
			const signature = await signMessageAsync({ message: authMessage(address, issued) })
			c = { wallet: address.toLowerCase(), issued, signature }
			try {
				sessionStorage.setItem(KEY, JSON.stringify(c))
			} catch {}
		}
		return { 'x-wallet': c.wallet, 'x-issued': String(c.issued), 'x-signature': c.signature }
	}, [address, signMessageAsync])
}

export async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
	const res = await fetch(url, init)
	const data = await res.json().catch(() => ({}))
	if (!res.ok) throw Object.assign(new Error(data.message ?? 'Request failed'), { code: data.error, status: res.status })
	return data as T
}
