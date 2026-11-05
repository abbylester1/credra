import 'server-only'
import { createHash } from 'node:crypto'
import { cookies } from 'next/headers'
import { env } from './env'
import { makeToken, SESSION_COOKIE, verifyToken } from './authCore'

// Operator session secret is derived from the passcode; changing the passcode invalidates sessions.
const secret = () => createHash('sha256').update(`credra:${env.operatorPasscode}`).digest('hex')

export async function isOperator(): Promise<boolean> {
	if (!env.operatorPasscode) return false
	const jar = await cookies()
	return verifyToken(secret(), jar.get(SESSION_COOKIE)?.value)
}

export async function startOperatorSession() {
	const jar = await cookies()
	jar.set(SESSION_COOKIE, makeToken(secret()), {
		httpOnly: true,
		sameSite: 'strict',
		secure: false, // localhost demo; set true behind HTTPS
		path: '/',
		maxAge: 8 * 60 * 60,
	})
}

export async function endOperatorSession() {
	const jar = await cookies()
	jar.delete(SESSION_COOKIE)
}
