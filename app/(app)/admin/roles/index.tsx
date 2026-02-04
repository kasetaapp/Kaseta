/**
 * KASETA - Roles Management Screen
 * List and manage organization roles
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { ChevronLeft, Plus, Shield, Users, Lock } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Badge, Skeleton, EmptyState } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase';
import type { Role } from '@/types/permissions';
import { isSystemRole } from '@/lib/permissions';

interface RoleWithCount extends Role {
  member_count: number;
}

export default function RolesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentOrganization } = useOrganization();
  const { can } = usePermissions();

  const canCreateRoles = can('roles.create');
  const canEditRoles = can('roles.edit');
  const canDeleteRoles = can('roles.delete');

  const [roles, setRoles] = useState<RoleWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRoles = useCallback(async () => {
    if (!currentOrganization) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('hierarchy_level', { ascending: true });

      if (rolesError) throw rolesError;

      // Fetch member counts for each role
      const rolesWithCounts = await Promise.all(
        (rolesData || []).map(async (role) => {
          const { count } = await supabase
            .from('memberships')
            .select('*', { count: 'exact', head: true })
            .eq('role_id', role.id)
            .eq('is_active', true);

          return {
            ...role,
            member_count: count || 0,
          };
        })
      );

      setRoles(rolesWithCounts);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRoles();
    setRefreshing(false);
  };

  const handleRolePress = (role: RoleWithCount) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/(app)/admin/roles/[id]',
      params: { id: role.id },
    });
  };

  const handleCreateRole = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(app)/admin/roles/create');
  };

  const handleDeleteRole = async (role: RoleWithCount) => {
    if (role.is_system) {
      Alert.alert('No permitido', 'Los roles del sistema no pueden ser eliminados.');
      return;
    }

    if (role.member_count > 0) {
      Alert.alert(
        'Rol en uso',
        `Este rol tiene ${role.member_count} miembro(s) asignado(s). Debes reasignarlos antes de eliminar el rol.`
      );
      return;
    }

    Alert.alert(
      'Eliminar rol',
      `¿Estás seguro de que deseas eliminar el rol "${role.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('roles')
                .delete()
                .eq('id', role.id);

              if (error) throw error;

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              fetchRoles();
            } catch (error) {
              console.error('Error deleting role:', error);
              Alert.alert('Error', 'No se pudo eliminar el rol.');
            }
          },
        },
      ]
    );
  };

  const renderRoleCard = ({ item, index }: { item: RoleWithCount; index: number }) => {
    const isSystem = item.is_system;

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
        <Card
          variant="outlined"
          padding="md"
          style={styles.roleCard}
          pressable
          onPress={() => handleRolePress(item)}
        >
          <View style={styles.roleHeader}>
            <View style={styles.roleInfo}>
              <View style={styles.roleNameRow}>
                <View
                  style={[
                    styles.roleColorDot,
                    { backgroundColor: item.color },
                  ]}
                />
                <Text variant="bodyMedium">{item.name}</Text>
                {isSystem && (
                  <Badge variant="default" size="sm">
                    Sistema
                  </Badge>
                )}
                {item.is_default && (
                  <Badge variant="info" size="sm">
                    Por defecto
                  </Badge>
                )}
              </View>
              {item.description && (
                <Text variant="caption" color="muted" style={styles.roleDescription}>
                  {item.description}
                </Text>
              )}
            </View>

            <View style={styles.roleStats}>
              <View style={styles.memberCount}>
                <Users size={14} color={colors.textMuted} />
                <Text variant="caption" color="muted">
                  {item.member_count}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.roleActions}>
            <Text variant="caption" color="muted">
              Nivel: {item.hierarchy_level}
            </Text>
            {isSystem && (
              <View style={styles.systemBadge}>
                <Lock size={12} color={colors.textMuted} />
                <Text variant="caption" color="muted" style={{ marginLeft: 4 }}>
                  Protegido
                </Text>
              </View>
            )}
          </View>
        </Card>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Roles</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.content}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width="100%" height={100} style={{ marginBottom: Spacing.md }} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text variant="h2">Roles</Text>
        {canCreateRoles ? (
          <Pressable onPress={handleCreateRole} style={styles.addButton}>
            <Plus size={24} color={colors.accent} />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </Animated.View>

      <FlatList
        data={roles}
        renderItem={renderRoleCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="🎭"
            title="Sin roles"
            description="No hay roles configurados para esta organización"
            actionLabel={canCreateRoles ? 'Crear rol' : undefined}
            onAction={canCreateRoles ? handleCreateRole : undefined}
          />
        }
        ListHeaderComponent={
          <Card variant="filled" padding="md" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Shield size={20} color={colors.accent} />
              <View style={styles.infoText}>
                <Text variant="bodyMedium">Sistema de Roles</Text>
                <Text variant="caption" color="muted">
                  Los roles definen qué acciones pueden realizar los miembros.
                  Los roles del sistema no pueden ser eliminados.
                </Text>
              </View>
            </View>
          </Card>
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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  infoCard: {
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: Spacing.smd,
  },
  roleCard: {
    marginBottom: Spacing.md,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  roleInfo: {
    flex: 1,
  },
  roleNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  roleColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  roleDescription: {
    marginTop: Spacing.xs,
    marginLeft: 20,
  },
  roleStats: {
    alignItems: 'flex-end',
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  systemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
