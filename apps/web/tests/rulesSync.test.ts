import { readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'

// The hosted demo runs a copy of the CRE workflow's eligibility rules. They must stay identical.
test('src/lib/rules.ts is an exact copy of the CRE workflow rules', () => {
	const original = readFileSync(path.resolve(__dirname, '../../../cre/invoice-verification/rules.ts'), 'utf-8')
	const copy = readFileSync(path.resolve(__dirname, '../src/lib/rules.ts'), 'utf-8')
	expect(copy.endsWith(original)).toBe(true)
})
