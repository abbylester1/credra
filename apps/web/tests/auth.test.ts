import { beforeEach, describe, expect, test } from 'vitest'
import { _resetRateLimit, makeToken, passcodeMatches, rateLimited, verifyToken } from '../src/lib/authCore'
import { authMessage, verifyWalletHeaders } from '../src/lib/walletAuth'
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts'

describe('operator session', () => {
	test('valid token verifies; tampered, expired, empty and wrong-secret tokens do not', () => {
		const t = makeToken('s3cret', 1000)
		expect(verifyToken('s3cret', t, 1001)).toBe(true)
		expect(verifyToken('s3cret', t + 'x', 1001)).toBe(false)
		expect(verifyToken('other', t, 1001)).toBe(false)
		expect(verifyToken('s3cret', t, 1000 + 9 * 3600)).toBe(false)
		expect(verifyToken('s3cret', undefined)).toBe(false)
		expect(verifyToken('s3cret', 'abc.def')).toBe(false)
	})
	test('passcode comparison', () => {
		expect(passcodeMatches('abc123', 'abc123')).toBe(true)
		expect(passcodeMatches('abc123', 'abc124')).toBe(false)
		expect(passcodeMatches('abc123', '')).toBe(false)
		expect(passcodeMatches('', '')).toBe(false)
	})
	beforeEach(() => _resetRateLimit())
	test('login is rate limited after 5 attempts per minute', () => {
		for (let i = 0; i < 5; i++) expect(rateLimited('ip', 1000 + i)).toBe(false)
		expect(rateLimited('ip', 1010)).toBe(true)
		expect(rateLimited('ip', 1000 + 61_000)).toBe(false)
	})
})

describe('wallet auth', () => {
	const acct = privateKeyToAccount(generatePrivateKey())
	const headersFor = async (issued: number, wallet = acct.address) =>
		new Headers({
			'x-wallet': wallet,
			'x-issued': String(issued),
			'x-signature': await acct.signMessage({ message: authMessage(acct.address, issued) }),
		})
	test('accepts a fresh signature and returns the lowercase address', async () => {
		expect(await verifyWalletHeaders(await headersFor(5000), 5001)).toBe(acct.address.toLowerCase())
	})
	test('rejects a stale signature, a signature for another wallet and missing headers', async () => {
		expect(await verifyWalletHeaders(await headersFor(5000), 5000 + 3600)).toBeNull()
		const other = privateKeyToAccount(generatePrivateKey()).address
		expect(await verifyWalletHeaders(await headersFor(5000, other), 5001)).toBeNull()
		expect(await verifyWalletHeaders(new Headers(), 5001)).toBeNull()
	})
})
