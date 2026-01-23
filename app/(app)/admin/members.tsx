/**
 * KASETA - Admin Members Screen
 * Manage organization members
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  Search,
  Filter,
  UserPlus,
  MoreVertical,
  Shield,
  User,
  Home,
} from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Badge, Avatar, Input, Button, Skeleton, EmptyState } from '@/components/ui';
import { useOrganization, UserRole, Membership, Unit } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase';

interface MemberWithProfile extends Membership {
  profile?: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  };
}

const ROLE_CONFIG: Record<UserRole, { label: string; color: string }> = {
  resident: { label: 'Residente', color: '#10B981' },
  admin: { label: 'Admin', color: '#3B82F6' },
  guard: { label: 'Guardia', color: '#F59E0B' },
  super_admin: { label: 'Super Admin', color: '#8B5CF6' },
};

type FilterRole = 'all' | UserRole;

export default function AdminMembersScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentOrganization, isSuperAdmin } = useOrganization();

  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<FilterRole>('all');

  const fetchMembers = useCallback(async () => {
    if (!currentOrganization?.id) return;

    try {
      const { data, error } = await supabase
        .from('memberships')
        .select(`
          *,
          profile:profiles(*),
          unit:units(*)
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', true)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      // Transform Supabase response
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        profile: Array.isArray(item.profile) ? item.profile[0] : item.profile,
        unit: Array.isArray(item.unit) ? item.unit[0] : item.unit,
      }));

      setMembers(transformedData as MemberWithProfile[]);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchMembers();
    setRefreshing(false);
  }, [fetchMembers]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const handleChangeRole = useCallback(
    async (member: MemberWithProfile, newRole: UserRole) => {
      if (!isSuperAdmin && newRole === 'super_admin') {
        Alert.alert('Sin permisos', 'Solo un Super Admin puede asignar este rol.');
        return;
      }

      Alert.alert(
        'Cambiar rol',
        `¿Cambiar el rol de ${member.profile?.full_name || 'este miembro'} a ${ROLE_CONFIG[newRole].label}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Confirmar',
            onPress: async () => {
              try {
                const { error } = await supabase
                  .from('memberships')
                  .update({ role: newRole })
                  .eq('id', member.id);

                if (error) throw error;

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                fetchMembers();
              } catch (error) {
                Alert.alert('Error', 'No se pudo cambiar el rol.');
              }
            },
          },
        ]
      );
    },
    [isSuperAdmin, fetchMembers]
  );

  const handleDeactivateMember = useCallback(
    (member: MemberWithProfile) => {
      Alert.alert(
        'Desactivar miembro',
        `¿Desactivar a ${member.profile?.full_name || 'este miembro'}? Ya no tendrá acceso a la organización.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Desactivar',
            style: 'destructive',
            onPress: async () => {
              try {
                const { error } = await supabase
                  .from('memberships')
                  .update({ is_active: false })
                  .eq('id', member.id);

                if (error) throw error;

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                fetchMembers();
              } catch (error) {
                Alert.alert('Error', 'No se pudo desactivar el miembro.');
              }
            },
          },
        ]
      );
    },
    [fetchMembers]
  );

  const handleMemberOptions = useCallback(
    (member: MemberWithProfile) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const options = [
        { text: 'Cancelar', style: 'cancel' as const },
        {
          text: 'Cambiar a Residente',
          onPress: () => handleChangeRole(member, 'resident'),
        },
        {
          text: 'Cambiar a Guardia',
          onPress: () => handleChangeRole(member, 'guard'),
        },
        {
          text: 'Cambiar a Admin',
          onPress: () => handleChangeRole(member, 'admin'),
        },
      ];

      if (isSuperAdmin) {
        options.push({
          text: 'Cambiar a Super Admin',
          onPress: () => handleChangeRole(member, 'super_admin'),
        });
      }

      options.push({
        text: 'Desactivar miembro',
        style: 'destructive' as const,
        onPress: () => handleDeactivateMember(member),
      } as any);

      Alert.alert(
        member.profile?.full_name || 'Miembro',
        'Selecciona una acción',
        options
      );
    },
    [handleChangeRole, handleDeactivateMember, isSuperAdmin]
  );

  const filteredMembers = members.filter((member) => {
    // Filter by role
    if (filterRole !== 'all' && member.role !== filterRole) {
      return false;
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const name = member.profile?.full_name?.toLowerCase() || '';
      const email = member.profile?.email?.toLowerCase() || '';
      const unit = member.unit?.name?.toLowerCase() || '';
      return name.includes(query) || email.includes(query) || unit.includes(query);
    }

    return true;
  });

  const renderMember = useCallback(
    ({ item, index }: { item: MemberWithProfile; index: number }) => {
      const roleConfig = ROLE_CONFIG[item.role];

      return (
        <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
          <Card variant="filled" padding="md" style={styles.memberCard}>
            <View style={styles.memberHeader}>
              <Avatar
                name={item.profile?.full_name || 'Usuario'}
                source={item.profile?.avatar_url}
                size="md"
              />
              <View style={styles.memberInfo}>
                <Text variant="bodyMedium" numberOfLines={1}>
                  {item.profile?.full_name || 'Sin nombre'}
                </Text>
                <Text variant="caption" color="muted" numberOfLines={1}>
                  {item.profile?.email || 'Sin email'}
                </Text>
              </View>
              <View style={styles.memberActions}>
                <Badge
                  variant="default"
                  size="sm"
                >
                  {roleConfig.label}
                </Badge>
                <Pressable
                  onPress={() => handleMemberOptions(item)}
                  style={styles.optionsButton}
                >
                  <MoreVertical size={18} color={colors.textMuted} />
                </Pressable>
              </View>
            </View>

            {item.unit && (
              <View style={styles.memberUnit}>
                <Home size={14} color={colors.textMuted} />
                <Text variant="caption" color="secondary">
                  {item.unit.name}
                </Text>
              </View>
            )}
          </Card>
        </Animated.View>
      );
    },
    [colors, handleMemberOptions]
  );

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Search */}
      <Input
        placeholder="Buscar por nombre, email o unidad..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        leftElement={<Search size={18} color={colors.textMuted} />}
      />

      {/* Role Filter */}
      <View style={styles.filterTabs}>
        {(['all', 'resident', 'admin', 'guard'] as FilterRole[]).map((role) => (
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

      <Text variant="caption" color="muted" style={styles.resultCount}>
        {filteredMembers.length} miembro{filteredMembers.length !== 1 ? 's' : ''}
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
          <Text variant="h2">Miembros</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.content}>
          {[0, 1, 2, 3].map((i) => (
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
        <Text variant="h2">Miembros</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <FlatList
        data={filteredMembers}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="👥"
            title="Sin miembros"
            description="No hay miembros que coincidan con tu búsqueda"
          />
        }
        contentContainerStyle={[
          styles.content,
          filteredMembers.length === 0 && styles.contentEmpty,
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
  memberCard: {
    marginBottom: Spacing.sm,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
    marginLeft: Spacing.smd,
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  optionsButton: {
    padding: Spacing.xs,
  },
  memberUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
});
