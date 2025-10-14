;; Mock Pyth PNAU Decoder V3 for testing

(define-read-only (decode-price-feed (data (buff 8192)))
  (ok {
    price-identifier: 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43,
    price: 6000000000000,
    conf: u100000000,
    ema-price: 6000000000000,
    ema-conf: u100000000,
    expo: -8,
    publish-time: u1750425711,
    prev-publish-time: u1750425710
  })
)