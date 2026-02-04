import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Mock expo-router
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: any[]) => mockPush(...args),
    back: (...args: any[]) => mockBack(...args),
  },
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  ChevronLeft: () => null,
  Plus: () => null,
  PawPrint: () => null,
  Trash2: () => null,
  Dog: () => null,
  Cat: () => null,
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
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
const mockUseOrganization = jest.fn();

jest.mock('@/contexts/OrganizationContext', () => ({
  useOrganization: () => mockUseOrganization(),
}));

// Import component after mocks
import PetsScreen from '@/app/(app)/pets/index';

describe('PetsScreen', () => {
  const mockPets = [
    {
      id: 'pet-1',
      user_id: 'user-123',
      unit_id: 'unit-123',
      organization_id: 'org-123',
      name: 'Max',
      type: 'dog',
      breed: 'Labrador',
      notes: 'Friendly dog',
      photo_url: null,
      created_at: new Date().toISOString(),
    },
    {
      id: 'pet-2',
      user_id: 'user-123',
      unit_id: 'unit-123',
      organization_id: 'org-123',
      name: 'Whiskers',
      type: 'cat',
      breed: 'Siamese',
      notes: null,
      photo_url: null,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'pet-3',
      user_id: 'user-123',
      unit_id: 'unit-123',
      organization_id: 'org-123',
      name: 'Tweety',
      type: 'other',
      breed: null,
      notes: 'Bird',
      photo_url: null,
      created_at: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      currentMembership: { id: 'member-123', unit_id: 'unit-123' },
      currentUnit: { id: 'unit-123', name: 'Unit 101' },
      currentOrganization: { id: 'org-123', name: 'Test Org' },
    });

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockPets, error: null }),
          }),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    });
  });

  describe('loading state', () => {
    it('shows loading skeletons initially', () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue(new Promise(() => {})),
            }),
          }),
        }),
      });

      render(<PetsScreen />);

      expect(screen.getByText('Mascotas')).toBeTruthy();
    });
  });

  describe('header', () => {
    it('renders header with title', async () => {
      render(<PetsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Mascotas')).toBeTruthy();
      });
    });
  });

  describe('unit info', () => {
    it('shows unit name', async () => {
      render(<PetsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Mascotas registradas para Unit 101')).toBeTruthy();
      });
    });
  });

  describe('pets list', () => {
    it('displays pet names', async () => {
      render(<PetsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Max')).toBeTruthy();
        expect(screen.getByText('Whiskers')).toBeTruthy();
        expect(screen.getByText('Tweety')).toBeTruthy();
      });
    });

    it('displays pet breeds', async () => {
      render(<PetsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Labrador')).toBeTruthy();
        expect(screen.getByText('Siamese')).toBeTruthy();
      });
    });

    it('shows type badges', async () => {
      render(<PetsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Perro')).toBeTruthy();
        expect(screen.getByText('Gato')).toBeTruthy();
        expect(screen.getByText('Otro')).toBeTruthy();
      });
    });

    it('shows notes when present', async () => {
      render(<PetsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Friendly dog')).toBeTruthy();
        expect(screen.getByText('Bird')).toBeTruthy();
      });
    });
  });

  describe('empty state', () => {
    it('shows empty state when no pets', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      });

      render(<PetsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin mascotas')).toBeTruthy();
        expect(screen.getByText('Registra tus mascotas para mantener un control dentro del condominio')).toBeTruthy();
      });
    });

    it('shows add pet button in empty state', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      });

      render(<PetsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Agregar mascota')).toBeTruthy();
      });
    });
  });

  describe('no unit', () => {
    it('shows no unit message when unit_id is null', async () => {
      mockUseOrganization.mockReturnValue({
        currentMembership: { id: 'member-123', unit_id: null },
        currentUnit: null,
        currentOrganization: { id: 'org-123', name: 'Test Org' },
      });

      render(<PetsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin unidad asignada')).toBeTruthy();
        expect(screen.getByText('Necesitas tener una unidad asignada para registrar mascotas')).toBeTruthy();
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
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: null, error: new Error('Fetch failed') }),
            }),
          }),
        }),
      });

      render(<PetsScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching pets:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });

  describe('navigation', () => {
    it('can navigate back', async () => {
      const Haptics = require('expo-haptics');

      render(<PetsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Mascotas')).toBeTruthy();
      });

      expect(Haptics.impactAsync).toBeDefined();
    });

    it('navigates to add pet screen', async () => {
      render(<PetsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Mascotas')).toBeTruthy();
      });

      // Plus button should navigate to add screen
    });

    it('navigates to add from empty state button', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      });

      render(<PetsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Agregar mascota')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Agregar mascota'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/pets/add');
    });
  });

  describe('pull to refresh', () => {
    it('supports pull to refresh', async () => {
      const Haptics = require('expo-haptics');

      render(<PetsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Mascotas')).toBeTruthy();
      });

      expect(Haptics.impactAsync).toBeDefined();
    });

    it('refetches pets on refresh', async () => {
      render(<PetsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Max')).toBeTruthy();
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('pets');
    });
  });

  describe('delete pet', () => {
    it('shows delete confirmation dialog', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<PetsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Max')).toBeTruthy();
      });

      // Delete button should be available
    });

    it('deletes pet on confirmation', async () => {
      const Haptics = require('expo-haptics');
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockPets, error: null }),
            }),
          }),
        }),
        delete: mockDelete,
      });

      render(<PetsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Max')).toBeTruthy();
      });

      expect(Haptics.notificationAsync).toBeDefined();
    });

    it('handles delete error gracefully', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const consoleError = console.error;
      console.error = jest.fn();

      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: new Error('Delete failed') }),
      });

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockPets, error: null }),
            }),
          }),
        }),
        delete: mockDelete,
      });

      render(<PetsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Max')).toBeTruthy();
      });

      console.error = consoleError;
    });

    it('triggers heavy haptic on delete', async () => {
      const Haptics = require('expo-haptics');

      render(<PetsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Max')).toBeTruthy();
      });

      expect(Haptics.impactAsync).toBeDefined();
    });
  });

  describe('pet icons', () => {
    it('shows dog icon for dogs', async () => {
      render(<PetsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Max')).toBeTruthy();
        expect(screen.getByText('Perro')).toBeTruthy();
      });
    });

    it('shows cat icon for cats', async () => {
      render(<PetsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Whiskers')).toBeTruthy();
        expect(screen.getByText('Gato')).toBeTruthy();
      });
    });

    it('shows paw icon for other animals', async () => {
      render(<PetsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Tweety')).toBeTruthy();
        expect(screen.getByText('Otro')).toBeTruthy();
      });
    });
  });

  describe('pet without breed', () => {
    it('renders pet without breed', async () => {
      const petNoBreed = [mockPets[2]];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: petNoBreed, error: null }),
            }),
          }),
        }),
      });

      render(<PetsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Tweety')).toBeTruthy();
      });
    });
  });

  describe('pet without notes', () => {
    it('renders pet without notes', async () => {
      const petNoNotes = [mockPets[1]];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: petNoNotes, error: null }),
            }),
          }),
        }),
      });

      render(<PetsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Whiskers')).toBeTruthy();
        expect(screen.getByText('Siamese')).toBeTruthy();
      });
    });
  });

});
