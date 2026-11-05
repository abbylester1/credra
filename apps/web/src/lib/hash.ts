import { keccak256, stringToBytes, type Hex } from 'viem'

/** keccak256 of the raw file bytes: the fingerprint registered onchain. */
export const documentHash = (bytes: Uint8Array): Hex => keccak256(bytes)

/** invoiceId = keccak256(utf8(invoiceNumber)); must match scripts/seed-demo.sh. */
export const invoiceId = (invoiceNumber: string): Hex => keccak256(stringToBytes(invoiceNumber))

/** Hashed buyer identifier, never plaintext onchain; matches scripts/seed-demo.sh. */
export const buyerRef = (buyerName: string): Hex => keccak256(stringToBytes(`buyer:${buyerName}`))

/** keccak256 of the verification report JSON, passed to recordVerification as verificationRef. */
export const reportRef = (reportJson: string): Hex => keccak256(stringToBytes(reportJson))
