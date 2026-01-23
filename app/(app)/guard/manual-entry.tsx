/**
 * KASETA - Guard Manual Entry Screen
 * Register visitor without QR code
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
import { ChevronLeft, User, Phone, Car, Building2, FileText } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Button, Input, Card } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function GuardManualEntryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSubmit = useCallback(async () => {
    if (!visitorName.trim()) {
      Alert.alert('Error', 'El nombre del visitante es requerido');
      return;
    }

    if (!unitNumber.trim()) {
      Alert.alert('Error', 'El número de unidad es requerido');
      return;
    }

    if (!currentOrganization || !user?.id) {
      Alert.alert('Error', 'No autorizado');
      return;
    }

    setLoading(true);

    try {
      // Find unit by number
      const { data: unit, error: unitError } = await supabase
        .from('units')
        .select('id')
        .eq('organization_id', currentOrganization.id)
        .eq('unit_number', unitNumber.trim())
        .single();

      if (unitError || !unit) {
        Alert.alert('Error', `Unidad ${unitNumber} no encontrada`);
        setLoading(false);
        return;
      }

      // Create access log
      const { error } = await supabase.from('access_logs').insert({
        organization_id: currentOrganization.id,
        unit_id: unit.id,
        visitor_name: visitorName.trim(),
        visitor_phone: visitorPhone.trim() || null,
        vehicle_plate: vehiclePlate.trim().toUpperCase() || null,
        access_type: 'manual',
        entry_method: 'manual',
        direction: 'entry',
        granted_by: user.id,
        notes: notes.trim() || null,
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Éxito', 'Entrada registrada correctamente', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error creating entry:', error);
      Alert.alert('Error', 'No se pudo registrar la entrada');
    } finally {
      setLoading(false);
    }
  }, [visitorName, visitorPhone, vehiclePlate, unitNumber, notes, currentOrganization, user]);

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
          <Text variant="h2">Entrada Manual</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Visitor Info */}
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>Información del visitante</Text>
            <Card variant="filled" padding="md">
              <View style={styles.inputRow}>
                <User size={20} color={colors.textMuted} />
                <Input
                  placeholder="Nombre completo *"
                  value={visitorName}
                  onChangeText={setVisitorName}
                  style={styles.input}
                />
              </View>
              <View style={styles.inputRow}>
                <Phone size={20} color={colors.textMuted} />
                <Input
                  placeholder="Teléfono (opcional)"
                  value={visitorPhone}
                  onChangeText={setVisitorPhone}
                  keyboardType="phone-pad"
                  style={styles.input}
                />
              </View>
              <View style={styles.inputRow}>
                <Car size={20} color={colors.textMuted} />
                <Input
                  placeholder="Placas del vehículo (opcional)"
                  value={vehiclePlate}
                  onChangeText={setVehiclePlate}
                  autoCapitalize="characters"
                  style={styles.input}
                />
              </View>
            </Card>
          </Animated.View>

          {/* Destination */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>Destino</Text>
            <Card variant="filled" padding="md">
              <View style={styles.inputRow}>
                <Building2 size={20} color={colors.textMuted} />
                <Input
                  placeholder="Número de unidad *"
                  value={unitNumber}
                  onChangeText={setUnitNumber}
                  style={styles.input}
                />
              </View>
            </Card>
          </Animated.View>

          {/* Notes */}
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>Notas (opcional)</Text>
            <Card variant="filled" padding="md">
              <View style={styles.inputRow}>
                <FileText size={20} color={colors.textMuted} style={{ alignSelf: 'flex-start', marginTop: 10 }} />
                <Input
                  placeholder="Observaciones adicionales..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                />
              </View>
            </Card>
          </Animated.View>

          {/* Submit */}
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.submitContainer}>
            <Button
              onPress={handleSubmit}
              loading={loading}
              disabled={!visitorName.trim() || !unitNumber.trim()}
              fullWidth
              size="lg"
            >
              Registrar entrada
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  input: { flex: 1 },
  submitContainer: { marginTop: Spacing.xl },
});
