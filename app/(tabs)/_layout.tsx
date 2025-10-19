import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { STACKS_THEME } from "~/lib/constants";
import { View } from "react-native";
import { Header } from "~/components/header";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: STACKS_THEME.colors.background.primary,
          borderTopColor: STACKS_THEME.colors.border.default,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: STACKS_THEME.colors.primary.default,
        tabBarInactiveTintColor: STACKS_THEME.colors.text.tertiary,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 12,
        },
        headerStyle: {
          backgroundColor: STACKS_THEME.colors.background.primary,
        },
        headerTitleStyle: {
          color: STACKS_THEME.colors.text.primary,
          fontFamily: "Inter_600SemiBold",
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="swap"
        options={{
          title: "Swap",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="swap-horizontal-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="liquidity"
        options={{
          title: "Liquidity",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="water-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
         name="otp-auth"
            options={{
              headerShown: false,
            }}
      />
      <Tabs.Screen
        name="import-wallet"
        options={{
          title: "Import Wallet",
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          header: () => <Header />,
          title: "",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
