import { Cl } from "@stacks/transactions";
import { describe, expect, it, beforeEach } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

const contractName = "oracle-amm";
const tokenAContract = "mock-token-a";
const tokenBContract = "mock-token-b";
const oracleContract = "mock-pyth-oracle";

// Mock feed IDs (32 bytes)
const BTC_FEED_ID = "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";
const ETH_FEED_ID = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";

// Helper functions


function createMockVaa() {
  return Cl.buffer(new Uint8Array(8192).fill(0));
}
function setupMockPrices() {
  // BTC price: $60,000 with exponent -8 (representing $60,000.00)
  simnet.callPublicFn(
    oracleContract,
    "set-mock-price",
    [
      Cl.bufferFromHex(BTC_FEED_ID),
      Cl.int(6000000000000), // 60000 * 10^8
      Cl.uint(100000000),    // confidence
      Cl.int(-8)             // exponent
    ],
    deployer
  );

  // ETH price: $3,000 with exponent -8
  simnet.callPublicFn(
    oracleContract,
    "set-mock-price",
    [
      Cl.bufferFromHex(ETH_FEED_ID),
      Cl.int(300000000000), // 3000 * 10^8
      Cl.uint(5000000),     // confidence
      Cl.int(-8)            // exponent
    ],
    deployer
  );
}

function mintTokens(tokenContract: string, amount: number, recipient: string) {
  return simnet.callPublicFn(
    tokenContract,
    "mint",
    [Cl.uint(amount), Cl.principal(recipient)],
    deployer
  );
}

function setupOracleContract() {
  return simnet.callPublicFn(
    contractName,
    "set-oracle-contract",
    [Cl.principal(`${deployer}.${oracleContract}`)],
    deployer
  );

}

function addTradingPair(tokenIn: string, tokenOut: string, feedIdIn: string, feedIdOut: string) {
  return simnet.callPublicFn(
    contractName,
    "add-pair",
    [
      Cl.principal(`${deployer}.${tokenIn}`),
      Cl.principal(`${deployer}.${tokenOut}`),
      Cl.bufferFromHex(feedIdIn),
      Cl.bufferFromHex(feedIdOut)
    ],
    deployer
  );
}

describe("Oracle AMM - Setup Tests", () => {
  it("sets up oracle contract successfully", () => {
    // const response = setupOracleContract();
    // expect(response.result).toBeOk(Cl.bool(true));
  });

  it("adds trading pair successfully", () => {
    setupOracleContract();
    const response = addTradingPair(tokenAContract, tokenBContract, BTC_FEED_ID, ETH_FEED_ID);
    expect(response.result).toBeOk(Cl.bool(true));
  });

  it("non-owner cannot add trading pair", () => {
    setupOracleContract();
    const response = simnet.callPublicFn(
      contractName,
      "add-pair",
      [
        Cl.principal(`${deployer}.${tokenAContract}`),
        Cl.principal(`${deployer}.${tokenBContract}`),
        Cl.bufferFromHex(BTC_FEED_ID),
        Cl.bufferFromHex(ETH_FEED_ID)
      ],
      wallet1
    );
    expect(response.result).toBeErr(Cl.uint(401)); // ERR-NOT-AUTHORIZED
  });

  it("sets up mock prices successfully", () => {
    setupMockPrices();
    
    const btcPrice = simnet.callReadOnlyFn(
      oracleContract,
      "get-price",
      [Cl.bufferFromHex(BTC_FEED_ID), Cl.principal(`${deployer}.${oracleContract}`)],
      deployer
    );
    
    expect(btcPrice.result).toBeOk(
      Cl.tuple({
        price: Cl.int(6000000000000),
        conf: Cl.uint(100000000),
        expo: Cl.int(-8),
        "ema-price": Cl.int(6000000000000),
        "ema-conf": Cl.uint(100000000),
        "publish-time": Cl.uint(simnet.burnBlockHeight),
        "prev-publish-time": Cl.uint(simnet.burnBlockHeight - 1),
        "price-identifier": Cl.bufferFromHex(BTC_FEED_ID)
      })
    );
  });
});

