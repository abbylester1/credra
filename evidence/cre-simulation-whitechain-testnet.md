# CRE simulation against live Whitechain Sepolia (chain 1874)

InvoiceRegistry: [0x37645b05895b66E4ed4a4578D3Ed1A091E9ab209](https://explorer.testnet.whitechain.io/address/0x37645b05895b66E4ed4a4578D3Ed1A091E9ab209). External API is SIMULATED (apps/mock-registry). CRE CLI v1.39.0; Whitechain is an experimental chain (not in supported-chains).

## INV-1001

```
  Binary hash: 007fcdd5755f63a9c1afc45f83336cced811693c388a42cbc9dad159f6f9e973
2026-11-05T21:48:20Z [USER LOG] [verify] request invoiceId=0xe4f729cc5c74e26942b90175714ea77f0711eb25e5ea3b3620ff097d6805a571 invoiceNumber=INV-1001
2026-11-05T21:48:20Z [USER LOG] [verify] onchain: exists=true status=1 amount=10000000000 due=1796487440
2026-11-05T21:48:20Z [USER LOG] [verify] external: reachable=true found=true status=valid ref=ERP-SIM-INV-1001
2026-11-05T21:48:20Z [USER LOG] [verify] verdict=ELIGIBLE failed=-
"{\"invoiceId\":\"0xe4f729cc5c74e26942b90175714ea77f0711eb25e5ea3b3620ff097d6805a571\",\"documentHash\":\"0x784c4f2789079cd71c35d31160206bf24702501c84cee5ae8bf5b06180fc6958\",\"verdict\":\"ELIGIBLE\",\"failedChecks\":[],\"reviewReasons\":[],\"externalReference\":\"ERP-SIM-INV-1001\",\"timestamp\":1793895500}"
```

## INV-2002

```
  Binary hash: 007fcdd5755f63a9c1afc45f83336cced811693c388a42cbc9dad159f6f9e973
2026-11-05T21:48:27Z [USER LOG] [verify] request invoiceId=0x5bc18fa6ad7c59e2fd611726fcf5f234f82f305de25bcc9e4b2436811ab17f36 invoiceNumber=INV-2002
2026-11-05T21:48:27Z [USER LOG] [verify] onchain: exists=true status=1 amount=10000000000 due=1796487440
2026-11-05T21:48:27Z [USER LOG] [verify] external: reachable=true found=true status=valid ref=ERP-SIM-INV-2002
2026-11-05T21:48:27Z [USER LOG] [verify] verdict=REJECTED failed=amount_mismatch
"{\"invoiceId\":\"0x5bc18fa6ad7c59e2fd611726fcf5f234f82f305de25bcc9e4b2436811ab17f36\",\"documentHash\":\"0xec90096446baa87a4e6d4a0a903c1b813dcb59897331c2a022dbfda9f78f469e\",\"verdict\":\"REJECTED\",\"failedChecks\":[\"amount_mismatch\"],\"reviewReasons\":[],\"externalReference\":\"ERP-SIM-INV-2002\",\"timestamp\":1793895507}"
```

## INV-3003

```
  Binary hash: 007fcdd5755f63a9c1afc45f83336cced811693c388a42cbc9dad159f6f9e973
2026-11-05T21:48:35Z [USER LOG] [verify] request invoiceId=0xbce02681f5ded4443b6d96afb1d09d80a3c570c9ed62d8278dd802111686d19b invoiceNumber=INV-3003
2026-11-05T21:48:35Z [USER LOG] [verify] onchain: exists=true status=1 amount=10000000000 due=1796487440
2026-11-05T21:48:35Z [USER LOG] [verify] external: reachable=true found=true status=disputed ref=ERP-SIM-INV-3003
2026-11-05T21:48:35Z [USER LOG] [verify] verdict=MANUAL_REVIEW failed=-
"{\"invoiceId\":\"0xbce02681f5ded4443b6d96afb1d09d80a3c570c9ed62d8278dd802111686d19b\",\"documentHash\":\"0x96c04c74d0f327f6581eb2d44021d82dafb7db8815cce173e3d7f4157eced888\",\"verdict\":\"MANUAL_REVIEW\",\"failedChecks\":[],\"reviewReasons\":[\"invoice_disputed_in_external_registry\"],\"externalReference\":\"ERP-SIM-INV-3003\",\"timestamp\":1793895515}"
```

## INV-4004

```
  Binary hash: 007fcdd5755f63a9c1afc45f83336cced811693c388a42cbc9dad159f6f9e973
2026-11-05T21:48:42Z [USER LOG] [verify] request invoiceId=0xf28d30905497d3439df88f2059caa8d8c91db55c42e576c6b063a5b94a53723c invoiceNumber=INV-4004
2026-11-05T21:48:42Z [USER LOG] [verify] onchain: exists=true status=1 amount=10000000000 due=1796487440
2026-11-05T21:48:42Z [USER LOG] [verify] external: reachable=true found=false status= ref=
2026-11-05T21:48:42Z [USER LOG] [verify] verdict=REJECTED failed=invoice_not_found_in_external_registry
"{\"invoiceId\":\"0xf28d30905497d3439df88f2059caa8d8c91db55c42e576c6b063a5b94a53723c\",\"documentHash\":\"0x9c382215d16fd0b56921ba9c5fa564cfbc6aac5bed4e1e11b8e1dc327c674b11\",\"verdict\":\"REJECTED\",\"failedChecks\":[\"invoice_not_found_in_external_registry\"],\"reviewReasons\":[],\"externalReference\":null,\"timestamp\":1793895522}"
```
