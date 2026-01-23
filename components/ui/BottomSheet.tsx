/**
 * KASETA - BottomSheet Component
 * Premium modal sheet with gesture support
 */

import React, { useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  BackHandler,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { SpringConfig } from '@/constants/Animations';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_TRANSLATE_Y = -SCREEN_HEIGHT + 100;

export interface BottomSheetProps {
  children: React.ReactNode;
  snapPoints?: number[];
  onClose?: () => void;
  showHandle?: boolean;
  backdropOpacity?: number;
}

export interface BottomSheetRef {
  open: () => void;
  close: () => void;
  snapTo: (index: number) => void;
}

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  function BottomSheet(
    {
      children,
      snapPoints = [0.5],
      onClose,
      showHandle = true,
      backdropOpacity = 0.5,
    },
    ref
  ) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = isDark ? DarkColors : Colors;

    const translateY = useSharedValue(SCREEN_HEIGHT);
    const active = useSharedValue(false);
    const context = useSharedValue({ y: 0 });

    const snapPointsY = snapPoints.map(
      (point) => -SCREEN_HEIGHT * point
    );

    const scrollTo = useCallback(
      (destination: number) => {
        'worklet';
        active.value = destination !== SCREEN_HEIGHT;
        translateY.value = withSpring(destination, SpringConfig.default);
      },
      [active, translateY]
    );

    const handleClose = useCallback(() => {
      scrollTo(SCREEN_HEIGHT);
      onClose?.();
    }, [scrollTo, onClose]);

    const open = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scrollTo(snapPointsY[0]);
    }, [scrollTo, snapPointsY]);

    const close = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      handleClose();
    }, [handleClose]);

    const snapTo = useCallback(
      (index: number) => {
        if (index >= 0 && index < snapPointsY.length) {
          scrollTo(snapPointsY[index]);
        }
      },
      [scrollTo, snapPointsY]
    );

    useImperativeHandle(ref, () => ({
      open,
      close,
      snapTo,
    }));

    // Handle back button on Android
    useEffect(() => {
      if (Platform.OS !== 'android') return;

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (active.value) {
            close();
            return true;
          }
          return false;
        }
      );

      return () => subscription.remove();
    }, [active, close]);

    const gesture = Gesture.Pan()
      .onStart(() => {
        context.value = { y: translateY.value };
      })
      .onUpdate((event) => {
        translateY.value = Math.max(
          event.translationY + context.value.y,
          MAX_TRANSLATE_Y
        );
      })
      .onEnd((event) => {
        // Find closest snap point
        const velocity = event.velocityY;
        const currentY = translateY.value;

        // If swiping down fast, close
        if (velocity > 500) {
          runOnJS(handleClose)();
          return;
        }

        // If swiping up fast, go to highest snap point
        if (velocity < -500) {
          scrollTo(snapPointsY[snapPointsY.length - 1]);
          return;
        }

        // Find closest snap point
        let closestPoint = snapPointsY[0];
        let minDistance = Math.abs(currentY - snapPointsY[0]);

        for (const point of snapPointsY) {
          const distance = Math.abs(currentY - point);
          if (distance < minDistance) {
            minDistance = distance;
            closestPoint = point;
          }
        }

        // If below the lowest snap point, close
        if (currentY > snapPointsY[0] * 0.5) {
          runOnJS(handleClose)();
        } else {
          scrollTo(closestPoint);
        }
      });

    const animatedSheetStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));

    const animatedBackdropStyle = useAnimatedStyle(() => ({
      opacity: interpolate(
        translateY.value,
        [SCREEN_HEIGHT, snapPointsY[0]],
        [0, backdropOpacity],
        Extrapolate.CLAMP
      ),
      pointerEvents: active.value ? 'auto' : 'none',
    }));

    return (
      <>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            { backgroundColor: colors.overlay },
            animatedBackdropStyle,
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        </Animated.View>

        {/* Sheet */}
        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[
              styles.sheet,
              { backgroundColor: colors.background },
              animatedSheetStyle,
            ]}
          >
            {showHandle && (
              <View style={styles.handleContainer}>
                <View
                  style={[styles.handle, { backgroundColor: colors.border }]}
                />
              </View>
            )}
            <View style={styles.content}>{children}</View>
          </Animated.View>
        </GestureDetector>
      </>
    );
  }
);

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: SCREEN_HEIGHT,
    height: SCREEN_HEIGHT,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    zIndex: 101,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.smd,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
});

export default BottomSheet;
