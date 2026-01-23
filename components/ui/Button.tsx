/**
 * KASETA UI - Button Component
 * Tier S quality with haptics, animations, and variants
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  PressableProps,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
  AccessibilityRole,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, DarkColors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius, Layout, HitSlop } from '@/constants/Spacing';
import { Shadows } from '@/constants/Shadows';
import { SpringConfig, ScaleValues } from '@/constants/Animations';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Text } from './Text';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  /**
   * Button text
   */
  children: string;

  /**
   * Button variant
   * @default 'primary'
   */
  variant?: ButtonVariant;

  /**
   * Button size
   * @default 'md'
   */
  size?: ButtonSize;

  /**
   * Whether the button is in a loading state
   * @default false
   */
  loading?: boolean;

  /**
   * Icon component to render on the left
   */
  leftIcon?: React.ReactNode;

  /**
   * Icon component to render on the right
   */
  rightIcon?: React.ReactNode;

  /**
   * Whether the button takes full width
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Custom style overrides
   */
  style?: ViewStyle;

  /**
   * Accessibility label for screen readers
   */
  accessibilityLabel?: string;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  onPressIn,
  onPressOut,
  onPress,
  style,
  accessibilityLabel,
  ...props
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(
    (e: any) => {
      if (!disabled && !loading) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        scale.value = withSpring(ScaleValues.pressed, SpringConfig.press);
      }
      onPressIn?.(e);
    },
    [disabled, loading, onPressIn, scale]
  );

  const handlePressOut = useCallback(
    (e: any) => {
      scale.value = withSpring(ScaleValues.default, SpringConfig.press);
      onPressOut?.(e);
    },
    [onPressOut, scale]
  );

  const handlePress = useCallback(
    (e: any) => {
      if (!disabled && !loading) {
        onPress?.(e);
      }
    },
    [disabled, loading, onPress]
  );

  // Get variant styles
  const getVariantStyles = (): {
    container: ViewStyle;
    textColor: string;
    loadingColor: string;
  } => {
    const isDisabled = disabled || loading;

    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: isDisabled ? colors.subtle : colors.accent,
            ...Shadows.sm,
          },
          textColor: isDisabled ? colors.textMuted : colors.textOnAccent,
          loadingColor: colors.textOnAccent,
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: isDisabled
              ? colors.surface
              : isDark
              ? colors.surfaceHover
              : colors.surface,
            borderWidth: 1,
            borderColor: isDisabled ? colors.border : colors.borderFocus,
          },
          textColor: isDisabled ? colors.textMuted : colors.text,
          loadingColor: colors.text,
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          textColor: isDisabled ? colors.textMuted : colors.text,
          loadingColor: colors.text,
        };
      case 'destructive':
        return {
          container: {
            backgroundColor: isDisabled ? colors.errorBg : colors.error,
            ...Shadows.sm,
          },
          textColor: isDisabled ? colors.error : colors.white,
          loadingColor: colors.white,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: isDisabled ? colors.border : colors.primary,
          },
          textColor: isDisabled ? colors.textMuted : colors.primary,
          loadingColor: colors.primary,
        };
      default:
        return {
          container: {
            backgroundColor: colors.accent,
          },
          textColor: colors.textOnAccent,
          loadingColor: colors.textOnAccent,
        };
    }
  };

  // Get size styles
  const getSizeStyles = (): {
    container: ViewStyle;
    textVariant: 'button' | 'buttonSm';
    iconSize: number;
  } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            height: Layout.buttonHeightSm,
            paddingHorizontal: Spacing.md,
            gap: Spacing.xs,
          },
          textVariant: 'buttonSm',
          iconSize: 16,
        };
      case 'lg':
        return {
          container: {
            height: Layout.buttonHeightLg,
            paddingHorizontal: Spacing.xl,
            gap: Spacing.sm,
          },
          textVariant: 'button',
          iconSize: 24,
        };
      default:
        return {
          container: {
            height: Layout.buttonHeight,
            paddingHorizontal: Spacing.lg,
            gap: Spacing.sm,
          },
          textVariant: 'button',
          iconSize: 20,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <AnimatedPressable
      {...props}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || children}
      accessibilityState={{ disabled: disabled || loading }}
      hitSlop={HitSlop.default}
      disabled={disabled || loading}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[
        styles.base,
        variantStyles.container,
        sizeStyles.container,
        fullWidth && styles.fullWidth,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyles.loadingColor} />
      ) : (
        <>
          {leftIcon}
          <Text
            variant={sizeStyles.textVariant}
            customColor={variantStyles.textColor}
            style={styles.text}
          >
            {children}
          </Text>
          {rightIcon}
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    textAlign: 'center',
  },
});

export default Button;
