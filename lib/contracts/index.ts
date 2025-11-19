// Base contract class
export { BaseContract } from './base-contract';

// Contract types
export type {
  ContractConfig,
  ContractDeployment,
  ContractTxRequest,
  ContractCallResult,
  ContractEvent,
  ReadOptions,
  WriteOptions,
} from './types';

// ABI utilities
export {
  extractFunctionSignatures,
  extractEventSignatures,
  getReadFunctions,
  getWriteFunctions,
  generateContractInterface,
  generateEventTypes,
} from './abi-types';

// Contract services
export { LimitOrderContract } from './limit-order';
export type { LimitOrder, CreateLimitOrderParams } from './limit-order';

export { DCAContract } from './dca';
export type { DCAStrategy, CreateDCAStrategyParams } from './dca';

// ABIs
export { LIMIT_ORDER_ABI, LIMIT_ORDER_ADDRESSES } from './abis/limit-order-abi';
export { DCA_ABI, DCA_ADDRESSES } from './abis/dca-abi';