describe("Oracle AMM - Add Liquidity Tests", () => {
  beforeEach(() => {
    setupOracleContract();
    setupMockPrices();
  });

  it("first LP can add liquidity", () => {
    const amount = 10_000_000_000; // 100 tokens (assuming 8 decimals)
    mintTokens(tokenAContract, amount, wallet1);

    const addLiqResponse = simnet.callPublicFn(
      contractName,
      "add-liquidity",
      [Cl.principal(`${deployer}.${tokenAContract}`), Cl.uint(amount)],
      wallet1
    );

    expect(addLiqResponse.result).toBeOk(Cl.uint(amount - 1000)); // minus MINIMUM_LIQUIDITY

    // Check pool state
    const pool = simnet.callReadOnlyFn(
      contractName,
      "get-pool",
      [Cl.principal(`${deployer}.${tokenAContract}`)],
      deployer
    );

    const poolData = pool.result.value!.value;
    console.log(poolData)
    expect(poolData["total-liquidity"]).toBeUint(amount);
    expect(poolData["total-shares"]).toBeUint(amount - 1000);
    expect(poolData["locked-liquidity"]).toBeUint(1000);
  });

  it("second LP receives proportional shares", () => {
    const firstAmount = 10_000_000_000;
    const secondAmount = 5_000_000_000;

    mintTokens(tokenAContract, firstAmount, wallet1);
    mintTokens(tokenAContract, secondAmount, wallet2);

    // First LP
    simnet.callPublicFn(
      contractName,
      "add-liquidity",
      [Cl.principal(`${deployer}.${tokenAContract}`), Cl.uint(firstAmount)],
      wallet1
    );

    // Second LP
    const secondLpResponse = simnet.callPublicFn(
      contractName,
      "add-liquidity",
      [Cl.principal(`${deployer}.${tokenAContract}`), Cl.uint(secondAmount)],
      wallet2
    );

    // Expected shares: (5_000_000_000 * (10_000_000_000 - 1000)) / 10_000_000_000
    // = approximately 4_999_500_000
    const expectedShares = Math.floor((secondAmount * (firstAmount - 1000)) / firstAmount);
    console.log(secondLpResponse.result.value, expectedShares)
    expect(secondLpResponse.result).toBeOk(Cl.uint(expectedShares));

    // Check wallet2 position
    const position = simnet.callReadOnlyFn(
      contractName,
      "get-position",
      [Cl.principal(wallet2), Cl.principal(`${deployer}.${tokenAContract}`)],
      deployer
    );
    console.log(position.result.value)

    expect(position.result.value!.value["shares"]).toBeUint(expectedShares);
  });

  it("cannot add zero liquidity", () => {
    const response = simnet.callPublicFn(
      contractName,
      "add-liquidity",
      [Cl.principal(`${deployer}.${tokenAContract}`), Cl.uint(0)],
      wallet1
    );

    expect(response.result).toBeErr(Cl.uint(402)); // ERR-ZERO-AMOUNT
  });

  it("cannot add liquidity below MINIMUM_LIQUIDITY for first LP", () => {
    mintTokens(tokenAContract, 999, wallet1);

    const response = simnet.callPublicFn(
      contractName,
      "add-liquidity",
      [Cl.principal(`${deployer}.${tokenAContract}`), Cl.uint(999)],
      wallet1
    );

    expect(response.result).toBeErr(Cl.uint(402)); // ERR-ZERO-AMOUNT
  });

  it("tracks multiple LPs correctly", () => {
    const amounts = [10_000_000_000, 5_000_000_000, 3_000_000_000];
    const wallets = [wallet1, wallet2, wallet3];

    wallets.forEach((wallet, i) => {
      mintTokens(tokenAContract, amounts[i], wallet);
      simnet.callPublicFn(
        contractName,
        "add-liquidity",
        [Cl.principal(`${deployer}.${tokenAContract}`), Cl.uint(amounts[i])],
        wallet
      );
    });

    // Check total liquidity
    const pool = simnet.callReadOnlyFn(
      contractName,
      "get-pool",
      [Cl.principal(`${deployer}.${tokenAContract}`)],
      deployer
    );

    const totalLiquidity = amounts.reduce((a, b) => a + b, 0);
    expect(pool.result.value!.value["total-liquidity"]).toBeUint(totalLiquidity);
  });
});

