/**
 * KASETA Design System - Typography
 * Tier S Quality Typographic Scale
 */

import { Platform, TextStyle } from 'react-native';

/**
 * Font families based on platform
 */
export const FontFamily = {
  sans: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
} as const;

/**
 * Font weights
 */
export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

/**
 * Typography scale with clear hierarchy
 */
export const Typography = {
  // Display - For hero sections
  displayLg: {
    fontSize: 40,
    fontWeight: FontWeight.bold,
    letterSpacing: -1,
    lineHeight: 48,
  } as TextStyle,
  display: {
    fontSize: 36,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.75,
    lineHeight: 44,
  } as TextStyle,

  // Headings
  h1: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
    lineHeight: 40,
  } as TextStyle,
  h2: {
    fontSize: 24,
    fontWeight: FontWeight.semibold,
    letterSpacing: -0.3,
    lineHeight: 32,
  } as TextStyle,
  h3: {
    fontSize: 20,
    fontWeight: FontWeight.semibold,
    letterSpacing: -0.2,
    lineHeight: 28,
  } as TextStyle,
  h4: {
    fontSize: 18,
    fontWeight: FontWeight.semibold,
    letterSpacing: -0.1,
    lineHeight: 24,
  } as TextStyle,

  // Body text
  bodyLg: {
    fontSize: 18,
    fontWeight: FontWeight.regular,
    lineHeight: 28,
    letterSpacing: 0,
  } as TextStyle,
  body: {
    fontSize: 16,
    fontWeight: FontWeight.regular,
    lineHeight: 24,
    letterSpacing: 0,
  } as TextStyle,
  bodyMedium: {
    fontSize: 16,
    fontWeight: FontWeight.medium,
    lineHeight: 24,
    letterSpacing: 0,
  } as TextStyle,
  bodySm: {
    fontSize: 14,
    fontWeight: FontWeight.regular,
    lineHeight: 20,
    letterSpacing: 0,
  } as TextStyle,
  bodySmMedium: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
    lineHeight: 20,
    letterSpacing: 0,
  } as TextStyle,

  // UI Elements
  label: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.1,
    lineHeight: 20,
  } as TextStyle,
  labelSm: {
    fontSize: 12,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.1,
    lineHeight: 16,
  } as TextStyle,
  button: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.2,
    lineHeight: 24,
  } as TextStyle,
  buttonSm: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.2,
    lineHeight: 20,
  } as TextStyle,

  // Captions and small text
  caption: {
    fontSize: 12,
    fontWeight: FontWeight.regular,
    lineHeight: 16,
    letterSpacing: 0.1,
  } as TextStyle,
  captionMedium: {
    fontSize: 12,
    fontWeight: FontWeight.medium,
    lineHeight: 16,
    letterSpacing: 0.1,
  } as TextStyle,
  overline: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.5,
    lineHeight: 16,
    textTransform: 'uppercase',
  } as TextStyle,

  // Monospace (for codes, QR values, etc)
  mono: {
    fontFamily: FontFamily.mono,
    fontSize: 14,
    fontWeight: FontWeight.regular,
    lineHeight: 20,
    letterSpacing: 0,
  } as TextStyle,
  monoLg: {
    fontFamily: FontFamily.mono,
    fontSize: 18,
    fontWeight: FontWeight.medium,
    lineHeight: 24,
    letterSpacing: 1,
  } as TextStyle,
  monoXl: {
    fontFamily: FontFamily.mono,
    fontSize: 24,
    fontWeight: FontWeight.bold,
    lineHeight: 32,
    letterSpacing: 2,
  } as TextStyle,
} as const;

export type TypographyVariant = keyof typeof Typography;
