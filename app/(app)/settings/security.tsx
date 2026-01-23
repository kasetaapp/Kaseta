/**
 * KASETA - Security Settings Screen
 * Change password and security options
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Text, Button, Input, Card } from '@/components/ui';
import { supabase } from '@/lib/supabase';

export default function SecurityScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const isPasswordValid = newPassword.length >= 6;
  const doPasswordsMatch = newPassword === confirmPassword;
  const canSubmit = currentPassword.length > 0 && isPasswordValid && doPasswordsMatch;

  const handleChangePassword = useCallback(async () => {
    if (!canSubmit) return;

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        Alert.alert('Error', error.message || 'No se pudo cambiar la contraseña.');
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Éxito', 'Contraseña actualizada correctamente.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  }, [newPassword, canSubmit]);

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
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={styles.header}
          >
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Text variant="body" color="secondary">
                ← Atrás
              </Text>
            </Pressable>
            <Text variant="h2">Seguridad</Text>
            <View style={styles.headerSpacer} />
          </Animated.View>

          {/* Change Password Form */}
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>
              Cambiar contraseña
            </Text>
            <Card variant="filled" padding="md">
              <Input
                label="Contraseña actual"
                placeholder="••••••••"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                autoComplete="current-password"
              />

              <View style={styles.inputSpacing}>
                <Input
                  label="Nueva contraseña"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoComplete="new-password"
                  helperText="Mínimo 6 caracteres"
                  error={newPassword && !isPasswordValid ? 'Mínimo 6 caracteres' : undefined}
                />
              </View>

              <View style={styles.inputSpacing}>
                <Input
                  label="Confirmar nueva contraseña"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoComplete="new-password"
                  error={
                    confirmPassword && !doPasswordsMatch
                      ? 'Las contraseñas no coinciden'
                      : undefined
                  }
                />
              </View>
            </Card>
          </Animated.View>

          {/* Save Button */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.buttonContainer}
          >
            <Button
              onPress={handleChangePassword}
              loading={loading}
              disabled={!canSubmit}
              fullWidth
            >
              Cambiar contraseña
            </Button>
          </Animated.View>

          {/* Security Info */}
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>
              Información de seguridad
            </Text>
            <Card variant="outlined" padding="md">
              <View style={styles.infoRow}>
                <Text variant="bodySm" color="muted">
                  Último inicio de sesión
                </Text>
                <Text variant="body">Hoy</Text>
              </View>
              <View style={[styles.infoRow, styles.infoRowLast]}>
                <Text variant="bodySm" color="muted">
                  Método de autenticación
                </Text>
                <Text variant="body">Email + Contraseña</Text>
              </View>
            </Card>
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
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  backButton: {
    paddingVertical: Spacing.xs,
    paddingRight: Spacing.md,
  },
  headerSpacer: {
    width: 60,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  inputSpacing: {
    marginTop: Spacing.md,
  },
  buttonContainer: {
    marginTop: Spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
});
