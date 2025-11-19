import { Alchemy, Network, TokenBalance as AlchemyTokenBalance } from 'alchemy-sdk';
import { ChainConfig, TokenBalance, NFTMetadata } from '../chains/types';
import { Address } from 'viem';

// Map chain IDs to Alchemy networks
const ALCHEMY_NETWORK_MAP: Record<string, Network> = {
  'ethereum': Network.ETH_MAINNET,
  'sepolia': Network.ETH_SEPOLIA,
  'polygon': Network.MATIC_MAINNET,
  'polygon-amoy': Network.MATIC_AMOY,
};

// Cache Alchemy instances per network
const alchemyInstances = new Map<string, Alchemy>();

/**
 * Get or create an Alchemy instance for a specific chain
 */
const getAlchemyInstance = (chain: ChainConfig): Alchemy | null => {
  if (chain.type !== 'evm' || !chain.alchemyNetwork) {
    console.warn(`[Alchemy] Chain ${chain.name} is not supported by Alchemy`);
    return null;
  }

  const cacheKey = chain.id;

  if (alchemyInstances.has(cacheKey)) {
    return alchemyInstances.get(cacheKey)!;
  }

  const network = ALCHEMY_NETWORK_MAP[chain.id];
  if (!network) {
    console.warn(`[Alchemy] No network mapping for ${chain.id}`);
    return null;
  }

  const apiKey = process.env.EXPO_PUBLIC_ALCHEMY_API_KEY;
  if (!apiKey) {
    console.error('[Alchemy] API key not configured');
    return null;
  }

  const alchemy = new Alchemy({
    apiKey,
    network,
  });

  alchemyInstances.set(cacheKey, alchemy);
  console.log(`[Alchemy] Created instance for ${chain.name}`);

  return alchemy;
};

/**
 * Get all token balances for an address on a specific chain
 */
export const getTokenBalances = async (
  address: Address,
  chain: ChainConfig
): Promise<TokenBalance[]> => {
  try {
    const alchemy = getAlchemyInstance(chain);
    if (!alchemy) {
      return [];
    }

    console.log(`[Alchemy] Fetching token balances for ${address} on ${chain.name}`);

    const balances = await alchemy.core.getTokenBalances(address);

    // Filter out zero balances and get metadata
    const nonZeroBalances = balances.tokenBalances.filter(
      (balance) => balance.tokenBalance !== '0x0'
    );

    // Fetch metadata for each token
    const tokensWithMetadata = await Promise.all(
      nonZeroBalances.map(async (balance) => {
        try {
          const metadata = await alchemy.core.getTokenMetadata(balance.contractAddress);

          const balanceNum = BigInt(balance.tokenBalance || '0');
          const decimals = metadata.decimals || 18;
          const balanceFormatted = Number(balanceNum) / Math.pow(10, decimals);

          const token: TokenBalance = {
            address: balance.contractAddress,
            name: metadata.name || 'Unknown Token',
            symbol: metadata.symbol || '???',
            decimals,
            balance: balanceNum.toString(),
            balanceFormatted: balanceFormatted.toFixed(6),
            logo: metadata.logo,
          };
          return token;
        } catch (error) {
          console.error(`[Alchemy] Failed to get metadata for ${balance.contractAddress}:`, error);
          return null;
        }
      })
    );

    return tokensWithMetadata.filter((token): token is TokenBalance => token !== null);
  } catch (error) {
    console.error(`[Alchemy] Failed to get token balances:`, error);
    return [];
  }
};

/**
 * Get all NFTs owned by an address on a specific chain
 */
export const getNFTs = async (
  address: Address,
  chain: ChainConfig
): Promise<NFTMetadata[]> => {
  try {
    const alchemy = getAlchemyInstance(chain);
    if (!alchemy) {
      return [];
    }

    console.log(`[Alchemy] Fetching NFTs for ${address} on ${chain.name}`);

    const nfts = await alchemy.nft.getNftsForOwner(address);

    return nfts.ownedNfts.map((nft) => ({
      tokenId: nft.tokenId,
      contract: nft.contract.address,
      name: nft.name || nft.contract.name || 'Unnamed NFT',
      description: nft.description,
      image: nft.image.originalUrl || nft.image.cachedUrl,
      collection: nft.contract.name || 'Unknown Collection',
      tokenType: nft.tokenType as 'ERC721' | 'ERC1155',
      balance: nft.balance,
    }));
  } catch (error) {
    console.error(`[Alchemy] Failed to get NFTs:`, error);
    return [];
  }
};

/**
 * Get detailed NFT metadata
 */
export const getNFTMetadata = async (
  contractAddress: Address,
  tokenId: string,
  chain: ChainConfig
): Promise<NFTMetadata | null> => {
  try {
    const alchemy = getAlchemyInstance(chain);
    if (!alchemy) {
      return null;
    }

    const nft = await alchemy.nft.getNftMetadata(contractAddress, tokenId);

    return {
      tokenId: nft.tokenId,
      contract: nft.contract.address,
      name: nft.name || 'Unnamed NFT',
      description: nft.description,
      image: nft.image.originalUrl || nft.image.cachedUrl,
      collection: nft.contract.name || 'Unknown Collection',
      tokenType: nft.tokenType as 'ERC721' | 'ERC1155',
    };
  } catch (error) {
    console.error(`[Alchemy] Failed to get NFT metadata:`, error);
    return null;
  }
};

/**
 * Get token price in USD (if available)
 */
export const getTokenPrice = async (
  tokenAddress: Address,
  chain: ChainConfig
): Promise<number | null> => {
  try {
    // Note: Alchemy doesn't provide direct price API
    // You'll need to integrate with CoinGecko or another price API
    // This is a placeholder for future implementation
    console.warn('[Alchemy] Token price lookup not yet implemented');
    return null;
  } catch (error) {
    console.error(`[Alchemy] Failed to get token price:`, error);
    return null;
  }
};

/**
 * Search for tokens by name or symbol
 */
export const searchTokens = async (
  query: string,
  chain: ChainConfig
): Promise<TokenBalance[]> => {
  try {
    // This would require additional API integration
    // Placeholder for future implementation
    console.warn('[Alchemy] Token search not yet implemented');
    return [];
  } catch (error) {
    console.error(`[Alchemy] Failed to search tokens:`, error);
    return [];
  }
};

/**
 * Clear Alchemy instance cache
 */
export const clearAlchemyCache = () => {
  alchemyInstances.clear();
  console.log('[Alchemy] Cleared instance cache');
};
