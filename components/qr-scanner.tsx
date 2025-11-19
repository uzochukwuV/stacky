import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { CameraView, Camera, BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { FRAMER_THEME } from '~/lib/theme';
import { RadialGradient } from './ui/radial-gradient';

interface QRScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
  title?: string;
}

/**
 * QR Code Scanner Component
 *
 * Scans QR codes for wallet addresses, WalletConnect URIs, etc.
 * Automatically validates Ethereum addresses.
 */
export function QRScanner({ visible, onClose, onScan, title = 'Scan QR Code' }: QRScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible) {
      requestCameraPermission();
      setScanned(false);
    }
  }, [visible]);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');

    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access to scan QR codes.',
        [{ text: 'OK', onPress: onClose }]
      );
    }
  };

  const handleBarCodeScanned = ({ type, data }: BarcodeScanningResult) => {
    if (scanned) return;

    setScanned(true);

    // Validate and process the scanned data
    const cleanedData = data.trim();

    // Check if it's an Ethereum address (with or without ethereum: prefix)
    const ethereumRegex = /^(ethereum:)?(0x[a-fA-F0-9]{40})$/;
    const match = cleanedData.match(ethereumRegex);

    if (match) {
      const address = match[2]; // Extract just the address
      onScan(address);
      onClose();
    } else if (cleanedData.startsWith('wc:')) {
      // WalletConnect URI
      onScan(cleanedData);
      onClose();
    } else if (cleanedData.startsWith('0x')) {
      // Assume it's an address or transaction hash
      onScan(cleanedData);
      onClose();
    } else {
      // Unknown format
      Alert.alert(
        'Invalid QR Code',
        'The scanned QR code is not a valid wallet address or transaction.',
        [
          {
            text: 'Retry',
            onPress: () => setScanned(false),
          },
          {
            text: 'Cancel',
            onPress: onClose,
            style: 'cancel',
          },
        ]
      );
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={FRAMER_THEME.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Camera View */}
        {hasPermission === null ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Requesting camera permission...</Text>
          </View>
        ) : hasPermission === false ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorIcon}>
              <RadialGradient
                colors={FRAMER_THEME.colors.gradient.pink}
                style={styles.errorIconGradient}
                cx="50%"
                cy="50%"
                rx="70%"
                ry="70%"
              >
                <Ionicons
                  name="camera-off"
                  size={48}
                  color={FRAMER_THEME.colors.text.inverse}
                />
              </RadialGradient>
            </View>
            <Text style={styles.errorTitle}>Camera Access Denied</Text>
            <Text style={styles.errorSubtitle}>
              Please enable camera permission in your device settings
            </Text>
          </View>
        ) : (
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
            >
              {/* Scan Frame Overlay */}
              <View style={styles.overlay}>
                <View style={styles.scanFrame}>
                  <View style={[styles.corner, styles.cornerTopLeft]} />
                  <View style={[styles.corner, styles.cornerTopRight]} />
                  <View style={[styles.corner, styles.cornerBottomLeft]} />
                  <View style={[styles.corner, styles.cornerBottomRight]} />
                </View>
              </View>

              {/* Instructions */}
              <View style={styles.instructions}>
                <Text style={styles.instructionsText}>
                  Position QR code within the frame
                </Text>
              </View>
            </CameraView>
          </View>
        )}

        {/* Manual Input Option */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => {
              onClose();
              // You can add a callback to open manual address input
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="create-outline"
              size={20}
              color={FRAMER_THEME.colors.accent.pink}
            />
            <Text style={styles.manualButtonText}>Enter Address Manually</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const SCAN_FRAME_SIZE = 250;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FRAMER_THEME.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: FRAMER_THEME.spacing.lg,
    paddingTop: FRAMER_THEME.spacing['3xl'],
    paddingBottom: FRAMER_THEME.spacing.lg,
  },
  closeButton: {
    width: 40,
  },
  title: {
    fontSize: FRAMER_THEME.typography.fontSize.xl,
    fontWeight: FRAMER_THEME.typography.fontWeight.bold,
    color: FRAMER_THEME.colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: FRAMER_THEME.borderRadius.lg,
    marginHorizontal: FRAMER_THEME.spacing.lg,
    marginBottom: FRAMER_THEME.spacing.lg,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: FRAMER_THEME.colors.accent.pink,
    borderWidth: 4,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: FRAMER_THEME.borderRadius.md,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: FRAMER_THEME.borderRadius.md,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: FRAMER_THEME.borderRadius.md,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: FRAMER_THEME.borderRadius.md,
  },
  instructions: {
    position: 'absolute',
    bottom: FRAMER_THEME.spacing['3xl'],
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.semibold,
    color: FRAMER_THEME.colors.text.inverse,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: FRAMER_THEME.spacing.lg,
    paddingVertical: FRAMER_THEME.spacing.sm,
    borderRadius: FRAMER_THEME.borderRadius.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.medium,
    color: FRAMER_THEME.colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: FRAMER_THEME.spacing.xl,
  },
  errorIcon: {
    width: 100,
    height: 100,
    marginBottom: FRAMER_THEME.spacing.lg,
  },
  errorIconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: FRAMER_THEME.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...FRAMER_THEME.shadows.lg,
  },
  errorTitle: {
    fontSize: FRAMER_THEME.typography.fontSize.xl,
    fontWeight: FRAMER_THEME.typography.fontWeight.bold,
    color: FRAMER_THEME.colors.text.primary,
    marginBottom: FRAMER_THEME.spacing.xs,
  },
  errorSubtitle: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.regular,
    color: FRAMER_THEME.colors.text.secondary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: FRAMER_THEME.spacing.lg,
    paddingBottom: FRAMER_THEME.spacing.xl,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: FRAMER_THEME.spacing.sm,
    padding: FRAMER_THEME.spacing.md,
    backgroundColor: FRAMER_THEME.colors.background.secondary,
    borderRadius: FRAMER_THEME.borderRadius.md,
  },
  manualButtonText: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.semibold,
    color: FRAMER_THEME.colors.accent.pink,
  },
});
