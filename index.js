import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";
import "react-native-get-random-values";

// // Patch for react-native-keychain
// // Fix for "Cannot read property 'setGenericPasswordForOptions' of null" error
// const memoryStorage = new Map();

// // Monkey patch the Keychain module
// jest.mock('react-native-keychain', () => ({
//   setGenericPassword: async (username, password, options) => {
//     try {
//       const service = options?.service || 'default';
//       const key = `${service}_${username}`;
//       memoryStorage.set(key, password);
//       console.log('KeychainPatch: Saved to memory storage:', key);
//       return true;
//     } catch (error) {
//       console.error('KeychainPatch error:', error);
//       return false;
//     }
//   },
//   getGenericPassword: async (options) => {
//     try {
//       const service = options?.service || 'default';
//       // Find keys that match this service
//       for (const [key, value] of memoryStorage.entries()) {
//         if (key.startsWith(`${service}_`)) {
//           const username = key.split('_')[1];
//           return { username, password: value };
//         }
//       }
//       return false;
//     } catch (error) {
//       console.error('KeychainPatch error:', error);
//       return false;
//     }
//   },
//   resetGenericPassword: async () => true,
//   ACCESSIBLE: {
//     WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly'
//   }
// }));

// https://docs.expo.dev/router/reference/troubleshooting/#expo_router_app_root-not-defined

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context("./app");
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
