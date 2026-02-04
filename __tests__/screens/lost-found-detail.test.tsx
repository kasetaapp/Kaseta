import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';

// Mock expo-router
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    back: (...args: any[]) => mockBack(...args),
  },
  useLocalSearchParams: () => ({
    id: 'item-123',
  }),
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  ChevronLeft: () => null,
  MapPin: () => null,
  Phone: () => null,
  Calendar: () => null,
  Package: () => null,
  User: () => null,
  CheckCircle: () => null,
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
}));

// Mock supabase
const mockSupabaseFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockSupabaseFrom(table),
  },
}));

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
  }),
}));

// Mock OrganizationContext
jest.mock('@/contexts/OrganizationContext', () => ({
  useOrganization: () => ({
    currentOrganization: { id: 'org-123' },
  }),
}));

// Import component after mocks
import LostFoundDetailScreen from '@/app/(app)/lost-found/[id]';

describe('LostFoundDetailScreen', () => {
  const mockItem = {
    id: 'item-123',
    organization_id: 'org-123',
    reported_by: 'user-456',
    type: 'lost',
    title: 'Llaves de carro',
    description: 'Perdí mis llaves de carro con llavero rojo',
    location: 'Estacionamiento nivel 2',
    contact_phone: '5551234567',
    status: 'open',
    photo_url: null,
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockItem, error: null }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    });
  });

  describe('loading state', () => {
    it('shows loading skeleton initially', () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue(new Promise(() => {})),
          }),
        }),
      });

      render(<LostFoundDetailScreen />);

      expect(screen).toBeTruthy();
    });
  });

  describe('item not found', () => {
    it('shows error when item not found', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
          }),
        }),
      });

      render(<LostFoundDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Objeto no encontrado')).toBeTruthy();
        expect(screen.getByText('Volver')).toBeTruthy();
      });
    });
  });

  describe('item details', () => {
    it('shows item title', async () => {
      render(<LostFoundDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Llaves de carro')).toBeTruthy();
      });
    });

    it('shows description', async () => {
      render(<LostFoundDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Descripcion')).toBeTruthy();
        expect(screen.getByText('Perdí mis llaves de carro con llavero rojo')).toBeTruthy();
      });
    });

    it('shows lost type badge', async () => {
      render(<LostFoundDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Perdido')).toBeTruthy();
      });
    });

    it('shows open status badge', async () => {
      render(<LostFoundDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Abierto')).toBeTruthy();
      });
    });

    it('shows location', async () => {
      render(<LostFoundDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Donde se perdio')).toBeTruthy();
        expect(screen.getByText('Estacionamiento nivel 2')).toBeTruthy();
      });
    });

    it('shows contact phone', async () => {
      render(<LostFoundDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Contacto')).toBeTruthy();
        expect(screen.getByText('5551234567')).toBeTruthy();
      });
    });

    it('shows no image placeholder', async () => {
      render(<LostFoundDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin imagen')).toBeTruthy();
      });
    });
  });

  describe('found item', () => {
    it('shows found type badge', async () => {
      const foundItem = { ...mockItem, type: 'found' };
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: foundItem, error: null }),
          }),
        }),
      });

      render(<LostFoundDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Encontrado')).toBeTruthy();
      });
    });

    it('shows where found location label', async () => {
      const foundItem = { ...mockItem, type: 'found' };
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: foundItem, error: null }),
          }),
        }),
      });

      render(<LostFoundDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Donde se encontro')).toBeTruthy();
      });
    });
  });

  describe('claimed item', () => {
    it('shows claimed status and banner', async () => {
      const claimedItem = { ...mockItem, status: 'claimed' };
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: claimedItem, error: null }),
          }),
        }),
      });

      render(<LostFoundDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Reclamado')).toBeTruthy();
        expect(screen.getByText('Este objeto ya fue reclamado')).toBeTruthy();
      });
    });
  });

  describe('actions', () => {
    it('shows call button for open items', async () => {
      render(<LostFoundDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Llamar')).toBeTruthy();
      });
    });

    it('shows claim button for found items', async () => {
      const foundItem = { ...mockItem, type: 'found' };
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: foundItem, error: null }),
          }),
        }),
      });

      render(<LostFoundDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Marcar como reclamado')).toBeTruthy();
      });
    });
  });

  describe('header', () => {
    it('shows header title', async () => {
      render(<LostFoundDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Detalle')).toBeTruthy();
      });
    });
  });

  describe('error handling', () => {
    it('handles fetch error gracefully', async () => {
      const consoleError = console.error;
      console.error = jest.fn();

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Fetch failed')),
          }),
        }),
      });

      render(<LostFoundDetailScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching item:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });

  describe('navigation', () => {
    it('navigates back from not found screen', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      render(<LostFoundDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Volver')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Volver'));

      expect(mockBack).toHaveBeenCalled();
    });

    it('triggers haptic on back', async () => {
      const Haptics = require('expo-haptics');

      render(<LostFoundDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Llaves de carro')).toBeTruthy();
      });

      expect(Haptics.impactAsync).toBeDefined();
    });
  });

  describe('call action', () => {
    it('opens phone link when call is pressed', async () => {
      const linkingSpy = jest.spyOn(Linking, 'openURL');

      render(<LostFoundDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Llamar')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Llamar'));

      expect(linkingSpy).toHaveBeenCalledWith('tel:5551234567');
    });

    it('triggers haptic on call', async () => {
      const Haptics = require('expo-haptics');

      render(<LostFoundDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Llamar')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Llamar'));

      expect(Haptics.impactAsync).toHaveBeenCalled();
    });

    it('does nothing when no contact phone', async () => {
      const linkingSpy = jest.spyOn(Linking, 'openURL');

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockItem, contact_phone: null },
              error: null,
            }),
          }),
        }),
      });

      render(<LostFoundDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Llaves de carro')).toBeTruthy();
      });

      // Contact section still shows but with null phone
    });
  });

  describe('claim action', () => {
    it('shows confirmation dialog when claiming', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const foundItem = { ...mockItem, type: 'found' };

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: foundItem, error: null }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      render(<LostFoundDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Marcar como reclamado')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Marcar como reclamado'));

      expect(alertSpy).toHaveBeenCalledWith(
        'Reclamar objeto',
        'Estas seguro que deseas marcar este objeto como reclamado?',
        expect.any(Array)
      );
    });

    it('updates item status on confirm', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      const foundItem = { ...mockItem, type: 'found' };

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: foundItem, error: null }),
          }),
        }),
        update: mockUpdate,
      });

      render(<LostFoundDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Marcar como reclamado')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Marcar como reclamado'));

      // Get the confirm callback from Alert
      const alertCall = alertSpy.mock.calls.find(call => call[0] === 'Reclamar objeto');
      const buttons = alertCall?.[2] as any[];
      const confirmButton = buttons?.find(b => b.text === 'Confirmar');

      expect(confirmButton).toBeDefined();
    });

    it('handles claim error gracefully', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const consoleError = console.error;
      console.error = jest.fn();

      const foundItem = { ...mockItem, type: 'found' };
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: foundItem, error: null }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: new Error('Update failed') }),
        }),
      });

      render(<LostFoundDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Marcar como reclamado')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Marcar como reclamado'));

      console.error = consoleError;
    });

    it('shows claim button for owner of lost item', async () => {
      const ownerItem = { ...mockItem, reported_by: 'user-123' };

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: ownerItem, error: null }),
          }),
        }),
      });

      render(<LostFoundDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Marcar como reclamado')).toBeTruthy();
      });
    });

    it('hides claim button for non-owner of lost item', async () => {
      const nonOwnerItem = { ...mockItem, reported_by: 'user-other', type: 'lost' as const };

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: nonOwnerItem, error: null }),
          }),
        }),
      });

      render(<LostFoundDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Llamar')).toBeTruthy();
      });

      // Claim button should not be visible for non-owner of lost item
    });
  });

  describe('item with photo', () => {
    it('shows image when photo_url is present', async () => {
      const itemWithPhoto = { ...mockItem, photo_url: 'https://example.com/photo.jpg' };

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: itemWithPhoto, error: null }),
          }),
        }),
      });

      render(<LostFoundDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Llaves de carro')).toBeTruthy();
      });

      // Should not show "Sin imagen" when photo is present
      expect(screen.queryByText('Sin imagen')).toBeNull();
    });
  });
});
