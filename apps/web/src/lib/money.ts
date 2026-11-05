// USDT amounts are integers in base units (6 decimals). Never use floating point.
export const USDT_DECIMALS = 6
const SCALE = 10n ** BigInt(USDT_DECIMALS)

/** "10000.5" -> 10000500000n. Rejects negatives, junk and more than 6 decimals. */
export function parseUsdt(input: string): bigint {
	const s = input.trim()
	if (!/^\d+(\.\d+)?$/.test(s)) throw new Error('invalid_amount')
	const [whole, frac = ''] = s.split('.')
	if (frac.length > USDT_DECIMALS) throw new Error('too_many_decimals')
	return BigInt(whole) * SCALE + BigInt(frac.padEnd(USDT_DECIMALS, '0') || '0')
}

/** 10000500000n -> "10000.5"; trailing zeros trimmed. */
export function formatUsdt(value: bigint): string {
	const neg = value < 0n
	const v = neg ? -value : value
	const whole = v / SCALE
	const frac = (v % SCALE).toString().padStart(USDT_DECIMALS, '0').replace(/0+$/, '')
	return `${neg ? '-' : ''}${whole}${frac ? '.' + frac : ''}`
}
