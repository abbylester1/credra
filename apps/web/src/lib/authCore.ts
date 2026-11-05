import { createHmac, timingSafeEqual } from 'node:crypto'

export const SESSION_COOKIE = 'credra_operator'
const TTL_SECONDS = 8 * 60 * 60

const sign = (secret: string, payload: string) => createHmac('sha256', secret).update(payload).digest('hex')

export function makeToken(secret: string, nowSec = Math.floor(Date.now() / 1000)): string {
	const exp = String(nowSec + TTL_SECONDS)
	return `${exp}.${sign(secret, exp)}`
}

export function verifyToken(secret: string, token: string | undefined, nowSec = Math.floor(Date.now() / 1000)): boolean {
	if (!token) return false
	const [exp, mac] = token.split('.')
	if (!exp || !mac || !/^\d+$/.test(exp)) return false
	if (Number(exp) < nowSec) return false
	const want = Buffer.from(sign(secret, exp))
	const got = Buffer.from(mac)
	return want.length === got.length && timingSafeEqual(want, got)
}

export function passcodeMatches(expected: string, given: string): boolean {
	if (!expected) return false
	const a = Buffer.from(expected)
	const b = Buffer.from(given)
	return a.length === b.length && timingSafeEqual(a, b)
}

/** In-memory login rate limit: max 5 attempts per 60 seconds per key. */
const attempts = new Map<string, number[]>()
export function rateLimited(key: string, nowMs = Date.now()): boolean {
	const recent = (attempts.get(key) ?? []).filter((t) => nowMs - t < 60_000)
	recent.push(nowMs)
	attempts.set(key, recent)
	return recent.length > 5
}
export const _resetRateLimit = () => attempts.clear()
