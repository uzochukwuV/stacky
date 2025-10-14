;; mock-pyth-oracle.clar
;; Mock Pyth Oracle for testing purposes
;; Simulates the Pyth oracle interface without requiring actual VAA messages

;; =========================================================================
;; DATA MAPS
;; =========================================================================

(define-map mock-prices
  (buff 32) ;; feed-id
  {
    price: int,
    conf: uint,
    expo: int,
    ema-price: int,
    ema-conf: uint,
    publish-time: uint,
    prev-publish-time: uint,
    price-identifier: (buff 32)
  }
)

;; =========================================================================
;; CONSTANTS & ERRORS
;; =========================================================================

(define-constant ERR-PRICE-NOT-FOUND (err u404))
(define-constant CONTRACT-OWNER tx-sender)

;; =========================================================================
;; ADMIN FUNCTIONS
;; =========================================================================

;; Set a mock price for testing
(define-public (set-mock-price 
  (feed-id (buff 32))
  (price int)
  (conf uint)
  (expo int))
  (ok (map-set mock-prices feed-id {
    price: price,
    conf: conf,
    expo: expo,
    ema-price: price,
    ema-conf: conf,
    publish-time: burn-block-height,
    prev-publish-time: (- burn-block-height u1),
    price-identifier: feed-id
  }))
)

;; =========================================================================
;; MOCK PYTH ORACLE INTERFACE
;; =========================================================================

;; Mock verify-and-update-price-feeds (accepts any VAA, does nothing)
(define-public (verify-and-update-price-feeds 
  (vaa (buff 8192))
  (contracts {
    pyth-storage-contract: principal,
    pyth-decoder-contract: principal,
    wormhole-core-contract: principal
  }))
  (ok true)
)

;; Get price (returns mock price data)
(define-read-only (get-price 
  (feed-id (buff 32))
  (storage-contract principal))
  (ok (unwrap! (map-get? mock-prices feed-id) ERR-PRICE-NOT-FOUND))
)