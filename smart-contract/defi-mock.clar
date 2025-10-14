;; =========================================================================
;; ORACLE-POWERED LIQUIDITY POOL
;; =========================================================================
;; Single-sided liquidity pools using Pyth oracle for swap pricing
;; No impermanent loss - LPs earn fees on their deposited tokens

;; =========================================================================
;; CONSTANTS & ERRORS
;; =========================================================================

(define-constant CONTRACT-OWNER tx-sender)

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-ZERO-AMOUNT (err u402))
(define-constant ERR-INSUFFICIENT-LIQUIDITY (err u403))
(define-constant ERR-SLIPPAGE-EXCEEDED (err u404))
(define-constant ERR-PAIR-NOT-SUPPORTED (err u405))
(define-constant ERR-PAIR-DISABLED (err u406))
(define-constant ERR-NO-POSITION (err u407))
(define-constant ERR-INSUFFICIENT-SHARES (err u408))
(define-constant ERR-DIVISION-BY-ZERO (err u409))
(define-constant ERR-TRANSFER-FAILED (err u410))

;; Fee configuration (basis points: 10000 = 100%)
(define-constant FEE-LP-BPS u25)         ;; 0.25% to LPs
(define-constant FEE-PROTOCOL-BPS u5)    ;; 0.05% to protocol
(define-constant TOTAL-FEE-BPS u30)      ;; 0.30% total fee
(define-constant BPS-BASE u10000)

;; Minimum liquidity (prevents division errors like Uniswap V2)
(define-constant MINIMUM-LIQUIDITY u1000)

;; Precision multiplier for fee calculations (prevents rounding errors)
(define-constant PRECISION u1000000)

