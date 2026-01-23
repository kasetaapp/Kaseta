/**
 * KASETA UI - Text Component
 * Typography with variants and theme support
 */

import React from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleSheet,
  TextStyle,
} from 'react-native';
import { Colors, DarkColors } from '@/constants/Colors';
import { Typography, TypographyVariant } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface TextProps extends RNTextProps {
  /**
   * Typography variant
   * @default 'body'
   */
  variant?: TypographyVariant;

  /**
   * Text color
   * @default 'default' (uses text color from theme)
   */
  color?: 'default' | 'secondary' | 'muted' | 'accent' | 'error' | 'success' | 'warning' | 'info';

  /**
   * Whether to center the text
   * @default false
   */
  center?: boolean;

  /**
   * Custom color override
   */
  customColor?: string;
}

export function Text({
  variant = 'body',
  color = 'default',
  center = false,
  customColor,
  style,
  children,
  ...props
}: TextProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const getTextColor = (): string => {
    if (customColor) return customColor;

    switch (color) {
      case 'secondary':
        return colors.textSecondary;
      case 'muted':
        return colors.textMuted;
      case 'accent':
        return colors.accent;
      case 'error':
        return colors.error;
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'info':
        return colors.info;
      default:
        return colors.text;
    }
  };

  const typographyStyle = Typography[variant];

  const textStyle: TextStyle = {
    ...typographyStyle,
    color: getTextColor(),
    ...(center && { textAlign: 'center' }),
  };

  return (
    <RNText style={[textStyle, style]} {...props}>
      {children}
    </RNText>
  );
}

export default Text;
