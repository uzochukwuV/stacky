import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTurnkey } from '@turnkey/sdk-react-native';
import { FRAMER_THEME } from '~/lib/theme';
import { useChainStore } from '~/lib/stores';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
  getTransactionHistory,
  formatTransactionValue,
  formatTransactionDate,
  getExplorerUrl,
} from '~/lib/services/transactions';
import { RadialGradient } from '~/components/ui/radial-gradient';

export default function TransactionsScreen() {
  const { user } = useTurnkey();
  const { currentChain } = useChainStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageKey, setPageKey] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);

  const walletAddress = user?.wallets?.[0]?.accounts?.[0]?.address;

  useEffect(() => {
    if (walletAddress) {
      fetchTransactions();
    }
  }, [walletAddress, currentChain]);

  const fetchTransactions = async (refresh = false) => {
    if (!walletAddress) return;

    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const result = await getTransactionHistory({
        address: walletAddress as `0x${string}`,
        chain: currentChain,
        pageKey: refresh ? undefined : pageKey,
      });

      setTransactions(refresh ? result.transactions : [...transactions, ...result.transactions]);
      setPageKey(result.pageKey);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchTransactions(true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchTransactions();
    }
  };

  const handleOpenExplorer = (tx: Transaction) => {
    const url = getExplorerUrl(tx.hash, currentChain);
    Linking.openURL(url);
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isSent = item.type === TransactionType.SEND;
    const isSuccess = item.status === TransactionStatus.SUCCESS;
    const isPending = item.status === TransactionStatus.PENDING;

    const iconName =
      item.type === TransactionType.SEND
        ? 'arrow-up-circle'
        : item.type === TransactionType.RECEIVE
        ? 'arrow-down-circle'
        : item.type === TransactionType.SWAP
        ? 'swap-horizontal-circle'
        : 'code-working';

    const iconColor = isSent
      ? FRAMER_THEME.colors.accent.pink
      : FRAMER_THEME.colors.accent.blue;

    return (
      <TouchableOpacity
        style={styles.transactionCard}
        activeOpacity={0.7}
        onPress={() => handleOpenExplorer(item)}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={iconName as any} size={32} color={iconColor} />
          {isPending && (
            <View style={styles.pendingBadge}>
              <ActivityIndicator size="small" color={FRAMER_THEME.colors.accent.yellow} />
            </View>
          )}
        </View>

        <View style={styles.transactionContent}>
          <View style={styles.transactionHeader}>
            <Text style={styles.transactionType}>
              {item.type === TransactionType.SEND && 'Sent'}
              {item.type === TransactionType.RECEIVE && 'Received'}
              {item.type === TransactionType.SWAP && 'Swapped'}
              {item.type === TransactionType.CONTRACT && 'Contract'}
            </Text>
            <Text style={[styles.transactionValue, isSent && styles.transactionValueSent]}>
              {isSent ? '-' : '+'}
              {formatTransactionValue(item.value)} {item.asset}
            </Text>
          </View>

          <View style={styles.transactionMeta}>
            <Text style={styles.transactionAddress} numberOfLines={1}>
              {isSent ? `To: ${item.to?.slice(0, 10)}...${item.to?.slice(-8)}` : `From: ${item.from.slice(0, 10)}...${item.from.slice(-8)}`}
            </Text>
            <Text style={styles.transactionTime}>{formatTransactionDate(item.timestamp)}</Text>
          </View>

          {!isSuccess && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {isPending ? 'Pending' : 'Failed'}
              </Text>
            </View>
          )}
        </View>

        <Ionicons
          name="open-outline"
          size={20}
          color={FRAMER_THEME.colors.text.tertiary}
          style={styles.externalIcon}
        />
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={FRAMER_THEME.colors.accent.pink} />
          <Text style={styles.emptyText}>Loading transactions...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <RadialGradient
            colors={FRAMER_THEME.colors.gradient.pink}
            style={styles.emptyIconGradient}
            cx="50%"
            cy="50%"
            rx="70%"
            ry="70%"
          >
            <Ionicons
              name="receipt-outline"
              size={48}
              color={FRAMER_THEME.colors.text.inverse}
            />
          </RadialGradient>
        </View>
        <Text style={styles.emptyTitle}>No Transactions Yet</Text>
        <Text style={styles.emptySubtitle}>
          Your transaction history will appear here
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!hasMore) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={FRAMER_THEME.colors.accent.pink} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <Text style={styles.subtitle}>
          History on {currentChain.name}
        </Text>
      </View>

      {/* Transactions List */}
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.hash}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={FRAMER_THEME.colors.accent.pink}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={
          transactions.length === 0 ? styles.emptyList : styles.list
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FRAMER_THEME.colors.background.primary,
  },
  header: {
    paddingHorizontal: FRAMER_THEME.spacing.lg,
    paddingTop: FRAMER_THEME.spacing['3xl'],
    paddingBottom: FRAMER_THEME.spacing.lg,
  },
  title: {
    fontSize: FRAMER_THEME.typography.fontSize['3xl'],
    fontWeight: FRAMER_THEME.typography.fontWeight.bold,
    color: FRAMER_THEME.colors.text.primary,
    marginBottom: FRAMER_THEME.spacing.xs,
  },
  subtitle: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.regular,
    color: FRAMER_THEME.colors.text.secondary,
  },
  list: {
    paddingHorizontal: FRAMER_THEME.spacing.lg,
    paddingBottom: FRAMER_THEME.spacing.xl,
  },
  emptyList: {
    flex: 1,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FRAMER_THEME.colors.background.card,
    borderRadius: FRAMER_THEME.borderRadius.md,
    padding: FRAMER_THEME.spacing.md,
    marginBottom: FRAMER_THEME.spacing.sm,
    ...FRAMER_THEME.shadows.sm,
  },
  iconContainer: {
    position: 'relative',
    marginRight: FRAMER_THEME.spacing.md,
  },
  pendingBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    backgroundColor: FRAMER_THEME.colors.background.card,
    borderRadius: 10,
    padding: 2,
  },
  transactionContent: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionType: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.semibold,
    color: FRAMER_THEME.colors.text.primary,
  },
  transactionValue: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.bold,
    color: FRAMER_THEME.colors.accent.blue,
  },
  transactionValueSent: {
    color: FRAMER_THEME.colors.text.secondary,
  },
  transactionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionAddress: {
    flex: 1,
    fontSize: FRAMER_THEME.typography.fontSize.sm,
    fontWeight: FRAMER_THEME.typography.fontWeight.medium,
    color: FRAMER_THEME.colors.text.tertiary,
    marginRight: FRAMER_THEME.spacing.sm,
  },
  transactionTime: {
    fontSize: FRAMER_THEME.typography.fontSize.xs,
    fontWeight: FRAMER_THEME.typography.fontWeight.medium,
    color: FRAMER_THEME.colors.text.tertiary,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    marginTop: FRAMER_THEME.spacing.xs,
    paddingHorizontal: FRAMER_THEME.spacing.sm,
    paddingVertical: 2,
    backgroundColor: FRAMER_THEME.colors.surface.yellow,
    borderRadius: FRAMER_THEME.borderRadius.sm,
  },
  statusText: {
    fontSize: FRAMER_THEME.typography.fontSize.xs,
    fontWeight: FRAMER_THEME.typography.fontWeight.semibold,
    color: FRAMER_THEME.colors.accent.yellow,
  },
  externalIcon: {
    marginLeft: FRAMER_THEME.spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: FRAMER_THEME.spacing.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    marginBottom: FRAMER_THEME.spacing.lg,
  },
  emptyIconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: FRAMER_THEME.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...FRAMER_THEME.shadows.lg,
  },
  emptyTitle: {
    fontSize: FRAMER_THEME.typography.fontSize.xl,
    fontWeight: FRAMER_THEME.typography.fontWeight.bold,
    color: FRAMER_THEME.colors.text.primary,
    marginBottom: FRAMER_THEME.spacing.xs,
  },
  emptySubtitle: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.regular,
    color: FRAMER_THEME.colors.text.secondary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.medium,
    color: FRAMER_THEME.colors.text.secondary,
    marginTop: FRAMER_THEME.spacing.md,
  },
  footer: {
    paddingVertical: FRAMER_THEME.spacing.lg,
    alignItems: 'center',
  },
});
