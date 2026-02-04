/**
 * KASETA - Role Detail Screen
 * View and edit role permissions
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Save, Trash2, Lock, Users } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Badge, Skeleton, Button, Divider } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase';
import type { Role, Permission, PermissionKey, PermissionCategory } from '@/types/permissions';
import { PERMISSION_GROUPS } from '@/types/permissions';
import { isDangerousPermission } from '@/lib/permissions';

export default function RoleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentOrganization } = useOrganization();
  const { can } = usePermissions();

  const canEditRoles = can('roles.edit');
  const canDeleteRoles = can('roles.delete');

  const [role, setRole] = useState<Role | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Set<string>>(new Set());
  const [originalPermissions, setOriginalPermissions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [memberCount, setMemberCount] = useState(0);

  const hasChanges = JSON.stringify([...rolePermissions].sort()) !==
    JSON.stringify([...originalPermissions].sort());

  const fetchData = useCallback(async () => {
    if (!currentOrganization || !id) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch role
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('*')
        .eq('id', id)
        .single();

      if (roleError) throw roleError;
      setRole(roleData);

      // Fetch all permissions
      const { data: permsData, error: permsError } = await supabase
        .from('permissions')
        .select('*')
        .order('category', { ascending: true });

      if (permsError) throw permsError;
      setAllPermissions(permsData || []);

      // Fetch role's current permissions
      const { data: rolePermsData, error: rolePermsError } = await supabase
        .from('role_permissions')
        .select('permission_id, permissions(key)')
        .eq('role_id', id);

      if (rolePermsError) throw rolePermsError;

      const permKeys = new Set(
        rolePermsData?.map((rp: any) => rp.permissions?.key).filter(Boolean) || []
      );
      setRolePermissions(permKeys);
      setOriginalPermissions(new Set(permKeys));

      // Fetch member count
      const { count } = await supabase
        .from('memberships')
        .select('*', { count: 'exact', head: true })
        .eq('role_id', id)
        .eq('is_active', true);

      setMemberCount(count || 0);
    } catch (error) {
      console.error('Error fetching role data:', error);
      Alert.alert('Error', 'No se pudo cargar la información del rol.');
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTogglePermission = (permissionKey: string) => {
    if (role?.is_system && role.slug === 'owner') {
      // Owner role cannot be modified
      Alert.alert('No permitido', 'El rol de propietario no puede ser modificado.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRolePermissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permissionKey)) {
        newSet.delete(permissionKey);
      } else {
        newSet.add(permissionKey);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!role || !canEditRoles) return;

    if (role.is_system) {
      Alert.alert('No permitido', 'Los roles del sistema no pueden ser modificados.');
      return;
    }

    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Get permission IDs for the selected keys
      const selectedPermIds = allPermissions
        .filter((p) => rolePermissions.has(p.key))
        .map((p) => p.id);

      // Delete existing role permissions
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', role.id);

      if (deleteError) throw deleteError;

      // Insert new role permissions
      if (selectedPermIds.length > 0) {
        const { error: insertError } = await supabase
          .from('role_permissions')
          .insert(
            selectedPermIds.map((permId) => ({
              role_id: role.id,
              permission_id: permId,
            }))
          );

        if (insertError) throw insertError;
      }

      setOriginalPermissions(new Set(rolePermissions));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Guardado', 'Los permisos del rol han sido actualizados.');
    } catch (error) {
      console.error('Error saving permissions:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'No se pudieron guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!role || !canDeleteRoles) return;

    if (role.is_system) {
      Alert.alert('No permitido', 'Los roles del sistema no pueden ser eliminados.');
      return;
    }

    if (memberCount > 0) {
      Alert.alert(
        'Rol en uso',
        `Este rol tiene ${memberCount} miembro(s) asignado(s). Debes reasignarlos antes de eliminar el rol.`
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
              router.back();
            } catch (error) {
              console.error('Error deleting role:', error);
              Alert.alert('Error', 'No se pudo eliminar el rol.');
            }
          },
        },
      ]
    );
  };

  // Group permissions by category
  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    const category = perm.category as PermissionCategory;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(perm);
    return acc;
  }, {} as Record<PermissionCategory, Permission[]>);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Skeleton width={120} height={24} />
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.content}>
          <Skeleton width="100%" height={100} style={{ marginBottom: Spacing.md }} />
          <Skeleton width="100%" height={200} style={{ marginBottom: Spacing.md }} />
          <Skeleton width="100%" height={200} />
        </View>
      </SafeAreaView>
    );
  }

  if (!role) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Rol no encontrado</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>
    );
  }

  const isOwnerRole = role.slug === 'owner';

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
        <Text variant="h2">{role.name}</Text>
        {canEditRoles && !role.is_system && hasChanges ? (
          <Pressable onPress={handleSave} style={styles.saveButton} disabled={isSaving}>
            <Save size={24} color={colors.accent} />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Role Info Card */}
        <Card variant="elevated" padding="lg" style={styles.infoCard}>
          <View style={styles.roleHeader}>
            <View
              style={[styles.roleColorBadge, { backgroundColor: role.color }]}
            />
            <View style={styles.roleInfo}>
              <Text variant="h3">{role.name}</Text>
              {role.description && (
                <Text variant="body" color="secondary">
                  {role.description}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.roleMeta}>
            <View style={styles.metaItem}>
              <Users size={16} color={colors.textMuted} />
              <Text variant="bodySm" color="muted">
                {memberCount} miembro(s)
              </Text>
            </View>
            {role.is_system && (
              <View style={styles.metaItem}>
                <Lock size={16} color={colors.textMuted} />
                <Text variant="bodySm" color="muted">
                  Rol del sistema
                </Text>
              </View>
            )}
            {role.is_default && (
              <Badge variant="info" size="sm">
                Por defecto
              </Badge>
            )}
          </View>
        </Card>

        {/* Permissions */}
        <Text variant="h4" style={styles.sectionTitle}>
          Permisos
        </Text>

        {isOwnerRole && (
          <Card variant="filled" padding="md" style={styles.warningCard}>
            <Text variant="bodySm" color="muted">
              El rol de propietario tiene todos los permisos y no puede ser modificado.
            </Text>
          </Card>
        )}

        {Object.entries(PERMISSION_GROUPS).map(([category, config]) => {
          const categoryPerms = groupedPermissions[category as PermissionCategory] || [];
          if (categoryPerms.length === 0) return null;

          return (
            <Card key={category} variant="outlined" style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <Text variant="body">{config.icon}</Text>
                <Text variant="bodyMedium" style={styles.categoryTitle}>
                  {config.label}
                </Text>
              </View>
              <Divider subtle spacing={Spacing.sm} />
              {categoryPerms.map((perm) => {
                const isEnabled = rolePermissions.has(perm.key);
                const isDangerous = isDangerousPermission(perm.key as PermissionKey);
                const isDisabled = isOwnerRole || (role.is_system && !canEditRoles);

                return (
                  <View key={perm.id} style={styles.permissionRow}>
                    <View style={styles.permissionInfo}>
                      <Text
                        variant="bodySm"
                        customColor={isDangerous ? colors.error : colors.text}
                      >
                        {perm.name}
                      </Text>
                      {perm.description && (
                        <Text variant="caption" color="muted" numberOfLines={2}>
                          {perm.description}
                        </Text>
                      )}
                    </View>
                    <Switch
                      value={isEnabled}
                      onValueChange={() => handleTogglePermission(perm.key)}
                      disabled={isDisabled}
                      trackColor={{
                        false: colors.border,
                        true: isDangerous ? colors.error : colors.accent,
                      }}
                      thumbColor={colors.background}
                    />
                  </View>
                );
              })}
            </Card>
          );
        })}

        {/* Delete Button */}
        {canDeleteRoles && !role.is_system && (
          <Button
            variant="destructive"
            onPress={handleDelete}
            style={styles.deleteButton}
            fullWidth
          >
            Eliminar rol
          </Button>
        )}

        <View style={styles.bottomSpacer} />
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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  infoCard: {
    marginBottom: Spacing.lg,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  roleColorBadge: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.md,
  },
  roleInfo: {
    flex: 1,
  },
  roleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  warningCard: {
    marginBottom: Spacing.md,
  },
  categoryCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryTitle: {
    marginLeft: Spacing.sm,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  permissionInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  deleteButton: {
    marginTop: Spacing.xl,
  },
  bottomSpacer: {
    height: Spacing.xxxl,
  },
});
