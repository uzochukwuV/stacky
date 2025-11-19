import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { RadialGradient } from '~/components/ui/radial-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FRAMER_THEME } from '~/lib/theme';

export default function DeFiScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>DeFi Automation</Text>
        <Text style={styles.subtitle}>
          Automate your DeFi strategies across multiple chains
        </Text>
      </View>

      {/* Limit Orders */}
      <TouchableOpacity style={styles.card} activeOpacity={0.7}>
        <RadialGradient
          colors={FRAMER_THEME.colors.gradient.pink}
          style={styles.cardGradient}
          cx="50%"
          cy="50%"
          rx="100%"
          ry="100%"
        >
          <View style={styles.cardContent}>
            <View style={styles.cardIcon}>
              <Ionicons
                name="bar-chart"
                size={32}
                color={FRAMER_THEME.colors.text.inverse}
              />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Limit Orders</Text>
              <Text style={styles.cardDescription}>
                Set target prices and automate your token swaps
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={FRAMER_THEME.colors.text.inverse}
            />
          </View>
        </RadialGradient>
      </TouchableOpacity>

      {/* DCA Strategies */}
      <TouchableOpacity style={styles.card} activeOpacity={0.7}>
        <RadialGradient
          colors={FRAMER_THEME.colors.gradient.blue}
          style={styles.cardGradient}
          cx="50%"
          cy="50%"
          rx="100%"
          ry="100%"
        >
          <View style={styles.cardContent}>
            <View style={styles.cardIcon}>
              <Ionicons
                name="calendar"
                size={32}
                color={FRAMER_THEME.colors.text.inverse}
              />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>DCA Strategies</Text>
              <Text style={styles.cardDescription}>
                Dollar-cost average automatically over time
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={FRAMER_THEME.colors.text.inverse}
            />
          </View>
        </RadialGradient>
      </TouchableOpacity>

      {/* Marketplace */}
      <TouchableOpacity style={styles.card} activeOpacity={0.7}>
        <RadialGradient
          colors={FRAMER_THEME.colors.gradient.yellow}
          style={styles.cardGradient}
          cx="50%"
          cy="50%"
          rx="100%"
          ry="100%"
        >
          <View style={styles.cardContent}>
            <View style={styles.cardIcon}>
              <Ionicons
                name="storefront"
                size={32}
                color={FRAMER_THEME.colors.text.inverse}
              />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Task Marketplace</Text>
              <Text style={styles.cardDescription}>
                Browse and execute community DeFi tasks
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={FRAMER_THEME.colors.text.inverse}
            />
          </View>
        </RadialGradient>
      </TouchableOpacity>

      {/* Coming Soon */}
      <View style={styles.comingSoonSection}>
        <Text style={styles.comingSoonTitle}>Coming Soon</Text>
        <View style={styles.comingSoonCard}>
          <Ionicons
            name="rocket-outline"
            size={24}
            color={FRAMER_THEME.colors.text.secondary}
          />
          <Text style={styles.comingSoonText}>More DeFi tools on the way</Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FRAMER_THEME.colors.background.primary,
  },
  header: {
    paddingHorizontal: FRAMER_THEME.spacing.lg,
    paddingTop: FRAMER_THEME.spacing['3xl'],
    paddingBottom: FRAMER_THEME.spacing.xl,
  },
  title: {
    fontSize: FRAMER_THEME.typography.fontSize['3xl'],
    fontWeight: FRAMER_THEME.typography.fontWeight.bold,
    color: FRAMER_THEME.colors.text.primary,
    marginBottom: FRAMER_THEME.spacing.sm,
  },
  subtitle: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.regular,
    color: FRAMER_THEME.colors.text.secondary,
    lineHeight: FRAMER_THEME.typography.fontSize.base * FRAMER_THEME.typography.lineHeight.relaxed,
  },
  card: {
    marginHorizontal: FRAMER_THEME.spacing.lg,
    marginBottom: FRAMER_THEME.spacing.md,
    borderRadius: FRAMER_THEME.borderRadius.lg,
    ...FRAMER_THEME.shadows.lg,
  },
  cardGradient: {
    borderRadius: FRAMER_THEME.borderRadius.lg,
    padding: FRAMER_THEME.spacing.lg,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: FRAMER_THEME.spacing.md,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: FRAMER_THEME.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: FRAMER_THEME.typography.fontSize.xl,
    fontWeight: FRAMER_THEME.typography.fontWeight.bold,
    color: FRAMER_THEME.colors.text.inverse,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: FRAMER_THEME.typography.fontSize.sm,
    fontWeight: FRAMER_THEME.typography.fontWeight.medium,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  comingSoonSection: {
    marginTop: FRAMER_THEME.spacing.xl,
    paddingHorizontal: FRAMER_THEME.spacing.lg,
  },
  comingSoonTitle: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.bold,
    color: FRAMER_THEME.colors.text.primary,
    marginBottom: FRAMER_THEME.spacing.md,
  },
  comingSoonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: FRAMER_THEME.spacing.md,
    backgroundColor: FRAMER_THEME.colors.background.secondary,
    borderRadius: FRAMER_THEME.borderRadius.md,
    padding: FRAMER_THEME.spacing.lg,
    borderWidth: 1,
    borderColor: FRAMER_THEME.colors.border.light,
    borderStyle: 'dashed',
  },
  comingSoonText: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.medium,
    color: FRAMER_THEME.colors.text.secondary,
  },
});
