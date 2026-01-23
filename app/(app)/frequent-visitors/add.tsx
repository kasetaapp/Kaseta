/**
 * KASETA - Add Frequent Visitor
 * Save a new frequent visitor
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
import { ChevronLeft, User, Phone, Mail, FileText } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Text, Button, Input, Card } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase';

export default function AddFrequentVisitorScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentMembership } = useOrganization();

  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSave = useCallback(async () => {
    if (!visitorName.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }

    if (!currentMembership?.unit_id) {
      Alert.alert('Error', 'No tienes una unidad asignada');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('frequent_visitors').insert({
        unit_id: currentMembership.unit_id,
        visitor_name: visitorName.trim(),
        visitor_phone: visitorPhone.trim() || null,
        visitor_email: visitorEmail.trim() || null,
        notes: notes.trim() || null,
        visit_count: 0,
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Éxito', 'Visitante guardado correctamente', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error saving visitor:', error);
      Alert.alert('Error', 'No se pudo guardar el visitante');
    } finally {
      setLoading(false);
    }
  }, [visitorName, visitorPhone, visitorEmail, notes, currentMembership]);

  const isFormValid = visitorName.trim().length >= 2;

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
          <Text variant="h2">Nuevo visitante</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form */}
          <Animated.View entering={FadeInDown.delay(150).springify()}>
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

              <View style={styles.inputSpacing}>
                <Input
                  label="Email (opcional)"
                  placeholder="juan@email.com"
                  value={visitorEmail}
                  onChangeText={setVisitorEmail}
                  leftElement={<Mail size={18} color={colors.textMuted} />}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputSpacing}>
                <Input
                  label="Notas (opcional)"
                  placeholder="Ej: Familiar, proveedor de servicios..."
                  value={notes}
                  onChangeText={setNotes}
                  leftElement={<FileText size={18} color={colors.textMuted} />}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </Card>
          </Animated.View>

          {/* Save button */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.submitContainer}
          >
            <Button
              onPress={handleSave}
              loading={loading}
              disabled={!isFormValid}
              fullWidth
              size="lg"
            >
              Guardar visitante
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
    marginBottom: Spacing.sm,
  },
  inputSpacing: {
    marginTop: Spacing.md,
  },
  submitContainer: {
    marginTop: Spacing.xl,
  },
});