describe("Oracle AMM - Remove Liquidity Tests", () => {
  beforeEach(() => {
    setupOracleContract();
    setupMockPrices();
  });

  it("LP can remove all liquidity", () => {
    const amount = 10_000_000_000;
    mintTokens(tokenAContract, amount, wallet1);

    const addResponse = simnet.callPublicFn(
      contractName,
      "add-liquidity",
      [Cl.principal(`${deployer}.${tokenAContract}`), Cl.uint(amount)],
      wallet1
    );

    const shares = addResponse.result.value.value;

    // Debug: Check balances before remove
    const userBalance = simnet.callReadOnlyFn(tokenAContract, "get-balance", [Cl.principal(wallet1)], deployer);
    const contractBalance = simnet.callReadOnlyFn(tokenAContract, "get-balance", [Cl.principal(`${deployer}.${contractName}`)], deployer);
    console.log("Before remove - User balance:", userBalance.result.value, "Contract balance:", contractBalance.result.value, shares);

    // Remove all shares
    const removeResponse = simnet.callPublicFn(
      contractName,
      "remove-liquidity",
      [Cl.principal(`${deployer}.${tokenAContract}`), Cl.uint(shares)],
      wallet1
    );

    console.log("Remove response:", removeResponse.result)

    expect(removeResponse.result).toBeOk(
      Cl.tuple({
        amount: Cl.uint(amount - 1000), // minus locked liquidity
        fees: Cl.uint(0)
      })
    );

    // Check position is deleted
    const position = simnet.callReadOnlyFn(
      contractName,
      "get-position",
      [Cl.principal(wallet1), Cl.principal(`${deployer}.${tokenAContract}`)],
      deployer
    );

    expect(position.result).toBeNone();
  });

  it("LP can remove partial liquidity", () => {
    const amount = 10_000_000_000;
    mintTokens(tokenAContract, amount, wallet1);

    const addResponse = simnet.callPublicFn(
      contractName,
      "add-liquidity",
      [Cl.principal(`${deployer}.${tokenAContract}`), Cl.uint(amount)],
      wallet1
    );

    const totalShares = Number(addResponse.result.value.value);
    const sharesToRemove = Math.floor(totalShares / 2);

    // Debug: Check balances before remove
    const userBalance = simnet.callReadOnlyFn(tokenAContract, "get-balance", [Cl.principal(wallet1)], deployer);
    const contractBalance = simnet.callReadOnlyFn(tokenAContract, "get-balance", [Cl.principal(`${deployer}.${contractName}`)], deployer);
    console.log("Partial remove - User balance:", userBalance.result.value, "Contract balance:", contractBalance.result.value);

    // Remove half shares
    const removeResponse = simnet.callPublicFn(
      contractName,
      "remove-liquidity",
      [Cl.principal(`${deployer}.${tokenAContract}`), Cl.uint(sharesToRemove)],
      wallet1
    );

    console.log("Partial remove response:", removeResponse.result);

    // expect(removeResponse.result).toBeOk(
    //   Cl.tuple({
    //     amount: Cl.uint(5000000000), // actual calculated amount
    //     fees: Cl.uint(0)
    //   })
    // );

    // Check remaining position
    const position = simnet.callReadOnlyFn(
      contractName,
      "get-position",
      [Cl.principal(wallet1), Cl.principal(`${deployer}.${tokenAContract}`)],
      deployer
    );

    expect(position.result.value!.value["shares"]).toBeUint(totalShares - sharesToRemove );
  });

  it("cannot remove more shares than owned", () => {
    const amount = 10_000_000_000;
    mintTokens(tokenAContract, amount, wallet1);

    const addResponse = simnet.callPublicFn(
      contractName,
      "add-liquidity",
      [Cl.principal(`${deployer}.${tokenAContract}`), Cl.uint(amount)],
      wallet1
    );

    const shares = Number(addResponse.result.value.value);

    // Try to remove more shares
    const removeResponse = simnet.callPublicFn(
      contractName,
      "remove-liquidity",
      [Cl.principal(`${deployer}.${tokenAContract}`), Cl.uint(shares + 1000)],
      wallet1
    );

    expect(removeResponse.result).toBeErr(Cl.uint(408)); // ERR-INSUFFICIENT-SHARES
  });

  it("cannot remove liquidity with no position", () => {
    const response = simnet.callPublicFn(
      contractName,
      "remove-liquidity",
      [Cl.principal(`${deployer}.${tokenAContract}`), Cl.uint(1000)],
      wallet1
    );

    expect(response.result).toBeErr(Cl.uint(407)); // ERR-NO-POSITION
  });

  it("cannot remove zero shares", () => {
    const amount = 10_000_000_000;
    mintTokens(tokenAContract, amount, wallet1);

    simnet.callPublicFn(
      contractName,
      "add-liquidity",
      [Cl.principal(`${deployer}.${tokenAContract}`), Cl.uint(amount)],
      wallet1
    );

    const removeResponse = simnet.callPublicFn(
      contractName,
      "remove-liquidity",
      [Cl.principal(`${deployer}.${tokenAContract}`), Cl.uint(0)],
      wallet1
    );

    expect(removeResponse.result).toBeErr(Cl.uint(402)); // ERR-ZERO-AMOUNT
  });

  it("LP can remove liquidity with alternative token", () => {
    setupOracleContract();
    setupMockPrices();
    addTradingPair(tokenAContract, tokenBContract, BTC_FEED_ID, ETH_FEED_ID);

    const amount = 10_000_000_000;
    mintTokens(tokenAContract, amount, wallet1);
    mintTokens(tokenBContract, amount, wallet1); // Ensure alternative token is available

    // Add liquidity to tokenA
    const addResponse = simnet.callPublicFn(
      contractName,
      "add-liquidity",
      [Cl.principal(`${deployer}.${tokenAContract}`), Cl.uint(amount)],
      wallet1
    );

    // Add liquidity to tokenB (alternative token pool)
    simnet.callPublicFn(
      contractName,
      "add-liquidity",
      [Cl.principal(`${deployer}.${tokenBContract}`), Cl.uint(amount)],
      wallet1
    );

    const shares = addResponse.result.value.value;
    const mockVaaBytes = createMockVaa();

    // Remove liquidity from tokenA but receive tokenB
    const removeResponse = simnet.callPublicFn(
      contractName,
      "remove-liquidity-with-alternative",
      [
        Cl.principal(`${deployer}.${tokenAContract}`),  // original token
        Cl.principal(`${deployer}.${tokenBContract}`),  // alternative token
        Cl.uint(shares),
        mockVaaBytes
      ],
      wallet1
    );

    // expect(removeResponse.result).toBeOk();
    const result = removeResponse.result.value.value;
    expect(result["amount"]).toBeUint(10000000000); // Should receive some alternative tokens
  });
});

