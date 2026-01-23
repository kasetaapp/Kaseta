/**
 * KASETA Design System - Animations
 * Tier S Quality Animation Configurations
 * Using react-native-reanimated
 */

import { Easing } from 'react-native-reanimated';

/**
 * Spring configurations for different use cases
 */
export const SpringConfig = {
  /** Default spring - balanced feel */
  default: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },

  /** Gentle spring - subtle movements */
  gentle: {
    damping: 20,
    stiffness: 120,
    mass: 1,
  },

  /** Bouncy spring - playful interactions */
  bouncy: {
    damping: 10,
    stiffness: 180,
    mass: 0.8,
  },

  /** Snappy spring - quick response */
  snappy: {
    damping: 20,
    stiffness: 300,
    mass: 0.8,
  },

  /** Stiff spring - minimal overshoot */
  stiff: {
    damping: 25,
    stiffness: 400,
    mass: 1,
  },

  /** Press spring - for button presses */
  press: {
    damping: 15,
    stiffness: 400,
    mass: 0.5,
  },
} as const;

/**
 * Timing configurations
 */
export const TimingConfig = {
  /** Fast timing - 150ms */
  fast: {
    duration: 150,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },

  /** Default timing - 200ms */
  default: {
    duration: 200,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },

  /** Medium timing - 300ms */
  medium: {
    duration: 300,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },

  /** Slow timing - 400ms */
  slow: {
    duration: 400,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },

  /** Enter timing - 250ms ease-out */
  enter: {
    duration: 250,
    easing: Easing.out(Easing.cubic),
  },

  /** Exit timing - 200ms ease-in */
  exit: {
    duration: 200,
    easing: Easing.in(Easing.cubic),
  },
} as const;

/**
 * Common animation durations in milliseconds
 */
export const Duration = {
  instant: 0,
  fast: 150,
  default: 200,
  medium: 300,
  slow: 400,
  slower: 500,
  slowest: 600,
} as const;

/**
 * Easing presets
 */
export const EasingPreset = {
  /** Standard ease-out for most animations */
  default: Easing.bezier(0.25, 0.1, 0.25, 1),

  /** Ease out - decelerating */
  easeOut: Easing.out(Easing.cubic),

  /** Ease in - accelerating */
  easeIn: Easing.in(Easing.cubic),

  /** Ease in-out - symmetric */
  easeInOut: Easing.inOut(Easing.cubic),

  /** Bounce effect */
  bounce: Easing.bounce,

  /** Elastic effect */
  elastic: Easing.elastic(1),

  /** Linear - constant speed */
  linear: Easing.linear,
} as const;

/**
 * Scale values for press animations
 */
export const ScaleValues = {
  /** Pressed state scale */
  pressed: 0.97,

  /** Active/highlighted scale */
  active: 0.98,

  /** Hover scale (for desktop) */
  hover: 1.02,

  /** Bounce scale (for playful elements) */
  bounce: 1.05,

  /** Default/resting scale */
  default: 1,
} as const;

/**
 * Haptic feedback intensity presets
 * To be used with expo-haptics
 */
export const HapticPreset = {
  /** Light tap - buttons, toggles */
  light: 'light' as const,

  /** Medium feedback - selections, confirmations */
  medium: 'medium' as const,

  /** Heavy feedback - destructive actions, errors */
  heavy: 'heavy' as const,

  /** Success notification */
  success: 'success' as const,

  /** Warning notification */
  warning: 'warning' as const,

  /** Error notification */
  error: 'error' as const,
} as const;

/**
 * Skeleton animation config
 */
export const SkeletonConfig = {
  /** Duration of one shimmer cycle */
  duration: 1500,

  /** Shimmer gradient locations */
  gradientLocations: [0, 0.5, 1] as const,

  /** Shimmer gradient colors (light mode) */
  gradientColors: ['#F4F4F5', '#E4E4E7', '#F4F4F5'] as [string, string, string],

  /** Shimmer gradient colors (dark mode) */
  gradientColorsDark: ['#27272A', '#3F3F46', '#27272A'] as [string, string, string],
} as const;

/**
 * Page transition configs
 */
export const PageTransition = {
  /** Slide from right */
  slideRight: {
    entering: {
      translateX: { from: '100%', to: 0 },
      opacity: { from: 0.8, to: 1 },
    },
    exiting: {
      translateX: { from: 0, to: '-30%' },
      opacity: { from: 1, to: 0.8 },
    },
    duration: 300,
  },

  /** Fade */
  fade: {
    entering: {
      opacity: { from: 0, to: 1 },
    },
    exiting: {
      opacity: { from: 1, to: 0 },
    },
    duration: 200,
  },

  /** Scale up (for modals) */
  scaleUp: {
    entering: {
      scale: { from: 0.95, to: 1 },
      opacity: { from: 0, to: 1 },
    },
    exiting: {
      scale: { from: 1, to: 0.95 },
      opacity: { from: 1, to: 0 },
    },
    duration: 250,
  },
} as const;

export type SpringConfigKey = keyof typeof SpringConfig;
export type TimingConfigKey = keyof typeof TimingConfig;

/**
 * Combined animation config for components
 */
export const AnimationConfig = {
  spring: SpringConfig,
  timing: TimingConfig,
  duration: Duration,
  scale: ScaleValues,
} as const;
