import { Abi } from 'viem';

/**
 * Example DCA (Dollar Cost Averaging) Contract ABI
 *
 * This is a simplified example. Replace with your actual deployed contract ABI.
 *
 * Features:
 * - Create recurring buy orders
 * - Automatic execution based on intervals
 * - Pause/resume strategies
 * - Cancel strategies
 */
export const DCA_ABI: Abi = [
  // ===== Read Functions =====
  {
    name: 'getStrategy',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'strategyId', type: 'uint256' }],
    outputs: [
      {
        name: 'strategy',
        type: 'tuple',
        components: [
          { name: 'owner', type: 'address' },
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'amountPerInterval', type: 'uint256' },
          { name: 'interval', type: 'uint256' },
          { name: 'lastExecuted', type: 'uint256' },
          { name: 'totalExecutions', type: 'uint256' },
          { name: 'maxExecutions', type: 'uint256' },
          { name: 'isActive', type: 'bool' },
        ],
      },
    ],
  },
  {
    name: 'getUserStrategies',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: 'strategyIds', type: 'uint256[]' }],
  },
  {
    name: 'canExecuteStrategy',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'strategyId', type: 'uint256' }],
    outputs: [{ name: 'executable', type: 'bool' }],
  },
  {
    name: 'getNextExecutionTime',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'strategyId', type: 'uint256' }],
    outputs: [{ name: 'timestamp', type: 'uint256' }],
  },

  // ===== Write Functions =====
  {
    name: 'createStrategy',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountPerInterval', type: 'uint256' },
      { name: 'interval', type: 'uint256' }, // In seconds
      { name: 'maxExecutions', type: 'uint256' },
    ],
    outputs: [{ name: 'strategyId', type: 'uint256' }],
  },
  {
    name: 'executeStrategy',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'strategyId', type: 'uint256' }],
    outputs: [{ name: 'success', type: 'bool' }],
  },
  {
    name: 'pauseStrategy',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'strategyId', type: 'uint256' }],
    outputs: [{ name: 'success', type: 'bool' }],
  },
  {
    name: 'resumeStrategy',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'strategyId', type: 'uint256' }],
    outputs: [{ name: 'success', type: 'bool' }],
  },
  {
    name: 'cancelStrategy',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'strategyId', type: 'uint256' }],
    outputs: [{ name: 'success', type: 'bool' }],
  },

  // ===== Events =====
  {
    name: 'StrategyCreated',
    type: 'event',
    inputs: [
      { name: 'strategyId', type: 'uint256', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
      { name: 'tokenIn', type: 'address', indexed: false },
      { name: 'tokenOut', type: 'address', indexed: false },
      { name: 'amountPerInterval', type: 'uint256', indexed: false },
      { name: 'interval', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'StrategyExecuted',
    type: 'event',
    inputs: [
      { name: 'strategyId', type: 'uint256', indexed: true },
      { name: 'executor', type: 'address', indexed: true },
      { name: 'amountOut', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'StrategyPaused',
    type: 'event',
    inputs: [
      { name: 'strategyId', type: 'uint256', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
    ],
  },
  {
    name: 'StrategyResumed',
    type: 'event',
    inputs: [
      { name: 'strategyId', type: 'uint256', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
    ],
  },
  {
    name: 'StrategyCancelled',
    type: 'event',
    inputs: [
      { name: 'strategyId', type: 'uint256', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
    ],
  },
] as const;

/**
 * Contract addresses per chain
 */
export const DCA_ADDRESSES = {
  polygon: '0x0000000000000000000000000000000000000000' as const,
  'polygon-amoy': '0x0000000000000000000000000000000000000000' as const,
  ethereum: '0x0000000000000000000000000000000000000000' as const,
  sepolia: '0x0000000000000000000000000000000000000000' as const,
} as const;
