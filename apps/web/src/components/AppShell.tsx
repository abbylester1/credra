'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { useWalletChainId } from '@/lib/useWalletChain'
import { CHAIN_ID, EXPLORER, shorten } from '@/lib/config'
import { useRole } from '@/lib/useRole'
import { Button } from './ui'

type Item = { href: string; label: string; icon: string; roles?: string[] }
const NAV: { group: string; items: Item[] }[] = [
	{
		group: 'Workspace',
		items: [
			{ href: '/app', label: 'Overview', icon: 'M3 3h5v5H3zM10 3h5v5h-5zM3 10h5v5H3zM10 10h5v5h-5z' },
			{ href: '/app/invoices', label: 'Invoices', icon: 'M5 2h6l3 3v11H5zM11 2v3h3M7.5 9h4M7.5 12h4' },
			{ href: '/app/positions', label: 'Positions', icon: 'M3 14l4-4 3 3 5-6M12 7h3v3', roles: ['investor'] },
		],
	},
	{ group: 'Admin', items: [{ href: '/app/operator', label: 'Operator console', icon: 'M9 2l6 3v4c0 3.5-2.5 6-6 7-3.5-1-6-3.5-6-7V5z' }] },
]

const ROLE_LABEL = { business: 'Business', investor: 'Investor', operator: 'Operator' } as const

function WalletCard() {
	const { address, isConnected } = useAccount()
	const { connectors, connect, isPending, error } = useConnect()
	const { disconnect } = useDisconnect()
	const chainId = useWalletChainId()
	const { role, loading } = useRole()
	const ok = isConnected && chainId === CHAIN_ID

	if (!isConnected) {
		const inj = connectors[0]
		return (
			<div className="space-y-2">
				<Button variant="primary" className="w-full" disabled={!inj || isPending} onClick={() => inj && connect({ connector: inj })}>
					{isPending ? 'Waiting for your wallet' : 'Connect wallet'}
				</Button>
				{error && (
					<p className="text-[12px] text-s-reject">
						{typeof window !== 'undefined' && !(window as { ethereum?: unknown }).ethereum
							? <>No wallet found. <a className="underline" href="https://metamask.io/download" target="_blank" rel="noreferrer">Install MetaMask</a>.</>
							: 'Connection was not approved. Check your wallet and try again.'}
					</p>
				)}
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

function TopBar() {
	const pathname = usePathname()
	const { role, loading } = useRole()
	const section = pathname.split('/').filter(Boolean).slice(1)
	return (
		<div className="sticky top-0 z-20 hidden items-center justify-between border-b border-hair bg-canvas/90 px-8 py-3 backdrop-blur-sm lg:flex">
			<nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-ink-3">
				<Link href="/app" className="hover:text-ink">App</Link>
				{section.map((p, i) => (
					<span key={i} className="flex items-center gap-2"><span aria-hidden>/</span><span className={i === section.length - 1 ? 'font-medium capitalize text-ink' : 'capitalize'}>{p.length > 18 ? shorten(p, 6, 4) : p}</span></span>
				))}
			</nav>
			<div className="flex items-center gap-3">
				{!loading && <span className="rounded-chip bg-accent-soft px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.05em] text-accent">{ROLE_LABEL[role]}</span>}
				<a href={EXPLORER} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-ctl border border-hair bg-card px-2.5 py-1.5 text-[12px] text-ink-2 transition-colors hover:border-field">
					<Image src="/whitechain.svg" alt="" width={16} height={16} unoptimized />
					Whitechain Sepolia
					<span className="animate-pulse-ring h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
				</a>
			</div>
		</div>
	)
}

function NetworkBanner() {
	const { isConnected } = useAccount()
	const chainId = useWalletChainId()
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
					<Link href="/" className="flex items-center px-2" aria-label="Credra home">
						<Image src="/logo.png" alt="Credra" width={112} height={32} className="h-8 w-auto object-contain" priority />
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
										className={`group flex h-10 items-center gap-2.5 rounded-ctl px-2.5 text-[14px] transition-colors ${active(i.href) ? 'border border-hair bg-card font-medium text-ink shadow-[0_1px_2px_rgba(15,26,22,0.05)]' : 'text-ink-2 hover:bg-inset'}`}
									>
										<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={active(i.href) ? 'text-accent' : 'text-ink-3 group-hover:text-ink-2'} aria-hidden><path d={i.icon} /></svg>
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
				<TopBar />
				<main className="mx-auto max-w-[1120px] px-4 py-8 lg:px-8">{children}</main>
			</div>
		</div>
	)
}
