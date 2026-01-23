/**
 * KASETA - Login Screen
 * Email/Phone login with OTP support
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Text, Button, Input, Divider } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

type LoginMethod = 'email' | 'phone';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { signInWithEmail, signInWithPhone, isConfigured } = useAuth();

  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMethodChange = useCallback((method: LoginMethod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoginMethod(method);
    setError(null);
  }, []);

  const handleLogin = useCallback(async () => {
    if (!isConfigured) {
      setError('Backend no configurado. Configura las credenciales de Supabase.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (loginMethod === 'email') {
        const { error: authError } = await signInWithEmail(email, password);
        if (authError) {
          setError(authError.message || 'Credenciales inválidas. Intenta de nuevo.');
          return;
        }
        router.replace('/(app)/(tabs)/home');
        return;
      } else {
        const { error: authError } = await signInWithPhone(phone);
        if (authError) {
          setError(authError.message || 'No se pudo enviar el código. Intenta de nuevo.');
          return;
        }
        router.push({
          pathname: '/(auth)/verify-otp',
          params: { phone },
        });
        return;
      }
    } catch (err) {
      setError('Ocurrió un error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [loginMethod, email, phone, password, signInWithEmail, signInWithPhone, isConfigured]);

  const isEmailValid = email.includes('@') && email.includes('.');
  const isPhoneValid = phone.length >= 10;
  const isPasswordValid = password.length >= 6;

  const canSubmit =
    (loginMethod === 'email' ? isEmailValid : isPhoneValid) && isPasswordValid;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Text variant="h1" style={styles.title}>
              Bienvenido
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              Inicia sesión para continuar
            </Text>
          </Animated.View>

          {/* Method Toggle */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={[styles.toggleContainer, { backgroundColor: colors.surface }]}
          >
            <Pressable
              onPress={() => handleMethodChange('email')}
              style={[
                styles.toggleButton,
                loginMethod === 'email' && {
                  backgroundColor: colors.background,
                },
              ]}
            >
              <Text
                variant="bodyMedium"
                color={loginMethod === 'email' ? 'default' : 'muted'}
              >
                Email
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleMethodChange('phone')}
              style={[
                styles.toggleButton,
                loginMethod === 'phone' && {
                  backgroundColor: colors.background,
                },
              ]}
            >
              <Text
                variant="bodyMedium"
                color={loginMethod === 'phone' ? 'default' : 'muted'}
              >
                Teléfono
              </Text>
            </Pressable>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={styles.form}
          >
            {loginMethod === 'email' ? (
              <Input
                label="Correo electrónico"
                placeholder="tu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                error={error && !isEmailValid ? 'Ingresa un correo válido' : undefined}
              />
            ) : (
              <Input
                label="Número de teléfono"
                placeholder="+52 123 456 7890"
                keyboardType="phone-pad"
                autoComplete="tel"
                value={phone}
                onChangeText={setPhone}
                error={error && !isPhoneValid ? 'Ingresa un teléfono válido' : undefined}
              />
            )}

            <View style={styles.inputSpacing}>
              <Input
                label="Contraseña"
                placeholder="••••••••"
                secureTextEntry
                autoComplete="password"
                value={password}
                onChangeText={setPassword}
                error={error && !isPasswordValid ? 'Mínimo 6 caracteres' : undefined}
              />
            </View>

            <Link href="/(auth)/forgot-password" asChild>
              <Pressable style={styles.forgotPassword}>
                <Text variant="bodySm" color="secondary">
                  ¿Olvidaste tu contraseña?
                </Text>
              </Pressable>
            </Link>
          </Animated.View>

          {/* Error Message */}
          {error && (
            <Animated.View entering={FadeInUp.springify()}>
              <Text variant="bodySm" color="error" center style={styles.errorText}>
                {error}
              </Text>
            </Animated.View>
          )}

          {/* Submit Button */}
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <Button
              onPress={handleLogin}
              loading={loading}
              disabled={!canSubmit}
              fullWidth
            >
              Iniciar sesión
            </Button>
          </Animated.View>

          {/* Divider */}
          <Divider label="o continúa con" spacing={Spacing.xl} />

          {/* Social Login (placeholder) */}
          <Animated.View entering={FadeInDown.delay(500).springify()}>
            <Button variant="outline" fullWidth disabled>
              Continuar con Google
            </Button>
          </Animated.View>

          {/* Register Link */}
          <Animated.View
            entering={FadeInDown.delay(600).springify()}
            style={styles.registerContainer}
          >
            <Text variant="body" color="secondary">
              ¿No tienes cuenta?{' '}
            </Text>
            <Link href="/(auth)/register" asChild>
              <Pressable>
                <Text variant="bodyMedium" customColor={colors.accent}>
                  Regístrate
                </Text>
              </Pressable>
            </Link>
          </Animated.View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.xl,
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: Spacing.xs,
    borderRadius: 12,
    marginBottom: Spacing.xl,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.smd,
    alignItems: 'center',
    borderRadius: 10,
  },
  form: {
    marginBottom: Spacing.lg,
  },
  inputSpacing: {
    marginTop: Spacing.md,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: Spacing.smd,
    paddingVertical: Spacing.xs,
  },
  errorText: {
    marginBottom: Spacing.md,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
});
