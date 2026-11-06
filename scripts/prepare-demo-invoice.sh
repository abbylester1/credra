#!/usr/bin/env bash
# Registers ONE unverified, unfunded demo invoice (default 50,000 USDT) and seeds the SIMULATED external API,
# so `cre workflow simulate` shows an ELIGIBLE verdict at a realistic size on camera.
# The CRE simulation only reads state, so the invoice stays Submitted and can be simulated for any number of takes.
# Usage: set -a && . ./.env && set +a && ./scripts/prepare-demo-invoice.sh [NUMBER] [AMOUNT_USDT] [FINANCING_USDT]
set -euo pipefail
export PATH="$HOME/.foundry/bin:$PATH"
NUM="${1:-MTX-2026-0417}"; AMT="${2:-50000}"; FIN="${3:-45000}"
RPC="${WHITECHAIN_RPC:?}"; API="${API:-http://localhost:8787}"
REGISTRY="${REGISTRY:-0xc11162A72F388Efb6Ddd0B73Eea578598d733122}"
ISSUER_NAME="${ISSUER_NAME:-Meridian Textiles Ltd}"
BIZ=$(cast wallet address --private-key "$PRIVATE_KEY_BUSINESS")
ID=$(cast keccak "$NUM"); DOC=$(cast keccak "pdf:$NUM:demo"); BUYER=$(cast keccak "buyer:Acme Corp")
AMOUNT=$(( AMT * 1000000 )); ADVANCE=$(( FIN * 1000000 )); DUE=$(( $(date +%s) + 30*24*3600 ))
STATUS=$(cast call "$REGISTRY" "getInvoice(bytes32)((bytes32,bytes32,bytes32,bytes32,address,uint256,uint256,uint64,uint8))" "$ID" --rpc-url "$RPC" | tr -d '()' | awk -F', ' '{print $NF}')
if [ "${STATUS:-0}" != "0" ]; then echo "$NUM is already registered (status $STATUS). Pick another number."; exit 1; fi
cast send "$REGISTRY" "submitInvoice(bytes32,bytes32,bytes32,uint256,uint256,uint64)" "$ID" "$DOC" "$BUYER" "$AMOUNT" "$ADVANCE" "$DUE" --private-key "$PRIVATE_KEY_BUSINESS" --rpc-url "$RPC" >/dev/null
curl -s -X POST "$API/admin/invoices" -H 'content-type: application/json' -d "{\"invoiceNumber\":\"$NUM\",\"issuerName\":\"$ISSUER_NAME\",\"issuerWallet\":\"$BIZ\",\"buyerName\":\"Acme Corp\",\"buyerRef\":\"$BUYER\",\"amount\":\"$AMOUNT\",\"dueDate\":$DUE,\"documentHash\":\"$DOC\",\"status\":\"valid\"}" >/dev/null
echo "Registered $NUM  invoiceId=$ID"
echo "Terminal command:"
echo "cd cre && cre workflow simulate invoice-verification -T staging-settings --non-interactive --trigger-index 0 --http-payload '{\"invoiceId\":\"$ID\",\"invoiceNumber\":\"$NUM\"}'"
