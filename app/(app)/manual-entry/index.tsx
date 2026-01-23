/**
 * KASETA - Manual Entry Screen
 * Register visitor entry without an invitation (for guards)
 */

import React, { useState, useCallback, useEffect } from 'react';
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
import { ChevronLeft, User, Phone, Home, FileText } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Button, Input, Card, Badge } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Unit {
  id: string;
  name: string;
  identifier: string | null;
}

export default function ManualEntryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentOrganization, canScanAccess } = useOrganization();
  const { user } = useAuth();

  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [notes, setNotes] = useState('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(true);
  const [loading, setLoading] = useState(false);
  const [accessType, setAccessType] = useState<'entry' | 'exit'>('entry');

  // Fetch units
  useEffect(() => {
    async function fetchUnits() {
      if (!currentOrganization) {
        setIsLoadingUnits(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('units')
          .select('id, name, identifier')
          .eq('organization_id', currentOrganization.id)
          .order('identifier', { ascending: true });

        if (error) throw error;
        setUnits(data || []);
      } catch (error) {
        console.error('Error fetching units:', error);
      } finally {
        setIsLoadingUnits(false);
      }
    }

    fetchUnits();
  }, [currentOrganization]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleUnitSelect = (unit: Unit) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedUnit(unit.id === selectedUnit?.id ? null : unit);
  };

  const handleAccessTypeToggle = (type: 'entry' | 'exit') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAccessType(type);
  };

  const handleSubmit = useCallback(async () => {
    if (!visitorName.trim()) {
      Alert.alert('Error', 'El nombre del visitante es requerido');
      return;
    }

    if (!currentOrganization) {
      Alert.alert('Error', 'No hay organización seleccionada');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'Usuario no autenticado');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('access_logs').insert({
        organization_id: currentOrganization.id,
        unit_id: selectedUnit?.id || null,
        visitor_name: visitorName.trim(),
        access_type: accessType,
        method: 'manual_entry',
        authorized_by: user.id,
        notes: notes.trim() || null,
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        accessType === 'entry' ? 'Entrada registrada' : 'Salida registrada',
        `Se ha registrado la ${accessType === 'entry' ? 'entrada' : 'salida'} de ${visitorName.trim()}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error registering manual entry:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'No se pudo registrar el acceso');
    } finally {
      setLoading(false);
    }
  }, [visitorName, selectedUnit, notes, accessType, currentOrganization, user]);

  const isFormValid = visitorName.trim().length >= 2;

  // Check permission
  if (!canScanAccess) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Entrada manual</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centeredContent}>
          <Text variant="h1" center style={{ marginBottom: Spacing.md }}>
            🔒
          </Text>
          <Text variant="h3" center style={{ marginBottom: Spacing.sm }}>
            Sin permisos
          </Text>
          <Text variant="body" color="secondary" center>
            No tienes permisos para registrar entradas manuales.
          </Text>
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
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.header}
        >
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Entrada manual</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Access Type Toggle */}
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>
              Tipo de registro
            </Text>
            <View style={[styles.toggleContainer, { backgroundColor: colors.surface }]}>
              <Pressable
                onPress={() => handleAccessTypeToggle('entry')}
                style={[
                  styles.toggleButton,
                  accessType === 'entry' && { backgroundColor: colors.success },
                ]}
              >
                <Text
                  variant="bodyMedium"
                  customColor={accessType === 'entry' ? colors.background : colors.text}
                >
                  🚪 Entrada
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleAccessTypeToggle('exit')}
                style={[
                  styles.toggleButton,
                  accessType === 'exit' && { backgroundColor: colors.warning },
                ]}
              >
                <Text
                  variant="bodyMedium"
                  customColor={accessType === 'exit' ? colors.background : colors.text}
                >
                  👋 Salida
                </Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Visitor Info */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>
              Información del visitante
            </Text>
            <Card variant="filled" padding="md">
              <Input
                label="Nombre completo"
                placeholder="Juan Pérez"
                value={visitorName}
                onChangeText={setVisitorName}
                leftElement={<User size={18} color={colors.textMuted} />}
                autoCapitalize="words"
              />
              <View style={styles.inputSpacing}>
                <Input
                  label="Teléfono (opcional)"
                  placeholder="+52 123 456 7890"
                  value={visitorPhone}
                  onChangeText={setVisitorPhone}
                  leftElement={<Phone size={18} color={colors.textMuted} />}
                  keyboardType="phone-pad"
                />
              </View>
            </Card>
          </Animated.View>

          {/* Unit Selection */}
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>
              Destino (opcional)
            </Text>
            <Card variant="filled" padding="md">
              {isLoadingUnits ? (
                <Text variant="body" color="muted" center>
                  Cargando unidades...
                </Text>
              ) : units.length === 0 ? (
                <Text variant="body" color="muted" center>
                  No hay unidades registradas
                </Text>
              ) : (
                <View style={styles.unitsGrid}>
                  {units.map((unit) => (
                    <Pressable
                      key={unit.id}
                      onPress={() => handleUnitSelect(unit)}
                      style={[
                        styles.unitChip,
                        {
                          backgroundColor:
                            selectedUnit?.id === unit.id
                              ? colors.accent
                              : colors.surface,
                          borderColor:
                            selectedUnit?.id === unit.id
                              ? colors.accent
                              : colors.border,
                        },
                      ]}
                    >
                      <Text
                        variant="bodySm"
                        customColor={
                          selectedUnit?.id === unit.id
                            ? colors.textOnAccent
                            : colors.text
                        }
                      >
                        {unit.identifier || unit.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </Card>
          </Animated.View>

          {/* Notes */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>
              Notas (opcional)
            </Text>
            <Card variant="filled" padding="md">
              <Input
                placeholder="Ej: Entrega de paquete, visitante sin cita..."
                value={notes}
                onChangeText={setNotes}
                leftElement={<FileText size={18} color={colors.textMuted} />}
                multiline
                numberOfLines={3}
              />
            </Card>
          </Animated.View>

          {/* Submit */}
          <Animated.View
            entering={FadeInDown.delay(350).springify()}
            style={styles.submitContainer}
          >
            <Button
              onPress={handleSubmit}
              loading={loading}
              disabled={!isFormValid}
              fullWidth
              size="lg"
              variant={accessType === 'entry' ? 'primary' : 'secondary'}
            >
              {accessType === 'entry' ? 'Registrar entrada' : 'Registrar salida'}
            </Button>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  sectionTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: Spacing.xs,
    borderRadius: BorderRadius.lg,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  inputSpacing: {
    marginTop: Spacing.md,
  },
  unitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  unitChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  submitContainer: {
    marginTop: Spacing.xl,
  },
});
