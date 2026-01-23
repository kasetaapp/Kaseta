/**
 * KASETA - Access Logs Screen
 * View access history for the organization
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Avatar, Badge, Skeleton, EmptyState } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase';

interface AccessLog {
  id: string;
  visitor_name: string;
  access_type: 'entry' | 'exit';
  method: 'qr_scan' | 'manual' | 'plate_recognition';
  accessed_at: string;
  unit?: {
    id: string;
    name: string;
  };
  invitation?: {
    id: string;
    visitor_name: string;
    access_type: string;
  };
  authorized_by_profile?: {
    id: string;
    full_name: string;
  };
}

type FilterType = 'all' | 'entry' | 'exit';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'entry', label: 'Entradas' },
  { key: 'exit', label: 'Salidas' },
];

export default function AccessLogsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentOrganization, canScanAccess, isAdmin } = useOrganization();

  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const fetchLogs = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      let query = supabase
        .from('access_logs')
        .select(`
          id,
          visitor_name,
          access_type,
          method,
          accessed_at,
          unit:units(id, name),
          invitation:invitations(id, visitor_name, access_type),
          authorized_by_profile:profiles!access_logs_authorized_by_fkey(id, full_name)
        `)
        .eq('organization_id', currentOrganization.id)
        .order('accessed_at', { ascending: false })
        .limit(50);

      if (activeFilter !== 'all') {
        query = query.eq('access_type', activeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      // Transform Supabase response (arrays to objects for related data)
      const transformedData = (data || []).map((log: any) => ({
        ...log,
        unit: Array.isArray(log.unit) ? log.unit[0] : log.unit,
        invitation: Array.isArray(log.invitation) ? log.invitation[0] : log.invitation,
        authorized_by_profile: Array.isArray(log.authorized_by_profile) ? log.authorized_by_profile[0] : log.authorized_by_profile,
      }));
      setLogs(transformedData as AccessLog[]);
    } catch (error) {
      console.error('Error fetching access logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization, activeFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!currentOrganization) return;

    const channel = supabase
      .channel(`access_logs_${currentOrganization.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'access_logs',
          filter: `organization_id=eq.${currentOrganization.id}`,
        },
        () => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrganization, fetchLogs]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchLogs();
    setRefreshing(false);
  }, [fetchLogs]);

  const handleFilterChange = (filter: FilterType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filter);
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-MX', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    }
  };

  const getMethodLabel = (method: string): string => {
    switch (method) {
      case 'qr_scan':
        return 'QR';
      case 'manual':
        return 'Manual';
      case 'plate_recognition':
        return 'Placa';
      default:
        return method;
    }
  };

  // Group logs by date
  const groupedLogs = logs.reduce((groups, log) => {
    const date = formatDate(log.accessed_at);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(log);
    return groups;
  }, {} as Record<string, AccessLog[]>);

  const sections = Object.entries(groupedLogs).map(([date, items]) => ({
    date,
    data: items,
  }));

  // Check permissions
  if (!canScanAccess && !isAdmin) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centeredContent}>
          <Text variant="h1" center style={{ marginBottom: Spacing.md }}>
            🔒
          </Text>
          <Text variant="h3" center style={{ marginBottom: Spacing.sm }}>
            Sin permisos
          </Text>
          <Text variant="body" color="secondary" center>
            No tienes permisos para ver el registro de accesos.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderLog = ({ item, index }: { item: AccessLog; index: number }) => {
    const isEntry = item.access_type === 'entry';

    return (
      <Animated.View entering={FadeIn.delay(index * 50)}>
        <Card
          variant="outlined"
          style={styles.logCard}
          padding="md"
          pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({
              pathname: '/(app)/access-log/[id]',
              params: { id: item.id },
            });
          }}
        >
          <View style={styles.logRow}>
            <View style={[styles.logIcon, { backgroundColor: isEntry ? colors.successBg : colors.surface }]}>
              <Text variant="body">{isEntry ? '🚪' : '👋'}</Text>
            </View>

            <View style={styles.logInfo}>
              <Text variant="bodyMedium">{item.visitor_name || 'Visitante'}</Text>
              <Text variant="caption" color="muted">
                {formatTime(item.accessed_at)}
                {item.unit?.name && ` · ${item.unit.name}`}
                {item.authorized_by_profile?.full_name && ` · Por: ${item.authorized_by_profile.full_name}`}
              </Text>
            </View>

            <View style={styles.logRight}>
              <Badge
                variant={isEntry ? 'success' : 'default'}
                size="sm"
              >
                {isEntry ? 'Entrada' : 'Salida'}
              </Badge>
              <Text variant="caption" color="muted" style={styles.methodLabel}>
                {getMethodLabel(item.method)}
              </Text>
            </View>
          </View>
        </Card>
      </Animated.View>
    );
  };

  const renderSectionHeader = (date: string) => (
    <View style={styles.sectionHeader}>
      <Text variant="label" color="muted">
        {date}
      </Text>
    </View>
  );

  // Loading skeleton
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Skeleton width={120} height={32} />
          </View>

          <View style={styles.filters}>
            {FILTERS.map((filter) => (
              <Skeleton key={filter.key} width={80} height={36} style={{ borderRadius: BorderRadius.full }} />
            ))}
          </View>

          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} width="100%" height={80} style={{ marginBottom: Spacing.sm }} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
          <Text variant="h1">Accesos</Text>
        </Animated.View>

        {/* Filters */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.filters}>
          {FILTERS.map((filter) => (
            <Card
              key={filter.key}
              pressable
              onPress={() => handleFilterChange(filter.key)}
              style={[
                styles.filterChip,
                activeFilter === filter.key && { backgroundColor: colors.accent },
              ]}
              padding="none"
            >
              <Text
                variant="bodySm"
                customColor={activeFilter === filter.key ? colors.textOnAccent : colors.text}
                style={styles.filterText}
              >
                {filter.label}
              </Text>
            </Card>
          ))}
        </Animated.View>

        {/* Logs list */}
        {logs.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.emptyContainer}>
            <EmptyState
              icon="📋"
              title="Sin registros"
              description={
                activeFilter === 'all'
                  ? 'No hay registros de acceso aún'
                  : `No hay registros de ${activeFilter === 'entry' ? 'entradas' : 'salidas'}`
              }
            />
          </Animated.View>
        ) : (
          <FlatList
            data={sections}
            keyExtractor={(item) => item.date}
            renderItem={({ item: section }) => (
              <View>
                {renderSectionHeader(section.date)}
                {section.data.map((log, index) => (
                  <View key={log.id}>
                    {renderLog({ item: log, index })}
                  </View>
                ))}
              </View>
            )}
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  header: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  filters: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterChip: {
    borderRadius: BorderRadius.full,
    borderWidth: 0,
  },
  filterText: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  listContent: {
    paddingBottom: Spacing.xxxl,
  },
  sectionHeader: {
    paddingVertical: Spacing.sm,
    paddingTop: Spacing.md,
  },
  logCard: {
    marginBottom: Spacing.sm,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logInfo: {
    flex: 1,
    marginLeft: Spacing.smd,
  },
  logRight: {
    alignItems: 'flex-end',
  },
  methodLabel: {
    marginTop: Spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});
