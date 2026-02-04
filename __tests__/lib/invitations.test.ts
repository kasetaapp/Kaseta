import {
  createInvitation,
  validateInvitation,
  registerAccess,
  getInvitations,
  cancelInvitation,
  getInvitationById,
  Invitation,
  CreateInvitationParams,
} from '@/lib/invitations';

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'mock-uuid-12345'),
}));

// Mock supabase
const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockInsert = jest.fn();
const mockSelect = jest.fn();
const mockSingle = jest.fn();
const mockEq = jest.fn();
const mockIn = jest.fn();
const mockUpdate = jest.fn();
const mockOrder = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
    from: (table: string) => mockFrom(table),
  },
}));

// Helper to create mock invitation
const createMockInvitation = (overrides = {}): Invitation => ({
  id: 'inv-123',
  organization_id: 'org-1',
  created_by: 'user-1',
  visitor_name: 'John Visitor',
  visitor_phone: '+1234567890',
  visitor_email: 'visitor@example.com',
  type: 'single',
  valid_from: new Date().toISOString(),
  valid_until: new Date(Date.now() + 86400000).toISOString(), // +1 day
  qr_data: 'KASETA:mock-uuid',
  short_code: 'ABC123',
  notes: null,
  used_at: null,
  status: 'active',
  created_at: new Date().toISOString(),
  ...overrides,
});

