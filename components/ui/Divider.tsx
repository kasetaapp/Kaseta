/**
 * KASETA UI - Divider Component
 * Subtle separator for content sections
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Text } from './Text';

export type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerProps {
  /**
   * Orientation of the divider
   * @default 'horizontal'
   */
  orientation?: DividerOrientation;

  /**
   * Optional label to display in the middle
   */
  label?: string;

  /**
   * Margin around the divider
   * @default Spacing.md for horizontal, Spacing.sm for vertical
   */
  spacing?: number;

  /**
   * Whether to use a subtle/lighter color
   * @default false
   */
  subtle?: boolean;

  /**
   * Custom style overrides
   */
  style?: ViewStyle;
}

export function Divider({
  orientation = 'horizontal',
  label,
  spacing,
  subtle = false,
  style,
}: DividerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const isHorizontal = orientation === 'horizontal';
  const dividerColor = subtle
    ? isDark
      ? colors.surface
      : colors.surfaceHover
    : colors.border;

  const marginValue = spacing ?? (isHorizontal ? Spacing.md : Spacing.sm);

  if (label && isHorizontal) {
    return (
      <View
        style={[
          styles.labelContainer,
          { marginVertical: marginValue },
          style,
        ]}
      >
        <View
          style={[
            styles.horizontalLine,
            { backgroundColor: dividerColor },
          ]}
        />
        <Text variant="caption" color="muted" style={styles.label}>
          {label}
        </Text>
        <View
          style={[
            styles.horizontalLine,
            { backgroundColor: dividerColor },
          ]}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        isHorizontal ? styles.horizontal : styles.vertical,
        { backgroundColor: dividerColor },
        isHorizontal
          ? { marginVertical: marginValue }
          : { marginHorizontal: marginValue },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    width: '100%',
  },
  vertical: {
    width: 1,
    height: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  horizontalLine: {
    flex: 1,
    height: 1,
  },
  label: {
    marginHorizontal: Spacing.md,
  },
});

export default Divider;
