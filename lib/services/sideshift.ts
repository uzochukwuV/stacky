/**
 * Sideshift.ai API Integration
 * Docs: https://sideshift.ai/api
 *
 * Sideshift enables true cross-chain swaps without bridges
 * Supports 50+ chains including BTC, ETH, Polygon, Stacks, etc.
 */

const SIDESHIFT_API_BASE = 'https://sideshift.ai/api/v2';

export interface SideshiftCoin {
  coin: string;          // e.g., "ETH", "MATIC", "STX", "BTC"
  networks: string[];    // e.g., ["ethereum", "polygon"]
  name: string;
  hasMemo: boolean;
  fixedOnly: string[];
  variableOnly: string[];
  depositOffline: string[];
  settleOffline: string[];
}

export interface SideshiftQuote {
  id: string;
  depositMethod: string;  // e.g., "ethereum.eth"
  settleMethod: string;    // e.g., "polygon.matic"
  depositAmount: string;
  settleAmount: string;
  expiresAt: string;
  rate: string;
  affiliateId?: string;
}

export interface SideshiftOrder {
  id: string;
  depositMethod: string;
  settleMethod: string;
  depositAddress: string;
  depositAmount: string;
  settleAmount: string;
  settleAddress: string;
  status: string;
  expiresAt: string;
  depositHash?: string;
  settleHash?: string;
}

/**
 * Get list of all supported coins and networks
 */
export const getSupportedCoins = async (): Promise<SideshiftCoin[]> => {
  try {
    const response = await fetch(`${SIDESHIFT_API_BASE}/coins`);
    if (!response.ok) {
      throw new Error(`Sideshift API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('[Sideshift] Failed to get supported coins:', error);
    throw error;
  }
};

/**
 * Get trading pair information
 */
export const getPairInfo = async (
  depositMethod: string,
  settleMethod: string
): Promise<{
  min: string;
  max: string;
  rate: string;
}> => {
  try {
    const response = await fetch(
      `${SIDESHIFT_API_BASE}/pair/${depositMethod}/${settleMethod}`
    );
    if (!response.ok) {
      throw new Error(`Sideshift API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('[Sideshift] Failed to get pair info:', error);
    throw error;
  }
};

/**
 * Request a fixed-rate quote for a swap
 */
export const requestQuote = async (
  depositMethod: string,  // e.g., "ethereum.eth"
  settleMethod: string,    // e.g., "polygon.matic"
  depositAmount: string,   // Amount to send
  affiliateId?: string     // Optional affiliate ID
): Promise<SideshiftQuote> => {
  try {
    const body: any = {
      depositMethod,
      settleMethod,
      depositAmount,
    };

    if (affiliateId) {
      body.affiliateId = affiliateId;
    }

    const response = await fetch(`${SIDESHIFT_API_BASE}/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Sideshift API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[Sideshift] Failed to request quote:', error);
    throw error;
  }
};

/**
 * Create a swap order from a quote
 */
export const createOrder = async (
  quoteId: string,
  settleAddress: string,  // Destination address
  affiliateId?: string,
  refundAddress?: string
): Promise<SideshiftOrder> => {
  try {
    const body: any = {
      quoteId,
      settleAddress,
    };

    if (affiliateId) {
      body.affiliateId = affiliateId;
    }

    if (refundAddress) {
      body.refundAddress = refundAddress;
    }

    const response = await fetch(`${SIDESHIFT_API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Sideshift API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[Sideshift] Failed to create order:', error);
    throw error;
  }
};

/**
 * Get order status
 */
export const getOrderStatus = async (orderId: string): Promise<SideshiftOrder> => {
  try {
    const response = await fetch(`${SIDESHIFT_API_BASE}/orders/${orderId}`);
    if (!response.ok) {
      throw new Error(`Sideshift API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('[Sideshift] Failed to get order status:', error);
    throw error;
  }
};

/**
 * Create a variable rate swap (market rate)
 */
export const createVariableOrder = async (
  depositMethod: string,
  settleMethod: string,
  settleAddress: string,
  refundAddress?: string,
  affiliateId?: string
): Promise<SideshiftOrder> => {
  try {
    const body: any = {
      depositMethod,
      settleMethod,
      settleAddress,
    };

    if (affiliateId) {
      body.affiliateId = affiliateId;
    }

    if (refundAddress) {
      body.refundAddress = refundAddress;
    }

    const response = await fetch(`${SIDESHIFT_API_BASE}/shifts/variable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Sideshift API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[Sideshift] Failed to create variable order:', error);
    throw error;
  }
};

/**
 * Helper: Map chain ID to Sideshift network identifier
 */
export const chainToSideshiftNetwork = (chainId: string): string => {
  const mapping: Record<string, string> = {
    'ethereum': 'ethereum',
    'sepolia': 'ethereum',  // Testnet not supported by Sideshift
    'polygon': 'polygon',
    'polygon-mumbai': 'polygon',  // Testnet not supported
    'stacks-mainnet': 'stacks',
    'stacks-testnet': 'stacks',   // Testnet not supported
  };

  return mapping[chainId] || chainId;
};

/**
 * Helper: Format method string for Sideshift
 * Example: "ethereum.eth", "polygon.matic", "stacks.stx"
 */
export const formatSideshiftMethod = (
  network: string,
  tokenSymbol: string
): string => {
  return `${network}.${tokenSymbol.toLowerCase()}`;
};
