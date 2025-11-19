import { Address } from 'viem';
import { ChainConfig } from '../chains/config';

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

// Cache prices to avoid hitting rate limits
const priceCache = new Map<string, { price: TokenPrice; timestamp: number }>();
const CACHE_DURATION = 60 * 1000; // 1 minute

export interface TokenPrice {
  usd: number;
  usd_24h_change: number;
  usd_market_cap?: number;
  last_updated_at: number;
}

export interface PortfolioPrice {
  totalUSD: number;
  change24h: number;
  change24hPercent: number;
  tokens: Array<{
    symbol: string;
    address?: string;
    balance: string;
    valueUSD: number;
    price: number;
    change24h: number;
  }>;
}

// Map chain IDs to CoinGecko platform IDs
const CHAIN_TO_PLATFORM: Record<string, string> = {
  'ethereum': 'ethereum',
  'polygon': 'polygon-pos',
  'sepolia': 'ethereum',
  'polygon-amoy': 'polygon-pos',
};

// Map native currencies to CoinGecko IDs
const NATIVE_CURRENCY_IDS: Record<string, string> = {
  'ETH': 'ethereum',
  'MATIC': 'matic-network',
  'STX': 'blockstack',
};

/**
 * Get price for a native currency (ETH, MATIC, etc.)
 */
export async function getNativeCurrencyPrice(symbol: string): Promise<TokenPrice | null> {
  const coinId = NATIVE_CURRENCY_IDS[symbol];
  if (!coinId) {
    console.warn(`[Prices] No CoinGecko ID for ${symbol}`);
    return null;
  }

  const cacheKey = `native_${symbol}`;
  const cached = priceCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.price;
  }

  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const priceData = data[coinId];

    if (!priceData) {
      return null;
    }

    const price: TokenPrice = {
      usd: priceData.usd,
      usd_24h_change: priceData.usd_24h_change || 0,
      last_updated_at: priceData.last_updated_at || Date.now() / 1000,
    };

    priceCache.set(cacheKey, { price, timestamp: Date.now() });
    return price;
  } catch (error) {
    console.error(`[Prices] Failed to fetch ${symbol} price:`, error);
    return null;
  }
}

/**
 * Get price for an ERC20 token by contract address
 */
export async function getTokenPrice(
  address: Address,
  chain: ChainConfig
): Promise<TokenPrice | null> {
  const platform = CHAIN_TO_PLATFORM[chain.id];
  if (!platform) {
    console.warn(`[Prices] Unsupported chain for prices: ${chain.id}`);
    return null;
  }

  const cacheKey = `${chain.id}_${address.toLowerCase()}`;
  const cached = priceCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.price;
  }

  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/token_price/${platform}?contract_addresses=${address}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const priceData = data[address.toLowerCase()];

    if (!priceData) {
      return null;
    }

    const price: TokenPrice = {
      usd: priceData.usd,
      usd_24h_change: priceData.usd_24h_change || 0,
      last_updated_at: priceData.last_updated_at || Date.now() / 1000,
    };

    priceCache.set(cacheKey, { price, timestamp: Date.now() });
    return price;
  } catch (error) {
    console.error(`[Prices] Failed to fetch token price for ${address}:`, error);
    return null;
  }
}

/**
 * Get prices for multiple tokens in one request
 */
export async function getMultipleTokenPrices(
  tokens: Array<{ address: Address; chain: ChainConfig }>,
  includeNative: boolean = true
): Promise<Map<string, TokenPrice>> {
  const prices = new Map<string, TokenPrice>();

  // Group tokens by chain
  const tokensByChain = new Map<string, Address[]>();
  tokens.forEach(({ address, chain }) => {
    const existing = tokensByChain.get(chain.id) || [];
    existing.push(address);
    tokensByChain.set(chain.id, existing);
  });

  // Fetch prices for each chain
  const promises = Array.from(tokensByChain.entries()).map(async ([chainId, addresses]) => {
    const chain = tokens.find((t) => t.chain.id === chainId)?.chain;
    if (!chain) return;

    const platform = CHAIN_TO_PLATFORM[chainId];
    if (!platform) return;

    try {
      const addressList = addresses.join(',');
      const response = await fetch(
        `${COINGECKO_API_BASE}/simple/token_price/${platform}?contract_addresses=${addressList}&vs_currencies=usd&include_24hr_change=true`
      );

      if (!response.ok) return;

      const data = await response.json();

      addresses.forEach((address) => {
        const priceData = data[address.toLowerCase()];
        if (priceData) {
          const key = `${chainId}_${address.toLowerCase()}`;
          prices.set(key, {
            usd: priceData.usd,
            usd_24h_change: priceData.usd_24h_change || 0,
            last_updated_at: Date.now() / 1000,
          });
        }
      });
    } catch (error) {
      console.error(`[Prices] Failed to fetch prices for chain ${chainId}:`, error);
    }
  });

  // Add native currency prices if requested
  if (includeNative) {
    const nativePromises = Object.entries(NATIVE_CURRENCY_IDS).map(async ([symbol]) => {
      const price = await getNativeCurrencyPrice(symbol);
      if (price) {
        prices.set(`native_${symbol}`, price);
      }
    });
    promises.push(...nativePromises);
  }

  await Promise.all(promises);
  return prices;
}

/**
 * Calculate total portfolio value with price changes
 */
export async function calculatePortfolioValue(
  tokens: Array<{
    symbol: string;
    address?: Address;
    balance: string; // In base units (wei, etc.)
    decimals: number;
    chain: ChainConfig;
  }>
): Promise<PortfolioPrice> {
  const portfolio: PortfolioPrice = {
    totalUSD: 0,
    change24h: 0,
    change24hPercent: 0,
    tokens: [],
  };

  // Fetch all prices
  const pricePromises = tokens.map(async (token) => {
    let price: TokenPrice | null = null;

    if (token.address) {
      price = await getTokenPrice(token.address, token.chain);
    } else {
      price = await getNativeCurrencyPrice(token.symbol);
    }

    if (!price) {
      return null;
    }

    const balanceNum = parseFloat(token.balance) / Math.pow(10, token.decimals);
    const valueUSD = balanceNum * price.usd;
    const change24h = valueUSD * (price.usd_24h_change / 100);

    return {
      symbol: token.symbol,
      address: token.address,
      balance: token.balance,
      valueUSD,
      price: price.usd,
      change24h,
    };
  });

  const results = await Promise.all(pricePromises);

  results.forEach((result) => {
    if (result) {
      portfolio.tokens.push(result);
      portfolio.totalUSD += result.valueUSD;
      portfolio.change24h += result.change24h;
    }
  });

  if (portfolio.totalUSD > 0) {
    portfolio.change24hPercent = (portfolio.change24h / (portfolio.totalUSD - portfolio.change24h)) * 100;
  }

  return portfolio;
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  if (price === 0) return '$0.00';
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  if (price < 1000) return `$${price.toFixed(2)}`;
  if (price < 1000000) return `$${(price / 1000).toFixed(2)}K`;
  return `$${(price / 1000000).toFixed(2)}M`;
}

/**
 * Format percentage change
 */
export function formatPriceChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

/**
 * Clear price cache (useful for manual refresh)
 */
export function clearPriceCache(): void {
  priceCache.clear();
}
