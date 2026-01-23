/**
 * KASETA Design System - Spacing
 * 8pt Grid System
 */

/**
 * Base spacing unit (8px)
 */
const BASE = 8;

/**
 * Spacing scale based on 8pt grid
 */
export const Spacing = {
  /** 2px - Minimal spacing */
  xxs: BASE * 0.25,  // 2
  /** 4px - Extra small spacing */
  xs: BASE * 0.5,    // 4
  /** 8px - Small spacing */
  sm: BASE,          // 8
  /** 12px - Between small and medium */
  smd: BASE * 1.5,   // 12
  /** 16px - Medium spacing (default) */
  md: BASE * 2,      // 16
  /** 20px - Between medium and large */
  mdl: BASE * 2.5,   // 20
  /** 24px - Large spacing */
  lg: BASE * 3,      // 24
  /** 32px - Extra large spacing */
  xl: BASE * 4,      // 32
  /** 40px - 2x Extra large */
  xxl: BASE * 5,     // 40
  /** 48px - 3x Extra large */
  xxxl: BASE * 6,    // 48
  /** 64px - 4x Extra large */
  xxxxl: BASE * 8,   // 64
} as const;

/**
 * Border radius scale
 */
export const BorderRadius = {
  /** 4px - Subtle rounding */
  xs: 4,
  /** 6px - Small rounding */
  sm: 6,
  /** 8px - Default rounding */
  md: 8,
  /** 12px - Medium rounding */
  lg: 12,
  /** 16px - Large rounding */
  xl: 16,
  /** 24px - Extra large rounding */
  xxl: 24,
  /** 9999px - Full/pill rounding */
  full: 9999,
} as const;

/**
 * Common layout sizes
 */
export const Layout = {
  /** Screen horizontal padding */
  screenPaddingHorizontal: Spacing.md,
  /** Screen vertical padding */
  screenPaddingVertical: Spacing.lg,
  /** Default card padding */
  cardPadding: Spacing.md,
  /** Default input height */
  inputHeight: 48,
  /** Large input height */
  inputHeightLg: 56,
  /** Default button height */
  buttonHeight: 48,
  /** Small button height */
  buttonHeightSm: 40,
  /** Large button height */
  buttonHeightLg: 56,
  /** Icon button size */
  iconButtonSize: 44,
  /** Small icon button size */
  iconButtonSizeSm: 36,
  /** Tab bar height */
  tabBarHeight: 56,
  /** Header height */
  headerHeight: 56,
  /** Avatar size small */
  avatarSizeSm: 32,
  /** Avatar size default */
  avatarSizeMd: 40,
  /** Avatar size large */
  avatarSizeLg: 56,
  /** Avatar size extra large */
  avatarSizeXl: 80,
  /** Maximum content width (for tablets) */
  maxContentWidth: 560,
} as const;

/**
 * Hit slop for touchable elements (accessibility)
 */
export const HitSlop = {
  default: { top: 8, right: 8, bottom: 8, left: 8 },
  large: { top: 12, right: 12, bottom: 12, left: 12 },
} as const;

export type SpacingKey = keyof typeof Spacing;
export type BorderRadiusKey = keyof typeof BorderRadius;
