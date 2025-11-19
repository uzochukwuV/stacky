import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = '@biometric_enabled';
const BIOMETRIC_TIMEOUT_KEY = '@biometric_timeout';

export enum BiometricType {
  FINGERPRINT = 1,
  FACIAL_RECOGNITION = 2,
  IRIS = 3,
}

export interface BiometricOptions {
  promptMessage?: string;
  cancelLabel?: string;
  disableDeviceFallback?: boolean;
  requireConfirmation?: boolean;
}

/**
 * Check if the device supports biometric authentication
 */
export async function isBiometricSupported(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  return compatible;
}

/**
 * Check if biometric credentials are enrolled on the device
 */
export async function isBiometricEnrolled(): Promise<boolean> {
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

/**
 * Get available biometric types on the device
 */
export async function getAvailableBiometricTypes(): Promise<BiometricType[]> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  return types;
}

/**
 * Get a user-friendly name for the biometric type
 */
export function getBiometricTypeName(types: BiometricType[]): string {
  if (types.includes(BiometricType.FACIAL_RECOGNITION)) {
    return 'Face ID';
  }
  if (types.includes(BiometricType.FINGERPRINT)) {
    return 'Touch ID';
  }
  if (types.includes(BiometricType.IRIS)) {
    return 'Iris Scan';
  }
  return 'Biometric Authentication';
}

/**
 * Authenticate using biometrics
 */
export async function authenticateWithBiometric(
  options: BiometricOptions = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if biometrics are supported and enrolled
    const compatible = await isBiometricSupported();
    if (!compatible) {
      return {
        success: false,
        error: 'Biometric authentication not supported on this device',
      };
    }

    const enrolled = await isBiometricEnrolled();
    if (!enrolled) {
      return {
        success: false,
        error: 'No biometric credentials enrolled on this device',
      };
    }

    // Perform authentication
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: options.promptMessage || 'Authenticate to continue',
      cancelLabel: options.cancelLabel || 'Cancel',
      disableDeviceFallback: options.disableDeviceFallback || false,
      requireConfirmation: options.requireConfirmation,
    });

    if (result.success) {
      // Update last successful auth timestamp
      await AsyncStorage.setItem(BIOMETRIC_TIMEOUT_KEY, Date.now().toString());
      return { success: true };
    } else {
      return {
        success: false,
        error: result.error || 'Authentication failed',
      };
    }
  } catch (error: any) {
    console.error('[Biometric] Authentication error:', error);
    return {
      success: false,
      error: error.message || 'Authentication failed',
    };
  }
}

/**
 * Check if biometric authentication is enabled in app settings
 */
export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    console.error('[Biometric] Failed to check if enabled:', error);
    return false;
  }
}

/**
 * Enable or disable biometric authentication in app settings
 */
export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled.toString());
  } catch (error) {
    console.error('[Biometric] Failed to set enabled state:', error);
    throw error;
  }
}

/**
 * Check if biometric re-authentication is required (e.g., after timeout)
 */
export async function isReauthenticationRequired(timeoutMinutes: number = 5): Promise<boolean> {
  try {
    const lastAuthStr = await AsyncStorage.getItem(BIOMETRIC_TIMEOUT_KEY);
    if (!lastAuthStr) {
      return true;
    }

    const lastAuth = parseInt(lastAuthStr, 10);
    const now = Date.now();
    const timeoutMs = timeoutMinutes * 60 * 1000;

    return now - lastAuth > timeoutMs;
  } catch (error) {
    console.error('[Biometric] Failed to check reauthentication:', error);
    return true;
  }
}

/**
 * Require biometric authentication with auto-retry and fallback options
 */
export async function requireBiometricAuth(
  options: BiometricOptions & { maxRetries?: number } = {}
): Promise<boolean> {
  const enabled = await isBiometricEnabled();
  if (!enabled) {
    // Biometric not enabled, allow access
    return true;
  }

  const maxRetries = options.maxRetries || 3;
  let attempts = 0;

  while (attempts < maxRetries) {
    const result = await authenticateWithBiometric(options);

    if (result.success) {
      return true;
    }

    attempts++;

    if (attempts >= maxRetries) {
      return false;
    }

    // Wait a bit before next attempt
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return false;
}

/**
 * Setup biometric authentication for the first time
 */
export async function setupBiometric(): Promise<{
  success: boolean;
  biometricType?: string;
  error?: string;
}> {
  try {
    // Check support
    const supported = await isBiometricSupported();
    if (!supported) {
      return {
        success: false,
        error: 'Biometric authentication not supported on this device',
      };
    }

    // Check enrollment
    const enrolled = await isBiometricEnrolled();
    if (!enrolled) {
      return {
        success: false,
        error: 'Please enroll biometric credentials in your device settings first',
      };
    }

    // Get available types
    const types = await getAvailableBiometricTypes();
    const typeName = getBiometricTypeName(types);

    // Test authentication
    const authResult = await authenticateWithBiometric({
      promptMessage: `Enable ${typeName}?`,
      cancelLabel: 'Not Now',
    });

    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error,
      };
    }

    // Enable biometric
    await setBiometricEnabled(true);

    return {
      success: true,
      biometricType: typeName,
    };
  } catch (error: any) {
    console.error('[Biometric] Setup error:', error);
    return {
      success: false,
      error: error.message || 'Failed to setup biometric authentication',
    };
  }
}

/**
 * Disable biometric authentication
 */
export async function disableBiometric(): Promise<void> {
  await setBiometricEnabled(false);
  await AsyncStorage.removeItem(BIOMETRIC_TIMEOUT_KEY);
}
