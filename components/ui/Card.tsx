/**
 * KASETA UI - Card Component
 * Container with shadows, hover state, and optional pressable behavior
 */

import React, { useCallback } from 'react';
import {
  View,
  Pressable,
  PressableProps,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius, HitSlop } from '@/constants/Spacing';
import { Shadows } from '@/constants/Shadows';
import { SpringConfig, ScaleValues } from '@/constants/Animations';
import { useColorScheme } from '@/hooks/use-color-scheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type CardVariant = 'elevated' | 'outlined' | 'filled';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends Omit<PressableProps, 'style'> {
  /**
   * Card content
   */
  children: React.ReactNode;

  /**
   * Card variant
   * @default 'elevated'
   */
  variant?: CardVariant;

  /**
   * Card padding
   * @default 'md'
   */
  padding?: CardPadding;

  /**
   * Whether the card is pressable
   * @default false
   */
  pressable?: boolean;

  /**
   * Custom style overrides
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Accessibility label for pressable cards
   */
  accessibilityLabel?: string;
}

export function Card({
  children,
  variant = 'elevated',
  padding = 'md',
  pressable = false,
  onPressIn,
  onPressOut,
  onPress,
  style,
  accessibilityLabel,
  ...props
}: CardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(
    (e: any) => {
      if (pressable) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        scale.value = withSpring(ScaleValues.active, SpringConfig.press);
      }
      onPressIn?.(e);
    },
    [pressable, onPressIn, scale]
  );

  const handlePressOut = useCallback(
    (e: any) => {
      if (pressable) {
        scale.value = withSpring(ScaleValues.default, SpringConfig.press);
      }
      onPressOut?.(e);
    },
    [pressable, onPressOut, scale]
  );

  // Get variant styles
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: isDark ? colors.surface : colors.background,
          ...Shadows.md,
        };
      case 'outlined':
        return {
          backgroundColor: isDark ? colors.surface : colors.background,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'filled':
        return {
          backgroundColor: colors.surface,
        };
      default:
        return {
          backgroundColor: colors.background,
        };
    }
  };

  // Get padding styles
  const getPaddingStyles = (): ViewStyle => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'sm':
        return { padding: Spacing.sm };
      case 'lg':
        return { padding: Spacing.lg };
      default:
        return { padding: Spacing.md };
    }
  };

  const cardStyles = [
    styles.base,
    getVariantStyles(),
    getPaddingStyles(),
    style,
  ];

  if (pressable || onPress) {
    return (
      <AnimatedPressable
        {...props}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={HitSlop.default}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={[cardStyles, animatedStyle]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return <View style={cardStyles}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
});

export default Card;
