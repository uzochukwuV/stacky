// import { Turnkey } from "@turnkey/sdk-server";
import { 
  broadcastTransaction, 
  createMessageSignature, 
  makeContractCall,
  makeUnsignedSTXTokenTransfer, 
  sigHashPreSign, 
  SingleSigSpendingCondition, 
  TransactionSigner, 
  type StacksTransactionWire,
  bufferCV,
  uintCV,
  standardPrincipalCV,
  PostConditionMode,
  FungibleConditionCode,
  // makeStandardSTXPostCondition,
  // makeContractSTXPostCondition,
  // makeStandardFungiblePostCondition,
  // makeContractFungiblePostCondition,
  // StacksTestnet,
  // StacksMainnet
  makeSTXTokenTransfer,
  postConditionToWire,
  PostConditionType

} from "@stacks/transactions";
import { TURNKEY_API_PRIVATE_KEY, TURNKEY_API_PUBLIC_KEY, TURNKEY_BASE_URL, TURNKEY_ORGANIZATION_ID, TURNKEY_SIGNER_PUBLIC_KEY } from "./constants";

// // Define the Turnkey API client
// const client = new Turnkey({ 
//   apiBaseUrl: TURNKEY_BASE_URL, 
//   apiPrivateKey: TURNKEY_API_PRIVATE_KEY, 
//   apiPublicKey: TURNKEY_API_PUBLIC_KEY, 
//   defaultOrganizationId: TURNKEY_ORGANIZATION_ID, 
// });

// Contract details
const CONTRACT_ADDRESS = 'ST3KC0MTNW34S1ZXD36JYKFD3JJMWA01M55DSJ4JE';
const CONTRACT_NAME = 'liquidity-pool';
const NETWORK : 'testnet' | 'mainnet' = 'testnet'; // Change to 'mainnet' for production	

// Helper function to generate pre-sign hash
const generatePreSignSigHash = (
  transaction: StacksTransactionWire, 
  signer: TransactionSigner, 
) => { 
  let preSignSigHash = sigHashPreSign( 
    signer.sigHash, 
    transaction.auth.authType, 
    transaction.auth.spendingCondition.fee, 
    transaction.auth.spendingCondition.nonce, 
  ); 

  return preSignSigHash; 
};

// Sign a Stacks transaction using Turnkey
const signStacksTx = async (transaction: StacksTransactionWire, signer: TransactionSigner) => { 
  try { 
    const stacksPublicKey = TURNKEY_SIGNER_PUBLIC_KEY;
    let preSignSigHash = generatePreSignSigHash(transaction, signer); 
    const payload = `0x${preSignSigHash}`; 

    // const signature = await client.apiClient().signRawPayload({ 
    //   payload, 
    //   signWith: stacksPublicKey, 
    //   encoding: "PAYLOAD_ENCODING_HEXADECIMAL", 
    //   hashFunction: "HASH_FUNCTION_NO_OP", 
    // }); 
    

    // r and s values returned are in hex format, padStart r and s values 
    // const nextSig = `${signature!.v}${signature!.r.padStart(64, "0")}${signature!.s.padStart(64, "0")}`; 
    const nextSig = "";
    // Reassign signature field in transaction with `nextSig` 
    let spendingCondition = transaction.auth.spendingCondition as SingleSigSpendingCondition; 
    spendingCondition.signature = createMessageSignature(nextSig); 

    return transaction; 
  } catch (err) { 
    console.error("Signing failed:", err); 
    throw err;
  } 
};

// Broadcast a signed transaction
const broadcastSignedTx = async (transaction: StacksTransactionWire) => {
  try {
    // const network = NETWORK === 'mainnet' ? new StacksMainnet() : new StacksTestnet();

    const network = "testnet";
    const result = await broadcastTransaction({ 
      transaction, 
      network: NETWORK as 'mainnet' | 'testnet', 
    });
    
    return result;
  } catch (err) {
    console.error("Broadcasting failed:", err);
    throw err;
  }
};

// Add liquidity to the pool
export const addLiquidity = async (
  tokenAddress: string,
  amount: bigint,
  nonce: bigint,
  fee: bigint = 180n
) => {
  try {
    // const network = NETWORK === 'mainnet' ? new StacksMainnet() : new StacksTestnet();

    const network = "testnet";
    const publicKey = TURNKEY_SIGNER_PUBLIC_KEY;
    // const network = "testnet";
    
    // Create post conditions to ensure token transfer
    // const postConditions = [
    //   makeStandardSTXPostCondition(
    //     publicKey,
    //     FungibleConditionCode.LessEqual,
    //     amount
    //   )
    // ];
    
    // Create contract call transaction
    const transaction = await makeContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'add-liquidity',
      functionArgs: [
        standardPrincipalCV(tokenAddress),
        uintCV(amount)
      ],
      senderKey: publicKey,
      validateWithAbi: true,
      network,
      nonce,
      fee,
      // postConditions: PostConditionType.Fungible,
      postConditionMode: PostConditionMode.Deny
    });
    
    // Sign the transaction
    const signer = new TransactionSigner(transaction);
    const signedTx = await signStacksTx(transaction, signer);
    
    // Broadcast the transaction
    return await broadcastSignedTx(signedTx);
  } catch (error) {
    console.error("Add liquidity failed:", error);
    throw error;
  }
};

