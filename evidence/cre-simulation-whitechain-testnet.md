# CRE simulation against live Whitechain Sepolia (chain 1874)

InvoiceRegistry: [0xc11162A72F388Efb6Ddd0B73Eea578598d733122](https://explorer.testnet.whitechain.io/address/0xc11162A72F388Efb6Ddd0B73Eea578598d733122). External API is SIMULATED (apps/mock-registry). CRE CLI v1.39.0; Whitechain is an experimental chain (not in supported-chains).

## INV-1001

```
  Binary hash: 007fcdd5755f63a9c1afc45f83336cced811693c388a42cbc9dad159f6f9e973
2026-11-05T21:58:34Z [USER LOG] [verify] request invoiceId=0xe4f729cc5c74e26942b90175714ea77f0711eb25e5ea3b3620ff097d6805a571 invoiceNumber=INV-1001
2026-11-05T21:58:34Z [USER LOG] [verify] onchain: exists=true status=1 amount=10000000000 due=1796488089
2026-11-05T21:58:34Z [USER LOG] [verify] external: reachable=true found=true status=valid ref=ERP-SIM-INV-1001
2026-11-05T21:58:34Z [USER LOG] [verify] verdict=ELIGIBLE failed=-
"{\"invoiceId\":\"0xe4f729cc5c74e26942b90175714ea77f0711eb25e5ea3b3620ff097d6805a571\",\"documentHash\":\"0x540ec05c975bed54371262bcdd11e6fb7ff8b91dcdbe8c5c246cbe316331b153\",\"verdict\":\"ELIGIBLE\",\"failedChecks\":[],\"reviewReasons\":[],\"externalReference\":\"ERP-SIM-INV-1001\",\"timestamp\":1793896114}"
```

## INV-2002

```
  Binary hash: 007fcdd5755f63a9c1afc45f83336cced811693c388a42cbc9dad159f6f9e973
2026-11-05T21:58:41Z [USER LOG] [verify] request invoiceId=0x5bc18fa6ad7c59e2fd611726fcf5f234f82f305de25bcc9e4b2436811ab17f36 invoiceNumber=INV-2002
2026-11-05T21:58:41Z [USER LOG] [verify] onchain: exists=true status=1 amount=10000000000 due=1796488089
2026-11-05T21:58:41Z [USER LOG] [verify] external: reachable=true found=true status=valid ref=ERP-SIM-INV-2002
2026-11-05T21:58:41Z [USER LOG] [verify] verdict=REJECTED failed=amount_mismatch
"{\"invoiceId\":\"0x5bc18fa6ad7c59e2fd611726fcf5f234f82f305de25bcc9e4b2436811ab17f36\",\"documentHash\":\"0x963a39949220e11b912eb82abe23a38bb3c46ac9f859b17fba289e9398847daa\",\"verdict\":\"REJECTED\",\"failedChecks\":[\"amount_mismatch\"],\"reviewReasons\":[],\"externalReference\":\"ERP-SIM-INV-2002\",\"timestamp\":1793896121}"
```

## INV-3003

```
  Binary hash: 007fcdd5755f63a9c1afc45f83336cced811693c388a42cbc9dad159f6f9e973
2026-11-05T21:58:47Z [USER LOG] [verify] request invoiceId=0xbce02681f5ded4443b6d96afb1d09d80a3c570c9ed62d8278dd802111686d19b invoiceNumber=INV-3003
2026-11-05T21:58:48Z [USER LOG] [verify] onchain: exists=true status=1 amount=10000000000 due=1796488089
2026-11-05T21:58:48Z [USER LOG] [verify] external: reachable=true found=true status=disputed ref=ERP-SIM-INV-3003
2026-11-05T21:58:48Z [USER LOG] [verify] verdict=MANUAL_REVIEW failed=-
"{\"invoiceId\":\"0xbce02681f5ded4443b6d96afb1d09d80a3c570c9ed62d8278dd802111686d19b\",\"documentHash\":\"0x63cbc55140c10753b3c5684f5105d436f25ba66f09e33a07d2efcefae603bd13\",\"verdict\":\"MANUAL_REVIEW\",\"failedChecks\":[],\"reviewReasons\":[\"invoice_disputed_in_external_registry\"],\"externalReference\":\"ERP-SIM-INV-3003\",\"timestamp\":1793896128}"
```

## INV-4004

```
  Binary hash: 007fcdd5755f63a9c1afc45f83336cced811693c388a42cbc9dad159f6f9e973
2026-11-05T21:58:55Z [USER LOG] [verify] request invoiceId=0xf28d30905497d3439df88f2059caa8d8c91db55c42e576c6b063a5b94a53723c invoiceNumber=INV-4004
2026-11-05T21:58:55Z [USER LOG] [verify] onchain: exists=true status=1 amount=10000000000 due=1796488089
2026-11-05T21:58:55Z [USER LOG] [verify] external: reachable=true found=false status= ref=
2026-11-05T21:58:55Z [USER LOG] [verify] verdict=REJECTED failed=invoice_not_found_in_external_registry
"{\"invoiceId\":\"0xf28d30905497d3439df88f2059caa8d8c91db55c42e576c6b063a5b94a53723c\",\"documentHash\":\"0xbd9bb3892167b7ee463f90f3f787cf450dbe3101830242228afa0ccb0c58b61b\",\"verdict\":\"REJECTED\",\"failedChecks\":[\"invoice_not_found_in_external_registry\"],\"reviewReasons\":[],\"externalReference\":null,\"timestamp\":1793896135}"
```
