/**
 * KASETA - Guard Dashboard
 * Main control panel for security guards
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  QrCode,
  UserPlus,
  Package,
  ClipboardList,
  Clock,
  Users,
  Car,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Badge, Skeleton } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  todayEntries: number;
  pendingPackages: number;
  activeVisitors: number;
}

interface RecentEntry {
  id: string;
  visitor_name: string;
  access_type: string;
  created_at: string;
  unit?: { unit_number: string } | { unit_number: string }[];
}

export default function GuardDashboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentOrganization } = useOrganization();

  const [stats, setStats] = useState<DashboardStats>({ todayEntries: 0, pendingPackages: 0, activeVisitors: 0 });
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!currentOrganization) {
      setIsLoading(false);
      return;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch today's entries count
      const { count: entriesCount } = await supabase
        .from('access_logs')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id)
        .gte('created_at', today.toISOString());

      // Fetch pending packages count
      const { count: packagesCount } = await supabase
        .from('packages')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'received');

      // Fetch recent entries
      const { data: entries } = await supabase
        .from('access_logs')
        .select(`
          id,
          visitor_name,
          access_type,
          created_at,
          unit:unit_id(unit_number)
        `)
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        todayEntries: entriesCount || 0,
        pendingPackages: packagesCount || 0,
        activeVisitors: 0,
      });

      setRecentEntries(entries || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  const handleScanQR = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(app)/guard/scan');
  };

  const handleManualEntry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(app)/guard/manual-entry');
  };

  const handlePackages = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(app)/guard/packages');
  };

  const handleAccessLog = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(app)/(tabs)/access-logs');
  };

  const formatTime = (dateStr: string): string => {
    return new Date(dateStr).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAccessTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      invitation: 'Invitación',
      manual: 'Manual',
      vehicle: 'Vehículo',
      resident: 'Residente',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text variant="h2">Panel de Guardia</Text>
        </View>
        <View style={styles.content}>
          <Skeleton width="100%" height={120} />
          <Skeleton width="100%" height={200} style={{ marginTop: Spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
        <Text variant="h2">Panel de Guardia</Text>
        <Badge variant="success" size="sm">En turno</Badge>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <View style={styles.quickActions}>
            <Pressable
              onPress={handleScanQR}
              style={[styles.mainAction, { backgroundColor: colors.accent }]}
            >
              <QrCode size={32} color={colors.textOnAccent} />
              <Text variant="h4" customColor={colors.textOnAccent}>
                Escanear QR
              </Text>
            </Pressable>

            <View style={styles.secondaryActions}>
              <Pressable
                onPress={handleManualEntry}
                style={[styles.secondaryAction, { backgroundColor: colors.surface }]}
              >
                <UserPlus size={24} color={colors.accent} />
                <Text variant="bodySm">Entrada Manual</Text>
              </Pressable>
              <Pressable
                onPress={handlePackages}
                style={[styles.secondaryAction, { backgroundColor: colors.surface }]}
              >
                <Package size={24} color="#F59E0B" />
                <Text variant="bodySm">Paquetes</Text>
                {stats.pendingPackages > 0 && (
                  <View style={[styles.badge, { backgroundColor: '#F59E0B' }]}>
                    <Text variant="caption" customColor="#FFF">
                      {stats.pendingPackages}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>Hoy</Text>
          <View style={styles.statsGrid}>
            <Card variant="filled" padding="md" style={styles.statCard}>
              <Users size={24} color={colors.accent} />
              <Text variant="h1">{stats.todayEntries}</Text>
              <Text variant="caption" color="muted">Entradas</Text>
            </Card>
            <Card variant="filled" padding="md" style={styles.statCard}>
              <Package size={24} color="#F59E0B" />
              <Text variant="h1">{stats.pendingPackages}</Text>
              <Text variant="caption" color="muted">Paquetes</Text>
            </Card>
          </View>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <View style={styles.sectionHeader}>
            <Text variant="h4">Actividad reciente</Text>
            <Pressable onPress={handleAccessLog} style={styles.viewAllButton}>
              <Text variant="bodySm" customColor={colors.accent}>Ver todo</Text>
              <ChevronRight size={16} color={colors.accent} />
            </Pressable>
          </View>

          {recentEntries.length === 0 ? (
            <Card variant="filled" padding="lg">
              <Text variant="body" color="muted" center>
                No hay actividad reciente
              </Text>
            </Card>
          ) : (
            recentEntries.map((entry, index) => (
              <Animated.View key={entry.id} entering={FadeIn.delay(index * 50)}>
                <Card variant="outlined" padding="sm" style={styles.entryCard}>
                  <View style={styles.entryRow}>
                    <View style={styles.entryInfo}>
                      <Text variant="bodyMedium">{entry.visitor_name || 'Sin nombre'}</Text>
                      <View style={styles.entryMeta}>
                        <Badge variant="default" size="sm">
                          {getAccessTypeLabel(entry.access_type)}
                        </Badge>
                        {entry.unit && (
                          <Text variant="caption" color="muted">
                            Unidad {Array.isArray(entry.unit) ? entry.unit[0]?.unit_number : entry.unit.unit_number}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.entryTime}>
                      <Clock size={12} color={colors.textMuted} />
                      <Text variant="caption" color="muted">
                        {formatTime(entry.created_at)}
                      </Text>
                    </View>
                  </View>
                </Card>
              </Animated.View>
            ))
          )}
        </Animated.View>

        {/* Emergency Button */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.emergencyContainer}>
          <Pressable
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              router.push('/(app)/emergency');
            }}
            style={[styles.emergencyButton, { backgroundColor: colors.error + '15' }]}
          >
            <AlertTriangle size={20} color={colors.error} />
            <Text variant="bodyMedium" customColor={colors.error}>
              Contactos de Emergencia
            </Text>
          </Pressable>
        </Animated.View>
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
  content: { flex: 1, paddingHorizontal: Spacing.lg },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  quickActions: { gap: Spacing.md },
  mainAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
  },
  secondaryActions: { flexDirection: 'row', gap: Spacing.md },
  secondaryAction: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  badge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  sectionTitle: { marginTop: Spacing.xl, marginBottom: Spacing.md },
  statsGrid: { flexDirection: 'row', gap: Spacing.md },
  statCard: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  viewAllButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xxs },
  entryCard: { marginBottom: Spacing.sm },
  entryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  entryInfo: { flex: 1 },
  entryMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xxs },
  entryTime: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xxs },
  emergencyContainer: { marginTop: Spacing.xl },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
});
