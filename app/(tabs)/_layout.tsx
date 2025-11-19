import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { FRAMER_THEME } from '~/lib/theme';
import { RadialGradient } from '~/components/ui/radial-gradient';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: FRAMER_THEME.colors.background.card,
          borderTopWidth: 1,
          borderTopColor: FRAMER_THEME.colors.border.light,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          ...FRAMER_THEME.shadows.xl,
          elevation: 0,
        },
        tabBarActiveTintColor: FRAMER_THEME.colors.text.primary,
        tabBarInactiveTintColor: FRAMER_THEME.colors.text.tertiary,
        tabBarLabelStyle: {
          fontSize: FRAMER_THEME.typography.fontSize.xs,
          fontWeight: FRAMER_THEME.typography.fontWeight.semibold,
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: FRAMER_THEME.colors.background.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: FRAMER_THEME.colors.text.primary,
          fontSize: FRAMER_THEME.typography.fontSize.xl,
          fontWeight: FRAMER_THEME.typography.fontWeight.bold,
        },
        headerShadowVisible: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              {focused && (
                <RadialGradient
                  colors={FRAMER_THEME.colors.gradient.pink}
                  style={styles.iconGradient}
                  cx="50%"
                  cy="50%"
                  rx="70%"
                  ry="70%"
                />
              )}
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={22}
                color={focused ? FRAMER_THEME.colors.text.inverse : color}
              />
            </View>
          ),
        }}
      />

      {/* Portfolio Tab */}
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Portfolio',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              {focused && (
                <RadialGradient
                  colors={FRAMER_THEME.colors.gradient.blue}
                  style={styles.iconGradient}
                  cx="50%"
                  cy="50%"
                  rx="70%"
                  ry="70%"
                />
              )}
              <Ionicons
                name={focused ? 'pie-chart' : 'pie-chart-outline'}
                size={22}
                color={focused ? FRAMER_THEME.colors.text.inverse : color}
              />
            </View>
          ),
        }}
      />

      {/* Transactions Tab */}
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Activity',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              {focused && (
                <RadialGradient
                  colors={FRAMER_THEME.colors.gradient.indigo}
                  style={styles.iconGradient}
                  cx="50%"
                  cy="50%"
                  rx="70%"
                  ry="70%"
                />
              )}
              <Ionicons
                name={focused ? 'receipt' : 'receipt-outline'}
                size={22}
                color={focused ? FRAMER_THEME.colors.text.inverse : color}
              />
            </View>
          ),
        }}
      />

      {/* Swap Tab - Center with special styling */}
      <Tabs.Screen
        name="swap-new"
        options={{
          title: 'Swap',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.centerIconContainer}>
              <RadialGradient
                colors={focused ? FRAMER_THEME.colors.gradient.pink : FRAMER_THEME.colors.gradient.yellow}
                style={styles.centerIconGradient}
                cx="50%"
                cy="50%"
                rx="70%"
                ry="70%"
              >
                <Ionicons
                  name="swap-horizontal"
                  size={28}
                  color={FRAMER_THEME.colors.text.inverse}
                />
              </RadialGradient>
            </View>
          ),
        }}
      />

      {/* DeFi Tab */}
      <Tabs.Screen
        name="defi"
        options={{
          title: 'DeFi',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              {focused && (
                <RadialGradient
                  colors={FRAMER_THEME.colors.gradient.indigo}
                  style={styles.iconGradient}
                  cx="50%"
                  cy="50%"
                  rx="70%"
                  ry="70%"
                />
              )}
              <Ionicons
                name={focused ? 'flash' : 'flash-outline'}
                size={22}
                color={focused ? FRAMER_THEME.colors.text.inverse : color}
              />
            </View>
          ),
        }}
      />

      {/* Settings Tab */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              {focused && (
                <RadialGradient
                  colors={FRAMER_THEME.colors.gradient.yellow}
                  style={styles.iconGradient}
                  cx="50%"
                  cy="50%"
                  rx="70%"
                  ry="70%"
                />
              )}
              <Ionicons
                name={focused ? 'settings' : 'settings-outline'}
                size={22}
                color={focused ? FRAMER_THEME.colors.text.inverse : color}
              />
            </View>
          ),
        }}
      />

      {/* Hide these screens from tab bar */}
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="swap"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="liquidity"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="otp-auth"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="import-wallet"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: FRAMER_THEME.borderRadius.md,
    position: 'relative',
  },
  iconContainerActive: {
    ...FRAMER_THEME.shadows.md,
  },
  iconGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: FRAMER_THEME.borderRadius.md,
  },
  centerIconContainer: {
    width: 56,
    height: 56,
    marginBottom: 20,
  },
  centerIconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: FRAMER_THEME.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...FRAMER_THEME.shadows.xl,
  },
});
