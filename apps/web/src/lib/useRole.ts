'use client'

import { useQuery } from '@tanstack/react-query'
import { useAccount, useReadContract } from 'wagmi'
import { allowlistAbi } from './abi'
import { apiJson } from './client'
import { ADDRESSES } from './config'

export type Role = 'operator' | 'investor' | 'business'

/** operator (passcode session) > investor (allowlisted wallet) > business (any other wallet). */
export function useRole() {
	const { address, isConnected } = useAccount()
	const op = useQuery({ queryKey: ['operator'], queryFn: () => apiJson<{ operator: boolean }>('/api/operator/login'), staleTime: 10_000 })
	const allowed = useReadContract({
		address: ADDRESSES.allowlist,
		abi: allowlistAbi,
		functionName: 'isAllowed',
		args: address ? [address] : undefined,
		query: { enabled: !!address },
	})
	const loading = op.isLoading || (isConnected && allowed.isLoading)
	const role: Role = op.data?.operator ? 'operator' : allowed.data ? 'investor' : 'business'
	return { role, loading, operator: !!op.data?.operator, refetchOperator: op.refetch }
}
