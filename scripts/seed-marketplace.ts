#!/usr/bin/env bun
/**
 * Seeds the investor marketplace with varied ELIGIBLE invoices.
 *
 * Requirements:
 *   - Mock API running: cd apps/mock-registry && bun server.ts   (port 8787)
 *   - Env loaded:       set -a && . ./.env && set +a
 *
 * Run from the repo root:
 *   cd apps/web && bun ../../scripts/seed-marketplace.ts
 *
 * Override the app URL for local dev:
 *   APP_URL=http://localhost:3000 bun ../../scripts/seed-marketplace.ts
 */

import {
  keccak256,
  stringToBytes,
  createWalletClient,
  createPublicClient,
  http,
  defineChain,
  type Hex,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

// ── config ────────────────────────────────────────────────────────────────────
const RPC = process.env.WHITECHAIN_RPC ?? 'https://rpc.testnet.whitechain.io'
const REGISTRY = (process.env.REGISTRY ?? '0xc11162A72F388Efb6Ddd0B73Eea578598d733122') as Hex
const APP_URL = (process.env.APP_URL ?? 'https://credra-seven.vercel.app').replace(/\/$/, '')
const MOCK_API = (process.env.API ?? 'http://localhost:8787').replace(/\/$/, '')

const BIZ_KEY = process.env.PRIVATE_KEY_BUSINESS
if (!BIZ_KEY) throw new Error('PRIVATE_KEY_BUSINESS not set — load .env first')

// ── chain + clients ───────────────────────────────────────────────────────────
const chain = defineChain({
  id: 1874,
  name: 'Whitechain Sepolia',
  nativeCurrency: { name: 'WBT', symbol: 'WBT', decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
})

const account = privateKeyToAccount(BIZ_KEY as Hex)
const wallet = createWalletClient({ account, chain, transport: http(RPC, { timeout: 30_000 }) })
const pub = createPublicClient({ chain, transport: http(RPC, { timeout: 30_000 }) })

const REGISTRY_ABI = [{
  name: 'submitInvoice', type: 'function', stateMutability: 'nonpayable',
  inputs: [{ type: 'bytes32' }, { type: 'bytes32' }, { type: 'bytes32' }, { type: 'uint256' }, { type: 'uint256' }, { type: 'uint64' }],
  outputs: [],
}] as const

// ── auth headers ──────────────────────────────────────────────────────────────
const authMsg = (addr: string, t: number) => `Credra access\nwallet: ${addr.toLowerCase()}\nissued: ${t}`

async function headers(): Promise<Record<string, string>> {
  const issued = Math.floor(Date.now() / 1000)
  const sig = await account.signMessage({ message: authMsg(account.address, issued) })
  return { 'x-wallet': account.address.toLowerCase(), 'x-issued': String(issued), 'x-signature': sig }
}

// ── invoice definitions ───────────────────────────────────────────────────────
const stamp = Date.now().toString(36).toUpperCase().slice(-5)

const INVOICES = [
  {
    number: `VL-${stamp}A`,
    issuer: 'Vantage Logistics Pvt Ltd',
    buyer: 'Metro Distributors Ltd',
    amount: 20_000_000_000n,   // 20,000 USDT
    financing: 18_000_000_000n, // 18,000 USDT
    daysOut: 45,
  },
  {
    number: `NP-${stamp}B`,
    issuer: 'Nexcore Pharma Ltd',
    buyer: 'Global Trade Partners',
    amount: 25_000_000_000n,
    financing: 23_000_000_000n,
    daysOut: 60,
  },
  {
    number: `SH-${stamp}C`,
    issuer: 'Summit Hardware Ltd',
    buyer: 'Pacific Retail Group',
    amount: 15_000_000_000n,
    financing: 14_000_000_000n,
    daysOut: 30,
  },
  {
    number: `BE-${stamp}D`,
    issuer: 'Brightfield Energy Ltd',
    buyer: 'Acme Corp',
    amount: 30_000_000_000n,
    financing: 27_000_000_000n,
    daysOut: 75,
  },
]

// ── main ──────────────────────────────────────────────────────────────────────
console.log(`\nSeeding marketplace for ${account.address}`)
console.log(`  app: ${APP_URL}`)
console.log(`  mock api: ${MOCK_API}\n`)

for (const inv of INVOICES) {
  const dueTs = Math.floor(Date.now() / 1000) + inv.daysOut * 86_400
  const invoiceDate = Math.floor(Date.now() / 1000)

  // Unique document per invoice (hash must match what goes onchain)
  const docText = [
    'CREDRA SEED INVOICE',
    inv.number,
    `${inv.issuer} → ${inv.buyer}`,
    `${inv.amount / 1_000_000n} USDT (financing ${inv.financing / 1_000_000n} USDT)`,
    `Due: ${new Date(dueTs * 1000).toISOString().slice(0, 10)}`,
    'Seed document for Credra testnet demo',
  ].join('\n')
  const docBytes = new TextEncoder().encode(docText)
  const docHash = keccak256(docBytes)
  const id = keccak256(stringToBytes(inv.number))
  const buyerRef = keccak256(stringToBytes(`buyer:${inv.buyer}`))

  console.log(`▸ ${inv.number}  ${inv.issuer} → ${inv.buyer}`)
  console.log(`  ${inv.amount / 1_000_000n} USDT, due +${inv.daysOut}d`)

  // 1. Submit onchain
  let txHash: Hex
  try {
    txHash = await wallet.writeContract({
      address: REGISTRY, abi: REGISTRY_ABI, functionName: 'submitInvoice',
      args: [id, docHash, buyerRef, inv.amount, inv.financing, BigInt(dueTs)],
    })
    await pub.waitForTransactionReceipt({ hash: txHash, timeout: 90_000 })
    console.log(`  ✓ onchain  ${txHash}`)
  } catch (e) {
    console.error(`  ✗ onchain failed:`, (e as Error).message)
    continue
  }

  // 2. Seed mock external API
  try {
    const r = await fetch(`${MOCK_API}/admin/invoices`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        invoiceNumber: inv.number, issuerName: inv.issuer,
        issuerWallet: account.address, buyerName: inv.buyer,
        buyerRef, amount: String(inv.amount), dueDate: dueTs,
        documentHash: docHash, status: 'valid',
      }),
    })
    if (!r.ok) console.warn(`  ⚠ mock API ${r.status} — verify may fail`)
    else console.log(`  ✓ mock API`)
  } catch {
    console.warn(`  ⚠ mock API unreachable — verify may fail`)
  }

  // 3. Save to backend
  const fd = new FormData()
  fd.set('invoiceNumber', inv.number)
  fd.set('issuerName', inv.issuer)
  fd.set('buyerName', inv.buyer)
  fd.set('currency', 'USD')
  fd.set('amount', String(inv.amount))
  fd.set('financingAmount', String(inv.financing))
  fd.set('invoiceDate', String(invoiceDate))
  fd.set('dueDate', String(dueTs))
  fd.set('submitTx', txHash)
  fd.set('file', new Blob([docBytes], { type: 'image/png' }), `${inv.number}.png`)

  const saveRes = await fetch(`${APP_URL}/api/invoices`, {
    method: 'POST', headers: await headers(), body: fd,
  })
  if (!saveRes.ok) {
    const e = await saveRes.json().catch(() => ({}))
    console.error(`  ✗ save failed: ${JSON.stringify(e)}`)
    continue
  }
  console.log(`  ✓ saved to backend`)

  // 4. Verify (runs CRE rules against mock API, records verdict onchain)
  const verRes = await fetch(`${APP_URL}/api/invoices/${id}/verify`, {
    method: 'POST', headers: await headers(),
  })
  const verData = await verRes.json().catch(() => ({}))
  if (verRes.ok) {
    console.log(`  ✓ verified → ${verData.verdict}`)
  } else {
    console.error(`  ✗ verify failed: ${JSON.stringify(verData)}`)
  }

  console.log()
}

console.log('Done.')
