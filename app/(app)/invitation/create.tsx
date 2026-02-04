/**
 * KASETA - Create Invitation Screen
 * Form to create new visitor invitations
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ChevronLeft, Calendar, Clock, User, Phone, Mail, FileText } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Button, Input, Card, Badge } from '@/components/ui';
import { useInvitations } from '@/hooks/useInvitations';
import { InvitationType } from '@/lib/invitations';

const INVITATION_TYPES: { key: InvitationType; label: string; description: string; icon: string }[] = [
  {
    key: 'single',
    label: 'Uso único',
    description: 'Válida para una sola entrada',
    icon: '1️⃣',
  },
  {
    key: 'recurring',
    label: 'Recurrente',
    description: 'Válida para varias entradas',
    icon: '🔄',
  },
  {
    key: 'temporary',
    label: 'Temporal',
    description: 'Válida por un periodo de tiempo',
    icon: '⏰',
  },
];

export default function CreateInvitationScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { create } = useInvitations();

  // Form state
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [invitationType, setInvitationType] = useState<InvitationType>('single');
  const [validFrom, setValidFrom] = useState(new Date());
  const [validUntil, setValidUntil] = useState<Date>(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Default: tomorrow
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Date picker state
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showUntilPicker, setShowUntilPicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const handleInvitationTypeChange = useCallback((type: InvitationType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInvitationType(type);

    // Set default validUntil based on type
    if (type === 'temporary' || type === 'recurring') {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setValidUntil(nextWeek);
    } else {
      // Single use - default to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setValidUntil(tomorrow);
    }
  }, []);

  const handleCreateInvitation = useCallback(async () => {
    if (!visitorName.trim()) {
      setError('El nombre del visitante es requerido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const invitation = await create({
        visitor_name: visitorName.trim(),
        visitor_phone: visitorPhone.trim() || undefined,
        visitor_email: visitorEmail.trim() || undefined,
        type: invitationType,
        valid_from: validFrom,
        valid_until: validUntil,
        notes: notes.trim() || undefined,
      });

      if (invitation) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace({
          pathname: '/(app)/invitation/[id]',
          params: { id: invitation.id },
        });
      } else {
        setError('No se pudo crear la invitación. Intenta de nuevo.');
      }
    } catch (err) {
      setError('Error al crear la invitación');
    } finally {
      setLoading(false);
    }
  }, [
    visitorName,
    visitorPhone,
    visitorEmail,
    invitationType,
    validFrom,
    validUntil,
    notes,
    create,
  ]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
          <Text variant="h2">Nueva invitación</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Visitor Info */}
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
                  placeholder="visitante@email.com"
                  value={visitorEmail}
                  onChangeText={setVisitorEmail}
                  leftElement={<Mail size={18} color={colors.textMuted} />}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </Card>
          </Animated.View>

          {/* Access Type */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>
              Tipo de acceso
            </Text>
            <View style={styles.invitationTypes}>
              {INVITATION_TYPES.map((type) => (
                <Pressable
                  key={type.key}
                  onPress={() => handleInvitationTypeChange(type.key)}
                  style={[
                    styles.invitationTypeCard,
                    {
                      backgroundColor:
                        invitationType === type.key
                          ? colors.accent + '15'
                          : colors.surface,
                      borderColor:
                        invitationType === type.key
                          ? colors.accent
                          : colors.border,
                    },
                  ]}
                >
                  <Text variant="display">{type.icon}</Text>
                  <View style={styles.invitationTypeInfo}>
                    <Text
                      variant="bodyMedium"
                      customColor={
                        invitationType === type.key
                          ? colors.primary
                          : colors.text
                      }
                    >
                      {type.label}
                    </Text>
                    <Text variant="caption" color="muted" numberOfLines={1}>
                      {type.description}
                    </Text>
                  </View>
                  {invitationType === type.key && (
                    <Badge variant="accent" size="sm">
                      ✓
                    </Badge>
                  )}
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Date/Time */}
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>
              Vigencia
            </Text>
            <Card variant="filled" padding="md">
              <Pressable
                onPress={() => {
                  setDatePickerMode('date');
                  setShowFromPicker(true);
                }}
                style={styles.dateButton}
              >
                <Calendar size={18} color={colors.textMuted} />
                <View style={styles.dateInfo}>
                  <Text variant="caption" color="muted">
                    Válida desde
                  </Text>
                  <Text variant="bodyMedium">{formatDate(validFrom)}</Text>
                </View>
              </Pressable>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Pressable
                onPress={() => {
                  setDatePickerMode('date');
                  setShowUntilPicker(true);
                }}
                style={styles.dateButton}
              >
                <Clock size={18} color={colors.textMuted} />
                <View style={styles.dateInfo}>
                  <Text variant="caption" color="muted">
                    Válida hasta
                  </Text>
                  <Text variant="bodyMedium">
                    {formatDate(validUntil)}
                  </Text>
                </View>
              </Pressable>
            </Card>
          </Animated.View>

          {/* Notes */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>
              Notas (opcional)
            </Text>
            <Card variant="filled" padding="md">
              <Input
                placeholder="Ej: Proveedor de internet, visita familiar..."
                value={notes}
                onChangeText={setNotes}
                leftElement={<FileText size={18} color={colors.textMuted} />}
                multiline
                numberOfLines={3}
              />
            </Card>
          </Animated.View>

          {/* Error */}
          {error && (
            <Animated.View entering={FadeInDown.springify()}>
              <Text variant="bodySm" color="error" center style={styles.error}>
                {error}
              </Text>
            </Animated.View>
          )}

          {/* Submit */}
          <Animated.View
            entering={FadeInDown.delay(350).springify()}
            style={styles.submitContainer}
          >
            <Button
              onPress={handleCreateInvitation}
              loading={loading}
              disabled={!isFormValid}
              fullWidth
              size="lg"
            >
              Crear invitación
            </Button>
          </Animated.View>
        </ScrollView>

        {/* Date Pickers */}
        {showFromPicker && (
          <DateTimePicker
            value={validFrom}
            mode={datePickerMode}
            is24Hour
            onChange={(event, date) => {
              setShowFromPicker(Platform.OS === 'ios');
              if (date) {
                if (datePickerMode === 'date') {
                  setValidFrom(date);
                  if (Platform.OS === 'android') {
                    setDatePickerMode('time');
                    setShowFromPicker(true);
                  }
                } else {
                  setValidFrom(date);
                }
              }
            }}
          />
        )}

        {showUntilPicker && (
          <DateTimePicker
            value={validUntil || new Date()}
            mode={datePickerMode}
            is24Hour
            minimumDate={validFrom}
            onChange={(event, date) => {
              setShowUntilPicker(Platform.OS === 'ios');
              if (date) {
                if (datePickerMode === 'date') {
                  setValidUntil(date);
                  if (Platform.OS === 'android') {
                    setDatePickerMode('time');
                    setShowUntilPicker(true);
                  }
                } else {
                  setValidUntil(date);
                }
              }
            }}
          />
        )}
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
  invitationTypes: {
    gap: Spacing.sm,
  },
  invitationTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.smd,
  },
  invitationTypeInfo: {
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.smd,
    paddingVertical: Spacing.sm,
  },
  dateInfo: {
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  maxUsesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  maxUsesInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  maxUsesButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maxUsesValue: {
    width: 40,
    textAlign: 'center',
  },
  error: {
    marginTop: Spacing.md,
  },
  submitContainer: {
    marginTop: Spacing.xl,
  },
});