;; Oracle Addresses - CHANGE THESE FOR TESTNET vs MAINNET
;; MAINNET: Use Pyth Oracle
;; (define-constant PYTH-ORACLE 'SP3R4F6C1J3JQWWCVZ3S7FRRYPMYG6ZW6RZK31FXY.pyth-oracle-v4)
;; (define-constant PYTH-STORAGE 'SP3R4F6C1J3JQWWCVZ3S7FRRYPMYG6ZW6RZK31FXY.pyth-storage-v4)
;; (define-constant PYTH-DECODER 'SP3R4F6C1J3JQWWCVZ3S7FRRYPMYG6ZW6RZK31FXY.pyth-pnau-decoder-v3)
;; (define-constant WORMHOLE-CORE 'SP3R4F6C1J3JQWWCVZ3S7FRRYPMYG6ZW6RZK31FXY.wormhole-core-v4)

;; TESTNET: Use Mock Oracle (deploy mock-oracle-testnet.clar first, then update this)
(define-constant PYTH-ORACLE '<YOUR-ADDRESS>.mock-oracle-testnet)
(define-constant PYTH-STORAGE '<YOUR-ADDRESS>.mock-oracle-testnet)
(define-constant PYTH-DECODER '<YOUR-ADDRESS>.mock-oracle-testnet)
(define-constant WORMHOLE-CORE '<YOUR-ADDRESS>.mock-oracle-testnet)

;; =========================================================================
;; DATA VARIABLES
;; =========================================================================

(define-data-var protocol-treasury principal tx-sender)

;; =========================================================================
;; DATA MAPS
;; =========================================================================

;; Liquidity pools per token
(define-map pools
  { token: principal }
  {
    total-liquidity: uint,
    total-shares: uint,
    fee-pool: uint,           ;; Accumulated LP fees
    locked-liquidity: uint    ;; MINIMUM-LIQUIDITY locked forever
  }
)

;; Individual LP positions
(define-map positions
  { user: principal, token: principal }
  {
    shares: uint,
    fee-debt: uint           ;; For fair fee distribution
  }
)

;; Trading pairs with oracle feed IDs
(define-map pairs
  { token-in: principal, token-out: principal }
  {
    enabled: bool,
    feed-id-in: (buff 32),
    feed-id-out: (buff 32)
  }
)

;; Protocol fee accumulation per token
(define-map protocol-fees
  { token: principal }
  { amount: uint }
)

;; =========================================================================
;; PRIVATE FUNCTIONS FOR TOKEN TRANSFERS
;; =========================================================================

(define-private (transfer-token (token principal) (amount uint) (sender principal) (recipient principal))
  (let ((transfer-result (contract-call? token transfer amount sender recipient none)))
    (match transfer-result
      success (ok success)
      error (err ERR-TRANSFER-FAILED)))
)

;; =========================================================================
;; ADMIN FUNCTIONS
;; =========================================================================

(define-public (set-treasury (new-treasury principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set protocol-treasury new-treasury)
    (ok true)
  )
)

(define-public (add-pair
  (token-in principal)
  (token-out principal)
  (feed-id-in (buff 32))
  (feed-id-out (buff 32)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (ok (map-set pairs
      { token-in: token-in, token-out: token-out }
      { enabled: true, feed-id-in: feed-id-in, feed-id-out: feed-id-out }))
  )
)

(define-public (toggle-pair
  (token-in principal)
  (token-out principal)
  (enabled bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (let ((pair (unwrap! (map-get? pairs { token-in: token-in, token-out: token-out }) ERR-PAIR-NOT-SUPPORTED)))
      (ok (map-set pairs
        { token-in: token-in, token-out: token-out }
        (merge pair { enabled: enabled }))))
  )
)

;; =========================================================================
;; LIQUIDITY PROVIDER FUNCTIONS
;; =========================================================================

(define-public (add-liquidity (token principal) (amount uint))
  (let (
    (pool (default-to
      { total-liquidity: u0, total-shares: u0, fee-pool: u0, locked-liquidity: u0 }
      (map-get? pools { token: token })))
    (user-pos (default-to
      { shares: u0, fee-debt: u0 }
      (map-get? positions { user: tx-sender, token: token })))
  )
    ;; Validation
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    
    ;; Calculate shares
    (let (
      (new-shares (if (is-eq (get total-shares pool) u0)
        ;; First LP: lock MINIMUM-LIQUIDITY, give rest as shares
        (begin
          (asserts! (> amount MINIMUM-LIQUIDITY) ERR-ZERO-AMOUNT)
          (- amount MINIMUM-LIQUIDITY))
        ;; Subsequent LPs: proportional shares
        (/ (* amount (get total-shares pool)) (get total-liquidity pool))))
      
      ;; Calculate fee debt (prevents claiming old fees)
      (fee-per-share (if (> (get total-shares pool) u0)
        (/ (* (get fee-pool pool) PRECISION) (get total-shares pool))
        u0))
      (additional-fee-debt (/ (* new-shares fee-per-share) PRECISION))
    )
      ;; Transfer tokens from user to contract
      (unwrap! (transfer-token token amount tx-sender (as-contract tx-sender)) ERR-TRANSFER-FAILED)
      
      ;; Update pool
      (map-set pools { token: token }
        {
          total-liquidity: (+ (get total-liquidity pool) amount),
          total-shares: (+ (get total-shares pool) new-shares),
          fee-pool: (get fee-pool pool),
          locked-liquidity: (if (is-eq (get total-shares pool) u0)
            MINIMUM-LIQUIDITY
            (get locked-liquidity pool))
        })
      
      ;; Update user position
      (map-set positions { user: tx-sender, token: token }
        {
          shares: (+ (get shares user-pos) new-shares),
          fee-debt: (+ (get fee-debt user-pos) additional-fee-debt)
        })
      
      (print {
        event: "add-liquidity",
        user: tx-sender,
        token: token,
        amount: amount,
        shares: new-shares
      })
      
      (ok new-shares)
    )
  )
)

(define-public (remove-liquidity (token principal) (shares uint))
  (let (
    (pool (unwrap! (map-get? pools { token: token }) ERR-INSUFFICIENT-LIQUIDITY))
    (user-pos (unwrap! (map-get? positions { user: tx-sender, token: token }) ERR-NO-POSITION))
  )
    ;; Validations
    (asserts! (> shares u0) ERR-ZERO-AMOUNT)
    (asserts! (<= shares (get shares user-pos)) ERR-INSUFFICIENT-SHARES)
    
    (let (
      ;; Calculate withdrawal amount (proportional to shares)
      (withdraw-amt (/ (* shares (get total-liquidity pool)) (get total-shares pool)))
      
      ;; Calculate unclaimed fees
      (fee-per-share (/ (* (get fee-pool pool) PRECISION) (get total-shares pool)))
      (total-fee-entitled (/ (* (get shares user-pos) fee-per-share) PRECISION))
      (unclaimed-fees (- total-fee-entitled (get fee-debt user-pos)))
      
      ;; Total to withdraw
      (total-withdraw (+ withdraw-amt unclaimed-fees))
      
      ;; Remaining position
      (remaining-shares (- (get shares user-pos) shares))
      (remaining-fee-debt (if (is-eq remaining-shares u0)
        u0
        (/ (* remaining-shares fee-per-share) PRECISION)))
    )
      ;; Transfer tokens + fees to user
      (unwrap! (as-contract (transfer-token token total-withdraw tx-sender tx-sender)) ERR-TRANSFER-FAILED)
      
      ;; Update pool
      (map-set pools { token: token }
        {
          total-liquidity: (- (get total-liquidity pool) withdraw-amt),
          total-shares: (- (get total-shares pool) shares),
          fee-pool: (- (get fee-pool pool) unclaimed-fees),
          locked-liquidity: (get locked-liquidity pool)
        })
      
      ;; Update or delete user position
      (if (is-eq remaining-shares u0)
        (map-delete positions { user: tx-sender, token: token })
        (map-set positions { user: tx-sender, token: token }
          { shares: remaining-shares, fee-debt: remaining-fee-debt }))
      
      (print {
        event: "remove-liquidity",
        user: tx-sender,
        token: token,
        shares: shares,
        amount: withdraw-amt,
        fees: unclaimed-fees
      })
      
      (ok { amount: withdraw-amt, fees: unclaimed-fees })
    )
  )
)

;; =========================================================================
;; SWAP FUNCTION
;; =========================================================================

(define-public (swap
  (token-in principal)
  (token-out principal)
  (amount-in uint)
  (min-amount-out uint)
  (vaa-in (buff 8192))
  (vaa-out (buff 8192)))
  (let (
    (pair (unwrap! (map-get? pairs { token-in: token-in, token-out: token-out }) ERR-PAIR-NOT-SUPPORTED))
    (pool-out (unwrap! (map-get? pools { token: token-out }) ERR-INSUFFICIENT-LIQUIDITY))
  )
    ;; Validations
    (asserts! (> amount-in u0) ERR-ZERO-AMOUNT)
    (asserts! (get enabled pair) ERR-PAIR-DISABLED)
    
    ;; Update oracle prices and calculate swap
    (let (
      ;; Update price feeds
      (_ (try! (contract-call? PYTH-ORACLE verify-and-update-price-feeds vaa-in {
        pyth-storage-contract: PYTH-STORAGE,
        pyth-decoder-contract: PYTH-DECODER,
        wormhole-core-contract: WORMHOLE-CORE
      })))
      (_ (try! (contract-call? PYTH-ORACLE verify-and-update-price-feeds vaa-out {
        pyth-storage-contract: PYTH-STORAGE,
        pyth-decoder-contract: PYTH-DECODER,
        wormhole-core-contract: WORMHOLE-CORE
      })))
      
      ;; Get prices
      (price-in (try! (contract-call? PYTH-ORACLE get-price (get feed-id-in pair) PYTH-STORAGE)))
      (price-out (try! (contract-call? PYTH-ORACLE get-price (get feed-id-out pair) PYTH-STORAGE)))
      
      ;; Adjust for exponents
      (adj-price-in (adjust-price (get price price-in) (get expo price-in)))
      (adj-price-out (adjust-price (get price price-out) (get expo price-out)))
      
      ;; Calculate output: (amount-in * price-in) / price-out
      (amount-out-gross (/ (* amount-in adj-price-in) adj-price-out))
      
      ;; Calculate fees
      (total-fee (/ (* amount-out-gross TOTAL-FEE-BPS) BPS-BASE))
      (lp-fee (/ (* amount-out-gross FEE-LP-BPS) BPS-BASE))
      (protocol-fee (/ (* amount-out-gross FEE-PROTOCOL-BPS) BPS-BASE))
      (amount-out-net (- amount-out-gross total-fee))
    )
      ;; Check slippage and liquidity
      (asserts! (>= amount-out-net min-amount-out) ERR-SLIPPAGE-EXCEEDED)
      (asserts! (>= (get total-liquidity pool-out) amount-out-net) ERR-INSUFFICIENT-LIQUIDITY)
      
      ;; Execute swap
      (unwrap! (transfer-token token-in amount-in tx-sender (as-contract tx-sender)) ERR-TRANSFER-FAILED)
      (unwrap! (as-contract (transfer-token token-out amount-out-net tx-sender tx-sender)) ERR-TRANSFER-FAILED)
      
      ;; Update pool with fees
      (map-set pools { token: token-out }
        (merge pool-out {
          total-liquidity: (- (get total-liquidity pool-out) amount-out-net),
          fee-pool: (+ (get fee-pool pool-out) lp-fee)
        }))
      
      ;; Accumulate protocol fees
      (let ((current-proto-fee (default-to { amount: u0 } (map-get? protocol-fees { token: token-out }))))
        (map-set protocol-fees { token: token-out }
          { amount: (+ (get amount current-proto-fee) protocol-fee) }))
      
      (print {
        event: "swap",
        user: tx-sender,
        token-in: token-in,
        token-out: token-out,
        amount-in: amount-in,
        amount-out: amount-out-net,
        lp-fee: lp-fee,
        protocol-fee: protocol-fee
      })
      
      (ok { amount-out: amount-out-net, lp-fee: lp-fee, protocol-fee: protocol-fee })
    )
  )
)

;; =========================================================================
;; PROTOCOL FEE COLLECTION
;; =========================================================================

(define-public (collect-protocol-fees (token principal))
  (let (
    (fees (unwrap! (map-get? protocol-fees { token: token }) ERR-ZERO-AMOUNT))
  )
    (asserts! (is-eq tx-sender (var-get protocol-treasury)) ERR-NOT-AUTHORIZED)
    (asserts! (> (get amount fees) u0) ERR-ZERO-AMOUNT)
    
    (unwrap! (as-contract (transfer-token token (get amount fees) tx-sender (var-get protocol-treasury))) ERR-TRANSFER-FAILED)
    
    (map-set protocol-fees { token: token } { amount: u0 })
    (ok (get amount fees))
  )
)

;; =========================================================================
;; READ-ONLY FUNCTIONS
;; =========================================================================

(define-read-only (get-pool (token principal))
  (map-get? pools { token: token })
)

(define-read-only (get-position (user principal) (token principal))
  (map-get? positions { user: user, token: token })
)

(define-read-only (get-pair (token-in principal) (token-out principal))
  (map-get? pairs { token-in: token-in, token-out: token-out })
)

(define-read-only (get-unclaimed-fees (user principal) (token principal))
  (match (map-get? pools { token: token })
    pool (match (map-get? positions { user: user, token: token })
      pos (let (
        (fee-per-share (if (> (get total-shares pool) u0)
          (/ (* (get fee-pool pool) PRECISION) (get total-shares pool))
          u0))
        (total-entitled (/ (* (get shares pos) fee-per-share) PRECISION))
        (unclaimed (- total-entitled (get fee-debt pos)))
      )
        (ok unclaimed))
      (ok u0))
    (ok u0))
)

(define-read-only (get-protocol-fees-by-token (token principal))
  (map-get? protocol-fees { token: token })
)

(define-read-only (get-treasury)
  (ok (var-get protocol-treasury))
)

;; =========================================================================
;; HELPER FUNCTIONS
;; =========================================================================

(define-private (adjust-price (raw-price int) (expo int))
  (if (< expo 0)
    (to-uint (/ raw-price (pow 10 (* expo -1))))
    (to-uint (* raw-price (pow 10 expo))))
)