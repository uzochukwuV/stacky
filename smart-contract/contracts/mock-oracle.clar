;; MOCK ORACLE FOR TESTNET ONLY
;; =========================================================================
;; DO NOT USE IN PRODUCTION - This is for testing when Pyth feeds are unavailable

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-FEED-NOT-FOUND (err u404))

;; Mock price data structure (mimics Pyth format)
(define-map mock-prices
  (buff 32)  ;; feed-id
  {
    price: int,
    expo: int,
    conf: uint,
    publish-time: uint
  }
)

;; Set a mock price (only owner can do this)
(define-public (set-mock-price
  (feed-id (buff 32))
  (price int)
  (expo int))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (ok (map-set mock-prices feed-id
      {
        price: price,
        expo: expo,
        conf: u100,
        publish-time: (unwrap-panic (get-block-info? time (- block-height u1)))
      }))
  )
)

;; Mock verify-and-update (does nothing, just returns ok)
(define-public (verify-and-update-price-feeds
  (vaa (buff 8192))
  (config {
    pyth-storage-contract: principal,
    pyth-decoder-contract: principal,
    wormhole-core-contract: principal
  }))
  (ok true)
)

;; Get mock price (mimics Pyth's get-price)
(define-public (get-price
  (feed-id (buff 32))
  (storage-contract principal))
  (ok (unwrap! (map-get? mock-prices feed-id) ERR-FEED-NOT-FOUND))
)

;; Initialize common test prices
(define-public (init-test-prices)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    ;; BTC/USD = $100,000 (with expo -8)
    (try! (set-mock-price 
      0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43
      10000000000000
      -8))
    ;; STX/USD = $2.50 (with expo -8)
    (try! (set-mock-price
      0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17
      250000000
      -8))
    ;; USDC/USD = $1.00 (with expo -8)
    (try! (set-mock-price
      0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a
      100000000
      -8))
    ;; ETH/USD = $3,500 (with expo -8)
    (try! (set-mock-price
      0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace
      350000000000
      -8))
    (ok true)
  )
)

;; Read-only: get current mock price
(define-read-only (get-mock-price (feed-id (buff 32)))
  (map-get? mock-prices feed-id)
)