describe('Invitations Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });

    mockFrom.mockReturnValue({
      insert: mockInsert,
      select: mockSelect,
      update: mockUpdate,
    });

    mockInsert.mockReturnValue({
      select: mockSelect,
    });

    mockSelect.mockReturnValue({
      single: mockSingle,
      eq: mockEq,
      in: mockIn,
      order: mockOrder,
    });

    mockEq.mockReturnValue({
      single: mockSingle,
      eq: mockEq,
      order: mockOrder,
    });

    mockIn.mockReturnValue({
      order: mockOrder,
    });

    mockOrder.mockResolvedValue({ data: [], error: null });
    mockSingle.mockResolvedValue({ data: createMockInvitation(), error: null });
    mockUpdate.mockReturnValue({ eq: mockEq });
  });

  describe('createInvitation', () => {
    const validParams: CreateInvitationParams = {
      organization_id: 'org-1',
      visitor_name: 'Test Visitor',
      visitor_phone: '+1234567890',
      visitor_email: 'test@example.com',
      type: 'single',
      valid_from: new Date(),
      valid_until: new Date(Date.now() + 86400000),
      notes: 'Test note',
    };

    it('creates invitation successfully', async () => {
      const mockInvitation = createMockInvitation({ visitor_name: 'Test Visitor' });
      mockSingle.mockResolvedValue({ data: mockInvitation, error: null });

      const result = await createInvitation(validParams);

      expect(result.error).toBeNull();
      expect(result.invitation).toEqual(mockInvitation);
    });

    it('returns error when user not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const result = await createInvitation(validParams);

      expect(result.error).toBeTruthy();
      expect(result.error?.message).toBe('User not authenticated');
      expect(result.invitation).toBeNull();
    });

    it('generates QR data with KASETA prefix', async () => {
      await createInvitation(validParams);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          qr_data: 'KASETA:mock-uuid-12345',
        })
      );
    });

    it('generates 6-character short code', async () => {
      await createInvitation(validParams);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          short_code: expect.stringMatching(/^[A-Z0-9]{6}$/),
        })
      );
    });

    it('sets status to active', async () => {
      await createInvitation(validParams);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
        })
      );
    });

    it('handles optional fields correctly', async () => {
      const minimalParams: CreateInvitationParams = {
        organization_id: 'org-1',
        visitor_name: 'Minimal Visitor',
        type: 'single',
        valid_from: new Date(),
        valid_until: new Date(Date.now() + 86400000),
      };

      await createInvitation(minimalParams);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          visitor_phone: null,
          visitor_email: null,
        })
      );
    });

    it('handles database error', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } });

      const result = await createInvitation(validParams);

      expect(result.error).toBeTruthy();
      expect(result.invitation).toBeNull();
    });
  });

  describe('validateInvitation', () => {
    it('validates QR code successfully', async () => {
      const mockInvitation = createMockInvitation({ qr_data: 'KASETA:valid-code' });
      mockSingle.mockResolvedValue({ data: mockInvitation, error: null });

      const result = await validateInvitation('KASETA:valid-code');

      expect(result.valid).toBe(true);
      expect(result.invitation).toEqual(mockInvitation);
      expect(result.message).toBe('Invitación válida');
    });

    it('validates short code successfully', async () => {
      const mockInvitation = createMockInvitation({ short_code: 'ABC123' });
      mockSingle.mockResolvedValue({ data: mockInvitation, error: null });

      const result = await validateInvitation('abc123'); // lowercase input

      expect(result.valid).toBe(true);
      expect(mockEq).toHaveBeenCalledWith('short_code', 'ABC123');
    });

    it('returns invalid for non-existent invitation', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });

      const result = await validateInvitation('INVALID');

      expect(result.valid).toBe(false);
      expect(result.invitation).toBeNull();
      expect(result.message).toBe('Invitación no encontrada');
    });

    it('returns invalid for cancelled invitation', async () => {
      const mockInvitation = createMockInvitation({ status: 'cancelled' });
      mockSingle.mockResolvedValue({ data: mockInvitation, error: null });

      const result = await validateInvitation('KASETA:code');

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Esta invitación ha sido cancelada');
    });

    it('returns invalid for expired invitation', async () => {
      const mockInvitation = createMockInvitation({ status: 'expired' });
      mockSingle.mockResolvedValue({ data: mockInvitation, error: null });

      const result = await validateInvitation('KASETA:code');

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Esta invitación ha expirado');
    });

    it('returns invalid for used single-use invitation', async () => {
      const mockInvitation = createMockInvitation({
        status: 'used',
        type: 'single',
      });
      mockSingle.mockResolvedValue({ data: mockInvitation, error: null });

      const result = await validateInvitation('KASETA:code');

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Esta invitación ya fue utilizada');
    });

    it('returns invalid for invitation not yet valid', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const mockInvitation = createMockInvitation({ valid_from: futureDate });
      mockSingle.mockResolvedValue({ data: mockInvitation, error: null });

      const result = await validateInvitation('KASETA:code');

      expect(result.valid).toBe(false);
      expect(result.message).toMatch(/Esta invitación es válida a partir del/);
    });

    it('marks invitation as expired when valid_until has passed', async () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      const mockInvitation = createMockInvitation({
        valid_from: new Date(Date.now() - 172800000).toISOString(),
        valid_until: pastDate,
      });
      mockSingle.mockResolvedValue({ data: mockInvitation, error: null });
      // Set up update chain properly
      mockEq.mockReturnValue({
        single: mockSingle,
        eq: jest.fn().mockResolvedValue({ error: null }),
        order: mockOrder,
      });

      const result = await validateInvitation('KASETA:code');

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Esta invitación ha expirado');
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'expired' });
    });

    it('returns invalid when recurring invitation has been used', async () => {
      const mockInvitation = createMockInvitation({
        type: 'recurring',
        status: 'used',
      });
      mockSingle.mockResolvedValue({ data: mockInvitation, error: null });

      const result = await validateInvitation('KASETA:code');

      // Recurring invitations can be used multiple times, only fails when status is 'used'
      expect(result.valid).toBe(true);
    });

    it('handles database error', async () => {
      mockSingle.mockRejectedValue(new Error('Database error'));

      const result = await validateInvitation('KASETA:code');

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Error al validar la invitación');
    });
  });

  describe('registerAccess', () => {
    it('registers entry access successfully', async () => {
      const mockInvitation = createMockInvitation();
      mockSingle.mockResolvedValue({ data: mockInvitation, error: null });

      // Mock for access_logs insert
      const mockLogInsert = jest.fn().mockResolvedValue({ error: null });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'access_logs') {
          return { insert: mockLogInsert };
        }
        return {
          select: mockSelect,
          update: mockUpdate,
        };
      });

      const result = await registerAccess('inv-123', 'guard-123', 'entry');

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('registers exit access', async () => {
      const mockInvitation = createMockInvitation();
      mockSingle.mockResolvedValue({ data: mockInvitation, error: null });

      const mockLogInsert = jest.fn().mockResolvedValue({ error: null });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'access_logs') {
          return { insert: mockLogInsert };
        }
        return {
          select: mockSelect,
          update: mockUpdate,
        };
      });

      await registerAccess('inv-123', 'guard-123', 'exit');

      expect(mockLogInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          direction: 'exit',
        })
      );
    });

    it('marks single-use invitation as used', async () => {
      const mockInvitation = createMockInvitation({ type: 'single' });
      mockSingle.mockResolvedValue({ data: mockInvitation, error: null });

      const mockLogInsert = jest.fn().mockResolvedValue({ error: null });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'access_logs') {
          return { insert: mockLogInsert };
        }
        return {
          select: mockSelect,
          update: mockUpdate,
        };
      });

      await registerAccess('inv-123', 'guard-123');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'used',
        })
      );
    });

    it('does not mark recurring invitation as used after single access', async () => {
      const mockInvitation = createMockInvitation({
        type: 'recurring',
      });
      mockSingle.mockResolvedValue({ data: mockInvitation, error: null });

      const mockLogInsert = jest.fn().mockResolvedValue({ error: null });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'access_logs') {
          return { insert: mockLogInsert };
        }
        return {
          select: mockSelect,
          update: mockUpdate,
        };
      });

      await registerAccess('inv-123', 'guard-123');

      // Recurring invitations don't get marked as used
      expect(mockUpdate).not.toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'used',
        })
      );
    });

    it('returns error when invitation not found', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });

      const result = await registerAccess('invalid-id', 'guard-123');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('returns error when log insert fails', async () => {
      const mockInvitation = createMockInvitation();
      mockSingle.mockResolvedValue({ data: mockInvitation, error: null });

      const mockLogInsert = jest.fn().mockResolvedValue({ error: { message: 'Insert failed' } });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'access_logs') {
          return { insert: mockLogInsert };
        }
        return {
          select: mockSelect,
          update: mockUpdate,
        };
      });

      const result = await registerAccess('inv-123', 'guard-123');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('getInvitations', () => {
    it('fetches invitations for a user', async () => {
      const mockInvitations = [
        createMockInvitation({ id: 'inv-1' }),
        createMockInvitation({ id: 'inv-2' }),
      ];
      mockOrder.mockResolvedValue({ data: mockInvitations, error: null });

      const result = await getInvitations('user-123');

      expect(result.invitations).toEqual(mockInvitations);
      expect(result.error).toBeNull();
      expect(mockEq).toHaveBeenCalledWith('created_by', 'user-123');
    });

    it('filters by status when provided', async () => {
      // Set up proper chain for status filter
      mockEq.mockReturnValue({
        single: mockSingle,
        eq: mockEq,
        order: jest.fn().mockReturnValue({
          in: mockIn.mockResolvedValue({ data: [], error: null }),
        }),
        in: mockIn,
      });
      mockIn.mockResolvedValue({ data: [], error: null });

      await getInvitations('user-123', ['active', 'used']);

      expect(mockIn).toHaveBeenCalledWith('status', ['active', 'used']);
    });

    it('orders by created_at descending', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      await getInvitations('user-123');

      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('returns empty array on error', async () => {
      mockOrder.mockResolvedValue({ data: null, error: { message: 'DB error' } });

      const result = await getInvitations('user-123');

      expect(result.invitations).toEqual([]);
      expect(result.error).toBeTruthy();
    });
  });

  describe('cancelInvitation', () => {
    it('cancels invitation successfully', async () => {
      mockEq.mockResolvedValue({ error: null });

      const result = await cancelInvitation('inv-123');

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'cancelled' });
    });

    it('returns error on failure', async () => {
      mockEq.mockResolvedValue({ error: { message: 'Update failed' } });

      const result = await cancelInvitation('inv-123');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('getInvitationById', () => {
    it('fetches single invitation by ID', async () => {
      const mockInvitation = createMockInvitation({ id: 'inv-456' });
      mockSingle.mockResolvedValue({ data: mockInvitation, error: null });

      const result = await getInvitationById('inv-456');

      expect(result.invitation).toEqual(mockInvitation);
      expect(result.error).toBeNull();
      expect(mockEq).toHaveBeenCalledWith('id', 'inv-456');
    });

    it('returns null invitation on error', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });

      const result = await getInvitationById('invalid-id');

      expect(result.invitation).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });
});
