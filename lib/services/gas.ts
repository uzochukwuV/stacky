import { Address, formatEther, parseEther } from 'viem';
import { ChainConfig } from '../chains/config';
import { getPublicClient } from '../web3-multi';
import { getNativeCurrencyPrice, formatPrice, type TokenPrice } from './prices';

export interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  totalGasCost: bigint;
  totalGasCostETH: string;
  totalGasCostUSD: number;
  estimateType: 'legacy' | 'eip1559';
}

export interface TransactionSimulation {
  success: boolean;
  gasUsed: bigint;
  returnValue?: string;
  revertReason?: string;
  stateChanges: {
    balanceChanges: Array<{
      address: Address;
      before: bigint;
      after: bigint;
      change: bigint;
    }>;
  };
}

export interface TransactionPreview {
  gas: GasEstimate;
  simulation: TransactionSimulation;
  warnings: string[];
  canExecute: boolean;
}

/**
 * Estimate gas for a transaction with current network prices
 */
export async function estimateGas(
  from: Address,
  to: Address,
  data?: `0x${string}`,
  value?: bigint,
  chain: ChainConfig
): Promise<GasEstimate> {
  const client = getPublicClient(chain);

  try {
    // Estimate gas limit
    const gasLimit = await client.estimateGas({
      account: from,
      to,
      data,
      value: value || 0n,
    });

    // Add 20% buffer to gas limit for safety
    const bufferedGasLimit = (gasLimit * 120n) / 100n;

    // Get current gas prices
    const feeData = await client.estimateFeesPerGas();

    let estimate: GasEstimate;

    if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
      // EIP-1559 transaction
      const maxFeePerGas = feeData.maxFeePerGas;
      const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
      const totalGasCost = bufferedGasLimit * maxFeePerGas;

      estimate = {
        gasLimit: bufferedGasLimit,
        gasPrice: maxFeePerGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        totalGasCost,
        totalGasCostETH: formatEther(totalGasCost),
        totalGasCostUSD: 0, // Will be calculated below
        estimateType: 'eip1559',
      };
    } else {
      // Legacy transaction
      const gasPrice = feeData.gasPrice || 0n;
      const totalGasCost = bufferedGasLimit * gasPrice;

      estimate = {
        gasLimit: bufferedGasLimit,
        gasPrice,
        totalGasCost,
        totalGasCostETH: formatEther(totalGasCost),
        totalGasCostUSD: 0, // Will be calculated below
        estimateType: 'legacy',
      };
    }

    // Get USD value
    const priceData = await getNativeCurrencyPrice(chain.nativeCurrency.symbol);
    if (priceData) {
      const gasCostNum = parseFloat(estimate.totalGasCostETH);
      estimate.totalGasCostUSD = gasCostNum * priceData.usd;
    }

    return estimate;
  } catch (error) {
    console.error('[Gas] Failed to estimate gas:', error);
    throw new Error('Gas estimation failed');
  }
}

/**
 * Simulate a transaction to predict its outcome
 */
export async function simulateTransaction(
  from: Address,
  to: Address,
  data?: `0x${string}`,
  value?: bigint,
  chain: ChainConfig
): Promise<TransactionSimulation> {
  const client = getPublicClient(chain);

  try {
    // Get balance before simulation
    const balanceBefore = await client.getBalance({ address: from });

    // Simulate the transaction
    const { request } = await client.simulateContract({
      account: from,
      address: to,
      data: data || '0x',
      value: value || 0n,
    } as any);

    // Estimate gas for the transaction
    const gasUsed = await client.estimateGas({
      account: from,
      to,
      data,
      value: value || 0n,
    });

    // Calculate expected balance after
    const gasCost = gasUsed * (await client.getGasPrice());
    const balanceAfter = balanceBefore - (value || 0n) - gasCost;

    return {
      success: true,
      gasUsed,
      stateChanges: {
        balanceChanges: [
          {
            address: from,
            before: balanceBefore,
            after: balanceAfter,
            change: balanceAfter - balanceBefore,
          },
        ],
      },
    };
  } catch (error: any) {
    // Try to extract revert reason
    let revertReason = 'Transaction would fail';
    if (error.message) {
      // Parse common revert patterns
      const match = error.message.match(/reverted with reason string '(.+?)'/);
      if (match) {
        revertReason = match[1];
      } else if (error.message.includes('insufficient funds')) {
        revertReason = 'Insufficient funds for transaction';
      } else if (error.message.includes('gas required exceeds allowance')) {
        revertReason = 'Gas limit too low';
      }
    }

    return {
      success: false,
      gasUsed: 0n,
      revertReason,
      stateChanges: {
        balanceChanges: [],
      },
    };
  }
}