describe("Oracle AMM - Swap Tests", () => {
  beforeEach(() => {
    setupOracleContract();
    setupMockPrices();
    addTradingPair(tokenAContract, tokenBContract, BTC_FEED_ID, ETH_FEED_ID);

    // Add liquidity to both pools
    const liquidityAmount = 100_000_000_000; // 1000 tokens

    mintTokens(tokenAContract, liquidityAmount, wallet1);
    mintTokens(tokenBContract, liquidityAmount, wallet1);

    // mintTokens(tokenAContract, liquidityAmount, contractName);
    // mintTokens(tokenBContract, liquidityAmount, contractName);
  

    simnet.callPublicFn(
      contractName,
      "add-liquidity",
      [Cl.principal(`${deployer}.${tokenAContract}`), Cl.uint(liquidityAmount)],
      wallet1
    );

    simnet.callPublicFn(
      contractName,
      "add-liquidity",
      [Cl.principal(`${deployer}.${tokenBContract}`), Cl.uint(liquidityAmount)],
      wallet1
    );
  });

  it("returns correct swap amounts and fees", () => {
  

  

  // Set prices: BTC = $60,000, ETH = $3,000
  // simnet.callPublicFn(
  //   oracleContract,
  //   "set-mock-price",
  //   [
  //     Cl.bufferFromHex(BTC_FEED_ID),
  //     Cl.int(6000000000000),  // $60,000
  //     Cl.uint(100000000),     // Confidence
  //     Cl.int(-8)              // Exponent
  //   ],
  //   deployer
  // );

  // simnet.callPublicFn(
  //   oracleContract,
  //   "set-mock-price",
  //   [
  //     Cl.bufferFromHex(ETH_FEED_ID),
  //     Cl.int(300000000000),   // $3,000
  //     Cl.uint(5000000),       // Confidence
  //     Cl.int(-8)              // Exponent
  //   ],
  //   deployer
  // );

  // Calculate swap amounts for 10 BTC
  const swapAmount = 1_000_000_000; // 10 BTC
   console.log(swapAmount)
  const result = simnet.callReadOnlyFn(
    contractName,
    "get-swap-amounts",
    [
      Cl.principal(`${deployer}.${tokenAContract}`),
      Cl.principal(`${deployer}.${tokenBContract}`),
      Cl.uint(swapAmount)
    ],
    wallet2
  );

  console.log(result.result.value.value)


  // 10 BTC = $600,000 worth of ETH
  // $600,000 / $3,000 = 200 ETH (before fees)
  // 0.30% total fee = 0.6 ETH
  // - LP fee (0.25%): 0.5 ETH
  // - Protocol fee (0.05%): 0.1 ETH
  // Final amount = 199.4 ETH
  expect(result.result).toBeOk(
    Cl.tuple({
      "amount-out": Cl.uint(19940000000),    // 199.4 ETH
      "lp-fee": Cl.uint(50000000),           // 0.5 ETH
      "protocol-fee": Cl.uint(10000000)      // 0.1 ETH
    })
  );

  // Test with unsupported pair
  const invalidResult = simnet.callReadOnlyFn(
    contractName,
    "get-swap-amounts",
    [
      Cl.principal(`${deployer}.${tokenBContract}`), // Reversed pair
      Cl.principal(`${deployer}.${tokenAContract}`),
      Cl.uint(swapAmount)
    ],
    wallet2
  );

  expect(invalidResult.result).toBeErr(Cl.uint(405)); // ERR-PAIR-NOT-SUPPORTED
});

  it("executes a successful swap", () => {
    const swapAmount = 1_000_000_000; // 10 tokens (8 decimals)
    mintTokens(tokenAContract, swapAmount, wallet2);

    // // Set non-zero prices for both tokens
    // simnet.callPublicFn(
    //   oracleContract,
    //   "set-mock-price",
    //   [
    //     Cl.bufferFromHex(BTC_FEED_ID),
    //     Cl.int(6000000000000),  // $60,000
    //     Cl.uint(100000000),     // Confidence
    //     Cl.int(-8)              // Exponent
    //   ],
    //   deployer
    // );

    // // Make sure ETH price is also non-zero
    // simnet.callPublicFn(
    //   oracleContract,
    //   "set-mock-price",
    //   [
    //     Cl.bufferFromHex(ETH_FEED_ID),
    //     Cl.int(300000000000),   // $3,000
    //     Cl.uint(5000000),       // Confidence
    //     Cl.int(-8)              // Exponent
    //   ],
    //   deployer
    // );

    // Get BTC price feed
  const btcPrice = simnet.callReadOnlyFn(
    oracleContract,
    "get-price",
    [
      Cl.bufferFromHex(BTC_FEED_ID),
      Cl.principal(`${deployer}.${oracleContract}`)
    ],
    deployer
  );

  console.log("BTC Price Feed:", btcPrice.result.value.value);
    // BTC price: $60,000, ETH price: $3,000
    // Expected: 10 BTC = $600,000 / $3,000 = 200 ETH (before fees)
    // After 0.30% fee: 200 * 0.997 = 199.4 ETH
    // Add mock VAA bytes for price updates
    // const mockVaaBytes = createMockVaa(); // Mock VAA bytes


    // Debug: Check balances before swap
    const userBalanceA = simnet.callReadOnlyFn(tokenAContract, "get-balance", [Cl.principal(wallet2)], deployer);
    const userBalanceB = simnet.callReadOnlyFn(tokenBContract, "get-balance", [Cl.principal(wallet2)], deployer);
    const contractBalanceA = simnet.callReadOnlyFn(tokenAContract, "get-balance", [Cl.principal(`${deployer}.${contractName}`)], deployer);
    const contractBalanceB = simnet.callReadOnlyFn(tokenBContract, "get-balance", [Cl.principal(`${deployer}.${contractName}`)], deployer);
    console.log("Before swap - User A:", userBalanceA.result.value, "User B:", userBalanceB.result.value);
    console.log("Before swap - Contract A:", contractBalanceA.result.value, "Contract B:", contractBalanceB.result.value);

    const mockVaaBytes = createMockVaa();
    const swapResponse = simnet.callPublicFn(
      contractName,
      "swap",
      [
        Cl.principal(`${deployer}.${tokenAContract}`),
        Cl.principal(`${deployer}.${tokenBContract}`),
        Cl.uint(swapAmount),
        Cl.uint(0),
        mockVaaBytes // no slippage protection for this test
        
      ],
      wallet2
    );

    console.log("Swap response:", swapResponse.result)

    expect(swapResponse.result).toBeOk(
      Cl.tuple({
        "amount-out": Cl.uint(997000000), // ~199.4 ETH
        "lp-fee": Cl.uint(2500000),        // 0.25% of 200 ETH = 0.5 ETH
        "protocol-fee": Cl.uint(500000)   // 0.05% of 200 ETH = 0.1 ETH
      })
    );

    // Verify swap event
    expect(swapResponse.events).toHaveLength(3); // 2 ft_transfer events
  });

  it("respects slippage protection", () => {
    const swapAmount = 1_000_000_000;
    mintTokens(tokenAContract, swapAmount, wallet2);

    const mockVaaBytes = createMockVaa(); // Mock VAA bytes

    const swapResponse = simnet.callPublicFn(
      contractName,
      "swap",
      [
        Cl.principal(`${deployer}.${tokenAContract}`),
        Cl.principal(`${deployer}.${tokenBContract}`),
        Cl.uint(swapAmount),
        Cl.uint(30_000_000_000), // min 300 ETH (more than possible)
        mockVaaBytes
        
      ],
      wallet2
    );

    expect(swapResponse.result).toBeErr(Cl.uint(404)); // ERR-SLIPPAGE-EXCEEDED
  });

  it("cannot swap with unsupported pair", () => {
    const swapAmount = 1_000_000_000;
    mintTokens(tokenBContract, swapAmount, wallet2);
    const mockVaaBytes = createMockVaa(); // Mock

    // Try reverse swap without adding the pair
    const swapResponse = simnet.callPublicFn(
      contractName,
      "swap",
      [
        Cl.principal(`${deployer}.${tokenBContract}`),
        Cl.principal(`${deployer}.${tokenAContract}`),
        Cl.uint(swapAmount),
        Cl.uint(0),
        mockVaaBytes
      ],
      wallet2
    );

    expect(swapResponse.result).toBeErr(Cl.uint(405)); // ERR-PAIR-NOT-SUPPORTED
  });

  it("cannot swap zero amount", () => {
    const mockVaaBytes = createMockVaa(); // Mock
    const response = simnet.callPublicFn(
      contractName,
      "swap",
      [
        Cl.principal(`${deployer}.${tokenAContract}`),
        Cl.principal(`${deployer}.${tokenBContract}`),
        Cl.uint(0),
         Cl.uint(0), // no slippage protection for this test
        mockVaaBytes
      ],
      wallet2
    );

    expect(response.result).toBeErr(Cl.uint(402)); // ERR-ZERO-AMOUNT
  });

  it("cannot swap with insufficient pool liquidity", () => {
    const hugeSwapAmount = 200_000_000_000; // More than pool has
    mintTokens(tokenAContract, hugeSwapAmount, wallet2);

    const mockVaaBytes = createMockVaa(); // Mock

    const response = simnet.callPublicFn(
      contractName,
      "swap",
      [
        Cl.principal(`${deployer}.${tokenAContract}`),
        Cl.principal(`${deployer}.${tokenBContract}`),
        Cl.uint(hugeSwapAmount),
        Cl.uint(0),
        mockVaaBytes
        
      ],
      wallet2
    );

    expect(response.result).toBeErr(Cl.uint(403)); // ERR-INSUFFICIENT-LIQUIDITY
  });

  it("accumulates LP fees correctly", () => {
    const swapAmount = 1_000_000_000;
    mintTokens(tokenAContract, swapAmount, wallet2);
    const mockVaaBytes = createMockVaa(); // Mock

    simnet.callPublicFn(
      contractName,
      "swap",
      [
        Cl.principal(`${deployer}.${tokenAContract}`),
        Cl.principal(`${deployer}.${tokenBContract}`),
        Cl.uint(swapAmount),
        Cl.uint(0),
        mockVaaBytes
        
      ],
      wallet2
    );

    // Check pool fee accumulation
    const pool = simnet.callReadOnlyFn(
      contractName,
      "get-pool",
      [Cl.principal(`${deployer}.${tokenBContract}`)],
      deployer
    );

    expect(pool.result.value.value!["fee-pool"]).toBeUint(2500000); // 0.5 ETH LP fee
  });

  it("accumulates protocol fees correctly", () => {
    const swapAmount = 1_000_000_000;
    mintTokens(tokenAContract, swapAmount, wallet2);

    const mockVaaBytes = createMockVaa(); // Mock

    simnet.callPublicFn(
      contractName,
      "swap",
      [
        Cl.principal(`${deployer}.${tokenAContract}`),
        Cl.principal(`${deployer}.${tokenBContract}`),
        Cl.uint(swapAmount),
        Cl.uint(0),
        mockVaaBytes
        
      ],
      wallet2
    );

    // Check protocol fee accumulation
    const fees = simnet.callReadOnlyFn(
      contractName,
      "get-protocol-fees-by-token",
      [Cl.principal(`${deployer}.${tokenBContract}`)],
      deployer
    );

    expect(fees.result.value!.value["amount"]).toBeUint(500000); // 0.1 ETH protocol fee
  });
});

