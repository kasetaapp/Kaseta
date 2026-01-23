/**
 * KASETA - Pets List Screen
 * View and manage registered pets
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
import { ChevronLeft, Plus, PawPrint, Trash2, Dog, Cat } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Badge, Button, Skeleton, EmptyState } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Pet {
  id: string;
  user_id: string;
  unit_id: string;
  organization_id: string;
  name: string;
  type: 'dog' | 'cat' | 'other';
  breed: string | null;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  dog: 'Perro',
  cat: 'Gato',
  other: 'Otro',
};

export default function PetsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { user } = useAuth();
  const { currentMembership, currentUnit, currentOrganization } = useOrganization();

  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPets = useCallback(async () => {
    if (!currentMembership?.unit_id || !user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('unit_id', currentMembership.unit_id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPets(data || []);
    } catch (error) {
      console.error('Error fetching pets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentMembership, user]);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchPets();
    setRefreshing(false);
  }, [fetchPets]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleAddPet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(app)/pets/add');
  };

  const handleDeletePet = (pet: Pet) => {
    Alert.alert(
      'Eliminar mascota',
      `¿Estás seguro de que deseas eliminar a ${pet.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            try {
              const { error } = await supabase
                .from('pets')
                .delete()
                .eq('id', pet.id);

              if (error) throw error;

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              fetchPets();
            } catch (error) {
              console.error('Error deleting pet:', error);
              Alert.alert('Error', 'No se pudo eliminar la mascota');
            }
          },
        },
      ]
    );
  };

  const getPetIcon = (type: string) => {
    switch (type) {
      case 'dog':
        return <Dog size={24} color={colors.textMuted} />;
      case 'cat':
        return <Cat size={24} color={colors.textMuted} />;
      default:
        return <PawPrint size={24} color={colors.textMuted} />;
    }
  };

  const renderPet = ({ item, index }: { item: Pet; index: number }) => {
    return (
      <Animated.View entering={FadeIn.delay(index * 50)}>
        <Card
          variant="outlined"
          style={styles.petCard}
          padding="md"
        >
          <View style={styles.petRow}>
            <View style={[styles.petIcon, { backgroundColor: colors.surface }]}>
              {getPetIcon(item.type)}
            </View>

            <View style={styles.petInfo}>
              <View style={styles.petHeader}>
                <Text variant="h4">{item.name}</Text>
                <Badge variant="info" size="sm">
                  {TYPE_LABELS[item.type] || item.type}
                </Badge>
              </View>
              {item.breed && (
                <Text variant="body" color="secondary">
                  {item.breed}
                </Text>
              )}
              {item.notes && (
                <Text variant="caption" color="muted" numberOfLines={1}>
                  {item.notes}
                </Text>
              )}
            </View>

            <View style={styles.petActions}>
              <Pressable
                onPress={() => handleDeletePet(item)}
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
          <Text variant="h2">Mascotas</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centeredContent}>
          <EmptyState
            icon={<PawPrint size={32} color={colors.textMuted} />}
            title="Sin unidad asignada"
            description="Necesitas tener una unidad asignada para registrar mascotas"
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
          <Text variant="h2">Mascotas</Text>
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
        <Text variant="h2">Mascotas</Text>
        <Pressable onPress={handleAddPet} style={styles.addButton}>
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
            Mascotas registradas para {currentUnit.name}
          </Text>
        </Animated.View>
      )}

      {/* Pets list */}
      {pets.length === 0 ? (
        <View style={styles.centeredContent}>
          <EmptyState
            icon={<PawPrint size={32} color={colors.textMuted} />}
            title="Sin mascotas"
            description="Registra tus mascotas para mantener un control dentro del condominio"
            actionLabel="Agregar mascota"
            onAction={handleAddPet}
          />
        </View>
      ) : (
        <FlatList
          data={pets}
          keyExtractor={(item) => item.id}
          renderItem={renderPet}
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
  petCard: {
    marginBottom: Spacing.md,
  },
  petRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  petHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  petActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
});
