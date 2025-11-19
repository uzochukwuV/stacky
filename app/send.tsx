import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTurnkey } from '@turnkey/sdk-react-native';
import { parseEther, formatEther, isAddress } from 'viem';
import { FRAMER_THEME } from '~/lib/theme';
import { useChainStore } from '~/lib/stores';
import { RadialGradient } from '~/components/ui/radial-gradient';
import { QRScanner } from '~/components/qr-scanner';
import {
  previewTransaction,
  formatGasPrice,
  type TransactionPreview,
} from '~/lib/services/gas';
import { formatPrice } from '~/lib/services/prices';
import { getBalance } from '~/lib/web3-multi';

export default function SendScreen() {
  const router = useRouter();
  const { user } = useTurnkey();
  const { currentChain } = useChainStore();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [balance, setBalance] = useState('0');
  const [preview, setPreview] = useState<TransactionPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const walletAddress = user?.wallets?.[0]?.accounts?.[0]?.address;

  useEffect(() => {
    if (walletAddress) {
      fetchBalance();
    }
  }, [walletAddress, currentChain]);

  useEffect(() => {
    // Auto-preview when both fields are filled
    if (recipient && amount && isAddress(recipient)) {
      handlePreview();
    } else {
      setPreview(null);
    }
  }, [recipient, amount]);

  const fetchBalance = async () => {
    if (!walletAddress) return;
    try {
      const bal = await getBalance(walletAddress as `0x${string}`, currentChain);
      setBalance(bal);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const handleScan = (scannedAddress: string) => {
    setRecipient(scannedAddress);
    setShowScanner(false);
  };

  const handleMaxAmount = () => {
    const balanceNum = parseFloat(balance);
    if (balanceNum > 0) {
      // Reserve some for gas (estimate 0.001 ETH/MATIC)
      const maxAmount = Math.max(0, balanceNum - 0.001);
      setAmount(maxAmount.toString());
    }
  };

  const handlePreview = async () => {
    if (!walletAddress || !recipient || !amount) return;

    try {
      setPreviewing(true);
      const value = parseEther(amount);

      const txPreview = await previewTransaction(
        walletAddress as `0x${string}`,
        recipient as `0x${string}`,
        undefined,
        value,
        currentChain
      );

      setPreview(txPreview);
    } catch (error) {
      console.error('Preview failed:', error);
      Alert.alert('Error', 'Failed to preview transaction');
    } finally {
      setPreviewing(false);
    }
  };

  const handleSend = async () => {
    if (!walletAddress || !recipient || !amount || !preview) return;

    if (!preview.canExecute) {
      Alert.alert('Cannot Send', preview.warnings.join('\n'));
      return;
    }

    Alert.alert(
      'Confirm Transaction',
      `Send ${amount} ${currentChain.nativeCurrency.symbol} to ${recipient.slice(0, 10)}...?\n\nGas Fee: ${formatPrice(preview.gas.totalGasCostUSD)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          style: 'default',
          onPress: executeTransaction,
        },
      ]
    );
  };

  const executeTransaction = async () => {
    if (!walletAddress || !recipient || !amount) return;

    try {
      setLoading(true);

      // TODO: Integrate with Turnkey to sign and send transaction
      // This will be implemented when we connect the transaction signing flow

      Alert.alert(
        'Success',
        'Transaction submitted! It will appear in your activity shortly.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Transaction failed:', error);
      Alert.alert('Error', error.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const isValidAddress = recipient ? isAddress(recipient) : true;
  const isValidAmount = amount ? parseFloat(amount) > 0 : true;
  const canPreview = recipient && amount && isValidAddress && isValidAmount;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={FRAMER_THEME.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Send</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Balance Display */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceValue}>
            {parseFloat(balance).toFixed(6)} {currentChain.nativeCurrency.symbol}
          </Text>
          <Text style={styles.balanceChain}>{currentChain.name}</Text>
        </View>

        {/* Recipient Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Recipient Address</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, !isValidAddress && styles.inputError]}
              placeholder="0x..."
              placeholderTextColor={FRAMER_THEME.colors.text.tertiary}
              value={recipient}
              onChangeText={setRecipient}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => setShowScanner(true)}
              activeOpacity={0.7}
            >
              <RadialGradient
                colors={FRAMER_THEME.colors.gradient.pink}
                style={styles.scanButtonGradient}
                cx="50%"
                cy="50%"
                rx="70%"
                ry="70%"
              >
                <Ionicons
                  name="qr-code"
                  size={20}
                  color={FRAMER_THEME.colors.text.inverse}
                />
              </RadialGradient>
            </TouchableOpacity>
          </View>
          {!isValidAddress && recipient && (
            <Text style={styles.errorText}>Invalid address format</Text>
          )}
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Amount</Text>
            <TouchableOpacity onPress={handleMaxAmount} activeOpacity={0.7}>
              <Text style={styles.maxButton}>MAX</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, !isValidAmount && styles.inputError]}
              placeholder="0.0"
              placeholderTextColor={FRAMER_THEME.colors.text.tertiary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            <Text style={styles.currencyLabel}>{currentChain.nativeCurrency.symbol}</Text>
          </View>
          {!isValidAmount && amount && (
            <Text style={styles.errorText}>Amount must be greater than 0</Text>
          )}
        </View>

        {/* Transaction Preview */}
        {previewing && (
          <View style={styles.previewCard}>
            <ActivityIndicator size="small" color={FRAMER_THEME.colors.accent.pink} />
            <Text style={styles.previewText}>Calculating fees...</Text>
          </View>
        )}

        {preview && !previewing && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Transaction Preview</Text>

            {/* Gas Estimate */}
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Network Fee</Text>
              <View style={styles.previewValueContainer}>
                <Text style={styles.previewValue}>
                  {formatPrice(preview.gas.totalGasCostUSD)}
                </Text>
                <Text style={styles.previewSubValue}>
                  {parseFloat(preview.gas.totalGasCostETH).toFixed(6)}{' '}
                  {currentChain.nativeCurrency.symbol}
                </Text>
              </View>
            </View>

            {/* Gas Price */}
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Gas Price</Text>
              <Text style={styles.previewValue}>{formatGasPrice(preview.gas.gasPrice)}</Text>
            </View>

            {/* Total Cost */}
            <View style={[styles.previewRow, styles.previewRowTotal]}>
              <Text style={styles.previewLabelBold}>Total (Amount + Fee)</Text>
              <Text style={styles.previewValueBold}>
                {(parseFloat(amount) + parseFloat(preview.gas.totalGasCostETH)).toFixed(6)}{' '}
                {currentChain.nativeCurrency.symbol}
              </Text>
            </View>

            {/* Warnings */}
            {preview.warnings.length > 0 && (
              <View style={styles.warningsContainer}>
                {preview.warnings.map((warning, index) => (
                  <View key={index} style={styles.warningRow}>
                    <Ionicons
                      name="warning"
                      size={16}
                      color={FRAMER_THEME.colors.accent.yellow}
                    />
                    <Text style={styles.warningText}>{warning}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Send Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!canPreview || !preview?.canExecute || loading) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!canPreview || !preview?.canExecute || loading}
          activeOpacity={0.7}
        >
          <RadialGradient
            colors={
              canPreview && preview?.canExecute && !loading
                ? FRAMER_THEME.colors.gradient.pink
                : ['#cccccc', '#999999']
            }
            style={styles.sendButtonGradient}
            cx="50%"
            cy="50%"
            rx="70%"
            ry="70%"
          >
            {loading ? (
              <ActivityIndicator size="small" color={FRAMER_THEME.colors.text.inverse} />
            ) : (
              <Text style={styles.sendButtonText}>Send {currentChain.nativeCurrency.symbol}</Text>
            )}
          </RadialGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* QR Scanner Modal */}
      <QRScanner
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
        title="Scan Recipient Address"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FRAMER_THEME.colors.background.primary,
  },
  scrollView: {
    flex: 1,
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
  balanceCard: {
    backgroundColor: FRAMER_THEME.colors.background.card,
    marginHorizontal: FRAMER_THEME.spacing.lg,
    marginBottom: FRAMER_THEME.spacing.xl,
    borderRadius: FRAMER_THEME.borderRadius.lg,
    padding: FRAMER_THEME.spacing.lg,
    alignItems: 'center',
    ...FRAMER_THEME.shadows.md,
  },
  balanceLabel: {
    fontSize: FRAMER_THEME.typography.fontSize.sm,
    fontWeight: FRAMER_THEME.typography.fontWeight.medium,
    color: FRAMER_THEME.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: FRAMER_THEME.spacing.xs,
  },
  balanceValue: {
    fontSize: FRAMER_THEME.typography.fontSize['3xl'],
    fontWeight: FRAMER_THEME.typography.fontWeight.bold,
    color: FRAMER_THEME.colors.text.primary,
    marginBottom: FRAMER_THEME.spacing.xs,
  },
  balanceChain: {
    fontSize: FRAMER_THEME.typography.fontSize.sm,
    fontWeight: FRAMER_THEME.typography.fontWeight.medium,
    color: FRAMER_THEME.colors.text.tertiary,
  },
  section: {
    paddingHorizontal: FRAMER_THEME.spacing.lg,
    marginBottom: FRAMER_THEME.spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: FRAMER_THEME.spacing.sm,
  },
  label: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.semibold,
    color: FRAMER_THEME.colors.text.primary,
    marginBottom: FRAMER_THEME.spacing.sm,
  },
  maxButton: {
    fontSize: FRAMER_THEME.typography.fontSize.sm,
    fontWeight: FRAMER_THEME.typography.fontWeight.bold,
    color: FRAMER_THEME.colors.accent.pink,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FRAMER_THEME.colors.background.card,
    borderRadius: FRAMER_THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: FRAMER_THEME.colors.border.light,
    paddingHorizontal: FRAMER_THEME.spacing.md,
    ...FRAMER_THEME.shadows.sm,
  },
  input: {
    flex: 1,
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.medium,
    color: FRAMER_THEME.colors.text.primary,
    paddingVertical: FRAMER_THEME.spacing.md,
  },
  inputError: {
    borderColor: FRAMER_THEME.colors.status.error,
  },
  scanButton: {
    marginLeft: FRAMER_THEME.spacing.sm,
  },
  scanButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: FRAMER_THEME.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyLabel: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.semibold,
    color: FRAMER_THEME.colors.text.secondary,
    marginLeft: FRAMER_THEME.spacing.sm,
  },
  errorText: {
    fontSize: FRAMER_THEME.typography.fontSize.sm,
    fontWeight: FRAMER_THEME.typography.fontWeight.medium,
    color: FRAMER_THEME.colors.status.error,
    marginTop: FRAMER_THEME.spacing.xs,
  },
  previewCard: {
    backgroundColor: FRAMER_THEME.colors.background.card,
    marginHorizontal: FRAMER_THEME.spacing.lg,
    marginBottom: FRAMER_THEME.spacing.lg,
    borderRadius: FRAMER_THEME.borderRadius.lg,
    padding: FRAMER_THEME.spacing.lg,
    ...FRAMER_THEME.shadows.md,
  },
  previewTitle: {
    fontSize: FRAMER_THEME.typography.fontSize.lg,
    fontWeight: FRAMER_THEME.typography.fontWeight.bold,
    color: FRAMER_THEME.colors.text.primary,
    marginBottom: FRAMER_THEME.spacing.md,
  },
  previewText: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.medium,
    color: FRAMER_THEME.colors.text.secondary,
    marginLeft: FRAMER_THEME.spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: FRAMER_THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: FRAMER_THEME.colors.border.light,
  },
  previewRowTotal: {
    borderBottomWidth: 0,
    marginTop: FRAMER_THEME.spacing.sm,
    paddingTop: FRAMER_THEME.spacing.md,
    borderTopWidth: 2,
    borderTopColor: FRAMER_THEME.colors.border.default,
  },
  previewLabel: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.medium,
    color: FRAMER_THEME.colors.text.secondary,
  },
  previewLabelBold: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.bold,
    color: FRAMER_THEME.colors.text.primary,
  },
  previewValueContainer: {
    alignItems: 'flex-end',
  },
  previewValue: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.semibold,
    color: FRAMER_THEME.colors.text.primary,
  },
  previewValueBold: {
    fontSize: FRAMER_THEME.typography.fontSize.lg,
    fontWeight: FRAMER_THEME.typography.fontWeight.bold,
    color: FRAMER_THEME.colors.text.primary,
  },
  previewSubValue: {
    fontSize: FRAMER_THEME.typography.fontSize.sm,
    fontWeight: FRAMER_THEME.typography.fontWeight.medium,
    color: FRAMER_THEME.colors.text.tertiary,
  },
  warningsContainer: {
    marginTop: FRAMER_THEME.spacing.md,
    paddingTop: FRAMER_THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: FRAMER_THEME.colors.border.light,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: FRAMER_THEME.spacing.sm,
  },
  warningText: {
    fontSize: FRAMER_THEME.typography.fontSize.sm,
    fontWeight: FRAMER_THEME.typography.fontWeight.medium,
    color: FRAMER_THEME.colors.accent.yellow,
    marginLeft: FRAMER_THEME.spacing.sm,
    flex: 1,
  },
  sendButton: {
    marginHorizontal: FRAMER_THEME.spacing.lg,
    marginBottom: FRAMER_THEME.spacing.xl,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    borderRadius: FRAMER_THEME.borderRadius.md,
    paddingVertical: FRAMER_THEME.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...FRAMER_THEME.shadows.lg,
  },
  sendButtonText: {
    fontSize: FRAMER_THEME.typography.fontSize.lg,
    fontWeight: FRAMER_THEME.typography.fontWeight.bold,
    color: FRAMER_THEME.colors.text.inverse,
  },
});
