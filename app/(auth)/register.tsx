/**
 * KASETA - Register Screen
 * New user registration
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Alert,
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
import { Text, Button, Input } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { signUp, isConfigured } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = useCallback(async () => {
    if (!isConfigured) {
      setError('Backend no configurado. Configura las credenciales de Supabase.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await signUp(email, password, {
        full_name: name,
        phone: phone,
      });

      if (authError) {
        const errorMsg = authError.message || 'No se pudo crear la cuenta. Intenta de nuevo.';
        setError(errorMsg);
        return;
      }

      Alert.alert('Éxito', 'Cuenta creada. Revisa tu email para confirmar.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Ocurrió un error inesperado.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [name, email, phone, password, signUp, isConfigured]);

  const isNameValid = name.trim().length >= 2;
  const isEmailValid = email.includes('@') && email.includes('.');
  const isPhoneValid = phone.length === 0 || phone.length >= 10; // Phone is optional
  const isPasswordValid = password.length >= 6;
  const doPasswordsMatch = password === confirmPassword;

  const canSubmit =
    isNameValid &&
    isEmailValid &&
    isPasswordValid &&
    doPasswordsMatch;

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
              Crear cuenta
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              Completa tus datos para registrarte
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.form}
          >
            <Input
              label="Nombre completo"
              placeholder="Juan Pérez"
              autoCapitalize="words"
              autoComplete="name"
              value={name}
              onChangeText={setName}
            />

            <View style={styles.inputSpacing}>
              <Input
                label="Correo electrónico"
                placeholder="tu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputSpacing}>
              <Input
                label="Número de teléfono"
                placeholder="+52 123 456 7890"
                keyboardType="phone-pad"
                autoComplete="tel"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.inputSpacing}>
              <Input
                label="Contraseña"
                placeholder="Mínimo 6 caracteres"
                secureTextEntry
                autoComplete="new-password"
                value={password}
                onChangeText={setPassword}
                helperText="Mínimo 6 caracteres"
              />
            </View>

            <View style={styles.inputSpacing}>
              <Input
                label="Confirmar contraseña"
                placeholder="••••••••"
                secureTextEntry
                autoComplete="new-password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                error={
                  confirmPassword && !doPasswordsMatch
                    ? 'Las contraseñas no coinciden'
                    : undefined
                }
              />
            </View>
          </Animated.View>

          {/* Error Message */}
          {error && (
            <Animated.View entering={FadeInUp.springify()}>
              <Text variant="bodySm" color="error" center style={styles.errorText}>
                {error}
              </Text>
            </Animated.View>
          )}

          {/* Terms */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text
              variant="caption"
              color="muted"
              center
              style={styles.termsText}
            >
              Al registrarte aceptas nuestros{' '}
              <Text variant="caption" customColor={colors.accent}>
                Términos de Servicio
              </Text>{' '}
              y{' '}
              <Text variant="caption" customColor={colors.accent}>
                Política de Privacidad
              </Text>
            </Text>
          </Animated.View>

          {/* Submit Button */}
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <Button
              onPress={handleRegister}
              loading={loading}
              disabled={!canSubmit}
              fullWidth
            >
              Crear cuenta
            </Button>
          </Animated.View>

          {/* Login Link */}
          <Animated.View
            entering={FadeInDown.delay(500).springify()}
            style={styles.loginContainer}
          >
            <Text variant="body" color="secondary">
              ¿Ya tienes cuenta?{' '}
            </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text variant="bodyMedium" customColor={colors.accent}>
                  Inicia sesión
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
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
  form: {
    marginBottom: Spacing.lg,
  },
  inputSpacing: {
    marginTop: Spacing.md,
  },
  errorText: {
    marginBottom: Spacing.md,
  },
  termsText: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
});
