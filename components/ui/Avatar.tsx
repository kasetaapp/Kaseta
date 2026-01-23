/**
 * KASETA UI - Avatar Component
 * User avatar with fallback to initials
 */

import React, { useState } from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius, Layout } from '@/constants/Spacing';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Text } from './Text';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  /**
   * Image source URI
   */
  source?: string | null;

  /**
   * Name to generate initials from (fallback)
   */
  name?: string;

  /**
   * Avatar size
   * @default 'md'
   */
  size?: AvatarSize;

  /**
   * Custom background color for initials
   */
  backgroundColor?: string;

  /**
   * Whether to show a border
   * @default false
   */
  bordered?: boolean;

  /**
   * Custom style overrides
   */
  style?: ViewStyle;
}

export function Avatar({
  source,
  name,
  size = 'md',
  backgroundColor,
  bordered = false,
  style,
}: AvatarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const [imageError, setImageError] = useState(false);

  // Get size value
  const getSize = (): number => {
    switch (size) {
      case 'sm':
        return Layout.avatarSizeSm;
      case 'lg':
        return Layout.avatarSizeLg;
      case 'xl':
        return Layout.avatarSizeXl;
      default:
        return Layout.avatarSizeMd;
    }
  };

  // Get font size for initials
  const getFontVariant = () => {
    switch (size) {
      case 'sm':
        return 'captionMedium' as const;
      case 'lg':
        return 'h3' as const;
      case 'xl':
        return 'h1' as const;
      default:
        return 'labelSm' as const;
    }
  };

  // Generate initials from name
  const getInitials = (): string => {
    if (!name) return '?';

    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Generate a consistent color from name
  const getBackgroundColor = (): string => {
    if (backgroundColor) return backgroundColor;

    if (!name) return colors.surface;

    // Simple hash function for consistent colors
    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    const hue = Math.abs(hash % 360);
    const saturation = isDark ? 30 : 50;
    const lightness = isDark ? 30 : 85;

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const sizeValue = getSize();
  const showImage = source && !imageError;

  return (
    <View
      style={[
        styles.base,
        {
          width: sizeValue,
          height: sizeValue,
          borderRadius: sizeValue / 2,
          backgroundColor: showImage ? colors.surface : getBackgroundColor(),
        },
        bordered && {
          borderWidth: 2,
          borderColor: colors.background,
        },
        style,
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: source }}
          style={[
            styles.image,
            {
              width: sizeValue,
              height: sizeValue,
              borderRadius: sizeValue / 2,
            },
          ]}
          onError={() => setImageError(true)}
        />
      ) : (
        <Text
          variant={getFontVariant()}
          customColor={isDark ? colors.text : colors.textSecondary}
        >
          {getInitials()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
});

export default Avatar;
