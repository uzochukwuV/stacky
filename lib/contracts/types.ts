import { Address, Abi } from 'viem';
import { ChainConfig } from '../chains/types';

/**
 * Contract deployment info per chain
 */
export interface ContractDeployment {
  address: Address;
  chainId: string;
  blockNumber?: number;
  deployedAt?: Date;
}

/**
 * Base contract configuration
 */
export interface ContractConfig {
  name: string;
  abi: Abi;
  deployments: Record<string, ContractDeployment>; // chainId -> deployment
}

/**
 * Transaction request for contract calls
 */
export interface ContractTxRequest {
  to: Address;
  data: `0x${string}`;
  value?: bigint;
  gas?: bigint;
  gasPrice?: bigint;
}

/**
 * Contract call result
 */
export interface ContractCallResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  txHash?: string;
}

/**
 * Event log data
 */
export interface ContractEvent<T = any> {
  eventName: string;
  args: T;
  transactionHash: string;
  blockNumber: bigint;
  logIndex: number;
}

/**
 * Contract read options
 */
export interface ReadOptions {
  blockNumber?: bigint;
  blockTag?: 'latest' | 'earliest' | 'pending';
}

/**
 * Contract write options
 */
export interface WriteOptions {
  value?: bigint;
  gas?: bigint;
  gasPrice?: bigint;
  nonce?: number;
}
