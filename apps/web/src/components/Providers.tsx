'use client'

import { PrivyProvider, useCreateWallet, usePrivy, useWallets } from '@privy-io/react-auth'
import { createConfig as createPrivyConfig, useSetActiveWallet, WagmiProvider as PrivyWagmiProvider } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { fallback, http } from 'viem'
import { useAccount, WagmiProvider } from 'wagmi'
import { whitechain } from '@/lib/chain'
import { RPC_FALLBACK, RPC_PRIMARY } from '@/lib/config'
import { wagmiConfig } from '@/lib/wagmi'

/** Privy gives email, Google and wallet sign-in plus an embedded wallet. Enabled when an app id is set;
 *  otherwise the app falls back to a plain browser wallet (MetaMask etc.). */
export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID

type Connect = { privy: boolean; login: (() => void) | null; logout: (() => Promise<void>) | null; ready: boolean; authenticated: boolean; hasWallet: boolean }
const ConnectContext = createContext<Connect>({ privy: false, login: null, logout: null, ready: true, authenticated: false, hasWallet: false })
/** `privy` is true when sign-in goes through Privy. `login`/`logout` are null for the browser-wallet fallback. */
export const useConnectMode = () => useContext(ConnectContext)

const privyWagmiConfig = createPrivyConfig({
	ssr: true,
	chains: [whitechain],
	transports: { [whitechain.id]: fallback([http(RPC_PRIMARY, { timeout: 12_000 }), http(RPC_FALLBACK, { timeout: 12_000 })]) },
})

function PrivyBridge({ children }: { children: React.ReactNode }) {
	const { login, logout, ready, authenticated, user } = usePrivy()
	const { createWallet } = useCreateWallet()
	const creating = useRef(false)
	const { wallets, ready: walletsReady } = useWallets()
	const { setActiveWallet } = useSetActiveWallet()
	const { isConnected } = useAccount()
	const connecting = useRef<string | null>(null)
	// A previous Disconnect leaves wagmi.io.privy.wallet.<address>.disconnected in storage, and the wagmi
	// connector refuses to reconnect a wallet carrying that flag. Clear it and connect the wallet explicitly.
	useEffect(() => {
		if (!authenticated || !walletsReady || isConnected || wallets.length === 0) return
		const w = wallets.find((x) => x.walletClientType === 'privy') ?? wallets[0]
		if (connecting.current === w.address) return
		connecting.current = w.address
		try {
			Object.keys(localStorage).filter((k) => /^wagmi\.io\.privy\.wallet\..*\.disconnected$/.test(k)).forEach((k) => localStorage.removeItem(k))
		} catch {}
		setActiveWallet(w).catch((e) => { console.error('could not connect the wallet', e); connecting.current = null })
	}, [authenticated, walletsReady, isConnected, wallets, setActiveWallet])
	// Privy only auto-creates the embedded wallet inside its own modal. Our custom sign-in screen
	// uses the headless login hooks, so create the wallet here for any user who has none.
	useEffect(() => {
		if (!ready || !authenticated || !user || creating.current) return
		if (user.linkedAccounts.some((a) => a.type === 'wallet')) return
		creating.current = true
		createWallet().catch((e) => { console.error('embedded wallet creation failed', e); creating.current = false })
	}, [ready, authenticated, user, createWallet])
	const hasWallet = !!user?.linkedAccounts.some((a) => a.type === 'wallet')
	return <ConnectContext.Provider value={{ privy: true, login: () => login(), logout, ready, authenticated, hasWallet }}>{children}</ConnectContext.Provider>
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
					embeddedWallets: { ethereum: { createOnLogin: 'users-without-wallets' }, showWalletUIs: false },
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
