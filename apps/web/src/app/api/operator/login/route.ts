import { z } from 'zod'
import { fail, json } from '@/lib/api'
import { passcodeMatches, rateLimited } from '@/lib/authCore'
import { env } from '@/lib/env'
import { endOperatorSession, isOperator, startOperatorSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
	return json({ operator: await isOperator() })
}

export async function POST(req: Request) {
	const ip = req.headers.get('x-forwarded-for') ?? 'local'
	if (rateLimited(ip)) return fail(429, 'rate_limited', 'Too many attempts. Wait a minute and try again.')
	const body = z.object({ passcode: z.string().min(1).max(200) }).safeParse(await req.json().catch(() => null))
	if (!body.success || !passcodeMatches(env.operatorPasscode, body.data.passcode)) {
		return fail(401, 'invalid_passcode', 'That passcode is not correct.')
	}
	await startOperatorSession()
	return json({ operator: true })
}

export async function DELETE() {
	await endOperatorSession()
	return json({ operator: false })
}
