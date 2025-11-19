import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTurnkey } from '@turnkey/sdk-react-native';
import { FRAMER_THEME } from '~/lib/theme';
import { useChainStore } from '~/lib/stores';
import { RadialGradient } from '~/components/ui/radial-gradient';
import { LimitOrderContract } from '~/lib/contracts/limit-order';
import { DCAContract } from '~/lib/contracts/dca';
import { formatTransactionValue } from '~/lib/services/transactions';

interface LimitOrder {
  orderId: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  targetPrice: string;
  expiration: number;
  active: boolean;
}

interface DCAStrategy {
  strategyId: string;
  tokenIn: string;
  tokenOut: string;
  amountPerInterval: string;
  interval: number;
  executedCount: number;
  maxExecutions: number;
  active: boolean;
  nextExecution: number;
}

export default function PositionsScreen() {
  const { user } = useTurnkey();
  const { currentChain } = useChainStore();

  const [limitOrders, setLimitOrders] = useState<LimitOrder[]>([]);
  const [dcaStrategies, setDCAStrategies] = useState<DCAStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'limit' | 'dca'>('limit');

  const walletAddress = user?.wallets?.[0]?.accounts?.[0]?.address;

  useEffect(() => {
    if (walletAddress) {
      fetchPositions();
    }
  }, [walletAddress, currentChain]);

  const fetchPositions = async (isRefresh = false) => {
    if (!walletAddress) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // TODO: Fetch actual positions from contracts
      // For now, showing empty state
      // const limitOrderContract = new LimitOrderContract(currentChain.id);
      // const orders = await limitOrderContract.getActiveOrdersWithDetails(walletAddress);

      // const dcaContract = new DCAContract(currentChain.id);
      // const strategies = await dcaContract.getUserStrategiesWithDetails(walletAddress);

      setLimitOrders([]);
      setDCAStrategies([]);
    } catch (error) {
      console.error('Failed to fetch positions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchPositions(true);
  };

  const handleCancelLimitOrder = (orderId: string) => {
    Alert.alert(
      'Cancel Limit Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            // TODO: Call contract to cancel order
            console.log('Canceling order:', orderId);
          },
        },
      ]
    );
  };

  const handlePauseDCA = (strategyId: string) => {
    Alert.alert(
      'Pause DCA Strategy',
      'Pause this strategy? You can resume it later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pause',
          onPress: async () => {
            // TODO: Call contract to pause strategy
            console.log('Pausing strategy:', strategyId);
          },
        },
      ]
    );
  };

  const renderLimitOrderCard = (order: LimitOrder) => {
    const isExpiringSoon = order.expiration < Date.now() + 86400000; // 24 hours
    const expirationDate = new Date(order.expiration);

    return (
      <View key={order.orderId} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <RadialGradient
              colors={FRAMER_THEME.colors.gradient.pink}
              style={styles.cardIcon}
              cx="50%"
              cy="50%"
              rx="70%"
              ry="70%"
            >
              <Ionicons name="bar-chart" size={20} color={FRAMER_THEME.colors.text.inverse} />
            </RadialGradient>
            <View>
              <Text style={styles.cardTitle}>
                {order.tokenIn} → {order.tokenOut}
              </Text>
              <Text style={styles.cardSubtitle}>Limit Order</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.statusBadge}
            onPress={() => handleCancelLimitOrder(order.orderId)}
          >
            <Text style={styles.statusText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Amount</Text>
            <Text style={styles.cardValue}>{formatTransactionValue(order.amountIn)} {order.tokenIn}</Text>
          </View>

          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Target Price</Text>
            <Text style={styles.cardValue}>${order.targetPrice}</Text>
          </View>

          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Expiration</Text>
            <Text style={[styles.cardValue, isExpiringSoon && styles.cardValueWarning]}>
              {expirationDate.toLocaleDateString()} {expirationDate.toLocaleTimeString()}
            </Text>
          </View>

          {isExpiringSoon && (
            <View style={styles.warningBanner}>
              <Ionicons name="warning" size={16} color={FRAMER_THEME.colors.accent.yellow} />
              <Text style={styles.warningText}>Expires in less than 24 hours</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderDCACard = (strategy: DCAStrategy) => {
    const progress = (strategy.executedCount / strategy.maxExecutions) * 100;
    const nextExecutionDate = new Date(strategy.nextExecution);
    const intervalDays = Math.floor(strategy.interval / 86400);

    return (
      <View key={strategy.strategyId} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <RadialGradient
              colors={FRAMER_THEME.colors.gradient.blue}
              style={styles.cardIcon}
              cx="50%"
              cy="50%"
              rx="70%"
              ry="70%"
            >
              <Ionicons name="calendar" size={20} color={FRAMER_THEME.colors.text.inverse} />
            </RadialGradient>
            <View>
              <Text style={styles.cardTitle}>
                {strategy.tokenIn} → {strategy.tokenOut}
              </Text>
              <Text style={styles.cardSubtitle}>DCA Strategy</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.statusBadge}
            onPress={() => handlePauseDCA(strategy.strategyId)}
          >
            <Text style={styles.statusText}>Pause</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Amount Per Buy</Text>
            <Text style={styles.cardValue}>{formatTransactionValue(strategy.amountPerInterval)} {strategy.tokenIn}</Text>
          </View>

          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Interval</Text>
            <Text style={styles.cardValue}>Every {intervalDays} day{intervalDays > 1 ? 's' : ''}</Text>
          </View>

          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Progress</Text>
            <Text style={styles.cardValue}>
              {strategy.executedCount} / {strategy.maxExecutions}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
          </View>

          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Next Execution</Text>
            <Text style={styles.cardValue}>
              {nextExecutionDate.toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <RadialGradient
          colors={activeTab === 'limit' ? FRAMER_THEME.colors.gradient.pink : FRAMER_THEME.colors.gradient.blue}
          style={styles.emptyIconGradient}
          cx="50%"
          cy="50%"
          rx="70%"
          ry="70%"
        >
          <Ionicons
            name={activeTab === 'limit' ? 'bar-chart-outline' : 'calendar-outline'}
            size={48}
            color={FRAMER_THEME.colors.text.inverse}
          />
        </RadialGradient>
      </View>
      <Text style={styles.emptyTitle}>
        No {activeTab === 'limit' ? 'Limit Orders' : 'DCA Strategies'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'limit'
          ? 'Create your first limit order to automate swaps at target prices'
          : 'Start dollar-cost averaging to build positions over time'}
      </Text>
      <TouchableOpacity style={styles.emptyButton} activeOpacity={0.7}>
        <RadialGradient
          colors={activeTab === 'limit' ? FRAMER_THEME.colors.gradient.pink : FRAMER_THEME.colors.gradient.blue}
          style={styles.emptyButtonGradient}
          cx="50%"
          cy="50%"
          rx="70%"
          ry="70%"
        >
          <Ionicons name="add" size={20} color={FRAMER_THEME.colors.text.inverse} />
          <Text style={styles.emptyButtonText}>
            Create {activeTab === 'limit' ? 'Limit Order' : 'DCA Strategy'}
          </Text>
        </RadialGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Active Positions</Text>
        <Text style={styles.subtitle}>Track your automation strategies</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'limit' && styles.tabActive]}
          onPress={() => setActiveTab('limit')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'limit' && styles.tabTextActive]}>
            Limit Orders
          </Text>
          {limitOrders.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{limitOrders.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'dca' && styles.tabActive]}
          onPress={() => setActiveTab('dca')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'dca' && styles.tabTextActive]}>
            DCA Strategies
          </Text>
          {dcaStrategies.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{dcaStrategies.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={FRAMER_THEME.colors.accent.pink}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={FRAMER_THEME.colors.accent.pink} />
            <Text style={styles.loadingText}>Loading positions...</Text>
          </View>
        ) : (
          <View style={styles.content}>
            {activeTab === 'limit' ? (
              limitOrders.length > 0 ? (
                limitOrders.map(renderLimitOrderCard)
              ) : (
                renderEmptyState()
              )
            ) : (
              dcaStrategies.length > 0 ? (
                dcaStrategies.map(renderDCACard)
              ) : (
                renderEmptyState()
              )
            )}
          </View>
        )}
      </ScrollView>
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
    paddingBottom: FRAMER_THEME.spacing.md,
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
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: FRAMER_THEME.spacing.lg,
    marginBottom: FRAMER_THEME.spacing.md,
    gap: FRAMER_THEME.spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: FRAMER_THEME.spacing.xs,
    paddingVertical: FRAMER_THEME.spacing.sm,
    borderRadius: FRAMER_THEME.borderRadius.md,
    backgroundColor: FRAMER_THEME.colors.background.secondary,
  },
  tabActive: {
    backgroundColor: FRAMER_THEME.colors.accent.pink,
  },
  tabText: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.semibold,
    color: FRAMER_THEME.colors.text.secondary,
  },
  tabTextActive: {
    color: FRAMER_THEME.colors.text.inverse,
  },
  tabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: FRAMER_THEME.borderRadius.full,
    paddingHorizontal: FRAMER_THEME.spacing.xs,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: FRAMER_THEME.typography.fontSize.xs,
    fontWeight: FRAMER_THEME.typography.fontWeight.bold,
    color: FRAMER_THEME.colors.text.inverse,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: FRAMER_THEME.spacing.lg,
    paddingBottom: FRAMER_THEME.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: FRAMER_THEME.spacing['4xl'],
  },
  loadingText: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.medium,
    color: FRAMER_THEME.colors.text.secondary,
    marginTop: FRAMER_THEME.spacing.md,
  },
  card: {
    backgroundColor: FRAMER_THEME.colors.background.card,
    borderRadius: FRAMER_THEME.borderRadius.lg,
    marginBottom: FRAMER_THEME.spacing.md,
    ...FRAMER_THEME.shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: FRAMER_THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: FRAMER_THEME.colors.border.light,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: FRAMER_THEME.spacing.sm,
    flex: 1,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: FRAMER_THEME.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: FRAMER_THEME.typography.fontSize.lg,
    fontWeight: FRAMER_THEME.typography.fontWeight.bold,
    color: FRAMER_THEME.colors.text.primary,
  },
  cardSubtitle: {
    fontSize: FRAMER_THEME.typography.fontSize.sm,
    fontWeight: FRAMER_THEME.typography.fontWeight.medium,
    color: FRAMER_THEME.colors.text.tertiary,
  },
  statusBadge: {
    paddingHorizontal: FRAMER_THEME.spacing.sm,
    paddingVertical: FRAMER_THEME.spacing.xs,
    borderRadius: FRAMER_THEME.borderRadius.sm,
    backgroundColor: FRAMER_THEME.colors.background.secondary,
  },
  statusText: {
    fontSize: FRAMER_THEME.typography.fontSize.sm,
    fontWeight: FRAMER_THEME.typography.fontWeight.semibold,
    color: FRAMER_THEME.colors.text.secondary,
  },
  cardBody: {
    padding: FRAMER_THEME.spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: FRAMER_THEME.spacing.sm,
  },
  cardLabel: {
    fontSize: FRAMER_THEME.typography.fontSize.sm,
    fontWeight: FRAMER_THEME.typography.fontWeight.medium,
    color: FRAMER_THEME.colors.text.secondary,
  },
  cardValue: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.semibold,
    color: FRAMER_THEME.colors.text.primary,
  },
  cardValueWarning: {
    color: FRAMER_THEME.colors.accent.yellow,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: FRAMER_THEME.spacing.xs,
    backgroundColor: FRAMER_THEME.colors.surface.yellow,
    padding: FRAMER_THEME.spacing.sm,
    borderRadius: FRAMER_THEME.borderRadius.sm,
    marginTop: FRAMER_THEME.spacing.sm,
  },
  warningText: {
    fontSize: FRAMER_THEME.typography.fontSize.sm,
    fontWeight: FRAMER_THEME.typography.fontWeight.medium,
    color: FRAMER_THEME.colors.accent.yellow,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: FRAMER_THEME.spacing.sm,
    marginTop: FRAMER_THEME.spacing.xs,
    marginBottom: FRAMER_THEME.spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: FRAMER_THEME.colors.background.secondary,
    borderRadius: FRAMER_THEME.borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: FRAMER_THEME.colors.accent.blue,
    borderRadius: FRAMER_THEME.borderRadius.full,
  },
  progressText: {
    fontSize: FRAMER_THEME.typography.fontSize.sm,
    fontWeight: FRAMER_THEME.typography.fontWeight.bold,
    color: FRAMER_THEME.colors.text.secondary,
    minWidth: 40,
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: FRAMER_THEME.spacing['4xl'],
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
    lineHeight: FRAMER_THEME.typography.fontSize.base * FRAMER_THEME.typography.lineHeight.relaxed,
    marginBottom: FRAMER_THEME.spacing.xl,
  },
  emptyButton: {
    width: '100%',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: FRAMER_THEME.spacing.sm,
    borderRadius: FRAMER_THEME.borderRadius.md,
    paddingVertical: FRAMER_THEME.spacing.md,
    ...FRAMER_THEME.shadows.md,
  },
  emptyButtonText: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.bold,
    color: FRAMER_THEME.colors.text.inverse,
  },
});
