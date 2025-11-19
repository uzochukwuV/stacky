import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { FRAMER_THEME } from '~/lib/theme';
import { RadialGradient } from '~/components/ui/radial-gradient';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate logo entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle rotation animation
    Animated.loop(
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    // Navigate to onboarding after 2 seconds
    const timer = setTimeout(() => {
      router.replace('/onboarding');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const rotate = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Radial gradient background accent */}
      <RadialGradient
        colors={[FRAMER_THEME.colors.surface.pink, FRAMER_THEME.colors.background.primary]}
        style={styles.gradient}
        cx="30%"
        cy="20%"
        rx="70%"
        ry="70%"
      />

      {/* Logo container */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Animated circle background with radial gradient */}
        <Animated.View
          style={[
            styles.logoCircle,
            {
              transform: [{ rotate }],
            },
          ]}
        >
          <RadialGradient
            colors={FRAMER_THEME.colors.gradient.pink}
            style={styles.gradientCircle}
            cx="50%"
            cy="50%"
            rx="70%"
            ry="70%"
          />
        </Animated.View>

        {/* Logo text */}
        <View style={styles.logoTextContainer}>
          <Text style={styles.logoText}>Stacky</Text>
        </View>
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={[styles.taglineContainer, { opacity: fadeAnim }]}>
        <Text style={styles.tagline}>Multi-Chain Wallet</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FRAMER_THEME.colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'absolute',
  },
  gradientCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  logoTextContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FRAMER_THEME.colors.background.primary,
    borderRadius: 56,
    ...FRAMER_THEME.shadows.lg,
  },
  logoText: {
    fontSize: FRAMER_THEME.typography.fontSize['3xl'],
    fontWeight: FRAMER_THEME.typography.fontWeight.bold,
    color: FRAMER_THEME.colors.text.primary,
    letterSpacing: -1,
  },
  taglineContainer: {
    marginTop: FRAMER_THEME.spacing.xl,
  },
  tagline: {
    fontSize: FRAMER_THEME.typography.fontSize.sm,
    fontWeight: FRAMER_THEME.typography.fontWeight.medium,
    color: FRAMER_THEME.colors.text.secondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
