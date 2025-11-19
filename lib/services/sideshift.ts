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

// ===== BULK SHIFT OPERATIONS =====

export interface BulkShiftRequest {
  depositMethod: string;
  settleMethod: string;
  depositAmount: string;
  settleAddress: string;
  refundAddress?: string;
  affiliateId?: string;
}

export interface BulkShiftResult {
  success: boolean;
  order?: SideshiftOrder;
  error?: string;
  request: BulkShiftRequest;
}

export interface BulkOrderResponse {
  orders: SideshiftOrder[];
  total: number;
}

/**
 * Fetch multiple orders in bulk (V1 API endpoint)
 * Useful for tracking multiple shifts at once
 */
export const fetchBulkOrders = async (orderIds: string[]): Promise<BulkOrderResponse> => {
  try {
    const response = await fetch('https://sideshift.ai/api/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderIds }),
    });

    if (!response.ok) {
      throw new Error(`Sideshift API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      orders: data.orders || [],
      total: data.total || 0,
    };
  } catch (error) {
    console.error('[Sideshift] Failed to fetch bulk orders:', error);
    throw error;
  }
};

/**
 * Create multiple swap orders in parallel
 * This is a client-side bulk implementation - creates orders concurrently
 */
export const createBulkShifts = async (
  requests: BulkShiftRequest[]
): Promise<BulkShiftResult[]> => {
  console.log(`[Sideshift] Creating ${requests.length} shifts in parallel...`);

  const promises = requests.map(async (request): Promise<BulkShiftResult> => {
    try {
      // First get a quote
      const quote = await requestQuote(
        request.depositMethod,
        request.settleMethod,
        request.depositAmount,
        request.affiliateId
      );

      // Then create the order
      const order = await createOrder(
        quote.id,
        request.settleAddress,
        request.affiliateId,
        request.refundAddress
      );

      return {
        success: true,
        order,
        request,
      };
    } catch (error: any) {
      console.error('[Sideshift] Failed to create shift:', error);
      return {
        success: false,
        error: error.message || 'Failed to create shift',
        request,
      };
    }
  });

  const results = await Promise.allSettled(promises);

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        success: false,
        error: result.reason?.message || 'Unknown error',
        request: requests[index],
      };
    }
  });
};

/**
 * Create multiple variable rate shifts in parallel
 */
export const createBulkVariableShifts = async (
  requests: BulkShiftRequest[]
): Promise<BulkShiftResult[]> => {
  console.log(`[Sideshift] Creating ${requests.length} variable shifts in parallel...`);

  const promises = requests.map(async (request): Promise<BulkShiftResult> => {
    try {
      const order = await createVariableOrder(
        request.depositMethod,
        request.settleMethod,
        request.settleAddress,
        request.refundAddress,
        request.affiliateId
      );

      return {
        success: true,
        order,
        request,
      };
    } catch (error: any) {
      console.error('[Sideshift] Failed to create variable shift:', error);
      return {
        success: false,
        error: error.message || 'Failed to create variable shift',
        request,
      };
    }
  });

  const results = await Promise.allSettled(promises);

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        success: false,
        error: result.reason?.message || 'Unknown error',
        request: requests[index],
      };
    }
  });
};

/**
 * Track multiple orders and get their current status
 */
export const trackBulkOrders = async (orderIds: string[]): Promise<Map<string, SideshiftOrder>> => {
  try {
    const bulkResponse = await fetchBulkOrders(orderIds);
    const orderMap = new Map<string, SideshiftOrder>();

    bulkResponse.orders.forEach((order) => {
      orderMap.set(order.id, order);
    });

    return orderMap;
  } catch (error) {
    console.error('[Sideshift] Failed to track bulk orders:', error);
    throw error;
  }
};
