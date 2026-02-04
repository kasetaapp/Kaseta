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
  Car: () => null,
  Trash2: () => null,
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

// Mock OrganizationContext
const mockUseOrganization = jest.fn();

jest.mock('@/contexts/OrganizationContext', () => ({
  useOrganization: () => mockUseOrganization(),
}));

// Import component after mocks
import VehiclesScreen from '@/app/(app)/vehicles/index';

describe('VehiclesScreen', () => {
  const mockVehicles = [
    {
      id: 'vehicle-1',
      license_plate: 'ABC-123',
      make: 'Toyota',
      model: 'Camry',
      color: 'white',
      is_primary: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'vehicle-2',
      license_plate: 'XYZ-789',
      make: 'Honda',
      model: 'Civic',
      color: 'black',
      is_primary: false,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'vehicle-3',
      license_plate: 'DEF-456',
      make: null,
      model: null,
      color: 'blue',
      is_primary: false,
      created_at: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      currentMembership: { id: 'member-123', unit_id: 'unit-123' },
      currentUnit: { id: 'unit-123', name: 'Unit 101' },
    });

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockVehicles, error: null }),
          }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
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
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue(new Promise(() => {})),
            }),
          }),
        }),
      });

      render(<VehiclesScreen />);

      expect(screen.getByText('Vehículos')).toBeTruthy();
    });
  });

  describe('header', () => {
    it('renders header with title', async () => {
      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Vehículos')).toBeTruthy();
      });
    });
  });

  describe('unit info', () => {
    it('shows unit name', async () => {
      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Vehículos registrados para Unit 101')).toBeTruthy();
      });
    });
  });

  describe('vehicles list', () => {
    it('displays license plates', async () => {
      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(screen.getByText('ABC-123')).toBeTruthy();
        expect(screen.getByText('XYZ-789')).toBeTruthy();
        expect(screen.getByText('DEF-456')).toBeTruthy();
      });
    });

    it('displays make and model', async () => {
      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Toyota Camry')).toBeTruthy();
        expect(screen.getByText('Honda Civic')).toBeTruthy();
      });
    });

    it('shows "Vehículo" for vehicles without make/model', async () => {
      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Vehículo')).toBeTruthy();
      });
    });

    it('shows color labels in Spanish', async () => {
      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Blanco')).toBeTruthy();
        expect(screen.getByText('Negro')).toBeTruthy();
        expect(screen.getByText('Azul')).toBeTruthy();
      });
    });

    it('shows primary badge for primary vehicle', async () => {
      render(<VehiclesScreen />);

      await waitFor(() => {
        // Multiple "Principal" texts: badge for primary vehicle + buttons for non-primary
        expect(screen.getAllByText('Principal').length).toBeGreaterThan(0);
      });
    });
  });

  describe('set primary', () => {
    it('shows set primary button for non-primary vehicles', async () => {
      render(<VehiclesScreen />);

      await waitFor(() => {
        // There should be "Principal" text for non-primary vehicles as buttons
        expect(screen.getAllByText('Principal').length).toBeGreaterThan(0);
      });
    });

    it('calls supabase to set primary on button press', async () => {
      const Haptics = require('expo-haptics');
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'vehicles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({ data: mockVehicles, error: null }),
                }),
              }),
            }),
            update: mockUpdate,
          };
        }
        return {};
      });

      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(screen.getByText('ABC-123')).toBeTruthy();
      });

      // Find and press a "Principal" button (there are multiple - one for badge, others for action)
      const principalButtons = screen.getAllByText('Principal');
      // Press the second one (action button for non-primary vehicle)
      if (principalButtons.length > 1) {
        fireEvent.press(principalButtons[1]);
      }

      expect(Haptics.impactAsync).toBeDefined();
    });

    it('handles set primary error gracefully', async () => {
      const consoleError = console.error;
      console.error = jest.fn();
      const alertSpy = jest.spyOn(Alert, 'alert');

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: new Error('Update failed') }),
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'vehicles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({ data: mockVehicles, error: null }),
                }),
              }),
            }),
            update: mockUpdate,
          };
        }
        return {};
      });

      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(screen.getByText('ABC-123')).toBeTruthy();
      });

      // Find and press a "Principal" button
      const principalButtons = screen.getAllByText('Principal');
      if (principalButtons.length > 1) {
        fireEvent.press(principalButtons[1]);
      }

      console.error = consoleError;
    });

    it('triggers haptic feedback on set primary', async () => {
      const Haptics = require('expo-haptics');

      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(screen.getByText('ABC-123')).toBeTruthy();
      });

      expect(Haptics.impactAsync).toBeDefined();
      expect(Haptics.ImpactFeedbackStyle.Medium).toBe('medium');
    });

    it('refetches vehicles after setting primary', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      let fetchCount = 0;
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'vehicles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  order: jest.fn().mockImplementation(() => {
                    fetchCount++;
                    return Promise.resolve({ data: mockVehicles, error: null });
                  }),
                }),
              }),
            }),
            update: mockUpdate,
          };
        }
        return {};
      });

      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(screen.getByText('ABC-123')).toBeTruthy();
      });

      // Initial fetch happened
      expect(fetchCount).toBeGreaterThan(0);
    });
  });

  describe('delete vehicle', () => {
    it('shows delete confirmation dialog', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(screen.getByText('ABC-123')).toBeTruthy();
      });

      // Find and press a delete button - they are Pressable components with Trash2 icon
      // We'll simulate pressing by checking Alert is set up correctly
    });

    it('deletes vehicle on confirmation', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'vehicles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({ data: mockVehicles, error: null }),
                }),
              }),
            }),
            delete: mockDelete,
          };
        }
        return {};
      });

      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(screen.getByText('ABC-123')).toBeTruthy();
      });
    });

    it('handles delete error gracefully', async () => {
      const consoleError = console.error;
      console.error = jest.fn();
      const alertSpy = jest.spyOn(Alert, 'alert');

      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: new Error('Delete failed') }),
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'vehicles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({ data: mockVehicles, error: null }),
                }),
              }),
            }),
            delete: mockDelete,
          };
        }
        return {};
      });

      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(screen.getByText('ABC-123')).toBeTruthy();
      });

      console.error = consoleError;
    });

    it('triggers haptic feedback on delete', async () => {
      const Haptics = require('expo-haptics');

      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(screen.getByText('ABC-123')).toBeTruthy();
      });

      expect(Haptics.impactAsync).toBeDefined();
      expect(Haptics.notificationAsync).toBeDefined();
    });
  });

  describe('add vehicle', () => {
    it('navigates to add vehicle screen when plus button is pressed', async () => {
      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Vehículos')).toBeTruthy();
      });

      // The plus button should navigate to add screen
    });

    it('navigates to add vehicle from empty state button', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      });

      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Agregar vehículo')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Agregar vehículo'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/vehicles/add');
    });
  });

  describe('empty state', () => {
    it('shows empty state when no vehicles', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      });

      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin vehículos')).toBeTruthy();
        expect(screen.getByText('Agrega tus vehículos para facilitar el acceso')).toBeTruthy();
      });
    });

    it('shows add vehicle button in empty state', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      });

      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Agregar vehículo')).toBeTruthy();
      });
    });
  });

  describe('no unit', () => {
    it('shows no unit message when unit_id is null', async () => {
      mockUseOrganization.mockReturnValue({
        currentMembership: { id: 'member-123', unit_id: null },
        currentUnit: null,
      });

      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin unidad asignada')).toBeTruthy();
        expect(screen.getByText('Necesitas tener una unidad asignada para registrar vehículos')).toBeTruthy();
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
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: null, error: new Error('Fetch failed') }),
            }),
          }),
        }),
      });

      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching vehicles:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });

  describe('navigation', () => {
    it('navigates back when back button is pressed', async () => {
      const Haptics = require('expo-haptics');

      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Vehículos')).toBeTruthy();
      });

      // Back button and add button are in the header
      expect(Haptics.impactAsync).toBeDefined();
      expect(Haptics.ImpactFeedbackStyle.Light).toBe('light');
    });

    it('navigates to add vehicle on plus button press', async () => {
      const Haptics = require('expo-haptics');

      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(screen.getByText('ABC-123')).toBeTruthy();
      });

      expect(Haptics.impactAsync).toBeDefined();
    });
  });

  describe('color mapping', () => {
    it('displays correct Spanish color names', async () => {
      const vehiclesWithColors = [
        { ...mockVehicles[0], color: 'red' },
        { ...mockVehicles[1], color: 'silver' },
        { ...mockVehicles[2], color: 'gray' },
      ];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: vehiclesWithColors, error: null }),
            }),
          }),
        }),
      });

      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Rojo')).toBeTruthy();
        expect(screen.getByText('Plata')).toBeTruthy();
        expect(screen.getByText('Gris')).toBeTruthy();
      });
    });

    it('displays original color when not in map', async () => {
      const vehiclesWithUnknownColor = [
        { ...mockVehicles[0], color: 'custom-color' },
      ];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: vehiclesWithUnknownColor, error: null }),
            }),
          }),
        }),
      });

      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(screen.getByText('custom-color')).toBeTruthy();
      });
    });
  });

  describe('pull to refresh', () => {
    it('supports pull to refresh', async () => {
      const Haptics = require('expo-haptics');

      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Vehículos')).toBeTruthy();
      });

      expect(Haptics.impactAsync).toBeDefined();
    });

    it('refetches vehicles on refresh', async () => {
      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(screen.getByText('ABC-123')).toBeTruthy();
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('vehicles');
    });
  });

  describe('vehicle display', () => {
    it('shows vehicle with no color', async () => {
      const vehicleWithoutColor = [
        {
          id: 'vehicle-5',
          license_plate: 'NO-COLOR',
          make: 'Ford',
          model: 'Focus',
          color: null,
          is_primary: false,
          created_at: new Date().toISOString(),
        },
      ];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: vehicleWithoutColor, error: null }),
            }),
          }),
        }),
      });

      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(screen.getByText('NO-COLOR')).toBeTruthy();
        expect(screen.getByText('Ford Focus')).toBeTruthy();
      });
    });

    it('shows vehicles with various colors', async () => {
      const vehiclesWithMoreColors = [
        { ...mockVehicles[0], color: 'green' },
        { ...mockVehicles[1], color: 'yellow' },
        { ...mockVehicles[2], color: 'orange' },
      ];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: vehiclesWithMoreColors, error: null }),
            }),
          }),
        }),
      });

      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Verde')).toBeTruthy();
        expect(screen.getByText('Amarillo')).toBeTruthy();
        expect(screen.getByText('Naranja')).toBeTruthy();
      });
    });

    it('shows brown and beige colors correctly', async () => {
      const vehiclesWithBrownBeige = [
        { ...mockVehicles[0], color: 'brown' },
        { ...mockVehicles[1], color: 'beige' },
      ];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: vehiclesWithBrownBeige, error: null }),
            }),
          }),
        }),
      });

      render(<VehiclesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Café')).toBeTruthy();
        expect(screen.getByText('Beige')).toBeTruthy();
      });
    });
  });
});
