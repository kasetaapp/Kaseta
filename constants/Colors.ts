/**
 * KASETA Design System - Colors
 * Tier S Quality Color Palette
 * Based on Zinc + Yellow Accent scheme
 */

export const Colors = {
  // Core
  primary: '#18181B',      // zinc-900 - Primary black
  accent: '#FACC15',       // yellow-400 - Electric yellow (CTAs, badges, highlights)

  // Grays
  secondary: '#A1A1AA',    // zinc-400
  muted: '#71717A',        // zinc-500
  subtle: '#D4D4D8',       // zinc-300

  // Backgrounds
  background: '#FFFFFF',   // Pure white
  surface: '#F4F4F5',      // zinc-100 - Cards, inputs
  surfaceHover: '#E4E4E7', // zinc-200

  // Text
  text: '#18181B',         // zinc-900
  textSecondary: '#52525B', // zinc-600
  textMuted: '#A1A1AA',    // zinc-400
  textOnAccent: '#18181B', // Black on yellow

  // Borders
  border: '#E4E4E7',       // zinc-200
  borderFocus: '#A1A1AA',  // zinc-400

  // Semantic - Success
  success: '#22C55E',      // green-500
  successBg: '#F0FDF4',    // green-50
  successBorder: '#86EFAC', // green-300

  // Semantic - Error
  error: '#EF4444',        // red-500
  errorBg: '#FEF2F2',      // red-50
  errorBorder: '#FCA5A5',  // red-300

  // Semantic - Warning
  warning: '#F59E0B',      // amber-500
  warningBg: '#FFFBEB',    // amber-50
  warningBorder: '#FCD34D', // amber-300

  // Semantic - Info
  info: '#3B82F6',         // blue-500
  infoBg: '#EFF6FF',       // blue-50
  infoBorder: '#93C5FD',   // blue-300

  // Transparent overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',

  // White (for icons on dark backgrounds)
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const DarkColors = {
  // Core
  primary: '#FAFAFA',      // zinc-50 - Primary text in dark
  accent: '#FACC15',       // yellow-400 - Same accent

  // Grays
  secondary: '#A1A1AA',    // zinc-400
  muted: '#71717A',        // zinc-500
  subtle: '#52525B',       // zinc-600

  // Backgrounds
  background: '#09090B',   // zinc-950
  surface: '#18181B',      // zinc-900 - Cards, inputs
  surfaceHover: '#27272A', // zinc-800

  // Text
  text: '#FAFAFA',         // zinc-50
  textSecondary: '#A1A1AA', // zinc-400
  textMuted: '#71717A',    // zinc-500
  textOnAccent: '#18181B', // Black on yellow

  // Borders
  border: '#27272A',       // zinc-800
  borderFocus: '#52525B',  // zinc-600

  // Semantic - Success
  success: '#22C55E',      // green-500
  successBg: '#052E16',    // green-950
  successBorder: '#166534', // green-800

  // Semantic - Error
  error: '#EF4444',        // red-500
  errorBg: '#450A0A',      // red-950
  errorBorder: '#991B1B',  // red-800

  // Semantic - Warning
  warning: '#F59E0B',      // amber-500
  warningBg: '#451A03',    // amber-950
  warningBorder: '#92400E', // amber-800

  // Semantic - Info
  info: '#3B82F6',         // blue-500
  infoBg: '#172554',       // blue-950
  infoBorder: '#1E40AF',   // blue-800

  // Transparent overlays
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',

  // White (for icons on dark backgrounds)
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ColorScheme = typeof Colors | typeof DarkColors;
export type LightColors = typeof Colors;
export type DarkColorScheme = typeof DarkColors;

/**
 * Get colors based on theme
 */
export const getColors = (isDark: boolean) => {
  return isDark ? DarkColors : Colors;
};
