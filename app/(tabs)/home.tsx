import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { RadialGradient } from '~/components/ui/radial-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTurnkey } from '@turnkey/sdk-react-native';
import { FRAMER_THEME } from '~/lib/theme';
import { useChainStore } from '~/lib/stores';
import { ChainSwitcher } from '~/components/chain-switcher';

const { width } = Dimensions.get('window');

interface QuickAction {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: string[];
  route: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: '1',
    title: 'Swap',
    icon: 'swap-horizontal',
    gradient: FRAMER_THEME.colors.gradient.pink,
    route: '/swap-new',
  },
  {
    id: '2',
    title: 'Portfolio',
    icon: 'pie-chart',
    gradient: FRAMER_THEME.colors.gradient.blue,
    route: '/portfolio',
  },
  {
    id: '3',
    title: 'Send',
    icon: 'paper-plane',
    gradient: FRAMER_THEME.colors.gradient.yellow,
    route: '/transfer',
  },
  {
    id: '4',
    title: 'Receive',
    icon: 'download',
    gradient: FRAMER_THEME.colors.gradient.indigo,
    route: '/dashboard',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useTurnkey();
  const { currentChain } = useChainStore();

  const walletAddress = user?.wallets?.[0]?.accounts?.[0]?.address;
  const truncatedAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : '';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.username}>
            {user?.wallets?.[0]?.walletName || 'User'}
          </Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <RadialGradient
            colors={FRAMER_THEME.colors.gradient.pink}
            style={styles.profileGradient}
            cx="50%"
            cy="50%"
            rx="70%"
            ry="70%"
          >
            <Ionicons
              name="person"
              size={20}
              color={FRAMER_THEME.colors.text.inverse}
            />
          </RadialGradient>
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <View>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <View style={styles.addressContainer}>
              <Text style={styles.address}>{truncatedAddress}</Text>
              <TouchableOpacity style={styles.copyButton}>
                <Ionicons
                  name="copy-outline"
                  size={14}
                  color={FRAMER_THEME.colors.text.secondary}
                />
              </TouchableOpacity>
            </View>
          </View>
          <ChainSwitcher />
        </View>

        <View style={styles.balanceAmount}>
          <Text style={styles.balanceValue}>$0.00</Text>
          <View style={styles.balanceChange}>
            <Ionicons
              name="trending-up"
              size={16}
              color={FRAMER_THEME.colors.status.success}
            />
            <Text style={styles.balanceChangeText}>+0.00%</Text>
          </View>
        </View>

        {/* Chain Info */}
        <View style={styles.chainInfo}>
          <Text style={styles.chainLabel}>Network</Text>
          <View style={styles.chainBadge}>
            <Text style={styles.chainIcon}>{currentChain.icon}</Text>
            <Text style={styles.chainName}>{currentChain.name}</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.7}
            >
              <RadialGradient
                colors={action.gradient}
                style={styles.actionGradient}
                cx="50%"
                cy="50%"
                rx="70%"
                ry="70%"
              >
                <Ionicons
                  name={action.icon}
                  size={24}
                  color={FRAMER_THEME.colors.text.inverse}
                />
              </RadialGradient>
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>DeFi Tools</Text>

        {/* Limit Orders */}
        <TouchableOpacity style={styles.featureCard} activeOpacity={0.7}>
          <View style={styles.featureIcon}>
            <RadialGradient
              colors={FRAMER_THEME.colors.gradient.pink}
              style={styles.featureIconGradient}
              cx="50%"
              cy="50%"
              rx="70%"
              ry="70%"
            >
              <Ionicons
                name="bar-chart"
                size={20}
                color={FRAMER_THEME.colors.text.inverse}
              />
            </RadialGradient>
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Limit Orders</Text>
            <Text style={styles.featureDescription}>
              Automate token swaps at target prices
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={FRAMER_THEME.colors.text.tertiary}
          />
        </TouchableOpacity>

        {/* DCA */}
        <TouchableOpacity style={styles.featureCard} activeOpacity={0.7}>
          <View style={styles.featureIcon}>
            <RadialGradient
              colors={FRAMER_THEME.colors.gradient.blue}
              style={styles.featureIconGradient}
              cx="50%"
              cy="50%"
              rx="70%"
              ry="70%"
            >
              <Ionicons
                name="calendar"
                size={20}
                color={FRAMER_THEME.colors.text.inverse}
              />
            </RadialGradient>
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>DCA Strategies</Text>
            <Text style={styles.featureDescription}>
              Dollar-cost average automatically
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={FRAMER_THEME.colors.text.tertiary}
          />
        </TouchableOpacity>

        {/* Marketplace */}
        <TouchableOpacity style={styles.featureCard} activeOpacity={0.7}>
          <View style={styles.featureIcon}>
            <RadialGradient
              colors={FRAMER_THEME.colors.gradient.yellow}
              style={styles.featureIconGradient}
              cx="50%"
              cy="50%"
              rx="70%"
              ry="70%"
            >
              <Ionicons
                name="storefront"
                size={20}
                color={FRAMER_THEME.colors.text.inverse}
              />
            </RadialGradient>
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Marketplace</Text>
            <Text style={styles.featureDescription}>
              Browse and execute DeFi tasks
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={FRAMER_THEME.colors.text.tertiary}
          />
        </TouchableOpacity>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FRAMER_THEME.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: FRAMER_THEME.spacing.lg,
    paddingTop: FRAMER_THEME.spacing['2xl'],
    paddingBottom: FRAMER_THEME.spacing.lg,
  },
  greeting: {
    fontSize: FRAMER_THEME.typography.fontSize.sm,
    fontWeight: FRAMER_THEME.typography.fontWeight.medium,
    color: FRAMER_THEME.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  username: {
    fontSize: FRAMER_THEME.typography.fontSize['2xl'],
    fontWeight: FRAMER_THEME.typography.fontWeight.bold,
    color: FRAMER_THEME.colors.text.primary,
    marginTop: FRAMER_THEME.spacing.xs,
  },
  profileButton: {
    ...FRAMER_THEME.shadows.md,
  },
  profileGradient: {
    width: 44,
    height: 44,
    borderRadius: FRAMER_THEME.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCard: {
    backgroundColor: FRAMER_THEME.colors.background.card,
    marginHorizontal: FRAMER_THEME.spacing.lg,
    marginBottom: FRAMER_THEME.spacing.xl,
    borderRadius: FRAMER_THEME.borderRadius.lg,
    padding: FRAMER_THEME.spacing.lg,
    ...FRAMER_THEME.shadows.lg,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: FRAMER_THEME.spacing.lg,
  },
  balanceLabel: {
    fontSize: FRAMER_THEME.typography.fontSize.sm,
    fontWeight: FRAMER_THEME.typography.fontWeight.medium,
    color: FRAMER_THEME.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: FRAMER_THEME.spacing.xs,
    gap: FRAMER_THEME.spacing.xs,
  },
  address: {
    fontSize: FRAMER_THEME.typography.fontSize.xs,
    fontWeight: FRAMER_THEME.typography.fontWeight.medium,
    color: FRAMER_THEME.colors.text.tertiary,
  },
  copyButton: {
    padding: 2,
  },
  balanceAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: FRAMER_THEME.spacing.md,
    marginBottom: FRAMER_THEME.spacing.md,
  },
  balanceValue: {
    fontSize: FRAMER_THEME.typography.fontSize['4xl'],
    fontWeight: FRAMER_THEME.typography.fontWeight.bold,
    color: FRAMER_THEME.colors.text.primary,
    letterSpacing: -1,
  },
  balanceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  balanceChangeText: {
    fontSize: FRAMER_THEME.typography.fontSize.sm,
    fontWeight: FRAMER_THEME.typography.fontWeight.semibold,
    color: FRAMER_THEME.colors.status.success,
  },
  chainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: FRAMER_THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: FRAMER_THEME.colors.border.light,
  },
  chainLabel: {
    fontSize: FRAMER_THEME.typography.fontSize.xs,
    fontWeight: FRAMER_THEME.typography.fontWeight.medium,
    color: FRAMER_THEME.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: FRAMER_THEME.spacing.xs,
    backgroundColor: FRAMER_THEME.colors.background.secondary,
    paddingHorizontal: FRAMER_THEME.spacing.sm,
    paddingVertical: FRAMER_THEME.spacing.xs,
    borderRadius: FRAMER_THEME.borderRadius.sm,
  },
  chainIcon: {
    fontSize: 14,
  },
  chainName: {
    fontSize: FRAMER_THEME.typography.fontSize.sm,
    fontWeight: FRAMER_THEME.typography.fontWeight.semibold,
    color: FRAMER_THEME.colors.text.primary,
  },
  quickActions: {
    paddingHorizontal: FRAMER_THEME.spacing.lg,
    marginBottom: FRAMER_THEME.spacing.xl,
  },
  sectionTitle: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.bold,
    color: FRAMER_THEME.colors.text.primary,
    marginBottom: FRAMER_THEME.spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: FRAMER_THEME.spacing.md,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    gap: FRAMER_THEME.spacing.sm,
  },
  actionGradient: {
    width: (width - FRAMER_THEME.spacing.lg * 2 - FRAMER_THEME.spacing.md * 3) / 4,
    aspectRatio: 1,
    borderRadius: FRAMER_THEME.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...FRAMER_THEME.shadows.md,
  },
  actionTitle: {
    fontSize: FRAMER_THEME.typography.fontSize.xs,
    fontWeight: FRAMER_THEME.typography.fontWeight.semibold,
    color: FRAMER_THEME.colors.text.primary,
  },
  featuresSection: {
    paddingHorizontal: FRAMER_THEME.spacing.lg,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FRAMER_THEME.colors.background.card,
    borderRadius: FRAMER_THEME.borderRadius.md,
    padding: FRAMER_THEME.spacing.md,
    marginBottom: FRAMER_THEME.spacing.sm,
    ...FRAMER_THEME.shadows.sm,
    gap: FRAMER_THEME.spacing.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
  },
  featureIconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: FRAMER_THEME.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.semibold,
    color: FRAMER_THEME.colors.text.primary,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: FRAMER_THEME.typography.fontSize.sm,
    fontWeight: FRAMER_THEME.typography.fontWeight.regular,
    color: FRAMER_THEME.colors.text.secondary,
  },
});
