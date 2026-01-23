/**
 * KASETA - Create Poll Screen
 * Admin can create new polls
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
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Plus, Trash2, Calendar } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Button, Input, Card } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;

export default function CreatePollScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentOrganization, isAdmin } = useOrganization();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleAddOption = () => {
    if (options.length >= MAX_OPTIONS) {
      Alert.alert('Limite alcanzado', `Maximo ${MAX_OPTIONS} opciones permitidas`);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= MIN_OPTIONS) {
      Alert.alert('Minimo requerido', `Minimo ${MIN_OPTIONS} opciones requeridas`);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Error', 'El titulo es requerido');
      return false;
    }

    const validOptions = options.filter((opt) => opt.trim());
    if (validOptions.length < MIN_OPTIONS) {
      Alert.alert('Error', `Se requieren al menos ${MIN_OPTIONS} opciones`);
      return false;
    }

    // Check for duplicate options
    const uniqueOptions = new Set(validOptions.map((opt) => opt.trim().toLowerCase()));
    if (uniqueOptions.size !== validOptions.length) {
      Alert.alert('Error', 'Las opciones no pueden repetirse');
      return false;
    }

    // Validate end date if provided
    if (endDate.trim()) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(endDate.trim())) {
        Alert.alert('Error', 'Formato de fecha invalido. Use AAAA-MM-DD');
        return false;
      }
      const parsedDate = new Date(endDate.trim());
      if (isNaN(parsedDate.getTime())) {
        Alert.alert('Error', 'Fecha invalida');
        return false;
      }
      if (parsedDate < new Date()) {
        Alert.alert('Error', 'La fecha de finalizacion debe ser futura');
        return false;
      }
    }

    return true;
  };

  const handleCreate = useCallback(async () => {
    if (!validateForm()) return;

    if (!currentOrganization || !user?.id) {
      Alert.alert('Error', 'No autorizado');
      return;
    }

    setLoading(true);

    try {
      // Create poll
      const pollData: any = {
        organization_id: currentOrganization.id,
        created_by: user.id,
        title: title.trim(),
        description: description.trim() || null,
        status: 'active',
      };

      if (endDate.trim()) {
        pollData.ends_at = new Date(endDate.trim()).toISOString();
      }

      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert(pollData)
        .select()
        .single();

      if (pollError) throw pollError;

      // Create poll options
      const validOptions = options.filter((opt) => opt.trim());
      const optionsData = validOptions.map((optionText) => ({
        poll_id: poll.id,
        option_text: optionText.trim(),
        vote_count: 0,
      }));

      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(optionsData);

      if (optionsError) throw optionsError;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Exito', 'Encuesta creada correctamente', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error creating poll:', error);
      Alert.alert('Error', 'No se pudo crear la encuesta');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, [title, description, options, endDate, currentOrganization, user]);

  if (!isAdmin) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Nueva encuesta</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text variant="h1" center>
            :(
          </Text>
          <Text variant="h3" center style={{ marginTop: Spacing.md }}>
            Sin permisos
          </Text>
          <Text variant="body" color="secondary" center>
            Solo administradores pueden crear encuestas
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const validOptionsCount = options.filter((opt) => opt.trim()).length;
  const canSubmit = title.trim() && validOptionsCount >= MIN_OPTIONS;

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
          <Text variant="h2">Nueva encuesta</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Basic Info */}
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>
              Informacion basica
            </Text>
            <Card variant="filled" padding="md">
              <Input
                label="Titulo"
                placeholder="Titulo de la encuesta"
                value={title}
                onChangeText={setTitle}
                autoCapitalize="sentences"
              />
              <View style={styles.inputSpacing}>
                <Input
                  label="Descripcion (opcional)"
                  placeholder="Describe el proposito de la encuesta..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  autoCapitalize="sentences"
                />
              </View>
            </Card>
          </Animated.View>

          {/* Options */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <View style={styles.sectionHeader}>
              <Text variant="h4">Opciones</Text>
              <Text variant="caption" color="muted">
                {validOptionsCount}/{MAX_OPTIONS}
              </Text>
            </View>

            <Card variant="filled" padding="md">
              {options.map((option, index) => (
                <Animated.View key={index} entering={FadeIn.delay(index * 30)}>
                  <View style={[styles.optionRow, index > 0 && styles.optionSpacing]}>
                    <View style={styles.optionInput}>
                      <Input
                        label={`Opcion ${index + 1}`}
                        placeholder={`Escribe la opcion ${index + 1}`}
                        value={option}
                        onChangeText={(value) => handleOptionChange(index, value)}
                        autoCapitalize="sentences"
                      />
                    </View>
                    {options.length > MIN_OPTIONS && (
                      <Pressable
                        onPress={() => handleRemoveOption(index)}
                        style={[styles.removeButton, { backgroundColor: colors.errorBg }]}
                      >
                        <Trash2 size={20} color={colors.error} />
                      </Pressable>
                    )}
                  </View>
                </Animated.View>
              ))}

              {options.length < MAX_OPTIONS && (
                <Pressable
                  onPress={handleAddOption}
                  style={[styles.addOptionButton, { borderColor: colors.border }]}
                >
                  <Plus size={20} color={colors.accent} />
                  <Text variant="bodySm" customColor={colors.accent}>
                    Agregar opcion
                  </Text>
                </Pressable>
              )}
            </Card>
          </Animated.View>

          {/* End Date */}
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>
              Fecha de finalizacion (opcional)
            </Text>
            <Card variant="filled" padding="md">
              <Input
                label="Fecha limite"
                placeholder="AAAA-MM-DD (ej: 2024-12-31)"
                value={endDate}
                onChangeText={setEndDate}
                keyboardType="numbers-and-punctuation"
                leftElement={<Calendar size={20} color={colors.textMuted} />}
              />
              <Text variant="caption" color="muted" style={styles.helperText}>
                Deja vacio para una encuesta sin fecha limite
              </Text>
            </Card>
          </Animated.View>

          {/* Submit */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={styles.submitContainer}
          >
            <Button
              onPress={handleCreate}
              loading={loading}
              disabled={!canSubmit}
              fullWidth
              size="lg"
            >
              Crear encuesta
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
  errorContainer: {
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  inputSpacing: {
    marginTop: Spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  optionSpacing: {
    marginTop: Spacing.md,
  },
  optionInput: {
    flex: 1,
  },
  removeButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxs,
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
  },
  helperText: {
    marginTop: Spacing.sm,
  },
  submitContainer: {
    marginTop: Spacing.xl,
  },
});
