'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { CHAIN_ID, shorten } from '@/lib/config'
import { useRole } from '@/lib/useRole'
import { Button } from './ui'

type Item = { href: string; label: string; roles?: string[] }
const NAV: { group: string; items: Item[] }[] = [
	{
		group: 'Workspace',
		items: [
			{ href: '/app', label: 'Overview' },
			{ href: '/app/invoices', label: 'Invoices' },
			{ href: '/app/positions', label: 'Positions', roles: ['investor'] },
		],
	},
	{ group: 'Admin', items: [{ href: '/app/operator', label: 'Operator console' }] },
]

const ROLE_LABEL = { business: 'Business', investor: 'Investor', operator: 'Operator' } as const

function WalletCard() {
	const { address, isConnected } = useAccount()
	const { connectors, connect, isPending, error } = useConnect()
	const { disconnect } = useDisconnect()
	const chainId = useChainId()
	const { role, loading } = useRole()
	const ok = isConnected && chainId === CHAIN_ID

	if (!isConnected) {
		const inj = connectors[0]
		return (
			<div className="space-y-2">
				<Button variant="primary" className="w-full" disabled={!inj || isPending} onClick={() => inj && connect({ connector: inj })}>
					{isPending ? 'Waiting for your wallet' : 'Connect wallet'}
				</Button>
				{error && <p className="text-[12px] text-s-reject">No wallet found. Install a browser wallet to continue.</p>}
			</div>
		)
	}
	return (
		<div className="rounded-card border border-hair bg-card p-3">
			<div className="label">{loading ? 'Checking' : ROLE_LABEL[role]}</div>
			<div className="num mt-1 text-[13px]" title={address}>{address && shorten(address, 6, 4)}</div>
			<div className="mt-2 flex items-center justify-between gap-2">
				<span className="flex items-center gap-1.5 text-[12px] text-ink-3">
					<span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-accent' : 'bg-s-review'}`} aria-hidden />
					{ok ? 'Whitechain Sepolia' : 'Wrong network'}
				</span>
				<button className="text-[12px] text-accent hover:underline" onClick={() => disconnect()}>Disconnect</button>
			</div>
		</div>
	)
}

function NetworkBanner() {
	const { isConnected } = useAccount()
	const chainId = useChainId()
	const { switchChain, isPending } = useSwitchChain()
	if (!isConnected || chainId === CHAIN_ID) return null
	return (
		<div role="alert" className="flex flex-wrap items-center justify-between gap-3 bg-s-review-soft px-8 py-2.5 text-[14px] text-s-review">
			<span className="font-medium">Wrong network. Actions are disabled until you switch.</span>
			<Button dense disabled={isPending} onClick={() => switchChain({ chainId: CHAIN_ID })}>
				Switch to Whitechain Sepolia
			</Button>
		</div>
	)
}

export function AppShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname()
	const { operator, role } = useRole()
	const groups = NAV.filter((g) => g.group !== 'Admin' || operator).map((g) => ({ ...g, items: g.items.filter((i) => !i.roles || i.roles.includes(role)) }))
	const active = (href: string) => (href === '/app' ? pathname === '/app' : pathname.startsWith(href))

	return (
		<div className="min-h-screen lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
			<aside className="border-b border-hair bg-canvas px-4 py-4 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:py-6">
				<div className="flex h-full flex-col gap-6">
					<Link href="/app" className="flex items-center gap-2.5 px-2">
						<span className="inline-block h-3.5 w-3.5 rounded-[3px] bg-pine" aria-hidden />
						<span className="text-[22px] font-semibold tracking-[-0.02em]">credra</span>
					</Link>
					<nav aria-label="Main" className="flex gap-4 lg:flex-1 lg:flex-col lg:gap-5">
						{groups.map((g) => (
							<div key={g.group} className="flex gap-1 lg:flex-col">
								<div className="label hidden px-2 pb-1 lg:block">{g.group}</div>
								{g.items.map((i) => (
									<Link
										key={i.href}
										href={i.href}
										aria-current={active(i.href) ? 'page' : undefined}
										className={`flex h-9 items-center rounded-ctl px-2.5 text-[14px] ${active(i.href) ? 'border border-hair bg-card font-medium text-ink' : 'text-ink-2 hover:bg-inset'}`}
									>
										{i.label}
									</Link>
								))}
							</div>
						))}
					</nav>
					<WalletCard />
				</div>
			</aside>
			<div className="min-w-0">
				<NetworkBanner />
				<main className="mx-auto max-w-[1120px] px-4 py-8 lg:px-8">{children}</main>
			</div>
		</div>
	)
}
