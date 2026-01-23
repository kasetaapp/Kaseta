/**
 * KASETA UI - IconButton Component
 * Icon-only button with haptic feedback
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  PressableProps,
  StyleSheet,
  ViewStyle,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, DarkColors } from '@/constants/Colors';
import { BorderRadius, Layout, HitSlop } from '@/constants/Spacing';
import { SpringConfig, ScaleValues } from '@/constants/Animations';
import { useColorScheme } from '@/hooks/use-color-scheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type IconButtonVariant = 'default' | 'filled' | 'tonal' | 'outlined';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends Omit<PressableProps, 'style'> {
  /**
   * Icon component to render
   */
  icon: React.ReactNode;

  /**
   * Button variant
   * @default 'default'
   */
  variant?: IconButtonVariant;

  /**
   * Button size
   * @default 'md'
   */
  size?: IconButtonSize;

  /**
   * Icon color override
   */
  iconColor?: string;

  /**
   * Whether the button is in an active/selected state
   * @default false
   */
  active?: boolean;

  /**
   * Custom style overrides
   */
  style?: ViewStyle;

  /**
   * Accessibility label for screen readers
   */
  accessibilityLabel?: string;
}

export function IconButton({
  icon,
  variant = 'default',
  size = 'md',
  iconColor,
  active = false,
  disabled,
  onPressIn,
  onPressOut,
  onPress,
  style,
  accessibilityLabel,
  ...props
}: IconButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(
    (e: any) => {
      if (!disabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        scale.value = withSpring(ScaleValues.pressed, SpringConfig.press);
      }
      onPressIn?.(e);
    },
    [disabled, onPressIn, scale]
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
      if (!disabled) {
        onPress?.(e);
      }
    },
    [disabled, onPress]
  );

  // Get size value
  const getSize = (): number => {
    switch (size) {
      case 'sm':
        return Layout.iconButtonSizeSm;
      case 'lg':
        return 52;
      default:
        return Layout.iconButtonSize;
    }
  };

  // Get variant styles
  const getVariantStyles = (): ViewStyle => {
    const isDisabled = disabled;

    switch (variant) {
      case 'filled':
        return {
          backgroundColor: isDisabled
            ? colors.surface
            : active
            ? colors.accent
            : colors.primary,
        };
      case 'tonal':
        return {
          backgroundColor: isDisabled
            ? colors.surface
            : active
            ? colors.accent + '20'
            : colors.surface,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: isDisabled
            ? colors.border
            : active
            ? colors.accent
            : colors.border,
        };
      default:
        return {
          backgroundColor: 'transparent',
        };
    }
  };

  // Get icon color
  const getIconColor = (): string => {
    if (iconColor) return iconColor;
    if (disabled) return colors.textMuted;

    switch (variant) {
      case 'filled':
        return active ? colors.textOnAccent : colors.white;
      case 'tonal':
        return active ? colors.accent : colors.text;
      case 'outlined':
        return active ? colors.accent : colors.text;
      default:
        return active ? colors.accent : colors.text;
    }
  };

  const sizeValue = getSize();

  return (
    <AnimatedPressable
      {...props}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled, selected: active }}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      hitSlop={HitSlop.default}
      style={[
        styles.base,
        {
          width: sizeValue,
          height: sizeValue,
          borderRadius: sizeValue / 2,
        },
        getVariantStyles(),
        animatedStyle,
        style,
      ]}
    >
      {React.isValidElement(icon)
        ? React.cloneElement(icon as React.ReactElement<any>, {
            color: getIconColor(),
            size: size === 'sm' ? 18 : size === 'lg' ? 26 : 22,
          })
        : icon}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default IconButton;
