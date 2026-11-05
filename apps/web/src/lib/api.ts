import 'server-only'

export const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body, (_k, v) => (typeof v === 'bigint' ? v.toString() : v)), {
		status,
		headers: { 'content-type': 'application/json' },
	})

export const fail = (status: number, error: string, message: string) => json({ error, message }, status)

export const isBytes32 = (v: string): v is `0x${string}` => /^0x[0-9a-fA-F]{64}$/.test(v)
