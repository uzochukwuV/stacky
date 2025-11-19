import { Abi } from 'viem';

/**
 * Example Limit Order Contract ABI
 *
 * This is a simplified example. Replace with your actual deployed contract ABI.
 *
 * Features:
 * - Create limit orders for token swaps
 * - Cancel orders
 * - Execute orders when conditions are met
 * - Query active orders
 */
export const LIMIT_ORDER_ABI: Abi = [
  // ===== Read Functions =====
  {
    name: 'getOrder',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'orderId', type: 'uint256' }],
    outputs: [
      {
        name: 'order',
        type: 'tuple',
        components: [
          { name: 'creator', type: 'address' },
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'minAmountOut', type: 'uint256' },
          { name: 'targetPrice', type: 'uint256' },
          { name: 'expiration', type: 'uint256' },
          { name: 'isActive', type: 'bool' },
        ],
      },
    ],
  },
  {
    name: 'getActiveOrders',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: 'orderIds', type: 'uint256[]' }],
  },
  {
    name: 'getOrderCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: 'count', type: 'uint256' }],
  },
  {
    name: 'canExecuteOrder',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'orderId', type: 'uint256' }],
    outputs: [{ name: 'executable', type: 'bool' }],
  },

  // ===== Write Functions =====
  {
    name: 'createOrder',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'minAmountOut', type: 'uint256' },
      { name: 'targetPrice', type: 'uint256' },
      { name: 'expiration', type: 'uint256' },
    ],
    outputs: [{ name: 'orderId', type: 'uint256' }],
  },
  {
    name: 'cancelOrder',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'orderId', type: 'uint256' }],
    outputs: [{ name: 'success', type: 'bool' }],
  },
  {
    name: 'executeOrder',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'orderId', type: 'uint256' }],
    outputs: [{ name: 'success', type: 'bool' }],
  },

  // ===== Events =====
  {
    name: 'OrderCreated',
    type: 'event',
    inputs: [
      { name: 'orderId', type: 'uint256', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'tokenIn', type: 'address', indexed: false },
      { name: 'tokenOut', type: 'address', indexed: false },
      { name: 'amountIn', type: 'uint256', indexed: false },
      { name: 'targetPrice', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'OrderCancelled',
    type: 'event',
    inputs: [
      { name: 'orderId', type: 'uint256', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
    ],
  },
  {
    name: 'OrderExecuted',
    type: 'event',
    inputs: [
      { name: 'orderId', type: 'uint256', indexed: true },
      { name: 'executor', type: 'address', indexed: true },
      { name: 'amountOut', type: 'uint256', indexed: false },
    ],
  },
] as const;

/**
 * Contract addresses per chain
 * Add your deployed contract addresses here
 */
export const LIMIT_ORDER_ADDRESSES = {
  // Polygon Mainnet
  polygon: '0x0000000000000000000000000000000000000000' as const,
  // Polygon Amoy Testnet
  'polygon-amoy': '0x0000000000000000000000000000000000000000' as const,
  // Ethereum Mainnet
  ethereum: '0x0000000000000000000000000000000000000000' as const,
  // Sepolia Testnet
  sepolia: '0x0000000000000000000000000000000000000000' as const,
} as const;
