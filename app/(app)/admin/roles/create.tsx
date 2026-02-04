/**
 * KASETA - Create Role Screen
 * Create a new custom role
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
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Check } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Input, Button, Divider } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase';
import type { Permission, PermissionKey, PermissionCategory } from '@/types/permissions';
import { PERMISSION_GROUPS } from '@/types/permissions';
import { isDangerousPermission, DEFAULT_ROLE_CONFIGS } from '@/lib/permissions';

const ROLE_COLORS = [
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
];

export default function CreateRoleScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentOrganization } = useOrganization();
  const { can } = usePermissions();

  const canCreateRoles = can('roles.create');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(ROLE_COLORS[0]);
  const [hierarchyLevel, setHierarchyLevel] = useState(75);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPermissions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setAllPermissions(data || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const handleTogglePermission = (permissionKey: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permissionKey)) {
        newSet.delete(permissionKey);
      } else {
        newSet.add(permissionKey);
      }
      return newSet;
    });
  };

  const handleCreate = async () => {
    if (!currentOrganization || !canCreateRoles) return;

    if (!name.trim()) {
      Alert.alert('Error', 'El nombre del rol es requerido.');
      return;
    }

    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Generate slug from name
      const slug = `custom-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;

      // Create role
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .insert({
          organization_id: currentOrganization.id,
          name: name.trim(),
          slug,
          description: description.trim() || null,
          color: selectedColor,
          hierarchy_level: hierarchyLevel,
          is_system: false,
          is_default: false,
        })
        .select()
        .single();

      if (roleError) throw roleError;

      // Get permission IDs for selected keys
      const selectedPermIds = allPermissions
        .filter((p) => selectedPermissions.has(p.key))
        .map((p) => p.id);

      // Insert role permissions
      if (selectedPermIds.length > 0) {
        const { error: permError } = await supabase
          .from('role_permissions')
          .insert(
            selectedPermIds.map((permId) => ({
              role_id: roleData.id,
              permission_id: permId,
            }))
          );

        if (permError) throw permError;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error: any) {
      console.error('Error creating role:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      if (error.code === '23505') {
        Alert.alert('Error', 'Ya existe un rol con ese nombre.');
      } else {
        Alert.alert('Error', 'No se pudo crear el rol.');
      }
    } finally {
      setIsSaving(false);
    }
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

  if (!canCreateRoles) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Sin permisos</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.noPermission}>
          <Text variant="body" color="muted" center>
            No tienes permiso para crear roles.
          </Text>
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
        <Text variant="h2">Crear rol</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Info */}
        <Card variant="elevated" padding="lg" style={styles.card}>
          <Text variant="h4" style={styles.cardTitle}>
            Información básica
          </Text>

          <Input
            label="Nombre del rol"
            placeholder="Ej: Comité de vecinos"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Input
            label="Descripción (opcional)"
            placeholder="Describe las responsabilidades de este rol"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={2}
            style={{ marginTop: Spacing.md }}
          />

          <Text variant="label" style={styles.colorLabel}>
            Color del rol
          </Text>
          <View style={styles.colorPicker}>
            {ROLE_COLORS.map((color) => (
              <Pressable
                key={color}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedColor(color);
                }}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorOptionSelected,
                ]}
              >
                {selectedColor === color && (
                  <Check size={16} color="white" />
                )}
              </Pressable>
            ))}
          </View>
        </Card>

        {/* Permissions */}
        <Text variant="h4" style={styles.sectionTitle}>
          Permisos ({selectedPermissions.size} seleccionados)
        </Text>

        {Object.entries(PERMISSION_GROUPS).map(([category, config]) => {
          const categoryPerms = groupedPermissions[category as PermissionCategory] || [];
          if (categoryPerms.length === 0) return null;

          const selectedInCategory = categoryPerms.filter((p) =>
            selectedPermissions.has(p.key)
          ).length;

          return (
            <Card key={category} variant="outlined" style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <Text variant="body">{config.icon}</Text>
                <Text variant="bodyMedium" style={styles.categoryTitle}>
                  {config.label}
                </Text>
                <Text variant="caption" color="muted">
                  {selectedInCategory}/{categoryPerms.length}
                </Text>
              </View>
              <Divider subtle spacing={Spacing.sm} />
              {categoryPerms.map((perm) => {
                const isEnabled = selectedPermissions.has(perm.key);
                const isDangerous = isDangerousPermission(perm.key as PermissionKey);

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

        {/* Create Button */}
        <Button
          onPress={handleCreate}
          loading={isSaving}
          disabled={!name.trim() || isSaving}
          fullWidth
          style={styles.createButton}
        >
          Crear rol
        </Button>

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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  noPermission: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    marginBottom: Spacing.md,
  },
  colorLabel: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  colorPicker: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  sectionTitle: {
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
    flex: 1,
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
  createButton: {
    marginTop: Spacing.lg,
  },
  bottomSpacer: {
    height: Spacing.xxxl,
  },
});
