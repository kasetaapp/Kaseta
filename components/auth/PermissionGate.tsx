/**
 * KASETA - PermissionGate Component
 * Conditionally renders children based on user permissions
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { usePermissions } from '@/hooks/usePermissions';
import type { PermissionKey } from '@/types/permissions';
import { Text, Card } from '@/components/ui';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

interface PermissionGateProps {
  /**
   * Single permission required to render children
   */
  permission?: PermissionKey;

  /**
   * Multiple permissions - user needs ANY of these
   */
  anyOf?: PermissionKey[];

  /**
   * Multiple permissions - user needs ALL of these
   */
  allOf?: PermissionKey[];

  /**
   * Children to render if user has permission
   */
  children: React.ReactNode;

  /**
   * Fallback to render if user doesn't have permission
   * If not provided, nothing is rendered
   */
  fallback?: React.ReactNode;

  /**
   * Show a "no permission" message instead of hiding
   */
  showNoPermission?: boolean;

  /**
   * Custom message for no permission state
   */
  noPermissionMessage?: string;
}

/**
 * Component that conditionally renders children based on permissions
 *
 * @example
 * // Single permission
 * <PermissionGate permission="announcements.create">
 *   <CreateAnnouncementButton />
 * </PermissionGate>
 *
 * @example
 * // Any of multiple permissions
 * <PermissionGate anyOf={['access.scan', 'access.manual']}>
 *   <ScannerUI />
 * </PermissionGate>
 *
 * @example
 * // All permissions required
 * <PermissionGate allOf={['members.view', 'members.roles']}>
 *   <RoleManagementPanel />
 * </PermissionGate>
 *
 * @example
 * // With fallback
 * <PermissionGate permission="org.settings" fallback={<SettingsDisabled />}>
 *   <SettingsPanel />
 * </PermissionGate>
 */
export function PermissionGate({
  permission,
  anyOf,
  allOf,
  children,
  fallback,
  showNoPermission = false,
  noPermissionMessage = 'No tienes permiso para ver este contenido',
}: PermissionGateProps) {
  const { can, canAny, canAll, isLoading } = usePermissions();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  // Determine if user has permission
  let hasPermission = false;

  if (permission) {
    hasPermission = can(permission);
  } else if (anyOf && anyOf.length > 0) {
    hasPermission = canAny(anyOf);
  } else if (allOf && allOf.length > 0) {
    hasPermission = canAll(allOf);
  } else {
    // No permission specified, allow access
    hasPermission = true;
  }

  // While loading, render nothing to prevent flash
  if (isLoading) {
    return null;
  }

  // User has permission, render children
  if (hasPermission) {
    return <>{children}</>;
  }

  // User doesn't have permission
  if (fallback) {
    return <>{fallback}</>;
  }

  if (showNoPermission) {
    return (
      <Card variant="filled" padding="lg" style={styles.noPermissionCard}>
        <Text variant="h3" center style={styles.noPermissionIcon}>
          🔒
        </Text>
        <Text variant="body" color="muted" center>
          {noPermissionMessage}
        </Text>
      </Card>
    );
  }

  // Default: render nothing
  return null;
}

/**
 * Hook-based alternative for more complex permission logic
 */
export function usePermissionGate(
  permission?: PermissionKey,
  anyOf?: PermissionKey[],
  allOf?: PermissionKey[]
): { hasPermission: boolean; isLoading: boolean } {
  const { can, canAny, canAll, isLoading } = usePermissions();

  let hasPermission = false;

  if (permission) {
    hasPermission = can(permission);
  } else if (anyOf && anyOf.length > 0) {
    hasPermission = canAny(anyOf);
  } else if (allOf && allOf.length > 0) {
    hasPermission = canAll(allOf);
  } else {
    hasPermission = true;
  }

  return { hasPermission, isLoading };
}

const styles = StyleSheet.create({
  noPermissionCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPermissionIcon: {
    marginBottom: Spacing.sm,
  },
});

export default PermissionGate;
