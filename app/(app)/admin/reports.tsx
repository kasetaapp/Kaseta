/**
 * KASETA - Admin Reports Screen
 * Displays statistics and activity reports for organization administrators
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  Wrench,
  Calendar,
  Users,
  ChevronLeft,
  Activity,
} from 'lucide-react-native';

import { Text, Card, Badge, Skeleton } from '@/components/ui';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius, Layout } from '@/constants/Spacing';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Types
interface StatCard {
  id: string;
  title: string;
  value: number;
  previousValue: number;
  icon: React.ReactNode;
  color: string;
}

interface RecentActivity {
  id: string;
  type: 'entry' | 'package' | 'maintenance' | 'reservation';
  description: string;
  timestamp: string;
}

interface ReportStats {
  totalEntries: number;
  previousEntries: number;
  packagesReceived: number;
  previousPackages: number;
  maintenanceRequests: number;
  previousMaintenance: number;
  reservations: number;
  previousReservations: number;
}

export default function AdminReportsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentOrganization } = useOrganization();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<ReportStats>({
    totalEntries: 0,
    previousEntries: 0,
    packagesReceived: 0,
    previousPackages: 0,
    maintenanceRequests: 0,
    previousMaintenance: 0,
    reservations: 0,
    previousReservations: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  // Fetch report data
  const fetchReportData = useCallback(async () => {
    if (!currentOrganization?.id) return;

    try {
      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Fetch entries for this month
      const { count: entriesThisMonth } = await supabase
        .from('access_logs')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id)
        .eq('direction', 'entry')
        .gte('created_at', firstDayThisMonth.toISOString());

      // Fetch entries for last month
      const { count: entriesLastMonth } = await supabase
        .from('access_logs')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id)
        .eq('direction', 'entry')
        .gte('created_at', firstDayLastMonth.toISOString())
        .lte('created_at', lastDayLastMonth.toISOString());

      // Fetch packages this month
      const { count: packagesThisMonth } = await supabase
        .from('packages')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id)
        .gte('received_at', firstDayThisMonth.toISOString());

      // Fetch packages last month
      const { count: packagesLastMonth } = await supabase
        .from('packages')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id)
        .gte('received_at', firstDayLastMonth.toISOString())
        .lte('received_at', lastDayLastMonth.toISOString());

      // Fetch maintenance requests this month
      const { count: maintenanceThisMonth } = await supabase
        .from('maintenance_requests')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id)
        .gte('created_at', firstDayThisMonth.toISOString());

      // Fetch maintenance requests last month
      const { count: maintenanceLastMonth } = await supabase
        .from('maintenance_requests')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id)
        .gte('created_at', firstDayLastMonth.toISOString())
        .lte('created_at', lastDayLastMonth.toISOString());

      // Fetch reservations this month
      const { count: reservationsThisMonth } = await supabase
        .from('amenity_reservations')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id)
        .gte('created_at', firstDayThisMonth.toISOString());

      // Fetch reservations last month
      const { count: reservationsLastMonth } = await supabase
        .from('amenity_reservations')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id)
        .gte('created_at', firstDayLastMonth.toISOString())
        .lte('created_at', lastDayLastMonth.toISOString());

      // Fetch recent activity
      const { data: activityData } = await supabase
        .from('access_logs')
        .select('id, visitor_name, entry_type, direction, created_at')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setStats({
        totalEntries: entriesThisMonth || 0,
        previousEntries: entriesLastMonth || 0,
        packagesReceived: packagesThisMonth || 0,
        previousPackages: packagesLastMonth || 0,
        maintenanceRequests: maintenanceThisMonth || 0,
        previousMaintenance: maintenanceLastMonth || 0,
        reservations: reservationsThisMonth || 0,
        previousReservations: reservationsLastMonth || 0,
      });

      const activities: RecentActivity[] = (activityData || []).map((item) => ({
        id: item.id,
        type: 'entry' as const,
        description: `${item.visitor_name} - ${item.entry_type} ${item.direction}`,
        timestamp: item.created_at,
      }));

      setRecentActivity(activities);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchReportData();
  }, [fetchReportData]);

  // Calculate percentage change
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Get trend icon and color
  const getTrendIndicator = (current: number, previous: number) => {
    const change = calculateChange(current, previous);
    if (change > 0) {
      return {
        icon: <TrendingUp size={16} color={colors.success} />,
        color: colors.success,
        text: `+${change}%`,
      };
    } else if (change < 0) {
      return {
        icon: <TrendingDown size={16} color={colors.error} />,
        color: colors.error,
        text: `${change}%`,
      };
    }
    return {
      icon: <Minus size={16} color={colors.textMuted} />,
      color: colors.textMuted,
      text: '0%',
    };
  };

  // Stat cards data
  const statCards: StatCard[] = [
    {
      id: 'entries',
      title: 'Total Entries',
      value: stats.totalEntries,
      previousValue: stats.previousEntries,
      icon: <Users size={24} color={colors.info} />,
      color: colors.info,
    },
    {
      id: 'packages',
      title: 'Packages Received',
      value: stats.packagesReceived,
      previousValue: stats.previousPackages,
      icon: <Package size={24} color={colors.success} />,
      color: colors.success,
    },
    {
      id: 'maintenance',
      title: 'Maintenance Requests',
      value: stats.maintenanceRequests,
      previousValue: stats.previousMaintenance,
      icon: <Wrench size={24} color={colors.warning} />,
      color: colors.warning,
    },
    {
      id: 'reservations',
      title: 'Reservations',
      value: stats.reservations,
      previousValue: stats.previousReservations,
      icon: <Calendar size={24} color={colors.accent} />,
      color: colors.accent,
    },
  ];

  // Format relative time
  const formatRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Get activity icon
  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'entry':
        return <Users size={18} color={colors.info} />;
      case 'package':
        return <Package size={18} color={colors.success} />;
      case 'maintenance':
        return <Wrench size={18} color={colors.warning} />;
      case 'reservation':
        return <Calendar size={18} color={colors.accent} />;
      default:
        return <Activity size={18} color={colors.textMuted} />;
    }
  };

  // Render stat card
  const renderStatCard = (stat: StatCard, index: number) => {
    const trend = getTrendIndicator(stat.value, stat.previousValue);

    if (isLoading) {
      return (
        <Animated.View
          key={stat.id}
          entering={FadeInDown.delay(index * 100).duration(400)}
          style={styles.statCardWrapper}
        >
          <Card style={styles.statCard}>
            <Skeleton width={40} height={40} variant="circular" />
            <Skeleton width="60%" height={14} style={{ marginTop: Spacing.sm }} />
            <Skeleton width="40%" height={28} style={{ marginTop: Spacing.xs }} />
            <Skeleton width="30%" height={14} style={{ marginTop: Spacing.xs }} />
          </Card>
        </Animated.View>
      );
    }

    return (
      <Animated.View
        key={stat.id}
        entering={FadeInDown.delay(index * 100).duration(400)}
        style={styles.statCardWrapper}
      >
        <Card style={styles.statCard}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${stat.color}15` },
            ]}
          >
            {stat.icon}
          </View>
          <Text variant="caption" color="secondary" style={styles.statTitle}>
            {stat.title}
          </Text>
          <Text variant="h2" style={styles.statValue}>
            {stat.value.toLocaleString()}
          </Text>
          <View style={styles.trendContainer}>
            {trend.icon}
            <Text
              variant="captionMedium"
              customColor={trend.color}
              style={styles.trendText}
            >
              {trend.text}
            </Text>
            <Text variant="caption" color="muted">
              vs last month
            </Text>
          </View>
        </Card>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={styles.header}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: pressed ? colors.surface : 'transparent' },
          ]}
        >
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <BarChart3 size={24} color={colors.accent} />
          <Text variant="h3" style={styles.headerTitle}>
            Reports
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Month indicator */}
        <Animated.View
          entering={FadeInDown.delay(50).duration(400)}
          style={styles.monthContainer}
        >
          <Text variant="label" color="secondary">
            {new Date().toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
          <Badge variant="accent" size="sm">
            This Month
          </Badge>
        </Animated.View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {statCards.map((stat, index) => renderStatCard(stat, index))}
        </View>

        {/* Recent Activity Section */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          style={styles.activitySection}
        >
          <View style={styles.sectionHeader}>
            <Text variant="h4">Recent Activity</Text>
            <Badge variant="default" size="sm">
              Last 10
            </Badge>
          </View>

          <Card style={styles.activityCard}>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.activityItem,
                    index < 4 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}
                >
                  <Skeleton width={36} height={36} variant="circular" />
                  <View style={styles.activityContent}>
                    <Skeleton width="70%" height={14} />
                    <Skeleton width="30%" height={12} style={{ marginTop: Spacing.xs }} />
                  </View>
                </View>
              ))
            ) : recentActivity.length === 0 ? (
              <View style={styles.emptyActivity}>
                <Activity size={32} color={colors.textMuted} />
                <Text variant="body" color="muted" style={styles.emptyText}>
                  No recent activity
                </Text>
              </View>
            ) : (
              recentActivity.map((activity, index) => (
                <View
                  key={activity.id}
                  style={[
                    styles.activityItem,
                    index < recentActivity.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.activityIconContainer,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    {getActivityIcon(activity.type)}
                  </View>
                  <View style={styles.activityContent}>
                    <Text variant="bodyMedium" numberOfLines={1}>
                      {activity.description}
                    </Text>
                    <Text variant="caption" color="muted">
                      {formatRelativeTime(activity.timestamp)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </Card>
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
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: Layout.iconButtonSize,
    height: Layout.iconButtonSize,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    marginLeft: Spacing.xs,
  },
  headerSpacer: {
    width: Layout.iconButtonSize,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingBottom: Spacing.xxxl,
  },
  monthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  statCardWrapper: {
    width: '50%',
    padding: Spacing.xs,
  },
  statCard: {
    padding: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statTitle: {
    marginBottom: Spacing.xxs,
  },
  statValue: {
    marginBottom: Spacing.xs,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  trendText: {
    marginRight: Spacing.xxs,
  },
  activitySection: {
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  activityCard: {
    padding: 0,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.smd,
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  emptyActivity: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: Spacing.sm,
  },
});
