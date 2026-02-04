/**
 * KASETA - Organization Context
 * Manages multi-organization state, active organization, and role-based access
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

// Types
export type OrganizationType =
  | 'residential'
  | 'corporate'
  | 'educational'
  | 'industrial'
  | 'healthcare'
  | 'events';

export type UserRole = 'resident' | 'admin' | 'guard' | 'super_admin';

export interface Organization {
  id: string;
  name: string;
  type?: OrganizationType; // Optional as it may not exist in all schemas
  slug?: string | null;
  logo_url?: string | null;
  settings?: Record<string, unknown>;
  created_at: string;
}

export interface Unit {
  id: string;
  organization_id: string;
  name: string;
  identifier: string | null;
  created_at: string;
}

export interface Membership {
  id: string;
  user_id: string;
  organization_id: string;
  unit_id: string | null; // Maps to 'unit' column in DB
  role: UserRole; // Legacy role field for backward compatibility
  role_id: string | null; // New: references roles table
  is_active: boolean; // Computed from status or defaults to true
  joined_at: string; // Maps to 'created_at' column in DB
  organization?: Organization;
  unit?: Unit;
  role_info?: {
    id: string;
    name: string;
    slug: string;
    color: string;
    hierarchy_level: number;
  };
}

interface OrganizationContextValue {
  // State
  memberships: Membership[];
  currentMembership: Membership | null;
  currentOrganization: Organization | null;
  currentUnit: Unit | null;
  currentRole: UserRole | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  switchOrganization: (membershipId: string) => Promise<void>;
  refreshMemberships: () => Promise<void>;
  getOrganizationById: (id: string) => Organization | undefined;

  // Role checks
  isAdmin: boolean;
  isGuard: boolean;
  isResident: boolean;
  isSuperAdmin: boolean;
  canManageUsers: boolean;
  canScanAccess: boolean;
  canCreateInvitations: boolean;
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(
  undefined
);

const ACTIVE_MEMBERSHIP_KEY = 'kaseta_active_membership';

export function OrganizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useAuth();

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [currentMembership, setCurrentMembership] = useState<Membership | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user memberships with organizations and units
  const fetchMemberships = useCallback(async () => {
    if (!user?.id) {
      setMemberships([]);
      setCurrentMembership(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch memberships first
      const { data: rawMembershipsData, error: membershipsError } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Map database columns to our interface
      const membershipsData = (rawMembershipsData || []).map((m: any) => ({
        ...m,
        unit_id: m.unit_id || m.unit || null, // Handle both column names
        joined_at: m.joined_at || m.created_at,
        is_active: m.is_active !== undefined ? m.is_active : true,
      }));

      if (membershipsError) {
        throw membershipsError;
      }

      if (!membershipsData || membershipsData.length === 0) {
        setMemberships([]);
        setCurrentMembership(null);
        await AsyncStorage.removeItem(ACTIVE_MEMBERSHIP_KEY);
        setIsLoading(false);
        return;
      }

      // Get unique organization, unit, and role IDs
      const orgIds = [...new Set(membershipsData.map(m => m.organization_id))];
      const unitIds = [...new Set(membershipsData.map(m => m.unit_id).filter(Boolean))];
      const roleIds = [...new Set(membershipsData.map(m => m.role_id).filter(Boolean))];

      // Fetch organizations
      const { data: orgsData } = await supabase
        .from('organizations')
        .select('*')
        .in('id', orgIds);

      // Fetch units if any
      let unitsData: any[] = [];
      if (unitIds.length > 0) {
        const { data } = await supabase
          .from('units')
          .select('*')
          .in('id', unitIds);
        unitsData = data || [];
      }

      // Fetch roles if any
      let rolesData: any[] = [];
      if (roleIds.length > 0) {
        const { data } = await supabase
          .from('roles')
          .select('id, name, slug, color, hierarchy_level')
          .in('id', roleIds);
        rolesData = data || [];
      }

      // Combine the data
      const membershipData = membershipsData.map(m => ({
        ...m,
        organization: orgsData?.find(o => o.id === m.organization_id),
        unit: unitsData.find(u => u.id === m.unit_id),
        role_info: rolesData.find(r => r.id === m.role_id),
      })) as Membership[];
      setMemberships(membershipData);

      // Try to restore last active membership
      if (membershipData.length > 0) {
        const storedMembershipId = await AsyncStorage.getItem(
          ACTIVE_MEMBERSHIP_KEY
        );

        const restoredMembership = membershipData.find(
          (m) => m.id === storedMembershipId
        );

        if (restoredMembership) {
          setCurrentMembership(restoredMembership);
        } else {
          // Default to first membership
          setCurrentMembership(membershipData[0]);
          await AsyncStorage.setItem(
            ACTIVE_MEMBERSHIP_KEY,
            membershipData[0].id
          );
        }
      } else {
        setCurrentMembership(null);
        await AsyncStorage.removeItem(ACTIVE_MEMBERSHIP_KEY);
      }
    } catch (err) {
      console.error('Error fetching memberships:', err);
      setError('Failed to load organizations');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Switch to a different organization
  const switchOrganization = useCallback(
    async (membershipId: string) => {
      const membership = memberships.find((m) => m.id === membershipId);
      if (membership) {
        setCurrentMembership(membership);
        await AsyncStorage.setItem(ACTIVE_MEMBERSHIP_KEY, membershipId);
      }
    },
    [memberships]
  );

  // Get organization by ID
  const getOrganizationById = useCallback(
    (id: string) => {
      return memberships.find((m) => m.organization_id === id)?.organization;
    },
    [memberships]
  );

  // Fetch memberships when user changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchMemberships();
    } else {
      setMemberships([]);
      setCurrentMembership(null);
      setIsLoading(false);
    }

    // Safety timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 10000);

    return () => clearTimeout(timeout);
  }, [isAuthenticated, user?.id, fetchMemberships]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('memberships_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'memberships',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchMemberships();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchMemberships]);

  // Derived state
  const currentOrganization = currentMembership?.organization || null;
  const currentUnit = currentMembership?.unit || null;
  const currentRole = currentMembership?.role || null;

  // Role checks
  const isSuperAdmin = currentRole === 'super_admin';
  const isAdmin = currentRole === 'admin' || isSuperAdmin;
  const isGuard = currentRole === 'guard';
  const isResident = currentRole === 'resident';

  // Permission checks
  const canManageUsers = isAdmin || isSuperAdmin;
  const canScanAccess = isGuard || isAdmin || isSuperAdmin;
  const canCreateInvitations = isResident || isAdmin || isSuperAdmin;

  const value = useMemo<OrganizationContextValue>(
    () => ({
      memberships,
      currentMembership,
      currentOrganization,
      currentUnit,
      currentRole,
      isLoading,
      error,
      switchOrganization,
      refreshMemberships: fetchMemberships,
      getOrganizationById,
      isAdmin,
      isGuard,
      isResident,
      isSuperAdmin,
      canManageUsers,
      canScanAccess,
      canCreateInvitations,
    }),
    [
      memberships,
      currentMembership,
      currentOrganization,
      currentUnit,
      currentRole,
      isLoading,
      error,
      switchOrganization,
      fetchMemberships,
      getOrganizationById,
      isAdmin,
      isGuard,
      isResident,
      isSuperAdmin,
      canManageUsers,
      canScanAccess,
      canCreateInvitations,
    ]
  );

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error(
      'useOrganization must be used within an OrganizationProvider'
    );
  }
  return context;
}
