import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChainStore } from '~/lib/stores/chain-store';
import { STACKS_THEME } from '~/lib/constants';
import { ChainConfig } from '~/lib/chains/types';

export const ChainSwitcher = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const { currentChain, switchChain, isTestnet, toggleTestnet, getAvailableChains } =
    useChainStore();

  const availableChains = getAvailableChains();

  const handleChainSelect = (chain: ChainConfig) => {
    switchChain(chain.id);
    setModalVisible(false);
  };

  return (
    <>
      {/* Chain Selector Button */}
      <TouchableOpacity
        style={styles.chainButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.chainIcon}>{currentChain.icon}</Text>
        <View style={styles.chainInfo}>
          <Text style={styles.chainName}>{currentChain.name}</Text>
          <Text style={styles.chainType}>{currentChain.type.toUpperCase()}</Text>
        </View>
        <Ionicons
          name="chevron-down"
          size={20}
          color={STACKS_THEME.colors.text.secondary}
        />
      </TouchableOpacity>

      {/* Chain Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Network</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={STACKS_THEME.colors.text.secondary}
                />
              </TouchableOpacity>
            </View>

            {/* Testnet Toggle */}
            <View style={styles.testnetToggle}>
              <View>
                <Text style={styles.testnetLabel}>Testnet Mode</Text>
                <Text style={styles.testnetDescription}>
                  Switch between mainnet and testnet
                </Text>
              </View>
              <Switch
                value={isTestnet}
                onValueChange={toggleTestnet}
                trackColor={{
                  false: STACKS_THEME.colors.border.default,
                  true: STACKS_THEME.colors.primary.default,
                }}
                thumbColor={STACKS_THEME.colors.text.primary}
              />
            </View>

            {/* Chain List */}
            <ScrollView style={styles.chainList}>
              {/* EVM Chains */}
              <Text style={styles.sectionTitle}>EVM Chains</Text>
              {availableChains
                .filter((chain) => chain.type === 'evm')
                .map((chain) => (
                  <TouchableOpacity
                    key={chain.id}
                    style={[
                      styles.chainItem,
                      currentChain.id === chain.id && styles.chainItemActive,
                    ]}
                    onPress={() => handleChainSelect(chain)}
                  >
                    <Text style={styles.chainItemIcon}>{chain.icon}</Text>
                    <View style={styles.chainItemInfo}>
                      <Text style={styles.chainItemName}>{chain.name}</Text>
                      <Text style={styles.chainItemSymbol}>
                        {chain.nativeCurrency.symbol}
                      </Text>
                    </View>
                    {currentChain.id === chain.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={STACKS_THEME.colors.primary.default}
                      />
                    )}
                  </TouchableOpacity>
                ))}

              {/* Stacks Chains */}
              <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                Stacks Chains
              </Text>
              {availableChains
                .filter((chain) => chain.type === 'stacks')
                .map((chain) => (
                  <TouchableOpacity
                    key={chain.id}
                    style={[
                      styles.chainItem,
                      currentChain.id === chain.id && styles.chainItemActive,
                    ]}
                    onPress={() => handleChainSelect(chain)}
                  >
                    <Text style={styles.chainItemIcon}>{chain.icon}</Text>
                    <View style={styles.chainItemInfo}>
                      <Text style={styles.chainItemName}>{chain.name}</Text>
                      <Text style={styles.chainItemSymbol}>
                        {chain.nativeCurrency.symbol}
                      </Text>
                    </View>
                    {currentChain.id === chain.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={STACKS_THEME.colors.primary.default}
                      />
                    )}
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  chainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: STACKS_THEME.colors.background.card,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  chainIcon: {
    fontSize: 24,
  },
  chainInfo: {
    flex: 1,
  },
  chainName: {
    fontSize: 14,
    fontWeight: '600',
    color: STACKS_THEME.colors.text.primary,
  },
  chainType: {
    fontSize: 10,
    color: STACKS_THEME.colors.text.tertiary,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: STACKS_THEME.colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: STACKS_THEME.colors.text.primary,
  },
  testnetToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: STACKS_THEME.colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  testnetLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: STACKS_THEME.colors.text.primary,
  },
  testnetDescription: {
    fontSize: 12,
    color: STACKS_THEME.colors.text.tertiary,
    marginTop: 2,
  },
  chainList: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: STACKS_THEME.colors.text.secondary,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  chainItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: STACKS_THEME.colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  chainItemActive: {
    backgroundColor: STACKS_THEME.colors.background.secondary,
    borderWidth: 1,
    borderColor: STACKS_THEME.colors.primary.default,
  },
  chainItemIcon: {
    fontSize: 32,
  },
  chainItemInfo: {
    flex: 1,
  },
  chainItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: STACKS_THEME.colors.text.primary,
  },
  chainItemSymbol: {
    fontSize: 14,
    color: STACKS_THEME.colors.text.secondary,
    marginTop: 2,
  },
});
