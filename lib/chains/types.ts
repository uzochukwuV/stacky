import { Chain } from 'viem/chains';

export type SupportedChainId = 'ethereum' | 'polygon' | 'sepolia' | 'polygon-mumbai' | 'stacks-testnet' | 'stacks-mainnet';

export interface ChainConfig {
  id: SupportedChainId;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrl: string;
  blockExplorer: string;
  icon: string;
  type: 'evm' | 'stacks';
  viemChain?: Chain;
  testnet: boolean;
  // Alchemy network identifier
  alchemyNetwork?: string;
}

export interface TokenBalance {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  priceUsd?: number;
  valueUsd?: number;
  logo?: string;
}

export interface NFTMetadata {
  tokenId: string;
  contract: string;
  name: string;
  description?: string;
  image?: string;
  collection: string;
  tokenType: 'ERC721' | 'ERC1155';
  balance?: string;
}
