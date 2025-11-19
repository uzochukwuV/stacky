import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTurnkey } from '@turnkey/sdk-react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { FRAMER_THEME } from '~/lib/theme';
import { useChainStore } from '~/lib/stores';
import { RadialGradient } from '~/components/ui/radial-gradient';

export default function ReceiveScreen() {
  const router = useRouter();
  const { user } = useTurnkey();
  const { currentChain } = useChainStore();

  const walletAddress = user?.wallets?.[0]?.accounts?.[0]?.address || '';

  const handleCopyAddress = async () => {
    await Clipboard.setStringAsync(walletAddress);
    Alert.alert('Copied!', 'Address copied to clipboard');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Send ${currentChain.nativeCurrency.symbol} to:\n${walletAddress}`,
        title: 'My Wallet Address',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={FRAMER_THEME.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Receive</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Network Info */}
        <View style={styles.networkBadge}>
          <Text style={styles.networkIcon}>{currentChain.icon}</Text>
          <Text style={styles.networkName}>{currentChain.name}</Text>
        </View>

        <Text style={styles.subtitle}>
          Scan QR code or share your address to receive {currentChain.nativeCurrency.symbol}
        </Text>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          <View style={styles.qrWrapper}>
            {walletAddress ? (
              <QRCode
                value={`ethereum:${walletAddress}`}
                size={240}
                backgroundColor="white"
                color="black"
                logoSize={50}
                logoBackgroundColor="white"
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Ionicons
                  name="wallet-outline"
                  size={80}
                  color={FRAMER_THEME.colors.text.tertiary}
                />
                <Text style={styles.qrPlaceholderText}>No wallet connected</Text>
              </View>
            )}
          </View>
        </View>

        {/* Address Display */}
        <View style={styles.addressCard}>
          <Text style={styles.addressLabel}>Your Address</Text>
          <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
            {walletAddress || 'No address available'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCopyAddress}
            activeOpacity={0.7}
          >
            <RadialGradient
              colors={FRAMER_THEME.colors.gradient.pink}
              style={styles.actionButtonGradient}
              cx="50%"
              cy="50%"
              rx="70%"
              ry="70%"
            >
              <Ionicons
                name="copy-outline"
                size={24}
                color={FRAMER_THEME.colors.text.inverse}
              />
              <Text style={styles.actionButtonText}>Copy Address</Text>
            </RadialGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <RadialGradient
              colors={FRAMER_THEME.colors.gradient.blue}
              style={styles.actionButtonGradient}
              cx="50%"
              cy="50%"
              rx="70%"
              ry="70%"
            >
              <Ionicons
                name="share-outline"
                size={24}
                color={FRAMER_THEME.colors.text.inverse}
              />
              <Text style={styles.actionButtonText}>Share</Text>
            </RadialGradient>
          </TouchableOpacity>
        </View>

        {/* Warning */}
        <View style={styles.warningContainer}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={FRAMER_THEME.colors.accent.yellow}
          />
          <Text style={styles.warningText}>
            Only send {currentChain.nativeCurrency.symbol} and tokens on {currentChain.name} to
            this address
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FRAMER_THEME.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: FRAMER_THEME.spacing.lg,
    paddingTop: FRAMER_THEME.spacing['3xl'],
    paddingBottom: FRAMER_THEME.spacing.lg,
  },
  backButton: {
    width: 40,
  },
  title: {
    fontSize: FRAMER_THEME.typography.fontSize['2xl'],
    fontWeight: FRAMER_THEME.typography.fontWeight.bold,
    color: FRAMER_THEME.colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: FRAMER_THEME.spacing.lg,
    alignItems: 'center',
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: FRAMER_THEME.spacing.sm,
    backgroundColor: FRAMER_THEME.colors.background.secondary,
    paddingHorizontal: FRAMER_THEME.spacing.md,
    paddingVertical: FRAMER_THEME.spacing.sm,
    borderRadius: FRAMER_THEME.borderRadius.full,
    marginBottom: FRAMER_THEME.spacing.md,
  },
  networkIcon: {
    fontSize: 20,
  },
  networkName: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.semibold,
    color: FRAMER_THEME.colors.text.primary,
  },
  subtitle: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.regular,
    color: FRAMER_THEME.colors.text.secondary,
    textAlign: 'center',
    marginBottom: FRAMER_THEME.spacing.xl,
    lineHeight: FRAMER_THEME.typography.fontSize.base * FRAMER_THEME.typography.lineHeight.relaxed,
  },
  qrContainer: {
    marginBottom: FRAMER_THEME.spacing.xl,
  },
  qrWrapper: {
    backgroundColor: FRAMER_THEME.colors.background.card,
    padding: FRAMER_THEME.spacing.lg,
    borderRadius: FRAMER_THEME.borderRadius.xl,
    ...FRAMER_THEME.shadows.xl,
  },
  qrPlaceholder: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FRAMER_THEME.colors.background.secondary,
    borderRadius: FRAMER_THEME.borderRadius.md,
  },
  qrPlaceholderText: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.medium,
    color: FRAMER_THEME.colors.text.tertiary,
    marginTop: FRAMER_THEME.spacing.sm,
  },
  addressCard: {
    width: '100%',
    backgroundColor: FRAMER_THEME.colors.background.card,
    borderRadius: FRAMER_THEME.borderRadius.md,
    padding: FRAMER_THEME.spacing.md,
    marginBottom: FRAMER_THEME.spacing.xl,
    ...FRAMER_THEME.shadows.sm,
  },
  addressLabel: {
    fontSize: FRAMER_THEME.typography.fontSize.sm,
    fontWeight: FRAMER_THEME.typography.fontWeight.medium,
    color: FRAMER_THEME.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: FRAMER_THEME.spacing.xs,
  },
  addressText: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.bold,
    color: FRAMER_THEME.colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  actions: {
    flexDirection: 'row',
    gap: FRAMER_THEME.spacing.md,
    width: '100%',
    marginBottom: FRAMER_THEME.spacing.xl,
  },
  actionButton: {
    flex: 1,
  },
  actionButtonGradient: {
    borderRadius: FRAMER_THEME.borderRadius.md,
    paddingVertical: FRAMER_THEME.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...FRAMER_THEME.shadows.md,
  },
  actionButtonText: {
    fontSize: FRAMER_THEME.typography.fontSize.sm,
    fontWeight: FRAMER_THEME.typography.fontWeight.bold,
    color: FRAMER_THEME.colors.text.inverse,
    marginTop: FRAMER_THEME.spacing.xs,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: FRAMER_THEME.spacing.sm,
    backgroundColor: FRAMER_THEME.colors.surface.yellow,
    borderRadius: FRAMER_THEME.borderRadius.md,
    padding: FRAMER_THEME.spacing.md,
    width: '100%',
  },
  warningText: {
    flex: 1,
    fontSize: FRAMER_THEME.typography.fontSize.sm,
    fontWeight: FRAMER_THEME.typography.fontWeight.medium,
    color: FRAMER_THEME.colors.accent.yellow,
    lineHeight: FRAMER_THEME.typography.fontSize.sm * FRAMER_THEME.typography.lineHeight.relaxed,
  },
});
