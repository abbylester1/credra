'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from '@/lib/wagmi'

export function Providers({ children }: { children: React.ReactNode }) {
	const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 5_000, retry: 1 } } }))
	return (
		<WagmiProvider config={wagmiConfig}>
			<QueryClientProvider client={client}>{children}</QueryClientProvider>
		</WagmiProvider>
	)
}
