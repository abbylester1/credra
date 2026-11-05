// Swap native testnet WBT for the OFFICIAL Whitechain USDT through YetiTrade's SwapRouter02
// (pool WWBT/USDT, fee 0.3%), delivering the USDT straight to the investor wallet.
//
// YOU run this yourself. Default is a DRY RUN that only prints a quote. Add --execute to send the transaction.
//   cd apps/web && bun --env-file ../../.env scripts/swap-wbt-for-usdt.ts            # quote only
//   cd apps/web && bun --env-file ../../.env scripts/swap-wbt-for-usdt.ts 1 --execute # swap 1 WBT
//
// Pays with the DEPLOYER wallet (it holds the most faucet WBT). Test tokens have no value. Never prints keys.
import { createPublicClient, createWalletClient, defineChain, fallback, http, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const USDT = '0xcedfB56113143d55b2358b8CFbB0dEB5Ad2f55a7'
const WWBT = '0x4200000000000000000000000000000000000006'
const POOL = '0x5645101Ca8d2F7BaBC27b10359555767a1BdF999' // WWBT/USDT 0.3%
const ROUTER = '0xe208cC685cD95D56E8ec6DEC9816476567fc6962' // YetiTrade SwapRouter02
const FEE = 3000
const SLIPPAGE = 0.03

const chain = defineChain({ id: 1874, name: 'Whitechain Sepolia', nativeCurrency: { name: 'WBT', symbol: 'WBT', decimals: 18 }, rpcUrls: { default: { http: ['https://rpc.testnet.whitechain.io'] } } })
const transport = fallback([http('https://rpc.testnet.whitechain.io', { timeout: 15000 }), http('https://rpc.ankr.com/whitechain_testnet', { timeout: 15000 })])
const pub = createPublicClient({ chain, transport })
const payer = privateKeyToAccount(process.env.PRIVATE_KEY_DEPLOYER as `0x${string}`)
const recipient = process.env.INVESTOR_1 as `0x${string}`
const wallet = createWalletClient({ account: payer, chain, transport })

const poolAbi = [{ type: 'function', name: 'slot0', stateMutability: 'view', inputs: [], outputs: [{ name: 'sqrtPriceX96', type: 'uint160' }, { name: 'tick', type: 'int24' }, { name: 'a', type: 'uint16' }, { name: 'b', type: 'uint16' }, { name: 'c', type: 'uint16' }, { name: 'd', type: 'uint8' }, { name: 'e', type: 'bool' }] }] as const
const routerAbi = [{ type: 'function', name: 'exactInputSingle', stateMutability: 'payable', inputs: [{ name: 'params', type: 'tuple', components: [{ name: 'tokenIn', type: 'address' }, { name: 'tokenOut', type: 'address' }, { name: 'fee', type: 'uint24' }, { name: 'recipient', type: 'address' }, { name: 'amountIn', type: 'uint256' }, { name: 'amountOutMinimum', type: 'uint256' }, { name: 'sqrtPriceLimitX96', type: 'uint160' }] }], outputs: [{ name: 'amountOut', type: 'uint256' }] }] as const
const erc20 = [{ type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'a', type: 'address' }], outputs: [{ type: 'uint256' }] }] as const

const wbt = Number(process.argv.find((a) => /^\d+(\.\d+)?$/.test(a)) ?? '1')
const execute = process.argv.includes('--execute')
const amountIn = parseEther(String(wbt))

const [s0, bal, usdtBefore] = await Promise.all([
	pub.readContract({ address: POOL, abi: poolAbi, functionName: 'slot0' }),
	pub.getBalance({ address: payer.address }),
	pub.readContract({ address: USDT, abi: erc20, functionName: 'balanceOf', args: [recipient] }),
])
const price = (Number(s0[0]) / 2 ** 96) ** 2 * 1e12 // USDT per WBT (18 vs 6 decimals)
const expected = wbt * price * (1 - FEE / 1e6)
const minOut = BigInt(Math.floor(expected * (1 - SLIPPAGE) * 1e6))

console.log(`Pool price: 1 WBT = ${price.toFixed(2)} USDT`)
console.log(`Swap ${wbt} WBT -> about ${expected.toFixed(2)} USDT (minimum accepted ${(Number(minOut) / 1e6).toFixed(2)})`)
console.log(`Payer ${payer.address} has ${(Number(bal) / 1e18).toFixed(4)} WBT. USDT goes to ${recipient} (now ${(Number(usdtBefore) / 1e6).toFixed(2)} USDT)`)
if (bal < amountIn + parseEther('0.1')) { console.log('Stop: keep at least 0.1 WBT for gas. Use a smaller amount.'); process.exit(1) }
if (!execute) { console.log('\nDry run only. Re-run with --execute to send the swap.'); process.exit(0) }

const hash = await wallet.writeContract({
	address: ROUTER, abi: routerAbi, functionName: 'exactInputSingle', value: amountIn,
	args: [{ tokenIn: WWBT, tokenOut: USDT, fee: FEE, recipient, amountIn, amountOutMinimum: minOut, sqrtPriceLimitX96: 0n }],
})
const rc = await pub.waitForTransactionReceipt({ hash, timeout: 90_000 })
const usdtAfter = await pub.readContract({ address: USDT, abi: erc20, functionName: 'balanceOf', args: [recipient] })
console.log(`${rc.status === 'success' ? 'ok' : 'FAILED'}  https://explorer.testnet.whitechain.io/tx/${hash}`)
console.log(`Investor USDT: ${(Number(usdtAfter) / 1e6).toFixed(2)}`)
