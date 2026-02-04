/**
 * KASETA - Invitations Service
 * Handles invitation creation, validation, and management
 */

import { supabase } from './supabase';
import * as Crypto from 'expo-crypto';

// Types - aligned with Supabase schema
export type InvitationType = 'single' | 'recurring' | 'temporary';
export type InvitationStatus = 'active' | 'used' | 'expired' | 'cancelled';

export interface Invitation {
  id: string;
  organization_id: string;
  created_by: string;
  visitor_name: string;
  visitor_phone: string | null;
  visitor_email: string | null;
  type: InvitationType;
  valid_from: string;
  valid_until: string;
  qr_data: string;
  short_code: string;
  used_at: string | null;
  notes?: string | null;
  status: InvitationStatus;
  created_at: string;
}

export interface CreateInvitationParams {
  organization_id: string;
  visitor_name: string;
  visitor_phone?: string;
  visitor_email?: string;
  type: InvitationType;
  valid_from: Date;
  valid_until: Date;
  notes?: string;
}

export interface ValidateInvitationResult {
  valid: boolean;
  invitation: Invitation | null;
  message: string;
}

// Generate unique QR data content
async function generateQRData(): Promise<string> {
  const uuid = await Crypto.randomUUID();
  return `KASETA:${uuid}`;
}

// Generate short code (6 alphanumeric characters, easy to read/type)
function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar chars (0, O, 1, I)
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create a new invitation
export async function createInvitation(
  params: CreateInvitationParams
): Promise<{ invitation: Invitation | null; error: Error | null }> {
  try {
    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const qr_data = await generateQRData();
    const short_code = generateShortCode();

    const { data, error } = await supabase
      .from('invitations')
      .insert({
        organization_id: params.organization_id,
        created_by: user.id,
        visitor_name: params.visitor_name,
        visitor_phone: params.visitor_phone || null,
        visitor_email: params.visitor_email || null,
        type: params.type,
        valid_from: params.valid_from.toISOString(),
        valid_until: params.valid_until.toISOString(),
        qr_data,
        short_code,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    return { invitation: data as Invitation, error: null };
  } catch (error) {
    console.error('Error creating invitation:', error);
    return { invitation: null, error: error as Error };
  }
}

// Validate an invitation by QR data or short code
export async function validateInvitation(
  code: string
): Promise<ValidateInvitationResult> {
  try {
    // Determine if it's a QR data or short code
    const isQRData = code.startsWith('KASETA:');
    const column = isQRData ? 'qr_data' : 'short_code';
    const searchCode = isQRData ? code : code.toUpperCase();

    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('*')
      .eq(column, searchCode)
      .single();

    if (error || !invitation) {
      return {
        valid: false,
        invitation: null,
        message: 'Invitación no encontrada',
      };
    }

    const inv = invitation as Invitation;

    // Check status
    if (inv.status === 'cancelled') {
      return {
        valid: false,
        invitation: inv,
        message: 'Esta invitación ha sido cancelada',
      };
    }

    if (inv.status === 'expired') {
      return {
        valid: false,
        invitation: inv,
        message: 'Esta invitación ha expirado',
      };
    }

    if (inv.status === 'used' && inv.type === 'single') {
      return {
        valid: false,
        invitation: inv,
        message: 'Esta invitación ya fue utilizada',
      };
    }

    // Check date validity
    const now = new Date();
    const validFrom = new Date(inv.valid_from);
    const validUntil = new Date(inv.valid_until);

    if (now < validFrom) {
      return {
        valid: false,
        invitation: inv,
        message: `Esta invitación es válida a partir del ${validFrom.toLocaleDateString()}`,
      };
    }

    if (now > validUntil) {
      // Mark as expired
      await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', inv.id);

      return {
        valid: false,
        invitation: inv,
        message: 'Esta invitación ha expirado',
      };
    }

    return {
      valid: true,
      invitation: inv,
      message: 'Invitación válida',
    };
  } catch (error) {
    console.error('Error validating invitation:', error);
    return {
      valid: false,
      invitation: null,
      message: 'Error al validar la invitación',
    };
  }
}

// Register access (when guard scans and approves)
export async function registerAccess(
  invitationId: string,
  registeredBy: string,
  direction: 'entry' | 'exit' = 'entry'
): Promise<{ success: boolean; error: Error | null }> {
  try {
    // Get invitation details
    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (invError || !invitation) {
      throw new Error('Invitation not found');
    }

    const inv = invitation as Invitation;

    // Create access log
    const { error: logError } = await supabase.from('access_logs').insert({
      organization_id: inv.organization_id,
      invitation_id: invitationId,
      visitor_name: inv.visitor_name,
      entry_type: 'invitation',
      direction: direction,
      registered_by: registeredBy,
    });

    if (logError) throw logError;

    // Update invitation - mark as used for single-use invitations
    if (inv.type === 'single') {
      await supabase
        .from('invitations')
        .update({
          status: 'used',
          used_at: new Date().toISOString(),
        })
        .eq('id', invitationId);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error registering access:', error);
    return { success: false, error: error as Error };
  }
}

// Get invitations for the current user
export async function getInvitations(
  userId: string,
  status?: InvitationStatus[]
): Promise<{ invitations: Invitation[]; error: Error | null }> {
  try {
    let query = supabase
      .from('invitations')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (status && status.length > 0) {
      query = query.in('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { invitations: (data || []) as Invitation[], error: null };
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return { invitations: [], error: error as Error };
  }
}

// Cancel an invitation
export async function cancelInvitation(
  invitationId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    return { success: false, error: error as Error };
  }
}

// Get invitation by ID
export async function getInvitationById(
  invitationId: string
): Promise<{ invitation: Invitation | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (error) throw error;

    return { invitation: data as Invitation, error: null };
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return { invitation: null, error: error as Error };
  }
}
