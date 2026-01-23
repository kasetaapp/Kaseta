/**
 * KASETA - Admin Users Screen
 * Manage all organization users with filtering capabilities
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
  Users,
  Home,
} from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Badge, Skeleton, EmptyState } from '@/components/ui';
import { useOrganization, UserRole } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase';

interface OrganizationMember {
  id: string;
  user_id: string;
  organization_id: string;
  role: UserRole;
  unit_id: string | null;
  status: string;
  created_at: string;
  profile?: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  };
  unit?: {
    id: string;
    name: string;
    identifier: string | null;
  };
}

const ROLE_CONFIG: Record<UserRole, { label: string; variant: 'default' | 'success' | 'info' | 'warning' | 'accent' }> = {
  resident: { label: 'Residente', variant: 'success' },
  admin: { label: 'Admin', variant: 'info' },
  guard: { label: 'Guardia', variant: 'warning' },
  super_admin: { label: 'Super Admin', variant: 'accent' },
};

type FilterRole = 'all' | UserRole;

export default function AdminUsersScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentOrganization } = useOrganization();

  const [users, setUsers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<FilterRole>('all');

  const fetchUsers = useCallback(async () => {
    if (!currentOrganization?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          *,
          profile:profiles(*),
          unit:units(*)
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform Supabase response to handle array joins
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        profile: Array.isArray(item.profile) ? item.profile[0] : item.profile,
        unit: Array.isArray(item.unit) ? item.unit[0] : item.unit,
      }));

      setUsers(transformedData as OrganizationMember[]);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchUsers();
    setRefreshing(false);
  }, [fetchUsers]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const filteredUsers = users.filter((user) => {
    // Filter by role
    if (filterRole !== 'all' && user.role !== filterRole) {
      return false;
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const name = user.profile?.full_name?.toLowerCase() || '';
      const email = user.profile?.email?.toLowerCase() || '';
      const unitName = user.unit?.name?.toLowerCase() || '';
      return name.includes(query) || email.includes(query) || unitName.includes(query);
    }

    return true;
  });

  const totalUsers = users.length;

  const renderUser = useCallback(
    ({ item, index }: { item: OrganizationMember; index: number }) => {
      const roleConfig = ROLE_CONFIG[item.role];

      return (
        <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
          <Card variant="filled" padding="md" style={styles.userCard}>
            <View style={styles.userHeader}>
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
                <Users size={20} color={colors.textMuted} />
              </View>
              <View style={styles.userInfo}>
                <Text variant="bodyMedium" numberOfLines={1}>
                  {item.profile?.full_name || 'Sin nombre'}
                </Text>
                <Text variant="caption" color="muted" numberOfLines={1}>
                  {item.profile?.email || 'Sin email'}
                </Text>
              </View>
              <Badge variant={roleConfig.variant} size="sm">
                {roleConfig.label}
              </Badge>
            </View>

            {item.unit && (
              <View style={[styles.userUnit, { borderTopColor: colors.border }]}>
                <Home size={14} color={colors.textMuted} />
                <Text variant="caption" color="secondary">
                  {item.unit.name}
                  {item.unit.identifier && ` (${item.unit.identifier})`}
                </Text>
              </View>
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
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Search size={18} color={colors.textMuted} />
        <Pressable style={styles.searchInput}>
          <Text variant="body" color="muted">
            Buscar por nombre, email o unidad...
          </Text>
        </Pressable>
      </View>

      {/* Role Filter */}
      <View style={styles.filterTabs}>
        {(['all', 'admin', 'resident', 'guard'] as FilterRole[]).map((role) => (
          <Pressable
            key={role}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilterRole(role);
            }}
            style={[
              styles.filterTab,
              {
                backgroundColor:
                  filterRole === role ? colors.primary : colors.surface,
              },
            ]}
          >
            <Text
              variant="bodySm"
              customColor={
                filterRole === role ? colors.background : colors.textSecondary
              }
            >
              {role === 'all' ? 'Todos' : ROLE_CONFIG[role].label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* User Count */}
      <View style={styles.countContainer}>
        <Text variant="h4">
          {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''}
        </Text>
        {filterRole !== 'all' && (
          <Text variant="caption" color="muted">
            de {totalUsers} total
          </Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Usuarios</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.content}>
          <Skeleton width="100%" height={48} style={{ marginBottom: Spacing.md }} />
          <View style={styles.filterTabs}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} width={70} height={36} style={{ borderRadius: BorderRadius.full }} />
            ))}
          </View>
          <Skeleton width={120} height={24} style={{ marginTop: Spacing.lg, marginBottom: Spacing.md }} />
          {[0, 1, 2, 3, 4].map((i) => (
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
        <Text variant="h2">Usuarios</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="👥"
            title="Sin usuarios"
            description={
              searchQuery || filterRole !== 'all'
                ? 'No hay usuarios que coincidan con tu busqueda'
                : 'No hay usuarios registrados en esta organizacion'
            }
          />
        }
        contentContainerStyle={[
          styles.content,
          filteredUsers.length === 0 && styles.contentEmpty,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.smd,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
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
  countContainer: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  userCard: {
    marginBottom: Spacing.sm,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.smd,
  },
  userUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
});