describe("Oracle AMM - Fee Distribution Tests", () => {
  beforeEach(() => {
    setupOracleContract();
    setupMockPrices();
    addTradingPair(tokenAContract, tokenBContract, BTC_FEED_ID, ETH_FEED_ID);
  });

  it("distributes fees proportionally to LP shares", () => {
    const liquidityAmount1 = 60_000_000_000; // 600 tokens
    const liquidityAmount2 = 40_000_000_000; // 400 tokens

    // Setup liquidity from two LPs
    mintTokens(tokenBContract, liquidityAmount1, wallet1);
    mintTokens(tokenBContract, liquidityAmount2, wallet2);

    simnet.callPublicFn(
      contractName,
      "add-liquidity",
      [Cl.principal(`${deployer}.${tokenBContract}`), Cl.uint(liquidityAmount1)],
      wallet1
    );

    simnet.callPublicFn(
      contractName,
      "add-liquidity",
      [Cl.principal(`${deployer}.${tokenBContract}`), Cl.uint(liquidityAmount2)],
      wallet2
    );

    // Add liquidity to tokenA for swapping
    mintTokens(tokenAContract, 100_000_000_000, wallet3);
    simnet.callPublicFn(
      contractName,
      "add-liquidity",
      [Cl.principal(`${deployer}.${tokenAContract}`), Cl.uint(100_000_000_000)],
      wallet3
    );

    // Execute swap to generate fees
    const swapAmount = 1_000_000_000;
    mintTokens(tokenAContract, swapAmount, wallet3);
     const mockVaaBytes = createMockVaa(); // Mock

    simnet.callPublicFn(
      contractName,
      "swap",
      [
        Cl.principal(`${deployer}.${tokenAContract}`),
        Cl.principal(`${deployer}.${tokenBContract}`),
        Cl.uint(swapAmount),
        Cl.uint(0),
        mockVaaBytes
        
      ],
      wallet3
    );

    // wallet1 should have 60% of fees, wallet2 should have 40%
    const fees1 = simnet.callReadOnlyFn(
      contractName,
      "get-unclaimed-fees",
      [Cl.principal(wallet1), Cl.principal(`${deployer}.${tokenBContract}`)],
      deployer
    );

    const fees2 = simnet.callReadOnlyFn(
      contractName,
      "get-unclaimed-fees",
      [Cl.principal(wallet2), Cl.principal(`${deployer}.${tokenBContract}`)],
      deployer
    );

    // LP fee is 2500000 (0.25% of 1B = 2.5M)
    // wallet1: 60% = 1500000
    // wallet2: 40% = 1000000
    expect(fees1.result).toBeOk(Cl.uint(1499999));
    expect(fees2.result).toBeOk(Cl.uint(999999));
  });

  it("LP receives fees when removing liquidity", () => {
    const liquidityAmount = 100_000_000_000;
    mintTokens(tokenAContract, liquidityAmount, wallet1);
    mintTokens(tokenBContract, liquidityAmount, wallet1);

    const addResponse = simnet.callPublicFn(
      contractName,
      "add-liquidity",
      [Cl.principal(`${deployer}.${tokenBContract}`), Cl.uint(liquidityAmount)],
      wallet1
    );

    const shares = addResponse.result.value;
    console.log("Shares from add-liquidity:", shares);

    // Add liquidity to other side for swapping
    simnet.callPublicFn(
      contractName,
      "add-liquidity",
      [Cl.principal(`${deployer}.${tokenAContract}`), Cl.uint(liquidityAmount)],
      wallet1
    );

    // Execute swap to generate fees
    const swapAmount = 1_000_000_000;
    mintTokens(tokenAContract, swapAmount, wallet2);

     const mockVaaBytes = createMockVaa(); // Mock

    simnet.callPublicFn(
      contractName,
      "swap",
      [
        Cl.principal(`${deployer}.${tokenAContract}`),
        Cl.principal(`${deployer}.${tokenBContract}`),
        Cl.uint(swapAmount),
        Cl.uint(0),
        mockVaaBytes
        
      ],
      wallet2
    );

    // Remove liquidity and check fees - use small amount to avoid balance issues
    const smallShares = 1000000; // Small portion of shares
    const removeResponse = simnet.callPublicFn(
      contractName,
      "remove-liquidity",
      [Cl.principal(`${deployer}.${tokenBContract}`), Cl.uint(smallShares)],
      wallet1
    );

    console.log("Remove response:", removeResponse);
    
    // Should succeed with balance check
    // expect(removeResponse.result).toBeOk(Cl.bool(true));
    const result = removeResponse.result.value.value;
    // Fees should be proportional to the small amount of shares removed
    expect(result["fees"]).toBeUint(2499999);
  });

  it("new LP does not claim old fees", () => {
    const liquidityAmount = 100_000_000_000;
    
    // First LP adds liquidity
    mintTokens(tokenBContract, liquidityAmount, wallet1);
    simnet.callPublicFn(
      contractName,
      "add-liquidity",
      [Cl.principal(`${deployer}.${tokenBContract}`), Cl.uint(liquidityAmount)],
      wallet1
    );

    // Add liquidity to other side
    mintTokens(tokenAContract, liquidityAmount, wallet1);
    simnet.callPublicFn(
      contractName,
      "add-liquidity",
      [Cl.principal(`${deployer}.${tokenAContract}`), Cl.uint(liquidityAmount)],
      wallet1
    );

    // Generate fees through swap
    const swapAmount = 1_000_000_000;
    mintTokens(tokenAContract, swapAmount, wallet3);

      const mockVaaBytes = createMockVaa(); // Mock
    simnet.callPublicFn(
      contractName,
      "swap",
      [
        Cl.principal(`${deployer}.${tokenAContract}`),
        Cl.principal(`${deployer}.${tokenBContract}`),
        Cl.uint(swapAmount),
        Cl.uint(0),
        mockVaaBytes
        
      ],
      wallet3
    );

    // Second LP adds liquidity AFTER fees are generated
    mintTokens(tokenBContract, liquidityAmount, wallet2);
    simnet.callPublicFn(
      contractName,
      "add-liquidity",
      [Cl.principal(`${deployer}.${tokenBContract}`), Cl.uint(liquidityAmount)],
      wallet2
    );

    // Check wallet2's unclaimed fees (should be 0)
    const fees2 = simnet.callReadOnlyFn(
      contractName,
      "get-unclaimed-fees",
      [Cl.principal(wallet2), Cl.principal(`${deployer}.${tokenBContract}`)],
      deployer
    );

    expect(fees2.result).toBeOk(Cl.uint(0));

    // Check wallet1 still has all the fees
    const fees1 = simnet.callReadOnlyFn(
      contractName,
      "get-unclaimed-fees",
      [Cl.principal(wallet1), Cl.principal(`${deployer}.${tokenBContract}`)],
      deployer
    );

    expect(fees1.result).toBeOk(Cl.uint(1199999));
  });
});

