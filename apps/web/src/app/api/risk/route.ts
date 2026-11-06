import { z } from 'zod'
import { fail, json } from '@/lib/api'
import { GRADES, MODEL, parseGrade } from '@/lib/risk'
import { currentMinGrade, MIN_GRADE_KEY } from '@/lib/riskService'
import { setSetting } from '@/lib/repo'
import { isOperator } from '@/lib/session'

export const dynamic = 'force-dynamic'

/** Public: the grade scale and the minimum grade an invoice needs to be offered for funding. */
export async function GET() {
	return json({ model: MODEL, minGrade: await currentMinGrade(), grades: GRADES, indicative: true })
}

/** Operator only: change the minimum grade. Takes effect on the next verification; invoices already verified are unchanged. */
export async function POST(req: Request) {
	if (!(await isOperator())) return fail(403, 'operator_only', 'Operator access required.')
	const body = z.object({ minGrade: z.string() }).safeParse(await req.json().catch(() => null))
	const grade = body.success ? parseGrade(body.data.minGrade) : null
	if (!grade) return fail(400, 'invalid_grade', `Choose one of ${GRADES.join(', ')}.`)
	await setSetting(MIN_GRADE_KEY, grade)
	return json({ minGrade: grade })
}
