/**
 * KASETA - Forgot Password Screen
 * Password recovery via email
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Text, Button, Input } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

export default function ForgotPasswordScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { resetPassword, isConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendReset = useCallback(async () => {
    if (!isConfigured) {
      setError('Backend not configured. Please set up Supabase credentials.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await resetPassword(email);

      if (authError) {
        setError(authError.message || 'No se pudo enviar el correo. Intenta de nuevo.');
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSent(true);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [email, resetPassword, isConfigured]);

  const isEmailValid = email.includes('@') && email.includes('.');

  if (sent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.springify()} style={styles.successContainer}>
            <View
              style={[
                styles.successIcon,
                { backgroundColor: colors.successBg },
              ]}
            >
              <Text variant="displayLg">✓</Text>
            </View>

            <Text variant="h2" center style={styles.successTitle}>
              Correo enviado
            </Text>

            <Text variant="body" color="secondary" center style={styles.successText}>
              Revisa tu bandeja de entrada en {email}. Te enviamos instrucciones
              para restablecer tu contraseña.
            </Text>

            <Button
              onPress={() => router.replace('/(auth)/login')}
              fullWidth
              style={styles.successButton}
            >
              Volver al inicio
            </Button>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header with Back Button */}
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={styles.header}
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={styles.backButton}
            >
              <Text variant="body" color="secondary">
                ← Atrás
              </Text>
            </Pressable>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <Text variant="h1" style={styles.title}>
              Recuperar contraseña
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              Te enviaremos un enlace para restablecer tu contraseña
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Input
              label="Correo electrónico"
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              error={error ?? undefined}
            />
          </Animated.View>

          {/* Error Message */}
          {error && (
            <Animated.View entering={FadeInUp.springify()}>
              <Text variant="bodySm" color="error" style={styles.errorText}>
                {error}
              </Text>
            </Animated.View>
          )}

          {/* Submit Button */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={styles.buttonContainer}
          >
            <Button
              onPress={handleSendReset}
              loading={loading}
              disabled={!isEmailValid}
              fullWidth
            >
              Enviar enlace
            </Button>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.xl,
  },
  errorText: {
    marginTop: Spacing.sm,
  },
  buttonContainer: {
    marginTop: Spacing.xl,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  successTitle: {
    marginBottom: Spacing.md,
  },
  successText: {
    marginBottom: Spacing.xl,
  },
  successButton: {
    marginTop: Spacing.lg,
  },
});
