/**
 * KASETA UI - Skeleton Component
 * Loading placeholder with pulse animation
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, DarkColors } from '@/constants/Colors';
import { BorderRadius, Spacing, Layout } from '@/constants/Spacing';
import { SkeletonConfig } from '@/constants/Animations';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded';

export interface SkeletonProps {
  /**
   * Width of the skeleton
   * @default '100%'
   */
  width?: number | string;

  /**
   * Height of the skeleton
   * @default 16
   */
  height?: number;

  /**
   * Skeleton variant (determines border radius)
   * @default 'rounded'
   */
  variant?: SkeletonVariant;

  /**
   * Whether to animate the skeleton
   * @default true
   */
  animate?: boolean;

  /**
   * Custom style overrides
   */
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 16,
  variant = 'rounded',
  animate = true,
  style,
}: SkeletonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Higher opacity for better dark mode visibility
  const opacity = useSharedValue(isDark ? 0.7 : 0.4);

  useEffect(() => {
    if (animate) {
      opacity.value = withRepeat(
        withTiming(isDark ? 1 : 0.8, {
          duration: SkeletonConfig.duration / 2,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    }
  }, [animate, opacity, isDark]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Get border radius based on variant
  const getBorderRadius = (): number => {
    switch (variant) {
      case 'text':
        return BorderRadius.sm;
      case 'circular':
        return typeof height === 'number' ? height / 2 : BorderRadius.full;
      case 'rectangular':
        return 0;
      default:
        return BorderRadius.md;
    }
  };

  const backgroundColor = isDark
    ? SkeletonConfig.gradientColorsDark[1]
    : SkeletonConfig.gradientColors[1];

  const dimensionStyle: ViewStyle = {
    width: typeof width === 'number' ? width : undefined,
    height,
    borderRadius: getBorderRadius(),
    backgroundColor,
  };

  return (
    <Animated.View
      style={[
        styles.container,
        dimensionStyle,
        typeof width === 'string' && { width: width as any },
        animate && animatedStyle,
        style,
      ]}
    />
  );
}

/**
 * Pre-built skeleton for text lines
 */
export function SkeletonText({
  lines = 3,
  lastLineWidth = '60%',
  spacing = Spacing.sm,
  style,
}: {
  lines?: number;
  lastLineWidth?: number | string;
  spacing?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={style}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={14}
          variant="text"
          style={{ marginBottom: index < lines - 1 ? spacing : 0 }}
        />
      ))}
    </View>
  );
}

/**
 * Pre-built skeleton for avatar
 */
export function SkeletonAvatar({
  size = Layout.avatarSizeMd,
  style,
}: {
  size?: number;
  style?: ViewStyle;
}) {
  return (
    <Skeleton
      width={size}
      height={size}
      variant="circular"
      style={style}
    />
  );
}

/**
 * Pre-built skeleton for a card
 */
export function SkeletonCard({ style }: { style?: ViewStyle }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: isDark ? colors.surface : colors.background },
        style,
      ]}
    >
      <View style={styles.cardHeader}>
        <SkeletonAvatar size={40} />
        <View style={styles.cardHeaderText}>
          <Skeleton width={120} height={16} variant="text" />
          <Skeleton
            width={80}
            height={12}
            variant="text"
            style={{ marginTop: Spacing.xs }}
          />
        </View>
      </View>
      <SkeletonText
        lines={2}
        lastLineWidth="80%"
        style={{ marginTop: Spacing.md }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: Spacing.smd,
  },
});

export default Skeleton;
