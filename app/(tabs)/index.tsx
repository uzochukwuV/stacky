import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { STACKS_THEME } from '~/lib/constants';
import Dashboard from '../dashboard';

// Mock data for demonstration
const mockWalletData = {
  totalBalanceUSD: 2458.32,
  totalBalanceSTX: 1245.67,
  tokens: [
    { id: '1', symbol: 'STX', name: 'Stacks', balance: 1245.67, value: 1245.67, logo: 'https://cryptologos.cc/logos/stacks-stx-logo.png' },
    { id: '2', symbol: 'ALEX', name: 'ALEX Lab', balance: 5678.9, value: 567.89, logo: 'https://cryptologos.cc/logos/alex-lab-alex-logo.png' },
    { id: '3', symbol: 'USDA', name: 'USDA', balance: 644.76, value: 644.76, logo: 'https://cryptologos.cc/logos/usda-usda-logo.png' },
  ],
  pendingTransactions: [
    { id: 'tx1', type: 'swap', status: 'pending', timestamp: Date.now() - 300000 }
  ]
};

// Quick action component
const QuickAction = ({ icon, label, onPress, color = STACKS_THEME.colors.primary.default }: any) => (
  <TouchableOpacity 
    onPress={onPress}
    style={{
      alignItems: 'center',
      backgroundColor: STACKS_THEME.colors.background.card,
      borderRadius: STACKS_THEME.borderRadius.md,
      padding: STACKS_THEME.spacing.md,
      width: 100,
      marginRight: STACKS_THEME.spacing.md,
    }}
  >
    <View style={{ 
      backgroundColor: `${color}20`, 
      borderRadius: STACKS_THEME.borderRadius.full,
      padding: STACKS_THEME.spacing.sm,
      marginBottom: STACKS_THEME.spacing.sm
    }}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={{ color: STACKS_THEME.colors.text.primary, fontFamily: 'Inter_500Medium' }}>
      {label}
    </Text>
  </TouchableOpacity>
);

// Token item component
const TokenItem = ({ token, onPress }: { token: any, onPress: () => void }) => (
  <TouchableOpacity 
    onPress={onPress}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: STACKS_THEME.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: STACKS_THEME.colors.border.default,
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Image 
        source={{ uri: token.logo }} 
        style={{ 
          width: 40, 
          height: 40, 
          borderRadius: STACKS_THEME.borderRadius.full,
          marginRight: STACKS_THEME.spacing.md,
        }} 
      />
      <View>
        <Text style={{ 
          color: STACKS_THEME.colors.text.primary, 
          fontFamily: 'Inter_600SemiBold',
          fontSize: 16,
        }}>
          {token.symbol}
        </Text>
        <Text style={{ 
          color: STACKS_THEME.colors.text.secondary,
          fontFamily: 'Inter_400Regular',
          fontSize: 14,
        }}>
          {token.name}
        </Text>
      </View>
    </View>
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={{ 
        color: STACKS_THEME.colors.text.primary, 
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
      }}>
        {token.balance.toLocaleString()} {token.symbol}
      </Text>
      <Text style={{ 
        color: STACKS_THEME.colors.text.secondary,
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
      }}>
        ${token.value.toLocaleString()}
      </Text>
    </View>
  </TouchableOpacity>
);

// Notification component
const NotificationBanner = ({ transaction }: any ) => (
  <View style={{
    backgroundColor: `${STACKS_THEME.colors.warning}20`,
    borderRadius: STACKS_THEME.borderRadius.md,
    padding: STACKS_THEME.spacing.md,
    marginBottom: STACKS_THEME.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  }}>
    <Ionicons name="time-outline" size={24} color={STACKS_THEME.colors.warning} style={{ marginRight: STACKS_THEME.spacing.sm }} />
    <View style={{ flex: 1 }}>
      <Text style={{ color: STACKS_THEME.colors.text.primary, fontFamily: 'Inter_500Medium' }}>
        Pending {transaction.type}
      </Text>
      <Text style={{ color: STACKS_THEME.colors.text.secondary, fontFamily: 'Inter_400Regular' }}>
        Transaction in progress...
      </Text>
    </View>
    <TouchableOpacity>
      <Ionicons name="chevron-forward" size={24} color={STACKS_THEME.colors.text.secondary} />
    </TouchableOpacity>
  </View>
);

