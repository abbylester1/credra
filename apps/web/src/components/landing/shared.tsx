'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

/* ─── motion helpers ─── */

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** True once the element has scrolled into view (stays true). */
export function useInView<T extends Element>(threshold = 0.2) {
	const ref = useRef<T>(null)
	const [seen, setSeen] = useState(false)
	useEffect(() => {
		const el = ref.current
		if (!el) return
		if (reduced()) { setSeen(true); return }
		const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); obs.disconnect() } }, { threshold })
		obs.observe(el)
		return () => obs.disconnect()
	}, [threshold])
	return [ref, seen] as const
}

export function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
	const [ref, seen] = useInView<HTMLDivElement>(0.12)
	return (
		<div
			ref={ref}
			style={{ transitionDelay: `${delay}ms` }}
			className={`transition-all duration-700 ease-out ${seen ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'} ${className}`}
		>
			{children}
		</div>
	)
}

/** Tweens a number towards `to` whenever it changes (or from 0 once visible). */
export function useTween(to: number, ms = 600, active = true) {
	const [v, setV] = useState(0)
	const from = useRef(0)
	useEffect(() => {
		if (!active) return
		if (reduced()) { setV(to); from.current = to; return }
		const start = performance.now()
		const a = from.current
		let raf = 0
		const tick = (t: number) => {
			const p = Math.min(1, (t - start) / ms)
			const e = 1 - Math.pow(1 - p, 3)
			const cur = a + (to - a) * e
			setV(cur)
			from.current = cur
			if (p < 1) raf = requestAnimationFrame(tick)
		}
		raf = requestAnimationFrame(tick)
		return () => cancelAnimationFrame(raf)
	}, [to, ms, active])
	return v
}

export function CountUp({ to, className = '' }: { to: number; className?: string }) {
	// Static: numbers are read, not chased (matches the stats band and Privy's still figures).
	return <span className={className}>{to}</span>
}

/* ─── type ─── */

export function Eyebrow({ children }: { children: React.ReactNode }) {
	return <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">{children}</p>
}

/** Ramp-style two-tone heading: ink first half, grey second half. */
export function Heading({ lead, rest, className = '' }: { lead: string; rest?: string; className?: string }) {
	return (
		<h2 className={`text-[32px] font-semibold leading-[1.1] tracking-[-0.025em] text-ink md:text-[48px] ${className}`}>
			{lead}{' '}
			{rest && <span className="text-ink-3">{rest}</span>}
		</h2>
	)
}

/* ─── brand marks (official artwork, see public/) ─── */

export function WhitechainMark({ size = 28 }: { size?: number }) {
	return <Image src="/whitechain.svg" alt="" width={size} height={size} unoptimized />
}
export function WhitechainLogo({ height = 26 }: { height?: number }) {
	return <Image src="/whitechain-logo.svg" alt="Whitechain" width={Math.round((height * 833) / 152)} height={height} unoptimized />
}
export function ChainlinkMark({ size = 28 }: { size?: number }) {
	return <Image src="/chainlink.svg" alt="" width={size} height={size} unoptimized />
}
export function UsdtMark({ size = 28 }: { size?: number }) {
	return <Image src="/usdt.svg" alt="" width={size} height={size} unoptimized />
}

/* ─── small UI atoms reused in illustrations ─── */

export function Tick({ on, className = '' }: { on: boolean; className?: string }) {
	return (
		<span
			aria-hidden
			className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full transition-all duration-300 ${on ? 'scale-100 bg-verified text-white' : 'scale-90 bg-inset text-transparent'} ${className}`}
		>
			<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 5.2l2 2 4-4.4" /></svg>
		</span>
	)
}

export function Chip({ tone, children }: { tone: 'accent' | 'review' | 'reject' | 'funded' | 'repaid' | 'neutral'; children: React.ReactNode }) {
	const t = {
		accent: 'bg-verified-soft text-verified',
		review: 'bg-s-review-soft text-s-review',
		reject: 'bg-s-reject-soft text-s-reject',
		funded: 'bg-s-funded-soft text-s-funded',
		repaid: 'bg-s-repaid-soft text-s-repaid',
		neutral: 'bg-s-neutral-soft text-s-neutral',
	}[tone]
	return (
		<span className={`inline-flex items-center gap-1.5 rounded-chip px-2 py-0.5 text-[11px] font-medium ${t}`}>
			<span className="h-1.5 w-1.5 bg-current" />
			{children}
		</span>
	)
}

export const Mono = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
	<span className={`font-mono tabular-nums ${className}`}>{children}</span>
)

export const ExternalArrow = () => (
	<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 10l6-6M5 4h5v5" /></svg>
)

export const EXPLORER = 'https://explorer.testnet.whitechain.io'
export const TX = {
	fund: '0xf350c714feee6e7e1a31b4a86de0320a44b51d0499d61b7d4dafa832603ea125',
	repay: '0xa5ec21f89028eedc2bc83fac31f1f1dbaaba3a99073f19c2e661de19c7e7dbe0',
	role: '0x553f5a332ee3be1da2b18dd2ea3048cfe72f150333ef71f7915fc7f6eb24d053',
}
export const short = (h: string) => `${h.slice(0, 6)}…${h.slice(-4)}`
