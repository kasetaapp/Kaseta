/**
 * KASETA - Add Vehicle Screen
 * Register a new vehicle
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
import { supabase } from '@/lib/supabase';

const COLORS = [
  { key: 'white', label: 'Blanco', color: '#FFFFFF' },
  { key: 'black', label: 'Negro', color: '#1A1A1A' },
  { key: 'silver', label: 'Plata', color: '#C0C0C0' },
  { key: 'gray', label: 'Gris', color: '#808080' },
  { key: 'red', label: 'Rojo', color: '#DC2626' },
  { key: 'blue', label: 'Azul', color: '#2563EB' },
  { key: 'green', label: 'Verde', color: '#16A34A' },
  { key: 'yellow', label: 'Amarillo', color: '#EAB308' },
  { key: 'orange', label: 'Naranja', color: '#EA580C' },
  { key: 'brown', label: 'Café', color: '#92400E' },
];

export default function AddVehicleScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentMembership } = useOrganization();

  const [licensePlate, setLicensePlate] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isPrimary, setIsPrimary] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleColorSelect = (colorKey: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedColor(colorKey === selectedColor ? null : colorKey);
  };

  const handleSave = useCallback(async () => {
    if (!licensePlate.trim()) {
      Alert.alert('Error', 'La placa es requerida');
      return;
    }

    if (!currentMembership?.unit_id) {
      Alert.alert('Error', 'No tienes una unidad asignada');
      return;
    }

    setLoading(true);

    try {
      // If setting as primary, unset all others first
      if (isPrimary) {
        await supabase
          .from('vehicles')
          .update({ is_primary: false })
          .eq('unit_id', currentMembership.unit_id);
      }

      const { error } = await supabase.from('vehicles').insert({
        unit_id: currentMembership.unit_id,
        license_plate: licensePlate.trim().toUpperCase(),
        make: make.trim() || null,
        model: model.trim() || null,
        color: selectedColor,
        is_primary: isPrimary,
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Éxito', 'Vehículo registrado correctamente', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error adding vehicle:', error);
      if (error.code === '23505') {
        Alert.alert('Error', 'Esta placa ya está registrada');
      } else {
        Alert.alert('Error', 'No se pudo registrar el vehículo');
      }
    } finally {
      setLoading(false);
    }
  }, [licensePlate, make, model, selectedColor, isPrimary, currentMembership]);

  const isFormValid = licensePlate.trim().length >= 3;

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
          <Text variant="h2">Agregar vehículo</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* License plate */}
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>
              Placa del vehículo
            </Text>
            <Card variant="filled" padding="md">
              <Input
                label="Número de placa"
                placeholder="ABC-123"
                value={licensePlate}
                onChangeText={(text) => setLicensePlate(text.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </Card>
          </Animated.View>

          {/* Vehicle info */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>
              Información del vehículo (opcional)
            </Text>
            <Card variant="filled" padding="md">
              <Input
                label="Marca"
                placeholder="Ej: Toyota, Honda, Ford..."
                value={make}
                onChangeText={setMake}
                autoCapitalize="words"
              />
              <View style={styles.inputSpacing}>
                <Input
                  label="Modelo"
                  placeholder="Ej: Corolla, Civic, Focus..."
                  value={model}
                  onChangeText={setModel}
                  autoCapitalize="words"
                />
              </View>
            </Card>
          </Animated.View>

          {/* Color selection */}
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>
              Color (opcional)
            </Text>
            <Card variant="filled" padding="md">
              <View style={styles.colorsGrid}>
                {COLORS.map((colorOption) => (
                  <Pressable
                    key={colorOption.key}
                    onPress={() => handleColorSelect(colorOption.key)}
                    style={[
                      styles.colorOption,
                      {
                        borderColor:
                          selectedColor === colorOption.key
                            ? colors.accent
                            : colors.border,
                        borderWidth: selectedColor === colorOption.key ? 2 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.colorSwatch,
                        {
                          backgroundColor: colorOption.color,
                          borderColor:
                            colorOption.key === 'white' ? colors.border : 'transparent',
                          borderWidth: colorOption.key === 'white' ? 1 : 0,
                        },
                      ]}
                    />
                    <Text
                      variant="caption"
                      color={selectedColor === colorOption.key ? 'default' : 'muted'}
                    >
                      {colorOption.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Card>
          </Animated.View>

          {/* Primary toggle */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Card
              variant="outlined"
              padding="md"
              style={styles.primaryToggle}
              pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsPrimary(!isPrimary);
              }}
            >
              <View style={styles.primaryRow}>
                <View style={styles.primaryInfo}>
                  <Text variant="bodyMedium">Establecer como principal</Text>
                  <Text variant="caption" color="muted">
                    Este vehículo se mostrará primero en tu lista
                  </Text>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: isPrimary ? colors.accent : colors.surface,
                      borderColor: isPrimary ? colors.accent : colors.border,
                    },
                  ]}
                >
                  {isPrimary && (
                    <Text variant="caption" customColor={colors.textOnAccent}>
                      ✓
                    </Text>
                  )}
                </View>
              </View>
            </Card>
          </Animated.View>

          {/* Save button */}
          <Animated.View
            entering={FadeInDown.delay(350).springify()}
            style={styles.buttonContainer}
          >
            <Button
              onPress={handleSave}
              loading={loading}
              disabled={!isFormValid}
              fullWidth
              size="lg"
            >
              Registrar vehículo
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
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  sectionTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  inputSpacing: {
    marginTop: Spacing.md,
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  colorOption: {
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    width: '18%',
    minWidth: 56,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: Spacing.xs,
  },
  primaryToggle: {
    marginTop: Spacing.lg,
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryInfo: {
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  buttonContainer: {
    marginTop: Spacing.xl,
  },
});
