import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTurnkey } from '@turnkey/sdk-react-native';
import { STACKS_THEME } from '~/lib/constants';
import { useChainStore } from '~/lib/stores/chain-store';
import { ChainSwitcher } from '~/components/chain-switcher';
import {
  requestQuote,
  createOrder,
  getOrderStatus,
  chainToSideshiftNetwork,
  formatSideshiftMethod,
  SideshiftQuote,
  SideshiftOrder,
} from '~/lib/services/sideshift';
import { getBalance } from '~/lib/web3-multi';

interface Token {
  symbol: string;
  name: string;
  network: string;
  icon: string;
}

const SUPPORTED_TOKENS: Record<string, Token[]> = {
  ethereum: [
    { symbol: 'ETH', name: 'Ethereum', network: 'ethereum', icon: '⟠' },
    { symbol: 'USDT', name: 'Tether', network: 'ethereum', icon: '₮' },
    { symbol: 'USDC', name: 'USD Coin', network: 'ethereum', icon: '💵' },
  ],
  polygon: [
    { symbol: 'MATIC', name: 'Polygon', network: 'polygon', icon: '⬣' },
    { symbol: 'USDT', name: 'Tether', network: 'polygon', icon: '₮' },
    { symbol: 'USDC', name: 'USD Coin', network: 'polygon', icon: '💵' },
  ],
  stacks: [
    { symbol: 'STX', name: 'Stacks', network: 'stacks', icon: '🔷' },
    { symbol: 'BTC', name: 'Bitcoin', network: 'stacks', icon: '₿' },
  ],
};

