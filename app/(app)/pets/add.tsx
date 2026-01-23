/**
 * KASETA - Add Pet Screen
 * Register a new pet
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
import { ChevronLeft, Dog, Cat, PawPrint, Check } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Button, Input, Card } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

type PetType = 'dog' | 'cat' | 'other';

const PET_TYPES: { key: PetType; label: string; icon: React.ReactNode }[] = [
  { key: 'dog', label: 'Perro', icon: null },
  { key: 'cat', label: 'Gato', icon: null },
  { key: 'other', label: 'Otro', icon: null },
];

export default function AddPetScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { user } = useAuth();
  const { currentMembership } = useOrganization();

  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<PetType | null>(null);
  const [breed, setBreed] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleTypeSelect = (type: PetType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedType(type === selectedType ? null : type);
  };

  const getTypeIcon = (type: PetType, isSelected: boolean) => {
    const iconColor = isSelected ? colors.textOnAccent : colors.textMuted;
    const size = 24;

    switch (type) {
      case 'dog':
        return <Dog size={size} color={iconColor} />;
      case 'cat':
        return <Cat size={size} color={iconColor} />;
      default:
        return <PawPrint size={size} color={iconColor} />;
    }
  };

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre de la mascota es requerido');
      return;
    }

    if (!selectedType) {
      Alert.alert('Error', 'Selecciona el tipo de mascota');
      return;
    }

    if (!currentMembership?.unit_id || !currentMembership?.organization_id || !user?.id) {
      Alert.alert('Error', 'No tienes una unidad asignada');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('pets').insert({
        user_id: user.id,
        unit_id: currentMembership.unit_id,
        organization_id: currentMembership.organization_id,
        name: name.trim(),
        type: selectedType,
        breed: breed.trim() || null,
        notes: notes.trim() || null,
        photo_url: null,
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Exito', 'Mascota registrada correctamente', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error adding pet:', error);
      Alert.alert('Error', 'No se pudo registrar la mascota');
    } finally {
      setLoading(false);
    }
  }, [name, selectedType, breed, notes, currentMembership, user]);

  const isFormValid = name.trim().length >= 2 && selectedType !== null;

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
          <Text variant="h2">Agregar mascota</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Pet name */}
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>
              Nombre de la mascota
            </Text>
            <Card variant="filled" padding="md">
              <Input
                label="Nombre"
                placeholder="Ej: Max, Luna, Rocky..."
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </Card>
          </Animated.View>

          {/* Pet type selection */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>
              Tipo de mascota
            </Text>
            <Card variant="filled" padding="md">
              <View style={styles.typeGrid}>
                {PET_TYPES.map((typeOption) => {
                  const isSelected = selectedType === typeOption.key;
                  return (
                    <Pressable
                      key={typeOption.key}
                      onPress={() => handleTypeSelect(typeOption.key)}
                      style={[
                        styles.typeOption,
                        {
                          backgroundColor: isSelected ? colors.accent : colors.surface,
                          borderColor: isSelected ? colors.accent : colors.border,
                        },
                      ]}
                    >
                      {getTypeIcon(typeOption.key, isSelected)}
                      <Text
                        variant="bodyMedium"
                        customColor={isSelected ? colors.textOnAccent : colors.text}
                        style={styles.typeLabel}
                      >
                        {typeOption.label}
                      </Text>
                      {isSelected && (
                        <View style={[styles.checkmark, { backgroundColor: colors.textOnAccent }]}>
                          <Check size={12} color={colors.accent} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          </Animated.View>

          {/* Breed */}
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>
              Raza (opcional)
            </Text>
            <Card variant="filled" padding="md">
              <Input
                label="Raza"
                placeholder="Ej: Labrador, Persa, Mestizo..."
                value={breed}
                onChangeText={setBreed}
                autoCapitalize="words"
              />
            </Card>
          </Animated.View>

          {/* Notes */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>
              Notas adicionales (opcional)
            </Text>
            <Card variant="filled" padding="md">
              <Input
                label="Notas"
                placeholder="Ej: Color, caracteristicas especiales, vacunas..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
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
              Registrar mascota
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
  typeGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  typeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    minHeight: 100,
    position: 'relative',
  },
  typeLabel: {
    marginTop: Spacing.sm,
  },
  checkmark: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    marginTop: Spacing.xl,
  },
});
