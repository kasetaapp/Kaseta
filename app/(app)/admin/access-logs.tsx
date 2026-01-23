/**
 * KASETA - Admin Access Logs Screen
 * View all access logs for the organization
 */

import React, { useState, useCallback, useEffect } from 'react';
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
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Filter,
} from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Badge, Input, Skeleton, EmptyState, Avatar } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase';

interface AccessLog {
  id: string;
  organization_id: string;
  invitation_id: string | null;
  unit_id: string | null;
  visitor_name: string | null;
  access_type: 'entry' | 'exit';
  method: 'qr_scan' | 'manual_code' | 'manual_entry';
  accessed_at: string;
  authorized_by: string;
  notes: string | null;
  unit?: {
    id: string;
    name: string;
  };
  authorizer?: {
    id: string;
    full_name: string | null;
  };
}

const METHOD_LABELS: Record<string, string> = {
  qr_scan: 'QR',
  manual_code: 'Código',
  manual_entry: 'Manual',
};

type FilterType = 'all' | 'entry' | 'exit';

export default function AdminAccessLogsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentOrganization } = useOrganization();

  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  const fetchLogs = useCallback(async () => {
    if (!currentOrganization?.id) return;

    try {
      const { data, error } = await supabase
        .from('access_logs')
        .select(`
          *,
          unit:units(id, name),
          authorizer:profiles!authorized_by(id, full_name)
        `)
        .eq('organization_id', currentOrganization.id)
        .order('accessed_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Transform response
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        unit: Array.isArray(item.unit) ? item.unit[0] : item.unit,
        authorizer: Array.isArray(item.authorizer) ? item.authorizer[0] : item.authorizer,
      }));

      setLogs(transformedData as AccessLog[]);
    } catch (error) {
      console.error('Error fetching access logs:', error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchLogs();
    setRefreshing(false);
  }, [fetchLogs]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const filteredLogs = logs.filter((log) => {
    // Filter by type
    if (filterType !== 'all' && log.access_type !== filterType) {
      return false;
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const visitorName = log.visitor_name?.toLowerCase() || '';
      const unitName = log.unit?.name?.toLowerCase() || '';
      const authorizerName = log.authorizer?.full_name?.toLowerCase() || '';
      return (
        visitorName.includes(query) ||
        unitName.includes(query) ||
        authorizerName.includes(query)
      );
    }

    return true;
  });

  const formatDateTime = (dateString: string): { date: string; time: string } => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
      }),
      time: date.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const renderLog = useCallback(
    ({ item, index }: { item: AccessLog; index: number }) => {
      const isEntry = item.access_type === 'entry';
      const { date, time } = formatDateTime(item.accessed_at);

      return (
        <Animated.View entering={FadeInDown.delay(index * 30).springify()}>
          <Card variant="filled" padding="md" style={styles.logCard}>
            <View style={styles.logHeader}>
              <View
                style={[
                  styles.typeIcon,
                  {
                    backgroundColor: isEntry
                      ? colors.success + '15'
                      : colors.error + '15',
                  },
                ]}
              >
                {isEntry ? (
                  <ArrowDownLeft size={18} color={colors.success} />
                ) : (
                  <ArrowUpRight size={18} color={colors.error} />
                )}
              </View>
              <View style={styles.logInfo}>
                <Text variant="bodyMedium" numberOfLines={1}>
                  {item.visitor_name || 'Visitante'}
                </Text>
                <Text variant="caption" color="muted">
                  {item.unit?.name || 'Sin unidad'}
                </Text>
              </View>
              <View style={styles.logTime}>
                <Text variant="bodySm" style={{ textAlign: 'right' }}>
                  {time}
                </Text>
                <Text variant="caption" color="muted">
                  {date}
                </Text>
              </View>
            </View>

            <View style={styles.logFooter}>
              <View style={styles.logMeta}>
                <Badge variant="default" size="sm">
                  {METHOD_LABELS[item.method]}
                </Badge>
                <Badge
                  variant={isEntry ? 'success' : 'error'}
                  size="sm"
                >
                  {isEntry ? 'Entrada' : 'Salida'}
                </Badge>
              </View>
              {item.authorizer && (
                <Text variant="caption" color="muted">
                  Por: {item.authorizer.full_name || 'Guardia'}
                </Text>
              )}
            </View>

            {item.notes && (
              <Text
                variant="caption"
                color="secondary"
                style={styles.logNotes}
              >
                {item.notes}
              </Text>
            )}
          </Card>
        </Animated.View>
      );
    },
    [colors]
  );

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Search */}
      <Input
        placeholder="Buscar por visitante, unidad..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        leftElement={<Search size={18} color={colors.textMuted} />}
      />

      {/* Type Filter */}
      <View style={styles.filterTabs}>
        {(['all', 'entry', 'exit'] as FilterType[]).map((type) => (
          <Pressable
            key={type}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilterType(type);
            }}
            style={[
              styles.filterTab,
              {
                backgroundColor:
                  filterType === type ? colors.primary : colors.surface,
              },
            ]}
          >
            <Text
              variant="bodySm"
              customColor={
                filterType === type ? colors.background : colors.textSecondary
              }
            >
              {type === 'all' ? 'Todos' : type === 'entry' ? 'Entradas' : 'Salidas'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text variant="caption" color="muted" style={styles.resultCount}>
        {filteredLogs.length} registro{filteredLogs.length !== 1 ? 's' : ''}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Bitácora</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.content}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width="100%" height={100} style={{ marginBottom: Spacing.sm }} />
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
        <Text variant="h2">Bitácora</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item.id}
        renderItem={renderLog}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="📋"
            title="Sin registros"
            description="No hay registros de acceso que coincidan con tu búsqueda"
          />
        }
        contentContainerStyle={[
          styles.content,
          filteredLogs.length === 0 && styles.contentEmpty,
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
  filterTabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  resultCount: {
    marginTop: Spacing.md,
  },
  logCard: {
    marginBottom: Spacing.sm,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.smd,
  },
  logInfo: {
    flex: 1,
  },
  logTime: {
    alignItems: 'flex-end',
  },
  logFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  logMeta: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  logNotes: {
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
});
