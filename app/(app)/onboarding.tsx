/**
 * KASETA - Onboarding Screen
 * Tutorial for new users
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  ViewToken,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Button } from '@/components/ui';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    icon: '🏠',
    title: 'Bienvenido a KASETA',
    description: 'La mejor forma de gestionar el acceso a tu comunidad. Invita visitantes, controla entradas y mantén tu hogar seguro.',
    color: '#6366F1',
  },
  {
    id: '2',
    icon: '✉️',
    title: 'Invita visitantes fácilmente',
    description: 'Crea invitaciones con código QR o código corto. Compártelas por WhatsApp, mensaje o email.',
    color: '#10B981',
  },
  {
    id: '3',
    icon: '📱',
    title: 'Acceso instantáneo',
    description: 'Los guardias escanean el código QR o ingresan el código. Tú recibes una notificación cuando tu visitante llega.',
    color: '#F59E0B',
  },
  {
    id: '4',
    icon: '🔔',
    title: 'Siempre informado',
    description: 'Recibe alertas de accesos, invitaciones usadas y comunicados importantes de tu comunidad.',
    color: '#EF4444',
  },
  {
    id: '5',
    icon: '🚀',
    title: '¡Listo para comenzar!',
    description: 'Únete a tu organización con el código que te proporcionaron o contacta a tu administrador.',
    color: '#8B5CF6',
  },
];

const ONBOARDING_KEY = '@kaseta_onboarding_completed';

export default function OnboardingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index || 0);
      }
    },
    []
  );

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  }, [currentIndex]);

  const handleSkip = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(app)/(tabs)/home');
  }, []);

  const handleGetStarted = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(app)/organization/join');
  }, []);

  const renderSlide = useCallback(
    ({ item, index }: { item: OnboardingSlide; index: number }) => (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        <View style={styles.slideContent}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: item.color + '20' },
            ]}
          >
            <Text variant="displayLg" style={styles.icon}>
              {item.icon}
            </Text>
          </View>
          <Text variant="h1" center style={styles.title}>
            {item.title}
          </Text>
          <Text
            variant="body"
            color="secondary"
            center
            style={styles.description}
          >
            {item.description}
          </Text>
        </View>
      </View>
    ),
    []
  );

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Skip button */}
      {!isLastSlide && (
        <Animated.View entering={FadeIn.delay(500)} style={styles.skipContainer}>
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text variant="body" color="muted">
              Omitir
            </Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        onScroll={(e) => {
          scrollX.value = e.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
      />

      {/* Pagination dots */}
      <View style={styles.pagination}>
        {SLIDES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  index === currentIndex ? colors.accent : colors.border,
                width: index === currentIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Actions */}
      <Animated.View
        entering={FadeInDown.delay(300).springify()}
        style={styles.actions}
      >
        {isLastSlide ? (
          <Button onPress={handleGetStarted} fullWidth size="lg">
            Unirse a organización
          </Button>
        ) : (
          <Button onPress={handleNext} fullWidth size="lg">
            Siguiente
          </Button>
        )}

        {isLastSlide && (
          <Button
            variant="ghost"
            onPress={handleSkip}
            fullWidth
            style={styles.secondaryButton}
          >
            Explorar primero
          </Button>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipContainer: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    zIndex: 10,
  },
  skipButton: {
    padding: Spacing.sm,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  icon: {
    fontSize: 56,
  },
  title: {
    marginBottom: Spacing.md,
  },
  description: {
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actions: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  secondaryButton: {
    marginTop: Spacing.sm,
  },
});
