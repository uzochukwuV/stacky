;; Mock Pyth Oracle V4 for testing

(define-trait oracle-trait
  (
    ;; Get price function
    (get-price ((buff 32) principal) (response {
      price: int,
      conf: uint,
      expo: int,
      ema-price: int,
      ema-conf: uint,
      publish-time: uint,
      prev-publish-time: uint,
      price-identifier: (buff 32)
    } uint))

    ;; Verify and update price feeds
    (verify-and-update-price-feeds 
      ((buff 8192) {
        pyth-storage-contract: principal,
        pyth-decoder-contract: principal,
        wormhole-core-contract: principal
      }) 
      (response bool uint))
  )
)



(define-public (verify-and-update-price-feeds (vaa (buff 8192)) (config { pyth-storage-contract: principal, pyth-decoder-contract: principal, wormhole-core-contract: principal }))
  (ok true)
)

(define-public (get-price (feed-id (buff 32)) (storage-contract principal))
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