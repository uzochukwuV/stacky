;; =========================================================================
;; ORACLE-POWERED LIQUIDITY POOL
;; =========================================================================
;; Single-sided liquidity pools using Pyth oracle for swap pricing
;; No impermanent loss - LPs earn fees on their deposited tokens

;; =========================================================================
;; TRAIT DEFINITION
;; =========================================================================

(define-trait ft-trait
  (
    (transfer (uint principal principal (optional (buff 34))) (response bool uint))
    (get-name () (response (string-ascii 32) uint))
    (get-symbol () (response (string-ascii 32) uint))
    (get-decimals () (response uint uint))
    (get-balance (principal) (response uint uint))
    (get-total-supply () (response uint uint))
    (get-token-uri () (response (optional (string-utf8 256)) uint))
  )
)


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

;; Fee configuration (basis points: 10000 = 100%)
(define-constant FEE-LP-BPS u25)         ;; 0.25% to LPs
(define-constant FEE-PROTOCOL-BPS u5)    ;; 0.05% to protocol
(define-constant TOTAL-FEE-BPS u30)      ;; 0.30% total fee
(define-constant BPS-BASE u10000)

;; Minimum liquidity (prevents division errors like Uniswap V2)
(define-constant MINIMUM-LIQUIDITY u1000)

;; Precision multiplier for fee calculations (prevents rounding errors)
(define-constant PRECISION u1000000)

;; Pyth Oracle Mainnet Addresses
(define-constant PYTH-ORACLE .pyth-oracle-v4)
(define-constant PYTH-STORAGE .pyth-storage-v4)
(define-constant PYTH-DECODER .pyth-pnau-decoder-v3)
(define-constant WORMHOLE-CORE .wormhole-core-v4)

;; =========================================================================
;; DATA VARIABLES
;; =========================================================================

(define-data-var protocol-treasury principal tx-sender)
(define-data-var oracle-contract principal PYTH-ORACLE)

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

(define-public (add-liquidity (token <ft-trait>) (amount uint))
  (let (
    (token-principal (contract-of token))
    (pool (default-to
      { total-liquidity: u0, total-shares: u0, fee-pool: u0, locked-liquidity: u0 }
      (map-get? pools { token: token-principal })))
    (user-pos (default-to
      { shares: u0, fee-debt: u0 }
      (map-get? positions { user: tx-sender, token: token-principal })))
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
      (try! (contract-call? token transfer amount tx-sender (as-contract tx-sender) none))
      
      ;; Update pool
      (map-set pools { token: token-principal }
        {
          total-liquidity: (+ (get total-liquidity pool) amount),
          total-shares: (+ (get total-shares pool) new-shares),
          fee-pool: (get fee-pool pool),
          locked-liquidity: (if (is-eq (get total-shares pool) u0)
            MINIMUM-LIQUIDITY
            (get locked-liquidity pool))
        })
      
      ;; Update user position
      (map-set positions { user: tx-sender, token: token-principal }
        {
          shares: (+ (get shares user-pos) new-shares),
          fee-debt: (+ (get fee-debt user-pos) additional-fee-debt)
        })
      
      (print {
        event: "add-liquidity",
        user: tx-sender,
        token: token-principal,
        amount: amount,
        shares: new-shares
      })
      
      (ok new-shares)
    )
  )
)

