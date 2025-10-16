export const NAV_THEME = {
  light: {
    background: "hsl(0 0% 100%)", // background
    border: "hsl(240 5.9% 90%)", // border
    card: "hsl(0 0% 100%)", // card
    notification: "hsl(0 84.2% 60.2%)", // destructive
    primary: "hsl(241.31deg 100% 64.12%)", // primary
    text: "hsl(240 10% 3.9%)", // foreground
  },
  dark: {
    background: "#0A0A0A", // dark background
    border: "#2A2A2A", // dark border
    card: "#121212", // dark card
    notification: "#FF4D4D", // destructive
    primary: "#7B61FF", // primary purple
    text: "#FFFFFF", // white text
  },
};

// Stacks Wallet Theme
export const STACKS_THEME = {
  colors: {
    background: {
      primary: "#0A0A0A",
      secondary: "#121212",
      card: "#1A1A1A",
    },
    primary: {
      default: "#7B61FF",
      hover: "#8A74FF",
      pressed: "#6A52E5",
    },
    accent: {
      default: "#9D4EDD",
      secondary: "#00C2FF",
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#AAAAAA",
      tertiary: "#777777",
    },
    border: {
      default: "#2A2A2A",
      focus: "#3A3A3A",
    },
    success: "#4CAF50",
    warning: "#FF9800",
    error: "#FF4D4D",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 20,
    full: 9999,
  },
};

export const DEFAULT_ETHEREUM_ACCOUNTS = [
  {
    curve: "CURVE_SECP256K1" as const,  
    pathFormat: "PATH_FORMAT_BIP32" as const,  
    path: "m/44'/60'/0'/0/0",
    addressFormat: "ADDRESS_FORMAT_ETHEREUM" as const, 
  },
];

export const APP_SCHEME = process.env.EXPO_PUBLIC_APP_SCHEME ?? "";

export const BACKEND_API_URL = "http://10.0.2.2:3000"; // process.env.EXPO_PUBLIC_BACKEND_API_URL ?? 

export const TURNKEY_API_URL = process.env.EXPO_PUBLIC_TURNKEY_API_URL ?? "";
export const TURNKEY_PARENT_ORG_ID =
  process.env.EXPO_PUBLIC_TURNKEY_ORGANIZATION_ID ?? "";

export const RP_ID = process.env.EXPO_PUBLIC_RPID ?? "";
export const PASSKEY_APP_NAME = process.env.EXPO_PUBLIC_PASSKEY_APP_NAME ?? "";

export const OAUTH_TOKEN_EXPIRATION_SECONDS = "3600";
export const GOOGLE_CLIENT_ID =process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "";
 export const TURNKEY_API_PRIVATE_KEY = ""
 export const TURNKEY_API_PUBLIC_KEY = ""
 export const TURNKEY_BASE_URL = ""
 export const TURNKEY_ORGANIZATION_ID = ""
 export const TURNKEY_SIGNER_PUBLIC_KEY = ""