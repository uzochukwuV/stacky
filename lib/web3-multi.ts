import { Address, createPublicClient, createWalletClient, http, PublicClient, WalletClient } from 'viem';
import { ChainConfig } from './chains/types';
import { withTimeout } from './utils';

// Cache for public clients per chain
const publicClients = new Map<string, PublicClient>();

/**
 * Get or create a public client for a specific chain
 * Clients are cached for performance
 */
export const getPublicClient = (chain: ChainConfig): PublicClient => {
  const cacheKey = chain.id;

  if (publicClients.has(cacheKey)) {
    return publicClients.get(cacheKey)!;
  }

  if (chain.type !== 'evm' || !chain.viemChain) {
    throw new Error(`Chain ${chain.name} is not an EVM chain`);
  }

  const client = createPublicClient({
    chain: chain.viemChain,
    transport: http(),
  });

  publicClients.set(cacheKey, client);
  console.log(`[Web3] Created public client for ${chain.name}`);

  return client;
};

/**
 * Create a wallet client for a specific chain
 * Used for signing transactions
 */
export const createWalletClientForChain = (
  chain: ChainConfig,
  account: Address
): WalletClient => {
  if (chain.type !== 'evm' || !chain.viemChain) {
    throw new Error(`Chain ${chain.name} is not an EVM chain`);
  }

  return createWalletClient({
    account,
    chain: chain.viemChain,
    transport: http(),
  });
};

/**
 * Get native token balance for an address on a specific chain
 */
export const getBalance = async (
  address: Address,
  chain: ChainConfig
): Promise<bigint> => {
  try {
    const client = getPublicClient(chain);
    const balance = await withTimeout(
      client.getBalance({ address }),
      5000,
      BigInt(0)
    );
    return balance;
  } catch (error) {
    console.error(`[Web3] Failed to get balance for ${address} on ${chain.name}:`, error);
    return BigInt(0);
  }
};

/**
 * Get token balance for a specific ERC20 token
 */
export const getTokenBalance = async (
  userAddress: Address,
  tokenAddress: Address,
  chain: ChainConfig
): Promise<bigint> => {
  try {
    const client = getPublicClient(chain);

    // ERC20 balanceOf ABI
    const balance = await client.readContract({
      address: tokenAddress,
      abi: [
        {
          name: 'balanceOf',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: 'balance', type: 'uint256' }],
        },
      ],
      functionName: 'balanceOf',
      args: [userAddress],
    });

    return balance as bigint;
  } catch (error) {
    console.error(`[Web3] Failed to get token balance:`, error);
    return BigInt(0);
  }
};

/**
 * Get token metadata (name, symbol, decimals)
 */
export const getTokenMetadata = async (
  tokenAddress: Address,
  chain: ChainConfig
): Promise<{ name: string; symbol: string; decimals: number } | null> => {
  try {
    const client = getPublicClient(chain);

    const [name, symbol, decimals] = await Promise.all([
      client.readContract({
        address: tokenAddress,
        abi: [
          {
            name: 'name',
            type: 'function',
            stateMutability: 'view',
            inputs: [],
            outputs: [{ name: '', type: 'string' }],
          },
        ],
        functionName: 'name',
      }),
      client.readContract({
        address: tokenAddress,
        abi: [
          {
            name: 'symbol',
            type: 'function',
            stateMutability: 'view',
            inputs: [],
            outputs: [{ name: '', type: 'string' }],
          },
        ],
        functionName: 'symbol',
      }),
      client.readContract({
        address: tokenAddress,
        abi: [
          {
            name: 'decimals',
            type: 'function',
            stateMutability: 'view',
            inputs: [],
            outputs: [{ name: '', type: 'uint8' }],
          },
        ],
        functionName: 'decimals',
      }),
    ]);

    return {
      name: name as string,
      symbol: symbol as string,
      decimals: decimals as number,
    };
  } catch (error) {
    console.error(`[Web3] Failed to get token metadata:`, error);
    return null;
  }
};

/**
 * Clear all cached clients (useful when switching networks)
 */
export const clearClientCache = () => {
  publicClients.clear();
  console.log('[Web3] Cleared client cache');
};
