/**
 * KASETA - Privacy Settings Screen
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Eye, Users, Phone, MapPin, Download } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Text, Card, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function PrivacySettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { user } = useAuth();

  const [showInDirectory, setShowInDirectory] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('show_in_directory')
        .eq('id', user.id)
        .single();

      if (data) {
        setShowInDirectory(data.show_in_directory ?? false);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const updateSetting = async (key: string, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (key === 'show_in_directory') {
      setShowInDirectory(value);
    }

    try {
      await supabase
        .from('users')
        .update({ [key]: value, updated_at: new Date().toISOString() })
        .eq('id', user?.id);
    } catch (error) {
      console.error('Error updating setting:', error);
      if (key === 'show_in_directory') {
        setShowInDirectory(!value);
      }
    }
  };

  const handleDownloadData = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Would trigger data export
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
        <Text variant="h2">Privacidad</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Directory */}
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>Directorio comunitario</Text>
          <Card variant="filled" padding="none">
            <SettingRow
              icon={Users}
              iconColor="#3B82F6"
              title="Aparecer en directorio"
              subtitle="Otros residentes pueden ver tu nombre"
              value={showInDirectory}
              onValueChange={(v) => updateSetting('show_in_directory', v)}
            />
          </Card>
          <Text variant="caption" color="muted" style={styles.helperText}>
            Al activar esta opción, tu nombre y unidad aparecerán en el directorio de la comunidad. 
            Otros residentes podrán contactarte.
          </Text>
        </Animated.View>

        {/* Info */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>Tu información</Text>
          <Card variant="filled" padding="md">
            <View style={styles.infoItem}>
              <Eye size={18} color={colors.textMuted} />
              <Text variant="bodySm" color="secondary" style={styles.infoText}>
                Solo los guardias y administradores pueden ver tu información de contacto completa 
                para propósitos de seguridad.
              </Text>
            </View>
            <View style={[styles.infoItem, { marginTop: Spacing.md }]}>
              <MapPin size={18} color={colors.textMuted} />
              <Text variant="bodySm" color="secondary" style={styles.infoText}>
                Tu historial de acceso solo es visible para ti y la administración.
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Data */}
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>Tus datos</Text>
          <Card variant="filled" padding="md">
            <View style={styles.dataRow}>
              <View style={styles.dataInfo}>
                <Download size={20} color={colors.accent} />
                <View style={styles.dataText}>
                  <Text variant="bodyMedium">Descargar mis datos</Text>
                  <Text variant="caption" color="muted">
                    Obtén una copia de toda tu información
                  </Text>
                </View>
              </View>
              <Button variant="secondary" size="sm" onPress={handleDownloadData}>
                Solicitar
              </Button>
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
  helperText: { marginTop: Spacing.sm, paddingHorizontal: Spacing.xs },
  infoItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  infoText: { flex: 1, lineHeight: 20 },
  dataRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dataInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  dataText: { flex: 1 },
});
