import { Alchemy, AssetTransfersCategory, SortingOrder } from 'alchemy-sdk';
import { Address } from 'viem';
import { ChainConfig } from '../chains/config';
import { getAlchemyInstance } from './alchemy';

export enum TransactionType {
  SEND = 'send',
  RECEIVE = 'receive',
  SWAP = 'swap',
  CONTRACT = 'contract',
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export interface Transaction {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  valueUSD?: number;
  asset: string; // Token symbol or 'ETH', 'MATIC'
  assetAddress?: string; // Contract address for tokens
  type: TransactionType;
  status: TransactionStatus;
  timestamp: number;
  blockNumber: number;
  gasUsed?: string;
  gasFee?: string;
  gasFeeUSD?: number;
  chainId: string;
  chainName: string;
  metadata?: {
    contractAddress?: string;
    method?: string;
    tokenId?: string;
  };
}

interface GetTransactionsOptions {
  address: Address;
  chain: ChainConfig;
  pageKey?: string;
  maxCount?: number;
}

interface TransactionsResponse {
  transactions: Transaction[];
  pageKey?: string;
  hasMore: boolean;
}

/**
 * Fetch transaction history for an address on a specific chain
 */
export async function getTransactionHistory(
  options: GetTransactionsOptions
): Promise<TransactionsResponse> {
  const { address, chain, pageKey, maxCount = 50 } = options;

  try {
    const alchemy = getAlchemyInstance(chain);

    // Fetch both incoming and outgoing transfers
    const [fromTransfers, toTransfers] = await Promise.all([
      alchemy.core.getAssetTransfers({
        fromAddress: address,
        category: [
          AssetTransfersCategory.EXTERNAL,
          AssetTransfersCategory.ERC20,
          AssetTransfersCategory.ERC721,
          AssetTransfersCategory.ERC1155,
        ],
        order: SortingOrder.DESCENDING,
        maxCount: maxCount / 2,
        pageKey,
      }),
      alchemy.core.getAssetTransfers({
        toAddress: address,
        category: [
          AssetTransfersCategory.EXTERNAL,
          AssetTransfersCategory.ERC20,
          AssetTransfersCategory.ERC721,
          AssetTransfersCategory.ERC1155,
        ],
        order: SortingOrder.DESCENDING,
        maxCount: maxCount / 2,
        pageKey,
      }),
    ]);

    // Combine and sort by block number
    const allTransfers = [
      ...fromTransfers.transfers.map((t) => ({ ...t, direction: 'from' as const })),
      ...toTransfers.transfers.map((t) => ({ ...t, direction: 'to' as const })),
    ].sort((a, b) => {
      const blockA = parseInt(a.blockNum, 16);
      const blockB = parseInt(b.blockNum, 16);
      return blockB - blockA; // Descending order
    });

    // Transform to our Transaction format
    const transactions: Transaction[] = allTransfers.map((transfer) => {
      const isSent = transfer.direction === 'from';
      const blockNumber = parseInt(transfer.blockNum, 16);

      return {
        hash: transfer.hash,
        from: transfer.from,
        to: transfer.to,
        value: transfer.value?.toString() || '0',
        asset: transfer.asset || chain.nativeCurrency.symbol,
        assetAddress: transfer.rawContract?.address,
        type: isSent ? TransactionType.SEND : TransactionType.RECEIVE,
        status: TransactionStatus.SUCCESS, // Alchemy only returns successful transfers
        timestamp: Date.now(), // We'll enhance this with block timestamps later
        blockNumber,
        chainId: chain.id,
        chainName: chain.name,
        metadata: transfer.category.includes('ERC721') || transfer.category.includes('ERC1155')
          ? { tokenId: transfer.tokenId }
          : undefined,
      };
    });

    return {
      transactions,
      pageKey: fromTransfers.pageKey || toTransfers.pageKey,
      hasMore: !!(fromTransfers.pageKey || toTransfers.pageKey),
    };
  } catch (error) {
    console.error('[Transactions] Failed to fetch history:', error);
    throw error;
  }
}

/**
 * Get pending transactions from local storage
 * (We'll implement this when we build transaction submission)
 */
export async function getPendingTransactions(
  address: Address,
  chainId: string
): Promise<Transaction[]> {
  // TODO: Implement local storage for pending transactions
  return [];
}

/**
 * Fetch transaction details by hash
 */
export async function getTransactionDetails(
  hash: string,
  chain: ChainConfig
): Promise<Transaction | null> {
  try {
    const alchemy = getAlchemyInstance(chain);
    const receipt = await alchemy.core.getTransactionReceipt(hash);

    if (!receipt) {
      return null;
    }

    const transaction = await alchemy.core.getTransaction(hash);
    if (!transaction) {
      return null;
    }

    const gasUsed = receipt.gasUsed.toString();
    const gasFee = (receipt.effectiveGasPrice * receipt.gasUsed).toString();

    return {
      hash: receipt.transactionHash,
      from: receipt.from,
      to: receipt.to,
      value: transaction.value.toString(),
      asset: chain.nativeCurrency.symbol,
      type: receipt.to ? TransactionType.SEND : TransactionType.CONTRACT,
      status: receipt.status === 1 ? TransactionStatus.SUCCESS : TransactionStatus.FAILED,
      timestamp: Date.now(), // We'll get block timestamp
      blockNumber: receipt.blockNumber,
      gasUsed,
      gasFee,
      chainId: chain.id,
      chainName: chain.name,
    };
  } catch (error) {
    console.error('[Transactions] Failed to fetch details:', error);
    return null;
  }
}

/**
 * Format transaction value for display
 */
export function formatTransactionValue(value: string, decimals: number = 18): string {
  const num = parseFloat(value) / Math.pow(10, decimals);
  if (num === 0) return '0';
  if (num < 0.000001) return '< 0.000001';
  if (num < 1) return num.toFixed(6);
  if (num < 1000) return num.toFixed(4);
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/**
 * Get transaction explorer URL
 */
export function getExplorerUrl(hash: string, chain: ChainConfig): string {
  return `${chain.blockExplorer}/tx/${hash}`;
}

/**
 * Format timestamp to readable date
 */
export function formatTransactionDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}