export default function SwapScreen() {
  const router = useRouter();
  const { user } = useTurnkey();
  const { currentChain } = useChainStore();

  const [tokenIn, setTokenIn] = useState<Token>(SUPPORTED_TOKENS.polygon[0]);
  const [tokenOut, setTokenOut] = useState<Token>(SUPPORTED_TOKENS.ethereum[0]);
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [quote, setQuote] = useState<SideshiftQuote | null>(null);
  const [order, setOrder] = useState<SideshiftOrder | null>(null);
  const [exchangeRate, setExchangeRate] = useState('0');
  const [balance, setBalance] = useState('0');

  // Get user address
  const userAddress = user?.wallets?.[0]?.accounts?.[0]?.address;

  // Load balance
  useEffect(() => {
    const loadBalance = async () => {
      if (userAddress && currentChain.type === 'evm') {
        try {
          const bal = await getBalance(userAddress as `0x${string}`, currentChain);
          const formatted = Number(bal) / 1e18;
          setBalance(formatted.toFixed(6));
        } catch (error) {
          console.error('Failed to load balance:', error);
        }
      }
    };

    loadBalance();
  }, [userAddress, currentChain]);

  // Get quote when amount changes
  useEffect(() => {
    const getQuote = async () => {
      if (!amountIn || parseFloat(amountIn) <= 0) {
        setAmountOut('0');
        setQuote(null);
        return;
      }

      try {
        setIsLoading(true);

        const depositMethod = formatSideshiftMethod(tokenIn.network, tokenIn.symbol);
        const settleMethod = formatSideshiftMethod(tokenOut.network, tokenOut.symbol);

        const quoteResponse = await requestQuote(
          depositMethod,
          settleMethod,
          amountIn
        );

        setQuote(quoteResponse);
        setAmountOut(quoteResponse.settleAmount);
        setExchangeRate(quoteResponse.rate);
      } catch (error: any) {
        console.error('Failed to get quote:', error);
        Alert.alert('Error', error.message || 'Failed to get quote');
        setAmountOut('0');
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(getQuote, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [amountIn, tokenIn, tokenOut]);

  const handleSwap = async () => {
    if (!quote || !userAddress) {
      Alert.alert('Error', 'Please enter a valid amount and connect your wallet');
      return;
    }

    try {
      setIsLoading(true);

      // Create order with quote
      const orderResponse = await createOrder(
        quote.id,
        userAddress, // Destination address
        undefined,   // Affiliate ID
        userAddress  // Refund address
      );

      setOrder(orderResponse);

      Alert.alert(
        'Swap Order Created',
        `Send ${amountIn} ${tokenIn.symbol} to:\n\n${orderResponse.depositAddress}\n\nYou will receive ${amountOut} ${tokenOut.symbol}`,
        [
          {
            text: 'Copy Address',
            onPress: () => {
              // Copy to clipboard
              console.log('Copying:', orderResponse.depositAddress);
            },
          },
          { text: 'OK' },
        ]
      );
    } catch (error: any) {
      console.error('Swap error:', error);
      Alert.alert('Error', error.message || 'Failed to create swap order');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchTokens = () => {
    const temp = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(temp);
    setAmountIn('');
    setAmountOut('0');
    setQuote(null);
  };

  const handleMaxAmount = () => {
    setAmountIn(balance);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Cross-Chain Swap</Text>
      <Text style={styles.description}>
        Swap tokens across different blockchains powered by Sideshift.ai
      </Text>

      {/* Chain Switcher */}
      <ChainSwitcher />

      {/* From Token */}
      <View style={styles.section}>
        <Text style={styles.label}>From</Text>
        <View style={styles.tokenContainer}>
          <TouchableOpacity style={styles.tokenSelector}>
            <Text style={styles.tokenIcon}>{tokenIn.icon}</Text>
            <View style={styles.tokenInfo}>
              <Text style={styles.tokenSymbol}>{tokenIn.symbol}</Text>
              <Text style={styles.tokenNetwork}>{tokenIn.network}</Text>
            </View>
            <Ionicons
              name="chevron-down"
              size={20}
              color={STACKS_THEME.colors.text.secondary}
            />
          </TouchableOpacity>

          <View style={styles.amountContainer}>
            <TextInput
              style={styles.amountInput}
              value={amountIn}
              onChangeText={setAmountIn}
              placeholder="0.0"
              placeholderTextColor={STACKS_THEME.colors.text.tertiary}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity style={styles.maxButton} onPress={handleMaxAmount}>
              <Text style={styles.maxButtonText}>MAX</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.balanceText}>Balance: {balance} {tokenIn.symbol}</Text>
        </View>
      </View>

      {/* Switch Button */}
      <View style={styles.switchContainer}>
        <TouchableOpacity style={styles.switchButton} onPress={handleSwitchTokens}>
          <Ionicons
            name="swap-vertical"
            size={24}
            color={STACKS_THEME.colors.primary.default}
          />
        </TouchableOpacity>
      </View>

      {/* To Token */}
      <View style={styles.section}>
        <Text style={styles.label}>To</Text>
        <View style={styles.tokenContainer}>
          <TouchableOpacity style={styles.tokenSelector}>
            <Text style={styles.tokenIcon}>{tokenOut.icon}</Text>
            <View style={styles.tokenInfo}>
              <Text style={styles.tokenSymbol}>{tokenOut.symbol}</Text>
              <Text style={styles.tokenNetwork}>{tokenOut.network}</Text>
            </View>
            <Ionicons
              name="chevron-down"
              size={20}
              color={STACKS_THEME.colors.text.secondary}
            />
          </TouchableOpacity>

          <View style={styles.amountContainer}>
            <Text style={styles.amountOutput}>{amountOut}</Text>
          </View>
        </View>
      </View>

      {/* Swap Details */}
      {quote && (
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Exchange Rate</Text>
            <Text style={styles.detailValue}>
              1 {tokenIn.symbol} = {exchangeRate} {tokenOut.symbol}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quote Expires</Text>
            <Text style={styles.detailValue}>
              {new Date(quote.expiresAt).toLocaleTimeString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Provider</Text>
            <Text style={styles.detailValue}>Sideshift.ai</Text>
          </View>
        </View>
      )}

      {/* Swap Button */}
      <TouchableOpacity
        style={[
          styles.swapButton,
          (!amountIn || parseFloat(amountIn) <= 0 || !quote) && styles.disabledButton,
        ]}
        onPress={handleSwap}
        disabled={!amountIn || parseFloat(amountIn) <= 0 || !quote || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={STACKS_THEME.colors.text.primary} />
        ) : (
          <Text style={styles.swapButtonText}>Create Swap Order</Text>
        )}
      </TouchableOpacity>

      {/* Order Status */}
      {order && (
        <View style={styles.orderContainer}>
          <Text style={styles.orderTitle}>Order Created</Text>
          <Text style={styles.orderText}>Order ID: {order.id}</Text>
          <Text style={styles.orderText}>Status: {order.status}</Text>
          <TouchableOpacity
            style={styles.orderButton}
            onPress={() => router.push(`/order/${order.id}`)}
          >
            <Text style={styles.orderButtonText}>View Order</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: STACKS_THEME.colors.background.primary,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: STACKS_THEME.colors.text.primary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: STACKS_THEME.colors.text.secondary,
    marginBottom: 24,
  },
  section: {
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: STACKS_THEME.colors.text.secondary,
    marginBottom: 8,
  },
  tokenContainer: {
    backgroundColor: STACKS_THEME.colors.background.card,
    borderRadius: 12,
    padding: 16,
  },
  tokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  tokenIcon: {
    fontSize: 32,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: STACKS_THEME.colors.text.primary,
  },
  tokenNetwork: {
    fontSize: 12,
    color: STACKS_THEME.colors.text.tertiary,
    textTransform: 'capitalize',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: STACKS_THEME.colors.text.primary,
    padding: 0,
  },
  amountOutput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: STACKS_THEME.colors.text.primary,
  },
  maxButton: {
    backgroundColor: STACKS_THEME.colors.primary.default,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  maxButtonText: {
    color: STACKS_THEME.colors.text.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  balanceText: {
    fontSize: 12,
    color: STACKS_THEME.colors.text.tertiary,
    marginTop: 8,
  },
  switchContainer: {
    alignItems: 'center',
    marginVertical: -8,
    zIndex: 1,
  },
  switchButton: {
    backgroundColor: STACKS_THEME.colors.background.card,
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: STACKS_THEME.colors.background.primary,
  },
  detailsContainer: {
    backgroundColor: STACKS_THEME.colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: STACKS_THEME.colors.text.secondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: STACKS_THEME.colors.text.primary,
  },
  swapButton: {
    backgroundColor: STACKS_THEME.colors.primary.default,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.5,
  },
  swapButtonText: {
    color: STACKS_THEME.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  orderContainer: {
    backgroundColor: STACKS_THEME.colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: STACKS_THEME.colors.text.primary,
    marginBottom: 12,
  },
  orderText: {
    fontSize: 14,
    color: STACKS_THEME.colors.text.secondary,
    marginBottom: 8,
  },
  orderButton: {
    backgroundColor: STACKS_THEME.colors.primary.default,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  orderButtonText: {
    color: STACKS_THEME.colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
