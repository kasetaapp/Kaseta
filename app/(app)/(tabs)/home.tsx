/**
 * KASETA - Home Screen
 * Main dashboard with quick actions and recent activity
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Text, Card, Avatar, Badge, Skeleton, Button, EmptyState } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase';
import { Invitation } from '@/lib/invitations';

interface GuardStats {
  todayEntries: number;
  todayExits: number;
  activeInvitations: number;
  avgWaitTime: number;
}

interface DashboardStats {
  activeInvitations: number;
  visitorsToday: number;
  pendingInvitations: number;
  pendingPackages: number;
}

interface RecentActivity {
  id: string;
  type: 'invitation_created' | 'access_entry' | 'access_exit' | 'invitation_used';
  visitorName: string;
  time: string;
  status: 'active' | 'completed';
  raw_time: string;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { user, profile } = useAuth();
  const {
    currentOrganization,
    currentUnit,
    currentMembership,
    canScanAccess,
    canCreateInvitations,
    isGuard,
    isAdmin,
    isLoading: isLoadingOrg,
  } = useOrganization();

  const [stats, setStats] = useState<DashboardStats>({
    activeInvitations: 0,
    visitorsToday: 0,
    pendingInvitations: 0,
    pendingPackages: 0,
  });
  const [guardStats, setGuardStats] = useState<GuardStats>({
    todayEntries: 0,
    todayExits: 0,
    activeInvitations: 0,
    avgWaitTime: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Get display name
  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Usuario';

  // Format relative time
  const formatRelativeTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!currentMembership || !currentOrganization) {
      setIsLoading(false);
      return;
    }

    try {
      const orgId = currentOrganization.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch stats in parallel
      const [activeInvRes, todayAccessRes, pendingInvRes, pendingPackagesRes, recentInvRes, recentAccessRes] = await Promise.all([
        // Active invitations count
        supabase
          .from('invitations')
          .select('id', { count: 'exact', head: true })
          .eq('created_by', user?.id)
          .eq('status', 'active'),
        // Visitors today count
        supabase
          .from('access_logs')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('entry_type', 'entry')
          .gte('created_at', today.toISOString()),
        // Pending invitations (active, not yet used)
        supabase
          .from('invitations')
          .select('id', { count: 'exact', head: true })
          .eq('created_by', user?.id)
          .eq('status', 'active')
          .is('used_at', null),
        // Pending packages for organization
        supabase
          .from('packages')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('status', 'received'),
        // Recent invitations
        supabase
          .from('invitations')
          .select('id, visitor_name, status, created_at')
          .eq('created_by', user?.id)
          .order('created_at', { ascending: false })
          .limit(5),
        // Recent access logs
        supabase
          .from('access_logs')
          .select('id, visitor_name, entry_type, direction, created_at')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      // Update stats
      setStats({
        activeInvitations: activeInvRes.count || 0,
        visitorsToday: todayAccessRes.count || 0,
        pendingInvitations: pendingInvRes.count || 0,
        pendingPackages: pendingPackagesRes.count || 0,
      });

      // Fetch guard-specific stats if user is a guard
      if (isGuard || isAdmin) {
        const [entriesRes, exitsRes, orgInvitationsRes] = await Promise.all([
          supabase
            .from('access_logs')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .eq('direction', 'entry')
            .gte('created_at', today.toISOString()),
          supabase
            .from('access_logs')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .eq('direction', 'exit')
            .gte('created_at', today.toISOString()),
          supabase
            .from('invitations')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .eq('status', 'active'),
        ]);

        setGuardStats({
          todayEntries: entriesRes.count || 0,
          todayExits: exitsRes.count || 0,
          activeInvitations: orgInvitationsRes.count || 0,
          avgWaitTime: 0,
        });
      }

      // Combine and sort recent activity
      const invitations = (recentInvRes.data || []).map((inv: Partial<Invitation>) => ({
        id: `inv-${inv.id}`,
        type: 'invitation_created' as const,
        visitorName: inv.visitor_name || 'Visitante',
        time: formatRelativeTime(inv.created_at || ''),
        status: inv.status === 'active' ? 'active' as const : 'completed' as const,
        raw_time: inv.created_at || '',
      }));

      const accessLogs = (recentAccessRes.data || []).map((log: {
        id: string;
        visitor_name: string;
        entry_type: 'invitation' | 'manual' | 'resident';
        direction?: 'entry' | 'exit';
        created_at: string;
      }) => ({
        id: `log-${log.id}`,
        type: log.direction === 'exit' ? 'access_exit' as const : 'access_entry' as const,
        visitorName: log.visitor_name || 'Visitante',
        time: formatRelativeTime(log.created_at),
        status: 'completed' as const,
        raw_time: log.created_at,
      }));

      // Combine, sort by time, and take top 5
      const combined = [...invitations, ...accessLogs]
        .sort((a, b) => new Date(b.raw_time).getTime() - new Date(a.raw_time).getTime())
        .slice(0, 5);

      setRecentActivity(combined);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentMembership, currentOrganization, isGuard, isAdmin]);

  useEffect(() => {
    fetchDashboardData();

    // Safety timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 8000);

    return () => clearTimeout(timeout);
  }, [fetchDashboardData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  const handleQuickAction = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    switch (action) {
      case 'invite':
        router.push('/(app)/invitation/create');
        break;
      case 'scan':
        router.push('/(app)/(tabs)/scan');
        break;
      case 'history':
        router.push('/(app)/(tabs)/invitations');
        break;
      case 'packages':
        router.push('/(app)/packages');
        break;
      case 'amenities':
        router.push('/(app)/amenities');
        break;
      case 'maintenance':
        router.push('/(app)/maintenance');
        break;
      case 'frequent':
        router.push('/(app)/frequent-visitors');
        break;
    }
  };

  const getActivityIcon = (type: RecentActivity['type']): string => {
    switch (type) {
      case 'invitation_created':
        return '✉️';
      case 'access_entry':
        return '🚪';
      case 'access_exit':
        return '👋';
      case 'invitation_used':
        return '✅';
      default:
        return '📌';
    }
  };

  const getActivityLabel = (type: RecentActivity['type']): string => {
    switch (type) {
      case 'invitation_created':
        return 'Invitación creada';
      case 'access_entry':
        return 'Entrada';
      case 'access_exit':
        return 'Salida';
      case 'invitation_used':
        return 'Invitación usada';
      default:
        return 'Actividad';
    }
  };

  // Loading state
  if (isLoading || isLoadingOrg) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Skeleton width={80} height={16} style={{ marginBottom: Spacing.xs }} />
              <Skeleton width={150} height={28} style={{ marginBottom: Spacing.xs }} />
              <Skeleton width={200} height={16} />
            </View>
            <Skeleton width={56} height={56} variant="circular" />
          </View>

          <Skeleton width={120} height={20} style={{ marginBottom: Spacing.md }} />
          <View style={styles.quickActions}>
            <Skeleton width="100%" height={100} style={{ flex: 1 }} />
            <Skeleton width="100%" height={100} style={{ flex: 1 }} />
            <Skeleton width="100%" height={100} style={{ flex: 1 }} />
          </View>

          <Skeleton width={120} height={20} style={{ marginBottom: Spacing.md }} />
          <View style={styles.statsContainer}>
            <Skeleton width="100%" height={80} style={{ flex: 1 }} />
            <Skeleton width="100%" height={80} style={{ flex: 1 }} />
            <Skeleton width="100%" height={80} style={{ flex: 1 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.header}
        >
          <View style={styles.headerLeft}>
            <Text variant="bodySm" color="muted">
              Bienvenido
            </Text>
            <Text variant="h2">{displayName}</Text>
            <Text variant="bodySm" color="secondary">
              {currentOrganization?.name || 'Sin organización'}
              {currentUnit?.name && ` · ${currentUnit.name}`}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(app)/(tabs)/profile');
            }}
          >
            <Avatar
              name={displayName}
              source={profile?.avatar_url}
              size="lg"
            />
          </Pressable>
        </Animated.View>

        {/* No Organization State */}
        {!currentOrganization && (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Card
              variant="elevated"
              padding="lg"
              style={styles.welcomeCard}
            >
              <Text variant="displayLg" center style={styles.welcomeIcon}>
                🏠
              </Text>
              <Text variant="h3" center style={styles.welcomeTitle}>
                ¡Bienvenido a KASETA!
              </Text>
              <Text
                variant="body"
                color="secondary"
                center
                style={styles.welcomeDescription}
              >
                Para empezar, únete a tu residencial, edificio o empresa con un código de invitación.
              </Text>
              <Button
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/(app)/organization/join');
                }}
                fullWidth
              >
                Unirse a organización
              </Button>
            </Card>
          </Animated.View>
        )}

        {/* Guard Quick Scan Button */}
        {currentOrganization && (isGuard || (canScanAccess && !canCreateInvitations)) && (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Card
              pressable
              onPress={() => handleQuickAction('scan')}
              style={[styles.guardScanCard, { backgroundColor: colors.accent }]}
              padding="lg"
            >
              <View style={styles.guardScanContent}>
                <View>
                  <Text variant="h2" customColor={colors.textOnAccent}>
                    Escanear QR
                  </Text>
                  <Text variant="body" customColor={colors.textOnAccent + 'CC'}>
                    Validar invitación de visitante
                  </Text>
                </View>
                <View style={[styles.guardScanIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text variant="displayLg">📷</Text>
                </View>
              </View>
            </Card>

            {/* Guard Stats */}
            <View style={styles.guardStatsContainer}>
              <Card variant="filled" style={styles.guardStatCard} padding="md">
                <Text variant="h2" customColor={colors.success}>
                  {guardStats.todayEntries}
                </Text>
                <Text variant="caption" color="muted">
                  Entradas hoy
                </Text>
              </Card>
              <Card variant="filled" style={styles.guardStatCard} padding="md">
                <Text variant="h2" customColor={colors.warning}>
                  {guardStats.todayExits}
                </Text>
                <Text variant="caption" color="muted">
                  Salidas hoy
                </Text>
              </Card>
              <Card variant="filled" style={styles.guardStatCard} padding="md">
                <Text variant="h2" customColor={colors.accent}>
                  {guardStats.activeInvitations}
                </Text>
                <Text variant="caption" color="muted">
                  Inv. activas
                </Text>
              </Card>
            </View>
          </Animated.View>
        )}

        {/* Quick Actions - For residents and admins */}
        {currentOrganization && canCreateInvitations && (
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>
            Acciones rápidas
          </Text>
          <View style={styles.quickActions}>
            <Card
              pressable
              onPress={() => handleQuickAction('invite')}
              style={[styles.quickActionCard, { backgroundColor: colors.accent }]}
              padding="md"
            >
              <Text variant="h1" style={styles.quickActionIcon}>
                ✉️
              </Text>
              <Text variant="bodyMedium" customColor={colors.textOnAccent}>
                Crear invitación
              </Text>
            </Card>

            {canScanAccess && (
              <Card
                pressable
                onPress={() => handleQuickAction('scan')}
                variant="outlined"
                style={styles.quickActionCard}
                padding="md"
              >
                <Text variant="h1" style={styles.quickActionIcon}>
                  📷
                </Text>
                <Text variant="bodyMedium">Escanear QR</Text>
              </Card>
            )}

            <Card
              pressable
              onPress={() => handleQuickAction('history')}
              variant="outlined"
              style={styles.quickActionCard}
              padding="md"
            >
              <Text variant="h1" style={styles.quickActionIcon}>
                📋
              </Text>
              <Text variant="bodyMedium">Invitaciones</Text>
            </Card>
          </View>
        </Animated.View>
        )}

        {/* Stats */}
        {currentOrganization && (
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>
            Resumen del día
          </Text>
          <View style={styles.statsContainer}>
            <Card variant="filled" style={styles.statCard} padding="md">
              <Text variant="h2" customColor={colors.accent}>
                {stats.activeInvitations}
              </Text>
              <Text variant="bodySm" color="secondary">
                Invitaciones activas
              </Text>
            </Card>

            <Card variant="filled" style={styles.statCard} padding="md">
              <Text variant="h2" customColor={colors.success}>
                {stats.visitorsToday}
              </Text>
              <Text variant="bodySm" color="secondary">
                Visitas hoy
              </Text>
            </Card>

            <Card variant="filled" style={styles.statCard} padding="md">
              <Text variant="h2" customColor={colors.warning}>
                {stats.pendingInvitations}
              </Text>
              <Text variant="bodySm" color="secondary">
                Pendientes
              </Text>
            </Card>
          </View>
        </Animated.View>
        )}

        {/* Pending Packages Alert */}
        {currentOrganization && stats.pendingPackages > 0 && (
          <Animated.View entering={FadeInDown.delay(350).springify()}>
            <Card
              pressable
              onPress={() => handleQuickAction('packages')}
              style={[styles.packageAlert, { backgroundColor: '#F59E0B15', borderColor: '#F59E0B' }]}
              padding="md"
            >
              <View style={styles.packageAlertContent}>
                <View style={[styles.packageAlertIcon, { backgroundColor: '#F59E0B20' }]}>
                  <Text variant="h1">📦</Text>
                </View>
                <View style={styles.packageAlertInfo}>
                  <Text variant="bodyMedium">
                    {stats.pendingPackages === 1
                      ? 'Tienes 1 paquete por recoger'
                      : `Tienes ${stats.pendingPackages} paquetes por recoger`
                    }
                  </Text>
                  <Text variant="caption" color="muted">
                    Toca para ver detalles
                  </Text>
                </View>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Community Services */}
        {currentOrganization && canCreateInvitations && (
          <Animated.View entering={FadeInDown.delay(380).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>
              Servicios
            </Text>
            <View style={styles.servicesGrid}>
              <Card
                pressable
                onPress={() => handleQuickAction('frequent')}
                variant="outlined"
                style={styles.serviceCard}
                padding="sm"
              >
                <Text variant="h3" style={styles.serviceIcon}>👥</Text>
                <Text variant="bodySm" center>Visitantes frecuentes</Text>
              </Card>
              <Card
                pressable
                onPress={() => handleQuickAction('amenities')}
                variant="outlined"
                style={styles.serviceCard}
                padding="sm"
              >
                <Text variant="h3" style={styles.serviceIcon}>🏊</Text>
                <Text variant="bodySm" center>Amenidades</Text>
              </Card>
              <Card
                pressable
                onPress={() => handleQuickAction('maintenance')}
                variant="outlined"
                style={styles.serviceCard}
                padding="sm"
              >
                <Text variant="h3" style={styles.serviceIcon}>🔧</Text>
                <Text variant="bodySm" center>Mantenimiento</Text>
              </Card>
              <Card
                pressable
                onPress={() => handleQuickAction('packages')}
                variant="outlined"
                style={styles.serviceCard}
                padding="sm"
              >
                <Text variant="h3" style={styles.serviceIcon}>📦</Text>
                <Text variant="bodySm" center>Paquetes</Text>
              </Card>
            </View>
          </Animated.View>
        )}

        {/* Recent Activity */}
        {currentOrganization && (
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <View style={styles.sectionHeader}>
            <Text variant="h4">Actividad reciente</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(app)/(tabs)/invitations');
              }}
            >
              <Text variant="bodySm" customColor={colors.accent}>
                Ver todo
              </Text>
            </Pressable>
          </View>

          {recentActivity.length === 0 ? (
            <Card variant="filled" padding="lg">
              <Text variant="body" color="muted" center>
                Sin actividad reciente
              </Text>
            </Card>
          ) : (
            recentActivity.map((activity) => (
              <Card
                key={activity.id}
                variant="outlined"
                style={styles.activityCard}
                padding="md"
                pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (activity.type === 'invitation_created') {
                    const invId = activity.id.replace('inv-', '');
                    router.push({
                      pathname: '/(app)/invitation/[id]',
                      params: { id: invId },
                    });
                  }
                }}
              >
                <View style={styles.activityRow}>
                  <View style={[styles.activityIcon, { backgroundColor: colors.surface }]}>
                    <Text variant="body">{getActivityIcon(activity.type)}</Text>
                  </View>
                  <View style={styles.activityInfo}>
                    <Text variant="bodyMedium">{activity.visitorName}</Text>
                    <Text variant="caption" color="muted">
                      {getActivityLabel(activity.type)} · {activity.time}
                    </Text>
                  </View>
                  <Badge
                    variant={activity.status === 'active' ? 'accent' : 'success'}
                    size="sm"
                  >
                    {activity.status === 'active' ? 'Activa' : 'Completada'}
                  </Badge>
                </View>
              </Card>
            ))
          )}
        </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  headerLeft: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.smd,
    marginBottom: Spacing.xl,
  },
  quickActionCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  quickActionIcon: {
    marginBottom: Spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.smd,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  activityCard: {
    marginBottom: Spacing.sm,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityInfo: {
    flex: 1,
    marginLeft: Spacing.smd,
  },
  welcomeCard: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  welcomeIcon: {
    marginBottom: Spacing.md,
  },
  welcomeTitle: {
    marginBottom: Spacing.sm,
  },
  welcomeDescription: {
    marginBottom: Spacing.lg,
  },
  guardScanCard: {
    marginBottom: Spacing.md,
  },
  guardScanContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guardScanIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guardStatsContainer: {
    flexDirection: 'row',
    gap: Spacing.smd,
    marginBottom: Spacing.xl,
  },
  guardStatCard: {
    flex: 1,
    alignItems: 'center',
  },
  packageAlert: {
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  packageAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  packageAlertIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageAlertInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.smd,
    marginBottom: Spacing.xl,
  },
  serviceCard: {
    width: '47%',
    alignItems: 'center',
  },
  serviceIcon: {
    marginBottom: Spacing.xs,
  },
});
