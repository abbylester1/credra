'use client'

import { useQuery } from '@tanstack/react-query'
import { apiJson } from './client'

export type WalletLabel = { name: string; role: 'Business' | 'Investor' }

/** Names and roles for the given wallets (issuers from their invoices, investors from the operator). */
export function useWalletLabels(wallets: (string | undefined | null)[]) {
	const list = [...new Set(wallets.filter((w): w is string => !!w).map((w) => w.toLowerCase()))].sort()
	return useQuery({
		queryKey: ['labels', list.join(',')],
		queryFn: () => apiJson<Record<string, WalletLabel>>(`/api/labels?wallets=${list.join(',')}`),
		enabled: list.length > 0,
		staleTime: 30_000,
	})
}
