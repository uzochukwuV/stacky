import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { RadialGradient } from '~/components/ui/radial-gradient';
import { FRAMER_THEME } from '~/lib/theme';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: string[];
  accentColor: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Multi-Chain Wallet',
    description: 'Manage assets across Ethereum, Polygon, Stacks, and more from a single, secure wallet.',
    icon: 'wallet-outline',
    gradient: FRAMER_THEME.colors.gradient.pink,
    accentColor: FRAMER_THEME.colors.accent.pink,
  },
  {
    id: '2',
    title: 'Cross-Chain Swaps',
    description: 'Swap tokens across different blockchains instantly with Sideshift integration.',
    icon: 'swap-horizontal-outline',
    gradient: FRAMER_THEME.colors.gradient.blue,
    accentColor: FRAMER_THEME.colors.accent.blue,
  },
  {
    id: '3',
    title: 'DeFi Automation',
    description: 'Automate limit orders, DCA strategies, and complex DeFi operations seamlessly.',
    icon: 'flash-outline',
    gradient: FRAMER_THEME.colors.gradient.yellow,
    accentColor: FRAMER_THEME.colors.accent.yellow,
  },
  {
    id: '4',
    title: 'Secure & Private',
    description: 'Non-custodial wallet with Turnkey security. Your keys, your crypto.',
    icon: 'shield-checkmark-outline',
    gradient: FRAMER_THEME.colors.gradient.indigo,
    accentColor: FRAMER_THEME.colors.accent.indigo,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      // Last slide, navigate to main app
      router.replace('/(tabs)/home');
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)/home');
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.3, 1, 0.3],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slide}>
        {/* Icon with radial gradient background */}
        <Animated.View style={[styles.iconContainer, { transform: [{ scale }], opacity }]}>
          <RadialGradient
            colors={item.gradient}
            style={styles.iconGradient}
            cx="50%"
            cy="50%"
            rx="70%"
            ry="70%"
          >
            <Ionicons name={item.icon} size={64} color={FRAMER_THEME.colors.text.inverse} />
          </RadialGradient>
        </Animated.View>

        {/* Content */}
        <Animated.View style={[styles.content, { opacity }]}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </Animated.View>
      </View>
    );
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {SLIDES.map((_, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                  backgroundColor:
                    currentIndex === index
                      ? SLIDES[currentIndex].accentColor
                      : FRAMER_THEME.colors.border.dark,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      />

      {/* Pagination dots */}
      {renderDots()}

      {/* Next/Get Started button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            { backgroundColor: SLIDES[currentIndex].accentColor },
          ]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={FRAMER_THEME.colors.text.inverse}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FRAMER_THEME.colors.background.primary,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: FRAMER_THEME.spacing.lg,
    zIndex: 10,
    paddingHorizontal: FRAMER_THEME.spacing.md,
    paddingVertical: FRAMER_THEME.spacing.sm,
  },
  skipText: {
    fontSize: FRAMER_THEME.typography.fontSize.base,
    fontWeight: FRAMER_THEME.typography.fontWeight.semibold,
    color: FRAMER_THEME.colors.text.secondary,
  },
  slide: {
    width,
    paddingHorizontal: FRAMER_THEME.spacing.xl,
    paddingTop: height * 0.15,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: FRAMER_THEME.spacing['3xl'],
  },
  iconGradient: {
    width: 140,
    height: 140,
    borderRadius: FRAMER_THEME.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...FRAMER_THEME.shadows.xl,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: FRAMER_THEME.spacing.lg,
  },
  title: {
    fontSize: FRAMER_THEME.typography.fontSize['3xl'],
    fontWeight: FRAMER_THEME.typography.fontWeight.bold,
    color: FRAMER_THEME.colors.text.primary,
    textAlign: 'center',
    marginBottom: FRAMER_THEME.spacing.md,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: FRAMER_THEME.typography.fontSize.lg,
    fontWeight: FRAMER_THEME.typography.fontWeight.regular,
    color: FRAMER_THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: FRAMER_THEME.typography.fontSize.lg * FRAMER_THEME.typography.lineHeight.relaxed,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: FRAMER_THEME.spacing['2xl'],
    gap: FRAMER_THEME.spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: FRAMER_THEME.borderRadius.full,
  },
  buttonContainer: {
    paddingHorizontal: FRAMER_THEME.spacing.xl,
    paddingBottom: FRAMER_THEME.spacing['3xl'],
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: FRAMER_THEME.spacing.md + 4,
    borderRadius: FRAMER_THEME.borderRadius.md,
    gap: FRAMER_THEME.spacing.sm,
    ...FRAMER_THEME.shadows.md,
  },
  nextButtonText: {
    fontSize: FRAMER_THEME.typography.fontSize.lg,
    fontWeight: FRAMER_THEME.typography.fontWeight.semibold,
    color: FRAMER_THEME.colors.text.inverse,
  },
});
