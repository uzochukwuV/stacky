/**
 * Framer-Inspired Design System
 *
 * Clean, professional design with:
 * - White surfaces
 * - Black typography
 * - Pink, yellow, brown, blue/indigo accents
 * - No purple
 */

export const FRAMER_THEME = {
  colors: {
    // Base colors
    background: {
      primary: '#FFFFFF',      // Pure white
      secondary: '#FAFAFA',    // Off white
      tertiary: '#F5F5F5',     // Light gray
      card: '#FFFFFF',         // White cards
      overlay: 'rgba(0, 0, 0, 0.4)',
    },

    // Text colors
    text: {
      primary: '#000000',      // Pure black
      secondary: '#525252',    // Dark gray
      tertiary: '#A3A3A3',     // Medium gray
      inverse: '#FFFFFF',      // White text on dark backgrounds
      muted: '#D4D4D4',        // Light gray
    },

    // Accent colors (Framer-inspired)
    accent: {
      pink: '#FF0080',         // Hot pink
      yellow: '#FFBE0B',       // Golden yellow
      brown: '#8B4513',        // Saddle brown
      blue: '#0066FF',         // Bright blue
      indigo: '#4F46E5',       // Indigo
      orange: '#FF6B35',       // Vibrant orange
    },

    // Gradient colors
    gradient: {
      pink: ['#FF0080', '#FF6B9D'],
      yellow: ['#FFBE0B', '#FFD60A'],
      blue: ['#0066FF', '#00A3FF'],
      indigo: ['#4F46E5', '#818CF8'],
      sunset: ['#FF6B35', '#FFBE0B'],
    },

    // Border colors
    border: {
      light: '#F0F0F0',
      default: '#E5E5E5',
      dark: '#D4D4D4',
    },

    // Status colors
    status: {
      success: '#10B981',
      warning: '#FFBE0B',
      error: '#EF4444',
      info: '#0066FF',
    },

    // Surface colors with subtle tints
    surface: {
      pink: '#FFF5F9',
      yellow: '#FFFBEB',
      blue: '#F0F7FF',
      indigo: '#F5F3FF',
      brown: '#FDF8F6',
    },
  },

  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      semibold: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
      '6xl': 60,
    },
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 40,
    '3xl': 48,
    '4xl': 64,
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
  },

  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 5,
    },
    xl: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 24,
      elevation: 8,
    },
  },

  animation: {
    duration: {
      fast: 200,
      normal: 300,
      slow: 500,
    },
    easing: {
      default: 'ease-in-out',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};

export type FramerTheme = typeof FRAMER_THEME;
