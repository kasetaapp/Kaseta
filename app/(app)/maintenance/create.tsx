/**
 * KASETA - Create Maintenance Request
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
import { ChevronLeft } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Button, Input, Card } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const CATEGORIES = [
  { key: 'plumbing', label: 'Plomería', icon: '🚿' },
  { key: 'electrical', label: 'Eléctrico', icon: '💡' },
  { key: 'hvac', label: 'Clima', icon: '❄️' },
  { key: 'structural', label: 'Estructura', icon: '🏗️' },
  { key: 'appliances', label: 'Electrodomésticos', icon: '🔌' },
  { key: 'common_areas', label: 'Áreas comunes', icon: '🏢' },
  { key: 'other', label: 'Otro', icon: '📋' },
];

const PRIORITIES = [
  { key: 'low', label: 'Baja', color: '#6B7280' },
  { key: 'medium', label: 'Media', color: '#F59E0B' },
  { key: 'high', label: 'Alta', color: '#EF4444' },
  { key: 'urgent', label: 'Urgente', color: '#DC2626' },
];

export default function CreateMaintenanceScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentMembership, currentOrganization } = useOrganization();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleCreate = useCallback(async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Título y descripción son requeridos');
      return;
    }

    if (!currentMembership?.unit_id || !currentOrganization || !user?.id) {
      Alert.alert('Error', 'No autorizado');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('maintenance_requests').insert({
        organization_id: currentOrganization.id,
        unit_id: currentMembership.unit_id,
        created_by: user.id,
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        status: 'pending',
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Éxito', 'Solicitud enviada correctamente', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error creating request:', error);
      Alert.alert('Error', 'No se pudo enviar la solicitud');
    } finally {
      setLoading(false);
    }
  }, [title, description, category, priority, currentMembership, currentOrganization, user]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Nueva solicitud</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Category */}
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>Categoría</Text>
            <View style={styles.grid}>
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCategory(c.key);
                  }}
                  style={[
                    styles.gridItem,
                    {
                      backgroundColor: category === c.key ? colors.accent + '20' : colors.surface,
                      borderColor: category === c.key ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text variant="body">{c.icon}</Text>
                  <Text variant="caption" color={category === c.key ? 'default' : 'muted'}>{c.label}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Priority */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>Prioridad</Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map((p) => (
                <Pressable
                  key={p.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPriority(p.key);
                  }}
                  style={[
                    styles.priorityItem,
                    {
                      backgroundColor: priority === p.key ? p.color + '20' : colors.surface,
                      borderColor: priority === p.key ? p.color : colors.border,
                    },
                  ]}
                >
                  <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                  <Text variant="bodySm" customColor={priority === p.key ? p.color : colors.textSecondary}>
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>Detalles</Text>
            <Card variant="filled" padding="md">
              <Input
                label="Título"
                placeholder="Resumen del problema"
                value={title}
                onChangeText={setTitle}
              />
              <View style={styles.inputSpacing}>
                <Input
                  label="Descripción"
                  placeholder="Describe el problema en detalle..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={5}
                />
              </View>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.submitContainer}>
            <Button
              onPress={handleCreate}
              loading={loading}
              disabled={!title.trim() || !description.trim()}
              fullWidth
              size="lg"
            >
              Enviar solicitud
            </Button>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  gridItem: {
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    width: '30%',
    minWidth: 90,
  },
  priorityRow: { flexDirection: 'row', gap: Spacing.sm },
  priorityItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  inputSpacing: { marginTop: Spacing.md },
  submitContainer: { marginTop: Spacing.xl },
});
