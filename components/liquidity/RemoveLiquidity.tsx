import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STACKS_THEME } from '../../lib/constants';
import { removeLiquidity, removeLiquidityWithAlternative } from '../../lib/stacks-utils';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';

// Mock liquidity pool data - replace with actual data from your API
const LIQUIDITY_POOLS = [
  { 
    id: '1',
    token0: { symbol: 'STX', name: 'Stacks', address: 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159.stx-token', icon: '🔷' },
    token1: { symbol: 'BTC', name: 'Bitcoin', address: 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159.wrapped-bitcoin', icon: '₿' },
    userLpBalance: '10.5',
    token0Balance: '1000',
    token1Balance: '0.05',
    lpTokenAddress: 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159.lp-token-stx-btc'
  },
  { 
    id: '2',
    token0: { symbol: 'STX', name: 'Stacks', address: 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159.stx-token', icon: '🔷' },
    token1: { symbol: 'USDA', name: 'USDA', address: 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159.usda-token', icon: '💵' },
    userLpBalance: '25.3',
    token0Balance: '2500',
    token1Balance: '3750',
    lpTokenAddress: 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159.lp-token-stx-usda'
  },
];

const RemoveLiquidity = () => {
  const router = useRouter();
  const [selectedPool, setSelectedPool] = useState(LIQUIDITY_POOLS[0]);
  const [showPoolModal, setShowPoolModal] = useState(false);
  const [percentToRemove, setPercentToRemove] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [token0Amount, setToken0Amount] = useState('0');
  const [token1Amount, setToken1Amount] = useState('0');
  const [singleAssetMode, setSingleAssetMode] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [slippage, setSlippage] = useState('0.5');

  // Calculate token amounts based on percentage
  useEffect(() => {
    if (selectedPool) {
      const lpAmount = parseFloat(selectedPool.userLpBalance) * (percentToRemove / 100);
      
      // In a real app, these would be calculated based on the actual pool reserves
      const token0Amt = (parseFloat(selectedPool.token0Balance) / parseFloat(selectedPool.userLpBalance)) * lpAmount;
      const token1Amt = (parseFloat(selectedPool.token1Balance) / parseFloat(selectedPool.userLpBalance)) * lpAmount;
      
      setToken0Amount(token0Amt.toFixed(6));
      setToken1Amount(token1Amt.toFixed(6));
    }
  }, [selectedPool, percentToRemove]);

  const handleRemoveLiquidity = async () => {
    if (percentToRemove <= 0) {
      Alert.alert('Invalid Amount', 'Please select a percentage to remove');
      return;
    }

    try {
      setIsLoading(true);
      
      // Calculate LP token amount to remove in micros (Stacks uses 10^6 precision)
      const lpAmount = parseFloat(selectedPool.userLpBalance) * (percentToRemove / 100);
      const lpAmountMicros = BigInt(Math.floor(lpAmount * 1000000));
      
      // Calculate minimum amounts with slippage
      const minToken0AmountFloat = parseFloat(token0Amount) * (1 - parseFloat(slippage) / 100);
      const minToken1AmountFloat = parseFloat(token1Amount) * (1 - parseFloat(slippage) / 100);
      
      const minToken0AmountMicros = BigInt(Math.floor(minToken0AmountFloat * 1000000));
      const minToken1AmountMicros = BigInt(Math.floor(minToken1AmountFloat * 1000000));
      
      // In a real app, you would get the nonce from the blockchain
      const nonce = 0n;
      
      let result;
      
      if (singleAssetMode && selectedAsset) {
        // Remove liquidity with single asset
        result = await removeLiquidityWithAlternative(
          selectedPool.lpTokenAddress,
          selectedPool.token0.address,
          selectedPool.token1.address,
          lpAmountMicros,
          selectedAsset === selectedPool.token0.symbol ? minToken0AmountMicros : 0n,
          selectedAsset === selectedPool.token1.symbol ? minToken1AmountMicros : 0n,
          selectedAsset === selectedPool.token0.symbol ? selectedPool.token0.address : selectedPool.token1.address,
          nonce
        );
      } else {
        // Remove liquidity with both assets
        result = await removeLiquidity(
          selectedPool.lpTokenAddress,
          selectedPool.token0.address,
          selectedPool.token1.address,
          lpAmountMicros,
          minToken0AmountMicros,
          minToken1AmountMicros,
          nonce
        );
      }
      
      console.log('Transaction result:', result);
      
      Alert.alert(
        'Success',
        `Successfully removed ${lpAmount.toFixed(6)} LP tokens. Transaction ID: ${result.txid}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Remove liquidity error:', error);
      Alert.alert('Error', `Failed to remove liquidity: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxAmount = () => {
    setPercentToRemove(100);
  };

  const toggleSingleAssetMode = () => {
    setSingleAssetMode(!singleAssetMode);
    setSelectedAsset(singleAssetMode ? null : selectedPool.token0.symbol);
  };

  const renderPoolModal = () => (
    <View style={[styles.modalContainer, showPoolModal ? styles.visible : styles.hidden]}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Liquidity Pool</Text>
          <TouchableOpacity onPress={() => setShowPoolModal(false)}>
            <Ionicons name="close" size={24} color={STACKS_THEME.colors.text.secondary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView>
          {LIQUIDITY_POOLS.map((pool) => (
            <TouchableOpacity
              key={pool.id}
              style={styles.poolItem}
              onPress={() => {
                setSelectedPool(pool);
                setShowPoolModal(false);
                // Reset other values when changing pools
                setPercentToRemove(50);
                setSingleAssetMode(false);
                setSelectedAsset(null);
              }}
            >
              <View style={styles.poolIconContainer}>
                <Text style={styles.poolIcon}>{pool.token0.icon}</Text>
                <Text style={[styles.poolIcon, styles.overlappingIcon]}>{pool.token1.icon}</Text>
              </View>
              <View style={styles.poolInfo}>
                <Text style={styles.poolPair}>{pool.token0.symbol}/{pool.token1.symbol}</Text>
                <Text style={styles.poolBalance}>Your LP: {pool.userLpBalance}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Remove Liquidity</Text>
      <Text style={styles.description}>
        Remove your liquidity position from the pool
      </Text>

      {/* Pool Selection */}
      <Text style={styles.label}>Liquidity Pool</Text>
      <TouchableOpacity 
        style={styles.poolSelector}
        onPress={() => setShowPoolModal(true)}
      >
        <View style={styles.poolIconContainer}>
          <Text style={styles.poolIcon}>{selectedPool.token0.icon}</Text>
          <Text style={[styles.poolIcon, styles.overlappingIcon]}>{selectedPool.token1.icon}</Text>
        </View>
        <View style={styles.poolInfo}>
          <Text style={styles.poolPair}>{selectedPool.token0.symbol}/{selectedPool.token1.symbol}</Text>
          <Text style={styles.poolBalance}>Your LP: {selectedPool.userLpBalance}</Text>
        </View>
        <Ionicons name="chevron-down" size={20} color={STACKS_THEME.colors.text.secondary} />
      </TouchableOpacity>

      {/* Amount Selection */}
      <View style={styles.amountContainer}>
        <View style={styles.percentHeader}>
          <Text style={styles.label}>Amount to Remove</Text>
          <TouchableOpacity style={styles.maxButton} onPress={handleMaxAmount}>
            <Text style={styles.maxButtonText}>MAX</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={percentToRemove}
            onValueChange={setPercentToRemove}
            minimumTrackTintColor={STACKS_THEME.colors.primary.default}
            maximumTrackTintColor={STACKS_THEME.colors.background.secondary}
            thumbTintColor={STACKS_THEME.colors.primary.default}
          />
          <View style={styles.percentageLabels}>
            <Text style={styles.percentageLabel}>0%</Text>
            <Text style={styles.percentageLabel}>25%</Text>
            <Text style={styles.percentageLabel}>50%</Text>
            <Text style={styles.percentageLabel}>75%</Text>
            <Text style={styles.percentageLabel}>100%</Text>
          </View>
        </View>
        
        <View style={styles.percentageDisplay}>
          <Text style={styles.percentageValue}>{percentToRemove}%</Text>
        </View>
      </View>

      {/* Single Asset Toggle */}
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Remove as single asset</Text>
        <TouchableOpacity 
          style={[styles.toggleButton, singleAssetMode ? styles.toggleActive : styles.toggleInactive]} 
          onPress={toggleSingleAssetMode}
        >
          <View style={[styles.toggleHandle, singleAssetMode ? styles.toggleHandleRight : styles.toggleHandleLeft]} />
        </TouchableOpacity>
      </View>

      {/* Asset Selection (only visible in single asset mode) */}
      {singleAssetMode && (
        <View style={styles.assetSelectionContainer}>
          <Text style={styles.label}>Select Asset</Text>
          <View style={styles.assetButtonsContainer}>
            <TouchableOpacity 
              style={[
                styles.assetButton, 
                selectedAsset === selectedPool.token0.symbol ? styles.assetButtonActive : null
              ]}
              onPress={() => setSelectedAsset(selectedPool.token0.symbol)}
            >
              <Text style={styles.assetButtonIcon}>{selectedPool.token0.icon}</Text>
              <Text style={[
                styles.assetButtonText,
                selectedAsset === selectedPool.token0.symbol ? styles.assetButtonTextActive : null
              ]}>
                {selectedPool.token0.symbol}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.assetButton, 
                selectedAsset === selectedPool.token1.symbol ? styles.assetButtonActive : null
              ]}
              onPress={() => setSelectedAsset(selectedPool.token1.symbol)}
            >
              <Text style={styles.assetButtonIcon}>{selectedPool.token1.icon}</Text>
              <Text style={[
                styles.assetButtonText,
                selectedAsset === selectedPool.token1.symbol ? styles.assetButtonTextActive : null
              ]}>
                {selectedPool.token1.symbol}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* You Will Receive */}
      <View style={styles.receiveContainer}>
        <Text style={styles.receiveTitle}>You Will Receive</Text>
        
        {singleAssetMode ? (
          <View style={styles.receiveItem}>
            <Text style={styles.receiveIcon}>
              {selectedAsset === selectedPool.token0.symbol ? selectedPool.token0.icon : selectedPool.token1.icon}
            </Text>
            <View style={styles.receiveInfo}>
              <Text style={styles.receiveSymbol}>
                {selectedAsset === selectedPool.token0.symbol ? selectedPool.token0.symbol : selectedPool.token1.symbol}
              </Text>
              <Text style={styles.receiveAmount}>
                {selectedAsset === selectedPool.token0.symbol ? 
                  (parseFloat(token0Amount) + parseFloat(token1Amount) * 0.5).toFixed(6) : 
                  (parseFloat(token1Amount) + parseFloat(token0Amount) * 0.5).toFixed(6)}
              </Text>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.receiveItem}>
              <Text style={styles.receiveIcon}>{selectedPool.token0.icon}</Text>
              <View style={styles.receiveInfo}>
                <Text style={styles.receiveSymbol}>{selectedPool.token0.symbol}</Text>
                <Text style={styles.receiveAmount}>{token0Amount}</Text>
              </View>
            </View>
            
            <View style={styles.receiveItem}>
              <Text style={styles.receiveIcon}>{selectedPool.token1.icon}</Text>
              <View style={styles.receiveInfo}>
                <Text style={styles.receiveSymbol}>{selectedPool.token1.symbol}</Text>
                <Text style={styles.receiveAmount}>{token1Amount}</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Slippage Settings */}
      <View style={styles.slippageSettingsContainer}>
        <Text style={styles.slippageLabel}>Slippage Tolerance</Text>
        <View style={styles.slippageButtonsContainer}>
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

      {/* Remove Liquidity Button */}
      <TouchableOpacity 
        style={[
          styles.removeButton,
          (percentToRemove <= 0 || (singleAssetMode && !selectedAsset)) ? styles.disabledButton : null
        ]}
        onPress={handleRemoveLiquidity}
        disabled={percentToRemove <= 0 || (singleAssetMode && !selectedAsset) || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={STACKS_THEME.colors.text.primary} />
        ) : (
          <Text style={styles.removeButtonText}>Remove Liquidity</Text>
        )}
      </TouchableOpacity>

      {/* Pool Selection Modal */}
      {renderPoolModal()}
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
  poolSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: STACKS_THEME.colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  poolIconContainer: {
    flexDirection: 'row',
    marginRight: 12,
    width: 40,
  },
  poolIcon: {
    fontSize: 24,
  },
  overlappingIcon: {
    marginLeft: -10,
  },
  poolInfo: {
    flex: 1,
  },
  poolPair: {
    fontSize: 16,
    fontWeight: '600',
    color: STACKS_THEME.colors.text.primary,
  },
  poolBalance: {
    fontSize: 14,
    color: STACKS_THEME.colors.text.secondary,
  },
  amountContainer: {
    backgroundColor: STACKS_THEME.colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  percentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  sliderContainer: {
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  percentageLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  percentageLabel: {
    fontSize: 12,
    color: STACKS_THEME.colors.text.tertiary,
  },
  percentageDisplay: {
    alignItems: 'center',
  },
  percentageValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: STACKS_THEME.colors.text.primary,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: STACKS_THEME.colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 16,
    color: STACKS_THEME.colors.text.primary,
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: STACKS_THEME.colors.primary.default,
  },
  toggleInactive: {
    backgroundColor: STACKS_THEME.colors.background.secondary,
  },
  toggleHandle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: STACKS_THEME.colors.text.primary,
  },
  toggleHandleLeft: {
    alignSelf: 'flex-start',
  },
  toggleHandleRight: {
    alignSelf: 'flex-end',
  },
  assetSelectionContainer: {
    backgroundColor: STACKS_THEME.colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  assetButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  assetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: STACKS_THEME.colors.background.secondary,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
  },
  assetButtonActive: {
    backgroundColor: STACKS_THEME.colors.primary.default,
  },
  assetButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  assetButtonText: {
    fontSize: 16,
    color: STACKS_THEME.colors.text.secondary,
  },
  assetButtonTextActive: {
    color: STACKS_THEME.colors.text.primary,
    fontWeight: '600',
  },
  receiveContainer: {
    backgroundColor: STACKS_THEME.colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  receiveTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: STACKS_THEME.colors.text.primary,
    marginBottom: 12,
  },
  receiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiveIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  receiveInfo: {
    flex: 1,
  },
  receiveSymbol: {
    fontSize: 16,
    fontWeight: '500',
    color: STACKS_THEME.colors.text.primary,
  },
  receiveAmount: {
    fontSize: 14,
    color: STACKS_THEME.colors.text.secondary,
  },
  slippageSettingsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: STACKS_THEME.colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  slippageLabel: {
    fontSize: 16,
    color: STACKS_THEME.colors.text.primary,
  },
  slippageButtonsContainer: {
    flexDirection: 'row',
  },
  slippageButton: {
    backgroundColor: STACKS_THEME.colors.background.secondary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  slippageButtonActive: {
    backgroundColor: STACKS_THEME.colors.primary.default,
  },
  slippageText: {
    color: STACKS_THEME.colors.text.secondary,
    fontSize: 14,
  },
  slippageTextActive: {
    color: STACKS_THEME.colors.text.primary,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: STACKS_THEME.colors.primary.default,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  removeButtonText: {
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
  poolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: STACKS_THEME.colors.border.default,
  },
});

export default RemoveLiquidity;