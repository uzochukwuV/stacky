import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FRAMER_THEME } from '~/lib/theme';
import { ChainConfig } from '~/lib/chains/config';
import { isTestnet, getFaucets, getTestnetWarning } from '~/lib/testnet';

interface TestnetBannerProps {
  chain: ChainConfig;
  style?: any;
}

/**
 * Testnet Warning Banner
 *
 * Displays a warning when user is on a testnet
 * Shows faucet links to get test funds
 */
export function TestnetBanner({ chain, style }: TestnetBannerProps) {
  const [expanded, setExpanded] = React.useState(false);
  const faucets = getFaucets(chain.id);

  if (!isTestnet(chain)) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      {/* Warning Banner */}
      <TouchableOpacity
        style={styles.banner}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.bannerContent}>
          <Ionicons name="warning" size={20} color={FRAMER_THEME.colors.accent.yellow} />
          <Text style={styles.bannerText}>{getTestnetWarning(chain.id)}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={FRAMER_THEME.colors.accent.yellow}
        />
      </TouchableOpacity>

      {/* Expanded Content with Faucets */}
      {expanded && faucets.length > 0 && (
        <View style={styles.expandedContent}>
          <Text style={styles.faucetTitle}>Get Test Funds:</Text>
          {faucets.map((faucet, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faucetItem}
              onPress={() => Linking.openURL(faucet.url)}
              activeOpacity={0.7}
            >
              <View style={styles.faucetInfo}>
                <Text style={styles.faucetName}>{faucet.name}</Text>
                <Text style={styles.faucetDescription}>{faucet.description}</Text>
              </View>
              <Ionicons
                name="open-outline"
                size={18}
                color={FRAMER_THEME.colors.accent.yellow}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: FRAMER_THEME.spacing.lg,
    marginBottom: FRAMER_THEME.spacing.md,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: FRAMER_THEME.colors.surface.yellow,
    borderRadius: FRAMER_THEME.borderRadius.md,
    padding: FRAMER_THEME.spacing.md,
    borderWidth: 1,
    borderColor: FRAMER_THEME.colors.accent.yellow,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: FRAMER_THEME.spacing.sm,
    flex: 1,
  },
  bannerText: {
    flex: 1,
    fontSize: FRAMER_THEME.typography.fontSize.sm,
    fontWeight: FRAMER_THEME.typography.fontWeight.semibold,
    color: FRAMER_THEME.colors.accent.yellow,
  },
  expandedContent: {
    backgroundColor: FRAMER_THEME.colors.background.card,
    borderRadius: FRAMER_THEME.borderRadius.md,
    padding: FRAMER_THEME.spacing.md,
    marginTop: FRAMER_THEME.spacing.sm,
    borderWidth: 1,
    borderColor: FRAMER_THEME.colors.border.light,
  },
  faucetTitle: {
    fontSize: FRAMER_THEME.typography.fontSize.sm,
    fontWeight: FRAMER_THEME.typography.fontWeight.bold,
    color: FRAMER_THEME.colors.text.primary,
    marginBottom: FRAMER_THEME.spacing.sm,
  },
  faucetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: FRAMER_THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: FRAMER_THEME.colors.border.light,
  },
  faucetInfo: {
    flex: 1,
  },
  faucetName: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.semibold,
    color: FRAMER_THEME.colors.text.primary,
    marginBottom: 2,
  },
  faucetDescription: {
    fontSize: FRAMER_THEME.typography.fontSize.sm,
    fontWeight: FRAMER_THEME.typography.fontWeight.regular,
    color: FRAMER_THEME.colors.text.secondary,
  },
});