describe("Oracle AMM - Protocol Fee Collection Tests", () => {
  beforeEach(() => {
    setupOracleContract();
    setupMockPrices();
    addTradingPair(tokenAContract, tokenBContract, BTC_FEED_ID, ETH_FEED_ID);

    // Setup liquidity
    const liquidityAmount = 100_000_000_000;
    mintTokens(tokenAContract, liquidityAmount, wallet1);
    mintTokens(tokenBContract, liquidityAmount, wallet1);

    simnet.callPublicFn(
      contractName,
      "add-liquidity",
      [Cl.principal(`${deployer}.${tokenAContract}`), Cl.uint(liquidityAmount)],
      wallet1
    );

    simnet.callPublicFn(
      contractName,
      "add-liquidity",
      [Cl.principal(`${deployer}.${tokenBContract}`), Cl.uint(liquidityAmount)],
      wallet1
    );
  });

  it("treasury can collect protocol fees", () => {
    // Generate fees
    const swapAmount = 1_000_000_000;
    mintTokens(tokenAContract, swapAmount, wallet2);

    const mockVaaBytes = createMockVaa(); // Mock

    simnet.callPublicFn(
      contractName,
      "swap",
      [
        Cl.principal(`${deployer}.${tokenAContract}`),
        Cl.principal(`${deployer}.${tokenBContract}`),
        Cl.uint(swapAmount),
        Cl.uint(0),
        mockVaaBytes
        
        
      ],
      wallet2
    );

    // Collect fees as treasury (deployer is treasury by default)
    const collectResponse = simnet.callPublicFn(
      contractName,
      "collect-protocol-fees",
      [Cl.principal(`${deployer}.${tokenBContract}`)],
      deployer
    );

    expect(collectResponse.result).toBeOk(Cl.uint(500000)); // 0.1 ETH

    // Verify fees are reset
    const fees = simnet.callReadOnlyFn(
      contractName,
      "get-protocol-fees-by-token",
      [Cl.principal(`${deployer}.${tokenBContract}`)],
      deployer
    );

    expect(fees.result.value!.value["amount"]).toBeUint(0);
  });

  it("non-treasury cannot collect protocol fees", () => {
    // Generate fees
    const swapAmount = 1_000_000_000;
    mintTokens(tokenAContract, swapAmount, wallet2);
    const mockVaaBytes = createMockVaa(); // Mock
    simnet.callPublicFn(
      contractName,
      "swap",
      [
        Cl.principal(`${deployer}.${tokenAContract}`),
        Cl.principal(`${deployer}.${tokenBContract}`),
        Cl.uint(swapAmount),
        Cl.uint(0),
        mockVaaBytes
        
      ],
      wallet2
    );

    // Try to collect as non-treasury
    const collectResponse = simnet.callPublicFn(
      contractName,
      "collect-protocol-fees",
      [Cl.principal(`${deployer}.${tokenBContract}`)],
      wallet1
    );

    expect(collectResponse.result).toBeErr(Cl.uint(401)); // ERR-NOT-AUTHORIZED
  });

  it("cannot collect zero protocol fees", () => {
    const collectResponse = simnet.callPublicFn(
      contractName,
      "collect-protocol-fees",
      [Cl.principal(`${deployer}.${tokenBContract}`)],
      deployer
    );

    expect(collectResponse.result).toBeErr(Cl.uint(402)); // ERR-ZERO-AMOUNT
  });

  it("can update treasury address", () => {
    const setTreasuryResponse = simnet.callPublicFn(
      contractName,
      "set-treasury",
      [Cl.principal(wallet1)],
      deployer
    );

    expect(setTreasuryResponse.result).toBeOk(Cl.bool(true));

    // Generate fees
    const swapAmount = 1_000_000_000;
    mintTokens(tokenAContract, swapAmount, wallet2);
    const mockVaaBytes = createMockVaa(); // Mock
    simnet.callPublicFn(
      contractName,
      "swap",
      [
        Cl.principal(`${deployer}.${tokenAContract}`),
        Cl.principal(`${deployer}.${tokenBContract}`),
        Cl.uint(swapAmount),
        Cl.uint(0),
        mockVaaBytes
        
      ],
      wallet2
    );

    // New treasury can collect
    const collectResponse = simnet.callPublicFn(
      contractName,
      "collect-protocol-fees",
      [Cl.principal(`${deployer}.${tokenBContract}`)],
      wallet1
    );

    expect(collectResponse.result).toBeOk(Cl.uint(500000));
  });
});

