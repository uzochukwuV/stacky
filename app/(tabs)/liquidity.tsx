import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { STACKS_THEME } from '../../lib/constants';
import AddLiquidity from '../../components/liquidity/AddLiquidity';
import RemoveLiquidity from '../../components/liquidity/RemoveLiquidity';

const LiquidityScreen = () => {
  const [activeTab, setActiveTab] = useState('add'); // 'add' or 'remove'

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Liquidity</Text>
        <Text style={styles.headerSubtitle}>
          Provide liquidity to earn fees and rewards
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'add' ? styles.activeTab : null]}
          onPress={() => setActiveTab('add')}
        >
          <Text style={[styles.tabText, activeTab === 'add' ? styles.activeTabText : null]}>
            Add
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'remove' ? styles.activeTab : null]}
          onPress={() => setActiveTab('remove')}
        >
          <Text style={[styles.tabText, activeTab === 'remove' ? styles.activeTabText : null]}>
            Remove
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'add' ? <AddLiquidity /> : <RemoveLiquidity />}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: STACKS_THEME.colors.background.primary,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: STACKS_THEME.colors.text.primary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: STACKS_THEME.colors.text.secondary,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: STACKS_THEME.colors.background.card,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: STACKS_THEME.colors.primary.default,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: STACKS_THEME.colors.text.secondary,
  },
  activeTabText: {
    color: STACKS_THEME.colors.text.primary,
  },
  content: {
    flex: 1,
  },
});

export default LiquidityScreen;