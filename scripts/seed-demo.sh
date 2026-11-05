#!/usr/bin/env bash
# Submits demo invoices to the InvoiceRegistry and seeds the SIMULATED external API.
# Required env: RPC, REGISTRY, BUSINESS_KEY, API (default http://localhost:8787)
# Scenarios: 1001 valid | 2002 amount mismatch | 3003 disputed | 4004 not in external registry
set -euo pipefail
export PATH="$HOME/.foundry/bin:$PATH"
API="${API:-http://localhost:8787}"
BIZ=$(cast wallet address --private-key "$BUSINESS_KEY")
DUE=$(( $(date +%s) + 30*24*3600 ))
AMOUNT=10000000000   # 10,000 USDT (6 decimals)
ADVANCE=9000000000   # 9,000 USDT

submit() { # num extApiAmount extApiStatus seedApi(yes/no)
  local num="$1" apiAmount="$2" apiStatus="$3" seed="$4"
  local id doc buyer
  id=$(cast keccak "INV-$num"); doc=$(cast keccak "pdf:INV-$num:$RANDOM"); buyer=$(cast keccak "buyer:Acme Corp")
  cast send "$REGISTRY" "submitInvoice(bytes32,bytes32,bytes32,uint256,uint256,uint64)" \
    "$id" "$doc" "$buyer" "$AMOUNT" "$ADVANCE" "$DUE" --private-key "$BUSINESS_KEY" --rpc-url "$RPC" >/dev/null
  if [ "$seed" = yes ]; then
    curl -s -X POST "$API/admin/invoices" -H 'content-type: application/json' -d "{
      \"invoiceNumber\":\"INV-$num\",\"issuerName\":\"Demo Exports Ltd\",\"issuerWallet\":\"$BIZ\",
      \"buyerName\":\"Acme Corp\",\"buyerRef\":\"$buyer\",\"amount\":\"$apiAmount\",\"dueDate\":$DUE,
      \"documentHash\":\"$doc\",\"status\":\"$apiStatus\"}" >/dev/null
  fi
  echo "INV-$num  invoiceId=$id"
}
submit 1001 "$AMOUNT"       valid    yes
submit 2002 "9500000000"    valid    yes
submit 3003 "$AMOUNT"       disputed yes
submit 4004 "$AMOUNT"       valid    no
