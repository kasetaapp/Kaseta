/**
 * KASETA - OTP Verification Screen
 * Verify phone number with OTP code
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

const OTP_LENGTH = 6;

export default function VerifyOTPScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { verifyOTP, signInWithPhone, isConfigured } = useAuth();

  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(60);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleOtpChange = useCallback((value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      pastedCode.forEach((char, i) => {
        if (index + i < OTP_LENGTH) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + pastedCode.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [otp]);

  const handleKeyPress = useCallback((key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handleVerify = useCallback(async () => {
    if (!isConfigured) {
      setError('Backend not configured. Please set up Supabase credentials.');
      return;
    }

    if (!phone) {
      setError('Phone number not provided.');
      return;
    }

    const otpCode = otp.join('');
    if (otpCode.length !== OTP_LENGTH) {
      setError('Please enter the complete code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await verifyOTP(phone, otpCode);

      if (authError) {
        setError(authError.message || 'Invalid code. Please try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Navigation is handled by AuthContext listener in app/index.tsx
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [otp, phone, verifyOTP, isConfigured]);

  const handleResend = useCallback(async () => {
    if (resendTimer > 0 || !phone || !isConfigured) return;

    try {
      const { error: authError } = await signInWithPhone(phone);

      if (authError) {
        setError(authError.message || 'Failed to resend code.');
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResendTimer(60);
      setOtp(new Array(OTP_LENGTH).fill(''));
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    }
  }, [resendTimer, phone, signInWithPhone, isConfigured]);

  const canSubmit = otp.every((digit) => digit !== '');

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
              Verificar teléfono
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              Ingresa el código de 6 dígitos que enviamos a{' '}
              <Text variant="bodyMedium">{phone}</Text>
            </Text>
          </Animated.View>

          {/* OTP Input */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.otpContainer}
          >
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.otpInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: digit ? colors.accent : colors.border,
                    color: colors.text,
                  },
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                autoFocus={index === 0}
              />
            ))}
          </Animated.View>

          {/* Error Message */}
          {error && (
            <Animated.View entering={FadeInUp.springify()}>
              <Text variant="bodySm" color="error" center style={styles.errorText}>
                {error}
              </Text>
            </Animated.View>
          )}

          {/* Verify Button */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={styles.buttonContainer}
          >
            <Button
              onPress={handleVerify}
              loading={loading}
              disabled={!canSubmit}
              fullWidth
            >
              Verificar
            </Button>
          </Animated.View>

          {/* Resend Link */}
          <Animated.View
            entering={FadeInDown.delay(400).springify()}
            style={styles.resendContainer}
          >
            {resendTimer > 0 ? (
              <Text variant="body" color="muted" center>
                Reenviar código en {resendTimer}s
              </Text>
            ) : (
              <Pressable onPress={handleResend}>
                <Text variant="bodyMedium" customColor={colors.accent} center>
                  Reenviar código
                </Text>
              </Pressable>
            )}
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
  },
  errorText: {
    marginBottom: Spacing.md,
  },
  buttonContainer: {
    marginTop: Spacing.md,
  },
  resendContainer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
});
