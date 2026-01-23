/**
 * KASETA - Visitor History Screen
 * View all visitors that have accessed the unit
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
import { ChevronLeft, ArrowDownLeft, ArrowUpRight, Calendar, Search } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Avatar, Badge, Skeleton, EmptyState, Input } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase';

interface VisitorRecord {
  id: string;
  visitor_name: string;
  access_type: 'entry' | 'exit';
  method: string;
  accessed_at: string;
  notes: string | null;
}

export default function VisitorHistoryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentMembership, currentOrganization } = useOrganization();

  const [records, setRecords] = useState<VisitorRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<VisitorRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!currentMembership?.unit_id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('access_logs')
        .select('id, visitor_name, access_type, method, accessed_at, notes')
        .eq('unit_id', currentMembership.unit_id)
        .order('accessed_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setRecords(data || []);
      setFilteredRecords(data || []);
    } catch (error) {
      console.error('Error fetching visitor history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentMembership]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredRecords(
        records.filter((r) =>
          r.visitor_name?.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredRecords(records);
    }
  }, [searchQuery, records]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchHistory();
    setRefreshing(false);
  }, [fetchHistory]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const formatDateTime = (dateStr: string): { date: string; time: string } => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateFormatted: string;
    if (date.toDateString() === today.toDateString()) {
      dateFormatted = 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateFormatted = 'Ayer';
    } else {
      dateFormatted = date.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
      });
    }

    const timeFormatted = date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return { date: dateFormatted, time: timeFormatted };
  };

  const getMethodLabel = (method: string): string => {
    const labels: Record<string, string> = {
      qr_scan: 'QR',
      manual_code: 'Código',
      manual_entry: 'Manual',
    };
    return labels[method] || method;
  };

  const renderRecord = ({ item, index }: { item: VisitorRecord; index: number }) => {
    const isEntry = item.access_type === 'entry';
    const { date, time } = formatDateTime(item.accessed_at);

    return (
      <Animated.View entering={FadeIn.delay(index * 30)}>
        <Card variant="outlined" style={styles.recordCard} padding="md">
          <View style={styles.recordRow}>
            <View style={[styles.recordIcon, { backgroundColor: isEntry ? colors.successBg : colors.surface }]}>
              {isEntry ? (
                <ArrowDownLeft size={20} color={colors.success} />
              ) : (
                <ArrowUpRight size={20} color={colors.warning} />
              )}
            </View>

            <View style={styles.recordInfo}>
              <Text variant="bodyMedium">{item.visitor_name || 'Visitante'}</Text>
              <Text variant="caption" color="muted">
                {date} · {time}
              </Text>
            </View>

            <View style={styles.recordRight}>
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

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Historial</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.content}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} width="100%" height={80} style={{ marginBottom: Spacing.sm }} />
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
        <Text variant="h2">Historial de visitas</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      {/* Search */}
      <Animated.View
        entering={FadeInDown.delay(150).springify()}
        style={styles.searchContainer}
      >
        <Input
          placeholder="Buscar visitante..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftElement={<Search size={18} color={colors.textMuted} />}
        />
      </Animated.View>

      {/* Stats */}
      {records.length > 0 && (
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={styles.statsContainer}
        >
          <Card variant="filled" style={styles.statCard} padding="sm">
            <Text variant="h3" customColor={colors.success}>
              {records.filter((r) => r.access_type === 'entry').length}
            </Text>
            <Text variant="caption" color="muted">Entradas</Text>
          </Card>
          <Card variant="filled" style={styles.statCard} padding="sm">
            <Text variant="h3" customColor={colors.warning}>
              {records.filter((r) => r.access_type === 'exit').length}
            </Text>
            <Text variant="caption" color="muted">Salidas</Text>
          </Card>
          <Card variant="filled" style={styles.statCard} padding="sm">
            <Text variant="h3" customColor={colors.accent}>
              {new Set(records.map((r) => r.visitor_name)).size}
            </Text>
            <Text variant="caption" color="muted">Visitantes</Text>
          </Card>
        </Animated.View>
      )}

      {/* List */}
      {filteredRecords.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="📋"
            title={searchQuery ? 'Sin resultados' : 'Sin historial'}
            description={
              searchQuery
                ? 'No se encontraron visitantes con ese nombre'
                : 'Los registros de acceso aparecerán aquí'
            }
          />
        </View>
      ) : (
        <FlatList
          data={filteredRecords}
          keyExtractor={(item) => item.id}
          renderItem={renderRecord}
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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
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
  recordCard: {
    marginBottom: Spacing.sm,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordInfo: {
    flex: 1,
    marginLeft: Spacing.smd,
  },
  recordRight: {
    alignItems: 'flex-end',
  },
  methodLabel: {
    marginTop: Spacing.xs,
  },
});
