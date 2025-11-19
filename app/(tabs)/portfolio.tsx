import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useTurnkey } from '@turnkey/sdk-react-native';
import { STACKS_THEME } from '~/lib/constants';
import { useChainStore } from '~/lib/stores/chain-store';
import { ChainSwitcher } from '~/components/chain-switcher';
import { getTokenBalances, getNFTs } from '~/lib/services/alchemy';
import { getBalance } from '~/lib/web3-multi';
import { TokenBalance, NFTMetadata } from '~/lib/chains/types';

export default function PortfolioScreen() {
  const { user } = useTurnkey();
  const { currentChain } = useChainStore();

  const [nativeBalance, setNativeBalance] = useState('0');
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [nfts, setNfts] = useState<NFTMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'tokens' | 'nfts'>('tokens');

  const userAddress = user?.wallets?.[0]?.accounts?.[0]?.address;

  const loadPortfolio = async (isRefresh = false) => {
    if (!userAddress) return;

    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Load native balance
      if (currentChain.type === 'evm') {
        const balance = await getBalance(userAddress as `0x${string}`, currentChain);
        const formatted = Number(balance) / 10 ** currentChain.nativeCurrency.decimals;
        setNativeBalance(formatted.toFixed(6));

        // Load ERC20 tokens
        const tokenBalances = await getTokenBalances(
          userAddress as `0x${string}`,
          currentChain
        );
        setTokens(tokenBalances);

        // Load NFTs
        const userNfts = await getNFTs(userAddress as `0x${string}`, currentChain);
        setNfts(userNfts);
      }
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, [userAddress, currentChain]);

  const onRefresh = () => {
    loadPortfolio(true);
  };

  const renderNativeBalance = () => (
    <View style={styles.nativeBalanceCard}>
      <Text style={styles.nativeBalanceLabel}>Total Balance</Text>
      <View style={styles.nativeBalanceRow}>
        <Text style={styles.nativeBalanceIcon}>{currentChain.icon}</Text>
        <View style={styles.nativeBalanceInfo}>
          <Text style={styles.nativeBalanceAmount}>
            {nativeBalance} {currentChain.nativeCurrency.symbol}
          </Text>
          <Text style={styles.nativeBalanceChain}>{currentChain.name}</Text>
        </View>
      </View>
    </View>
  );

  const renderTokenList = () => {
    if (tokens.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No tokens found</Text>
          <Text style={styles.emptyStateSubtext}>
            Tokens will appear here once you receive them
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tokenList}>
        {tokens.map((token, index) => (
          <TouchableOpacity key={index} style={styles.tokenItem}>
            {token.logo ? (
              <Image source={{ uri: token.logo }} style={styles.tokenLogo} />
            ) : (
              <View style={styles.tokenLogoPlaceholder}>
                <Text style={styles.tokenLogoText}>{token.symbol[0]}</Text>
              </View>
            )}
            <View style={styles.tokenItemInfo}>
              <Text style={styles.tokenItemName}>{token.name}</Text>
              <Text style={styles.tokenItemSymbol}>{token.symbol}</Text>
            </View>
            <View style={styles.tokenItemBalance}>
              <Text style={styles.tokenItemAmount}>{token.balanceFormatted}</Text>
              {token.valueUsd && (
                <Text style={styles.tokenItemValue}>${token.valueUsd.toFixed(2)}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderNFTGrid = () => {
    if (nfts.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No NFTs found</Text>
          <Text style={styles.emptyStateSubtext}>
            Your NFT collection will appear here
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.nftGrid}>
        {nfts.map((nft, index) => (
          <TouchableOpacity key={index} style={styles.nftItem}>
            {nft.image ? (
              <Image source={{ uri: nft.image }} style={styles.nftImage} />
            ) : (
              <View style={styles.nftImagePlaceholder}>
                <Text style={styles.nftImagePlaceholderText}>NFT</Text>
              </View>
            )}
            <Text style={styles.nftName} numberOfLines={1}>
              {nft.name}
            </Text>
            <Text style={styles.nftCollection} numberOfLines={1}>
              {nft.collection}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Portfolio</Text>
      <Text style={styles.description}>
        View your tokens and NFTs across multiple chains
      </Text>

      {/* Chain Switcher */}
      <ChainSwitcher />

      {/* Native Balance */}
      {renderNativeBalance()}

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tokens' && styles.tabActive]}
          onPress={() => setActiveTab('tokens')}
        >
          <Text style={[styles.tabText, activeTab === 'tokens' && styles.tabTextActive]}>
            Tokens ({tokens.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'nfts' && styles.tabActive]}
          onPress={() => setActiveTab('nfts')}
        >
          <Text style={[styles.tabText, activeTab === 'nfts' && styles.tabTextActive]}>
            NFTs ({nfts.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={STACKS_THEME.colors.primary.default} />
          <Text style={styles.loadingText}>Loading {activeTab}...</Text>
        </View>
      ) : (
        <>
          {activeTab === 'tokens' && renderTokenList()}
          {activeTab === 'nfts' && renderNFTGrid()}
        </>
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
  nativeBalanceCard: {
    backgroundColor: STACKS_THEME.colors.background.card,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  nativeBalanceLabel: {
    fontSize: 14,
    color: STACKS_THEME.colors.text.secondary,
    marginBottom: 12,
  },
  nativeBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nativeBalanceIcon: {
    fontSize: 40,
  },
  nativeBalanceInfo: {
    flex: 1,
  },
  nativeBalanceAmount: {
    fontSize: 24,
    fontWeight: '600',
    color: STACKS_THEME.colors.text.primary,
  },
  nativeBalanceChain: {
    fontSize: 14,
    color: STACKS_THEME.colors.text.tertiary,
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: STACKS_THEME.colors.background.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: STACKS_THEME.colors.primary.default,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: STACKS_THEME.colors.text.secondary,
  },
  tabTextActive: {
    color: STACKS_THEME.colors.text.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: STACKS_THEME.colors.text.secondary,
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: STACKS_THEME.colors.text.primary,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: STACKS_THEME.colors.text.tertiary,
    textAlign: 'center',
  },
  tokenList: {
    gap: 8,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: STACKS_THEME.colors.background.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  tokenLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  tokenLogoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: STACKS_THEME.colors.primary.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenLogoText: {
    fontSize: 18,
    fontWeight: '600',
    color: STACKS_THEME.colors.text.primary,
  },
  tokenItemInfo: {
    flex: 1,
  },
  tokenItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: STACKS_THEME.colors.text.primary,
  },
  tokenItemSymbol: {
    fontSize: 14,
    color: STACKS_THEME.colors.text.secondary,
    marginTop: 2,
  },
  tokenItemBalance: {
    alignItems: 'flex-end',
  },
  tokenItemAmount: {
    fontSize: 16,
    fontWeight: '500',
    color: STACKS_THEME.colors.text.primary,
  },
  tokenItemValue: {
    fontSize: 14,
    color: STACKS_THEME.colors.text.secondary,
    marginTop: 2,
  },
  nftGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  nftItem: {
    width: '48%',
    backgroundColor: STACKS_THEME.colors.background.card,
    borderRadius: 12,
    padding: 8,
  },
  nftImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  nftImagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: STACKS_THEME.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  nftImagePlaceholderText: {
    fontSize: 24,
    color: STACKS_THEME.colors.text.tertiary,
  },
  nftName: {
    fontSize: 14,
    fontWeight: '500',
    color: STACKS_THEME.colors.text.primary,
  },
  nftCollection: {
    fontSize: 12,
    color: STACKS_THEME.colors.text.secondary,
    marginTop: 2,
  },
});
