import { Address } from 'viem';
import { BaseContract } from './base-contract';
import { ChainConfig } from '../chains/types';
import { ContractConfig, ContractTxRequest, ReadOptions, WriteOptions } from './types';
import { LIMIT_ORDER_ABI, LIMIT_ORDER_ADDRESSES } from './abis/limit-order-abi';

/**
 * Limit Order data structure
 */
export interface LimitOrder {
  creator: Address;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  minAmountOut: bigint;
  targetPrice: bigint;
  expiration: bigint;
  isActive: boolean;
}

/**
 * Parameters for creating a limit order
 */
export interface CreateLimitOrderParams {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  minAmountOut: bigint;
  targetPrice: bigint;
  expiration: bigint;
}

/**
 * Limit Order Contract Service
 *
 * Provides methods to interact with limit order contracts across multiple chains.
 *
 * Usage:
 * ```typescript
 * const limitOrder = new LimitOrderContract(currentChain);
 *
 * // Read active orders
 * const orders = await limitOrder.getActiveOrders(userAddress);
 *
 * // Create new order
 * const tx = await limitOrder.prepareCreateOrder({
 *   tokenIn: '0x...',
 *   tokenOut: '0x...',
 *   amountIn: 1000000000000000000n, // 1 token
 *   minAmountOut: 2000000000000000000n, // 2 tokens
 *   targetPrice: 2000000n,
 *   expiration: Math.floor(Date.now() / 1000) + 86400, // 24 hours
 * });
 *
 * // Sign with Turnkey and broadcast
 * const signedTx = await signTransaction(tx);
 * ```
 */
export class LimitOrderContract extends BaseContract {
  constructor(chain: ChainConfig) {
    const config: ContractConfig = {
      name: 'LimitOrder',
      abi: LIMIT_ORDER_ABI,
      deployments: Object.entries(LIMIT_ORDER_ADDRESSES).reduce(
        (acc, [chainId, address]) => {
          acc[chainId] = { address, chainId };
          return acc;
        },
        {} as Record<string, any>
      ),
    };

    super(config, chain);
  }

  // ===== Read Functions =====

  /**
   * Get order details by ID
   */
  async getOrder(orderId: bigint, options?: ReadOptions): Promise<LimitOrder> {
    return await this.read<LimitOrder>('getOrder', [orderId], options);
  }

  /**
   * Get all active order IDs for a user
   */
  async getActiveOrders(user: Address, options?: ReadOptions): Promise<bigint[]> {
    return await this.read<bigint[]>('getActiveOrders', [user], options);
  }

  /**
   * Get order count for a user
   */
  async getOrderCount(user: Address, options?: ReadOptions): Promise<bigint> {
    return await this.read<bigint>('getOrderCount', [user], options);
  }

  /**
   * Check if an order can be executed
   */
  async canExecuteOrder(orderId: bigint, options?: ReadOptions): Promise<boolean> {
    return await this.read<boolean>('canExecuteOrder', [orderId], options);
  }

  /**
   * Get all active orders with full details for a user
   */
  async getActiveOrdersWithDetails(
    user: Address,
    options?: ReadOptions
  ): Promise<Array<LimitOrder & { orderId: bigint }>> {
    const orderIds = await this.getActiveOrders(user, options);

    const orders = await Promise.all(
      orderIds.map(async (orderId) => {
        const order = await this.getOrder(orderId, options);
        return { ...order, orderId };
      })
    );

    return orders;
  }

  // ===== Write Functions =====

  /**
   * Prepare transaction to create a limit order
   * Returns unsigned transaction for Turnkey to sign
   */
  async prepareCreateOrder(
    params: CreateLimitOrderParams,
    options?: WriteOptions
  ): Promise<ContractTxRequest> {
    return await this.prepareWrite(
      'createOrder',
      [
        params.tokenIn,
        params.tokenOut,
        params.amountIn,
        params.minAmountOut,
        params.targetPrice,
        params.expiration,
      ],
      options
    );
  }

  /**
   * Prepare transaction to cancel an order
   */
  async prepareCancelOrder(
    orderId: bigint,
    options?: WriteOptions
  ): Promise<ContractTxRequest> {
    return await this.prepareWrite('cancelOrder', [orderId], options);
  }

  /**
   * Prepare transaction to execute an order
   */
  async prepareExecuteOrder(
    orderId: bigint,
    options?: WriteOptions
  ): Promise<ContractTxRequest> {
    return await this.prepareWrite('executeOrder', [orderId], options);
  }

  // ===== Simulation Functions =====

  /**
   * Simulate order creation
   */
  async simulateCreateOrder(
    params: CreateLimitOrderParams,
    account: Address,
    options?: WriteOptions
  ): Promise<bigint> {
    return await this.simulate(
      'createOrder',
      [
        params.tokenIn,
        params.tokenOut,
        params.amountIn,
        params.minAmountOut,
        params.targetPrice,
        params.expiration,
      ],
      account,
      options
    );
  }

  /**
   * Simulate order cancellation
   */
  async simulateCancelOrder(
    orderId: bigint,
    account: Address,
    options?: WriteOptions
  ): Promise<boolean> {
    return await this.simulate('cancelOrder', [orderId], account, options);
  }

  // ===== Event Functions =====

  /**
   * Get OrderCreated events
   */
  async getOrderCreatedEvents(fromBlock: bigint, toBlock?: bigint) {
    return await this.getEvents('OrderCreated', fromBlock, toBlock);
  }

  /**
   * Get OrderExecuted events
   */
  async getOrderExecutedEvents(fromBlock: bigint, toBlock?: bigint) {
    return await this.getEvents('OrderExecuted', fromBlock, toBlock);
  }
}
