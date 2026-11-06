'use client'

import { useAccount } from 'wagmi'

/** The chain the wallet is actually on. wagmi's useChainId falls back to the configured chain when the
 *  wallet is on an unsupported network, which would hide a wrong-network state. */
export function useWalletChainId(): number | undefined {
	return useAccount().chainId
}