// Swap tokens
export const swap = async (
  tokenInAddress: string,
  tokenOutAddress: string,
  amountIn: bigint,
  minAmountOut: bigint,
  priceFeedVaa: string,
  nonce: bigint,
  fee: bigint = 180n
) => {
  try {
    // const network = NETWORK === 'mainnet' ? new StacksMainnet() : new StacksTestnet();

    const network = "testnet";
    const publicKey = TURNKEY_SIGNER_PUBLIC_KEY;
    
    // Create post conditions to ensure token transfer
    // const postConditions = [
    //   makeStandardFungiblePostCondition(
    //     publicKey,
    //     FungibleConditionCode.LessEqual,
    //     amountIn,
    //     tokenInAddress
    //   )
    // ];
    
    // Create contract call transaction
    const transaction = await makeContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'swap',
      functionArgs: [
        standardPrincipalCV(tokenInAddress),
        standardPrincipalCV(tokenOutAddress),
        uintCV(amountIn),
        uintCV(minAmountOut),
        bufferCV(Buffer.from(priceFeedVaa, 'hex'))
      ],
      senderKey: publicKey,
      validateWithAbi: true,
      network,
      nonce,
      fee,
      // postConditions,
      postConditionMode: PostConditionMode.Deny
    });
    
    // Sign the transaction
    const signer = new TransactionSigner(transaction);
    const signedTx = await signStacksTx(transaction, signer);
    
    // Broadcast the transaction
    return await broadcastSignedTx(signedTx);
  } catch (error) {
    console.error("Swap failed:", error);
    throw error;
  }
};

// Remove liquidity from the pool
export const removeLiquidity = async (
  tokenAddress: string,
  shares: bigint,
  nonce: bigint,
  fee: bigint = 180n
) => {
  try {
    // const network = NETWORK === 'mainnet' ? new StacksMainnet() : new StacksTestnet();

    const network = "testnet";
    const publicKey = TURNKEY_SIGNER_PUBLIC_KEY;
    
    // Create contract call transaction
    const transaction = await makeContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'remove-liquidity',
      functionArgs: [
        standardPrincipalCV(tokenAddress),
        uintCV(shares)
      ],
      senderKey: publicKey,
      validateWithAbi: true,
      network,
      nonce,
      fee,
      postConditionMode: PostConditionMode.Allow
    });
    
    // Sign the transaction
    const signer = new TransactionSigner(transaction);
    const signedTx = await signStacksTx(transaction, signer);
    
    // Broadcast the transaction
    return await broadcastSignedTx(signedTx);
  } catch (error) {
    console.error("Remove liquidity failed:", error);
    throw error;
  }
};

// Remove liquidity with alternative token
export const removeLiquidityWithAlternative = async (
  originalTokenAddress: string,
  alternativeTokenAddress: string,
  shares: bigint,
  priceFeedVaa: string,
  nonce: bigint,
  fee: bigint = 180n
) => {
  try {
    // const network = NETWORK === 'mainnet' ? new StacksMainnet() : new StacksTestnet();

    const network = "testnet";
    const publicKey = TURNKEY_SIGNER_PUBLIC_KEY;
    
    // Create contract call transaction
    const transaction = await makeContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'remove-liquidity-with-alternative',
      functionArgs: [
        standardPrincipalCV(originalTokenAddress),
        standardPrincipalCV(alternativeTokenAddress),
        uintCV(shares),
        bufferCV(Buffer.from(priceFeedVaa, 'hex'))
      ],
      senderKey: publicKey,
      validateWithAbi: true,
      network,
      nonce,
      fee,
      postConditionMode: PostConditionMode.Allow
    });
    
    // Sign the transaction
    const signer = new TransactionSigner(transaction);
    const signedTx = await signStacksTx(transaction, signer);
    
    // Broadcast the transaction
    return await broadcastSignedTx(signedTx);
  } catch (error) {
    console.error("Remove liquidity with alternative failed:", error);
    throw error;
  }
};

// Get swap amounts (read-only function)
export const getSwapAmounts = async (
  tokenInAddress: string,
  tokenOutAddress: string,
  amountIn: bigint
) => {
  try {
    // const network = NETWORK === 'mainnet' ? new StacksMainnet() : new StacksTestnet();

    const network = "testnet";
    const publicKey = TURNKEY_SIGNER_PUBLIC_KEY;
    
    // Create contract call transaction for read-only function
    const transaction = await makeContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'get-swap-amounts',
      functionArgs: [
        standardPrincipalCV(tokenInAddress),
        standardPrincipalCV(tokenOutAddress),
        uintCV(amountIn)
      ],
      senderKey: publicKey,
      validateWithAbi: true,
      network,
      // anchorMode: 1, // Read-only
    });
    
    // For read-only functions, we don't broadcast but use the API
    const url = NETWORK.includes("mainnet") 
      ? 'https://stacks-node-api.mainnet.stacks.co/v2/contracts/call-read'
      : 'https://stacks-node-api.testnet.stacks.co/v2/contracts/call-read';
      
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contract_address: CONTRACT_ADDRESS,
        contract_name: CONTRACT_NAME,
        function_name: 'get-swap-amounts',
        function_args: [
          tokenInAddress,
          tokenOutAddress,
          amountIn.toString()
        ],
      }),
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Get swap amounts failed:", error);
    throw error;
  }
};