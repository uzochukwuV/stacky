/**
 * Testnet Configuration and Helper Utilities
 *
 * Use this file to configure testnet settings and access faucets
 */

import { ChainConfig } from './chains/config';

export const TESTNET_FAUCETS = {
  'sepolia': [
    {
      name: 'Alchemy Sepolia Faucet',
      url: 'https://sepoliafaucet.com/',
      description: 'Get 0.5 SepoliaETH per day',
    },
    {
      name: 'Infura Sepolia Faucet',
      url: 'https://www.infura.io/faucet/sepolia',
      description: 'Get 0.5 SepoliaETH per day',
    },
    {
      name: 'QuickNode Sepolia Faucet',
      url: 'https://faucet.quicknode.com/ethereum/sepolia',
      description: 'Get 0.05 SepoliaETH instantly',
    },
  ],
  'polygon-amoy': [
    {
      name: 'Alchemy Polygon Amoy Faucet',
      url: 'https://www.alchemy.com/faucets/polygon-amoy',
      description: 'Get 0.5 MATIC per day',
    },
    {
      name: 'Polygon Faucet',
      url: 'https://faucet.polygon.technology/',
      description: 'Official Polygon faucet for Amoy testnet',
    },
  ],
};

export interface TestnetConfig {
  enabled: boolean;
  defaultChain: 'sepolia' | 'polygon-amoy';
  showTestnetBadge: boolean;
  enableTestnetWarnings: boolean;
}

// Global testnet configuration
export const TESTNET_CONFIG: TestnetConfig = {
  enabled: true, // Set to false for production
  defaultChain: 'polygon-amoy',
  showTestnetBadge: true,
  enableTestnetWarnings: true,
};

/**
 * Check if we're running on a testnet
 */
export function isTestnet(chain: ChainConfig): boolean {
  return chain.testnet === true;
}

/**
 * Get faucet links for a specific testnet
 */
export function getFaucets(chainId: string) {
  return TESTNET_FAUCETS[chainId as keyof typeof TESTNET_FAUCETS] || [];
}

/**
 * Format testnet warning message
 */
export function getTestnetWarning(chainId: string): string {
  if (chainId === 'sepolia') {
    return '⚠️ You are on Sepolia Testnet. Tokens have no real value.';
  }
  if (chainId === 'polygon-amoy') {
    return '⚠️ You are on Polygon Amoy Testnet. Tokens have no real value.';
  }
  return '⚠️ You are on a testnet. These tokens have no real value.';
}

/**
 * Testnet contract addresses (to be updated after deployment)
 */
export const TESTNET_CONTRACTS = {
  sepolia: {
    limitOrder: '0x0000000000000000000000000000000000000000', // TODO: Deploy
    dca: '0x0000000000000000000000000000000000000000', // TODO: Deploy
    marketplace: '0x0000000000000000000000000000000000000000', // TODO: Deploy
  },
  'polygon-amoy': {
    limitOrder: '0x0000000000000000000000000000000000000000', // TODO: Deploy
    dca: '0x0000000000000000000000000000000000000000', // TODO: Deploy
    marketplace: '0x0000000000000000000000000000000000000000', // TODO: Deploy
  },
};

/**
 * Get contract address for a specific testnet
 */
export function getTestnetContract(
  chainId: string,
  contractName: 'limitOrder' | 'dca' | 'marketplace'
): string | null {
  const chain = TESTNET_CONTRACTS[chainId as keyof typeof TESTNET_CONTRACTS];
  if (!chain) return null;
  return chain[contractName];
}

/**
 * Test transaction helper
 * Use this to send small amounts for testing
 */
export const TEST_AMOUNTS = {
  small: '0.001', // For quick tests
  medium: '0.01', // For realistic tests
  large: '0.1', // For stress tests
};

/**
 * Get recommended test amount based on chain
 */
export function getTestAmount(chain: ChainConfig, size: 'small' | 'medium' | 'large' = 'small'): string {
  return TEST_AMOUNTS[size];
}
