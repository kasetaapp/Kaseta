/**
 * KASETA - Frequent Visitors List
 * Manage saved visitors for quick invitations
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
import { ChevronLeft, Plus, User, Phone, Mail, Trash2, Send } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Avatar, Badge, Button, Skeleton, EmptyState, IconButton } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase';

interface FrequentVisitor {
  id: string;
  visitor_name: string;
  visitor_phone: string | null;
  visitor_email: string | null;
  notes: string | null;
  visit_count: number;
  last_visit: string | null;
  created_at: string;
}

export default function FrequentVisitorsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentMembership } = useOrganization();

  const [visitors, setVisitors] = useState<FrequentVisitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVisitors = useCallback(async () => {
    if (!currentMembership?.unit_id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('frequent_visitors')
        .select('*')
        .eq('unit_id', currentMembership.unit_id)
        .order('visit_count', { ascending: false });

      if (error) throw error;
      setVisitors(data || []);
    } catch (error) {
      console.error('Error fetching frequent visitors:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentMembership]);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchVisitors();
    setRefreshing(false);
  }, [fetchVisitors]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleAddVisitor = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(app)/frequent-visitors/add');
  };

  const handleQuickInvite = (visitor: FrequentVisitor) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/(app)/invitation/create',
      params: {
        prefillName: visitor.visitor_name,
        prefillPhone: visitor.visitor_phone || '',
        prefillEmail: visitor.visitor_email || '',
      },
    });
  };

  const handleDeleteVisitor = (visitor: FrequentVisitor) => {
    Alert.alert(
      'Eliminar visitante',
      `¿Eliminar a ${visitor.visitor_name} de tus visitantes frecuentes?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            try {
              const { error } = await supabase
                .from('frequent_visitors')
                .delete()
                .eq('id', visitor.id);

              if (error) throw error;
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              fetchVisitors();
            } catch (error) {
              console.error('Error deleting visitor:', error);
              Alert.alert('Error', 'No se pudo eliminar el visitante');
            }
          },
        },
      ]
    );
  };

  const renderVisitor = ({ item, index }: { item: FrequentVisitor; index: number }) => (
    <Animated.View entering={FadeIn.delay(index * 50)}>
      <Card variant="outlined" style={styles.visitorCard} padding="md">
        <View style={styles.visitorRow}>
          <Avatar name={item.visitor_name} size="md" />

          <View style={styles.visitorInfo}>
            <Text variant="bodyMedium">{item.visitor_name}</Text>
            {item.visitor_phone && (
              <View style={styles.contactRow}>
                <Phone size={12} color={colors.textMuted} />
                <Text variant="caption" color="muted">{item.visitor_phone}</Text>
              </View>
            )}
            <View style={styles.statsRow}>
              <Badge variant="accent" size="sm">
                {`${item.visit_count} visitas`}
              </Badge>
              {item.last_visit && (
                <Text variant="caption" color="muted">
                  Última: {new Date(item.last_visit).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.visitorActions}>
            <IconButton
              icon={<Send size={18} color={colors.accent} />}
              onPress={() => handleQuickInvite(item)}
              variant="default"
              size="sm"
            />
            <IconButton
              icon={<Trash2 size={18} color={colors.error} />}
              onPress={() => handleDeleteVisitor(item)}
              variant="default"
              size="sm"
            />
          </View>
        </View>
      </Card>
    </Animated.View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Visitantes frecuentes</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.content}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={90} style={{ marginBottom: Spacing.md }} />
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
        <Text variant="h2">Visitantes frecuentes</Text>
        <Pressable onPress={handleAddVisitor} style={styles.addButton}>
          <Plus size={24} color={colors.accent} />
        </Pressable>
      </Animated.View>

      {/* List */}
      {visitors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="👥"
            title="Sin visitantes guardados"
            description="Guarda a tus visitantes frecuentes para crear invitaciones más rápido"
            actionLabel="Agregar visitante"
            onAction={handleAddVisitor}
          />
        </View>
      ) : (
        <FlatList
          data={visitors}
          keyExtractor={(item) => item.id}
          renderItem={renderVisitor}
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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  visitorCard: {
    marginBottom: Spacing.md,
  },
  visitorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visitorInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xxs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  visitorActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
});
