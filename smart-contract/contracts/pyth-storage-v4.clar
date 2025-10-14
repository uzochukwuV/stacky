;; Mock Pyth Storage V4 for testing

(define-read-only (get-price (feed-id (buff 32)))
  (ok {
    price-identifier: feed-id,
    price: 6000000000000,
    conf: u100000000,
    ema-price: 6000000000000,
    ema-conf: u100000000,
    expo: -8,
    publish-time: u1750425711,
    prev-publish-time: u1750425710
  })
)