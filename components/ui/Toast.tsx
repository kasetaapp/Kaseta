/**
 * KASETA - Toast Component
 * Premium notification toasts with animations and haptics
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Shadows, DarkShadows } from '@/constants/Shadows';
import { Text } from './Text';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  message: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface Toast extends ToastConfig {
  id: string;
}

interface ToastContextValue {
  show: (config: ToastConfig) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TOAST_DURATION = 4000;

function ToastItem({
  toast,
  onDismiss,
  index,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
  index: number;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;
  const shadows = isDark ? DarkShadows : Shadows;
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const progress = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    // Haptic feedback based on variant
    if (toast.variant === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (toast.variant === 'error') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else if (toast.variant === 'warning') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Enter animation
    translateY.value = withSpring(0);
    opacity.value = withTiming(1);
    scale.value = withSpring(1);

    // Progress bar animation
    const duration = toast.duration || TOAST_DURATION;
    progress.value = withTiming(1, { duration }, (finished) => {
      if (finished) {
        runOnJS(onDismiss)(toast.id);
      }
    });
  }, []);

  const handleDismiss = useCallback(() => {
    translateY.value = withSpring(-100);
    opacity.value = withTiming(0, { duration: 200 });
    scale.value = withTiming(0.9, { duration: 200 }, () => {
      runOnJS(onDismiss)(toast.id);
    });
  }, [toast.id, onDismiss]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value - index * 10 },
      { scale: interpolate(index, [0, 1, 2], [1, 0.95, 0.9], Extrapolate.CLAMP) },
    ],
    opacity: opacity.value,
    zIndex: 100 - index,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const getVariantColors = () => {
    switch (toast.variant) {
      case 'success':
        return { bg: colors.successBg, icon: colors.success, border: colors.success };
      case 'error':
        return { bg: colors.errorBg, icon: colors.error, border: colors.error };
      case 'warning':
        return { bg: colors.warningBg, icon: colors.warning, border: colors.warning };
      case 'info':
      default:
        return { bg: colors.infoBg, icon: colors.info, border: colors.info };
    }
  };

  const variantColors = getVariantColors();

  const IconComponent = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  }[toast.variant || 'info'];

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          top: insets.top + Spacing.md,
          backgroundColor: isDark ? colors.surface : variantColors.bg,
          borderColor: variantColors.border,
        },
        shadows.lg,
        animatedStyle,
      ]}
    >
      <View style={styles.toastContent}>
        <View style={[styles.iconWrapper, { backgroundColor: variantColors.bg }]}>
          <IconComponent size={20} color={variantColors.icon} />
        </View>

        <View style={styles.textContainer}>
          <Text variant="bodyMedium" numberOfLines={2}>
            {toast.message}
          </Text>
          {toast.description && (
            <Text variant="bodySm" color="secondary" numberOfLines={2}>
              {toast.description}
            </Text>
          )}
        </View>

        {toast.action && (
          <Pressable
            onPress={() => {
              toast.action?.onPress();
              handleDismiss();
            }}
            style={styles.actionButton}
          >
            <Text variant="bodySm" customColor={variantColors.icon}>
              {toast.action.label}
            </Text>
          </Pressable>
        )}

        <Pressable onPress={handleDismiss} style={styles.closeButton}>
          <X size={16} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            { backgroundColor: variantColors.icon },
            progressStyle,
          ]}
        />
      </View>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idCounter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const show = useCallback((config: ToastConfig) => {
    const id = `toast-${idCounter.current++}`;
    const newToast: Toast = {
      ...config,
      id,
      variant: config.variant || 'info',
      duration: config.duration || TOAST_DURATION,
    };

    setToasts((prev) => [newToast, ...prev].slice(0, 3)); // Max 3 toasts
  }, []);

  const success = useCallback(
    (message: string, description?: string) => {
      show({ message, description, variant: 'success' });
    },
    [show]
  );

  const error = useCallback(
    (message: string, description?: string) => {
      show({ message, description, variant: 'error' });
    },
    [show]
  );

  const warning = useCallback(
    (message: string, description?: string) => {
      show({ message, description, variant: 'warning' });
    },
    [show]
  );

  const info = useCallback(
    (message: string, description?: string) => {
      show({ message, description, variant: 'info' });
    },
    [show]
  );

  return (
    <ToastContext.Provider
      value={{ show, success, error, warning, info, dismiss, dismissAll }}
    >
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((toast, index) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={dismiss}
            index={index}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    pointerEvents: 'box-none',
  },
  toast: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.smd,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  actionButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  closeButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  progressBar: {
    height: '100%',
  },
});

export default ToastProvider;
