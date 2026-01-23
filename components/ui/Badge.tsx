/**
 * KASETA UI - Badge Component
 * Status badges with semantic colors
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Text } from './Text';

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'accent';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  /**
   * Badge text
   */
  children: string;

  /**
   * Badge variant (color scheme)
   * @default 'default'
   */
  variant?: BadgeVariant;

  /**
   * Badge size
   * @default 'md'
   */
  size?: BadgeSize;

  /**
   * Icon to show before text
   */
  icon?: React.ReactNode;

  /**
   * Custom style overrides
   */
  style?: ViewStyle;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  icon,
  style,
}: BadgeProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  // Get variant styles
  const getVariantStyles = (): {
    backgroundColor: string;
    borderColor: string;
    textColor: string;
  } => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: colors.successBg,
          borderColor: colors.successBorder,
          textColor: colors.success,
        };
      case 'error':
        return {
          backgroundColor: colors.errorBg,
          borderColor: colors.errorBorder,
          textColor: colors.error,
        };
      case 'warning':
        return {
          backgroundColor: colors.warningBg,
          borderColor: colors.warningBorder,
          textColor: colors.warning,
        };
      case 'info':
        return {
          backgroundColor: colors.infoBg,
          borderColor: colors.infoBorder,
          textColor: colors.info,
        };
      case 'accent':
        return {
          backgroundColor: colors.accent,
          borderColor: colors.accent,
          textColor: colors.textOnAccent,
        };
      default:
        return {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          textColor: colors.textSecondary,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          paddingHorizontal: isSmall ? Spacing.sm : Spacing.smd,
          paddingVertical: isSmall ? Spacing.xxs : Spacing.xs,
        },
        style,
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text
        variant={isSmall ? 'captionMedium' : 'labelSm'}
        customColor={variantStyles.textColor}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  icon: {
    marginRight: Spacing.xs,
  },
});

export default Badge;