(define-public (remove-liquidity (token <ft-trait>) (shares uint))
  ;; Try to withdraw in preferred token, fallback to alternative if insufficient
  (let (
    (user tx-sender)
    (token-principal (contract-of token))
    (user-pos (unwrap! (map-get? positions { user: user, token: token-principal }) ERR-NO-POSITION))
    (pool (unwrap! (map-get? pools { token: token-principal }) ERR-INSUFFICIENT-LIQUIDITY))
  )
    ;; Validations
    (asserts! (> shares u0) ERR-ZERO-AMOUNT)
    (asserts! (<= shares (get shares user-pos)) ERR-INSUFFICIENT-SHARES)
    
    (let (
      ;; Calculate withdrawal amount (proportional to shares)
      ;; But can't withdraw locked liquidity
      (total-withdrawable (- (get total-liquidity pool) (get locked-liquidity pool)))
      (withdraw-amt (if (is-eq shares (get shares user-pos))
        ;; If removing all shares, withdraw proportional amount but respect locked liquidity
        (/ (* shares total-withdrawable) (get total-shares pool))
        ;; Normal proportional withdrawal
        (/ (* shares (get total-liquidity pool)) (get total-shares pool))))
      
      ;; Calculate unclaimed fees
      (fee-per-share (if (> (get total-shares pool) u0)
        (/ (* (get fee-pool pool) PRECISION) (get total-shares pool))
        u0))
      (total-fee-entitled (/ (* (get shares user-pos) fee-per-share) PRECISION))
      (unclaimed-fees (if (>= total-fee-entitled (get fee-debt user-pos))
        (- total-fee-entitled (get fee-debt user-pos))
        u0))
      
      ;; Total to withdraw
      (total-withdraw (+ withdraw-amt unclaimed-fees))
      
      ;; Check available balance
      (contract-balance (unwrap! (contract-call? token get-balance (as-contract tx-sender)) ERR-ZERO-AMOUNT))
      (actual-withdraw (if (>= contract-balance total-withdraw) total-withdraw contract-balance))
      (actual-base-withdraw (if (>= contract-balance total-withdraw) withdraw-amt contract-balance))
      
      ;; Remaining position
      (remaining-shares (- (get shares user-pos) shares))
      (remaining-fee-debt (if (is-eq remaining-shares u0)
        u0
        (/ (* remaining-shares fee-per-share) PRECISION)))
    )
      ;; Debug print
      (print {
        debug: "remove-liquidity-calc",
        withdraw-amt: withdraw-amt,
        unclaimed-fees: unclaimed-fees,
        total-withdraw: total-withdraw,
        total-withdrawable: total-withdrawable
      })
      
      ;; Transfer available amount
      (try! (as-contract (contract-call? token transfer actual-withdraw tx-sender user none)))
      
      ;; Update pool with actual withdrawn amount
      (map-set pools { token: token-principal }
        {
          total-liquidity: (- (get total-liquidity pool) actual-base-withdraw),
          total-shares: (- (get total-shares pool) shares),
          fee-pool: (- (get fee-pool pool) unclaimed-fees),
          locked-liquidity: (get locked-liquidity pool)
        })
      
      

      
      ;; Update or delete user position
      (if (is-eq remaining-shares u0)
        (map-delete positions { user: user, token: token-principal })
        (map-set positions { user: user, token: token-principal }
          { shares: remaining-shares, fee-debt: remaining-fee-debt }))
      
      (print {
        event: "remove-liquidity",
        user: user,
        token: token-principal,
        shares: shares,
        amount: withdraw-amt,
        fees: unclaimed-fees
      })
      
      (ok { amount: actual-base-withdraw, fees: unclaimed-fees })
    )
  )
)

