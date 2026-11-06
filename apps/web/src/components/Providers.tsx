'use client'

import { PrivyProvider, usePrivy } from '@privy-io/react-auth'
import { createConfig as createPrivyConfig, WagmiProvider as PrivyWagmiProvider } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createContext, useContext, useState } from 'react'
import { fallback, http } from 'viem'
import { WagmiProvider } from 'wagmi'
import { whitechain } from '@/lib/chain'
import { RPC_FALLBACK, RPC_PRIMARY } from '@/lib/config'
import { wagmiConfig } from '@/lib/wagmi'

/** Privy gives email, Google and wallet sign-in plus an embedded wallet. Enabled when an app id is set;
 *  otherwise the app falls back to a plain browser wallet (MetaMask etc.). */
export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID

type Connect = { privy: boolean; login: (() => void) | null; logout: (() => Promise<void>) | null; ready: boolean; authenticated: boolean }
const ConnectContext = createContext<Connect>({ privy: false, login: null, logout: null, ready: true, authenticated: false })
/** `privy` is true when sign-in goes through Privy. `login`/`logout` are null for the browser-wallet fallback. */
export const useConnectMode = () => useContext(ConnectContext)

const privyWagmiConfig = createPrivyConfig({
	ssr: true,
	chains: [whitechain],
	transports: { [whitechain.id]: fallback([http(RPC_PRIMARY, { timeout: 12_000 }), http(RPC_FALLBACK, { timeout: 12_000 })]) },
})

function PrivyBridge({ children }: { children: React.ReactNode }) {
	const { login, logout, ready, authenticated } = usePrivy()
	return <ConnectContext.Provider value={{ privy: true, login: () => login(), logout, ready, authenticated }}>{children}</ConnectContext.Provider>
}

export function Providers({ children }: { children: React.ReactNode }) {
	const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 5_000, retry: 1 } } }))
	if (PRIVY_APP_ID) {
		return (
			<PrivyProvider
				appId={PRIVY_APP_ID}
				config={{
					loginMethods: ['email', 'google', 'wallet'],
					appearance: { theme: 'light', accentColor: '#0D3B35', showWalletLoginFirst: false },
					embeddedWallets: { ethereum: { createOnLogin: 'users-without-wallets' } },
					defaultChain: whitechain,
					supportedChains: [whitechain],
				}}
			>
				<QueryClientProvider client={client}>
					<PrivyWagmiProvider config={privyWagmiConfig}>
						<PrivyBridge>{children}</PrivyBridge>
					</PrivyWagmiProvider>
				</QueryClientProvider>
			</PrivyProvider>
		)
	}
	return (
		<WagmiProvider config={wagmiConfig}>
			<QueryClientProvider client={client}>{children}</QueryClientProvider>
		</WagmiProvider>
	)
}
