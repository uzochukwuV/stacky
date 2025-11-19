import { Address } from 'viem';
import { BaseContract } from './base-contract';
import { ChainConfig } from '../chains/types';
import { ContractConfig, ContractTxRequest, ReadOptions, WriteOptions } from './types';
import { DCA_ABI, DCA_ADDRESSES } from './abis/dca-abi';

/**
 * DCA Strategy data structure
 */
export interface DCAStrategy {
  owner: Address;
  tokenIn: Address;
  tokenOut: Address;
  amountPerInterval: bigint;
  interval: bigint;
  lastExecuted: bigint;
  totalExecutions: bigint;
  maxExecutions: bigint;
  isActive: boolean;
}

/**
 * Parameters for creating a DCA strategy
 */
export interface CreateDCAStrategyParams {
  tokenIn: Address;
  tokenOut: Address;
  amountPerInterval: bigint;
  interval: bigint; // In seconds
  maxExecutions: bigint; // 0 for unlimited
}

/**
 * DCA (Dollar Cost Averaging) Contract Service
 *
 * Provides methods to interact with DCA automation contracts across multiple chains.
 *
 * Usage:
 * ```typescript
 * const dca = new DCAContract(currentChain);
 *
 * // Read user strategies
 * const strategies = await dca.getUserStrategiesWithDetails(userAddress);
 *
 * // Create new strategy
 * const tx = await dca.prepareCreateStrategy({
 *   tokenIn: '0x...', // USDC
 *   tokenOut: '0x...', // ETH
 *   amountPerInterval: 100000000n, // 100 USDC
 *   interval: 86400n, // Daily (24 hours)
 *   maxExecutions: 30n, // 30 days
 * });
 *
 * // Sign with Turnkey and broadcast
 * const signedTx = await signTransaction(tx);
 * ```
 */
export class DCAContract extends BaseContract {
  constructor(chain: ChainConfig) {
    const config: ContractConfig = {
      name: 'DCA',
      abi: DCA_ABI,
      deployments: Object.entries(DCA_ADDRESSES).reduce(
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
   * Get strategy details by ID
   */
  async getStrategy(strategyId: bigint, options?: ReadOptions): Promise<DCAStrategy> {
    return await this.read<DCAStrategy>('getStrategy', [strategyId], options);
  }

  /**
   * Get all strategy IDs for a user
   */
  async getUserStrategies(user: Address, options?: ReadOptions): Promise<bigint[]> {
    return await this.read<bigint[]>('getUserStrategies', [user], options);
  }

  /**
   * Check if a strategy can be executed
   */
  async canExecuteStrategy(strategyId: bigint, options?: ReadOptions): Promise<boolean> {
    return await this.read<boolean>('canExecuteStrategy', [strategyId], options);
  }

  /**
   * Get next execution time for a strategy
   */
  async getNextExecutionTime(strategyId: bigint, options?: ReadOptions): Promise<bigint> {
    return await this.read<bigint>('getNextExecutionTime', [strategyId], options);
  }

  /**
   * Get all strategies with full details for a user
   */
  async getUserStrategiesWithDetails(
    user: Address,
    options?: ReadOptions
  ): Promise<Array<DCAStrategy & { strategyId: bigint; nextExecution: bigint }>> {
    const strategyIds = await this.getUserStrategies(user, options);

    const strategies = await Promise.all(
      strategyIds.map(async (strategyId) => {
        const [strategy, nextExecution] = await Promise.all([
          this.getStrategy(strategyId, options),
          this.getNextExecutionTime(strategyId, options),
        ]);

        return { ...strategy, strategyId, nextExecution };
      })
    );

    return strategies;
  }

  // ===== Write Functions =====

  /**
   * Prepare transaction to create a DCA strategy
   */
  async prepareCreateStrategy(
    params: CreateDCAStrategyParams,
    options?: WriteOptions
  ): Promise<ContractTxRequest> {
    return await this.prepareWrite(
      'createStrategy',
      [
        params.tokenIn,
        params.tokenOut,
        params.amountPerInterval,
        params.interval,
        params.maxExecutions,
      ],
      options
    );
  }

  /**
   * Prepare transaction to execute a strategy
   */
  async prepareExecuteStrategy(
    strategyId: bigint,
    options?: WriteOptions
  ): Promise<ContractTxRequest> {
    return await this.prepareWrite('executeStrategy', [strategyId], options);
  }

  /**
   * Prepare transaction to pause a strategy
   */
  async preparePauseStrategy(
    strategyId: bigint,
    options?: WriteOptions
  ): Promise<ContractTxRequest> {
    return await this.prepareWrite('pauseStrategy', [strategyId], options);
  }

  /**
   * Prepare transaction to resume a strategy
   */
  async prepareResumeStrategy(
    strategyId: bigint,
    options?: WriteOptions
  ): Promise<ContractTxRequest> {
    return await this.prepareWrite('resumeStrategy', [strategyId], options);
  }

  /**
   * Prepare transaction to cancel a strategy
   */
  async prepareCancelStrategy(
    strategyId: bigint,
    options?: WriteOptions
  ): Promise<ContractTxRequest> {
    return await this.prepareWrite('cancelStrategy', [strategyId], options);
  }

  // ===== Simulation Functions =====

  /**
   * Simulate strategy creation
   */
  async simulateCreateStrategy(
    params: CreateDCAStrategyParams,
    account: Address,
    options?: WriteOptions
  ): Promise<bigint> {
    return await this.simulate(
      'createStrategy',
      [
        params.tokenIn,
        params.tokenOut,
        params.amountPerInterval,
        params.interval,
        params.maxExecutions,
      ],
      account,
      options
    );
  }

  // ===== Event Functions =====

  /**
   * Get StrategyCreated events
   */
  async getStrategyCreatedEvents(fromBlock: bigint, toBlock?: bigint) {
    return await this.getEvents('StrategyCreated', fromBlock, toBlock);
  }

  /**
   * Get StrategyExecuted events
   */
  async getStrategyExecutedEvents(fromBlock: bigint, toBlock?: bigint) {
    return await this.getEvents('StrategyExecuted', fromBlock, toBlock);
  }
}
