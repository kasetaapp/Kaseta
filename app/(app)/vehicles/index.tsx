/**
 * KASETA - Vehicles List Screen
 * View and manage registered vehicles
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Plus, Car, Trash2 } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Badge, Button, Skeleton, EmptyState } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase';

interface Vehicle {
  id: string;
  license_plate: string;
  make: string | null;
  model: string | null;
  color: string | null;
  is_primary: boolean;
  created_at: string;
}

const COLOR_MAP: Record<string, string> = {
  white: 'Blanco',
  black: 'Negro',
  silver: 'Plata',
  gray: 'Gris',
  red: 'Rojo',
  blue: 'Azul',
  green: 'Verde',
  yellow: 'Amarillo',
  orange: 'Naranja',
  brown: 'Café',
  beige: 'Beige',
};

export default function VehiclesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentMembership, currentUnit } = useOrganization();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVehicles = useCallback(async () => {
    if (!currentMembership?.unit_id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('unit_id', currentMembership.unit_id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentMembership]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchVehicles();
    setRefreshing(false);
  }, [fetchVehicles]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleAddVehicle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(app)/vehicles/add');
  };

  const handleSetPrimary = async (vehicleId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // First, unset all as primary
      await supabase
        .from('vehicles')
        .update({ is_primary: false })
        .eq('unit_id', currentMembership?.unit_id);

      // Set the selected one as primary
      const { error } = await supabase
        .from('vehicles')
        .update({ is_primary: true })
        .eq('id', vehicleId);

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fetchVehicles();
    } catch (error) {
      console.error('Error setting primary vehicle:', error);
      Alert.alert('Error', 'No se pudo establecer como vehículo principal');
    }
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    Alert.alert(
      'Eliminar vehículo',
      `¿Estás seguro de que deseas eliminar ${vehicle.make} ${vehicle.model} (${vehicle.license_plate})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            try {
              const { error } = await supabase
                .from('vehicles')
                .delete()
                .eq('id', vehicle.id);

              if (error) throw error;

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              fetchVehicles();
            } catch (error) {
              console.error('Error deleting vehicle:', error);
              Alert.alert('Error', 'No se pudo eliminar el vehículo');
            }
          },
        },
      ]
    );
  };

  const renderVehicle = ({ item, index }: { item: Vehicle; index: number }) => {
    const colorLabel = item.color ? COLOR_MAP[item.color.toLowerCase()] || item.color : null;

    return (
      <Animated.View entering={FadeIn.delay(index * 50)}>
        <Card
          variant={item.is_primary ? 'elevated' : 'outlined'}
          style={[
            styles.vehicleCard,
            item.is_primary && { borderColor: colors.accent, borderWidth: 1 },
          ]}
          padding="md"
        >
          <View style={styles.vehicleRow}>
            <View style={[styles.vehicleIcon, { backgroundColor: colors.surface }]}>
              <Car size={24} color={colors.textMuted} />
            </View>

            <View style={styles.vehicleInfo}>
              <View style={styles.vehicleHeader}>
                <Text variant="h4">{item.license_plate}</Text>
                {item.is_primary && (
                  <Badge variant="accent" size="sm">
                    Principal
                  </Badge>
                )}
              </View>
              <Text variant="body" color="secondary">
                {[item.make, item.model].filter(Boolean).join(' ') || 'Vehículo'}
              </Text>
              {colorLabel && (
                <Text variant="caption" color="muted">
                  {colorLabel}
                </Text>
              )}
            </View>

            <View style={styles.vehicleActions}>
              {!item.is_primary && (
                <Pressable
                  onPress={() => handleSetPrimary(item.id)}
                  style={[styles.actionButton, { backgroundColor: colors.surface }]}
                >
                  <Text variant="caption" color="secondary">
                    Principal
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => handleDeleteVehicle(item)}
                style={[styles.actionButton, { backgroundColor: colors.errorBg }]}
              >
                <Trash2 size={16} color={colors.error} />
              </Pressable>
            </View>
          </View>
        </Card>
      </Animated.View>
    );
  };

  if (!currentMembership?.unit_id) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Vehículos</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centeredContent}>
          <EmptyState
            icon="🚗"
            title="Sin unidad asignada"
            description="Necesitas tener una unidad asignada para registrar vehículos"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Vehículos</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.content}>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              width="100%"
              height={100}
              style={{ marginBottom: Spacing.md }}
            />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.delay(100).springify()}
        style={styles.header}
      >
        <Pressable onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text variant="h2">Vehículos</Text>
        <Pressable onPress={handleAddVehicle} style={styles.addButton}>
          <Plus size={24} color={colors.accent} />
        </Pressable>
      </Animated.View>

      {/* Unit info */}
      {currentUnit && (
        <Animated.View
          entering={FadeInDown.delay(150).springify()}
          style={styles.unitInfo}
        >
          <Text variant="caption" color="muted">
            Vehículos registrados para {currentUnit.name}
          </Text>
        </Animated.View>
      )}

      {/* Vehicles list */}
      {vehicles.length === 0 ? (
        <View style={styles.centeredContent}>
          <EmptyState
            icon="🚗"
            title="Sin vehículos"
            description="Agrega tus vehículos para facilitar el acceso"
            actionLabel="Agregar vehículo"
            onAction={handleAddVehicle}
          />
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          renderItem={renderVehicle}
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
  container: {
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
  addButton: {
    padding: Spacing.xs,
  },
  unitInfo: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  vehicleCard: {
    marginBottom: Spacing.md,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  vehicleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
});
