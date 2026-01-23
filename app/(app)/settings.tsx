/**
 * KASETA - Settings Screen
 * App settings and preferences
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  Lock,
  Moon,
  Globe,
  Shield,
  HelpCircle,
  FileText,
  Star,
  Share2,
  Trash2,
  LogOut,
} from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const STORAGE_KEYS = {
  BIOMETRIC_ENABLED: 'kaseta_biometric_enabled',
  DARK_MODE: 'kaseta_dark_mode',
  LANGUAGE: 'kaseta_language',
};

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { user, signOut } = useAuth();

  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(isDark);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    checkBiometricAvailability();
    loadSettings();
  }, []);

  const checkBiometricAvailability = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);
  };

  const loadSettings = async () => {
    try {
      const biometric = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
      if (biometric !== null) setBiometricEnabled(biometric === 'true');

      const darkMode = await AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE);
      if (darkMode !== null) setDarkModeEnabled(darkMode === 'true');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleBiometricToggle = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (value) {
      // Authenticate before enabling
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirma tu identidad',
        cancelLabel: 'Cancelar',
      });

      if (result.success) {
        setBiometricEnabled(true);
        await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'true');
      }
    } else {
      setBiometricEnabled(false);
      await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'false');
    }
  };

  const handleDarkModeToggle = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDarkModeEnabled(value);
    await AsyncStorage.setItem(STORAGE_KEYS.DARK_MODE, value.toString());
    // Note: Actual theme change would require app-level state management
  };

  const handleNotificationsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(app)/settings/notifications');
  };

  const handlePrivacyPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(app)/settings/privacy');
  };

  const handleHelpPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL('mailto:soporte@kaseta.app');
  };

  const handleTermsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL('https://kaseta.app/terminos');
  };

  const handlePrivacyPolicyPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL('https://kaseta.app/privacidad');
  };

  const handleRateApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Would open app store link
    Alert.alert('Calificar', 'Gracias por tu apoyo');
  };

  const handleShareApp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Would use Share API
    Alert.alert('Compartir', 'Comparte KASETA con tus vecinos');
  };

  const handleDeleteAccount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Eliminar cuenta',
      '¿Estás seguro? Esta acción no se puede deshacer y perderás todos tus datos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            // Would call delete account endpoint
            Alert.alert('Cuenta eliminada', 'Tu cuenta ha sido eliminada');
            signOut();
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que deseas salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          onPress: () => signOut(),
        },
      ]
    );
  };

  const SettingRow = ({
    icon: Icon,
    iconColor,
    title,
    subtitle,
    onPress,
    rightElement,
    showChevron = true,
  }: {
    icon: any;
    iconColor?: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    showChevron?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      style={[styles.settingRow, { borderBottomColor: colors.border }]}
      disabled={!onPress && !rightElement}
    >
      <View style={[styles.iconContainer, { backgroundColor: (iconColor || colors.accent) + '15' }]}>
        <Icon size={20} color={iconColor || colors.accent} />
      </View>
      <View style={styles.settingContent}>
        <Text variant="bodyMedium">{title}</Text>
        {subtitle && (
          <Text variant="caption" color="muted">
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement || (showChevron && onPress && (
        <ChevronRight size={20} color={colors.textMuted} />
      ))}
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text variant="h2">Configuración</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Security */}
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>Seguridad</Text>
          <Card variant="filled" padding="none">
            {biometricAvailable && (
              <SettingRow
                icon={Lock}
                title="Autenticación biométrica"
                subtitle="Usa Face ID o huella digital"
                showChevron={false}
                rightElement={
                  <Switch
                    value={biometricEnabled}
                    onValueChange={handleBiometricToggle}
                    trackColor={{ false: colors.border, true: colors.accent }}
                  />
                }
              />
            )}
            <SettingRow
              icon={Shield}
              title="Privacidad"
              subtitle="Controla tu información"
              onPress={handlePrivacyPress}
            />
          </Card>
        </Animated.View>

        {/* Preferences */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>Preferencias</Text>
          <Card variant="filled" padding="none">
            <SettingRow
              icon={Bell}
              title="Notificaciones"
              subtitle="Configura alertas y sonidos"
              onPress={handleNotificationsPress}
            />
            <SettingRow
              icon={Moon}
              title="Modo oscuro"
              showChevron={false}
              rightElement={
                <Switch
                  value={darkModeEnabled}
                  onValueChange={handleDarkModeToggle}
                  trackColor={{ false: colors.border, true: colors.accent }}
                />
              }
            />
            <SettingRow
              icon={Globe}
              title="Idioma"
              subtitle="Español"
              onPress={() => {}}
            />
          </Card>
        </Animated.View>

        {/* Support */}
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>Soporte</Text>
          <Card variant="filled" padding="none">
            <SettingRow
              icon={HelpCircle}
              title="Ayuda y soporte"
              onPress={handleHelpPress}
            />
            <SettingRow
              icon={FileText}
              title="Términos de servicio"
              onPress={handleTermsPress}
            />
            <SettingRow
              icon={Shield}
              title="Política de privacidad"
              onPress={handlePrivacyPolicyPress}
            />
          </Card>
        </Animated.View>

        {/* About */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>Acerca de</Text>
          <Card variant="filled" padding="none">
            <SettingRow
              icon={Star}
              iconColor="#F59E0B"
              title="Calificar la app"
              onPress={handleRateApp}
            />
            <SettingRow
              icon={Share2}
              title="Compartir KASETA"
              onPress={handleShareApp}
            />
          </Card>
        </Animated.View>

        {/* Account */}
        <Animated.View entering={FadeInDown.delay(350).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>Cuenta</Text>
          <Card variant="filled" padding="none">
            <SettingRow
              icon={LogOut}
              iconColor={colors.error}
              title="Cerrar sesión"
              onPress={handleSignOut}
              showChevron={false}
            />
            <SettingRow
              icon={Trash2}
              iconColor={colors.error}
              title="Eliminar cuenta"
              onPress={handleDeleteAccount}
              showChevron={false}
            />
          </Card>
        </Animated.View>

        {/* Version */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.versionContainer}>
          <Text variant="caption" color="muted" center>
            KASETA v1.0.0
          </Text>
          <Text variant="caption" color="muted" center>
            © 2024 KASETA. Todos los derechos reservados.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: { padding: Spacing.xs },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  sectionTitle: { marginTop: Spacing.lg, marginBottom: Spacing.sm },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: { flex: 1, marginLeft: Spacing.md },
  versionContainer: { marginTop: Spacing.xl, paddingVertical: Spacing.lg },
});
