# CRE workflow simulation evidence

Local Anvil node (chain id 1874) + SIMULATED external verification API (apps/mock-registry). CRE CLI v1.39.0. Whitechain is not in the CRE supported-chains list (evidence/cre-supported-chains.txt) so it is an experimental chain.

## INV-1001

```
  Binary hash: 007fcdd5755f63a9c1afc45f83336cced811693c388a42cbc9dad159f6f9e973
2026-11-05T21:19:54Z [USER LOG] [verify] request invoiceId=0xe4f729cc5c74e26942b90175714ea77f0711eb25e5ea3b3620ff097d6805a571 invoiceNumber=INV-1001
2026-11-05T21:19:54Z [USER LOG] [verify] onchain: exists=true status=1 amount=10000000000 due=1796485715
2026-11-05T21:19:54Z [USER LOG] [verify] external: reachable=true found=true status=valid ref=ERP-SIM-INV-1001
2026-11-05T21:19:54Z [USER LOG] [verify] verdict=ELIGIBLE failed=-
✓ Workflow Simulation Result:
"{\"invoiceId\":\"0xe4f729cc5c74e26942b90175714ea77f0711eb25e5ea3b3620ff097d6805a571\",\"documentHash\":\"0x089bb45bc62113cf8415ae26c1dc0c32b001b5db89251a37620642361818c8b2\",\"verdict\":\"ELIGIBLE\",\"failedChecks\":[],\"reviewReasons\":[],\"externalReference\":\"ERP-SIM-INV-1001\",\"timestamp\":1793893794}"
```

## INV-2002

```
  Binary hash: 007fcdd5755f63a9c1afc45f83336cced811693c388a42cbc9dad159f6f9e973
2026-11-05T21:20:00Z [USER LOG] [verify] request invoiceId=0x5bc18fa6ad7c59e2fd611726fcf5f234f82f305de25bcc9e4b2436811ab17f36 invoiceNumber=INV-2002
2026-11-05T21:20:00Z [USER LOG] [verify] onchain: exists=true status=1 amount=10000000000 due=1796485715
2026-11-05T21:20:00Z [USER LOG] [verify] external: reachable=true found=true status=valid ref=ERP-SIM-INV-2002
2026-11-05T21:20:00Z [USER LOG] [verify] verdict=REJECTED failed=amount_mismatch
✓ Workflow Simulation Result:
"{\"invoiceId\":\"0x5bc18fa6ad7c59e2fd611726fcf5f234f82f305de25bcc9e4b2436811ab17f36\",\"documentHash\":\"0xd7c3b1c571ab1949ab542d5d91299700a70e73fb1258c0e560d30c5378a591e6\",\"verdict\":\"REJECTED\",\"failedChecks\":[\"amount_mismatch\"],\"reviewReasons\":[],\"externalReference\":\"ERP-SIM-INV-2002\",\"timestamp\":1793893800}"
```

## INV-3003

```
  Binary hash: 007fcdd5755f63a9c1afc45f83336cced811693c388a42cbc9dad159f6f9e973
2026-11-05T21:20:07Z [USER LOG] [verify] request invoiceId=0xbce02681f5ded4443b6d96afb1d09d80a3c570c9ed62d8278dd802111686d19b invoiceNumber=INV-3003
2026-11-05T21:20:07Z [USER LOG] [verify] onchain: exists=true status=1 amount=10000000000 due=1796485715
2026-11-05T21:20:07Z [USER LOG] [verify] external: reachable=true found=true status=disputed ref=ERP-SIM-INV-3003
2026-11-05T21:20:07Z [USER LOG] [verify] verdict=MANUAL_REVIEW failed=-
✓ Workflow Simulation Result:
"{\"invoiceId\":\"0xbce02681f5ded4443b6d96afb1d09d80a3c570c9ed62d8278dd802111686d19b\",\"documentHash\":\"0x276470a4de0054ca709cfa5997ec439292500f0892e4acfd10c37875c62d6af6\",\"verdict\":\"MANUAL_REVIEW\",\"failedChecks\":[],\"reviewReasons\":[\"invoice_disputed_in_external_registry\"],\"externalReference\":\"ERP-SIM-INV-3003\",\"timestamp\":1793893807}"
```

## INV-4004

```
  Binary hash: 007fcdd5755f63a9c1afc45f83336cced811693c388a42cbc9dad159f6f9e973
2026-11-05T21:20:13Z [USER LOG] [verify] request invoiceId=0xf28d30905497d3439df88f2059caa8d8c91db55c42e576c6b063a5b94a53723c invoiceNumber=INV-4004
2026-11-05T21:20:13Z [USER LOG] [verify] onchain: exists=true status=1 amount=10000000000 due=1796485715
2026-11-05T21:20:13Z [USER LOG] [verify] external: reachable=true found=false status= ref=
2026-11-05T21:20:13Z [USER LOG] [verify] verdict=REJECTED failed=invoice_not_found_in_external_registry
✓ Workflow Simulation Result:
"{\"invoiceId\":\"0xf28d30905497d3439df88f2059caa8d8c91db55c42e576c6b063a5b94a53723c\",\"documentHash\":\"0xce25d4250bee5bf39d31cad649dedda9948cb5ba695e6688ca37a618bf2abf30\",\"verdict\":\"REJECTED\",\"failedChecks\":[\"invoice_not_found_in_external_registry\"],\"reviewReasons\":[],\"externalReference\":null,\"timestamp\":1793893813}"
```
