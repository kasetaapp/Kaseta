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
  type: OrganizationType;
  slug: string | null;
  logo_url: string | null;
  settings: Record<string, unknown>;
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
  unit_id: string | null;
  role: UserRole;
  is_active: boolean;
  joined_at: string;
  organization?: Organization;
  unit?: Unit;
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

      const { data, error: fetchError } = await supabase
        .from('memberships')
        .select(`
          *,
          organization:organizations(*),
          unit:units(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('joined_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const membershipData = (data || []) as Membership[];
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
