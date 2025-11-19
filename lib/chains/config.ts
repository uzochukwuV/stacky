import { mainnet, sepolia, polygon, polygonAmoy } from 'viem/chains';
import { ChainConfig } from './types';

export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  // Ethereum Mainnet
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/',
    blockExplorer: 'https://etherscan.io',
    icon: '⟠',
    type: 'evm',
    viemChain: mainnet,
    alchemyNetwork: 'eth-mainnet',
    testnet: false,
  },

  // Ethereum Sepolia Testnet
  sepolia: {
    id: 'sepolia',
    name: 'Sepolia',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/',
    blockExplorer: 'https://sepolia.etherscan.io',
    icon: '⟠',
    type: 'evm',
    viemChain: sepolia,
    alchemyNetwork: 'eth-sepolia',
    testnet: true,
  },

  // Polygon Mainnet
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrl: 'https://polygon-mainnet.g.alchemy.com/v2/',
    blockExplorer: 'https://polygonscan.com',
    icon: '⬣',
    type: 'evm',
    viemChain: polygon,
    alchemyNetwork: 'polygon-mainnet',
    testnet: false,
  },

  // Polygon Amoy Testnet (replacing Mumbai)
  'polygon-amoy': {
    id: 'polygon-mumbai',
    name: 'Polygon Amoy',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrl: 'https://polygon-amoy.g.alchemy.com/v2/',
    blockExplorer: 'https://amoy.polygonscan.com',
    icon: '⬣',
    type: 'evm',
    viemChain: polygonAmoy,
    alchemyNetwork: 'polygon-amoy',
    testnet: true,
  },

  // Stacks Mainnet
  'stacks-mainnet': {
    id: 'stacks-mainnet',
    name: 'Stacks',
    nativeCurrency: {
      name: 'Stacks',
      symbol: 'STX',
      decimals: 6,
    },
    rpcUrl: 'https://stacks-node-api.mainnet.stacks.co',
    blockExplorer: 'https://explorer.stacks.co',
    icon: '🔷',
    type: 'stacks',
    testnet: false,
  },

  // Stacks Testnet
  'stacks-testnet': {
    id: 'stacks-testnet',
    name: 'Stacks Testnet',
    nativeCurrency: {
      name: 'Stacks',
      symbol: 'STX',
      decimals: 6,
    },
    rpcUrl: 'https://stacks-node-api.testnet.stacks.co',
    blockExplorer: 'https://explorer.stacks.co/?chain=testnet',
    icon: '🔷',
    type: 'stacks',
    testnet: true,
  },
};

// Helper to get chain config
export const getChainConfig = (chainId: string): ChainConfig | undefined => {
  return CHAIN_CONFIGS[chainId];
};

// Get all EVM chains
export const getEVMChains = (): ChainConfig[] => {
  return Object.values(CHAIN_CONFIGS).filter(chain => chain.type === 'evm');
};

// Get all Stacks chains
export const getStacksChains = (): ChainConfig[] => {
  return Object.values(CHAIN_CONFIGS).filter(chain => chain.type === 'stacks');
};

// Get mainnet chains only
export const getMainnetChains = (): ChainConfig[] => {
  return Object.values(CHAIN_CONFIGS).filter(chain => !chain.testnet);
};

// Get testnet chains only
export const getTestnetChains = (): ChainConfig[] => {
  return Object.values(CHAIN_CONFIGS).filter(chain => chain.testnet);
};