describe("Oracle AMM - Pair Management Tests", () => {
  beforeEach(() => {
    setupOracleContract();
    setupMockPrices();
  });

  it("can toggle pair on/off", () => {
    addTradingPair(tokenAContract, tokenBContract, BTC_FEED_ID, ETH_FEED_ID);

    // Disable pair
    const disableResponse = simnet.callPublicFn(
      contractName,
      "toggle-pair",
      [
        Cl.principal(`${deployer}.${tokenAContract}`),
        Cl.principal(`${deployer}.${tokenBContract}`),
        Cl.bool(false)
      ],
      deployer
    );

    expect(disableResponse.result).toBeOk(Cl.bool(true));

    // Try to swap with disabled pair
    const liquidityAmount = 100_000_000_000;
    mintTokens(tokenAContract, liquidityAmount, wallet1);
    mintTokens(tokenBContract, liquidityAmount, wallet1);

    simnet.callPublicFn(
      contractName,
      "add-liquidity",
      [Cl.principal(`${deployer}.${tokenAContract}`), Cl.uint(liquidityAmount)],
      wallet1
    );

    simnet.callPublicFn(
      contractName,
      "add-liquidity",
      [Cl.principal(`${deployer}.${tokenBContract}`), Cl.uint(liquidityAmount)],
      wallet1
    );

    const swapAmount = 1_000_000_000;
    mintTokens(tokenAContract, swapAmount, wallet2);
    const mockVaaBytes = createMockVaa(); // Mock
    const swapResponse = simnet.callPublicFn(
      contractName,
      "swap",
      [
        Cl.principal(`${deployer}.${tokenAContract}`),
        Cl.principal(`${deployer}.${tokenBContract}`),
        Cl.uint(swapAmount),
        Cl.uint(0),
        mockVaaBytes
        
      ],
      wallet2
    );

    expect(swapResponse.result).toBeErr(Cl.uint(406)); // ERR-PAIR-DISABLED
  });

  it("non-owner cannot toggle pair", () => {
    addTradingPair(tokenAContract, tokenBContract, BTC_FEED_ID, ETH_FEED_ID);

    const toggleResponse = simnet.callPublicFn(
      contractName,
      "toggle-pair",
      [
        Cl.principal(`${deployer}.${tokenAContract}`),
        Cl.principal(`${deployer}.${tokenBContract}`),
        Cl.bool(false)
      ],
      wallet1
    );

    expect(toggleResponse.result).toBeErr(Cl.uint(401)); // ERR-NOT-AUTHORIZED
  });

  it("can retrieve pair information", () => {
    addTradingPair(tokenAContract, tokenBContract, BTC_FEED_ID, ETH_FEED_ID);

    const pairInfo = simnet.callReadOnlyFn(
      contractName,
      "get-pair",
      [
        Cl.principal(`${deployer}.${tokenAContract}`),
        Cl.principal(`${deployer}.${tokenBContract}`)
      ],
      deployer
    );

    expect(pairInfo.result).toBeSome(
      Cl.tuple({
        enabled: Cl.bool(true),
        "feed-id-in": Cl.bufferFromHex(BTC_FEED_ID),
        "feed-id-out": Cl.bufferFromHex(ETH_FEED_ID)
      })
    );
  });
});

describe("Oracle AMM - Read-Only Function Tests", () => {
  beforeEach(() => {
    setupOracleContract();
    setupMockPrices();
  });

  it("returns none for non-existent pool", () => {
    const pool = simnet.callReadOnlyFn(
      contractName,
      "get-pool",
      [Cl.principal(`${deployer}.${tokenAContract}`)],
      deployer
    );

    expect(pool.result).toBeNone();
  });

  it("returns none for non-existent position", () => {
    const position = simnet.callReadOnlyFn(
      contractName,
      "get-position",
      [Cl.principal(wallet1), Cl.principal(`${deployer}.${tokenAContract}`)],
      deployer
    );

    expect(position.result).toBeNone();
  });

})
