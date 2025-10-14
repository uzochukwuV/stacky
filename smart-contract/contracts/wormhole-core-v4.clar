;; Mock Wormhole Core V4 for testing

(define-public (verify-vaa (vaa (buff 8192)))
  (ok true)
)

(define-read-only (parse-vaa (vaa (buff 8192)))
  (ok {
    version: u1,
    guardian-set-index: u0,
    signatures: (list),
    timestamp: u1750425711,
    nonce: u0,
    emitter-chain: u1,
    emitter-address: 0x0000000000000000000000000000000000000000000000000000000000000000,
    sequence: u0,
    consistency-level: u0,
    payload: 0x00
  })
)