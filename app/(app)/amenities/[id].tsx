/**
 * KASETA - Amenity Detail Screen
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Users, Clock, Calendar } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Text, Card, Badge, Skeleton, Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';

export default function AmenityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const [amenity, setAmenity] = useState<any>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAmenity = useCallback(async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('amenities')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setAmenity(data);

      // Fetch upcoming reservations
      const { data: resData } = await supabase
        .from('amenity_reservations')
        .select('*')
        .eq('amenity_id', id)
        .gte('start_time', new Date().toISOString())
        .order('start_time')
        .limit(5);

      setReservations(resData || []);
    } catch (error) {
      console.error('Error fetching amenity:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAmenity();
  }, [fetchAmenity]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleReserve = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/(app)/amenities/reserve',
      params: { id: amenity.id, name: amenity.name },
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Skeleton width={150} height={24} />
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.content}>
          <Skeleton width="100%" height={200} />
        </View>
      </SafeAreaView>
    );
  }

  if (!amenity) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Amenidad</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text variant="h1" center>😕</Text>
          <Text variant="h3" center style={{ marginTop: Spacing.md }}>Amenidad no encontrada</Text>
          <Button onPress={handleBack} style={{ marginTop: Spacing.xl }}>Volver</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text variant="h2">{amenity.name}</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Icon & Status */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.heroContainer}>
          <View style={[styles.heroIcon, { backgroundColor: colors.accent + '20' }]}>
            <Text style={styles.heroEmoji}>{amenity.icon || '🏢'}</Text>
          </View>
          <Badge variant={amenity.available ? 'success' : 'error'} size="md">
            {amenity.available ? 'Disponible' : 'No disponible'}
          </Badge>
        </Animated.View>

        {/* Description */}
        {amenity.description && (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Card variant="filled" padding="lg">
              <Text variant="body" style={styles.description}>{amenity.description}</Text>
            </Card>
          </Animated.View>
        )}

        {/* Info */}
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>Información</Text>
          <Card variant="filled" padding="md">
            {amenity.capacity && (
              <View style={styles.infoRow}>
                <Users size={18} color={colors.textMuted} />
                <Text variant="body">Capacidad máxima: {amenity.capacity} personas</Text>
              </View>
            )}
            <View style={[styles.infoRow, amenity.capacity && { marginTop: Spacing.md }]}>
              <Calendar size={18} color={colors.textMuted} />
              <Text variant="body">
                {amenity.requires_reservation ? 'Requiere reservación' : 'No requiere reservación'}
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Upcoming reservations */}
        {reservations.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>Próximas reservaciones</Text>
            {reservations.map((res, i) => (
              <Card key={res.id} variant="outlined" padding="sm" style={i > 0 && { marginTop: Spacing.sm }}>
                <View style={styles.reservationRow}>
                  <Clock size={14} color={colors.textMuted} />
                  <Text variant="bodySm" color="secondary">
                    {new Date(res.start_time).toLocaleString('es-MX', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </Card>
            ))}
          </Animated.View>
        )}

        {/* Reserve button */}
        {amenity.requires_reservation && amenity.available && (
          <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.reserveContainer}>
            <Button onPress={handleReserve} fullWidth size="lg">
              Reservar ahora
            </Button>
          </Animated.View>
        )}
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
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  heroContainer: { alignItems: 'center', marginBottom: Spacing.lg },
  heroIcon: {
    width: 100,
    height: 100,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  heroEmoji: { fontSize: 48 },
  description: { lineHeight: 24 },
  sectionTitle: { marginTop: Spacing.lg, marginBottom: Spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  reservationRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  reserveContainer: { marginTop: Spacing.xl },
});
