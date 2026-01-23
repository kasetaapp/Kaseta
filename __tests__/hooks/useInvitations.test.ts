import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useInvitations, useInvitation } from '@/hooks/useInvitations';

// Mock the supabase client
const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn(),
};

jest.mock('@/lib/supabase', () => ({
  supabase: {
    channel: jest.fn(() => mockChannel),
    removeChannel: jest.fn(),
  },
}));

// Mock the invitations lib
const mockGetInvitations = jest.fn();
const mockCreateInvitation = jest.fn();
const mockCancelInvitation = jest.fn();
const mockGetInvitationById = jest.fn();

jest.mock('@/lib/invitations', () => ({
  getInvitations: (...args: any[]) => mockGetInvitations(...args),
  createInvitation: (...args: any[]) => mockCreateInvitation(...args),
  cancelInvitation: (...args: any[]) => mockCancelInvitation(...args),
  getInvitationById: (...args: any[]) => mockGetInvitationById(...args),
}));

// Mock the organization context
const mockUseOrganization = jest.fn();

jest.mock('@/contexts/OrganizationContext', () => ({
  useOrganization: () => mockUseOrganization(),
}));

describe('useInvitations Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOrganization.mockReturnValue({
      currentMembership: { unit_id: 'unit-123' },
      currentOrganization: { id: 'org-456' },
    });
    mockGetInvitations.mockResolvedValue({
      invitations: [],
      error: null,
    });
  });

  it('returns initial state correctly', async () => {
    const { result } = renderHook(() => useInvitations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.invitations).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('fetches invitations on mount', async () => {
    const mockInvitations = [
      { id: '1', guest_name: 'John Doe', status: 'pending' },
      { id: '2', guest_name: 'Jane Doe', status: 'approved' },
    ];

    mockGetInvitations.mockResolvedValue({
      invitations: mockInvitations,
      error: null,
    });

    const { result } = renderHook(() => useInvitations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.invitations).toEqual(mockInvitations);
    expect(mockGetInvitations).toHaveBeenCalledWith('unit-123', undefined);
  });

  it('filters invitations by status when provided', async () => {
    mockGetInvitations.mockResolvedValue({
      invitations: [],
      error: null,
    });

    renderHook(() => useInvitations({ status: ['pending', 'approved'] }));

    await waitFor(() => {
      expect(mockGetInvitations).toHaveBeenCalledWith('unit-123', ['pending', 'approved']);
    });
  });

  it('handles errors when fetching invitations', async () => {
    const mockError = new Error('Failed to fetch');
    mockGetInvitations.mockResolvedValue({
      invitations: [],
      error: mockError,
    });

    const { result } = renderHook(() => useInvitations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(mockError);
  });

  it('returns empty invitations when no unit is selected', async () => {
    mockUseOrganization.mockReturnValue({
      currentMembership: null,
      currentOrganization: { id: 'org-456' },
    });

    const { result } = renderHook(() => useInvitations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.invitations).toEqual([]);
    expect(mockGetInvitations).not.toHaveBeenCalled();
  });

  it('creates invitation correctly', async () => {
    const newInvitation = {
      id: 'new-1',
      guest_name: 'New Guest',
      status: 'pending',
    };

    mockCreateInvitation.mockResolvedValue({
      invitation: newInvitation,
      error: null,
    });

    const { result } = renderHook(() => useInvitations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let createdInvitation;
    await act(async () => {
      createdInvitation = await result.current.create({
        guest_name: 'New Guest',
        guest_email: 'guest@example.com',
      });
    });

    expect(createdInvitation).toEqual(newInvitation);
    expect(mockCreateInvitation).toHaveBeenCalledWith({
      guest_name: 'New Guest',
      guest_email: 'guest@example.com',
      organization_id: 'org-456',
      unit_id: 'unit-123',
    });
  });

  it('cancels invitation correctly', async () => {
    mockCancelInvitation.mockResolvedValue({
      success: true,
      error: null,
    });

    const { result } = renderHook(() => useInvitations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success;
    await act(async () => {
      success = await result.current.cancel('invitation-id');
    });

    expect(success).toBe(true);
    expect(mockCancelInvitation).toHaveBeenCalledWith('invitation-id');
  });

  it('gets invitation by ID', async () => {
    const mockInvitation = { id: 'inv-1', guest_name: 'Test Guest' };
    mockGetInvitationById.mockResolvedValue({
      invitation: mockInvitation,
      error: null,
    });

    const { result } = renderHook(() => useInvitations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let invitation;
    await act(async () => {
      invitation = await result.current.getById('inv-1');
    });

    expect(invitation).toEqual(mockInvitation);
  });

  it('sets up real-time subscription', async () => {
    const { unmount } = renderHook(() => useInvitations());

    await waitFor(() => {
      expect(mockChannel.on).toHaveBeenCalled();
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    unmount();
  });
});

describe('useInvitation Hook (single invitation)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches single invitation by ID', async () => {
    const mockInvitation = { id: 'inv-1', guest_name: 'Test Guest', status: 'pending' };
    mockGetInvitationById.mockResolvedValue({
      invitation: mockInvitation,
      error: null,
    });

    const { result } = renderHook(() => useInvitation('inv-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.invitation).toEqual(mockInvitation);
    expect(mockGetInvitationById).toHaveBeenCalledWith('inv-1');
  });

  it('returns null when invitation ID is null', async () => {
    const { result } = renderHook(() => useInvitation(null));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.invitation).toBeNull();
    expect(mockGetInvitationById).not.toHaveBeenCalled();
  });

  it('cancels invitation correctly', async () => {
    const mockInvitation = { id: 'inv-1', guest_name: 'Test Guest', status: 'pending' };
    mockGetInvitationById.mockResolvedValue({
      invitation: mockInvitation,
      error: null,
    });
    mockCancelInvitation.mockResolvedValue({
      success: true,
      error: null,
    });

    const { result } = renderHook(() => useInvitation('inv-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success;
    await act(async () => {
      success = await result.current.cancel();
    });

    expect(success).toBe(true);
    expect(mockCancelInvitation).toHaveBeenCalledWith('inv-1');
  });
});