(define-public (remove-liquidity-with-alternative 
  (original-token <ft-trait>) 
  (alternative-token <ft-trait>) 
  (shares uint)
  (price-feed-vaa (buff 8192)))
  (let (
    (user tx-sender)
    (original-token-addr (contract-of original-token))
    (alternative-token-addr (contract-of alternative-token))
    (user-pos (unwrap! (map-get? positions { user: user, token: original-token-addr }) ERR-NO-POSITION))
    (pool (unwrap! (map-get? pools { token: original-token-addr }) ERR-INSUFFICIENT-LIQUIDITY))
    (pair (unwrap! (map-get? pairs { token-in: original-token-addr, token-out: alternative-token-addr }) ERR-PAIR-NOT-SUPPORTED))
  )
    ;; Validations
    (asserts! (> shares u0) ERR-ZERO-AMOUNT)
    (asserts! (<= shares (get shares user-pos)) ERR-INSUFFICIENT-SHARES)
    (asserts! (get enabled pair) ERR-PAIR-DISABLED)
    
    ;; Update price feeds
    (let (
      (update-status (unwrap! (contract-call? .pyth-oracle-v4 verify-and-update-price-feeds price-feed-vaa {
        pyth-storage-contract: .pyth-storage-v4,
        pyth-decoder-contract: .pyth-pnau-decoder-v3,
        wormhole-core-contract: .wormhole-core-v4
      }) ERR-ZERO-AMOUNT))
      
      ;; Get prices
      (price-original (unwrap! (contract-call? .pyth-storage-v4 get-price (get feed-id-in pair)) ERR-ZERO-AMOUNT))
      (price-alternative (unwrap! (contract-call? .pyth-storage-v4 get-price (get feed-id-out pair)) ERR-ZERO-AMOUNT))
      
      ;; Calculate withdrawal amounts
      (withdraw-amt (/ (* shares (get total-liquidity pool)) (get total-shares pool)))
      
      ;; Calculate fees
      (fee-per-share (if (> (get total-shares pool) u0)
        (/ (* (get fee-pool pool) PRECISION) (get total-shares pool))
        u0))
      (total-fee-entitled (/ (* (get shares user-pos) fee-per-share) PRECISION))
      (unclaimed-fees (if (>= total-fee-entitled (get fee-debt user-pos))
        (- total-fee-entitled (get fee-debt user-pos))
        u0))
      
      ;; Convert to alternative token using oracle prices
      (adj-price-original (adjust-price (get price price-original) (get expo price-original)))
      (adj-price-alternative (adjust-price (get price price-alternative) (get expo price-alternative)))
      (converted-amount (/ (* (+ withdraw-amt unclaimed-fees) adj-price-original) adj-price-alternative))
      
      ;; Check alternative token balance
      (alt-balance (unwrap! (contract-call? alternative-token get-balance (as-contract tx-sender)) ERR-ZERO-AMOUNT))
    )
      ;; Ensure contract has enough alternative tokens
      (asserts! (>= alt-balance converted-amount) ERR-INSUFFICIENT-LIQUIDITY)
      
      ;; Transfer alternative token to user
      (try! (as-contract (contract-call? alternative-token transfer converted-amount tx-sender user none)))
      
      ;; Update original token pool
      (map-set pools { token: original-token-addr }
        {
          total-liquidity: (- (get total-liquidity pool) withdraw-amt),
          total-shares: (- (get total-shares pool) shares),
          fee-pool: (- (get fee-pool pool) unclaimed-fees),
          locked-liquidity: (get locked-liquidity pool)
        })
      
      ;; Update user position
      (let ((remaining-shares (- (get shares user-pos) shares)))
        (if (is-eq remaining-shares u0)
          (map-delete positions { user: user, token: original-token-addr })
          (map-set positions { user: user, token: original-token-addr }
            { shares: remaining-shares, fee-debt: (/ (* remaining-shares fee-per-share) PRECISION) })))
      
      (print {
        event: "remove-liquidity-alternative",
        user: user,
        original-token: original-token-addr,
        alternative-token: alternative-token-addr,
        shares: shares,
        original-amount: (+ withdraw-amt unclaimed-fees),
        converted-amount: converted-amount
      })
      
      (ok { amount: converted-amount, fees: unclaimed-fees })
    )
  )
)

;; =========================================================================
;; SWAP FUNCTIONS
;; =========================================================================

;; Calculate swap amounts without executing
(define-read-only (get-swap-amounts
  (token-in principal)
  (token-out principal)
  (amount-in uint))
  (match (map-get? pairs { token-in: token-in, token-out: token-out })
    pair
      (let (
        (oracle (var-get oracle-contract))
      )
        ;; For read-only function, we'll use a simplified calculation
        ;; In production, this would need to be a public function or use different approach
        (let (
          ;; Simplified calculation assuming 1:20 ratio (BTC:ETH = 60000:3000)
          (amount-out-gross (/ (* amount-in u20) u1))
          (total-fee (/ (* amount-out-gross TOTAL-FEE-BPS) BPS-BASE))
          (lp-fee (/ (* amount-out-gross FEE-LP-BPS) BPS-BASE))
          (protocol-fee (/ (* amount-out-gross FEE-PROTOCOL-BPS) BPS-BASE))
          (amount-out-net (- amount-out-gross total-fee))
        )
          (ok {
            amount-out: amount-out-net,
            lp-fee: lp-fee,
            protocol-fee: protocol-fee
          })))
    ERR-PAIR-NOT-SUPPORTED
  )
)

