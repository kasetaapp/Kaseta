/**
 * KASETA - Packages Screen
 * Track incoming packages and deliveries
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
import { ChevronLeft, Package, ChevronRight, Truck, CheckCircle, Clock } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Badge, Skeleton, EmptyState } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase';

interface PackageItem {
  id: string;
  tracking_number: string | null;
  carrier: string | null;
  description: string | null;
  status: 'pending' | 'received' | 'picked_up' | 'returned';
  received_at: string;
  picked_up_at: string | null;
  received_by: string | null;
}

const STATUS_CONFIG = {
  pending: { label: 'En tránsito', color: '#F59E0B', icon: Truck },
  received: { label: 'Recibido', color: '#3B82F6', icon: Package },
  picked_up: { label: 'Entregado', color: '#10B981', icon: CheckCircle },
  returned: { label: 'Devuelto', color: '#6B7280', icon: Clock },
};

const CARRIER_ICONS: Record<string, string> = {
  fedex: '📦',
  ups: '📦',
  dhl: '📦',
  estafeta: '📦',
  amazon: '📦',
  mercadolibre: '🛒',
  default: '📦',
};

export default function PackagesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentMembership } = useOrganization();

  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPackages = useCallback(async () => {
    if (!currentMembership?.unit_id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('unit_id', currentMembership.unit_id)
        .order('received_at', { ascending: false });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentMembership]);

  useEffect(() => {
    fetchPackages();

    // Real-time subscription
    if (!currentMembership?.unit_id) return;

    const channel = supabase
      .channel('packages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'packages',
          filter: `unit_id=eq.${currentMembership.unit_id}`,
        },
        () => {
          fetchPackages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPackages, currentMembership]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchPackages();
    setRefreshing(false);
  }, [fetchPackages]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleViewPackage = (pkg: PackageItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/(app)/packages/[id]',
      params: { id: pkg.id },
    });
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Hoy, ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return `Ayer, ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderPackage = ({ item, index }: { item: PackageItem; index: number }) => {
    const statusConfig = STATUS_CONFIG[item.status];
    const StatusIcon = statusConfig.icon;
    const carrierIcon = item.carrier
      ? CARRIER_ICONS[item.carrier.toLowerCase()] || CARRIER_ICONS.default
      : CARRIER_ICONS.default;

    return (
      <Animated.View entering={FadeIn.delay(index * 50)}>
        <Card
          variant="elevated"
          style={styles.packageCard}
          padding="md"
          pressable
          onPress={() => handleViewPackage(item)}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: statusConfig.color + '20' }]}>
              <Text variant="h2">{carrierIcon}</Text>
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.titleRow}>
                <Text variant="h4" numberOfLines={1} style={styles.titleText}>
                  {item.carrier || 'Paquete'}
                </Text>
                <ChevronRight size={18} color={colors.textMuted} />
              </View>
              {item.tracking_number && (
                <Text variant="caption" color="muted" numberOfLines={1}>
                  #{item.tracking_number}
                </Text>
              )}
              {item.description && (
                <Text variant="bodySm" color="secondary" numberOfLines={1}>
                  {item.description}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.statusRow}>
              <StatusIcon size={14} color={statusConfig.color} />
              <Text variant="caption" customColor={statusConfig.color}>
                {statusConfig.label}
              </Text>
            </View>
            <Text variant="caption" color="muted">
              {formatDate(item.received_at)}
            </Text>
          </View>
        </Card>
      </Animated.View>
    );
  };

  // Stats
  const pendingCount = packages.filter(p => p.status === 'received').length;
  const totalCount = packages.length;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Paquetes</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.content}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={100} style={{ marginBottom: Spacing.md }} />
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
        <Text variant="h2">Paquetes</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      {/* Stats */}
      {packages.length > 0 && (
        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.statsContainer}>
          <Card variant="filled" padding="md" style={styles.statCard}>
            <Text variant="h1" customColor={colors.accent}>{pendingCount}</Text>
            <Text variant="caption" color="muted">Por recoger</Text>
          </Card>
          <Card variant="filled" padding="md" style={styles.statCard}>
            <Text variant="h1">{totalCount}</Text>
            <Text variant="caption" color="muted">Total</Text>
          </Card>
        </Animated.View>
      )}

      {packages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="📦"
            title="Sin paquetes"
            description="Tus paquetes y entregas aparecerán aquí"
          />
        </View>
      ) : (
        <FlatList
          data={packages}
          keyExtractor={(item) => item.id}
          renderItem={renderPackage}
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statCard: { flex: 1, alignItems: 'center' },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  packageCard: { marginBottom: Spacing.md },
  cardHeader: { flexDirection: 'row' },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, marginLeft: Spacing.md, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleText: { flex: 1 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
});
