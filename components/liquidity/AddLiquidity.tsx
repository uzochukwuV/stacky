import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STACKS_THEME } from '../../lib/constants';
import { addLiquidity } from '../../lib/stacks-utils';
import { useRouter } from 'expo-router';

// Mock token data - replace with actual token data from your API
const TOKENS = [
  { symbol: 'STX', name: 'Stacks', address: 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159.stx-token', balance: '1000.00', icon: '🔷' },
  { symbol: 'BTC', name: 'Bitcoin', address: 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159.wrapped-bitcoin', balance: '0.05', icon: '₿' },
  { symbol: 'USDA', name: 'USDA', address: 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159.usda-token', balance: '5000.00', icon: '💵' },
];

const AddLiquidity = () => {
  const router = useRouter();
  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [estimatedShares, setEstimatedShares] = useState('0');

  // Calculate estimated shares (mock calculation)
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      // This is a simplified mock calculation
      // In a real app, you would call a contract read function to get this value
      const shares = parseFloat(amount) * 0.98; // 2% fee example
      setEstimatedShares(shares.toFixed(6));
    } else {
      setEstimatedShares('0');
    }
  }, [amount, selectedToken]);

  const handleAddLiquidity = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    try {
      setIsLoading(true);
      
      // Convert amount to micros (Stacks uses 10^6 precision)
      const amountInMicros = BigInt(Math.floor(parseFloat(amount) * 1000000));
      
      // In a real app, you would get the nonce from the blockchain
      const nonce = 0n;
      
      // Call the addLiquidity function from stacks-utils
      const result = await addLiquidity(
        selectedToken.address,
        amountInMicros,
        nonce
      );
      
      console.log('Transaction result:', result);
      
      Alert.alert(
        'Success',
        `Successfully added liquidity. Transaction ID: ${result.txid}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Add liquidity error:', error);
      Alert.alert('Error', `Failed to add liquidity: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxAmount = () => {
    setAmount(selectedToken.balance);
  };

  const renderTokenModal = () => (
    <View style={[styles.modalContainer, showTokenModal ? styles.visible : styles.hidden]}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Token</Text>
          <TouchableOpacity onPress={() => setShowTokenModal(false)}>
            <Ionicons name="close" size={24} color={STACKS_THEME.colors.text.secondary} />
          </TouchableOpacity>
        </View>
        
        {TOKENS.map((token) => (
          <TouchableOpacity
            key={token.symbol}
            style={styles.tokenItem}
            onPress={() => {
              setSelectedToken(token);
              setShowTokenModal(false);
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
      <Text style={styles.title}>Add Liquidity</Text>
      <Text style={styles.description}>
        Provide liquidity to earn fees from swaps
      </Text>

      {/* Token Selection */}
      <Text style={styles.label}>Token</Text>
      <TouchableOpacity 
        style={styles.tokenSelector}
        onPress={() => setShowTokenModal(true)}
      >
        <Text style={styles.tokenIcon}>{selectedToken.icon}</Text>
        <View style={styles.tokenInfo}>
          <Text style={styles.tokenSymbol}>{selectedToken.symbol}</Text>
          <Text style={styles.tokenBalance}>Balance: {selectedToken.balance}</Text>
        </View>
        <Ionicons name="chevron-down" size={20} color={STACKS_THEME.colors.text.secondary} />
      </TouchableOpacity>

      {/* Amount Input */}
      <Text style={styles.label}>Amount</Text>
      <View style={styles.amountContainer}>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.0"
          placeholderTextColor={STACKS_THEME.colors.text.tertiary}
          keyboardType="decimal-pad"
        />
        <TouchableOpacity style={styles.maxButton} onPress={handleMaxAmount}>
          <Text style={styles.maxButtonText}>MAX</Text>
        </TouchableOpacity>
      </View>

      {/* Estimated Shares */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoLabel}>Estimated Shares:</Text>
        <Text style={styles.infoValue}>{estimatedShares}</Text>
      </View>

      {/* Add Liquidity Button */}
      <TouchableOpacity 
        style={[
          styles.addButton,
          (!amount || parseFloat(amount) <= 0) ? styles.disabledButton : null
        ]}
        onPress={handleAddLiquidity}
        disabled={!amount || parseFloat(amount) <= 0 || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={STACKS_THEME.colors.text.primary} />
        ) : (
          <Text style={styles.addButtonText}>Add Liquidity</Text>
        )}
      </TouchableOpacity>

      {/* Token Selection Modal */}
      {renderTokenModal()}
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
    marginBottom: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: STACKS_THEME.colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  amountInput: {
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
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    color: STACKS_THEME.colors.text.secondary,
    fontSize: 14,
  },
  infoValue: {
    color: STACKS_THEME.colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: STACKS_THEME.colors.primary.default,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  addButtonText: {
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

export default AddLiquidity;