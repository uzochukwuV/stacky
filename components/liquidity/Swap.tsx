import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STACKS_THEME } from '../../lib/constants';
import { swap, getSwapAmounts } from '../../lib/stacks-utils';
import { useRouter } from 'expo-router';

// Mock token data - replace with actual token data from your API
const TOKENS = [
  { symbol: 'STX', name: 'Stacks', address: 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159.stx-token', balance: '1000.00', icon: '🔷' },
  { symbol: 'BTC', name: 'Bitcoin', address: 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159.wrapped-bitcoin', balance: '0.05', icon: '₿' },
  { symbol: 'USDA', name: 'USDA', address: 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159.usda-token', balance: '5000.00', icon: '💵' },
];

// Mock price feed VAA - in a real app, you would fetch this from Pyth Network
const MOCK_PRICE_FEED_VAA = '01000000030d0100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

const Swap = () => {
  const router = useRouter();
  const [tokenIn, setTokenIn] = useState(TOKENS[0]);
  const [tokenOut, setTokenOut] = useState(TOKENS[1]);
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [showTokenInModal, setShowTokenInModal] = useState(false);
  const [showTokenOutModal, setShowTokenOutModal] = useState(false);
  const [slippage, setSlippage] = useState('0.5');
  const [exchangeRate, setExchangeRate] = useState('0');
  const [priceImpact, setPriceImpact] = useState('0');

  // Calculate estimated output amount
  useEffect(() => {
    const calculateSwapAmount = async () => {
      if (amountIn && parseFloat(amountIn) > 0) {
        try {
          // In a real app, you would call getSwapAmounts from stacks-utils
          // For now, we'll use a mock calculation
          
          // Mock exchange rate: 1 STX = 0.00005 BTC or 1 BTC = 20000 STX
          let rate = 0;
          if (tokenIn.symbol === 'STX' && tokenOut.symbol === 'BTC') {
            rate = 0.00005;
          } else if (tokenIn.symbol === 'BTC' && tokenOut.symbol === 'STX') {
            rate = 20000;
          } else if (tokenIn.symbol === 'STX' && tokenOut.symbol === 'USDA') {
            rate = 1.5;
          } else if (tokenIn.symbol === 'USDA' && tokenOut.symbol === 'STX') {
            rate = 0.67;
          } else if (tokenIn.symbol === 'BTC' && tokenOut.symbol === 'USDA') {
            rate = 30000;
          } else if (tokenIn.symbol === 'USDA' && tokenOut.symbol === 'BTC') {
            rate = 0.000033;
          }
          
          const calculatedAmount = parseFloat(amountIn) * rate;
          setAmountOut(calculatedAmount.toFixed(6));
          setExchangeRate(`1 ${tokenIn.symbol} = ${rate.toFixed(6)} ${tokenOut.symbol}`);
          
          // Mock price impact (would be calculated based on pool size in real app)
          const impact = parseFloat(amountIn) > 100 ? '0.5' : '0.1';
          setPriceImpact(impact);
        } catch (error) {
          console.error('Error calculating swap amount:', error);
          setAmountOut('0');
        }
      } else {
        setAmountOut('0');
        setExchangeRate('0');
        setPriceImpact('0');
      }
    };

    calculateSwapAmount();
  }, [amountIn, tokenIn, tokenOut]);

  const handleSwap = async () => {
    if (!amountIn || parseFloat(amountIn) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    try {
      setIsLoading(true);
      
      // Convert amounts to micros (Stacks uses 10^6 precision)
      const amountInMicros = BigInt(Math.floor(parseFloat(amountIn) * 1000000));
      
      // Calculate minimum amount out with slippage
      const minAmountOutFloat = parseFloat(amountOut) * (1 - parseFloat(slippage) / 100);
      const minAmountOutMicros = BigInt(Math.floor(minAmountOutFloat * 1000000));
      
      // In a real app, you would get the nonce from the blockchain
      const nonce = 0n;
      
      // Call the swap function from stacks-utils
      const result = await swap(
        tokenIn.address,
        tokenOut.address,
        amountInMicros,
        minAmountOutMicros,
        MOCK_PRICE_FEED_VAA,
        nonce
      );
      
      console.log('Transaction result:', result);
      
      Alert.alert(
        'Success',
        `Successfully swapped ${amountIn} ${tokenIn.symbol} for ${amountOut} ${tokenOut.symbol}. Transaction ID: ${result.txid}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Swap error:', error);
      Alert.alert('Error', `Failed to swap: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxAmount = () => {
    setAmountIn(tokenIn.balance);
  };

  const handleSwitchTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn('');
    setAmountOut('0');
  };

  const renderTokenModal = (isTokenIn) => (
    <View style={[
      styles.modalContainer, 
      isTokenIn ? (showTokenInModal ? styles.visible : styles.hidden) : (showTokenOutModal ? styles.visible : styles.hidden)
    ]}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Token</Text>
          <TouchableOpacity onPress={() => isTokenIn ? setShowTokenInModal(false) : setShowTokenOutModal(false)}>
            <Ionicons name="close" size={24} color={STACKS_THEME.colors.text.secondary} />
          </TouchableOpacity>
        </View>
        
        {TOKENS.map((token) => (
          <TouchableOpacity
            key={token.symbol}
            style={styles.tokenItem}
            onPress={() => {
              if (isTokenIn) {
                setTokenIn(token);
                setShowTokenInModal(false);
              } else {
                setTokenOut(token);
                setShowTokenOutModal(false);
              }
            }}
          >
            <Text style={styles.tokenIcon}>{token.icon}</Text>
            <View style={styles.tokenInfo}>
              <Text style={styles.tokenSymbol}>{token.symbol}</Text>
              <Text style={styles.tokenName}>{token.name}</Text>
            </View>
            <Text style={styles.tokenBalance}>{token.balance}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Swap</Text>
      <Text style={styles.description}>
        Trade tokens instantly with oracle-based pricing
      </Text>

      {/* Token In Selection */}
      <Text style={styles.label}>You Pay</Text>
      <TouchableOpacity 
        style={styles.tokenSelector}
        onPress={() => setShowTokenInModal(true)}
      >
        <Text style={styles.tokenIcon}>{tokenIn.icon}</Text>
        <View style={styles.tokenInfo}>
          <Text style={styles.tokenSymbol}>{tokenIn.symbol}</Text>
          <Text style={styles.tokenBalance}>Balance: {tokenIn.balance}</Text>
        </View>
        <Ionicons name="chevron-down" size={20} color={STACKS_THEME.colors.text.secondary} />
      </TouchableOpacity>

      {/* Amount In Input */}
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

      {/* Switch Tokens Button */}
      <TouchableOpacity style={styles.switchButton} onPress={handleSwitchTokens}>
        <Ionicons name="swap-vertical" size={24} color={STACKS_THEME.colors.primary.default} />
      </TouchableOpacity>

      {/* Token Out Selection */}
      <Text style={styles.label}>You Receive</Text>
      <TouchableOpacity 
        style={styles.tokenSelector}
        onPress={() => setShowTokenOutModal(true)}
      >
        <Text style={styles.tokenIcon}>{tokenOut.icon}</Text>
        <View style={styles.tokenInfo}>
          <Text style={styles.tokenSymbol}>{tokenOut.symbol}</Text>
          <Text style={styles.tokenBalance}>Balance: {tokenOut.balance}</Text>
        </View>
        <Ionicons name="chevron-down" size={20} color={STACKS_THEME.colors.text.secondary} />
      </TouchableOpacity>

      {/* Amount Out Display */}
      <View style={styles.amountContainer}>
        <Text style={styles.amountOutput}>{amountOut}</Text>
      </View>

      {/* Swap Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Exchange Rate</Text>
          <Text style={styles.detailValue}>{exchangeRate}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Price Impact</Text>
          <Text style={styles.detailValue}>{priceImpact}%</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Slippage Tolerance</Text>
          <View style={styles.slippageContainer}>
            {['0.1', '0.5', '1.0'].map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.slippageButton,
                  slippage === value ? styles.slippageButtonActive : null
                ]}
                onPress={() => setSlippage(value)}
              >
                <Text style={[
                  styles.slippageText,
                  slippage === value ? styles.slippageTextActive : null
                ]}>
                  {value}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Swap Button */}
      <TouchableOpacity 
        style={[
          styles.swapButton,
          (!amountIn || parseFloat(amountIn) <= 0) ? styles.disabledButton : null
        ]}
        onPress={handleSwap}
        disabled={!amountIn || parseFloat(amountIn) <= 0 || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={STACKS_THEME.colors.text.primary} />
        ) : (
          <Text style={styles.swapButtonText}>Swap</Text>
        )}
      </TouchableOpacity>

      {/* Token Selection Modals */}
      {renderTokenModal(true)}
      {renderTokenModal(false)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: STACKS_THEME.colors.background.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: STACKS_THEME.colors.text.primary,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: STACKS_THEME.colors.text.secondary,
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: STACKS_THEME.colors.text.secondary,
    marginBottom: 8,
  },
  tokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: STACKS_THEME.colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  tokenIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: STACKS_THEME.colors.text.primary,
  },
  tokenName: {
    fontSize: 14,
    color: STACKS_THEME.colors.text.secondary,
  },
  tokenBalance: {
    fontSize: 14,
    color: STACKS_THEME.colors.text.secondary,
  },
  amountContainer: {
    backgroundColor: STACKS_THEME.colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    color: STACKS_THEME.colors.text.primary,
  },
  amountOutput: {
    flex: 1,
    fontSize: 18,
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
    fontSize: 14,
  },
  switchButton: {
    alignSelf: 'center',
    backgroundColor: STACKS_THEME.colors.background.card,
    borderRadius: 20,
    padding: 8,
    marginVertical: -8,
    zIndex: 1,
  },
  detailsContainer: {
    backgroundColor: STACKS_THEME.colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    color: STACKS_THEME.colors.text.secondary,
    fontSize: 14,
  },
  detailValue: {
    color: STACKS_THEME.colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  slippageContainer: {
    flexDirection: 'row',
  },
  slippageButton: {
    backgroundColor: STACKS_THEME.colors.background.secondary,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  slippageButtonActive: {
    backgroundColor: STACKS_THEME.colors.primary.default,
  },
  slippageText: {
    color: STACKS_THEME.colors.text.secondary,
    fontSize: 12,
  },
  slippageTextActive: {
    color: STACKS_THEME.colors.text.primary,
    fontWeight: '600',
  },
  swapButton: {
    backgroundColor: STACKS_THEME.colors.primary.default,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  swapButtonText: {
    color: STACKS_THEME.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  visible: {
    display: 'flex',
  },
  hidden: {
    display: 'none',
  },
  modalContent: {
    backgroundColor: STACKS_THEME.colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: STACKS_THEME.colors.text.primary,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: STACKS_THEME.colors.border.default,
  },
});

export default Swap;