/**
 * KASETA - Admin Units Screen
 * Manage organization units (apartments/houses)
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  Building2,
  Home,
  Search,
  Layers,
} from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Badge, Input, Skeleton, EmptyState } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase';

// Types
interface Unit {
  id: string;
  organization_id: string;
  unit_number: string;
  building: string | null;
  floor: number | null;
  status: 'active' | 'vacant' | 'maintenance';
  created_at: string;
}

interface OccupancyStats {
  total: number;
  occupied: number;
  vacant: number;
}

type FilterStatus = 'all' | 'active' | 'vacant';

const STATUS_CONFIG: Record<Unit['status'], { label: string; variant: 'success' | 'warning' | 'default' }> = {
  active: { label: 'Ocupado', variant: 'success' },
  vacant: { label: 'Vacante', variant: 'warning' },
  maintenance: { label: 'Mantenimiento', variant: 'default' },
};

export default function AdminUnitsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentOrganization } = useOrganization();

  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // Fetch units from Supabase
  const fetchUnits = useCallback(async () => {
    if (!currentOrganization?.id) return;

    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('unit_number', { ascending: true });

      if (error) throw error;

      setUnits((data || []) as Unit[]);
    } catch (error) {
      console.error('Error fetching units:', error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchUnits();
    setRefreshing(false);
  }, [fetchUnits]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  // Calculate occupancy stats
  const occupancyStats = useMemo<OccupancyStats>(() => {
    const total = units.length;
    const occupied = units.filter((u) => u.status === 'active').length;
    const vacant = units.filter((u) => u.status === 'vacant').length;
    return { total, occupied, vacant };
  }, [units]);

  // Filter units based on search and status
  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      // Filter by status
      if (filterStatus !== 'all' && unit.status !== filterStatus) {
        return false;
      }

      // Filter by search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const unitNumber = unit.unit_number?.toLowerCase() || '';
        const building = unit.building?.toLowerCase() || '';
        const floor = unit.floor?.toString() || '';
        return (
          unitNumber.includes(query) ||
          building.includes(query) ||
          floor.includes(query)
        );
      }

      return true;
    });
  }, [units, filterStatus, searchQuery]);

  // Render individual unit card
  const renderUnit = useCallback(
    ({ item, index }: { item: Unit; index: number }) => {
      const statusConfig = STATUS_CONFIG[item.status];

      return (
        <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
          <Card variant="filled" padding="md" style={styles.unitCard}>
            <View style={styles.unitHeader}>
              <View
                style={[
                  styles.unitIconContainer,
                  { backgroundColor: colors.surface },
                ]}
              >
                <Home size={20} color={colors.accent} />
              </View>
              <View style={styles.unitInfo}>
                <Text variant="bodyMedium" numberOfLines={1}>
                  {item.unit_number}
                </Text>
                {item.building && (
                  <View style={styles.unitMeta}>
                    <Building2 size={12} color={colors.textMuted} />
                    <Text variant="caption" color="muted">
                      {item.building}
                    </Text>
                  </View>
                )}
              </View>
              <Badge variant={statusConfig.variant} size="sm">
                {statusConfig.label}
              </Badge>
            </View>

            {item.floor !== null && (
              <View style={styles.unitDetails}>
                <View style={styles.detailItem}>
                  <Layers size={14} color={colors.textMuted} />
                  <Text variant="caption" color="secondary">
                    Piso {item.floor}
                  </Text>
                </View>
              </View>
            )}
          </Card>
        </Animated.View>
      );
    },
    [colors]
  );

  // Render stats cards
  const renderStatsCard = (
    label: string,
    value: number,
    variant: 'default' | 'success' | 'warning'
  ) => {
    const bgColor =
      variant === 'success'
        ? colors.successBg
        : variant === 'warning'
        ? colors.warningBg
        : colors.surface;
    const textColor =
      variant === 'success'
        ? colors.success
        : variant === 'warning'
        ? colors.warning
        : colors.text;

    return (
      <View style={[styles.statCard, { backgroundColor: bgColor }]}>
        <Text variant="h2" customColor={textColor}>
          {value}
        </Text>
        <Text variant="caption" color="secondary">
          {label}
        </Text>
      </View>
    );
  };

  // Render list header with stats, search, and filters
  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Occupancy Stats */}
      <View style={styles.statsContainer}>
        {renderStatsCard('Total', occupancyStats.total, 'default')}
        {renderStatsCard('Ocupados', occupancyStats.occupied, 'success')}
        {renderStatsCard('Vacantes', occupancyStats.vacant, 'warning')}
      </View>

      {/* Search */}
      <Input
        placeholder="Buscar por unidad, edificio o piso..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        leftElement={<Search size={18} color={colors.textMuted} />}
        style={styles.searchInput}
      />

      {/* Status Filter */}
      <View style={styles.filterTabs}>
        {(['all', 'active', 'vacant'] as FilterStatus[]).map((status) => (
          <Pressable
            key={status}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilterStatus(status);
            }}
            style={[
              styles.filterTab,
              {
                backgroundColor:
                  filterStatus === status ? colors.primary : colors.surface,
              },
            ]}
          >
            <Text
              variant="bodySm"
              customColor={
                filterStatus === status ? colors.background : colors.textSecondary
              }
            >
              {status === 'all'
                ? 'Todos'
                : status === 'active'
                ? 'Ocupados'
                : 'Vacantes'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text variant="caption" color="muted" style={styles.resultCount}>
        {filteredUnits.length} unidad{filteredUnits.length !== 1 ? 'es' : ''}
      </Text>
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Unidades</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.content}>
          {/* Stats skeleton */}
          <View style={styles.statsContainer}>
            {[0, 1, 2].map((i) => (
              <Skeleton
                key={i}
                width={100}
                height={70}
                style={{ flex: 1, marginHorizontal: Spacing.xs }}
              />
            ))}
          </View>
          {/* List skeleton */}
          {[0, 1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              width="100%"
              height={80}
              style={{ marginBottom: Spacing.sm }}
            />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <Animated.View
        entering={FadeInDown.delay(100).springify()}
        style={styles.header}
      >
        <Pressable onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text variant="h2">Unidades</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <FlatList
        data={filteredUnits}
        keyExtractor={(item) => item.id}
        renderItem={renderUnit}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon={<Building2 size={40} color={colors.textMuted} />}
            title="Sin unidades"
            description="No hay unidades que coincidan con tu busqueda"
          />
        }
        contentContainerStyle={[
          styles.content,
          filteredUnits.length === 0 && styles.contentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      />
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
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  contentEmpty: {
    flex: 1,
  },
  listHeader: {
    marginBottom: Spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  searchInput: {
    marginBottom: Spacing.md,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  resultCount: {
    marginTop: Spacing.md,
  },
  unitCard: {
    marginBottom: Spacing.sm,
  },
  unitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitInfo: {
    flex: 1,
    marginLeft: Spacing.smd,
  },
  unitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  unitDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
});