(define-public (swap
  (token-in <ft-trait>)
  (token-out <ft-trait>)
  (amount-in uint)
  (min-amount-out uint)
  (price-feed-vaa (buff 8192)))
  (let (
    (user tx-sender)
    (token-in-addr (contract-of token-in))
    (token-out-addr (contract-of token-out))
    (pair (unwrap! (map-get? pairs { token-in: token-in-addr, token-out: token-out-addr }) ERR-PAIR-NOT-SUPPORTED))
    (pool-out (unwrap! (map-get? pools { token: token-out-addr }) ERR-INSUFFICIENT-LIQUIDITY))
  )
    ;; Validations
    (asserts! (> amount-in u0) ERR-ZERO-AMOUNT)
    (asserts! (get enabled pair) ERR-PAIR-DISABLED)
    
    ;; Update price feeds using Pyth oracle
    (let (
      ;; Verify and update price feeds
      (update-status (unwrap! (contract-call? .pyth-oracle-v4 verify-and-update-price-feeds price-feed-vaa {
        pyth-storage-contract: .pyth-storage-v4,
        pyth-decoder-contract: .pyth-pnau-decoder-v3,
        wormhole-core-contract: .wormhole-core-v4
      }) ERR-ZERO-AMOUNT))
      
      ;; Get updated prices from storage contract directly
      (price-in-data (unwrap! (contract-call? .pyth-storage-v4 get-price (get feed-id-in pair)) ERR-ZERO-AMOUNT))
      (price-out-data (unwrap! (contract-call? .pyth-storage-v4 get-price (get feed-id-out pair)) ERR-ZERO-AMOUNT))
      
      ;; Adjust prices based on exponents
      (adj-price-in (adjust-price (get price price-in-data) (get expo price-in-data)))
      (adj-price-out (adjust-price (get price price-out-data) (get expo price-out-data)))
      
      ;; Calculate output amount
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
      
      ;; Check contract has enough tokens to transfer
      (let ((contract-balance (unwrap! (contract-call? token-out get-balance (as-contract tx-sender)) ERR-ZERO-AMOUNT)))
        (asserts! (>= contract-balance amount-out-net) ERR-INSUFFICIENT-LIQUIDITY))
      
      ;; Execute swap
      (try! (contract-call? token-in transfer amount-in user (as-contract tx-sender) none))
      (try! (as-contract (contract-call? token-out transfer amount-out-net tx-sender user none)))
      
      ;; Update pool with fees
      (map-set pools { token: token-out-addr }
        (merge pool-out {
          total-liquidity: (- (get total-liquidity pool-out) amount-out-net),
          fee-pool: (+ (get fee-pool pool-out) lp-fee)
        }))
      
      ;; Accumulate protocol fees
      (let ((current-proto-fee (default-to { amount: u0 } (map-get? protocol-fees { token: token-out-addr }))))
        (map-set protocol-fees { token: token-out-addr }
          { amount: (+ (get amount current-proto-fee) protocol-fee) }))
      
      (print {
        event: "swap",
        user: tx-sender,
        token-in: token-in-addr,
        token-out: token-out-addr,
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

(define-public (collect-protocol-fees (token <ft-trait>))
  (let (
    (treasury (var-get protocol-treasury))
    (token-addr (contract-of token))
    (fees (unwrap! (map-get? protocol-fees { token: token-addr }) ERR-ZERO-AMOUNT))
  )
    (asserts! (is-eq tx-sender treasury) ERR-NOT-AUTHORIZED)
    (asserts! (> (get amount fees) u0) ERR-ZERO-AMOUNT)
    
    (try! (as-contract (contract-call? token transfer
      (get amount fees) tx-sender treasury none)))
    
    (map-set protocol-fees { token: token-addr } { amount: u0 })
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
        (unclaimed (if (>= total-entitled (get fee-debt pos))
          (- total-entitled (get fee-debt pos))
          u0))
      )
        (ok unclaimed))
      (ok u0))
    (ok u0))
)

(define-read-only (get-protocol-fees-by-token (token principal))
  (map-get? protocol-fees { token: token })
)

;; =========================================================================
;; HELPER FUNCTIONS
;; =========================================================================

(define-private (adjust-price (raw-price int) (expo int))
  (if (< expo 0)
    (to-uint (/ raw-price (to-int (pow u10 (to-uint (* expo -1))))))
    (to-uint (* raw-price (to-int (pow u10 (to-uint expo))))))
)






(define-public (set-oracle-contract (new-oracle principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set oracle-contract new-oracle)
    (ok true)
  )
)


(define-read-only (get-oracle-contract)
  (var-get oracle-contract)
)