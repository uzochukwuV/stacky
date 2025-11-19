import "~/global.css";
import { DefaultTheme, Theme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { NAV_THEME } from "~/lib/constants";
import { Providers } from "~/providers";
import { Header } from "~/components/header";
import { PortalHost } from "@rn-primitives/portal";

const LIGHT_THEME: Theme = {
  ...DefaultTheme,
  colors: NAV_THEME.light,
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      ...DefaultTheme.fonts.regular,
      fontFamily: "Inter_400Regular",
    },
    medium: {
      ...DefaultTheme.fonts.medium,
      fontFamily: "Inter_500Medium",
    },
    bold: {
      ...DefaultTheme.fonts.bold,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
    },
    heavy: {
      ...DefaultTheme.fonts.heavy,
      fontFamily: "Inter_800ExtraBold",
    },
  },
};

export default function RootLayout() {
  return (
    <Providers>
      <ThemeProvider value={LIGHT_THEME}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          {/* Splash Screen - Initial Route */}
          <Stack.Screen
            name="splash"
            options={{
              headerShown: false,
            }}
          />

          {/* Onboarding Flow */}
          <Stack.Screen
            name="onboarding"
            options={{
              headerShown: false,
            }}
          />

          {/* Main App - Tab Navigator */}
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />

          {/* Auth Screens */}
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="otp-auth"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="import-wallet"
            options={{
              title: "Import Wallet",
              headerShown: true,
            }}
          />

          {/* Legacy/Other Screens */}
          <Stack.Screen
            name="dashboard"
            options={{
              header: () => <Header />,
              title: "",
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              title: "Settings",
              headerShown: true,
            }}
          />
        </Stack>
        <StatusBar style="dark" backgroundColor="transparent" />
        <PortalHost />
      </ThemeProvider>
    </Providers>
  );
}
