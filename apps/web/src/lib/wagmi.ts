import { createConfig, http, fallback } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { whitechain } from './chain'
import { RPC_FALLBACK, RPC_PRIMARY } from './config'

export const wagmiConfig = createConfig({
	chains: [whitechain],
	connectors: [injected()],
	transports: {
		[whitechain.id]: fallback([http(RPC_PRIMARY, { timeout: 12_000 }), http(RPC_FALLBACK, { timeout: 12_000 })]),
	},
	ssr: true,
})
