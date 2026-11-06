import 'server-only'
import { env } from './env'
import { deleteRegistryRecord, getRegistryRecord, putRegistryRecord, type RegistryRecord } from './repo'

/**
 * The SIMULATED external registry. Locally it is the standalone apps/mock-registry server (the CRE CLI reads it over HTTP).
 * On the hosted demo (no CRE CLI, no second server) it is a table in the same database. Always test data.
 */
const inDatabase = () => env.verifyMode === 'inprocess'

export type RegistryWrite = Omit<RegistryRecord, 'reference'> & { reference?: string }

export async function writeRegistry(rec: RegistryWrite): Promise<void> {
	if (inDatabase()) return putRegistryRecord(rec)
	const res = await fetch(`${env.mockRegistryUrl}/admin/invoices`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(rec) })
	if (!res.ok) throw new Error('mock_failed')
}

export async function removeRegistry(invoiceNumber: string): Promise<void> {
	if (inDatabase()) return deleteRegistryRecord(invoiceNumber)
	await fetch(`${env.mockRegistryUrl}/admin/invoices/${encodeURIComponent(invoiceNumber)}`, { method: 'DELETE' })
}

export const readRegistry = (invoiceNumber: string) => getRegistryRecord(invoiceNumber)
