'use client'

import { useQuery } from '@tanstack/react-query'
import { apiJson } from './client'

export type InvoiceSummary = {
	invoiceId: string
	invoiceNumber: string
	issuerName: string
	issuerWallet: string
	buyerName: string
	currency: string
	amount: string
	financingAmount: string
	dueDate: number
	invoiceDate: number
	status: number
	documentHash: string
	submitTx: string
	verdict: string | null
	createdAt: number
}

export type Scope = 'mine' | 'marketplace' | 'all'

export function useInvoices(scope: Scope, headers?: Record<string, string>) {
	return useQuery({
		queryKey: ['invoices', scope, headers?.['x-wallet'] ?? ''],
		queryFn: () => apiJson<InvoiceSummary[]>(`/api/invoices?scope=${scope}`, { headers }),
		refetchInterval: 15_000,
	})
}
