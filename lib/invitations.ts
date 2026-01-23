/**
 * KASETA - Invitations Service
 * Handles invitation creation, validation, and management
 */

import { supabase } from './supabase';
import * as Crypto from 'expo-crypto';

// Types
export type AccessType = 'single' | 'multiple' | 'permanent' | 'temporary';
export type InvitationStatus = 'active' | 'used' | 'expired' | 'cancelled';

export interface Invitation {
  id: string;
  organization_id: string;
  unit_id: string;
  created_by: string;
  visitor_name: string;
  visitor_phone: string | null;
  visitor_email: string | null;
  access_type: AccessType;
  valid_from: string;
  valid_until: string | null;
  max_uses: number;
  current_uses: number;
  qr_code: string;
  short_code: string | null;
  notes: string | null;
  status: InvitationStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateInvitationParams {
  organization_id: string;
  unit_id: string;
  visitor_name: string;
  visitor_phone?: string;
  visitor_email?: string;
  access_type: AccessType;
  valid_from: Date;
  valid_until?: Date;
  max_uses?: number;
  notes?: string;
}

export interface ValidateInvitationResult {
  valid: boolean;
  invitation: Invitation | null;
  message: string;
}

// Generate unique QR code content
async function generateQRCode(): Promise<string> {
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

    const qr_code = await generateQRCode();
    const short_code = generateShortCode();

    const { data, error } = await supabase
      .from('invitations')
      .insert({
        organization_id: params.organization_id,
        unit_id: params.unit_id,
        created_by: user.id,
        visitor_name: params.visitor_name,
        visitor_phone: params.visitor_phone || null,
        visitor_email: params.visitor_email || null,
        access_type: params.access_type,
        valid_from: params.valid_from.toISOString(),
        valid_until: params.valid_until?.toISOString() || null,
        max_uses: params.max_uses || 1,
        qr_code,
        short_code,
        notes: params.notes || null,
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

// Validate an invitation by QR code or short code
export async function validateInvitation(
  code: string
): Promise<ValidateInvitationResult> {
  try {
    // Determine if it's a QR code or short code
    const isQRCode = code.startsWith('KASETA:');
    const column = isQRCode ? 'qr_code' : 'short_code';
    const searchCode = isQRCode ? code : code.toUpperCase();

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

    if (inv.status === 'used' && inv.access_type === 'single') {
      return {
        valid: false,
        invitation: inv,
        message: 'Esta invitación ya fue utilizada',
      };
    }

    // Check date validity
    const now = new Date();
    const validFrom = new Date(inv.valid_from);
    const validUntil = inv.valid_until ? new Date(inv.valid_until) : null;

    if (now < validFrom) {
      return {
        valid: false,
        invitation: inv,
        message: `Esta invitación es válida a partir del ${validFrom.toLocaleDateString()}`,
      };
    }

    if (validUntil && now > validUntil) {
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

    // Check max uses for multiple access type
    if (inv.access_type === 'multiple' && inv.current_uses >= inv.max_uses) {
      await supabase
        .from('invitations')
        .update({ status: 'used' })
        .eq('id', inv.id);

      return {
        valid: false,
        invitation: inv,
        message: 'Esta invitación ha alcanzado el límite de usos',
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
  authorizedBy: string,
  accessType: 'entry' | 'exit' = 'entry'
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
      unit_id: inv.unit_id,
      visitor_name: inv.visitor_name,
      access_type: accessType,
      method: 'qr_scan',
      authorized_by: authorizedBy,
    });

    if (logError) throw logError;

    // Update invitation
    const newUses = inv.current_uses + 1;
    const shouldMarkUsed =
      inv.access_type === 'single' ||
      (inv.access_type === 'multiple' && newUses >= inv.max_uses);

    await supabase
      .from('invitations')
      .update({
        current_uses: newUses,
        status: shouldMarkUsed ? 'used' : 'active',
      })
      .eq('id', invitationId);

    return { success: true, error: null };
  } catch (error) {
    console.error('Error registering access:', error);
    return { success: false, error: error as Error };
  }
}

// Get invitations for a unit
export async function getInvitations(
  unitId: string,
  status?: InvitationStatus[]
): Promise<{ invitations: Invitation[]; error: Error | null }> {
  try {
    let query = supabase
      .from('invitations')
      .select('*')
      .eq('unit_id', unitId)
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
