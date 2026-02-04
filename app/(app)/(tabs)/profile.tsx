/**
 * KASETA - Profile Screen
 * User profile and settings
 */

import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Avatar, Badge, Divider, Skeleton } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { usePermissions } from '@/hooks/usePermissions';
import { OrganizationSwitcher, OrganizationSwitcherRef } from '@/components/features/OrganizationSwitcher';
import { getRoleDisplayName, getRoleColor } from '@/lib/permissions';

interface MenuItemProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  showChevron?: boolean;
}

function MenuItem({
  icon,
  label,
  value,
  onPress,
  destructive = false,
  showChevron = true,
}: MenuItemProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.menuItem,
        pressed && { backgroundColor: colors.surfaceHover },
      ]}
    >
      <View style={styles.menuItemLeft}>
        <Text variant="body" style={styles.menuIcon}>
          {icon}
        </Text>
        <Text
          variant="body"
          customColor={destructive ? colors.error : colors.text}
        >
          {label}
        </Text>
      </View>
      <View style={styles.menuItemRight}>
        {value && (
          <Text variant="bodySm" color="muted" style={styles.menuValue}>
            {value}
          </Text>
        )}
        {showChevron && (
          <Text variant="body" color="muted">
            →
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const ROLE_LABELS: Record<string, string> = {
  resident: 'Residente',
  admin: 'Administrador',
  guard: 'Guardia',
  super_admin: 'Super Admin',
};

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { user, profile, signOut, isLoading } = useAuth();
  const {
    currentOrganization,
    currentUnit,
    currentRole,
    currentMembership,
    memberships,
  } = useOrganization();

  // Use new permission system
  const { canAny, role, isAdmin: hasAdminPermissions } = usePermissions();

  // Check if user can access admin panel
  const canAccessAdmin = canAny(['members.view', 'units.view', 'reports.view']);

  const orgSwitcherRef = useRef<OrganizationSwitcherRef>(null);

  const handleEditProfile = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(app)/settings/edit-profile');
  }, []);

  const handleChangeOrganization = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    orgSwitcherRef.current?.open();
  }, []);

  const handleAdminDashboard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(app)/admin');
  };

  const handleJoinOrganization = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(app)/organization/join');
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  // Use profile data or fallbacks
  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Usuario';
  const displayEmail = profile?.email || user?.email || '';
  const displayPhone = profile?.phone || user?.phone || '';
  // Use new role system if available, fallback to legacy
  const displayRole = role?.name
    || currentMembership?.role_info?.name
    || (currentRole ? ROLE_LABELS[currentRole] || currentRole : 'Sin rol');
  const roleColor = role?.color || currentMembership?.role_info?.color || colors.accent;
  const displayOrganization = currentOrganization?.name || null;
  const displayUnit = currentUnit?.name || null;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Skeleton width={100} height={32} />
          </View>
          <Card variant="elevated" style={styles.profileCard} padding="lg">
            <View style={styles.profileHeader}>
              <Skeleton width={72} height={72} variant="circular" />
            </View>
            <View style={styles.profileInfo}>
              <Skeleton width={150} height={24} style={{ marginBottom: Spacing.sm }} />
              <Skeleton width={100} height={20} style={{ marginBottom: Spacing.sm }} />
              <Skeleton width={180} height={16} />
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.header}
        >
          <Text variant="h1">Perfil</Text>
        </Animated.View>

        {/* Profile Card */}
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <Card variant="elevated" style={styles.profileCard} padding="lg">
            <View style={styles.profileHeader}>
              <Avatar
                name={displayName}
                source={profile?.avatar_url}
                size="xl"
              />
              <Pressable
                onPress={handleEditProfile}
                style={[styles.editButton, { backgroundColor: colors.surface }]}
              >
                <Text variant="bodySm" color="secondary">
                  Editar
                </Text>
              </Pressable>
            </View>

            <View style={styles.profileInfo}>
              <Text variant="h2">{displayName}</Text>
              <View style={styles.roleContainer}>
                <Badge variant="accent">{displayRole}</Badge>
              </View>
              {displayEmail ? (
                <Text variant="body" color="secondary">
                  {displayEmail}
                </Text>
              ) : null}
              {displayPhone ? (
                <Text variant="bodySm" color="muted">
                  {displayPhone}
                </Text>
              ) : null}
            </View>
          </Card>
        </Animated.View>

        {/* Organization Card */}
        {displayOrganization ? (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Card
              variant="outlined"
              style={styles.orgCard}
              padding="md"
              pressable
              onPress={memberships.length > 1 ? handleChangeOrganization : undefined}
            >
              <View style={styles.orgContent}>
                <View style={styles.orgInfo}>
                  <Text variant="caption" color="muted">
                    Organización actual
                  </Text>
                  <Text variant="bodyMedium">{displayOrganization}</Text>
                  {displayUnit ? (
                    <Text variant="bodySm" color="secondary">
                      {displayUnit}
                    </Text>
                  ) : null}
                </View>
                {memberships.length > 1 && (
                  <View
                    style={[
                      styles.changeOrgButton,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <Text variant="caption" color="secondary">
                      Cambiar
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Card
              variant="elevated"
              style={styles.orgCard}
              padding="md"
              pressable
              onPress={handleJoinOrganization}
            >
              <View style={styles.joinOrgContent}>
                <Text variant="display" style={styles.joinOrgIcon}>🏠</Text>
                <View style={styles.joinOrgInfo}>
                  <Text variant="bodyMedium">Unirse a una organización</Text>
                  <Text variant="caption" color="muted">
                    Únete con un código de invitación
                  </Text>
                </View>
                <Text variant="body" color="accent">→</Text>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Admin Section */}
        {canAccessAdmin && displayOrganization && (
          <Animated.View entering={FadeInDown.delay(225).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>
              Administración
            </Text>
            <Card variant="filled" style={styles.menuCard} padding="none">
              <MenuItem
                icon="🛠️"
                label="Panel de administrador"
                onPress={handleAdminDashboard}
              />
            </Card>
          </Animated.View>
        )}

        {/* Settings Menu */}
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>
            Cuenta
          </Text>
          <Card variant="filled" style={styles.menuCard} padding="none">
            <MenuItem
              icon="👤"
              label="Información personal"
              onPress={handleEditProfile}
            />
            <Divider subtle spacing={0} />
            <MenuItem
              icon="🚗"
              label="Mis vehículos"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(app)/vehicles');
              }}
            />
            <Divider subtle spacing={0} />
            <MenuItem
              icon="🔒"
              label="Seguridad"
              value="Contraseña"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(app)/settings/security');
              }}
            />
            <Divider subtle spacing={0} />
            <MenuItem
              icon="🔔"
              label="Notificaciones"
              value="Activadas"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(app)/settings/notifications');
              }}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>
            Preferencias
          </Text>
          <Card variant="filled" style={styles.menuCard} padding="none">
            <MenuItem
              icon="🌙"
              label="Apariencia"
              value={isDark ? 'Oscuro' : 'Claro'}
            />
            <Divider subtle spacing={0} />
            <MenuItem
              icon="🌐"
              label="Idioma"
              value="Español"
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>
            Soporte
          </Text>
          <Card variant="filled" style={styles.menuCard} padding="none">
            <MenuItem icon="❓" label="Centro de ayuda" />
            <Divider subtle spacing={0} />
            <MenuItem icon="📝" label="Términos de servicio" />
            <Divider subtle spacing={0} />
            <MenuItem icon="🔐" label="Política de privacidad" />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Card variant="filled" style={styles.menuCard} padding="none">
            <MenuItem
              icon="🚪"
              label="Cerrar sesión"
              onPress={handleLogout}
              destructive
              showChevron={false}
            />
          </Card>
        </Animated.View>

        {/* Footer */}
        <Animated.View
          entering={FadeInDown.delay(450).springify()}
          style={styles.footer}
        >
          <Text variant="caption" color="muted" center>
            KASETA v1.0.0
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Organization Switcher Modal */}
      <OrganizationSwitcher ref={orgSwitcherRef} />
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
    marginBottom: Spacing.lg,
  },
  profileCard: {
    marginBottom: Spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  editButton: {
    paddingHorizontal: Spacing.smd,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  profileInfo: {
    alignItems: 'center',
  },
  roleContainer: {
    marginVertical: Spacing.sm,
  },
  orgCard: {
    marginBottom: Spacing.xl,
  },
  orgContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orgInfo: {
    flex: 1,
  },
  changeOrgButton: {
    paddingHorizontal: Spacing.smd,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  joinOrgContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinOrgIcon: {
    marginRight: Spacing.md,
  },
  joinOrgInfo: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  menuCard: {
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: Spacing.smd,
    width: 24,
    textAlign: 'center',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuValue: {
    marginRight: Spacing.sm,
  },
  footer: {
    marginTop: Spacing.xl,
    gap: Spacing.xs,
  },
});
