/**
 * KASETA - Notification Settings Screen
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Bell, Package, User, Megaphone, Wrench, Calendar, Moon } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Text, Card } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface NotificationPrefs {
  push_enabled: boolean;
  email_enabled: boolean;
  visitor_arrivals: boolean;
  package_arrivals: boolean;
  announcements: boolean;
  maintenance_updates: boolean;
  reservation_reminders: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

export default function NotificationSettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { user } = useAuth();

  const [prefs, setPrefs] = useState<NotificationPrefs>({
    push_enabled: true,
    email_enabled: true,
    visitor_arrivals: true,
    package_arrivals: true,
    announcements: true,
    maintenance_updates: true,
    reservation_reminders: true,
    quiet_hours_start: null,
    quiet_hours_end: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchPrefs = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setPrefs({
          push_enabled: data.push_enabled ?? true,
          email_enabled: data.email_enabled ?? true,
          visitor_arrivals: data.visitor_arrivals ?? true,
          package_arrivals: data.package_arrivals ?? true,
          announcements: data.announcements ?? true,
          maintenance_updates: data.maintenance_updates ?? true,
          reservation_reminders: data.reservation_reminders ?? true,
          quiet_hours_start: data.quiet_hours_start,
          quiet_hours_end: data.quiet_hours_end,
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const updatePref = async (key: keyof NotificationPrefs, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setPrefs((prev) => ({ ...prev, [key]: value }));

    try {
      await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user?.id,
          [key]: value,
          updated_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error updating preference:', error);
      // Revert on error
      setPrefs((prev) => ({ ...prev, [key]: !value }));
    }
  };

  const SettingRow = ({
    icon: Icon,
    iconColor,
    title,
    subtitle,
    value,
    onValueChange,
  }: {
    icon: any;
    iconColor?: string;
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: (iconColor || colors.accent) + '15' }]}>
        <Icon size={20} color={iconColor || colors.accent} />
      </View>
      <View style={styles.settingContent}>
        <Text variant="bodyMedium">{title}</Text>
        {subtitle && (
          <Text variant="caption" color="muted">{subtitle}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.accent }}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text variant="h2">Notificaciones</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* General */}
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>General</Text>
          <Card variant="filled" padding="none">
            <SettingRow
              icon={Bell}
              title="Notificaciones push"
              subtitle="Recibe alertas en tu dispositivo"
              value={prefs.push_enabled}
              onValueChange={(v) => updatePref('push_enabled', v)}
            />
          </Card>
        </Animated.View>

        {/* Types */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>Tipos de notificación</Text>
          <Card variant="filled" padding="none">
            <SettingRow
              icon={User}
              iconColor="#3B82F6"
              title="Llegada de visitantes"
              subtitle="Cuando un visitante llega"
              value={prefs.visitor_arrivals}
              onValueChange={(v) => updatePref('visitor_arrivals', v)}
            />
            <SettingRow
              icon={Package}
              iconColor="#F59E0B"
              title="Paquetes recibidos"
              subtitle="Cuando llega un paquete"
              value={prefs.package_arrivals}
              onValueChange={(v) => updatePref('package_arrivals', v)}
            />
            <SettingRow
              icon={Megaphone}
              iconColor="#8B5CF6"
              title="Anuncios"
              subtitle="Comunicados de la administración"
              value={prefs.announcements}
              onValueChange={(v) => updatePref('announcements', v)}
            />
            <SettingRow
              icon={Wrench}
              iconColor="#10B981"
              title="Mantenimiento"
              subtitle="Actualizaciones de solicitudes"
              value={prefs.maintenance_updates}
              onValueChange={(v) => updatePref('maintenance_updates', v)}
            />
            <SettingRow
              icon={Calendar}
              iconColor="#EC4899"
              title="Reservaciones"
              subtitle="Recordatorios de reservas"
              value={prefs.reservation_reminders}
              onValueChange={(v) => updatePref('reservation_reminders', v)}
            />
          </Card>
        </Animated.View>

        {/* Quiet Hours Info */}
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <Card variant="outlined" padding="md" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Moon size={18} color={colors.textMuted} />
              <Text variant="bodySm" color="muted" style={styles.infoText}>
                Las horas de silencio se configuran automáticamente de 10:00 PM a 7:00 AM. 
                Durante este horario no recibirás notificaciones push excepto emergencias.
              </Text>
            </View>
          </Card>
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
  infoCard: { marginTop: Spacing.lg },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  infoText: { flex: 1, lineHeight: 20 },
});
