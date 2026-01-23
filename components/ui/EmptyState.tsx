/**
 * KASETA - EmptyState Component
 * Beautiful empty states for lists and screens
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text } from './Text';
import { Button, ButtonVariant } from './Button';

export interface EmptyStateProps {
  icon?: string | React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionVariant?: ButtonVariant;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  compact?: boolean;
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionVariant = 'primary',
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
  style,
}: EmptyStateProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const renderIcon = () => {
    if (!icon) return null;

    if (typeof icon === 'string') {
      return (
        <View
          style={[
            styles.iconContainer,
            compact && styles.iconContainerCompact,
            { backgroundColor: colors.surface },
          ]}
        >
          <Text variant={compact ? 'display' : 'displayLg'} center>
            {icon}
          </Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.iconContainer,
          compact && styles.iconContainerCompact,
          { backgroundColor: colors.surface },
        ]}
      >
        {icon}
      </View>
    );
  };

  return (
    <Animated.View
      entering={FadeInDown.springify()}
      style={[
        styles.container,
        compact && styles.containerCompact,
        style,
      ]}
    >
      {renderIcon()}

      <Text
        variant={compact ? 'bodyMedium' : 'h3'}
        center
        style={compact ? styles.titleCompact : styles.title}
      >
        {title}
      </Text>

      {description && (
        <Text
          variant={compact ? 'bodySm' : 'body'}
          color="secondary"
          center
          style={compact ? styles.descriptionCompact : styles.description}
        >
          {description}
        </Text>
      )}

      {(actionLabel || secondaryActionLabel) && (
        <View style={[styles.actions, compact && styles.actionsCompact]}>
          {actionLabel && onAction && (
            <Button
              variant={actionVariant}
              onPress={onAction}
              size={compact ? 'sm' : 'md'}
            >
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              variant="ghost"
              onPress={onSecondaryAction}
              size={compact ? 'sm' : 'md'}
            >
              {secondaryActionLabel}
            </Button>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  containerCompact: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconContainerCompact: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: Spacing.md,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  titleCompact: {
    marginBottom: Spacing.xs,
  },
  description: {
    marginBottom: Spacing.lg,
    maxWidth: 280,
  },
  descriptionCompact: {
    marginBottom: Spacing.md,
    maxWidth: 240,
  },
  actions: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionsCompact: {
    gap: Spacing.xs,
  },
});

export default EmptyState;