export default function HomeScreen() {
  const [walletData, setWalletData] = useState(mockWalletData);

  const handleSend = () => {
    // Navigate to send screen
    console.log('Navigate to send screen');
  };

  const handleReceive = () => {
    // Navigate to receive screen
    console.log('Navigate to receive screen');
  };

  const handleSwap = () => {
    // Navigate to swap screen
    console.log('Navigate to swap screen');
  };

  const handleLiquidity = () => {
    // Navigate to liquidity screen
    console.log('Navigate to liquidity screen');
  };

  const handleTokenPress = (token: any) => {
    // Navigate to token details
    console.log('Token pressed:', token);
  };

  // return <Dashboard />;

  return (
    <SafeAreaView style={{ 
      flex: 1, 
      backgroundColor: STACKS_THEME.colors.background.primary,
    }}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: STACKS_THEME.spacing.md }}
      >
        {/* Balance Card */}
        <View style={{
          backgroundColor: STACKS_THEME.colors.background.card,
          borderRadius: STACKS_THEME.borderRadius.lg,
          padding: STACKS_THEME.spacing.lg,
          marginBottom: STACKS_THEME.spacing.lg,
        }}>
          <Text style={{ 
            color: STACKS_THEME.colors.text.secondary, 
            fontFamily: 'Inter_400Regular',
            marginBottom: STACKS_THEME.spacing.xs,
          }}>
            Total Balance
          </Text>
          <Text style={{ 
            color: STACKS_THEME.colors.text.primary, 
            fontFamily: 'Inter_700Bold',
            fontSize: 32,
            marginBottom: STACKS_THEME.spacing.sm,
          }}>
            ${walletData.totalBalanceUSD.toLocaleString()}
          </Text>
          <Text style={{ 
            color: STACKS_THEME.colors.text.secondary, 
            fontFamily: 'Inter_500Medium',
          }}>
            {walletData.totalBalanceSTX.toLocaleString()} STX
          </Text>
        </View>

        {/* Pending Transactions */}
        {walletData.pendingTransactions.length > 0 && (
          walletData.pendingTransactions.map(transaction => (
            <NotificationBanner key={transaction.id} transaction={transaction} />
          ))
        )}

        {/* Quick Actions */}
        <Text style={{ 
          color: STACKS_THEME.colors.text.primary, 
          fontFamily: 'Inter_600SemiBold',
          fontSize: 18,
          marginBottom: STACKS_THEME.spacing.md,
        }}>
          Quick Actions
        </Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: STACKS_THEME.spacing.md }}
        >
          <QuickAction icon="arrow-up-outline" label="Send" onPress={handleSend} />
          <QuickAction icon="arrow-down-outline" label="Receive" onPress={handleReceive} />
          <QuickAction icon="swap-horizontal-outline" label="Swap" onPress={handleSwap} color={STACKS_THEME.colors.accent.default} />
          <QuickAction icon="water-outline" label="Liquidity" onPress={handleLiquidity} color={STACKS_THEME.colors.accent.secondary} />
        </ScrollView>

        {/* Token List */}
        <View style={{ marginTop: STACKS_THEME.spacing.lg }}>
          <Text style={{ 
            color: STACKS_THEME.colors.text.primary, 
            fontFamily: 'Inter_600SemiBold',
            fontSize: 18,
            marginBottom: STACKS_THEME.spacing.md,
          }}>
            Your Assets
          </Text>
          <View style={{
            backgroundColor: STACKS_THEME.colors.background.card,
            borderRadius: STACKS_THEME.borderRadius.lg,
            padding: STACKS_THEME.spacing.md,
          }}>
            {walletData.tokens.map(token => (
              <TokenItem key={token.id} token={token} onPress={() => handleTokenPress(token)} />
            ))}
          </View>
        </View>
        
      </ScrollView>
    </SafeAreaView>
  );
}