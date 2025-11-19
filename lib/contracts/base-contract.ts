import {
  Address,
  Abi,
  encodeFunctionData,
  decodeFunctionResult,
  PublicClient,
  WalletClient,
} from 'viem';
import { getPublicClient, createWalletClientForChain } from '../web3-multi';
import { ChainConfig } from '../chains/types';
import {
  ContractConfig,
  ContractDeployment,
  ContractTxRequest,
  ContractCallResult,
  ReadOptions,
  WriteOptions,
} from './types';

/**
 * Base class for contract interactions
 * Provides reusable patterns for reading/writing contracts across chains
 */
export abstract class BaseContract {
  protected config: ContractConfig;
  protected currentChain: ChainConfig;
  protected publicClient: PublicClient;

  constructor(config: ContractConfig, chain: ChainConfig) {
    this.config = config;
    this.currentChain = chain;
    this.publicClient = getPublicClient(chain);
  }

  /**
   * Get contract deployment for current chain
   */
  protected getDeployment(): ContractDeployment {
    const deployment = this.config.deployments[this.currentChain.id];
    if (!deployment) {
      throw new Error(
        `Contract ${this.config.name} not deployed on ${this.currentChain.name}`
      );
    }
    return deployment;
  }

  /**
   * Get contract address for current chain
   */
  public getAddress(): Address {
    return this.getDeployment().address;
  }

  /**
   * Read from contract (view/pure functions)
   */
  protected async read<T>(
    functionName: string,
    args: any[] = [],
    options?: ReadOptions
  ): Promise<T> {
    try {
      const deployment = this.getDeployment();

      const result = await this.publicClient.readContract({
        address: deployment.address,
        abi: this.config.abi,
        functionName,
        args,
        blockNumber: options?.blockNumber,
        blockTag: options?.blockTag,
      });

      return result as T;
    } catch (error: any) {
      console.error(`[${this.config.name}] Read error (${functionName}):`, error);
      throw new Error(`Failed to read ${functionName}: ${error.message}`);
    }
  }

  /**
   * Prepare write transaction (returns unsigned tx for Turnkey to sign)
   */
  protected async prepareWrite(
    functionName: string,
    args: any[] = [],
    options?: WriteOptions
  ): Promise<ContractTxRequest> {
    try {
      const deployment = this.getDeployment();

      const data = encodeFunctionData({
        abi: this.config.abi,
        functionName,
        args,
      });

      return {
        to: deployment.address,
        data,
        value: options?.value,
        gas: options?.gas,
        gasPrice: options?.gasPrice,
      };
    } catch (error: any) {
      console.error(`[${this.config.name}] Prepare write error (${functionName}):`, error);
      throw new Error(`Failed to prepare ${functionName}: ${error.message}`);
    }
  }

  /**
   * Simulate contract call before execution
   */
  protected async simulate(
    functionName: string,
    args: any[] = [],
    account: Address,
    options?: WriteOptions
  ): Promise<any> {
    try {
      const deployment = this.getDeployment();

      const result = await this.publicClient.simulateContract({
        address: deployment.address,
        abi: this.config.abi,
        functionName,
        args,
        account,
        value: options?.value,
      });

      return result.result;
    } catch (error: any) {
      console.error(`[${this.config.name}] Simulation error (${functionName}):`, error);
      throw new Error(`Simulation failed for ${functionName}: ${error.message}`);
    }
  }

  /**
   * Get contract events
   */
  protected async getEvents<T>(
    eventName: string,
    fromBlock: bigint,
    toBlock?: bigint
  ): Promise<Array<{ args: T; blockNumber: bigint; transactionHash: string }>> {
    try {
      const deployment = this.getDeployment();

      const logs = await this.publicClient.getLogs({
        address: deployment.address,
        fromBlock,
        toBlock: toBlock || 'latest',
      });

      // Filter and parse event logs
      // Note: Viem automatically decodes logs based on ABI
      return logs as any;
    } catch (error: any) {
      console.error(`[${this.config.name}] Get events error (${eventName}):`, error);
      throw new Error(`Failed to get events ${eventName}: ${error.message}`);
    }
  }

  /**
   * Switch to a different chain
   */
  public switchChain(chain: ChainConfig): void {
    this.currentChain = chain;
    this.publicClient = getPublicClient(chain);
  }

  /**
   * Get current chain
   */
  public getChain(): ChainConfig {
    return this.currentChain;
  }

  /**
   * Check if contract is deployed on current chain
   */
  public isDeployedOnCurrentChain(): boolean {
    return !!this.config.deployments[this.currentChain.id];
  }
}
