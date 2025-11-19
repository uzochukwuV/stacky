import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient as SvgRadialGradient, Stop, Rect } from 'react-native-svg';

interface RadialGradientProps {
  colors: string[];
  style?: ViewStyle;
  cx?: string;
  cy?: string;
  rx?: string;
  ry?: string;
  children?: React.ReactNode;
}

/**
 * RadialGradient Component
 *
 * Provides curved/radial gradients using react-native-svg.
 * Use this instead of LinearGradient for a more modern, Framer-style aesthetic.
 *
 * Usage:
 * ```tsx
 * <RadialGradient
 *   colors={['#FF0080', '#FF6B9D']}
 *   style={styles.container}
 * >
 *   <Text>Content here</Text>
 * </RadialGradient>
 * ```
 */
export function RadialGradient({
  colors,
  style,
  cx = '50%',
  cy = '50%',
  rx = '50%',
  ry = '50%',
  children,
}: RadialGradientProps) {
  return (
    <View style={style}>
      <Svg style={StyleSheet.absoluteFillObject}>
        <Defs>
          <SvgRadialGradient id={`grad-${colors.join('-')}`} cx={cx} cy={cy} rx={rx} ry={ry}>
            {colors.map((color, index) => (
              <Stop
                key={index}
                offset={index / (colors.length - 1)}
                stopColor={color}
                stopOpacity="1"
              />
            ))}
          </SvgRadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#grad-${colors.join('-')})`} />
      </Svg>
      {children}
    </View>
  );
}
