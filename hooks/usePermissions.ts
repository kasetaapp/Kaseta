/**
 * KASETA - usePermissions Hook
 * Enterprise RBAC permission system hook
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import type { PermissionKey, Role, Permission } from '@/types/permissions';

interface UsePermissionsReturn {
  // Permission checks
  can: (permission: PermissionKey) => boolean;
  canAny: (permissions: PermissionKey[]) => boolean;
  canAll: (permissions: PermissionKey[]) => boolean;

  // Role info
  role: Role | null;
  isOwner: boolean;
  isAdmin: boolean;
  isSecurity: boolean;
  isMember: boolean;

  // All permissions for current user
  permissions: Set<PermissionKey>;
  permissionsList: PermissionKey[];

  // Loading state
  isLoading: boolean;

  // Refresh permissions
  refresh: () => Promise<void>;
}

export function usePermissions(): UsePermissionsReturn {
  const { user } = useAuth();
  const { currentOrganization, currentMembership } = useOrganization();

  const [permissions, setPermissions] = useState<Set<PermissionKey>>(new Set());
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch permissions from database
  const fetchPermissions = useCallback(async () => {
    if (!user?.id || !currentOrganization?.id || !currentMembership?.role_id) {
      setPermissions(new Set());
      setRole(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch role info
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('*')
        .eq('id', currentMembership.role_id)
        .single();

      if (roleError) {
        console.warn('Error fetching role:', roleError);
      } else {
        setRole(roleData as Role);
      }

      // Fetch permissions using RPC function
      const { data: permData, error: permError } = await supabase
        .rpc('get_user_permissions', {
          p_user_id: user.id,
          p_org_id: currentOrganization.id,
        });

      if (permError) {
        console.warn('Error fetching permissions:', permError);
        // Fallback: fetch directly from tables
        const { data: fallbackData } = await supabase
          .from('role_permissions')
          .select('permissions(key)')
          .eq('role_id', currentMembership.role_id);

        if (fallbackData) {
          const keys = fallbackData
            .map((rp: any) => rp.permissions?.key)
            .filter(Boolean) as PermissionKey[];
          setPermissions(new Set(keys));
        }
      } else if (permData) {
        const keys = permData.map((p: any) => p.permission_key) as PermissionKey[];
        setPermissions(new Set(keys));
      }
    } catch (error) {
      console.error('Error in fetchPermissions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, currentOrganization?.id, currentMembership?.role_id]);

  // Fetch permissions when dependencies change
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Permission check functions
  const can = useCallback(
    (permission: PermissionKey): boolean => {
      return permissions.has(permission);
    },
    [permissions]
  );

  const canAny = useCallback(
    (perms: PermissionKey[]): boolean => {
      return perms.some((p) => permissions.has(p));
    },
    [permissions]
  );

  const canAll = useCallback(
    (perms: PermissionKey[]): boolean => {
      return perms.every((p) => permissions.has(p));
    },
    [permissions]
  );

  // Role checks based on role slug
  const isOwner = useMemo(() => role?.slug === 'owner', [role]);
  const isAdmin = useMemo(() => ['owner', 'admin'].includes(role?.slug || ''), [role]);
  const isSecurity = useMemo(() => role?.slug === 'security', [role]);
  const isMember = useMemo(() => role?.slug === 'member', [role]);

  // Convert Set to array for easier iteration
  const permissionsList = useMemo(
    () => Array.from(permissions) as PermissionKey[],
    [permissions]
  );

  return {
    can,
    canAny,
    canAll,
    role,
    isOwner,
    isAdmin,
    isSecurity,
    isMember,
    permissions,
    permissionsList,
    isLoading,
    refresh: fetchPermissions,
  };
}

/**
 * Hook to check a single permission
 * Optimized for components that only need to check one permission
 */
export function useHasPermission(permission: PermissionKey): boolean {
  const { can } = usePermissions();
  return can(permission);
}

/**
 * Hook to check if user can perform any of the given permissions
 */
export function useHasAnyPermission(permissions: PermissionKey[]): boolean {
  const { canAny } = usePermissions();
  return canAny(permissions);
}

export default usePermissions;