/**
 * Get comprehensive transaction preview with gas estimation and simulation
 */
export async function previewTransaction(
  from: Address,
  to: Address,
  data?: `0x${string}`,
  value?: bigint,
  chain: ChainConfig
): Promise<TransactionPreview> {
  const warnings: string[] = [];

  try {
    // Run estimation and simulation in parallel
    const [gas, simulation] = await Promise.all([
      estimateGas(from, to, data, value, chain),
      simulateTransaction(from, to, data, value, chain),
    ]);

    // Check for warnings
    const client = getPublicClient(chain);
    const balance = await client.getBalance({ address: from });

    // Warning: High gas cost
    if (gas.totalGasCostUSD > 10) {
      warnings.push(`High gas fee: ${formatPrice(gas.totalGasCostUSD)}`);
    }

    // Warning: Insufficient balance
    const totalCost = (value || 0n) + gas.totalGasCost;
    if (balance < totalCost) {
      warnings.push(
        `Insufficient balance. Need ${formatEther(totalCost)} ${chain.nativeCurrency.symbol}, have ${formatEther(balance)}`
      );
    }

    // Warning: Transaction will likely fail
    if (!simulation.success) {
      warnings.push(`Simulation failed: ${simulation.revertReason}`);
    }

    return {
      gas,
      simulation,
      warnings,
      canExecute: simulation.success && balance >= totalCost,
    };
  } catch (error) {
    console.error('[Gas] Failed to preview transaction:', error);
    throw error;
  }
}

/**
 * Format gas price for display
 */
export function formatGasPrice(gasPrice: bigint): string {
  const gwei = Number(gasPrice) / 1e9;
  return `${gwei.toFixed(2)} Gwei`;
}

/**
 * Get recommended gas settings for different speed levels
 */
export async function getGasOptions(
  chain: ChainConfig
): Promise<{
  slow: GasEstimate;
  standard: GasEstimate;
  fast: GasEstimate;
}> {
  const client = getPublicClient(chain);
  const feeData = await client.estimateFeesPerGas();

  // Get price for USD conversion
  const priceData = await getNativeCurrencyPrice(chain.nativeCurrency.symbol);

  const gasLimit = 21000n; // Standard transfer

  const createEstimate = (multiplier: number, label: string): GasEstimate => {
    if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
      const maxFeePerGas = (feeData.maxFeePerGas * BigInt(Math.floor(multiplier * 100))) / 100n;
      const maxPriorityFeePerGas =
        (feeData.maxPriorityFeePerGas * BigInt(Math.floor(multiplier * 100))) / 100n;
      const totalGasCost = gasLimit * maxFeePerGas;
      const totalGasCostETH = formatEther(totalGasCost);
      const totalGasCostUSD = priceData ? parseFloat(totalGasCostETH) * priceData.usd : 0;

      return {
        gasLimit,
        gasPrice: maxFeePerGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        totalGasCost,
        totalGasCostETH,
        totalGasCostUSD,
        estimateType: 'eip1559',
      };
    } else {
      const gasPrice = ((feeData.gasPrice || 0n) * BigInt(Math.floor(multiplier * 100))) / 100n;
      const totalGasCost = gasLimit * gasPrice;
      const totalGasCostETH = formatEther(totalGasCost);
      const totalGasCostUSD = priceData ? parseFloat(totalGasCostETH) * priceData.usd : 0;

      return {
        gasLimit,
        gasPrice,
        totalGasCost,
        totalGasCostETH,
        totalGasCostUSD,
        estimateType: 'legacy',
      };
    }
  };

  return {
    slow: createEstimate(0.9, 'Slow'),
    standard: createEstimate(1.0, 'Standard'),
    fast: createEstimate(1.2, 'Fast'),
  };
}
