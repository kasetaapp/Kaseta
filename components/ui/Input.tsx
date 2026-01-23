/**
 * KASETA UI - Input Component
 * Text input with label, error states, and focus animations
 */

import React, { useState, useCallback, forwardRef } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  ViewStyle,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, DarkColors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius, Layout } from '@/constants/Spacing';
import { TimingConfig } from '@/constants/Animations';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Text } from './Text';

const AnimatedView = Animated.createAnimatedComponent(View);

export interface InputProps extends Omit<TextInputProps, 'style'> {
  /**
   * Input label
   */
  label?: string;

  /**
   * Helper text shown below the input
   */
  helperText?: string;

  /**
   * Error message (replaces helperText when present)
   */
  error?: string;

  /**
   * Left icon/element
   */
  leftElement?: React.ReactNode;

  /**
   * Right icon/element
   */
  rightElement?: React.ReactNode;

  /**
   * Whether the input is disabled
   */
  disabled?: boolean;

  /**
   * Container style
   */
  containerStyle?: ViewStyle;

  /**
   * Input wrapper style
   */
  inputContainerStyle?: ViewStyle;

  /**
   * Style prop (alias for inputContainerStyle)
   */
  style?: ViewStyle;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftElement,
      rightElement,
      disabled,
      containerStyle,
      inputContainerStyle,
      style,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = isDark ? DarkColors : Colors;

    const [isFocused, setIsFocused] = useState(false);
    const focusProgress = useSharedValue(0);

    const handleFocus = useCallback(
      (e: any) => {
        setIsFocused(true);
        focusProgress.value = withTiming(1, TimingConfig.fast);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onFocus?.(e);
      },
      [onFocus, focusProgress]
    );

    const handleBlur = useCallback(
      (e: any) => {
        setIsFocused(false);
        focusProgress.value = withTiming(0, TimingConfig.fast);
        onBlur?.(e);
      },
      [onBlur, focusProgress]
    );

    const animatedBorderStyle = useAnimatedStyle(() => {
      const borderColor = error
        ? colors.error
        : interpolateColor(
            focusProgress.value,
            [0, 1],
            [colors.border, colors.primary]
          );

      return {
        borderColor,
        borderWidth: focusProgress.value > 0 || error ? 2 : 1,
      };
    });

    const hasError = !!error;
    const showHelperText = helperText || error;

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text
            variant="label"
            color={hasError ? 'error' : 'default'}
            style={styles.label}
          >
            {label}
          </Text>
        )}

        <AnimatedView
          style={[
            styles.inputContainer,
            {
              backgroundColor: disabled ? colors.surfaceHover : colors.surface,
            },
            inputContainerStyle,
            style,
            animatedBorderStyle,
          ]}
        >
          {leftElement && <View style={styles.leftElement}>{leftElement}</View>}

          <TextInput
            ref={ref}
            {...props}
            editable={!disabled}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={[
              styles.input,
              Typography.body,
              {
                color: disabled ? colors.textMuted : colors.text,
              },
              leftElement ? styles.inputWithLeftElement : undefined,
              rightElement ? styles.inputWithRightElement : undefined,
            ]}
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.accent}
          />

          {rightElement && (
            <View style={styles.rightElement}>{rightElement}</View>
          )}
        </AnimatedView>

        {showHelperText && (
          <Text
            variant="caption"
            color={hasError ? 'error' : 'muted'}
            style={styles.helperText}
          >
            {error || helperText}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Layout.inputHeight,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: Spacing.smd,
  },
  inputWithLeftElement: {
    paddingLeft: Spacing.sm,
  },
  inputWithRightElement: {
    paddingRight: Spacing.sm,
  },
  leftElement: {
    marginRight: Spacing.xs,
  },
  rightElement: {
    marginLeft: Spacing.xs,
  },
  helperText: {
    marginTop: Spacing.xs,
    marginLeft: Spacing.xxs,
  },
});

export default Input;
