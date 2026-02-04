/**
 * KASETA - Admin Dashboard
 * Administrative panel for organization management
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  Users,
  Building2,
  BarChart3,
  Megaphone,
  Wrench,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Shield,
} from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Skeleton } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  totalUsers: number;
  totalUnits: number;
  occupiedUnits: number;
  pendingMaintenance: number;
  monthlyEntries: number;
  previousMonthEntries: number;
}

export default function AdminDashboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentOrganization } = useOrganization();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!currentOrganization) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch all stats in parallel for better performance
      const [usersRes, unitsRes, occupiedRes, maintenanceRes] = await Promise.all([
        supabase
          .from('organization_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', currentOrganization.id)
          .eq('status', 'active'),
        supabase
          .from('units')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', currentOrganization.id),
        supabase
          .from('units')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', currentOrganization.id)
          .eq('status', 'active'),
        supabase
          .from('maintenance_requests')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', currentOrganization.id)
          .eq('status', 'pending'),
      ]);

      // Calculate date ranges for monthly stats
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const prevMonth = new Date(thisMonth);
      prevMonth.setMonth(prevMonth.getMonth() - 1);

      // Fetch monthly access stats
      const [monthlyRes, prevMonthRes] = await Promise.all([
        supabase
          .from('access_logs')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', currentOrganization.id)
          .gte('created_at', thisMonth.toISOString()),
        supabase
          .from('access_logs')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', currentOrganization.id)
          .gte('created_at', prevMonth.toISOString())
          .lt('created_at', thisMonth.toISOString()),
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        totalUnits: unitsRes.count || 0,
        occupiedUnits: occupiedRes.count || 0,
        pendingMaintenance: maintenanceRes.count || 0,
        monthlyEntries: monthlyRes.count || 0,
        previousMonthEntries: prevMonthRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchStats();
    setRefreshing(false);
  }, [fetchStats]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const menuItems = [
    {
      icon: Users,
      title: 'Usuarios',
      subtitle: `${stats?.totalUsers || 0} registrados`,
      color: '#3B82F6',
      route: '/(app)/admin/users',
    },
    {
      icon: Building2,
      title: 'Unidades',
      subtitle: `${stats?.occupiedUnits || 0}/${stats?.totalUnits || 0} ocupadas`,
      color: '#10B981',
      route: '/(app)/admin/units',
    },
    {
      icon: Megaphone,
      title: 'Anuncios',
      subtitle: 'Crear comunicado',
      color: '#8B5CF6',
      route: '/(app)/announcements/create',
    },
    {
      icon: Wrench,
      title: 'Mantenimiento',
      subtitle: `${stats?.pendingMaintenance || 0} pendientes`,
      color: '#F59E0B',
      route: '/(app)/maintenance',
    },
    {
      icon: BarChart3,
      title: 'Reportes',
      subtitle: 'Ver estadísticas',
      color: '#EC4899',
      route: '/(app)/admin/reports',
    },
    {
      icon: Shield,
      title: 'Roles y permisos',
      subtitle: 'Gestionar accesos',
      color: '#6366F1',
      route: '/(app)/admin/roles',
    },
  ];

  const entriesChange = stats
    ? ((stats.monthlyEntries - stats.previousMonthEntries) /
        Math.max(stats.previousMonthEntries, 1)) *
      100
    : 0;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            style={styles.backButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Administración</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.content}>
          <Skeleton width="100%" height={120} />
          <Skeleton width="100%" height={300} style={{ marginTop: Spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={styles.backButton}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text variant="h2">Administración</Text>
        <View style={styles.headerSpacer} />
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
        {/* Organization Card */}
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <Card variant="elevated" padding="lg" style={styles.orgCard}>
            <Text variant="h3">{currentOrganization?.name}</Text>
            <Text variant="bodySm" color="muted">
              {currentOrganization?.type}
            </Text>
          </Card>
        </Animated.View>

        {/* Monthly Stats */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>
            Este mes
          </Text>
          <Card variant="filled" padding="lg">
            <View style={styles.statsRow}>
              <View>
                <Text variant="displayLg" customColor={colors.accent}>
                  {stats?.monthlyEntries || 0}
                </Text>
                <Text variant="caption" color="muted">
                  Entradas
                </Text>
              </View>
              <View
                style={[
                  styles.changeBadge,
                  {
                    backgroundColor: entriesChange >= 0 ? '#10B98120' : '#EF444420',
                  },
                ]}
              >
                {entriesChange >= 0 ? (
                  <TrendingUp size={16} color="#10B981" />
                ) : (
                  <TrendingDown size={16} color="#EF4444" />
                )}
                <Text
                  variant="bodySm"
                  customColor={entriesChange >= 0 ? '#10B981' : '#EF4444'}
                >
                  {Math.abs(entriesChange).toFixed(0)}%
                </Text>
              </View>
            </View>
            <Text variant="caption" color="muted" style={styles.comparisonText}>
              vs. mes anterior ({stats?.previousMonthEntries || 0} entradas)
            </Text>
          </Card>
        </Animated.View>

        {/* Menu Items */}
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>
            Gestión
          </Text>
          {menuItems.map((item, index) => (
            <Animated.View key={item.title} entering={FadeIn.delay(index * 50)}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(item.route as any);
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}: ${item.subtitle}`}
              >
                <Card variant="elevated" style={styles.menuCard} padding="md">
                  <View style={styles.menuRow}>
                    <View
                      style={[
                        styles.menuIcon,
                        { backgroundColor: item.color + '20' },
                      ]}
                    >
                      <item.icon size={24} color={item.color} />
                    </View>
                    <View style={styles.menuInfo}>
                      <Text variant="bodyMedium">{item.title}</Text>
                      <Text variant="caption" color="muted">
                        {item.subtitle}
                      </Text>
                    </View>
                    <ChevronRight size={20} color={colors.textMuted} />
                  </View>
                </Card>
              </Pressable>
            </Animated.View>
          ))}
        </Animated.View>
      </ScrollView>
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
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  orgCard: {
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  comparisonText: {
    marginTop: Spacing.sm,
  },
  menuCard: {
    marginBottom: Spacing.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
});
