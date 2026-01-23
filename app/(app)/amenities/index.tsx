/**
 * KASETA - Amenities Screen
 * View and reserve community amenities
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Calendar, Clock, Users } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Badge, Skeleton, EmptyState, Button } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase';

interface Amenity {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  capacity: number | null;
  requires_reservation: boolean;
  available: boolean;
}

const DEFAULT_ICONS: Record<string, string> = {
  pool: '🏊',
  gym: '💪',
  salon: '🎉',
  bbq: '🍖',
  court: '🏀',
  playground: '🎠',
  default: '🏢',
};

export default function AmenitiesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentOrganization } = useOrganization();

  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAmenities = useCallback(async () => {
    if (!currentOrganization) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('amenities')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('name');

      if (error) throw error;
      setAmenities(data || []);
    } catch (error) {
      console.error('Error fetching amenities:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    fetchAmenities();
  }, [fetchAmenities]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchAmenities();
    setRefreshing(false);
  }, [fetchAmenities]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleReserve = (amenity: Amenity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/(app)/amenities/reserve',
      params: { id: amenity.id, name: amenity.name },
    });
  };

  const handleViewDetails = (amenity: Amenity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/(app)/amenities/[id]',
      params: { id: amenity.id },
    });
  };

  const renderAmenity = ({ item, index }: { item: Amenity; index: number }) => {
    const icon = item.icon || DEFAULT_ICONS[item.name.toLowerCase()] || DEFAULT_ICONS.default;

    return (
      <Animated.View entering={FadeIn.delay(index * 50)}>
        <Card
          variant="elevated"
          style={styles.amenityCard}
          padding="lg"
          pressable
          onPress={() => handleViewDetails(item)}
        >
          <View style={styles.amenityHeader}>
            <View style={[styles.iconContainer, { backgroundColor: colors.accent + '20' }]}>
              <Text variant="displayLg">{icon}</Text>
            </View>
            <View style={styles.amenityInfo}>
              <Text variant="h3">{item.name}</Text>
              {item.description && (
                <Text variant="bodySm" color="secondary" numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.amenityMeta}>
            {item.capacity && (
              <View style={styles.metaItem}>
                <Users size={14} color={colors.textMuted} />
                <Text variant="caption" color="muted">
                  Hasta {item.capacity} personas
                </Text>
              </View>
            )}
            <Badge variant={item.available ? 'success' : 'error'} size="sm">
              {item.available ? 'Disponible' : 'No disponible'}
            </Badge>
          </View>

          {item.requires_reservation && item.available && (
            <Button
              variant="secondary"
              size="sm"
              onPress={() => handleReserve(item)}
              style={styles.reserveButton}
            >
              Reservar
            </Button>
          )}
        </Card>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Amenidades</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.content}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={160} style={{ marginBottom: Spacing.md }} />
          ))}
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
        <Text variant="h2">Amenidades</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      {amenities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="🏢"
            title="Sin amenidades"
            description="Las amenidades de tu comunidad aparecerán aquí"
          />
        </View>
      ) : (
        <FlatList
          data={amenities}
          keyExtractor={(item) => item.id}
          renderItem={renderAmenity}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        />
      )}
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
  content: { flex: 1, paddingHorizontal: Spacing.lg },
  emptyContainer: { flex: 1, justifyContent: 'center', padding: Spacing.lg },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  amenityCard: { marginBottom: Spacing.md },
  amenityHeader: { flexDirection: 'row', marginBottom: Spacing.md },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenityInfo: { flex: 1, marginLeft: Spacing.md, justifyContent: 'center' },
  amenityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  reserveButton: { marginTop: Spacing.md },
});
