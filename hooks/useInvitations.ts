/**
 * KASETA - Invitations Hook
 * React hook for managing invitations with real-time updates
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Invitation,
  InvitationStatus,
  CreateInvitationParams,
  createInvitation,
  getInvitations,
  cancelInvitation,
  getInvitationById,
} from '@/lib/invitations';
import { useOrganization } from '@/contexts/OrganizationContext';

interface UseInvitationsOptions {
  status?: InvitationStatus[];
  autoRefresh?: boolean;
}

interface UseInvitationsReturn {
  invitations: Invitation[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  create: (params: Omit<CreateInvitationParams, 'organization_id' | 'unit_id'>) => Promise<Invitation | null>;
  cancel: (invitationId: string) => Promise<boolean>;
  getById: (invitationId: string) => Promise<Invitation | null>;
}

export function useInvitations(
  options: UseInvitationsOptions = {}
): UseInvitationsReturn {
  const { status, autoRefresh = true } = options;
  const { currentMembership, currentOrganization } = useOrganization();

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const unitId = currentMembership?.unit_id;
  const organizationId = currentOrganization?.id;

  const refresh = useCallback(async () => {
    if (!unitId) {
      setInvitations([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { invitations: data, error: fetchError } = await getInvitations(
        unitId,
        status
      );

      if (fetchError) throw fetchError;

      setInvitations(data);
    } catch (err) {
      console.error('Error fetching invitations:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [unitId, status]);

  // Initial fetch
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Real-time subscription
  useEffect(() => {
    if (!unitId || !autoRefresh) return;

    const channel = supabase
      .channel('invitations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invitations',
          filter: `unit_id=eq.${unitId}`,
        },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [unitId, autoRefresh, refresh]);

  const create = useCallback(
    async (
      params: Omit<CreateInvitationParams, 'organization_id' | 'unit_id'>
    ): Promise<Invitation | null> => {
      if (!organizationId || !unitId) {
        setError(new Error('No organization or unit selected'));
        return null;
      }

      const { invitation, error: createError } = await createInvitation({
        ...params,
        organization_id: organizationId,
        unit_id: unitId,
      });

      if (createError) {
        setError(createError);
        return null;
      }

      // Optimistic update
      if (invitation) {
        setInvitations((prev) => [invitation, ...prev]);
      }

      return invitation;
    },
    [organizationId, unitId]
  );

  const cancel = useCallback(
    async (invitationId: string): Promise<boolean> => {
      const { success, error: cancelError } = await cancelInvitation(invitationId);

      if (cancelError) {
        setError(cancelError);
        return false;
      }

      // Optimistic update
      if (success) {
        setInvitations((prev) =>
          prev.map((inv) =>
            inv.id === invitationId ? { ...inv, status: 'cancelled' as InvitationStatus } : inv
          )
        );
      }

      return success;
    },
    []
  );

  const getById = useCallback(
    async (invitationId: string): Promise<Invitation | null> => {
      const { invitation, error: fetchError } = await getInvitationById(invitationId);

      if (fetchError) {
        setError(fetchError);
        return null;
      }

      return invitation;
    },
    []
  );

  return {
    invitations,
    isLoading,
    error,
    refresh,
    create,
    cancel,
    getById,
  };
}

// Hook for a single invitation with real-time updates
export function useInvitation(invitationId: string | null) {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!invitationId) {
      setInvitation(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { invitation: data, error: fetchError } = await getInvitationById(
        invitationId
      );

      if (fetchError) throw fetchError;

      setInvitation(data);
    } catch (err) {
      console.error('Error fetching invitation:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [invitationId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Real-time subscription
  useEffect(() => {
    if (!invitationId) return;

    const channel = supabase
      .channel(`invitation_${invitationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invitations',
          filter: `id=eq.${invitationId}`,
        },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [invitationId, refresh]);

  const cancel = useCallback(async (): Promise<boolean> => {
    if (!invitationId) return false;

    const { success, error: cancelError } = await cancelInvitation(invitationId);

    if (cancelError) {
      setError(cancelError);
      return false;
    }

    if (success && invitation) {
      setInvitation({ ...invitation, status: 'cancelled' });
    }

    return success;
  }, [invitationId, invitation]);

  return {
    invitation,
    isLoading,
    error,
    refresh,
    cancel,
  };
}
