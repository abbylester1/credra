'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useConnectMode } from './Providers'
import { Button, Spinner } from './ui'

/** Shown while Privy is starting or finishing a login and the wallet is not connected yet. */
export function WalletSplash({ message }: { message: string }) {
	const mode = useConnectMode()
	const [slow, setSlow] = useState(false)
	useEffect(() => {
		const id = setTimeout(() => setSlow(true), 15_000)
		return () => clearTimeout(id)
	}, [])
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-canvas px-6 text-center">
			<Image src="/logo.png" alt="Credra" width={113} height={22} className="h-[22px] w-auto object-contain" priority />
			<p className="flex items-center gap-2.5 text-[15px] text-ink-2"><Spinner className="h-4 w-4" />{message}</p>
			{slow && (
				<div className="max-w-[320px] space-y-3">
					<p className="text-[13px] text-ink-3">This is taking longer than usual.</p>
					<Button onClick={() => { void mode.logout?.(); window.location.reload() }}>Sign out and try again</Button>
				</div>
			)}
		</div>
	)
}
