/**
 * KASETA - Reserve Amenity Screen
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Calendar, Clock } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Button, Card, Input } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
];

export default function ReserveAmenityScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentMembership } = useOrganization();
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [duration, setDuration] = useState('2');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  const handleDateSelect = (date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(date);
  };

  const handleTimeSelect = (time: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTime(time);
  };

  const handleReserve = useCallback(async () => {
    if (!selectedTime || !id || !user?.id || !currentMembership?.unit_id) {
      Alert.alert('Error', 'Selecciona una hora para la reservación');
      return;
    }

    setLoading(true);

    try {
      const startTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + parseInt(duration));

      const { error } = await supabase.from('amenity_reservations').insert({
        amenity_id: id,
        unit_id: currentMembership.unit_id,
        reserved_by: user.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        notes: notes.trim() || null,
        status: 'confirmed',
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Éxito', 'Reservación confirmada', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error creating reservation:', error);
      Alert.alert('Error', 'No se pudo crear la reservación');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedTime, duration, notes, id, user, currentMembership]);

  const formatDay = (date: Date): string => {
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Hoy';
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) return 'Mañana';
    return date.toLocaleDateString('es-MX', { weekday: 'short' });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text variant="h2">Reservar</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <Text variant="h3" style={styles.amenityName}>{name}</Text>
        </Animated.View>

        {/* Date Selection */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={styles.sectionHeader}>
            <Calendar size={18} color={colors.textMuted} />
            <Text variant="h4">Fecha</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesScroll}>
            {dates.map((date) => {
              const isSelected = date.toDateString() === selectedDate.toDateString();
              return (
                <Pressable
                  key={date.toISOString()}
                  onPress={() => handleDateSelect(date)}
                  style={[
                    styles.dateItem,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.surface,
                      borderColor: isSelected ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text
                    variant="caption"
                    customColor={isSelected ? colors.textOnAccent : colors.textSecondary}
                  >
                    {formatDay(date)}
                  </Text>
                  <Text
                    variant="h3"
                    customColor={isSelected ? colors.textOnAccent : colors.text}
                  >
                    {date.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Time Selection */}
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <View style={styles.sectionHeader}>
            <Clock size={18} color={colors.textMuted} />
            <Text variant="h4">Hora de inicio</Text>
          </View>
          <View style={styles.timesGrid}>
            {TIME_SLOTS.map((time) => {
              const isSelected = time === selectedTime;
              return (
                <Pressable
                  key={time}
                  onPress={() => handleTimeSelect(time)}
                  style={[
                    styles.timeItem,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.surface,
                      borderColor: isSelected ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text
                    variant="bodyMedium"
                    customColor={isSelected ? colors.textOnAccent : colors.text}
                  >
                    {time}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Duration */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>Duración (horas)</Text>
          <View style={styles.durationRow}>
            {['1', '2', '3', '4'].map((d) => (
              <Pressable
                key={d}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDuration(d);
                }}
                style={[
                  styles.durationItem,
                  {
                    backgroundColor: duration === d ? colors.accent : colors.surface,
                    borderColor: duration === d ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text
                  variant="bodyMedium"
                  customColor={duration === d ? colors.textOnAccent : colors.text}
                >
                  {d}h
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Notes */}
        <Animated.View entering={FadeInDown.delay(350).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>Notas (opcional)</Text>
          <Card variant="filled" padding="md">
            <Input
              placeholder="Notas adicionales..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </Card>
        </Animated.View>

        {/* Submit */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.submitContainer}>
          <Button
            onPress={handleReserve}
            loading={loading}
            disabled={!selectedTime}
            fullWidth
            size="lg"
          >
            Confirmar reservación
          </Button>
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
  amenityName: { marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  sectionTitle: { marginTop: Spacing.lg, marginBottom: Spacing.sm },
  datesScroll: { marginBottom: Spacing.lg },
  dateItem: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginRight: Spacing.sm,
    minWidth: 70,
  },
  timesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  timeItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  durationRow: { flexDirection: 'row', gap: Spacing.sm },
  durationItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  submitContainer: { marginTop: Spacing.xl },
});
