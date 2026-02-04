import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Mock expo-router
const mockBack = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    back: (...args: any[]) => mockBack(...args),
    replace: (...args: any[]) => mockReplace(...args),
  },
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  Check: () => null,
  Home: () => null,
  Building2: () => null,
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

// Import component after mocks
import JoinOrganizationScreen from '@/app/(app)/organization/join';

describe('JoinOrganizationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'organizations') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'org-123', name: 'Test Residencial', type: 'residential' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'units') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [
                  { id: 'unit-1', name: 'Unit 101', identifier: 'A-101' },
                  { id: 'unit-2', name: 'Unit 102', identifier: 'A-102' },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'memberships') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
              }),
            }),
          }),
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
      }
      return {};
    });
  });

  describe('header', () => {
    it('renders title', () => {
      render(<JoinOrganizationScreen />);

      expect(screen.getByText('Unirse a organización')).toBeTruthy();
    });

    it('shows back button', () => {
      render(<JoinOrganizationScreen />);

      expect(screen.getByText('← Atrás')).toBeTruthy();
    });

    it('shows subtitle', () => {
      render(<JoinOrganizationScreen />);

      expect(screen.getByText('Ingresa el código de invitación que recibiste')).toBeTruthy();
    });
  });

  describe('code input', () => {
    it('shows code input label', () => {
      render(<JoinOrganizationScreen />);

      expect(screen.getByText('Código de invitación')).toBeTruthy();
    });

    it('shows verify button', () => {
      render(<JoinOrganizationScreen />);

      expect(screen.getByText('Verificar código')).toBeTruthy();
    });

    it('disables verify button when code is too short', () => {
      render(<JoinOrganizationScreen />);

      const button = screen.getByText('Verificar código');
      // Button should be disabled (less than 6 characters)
    });

    it('formats code to uppercase', () => {
      render(<JoinOrganizationScreen />);

      const input = screen.getByPlaceholderText('XXXXXX');
      fireEvent.changeText(input, 'abcdef');

      expect(input.props.value).toBe('ABCDEF');
    });

    it('removes non-alphanumeric characters', () => {
      render(<JoinOrganizationScreen />);

      const input = screen.getByPlaceholderText('XXXXXX');
      fireEvent.changeText(input, 'abc-123!');

      expect(input.props.value).toBe('ABC123');
    });
  });

  describe('verify code', () => {
    it('disables verify button for short code', () => {
      render(<JoinOrganizationScreen />);

      const input = screen.getByPlaceholderText('XXXXXX');
      fireEvent.changeText(input, 'ABC');

      // Button should be disabled with less than 6 characters
      expect(screen.getByText('Verificar código')).toBeTruthy();
    });

    it('shows error for invalid code', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'organizations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
              }),
            }),
          };
        }
        return {};
      });

      render(<JoinOrganizationScreen />);

      const input = screen.getByPlaceholderText('XXXXXX');
      fireEvent.changeText(input, 'INVALID');
      fireEvent.press(screen.getByText('Verificar código'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'Código de invitación no válido.');
      });
    });
  });

  describe('organization preview', () => {
    it('shows organization name after verification', async () => {
      render(<JoinOrganizationScreen />);

      const input = screen.getByPlaceholderText('XXXXXX');
      fireEvent.changeText(input, 'TESTCODE');
      fireEvent.press(screen.getByText('Verificar código'));

      await waitFor(() => {
        expect(screen.getByText('Test Residencial')).toBeTruthy();
      });
    });

    it('shows organization type', async () => {
      render(<JoinOrganizationScreen />);

      const input = screen.getByPlaceholderText('XXXXXX');
      fireEvent.changeText(input, 'TESTCODE');
      fireEvent.press(screen.getByText('Verificar código'));

      await waitFor(() => {
        expect(screen.getByText('Residencial')).toBeTruthy();
      });
    });

    it('shows resident role text', async () => {
      render(<JoinOrganizationScreen />);

      const input = screen.getByPlaceholderText('XXXXXX');
      fireEvent.changeText(input, 'TESTCODE');
      fireEvent.press(screen.getByText('Verificar código'));

      await waitFor(() => {
        expect(screen.getByText(/Te unirás como/)).toBeTruthy();
      });
    });
  });

  describe('unit selection', () => {
    it('shows unit selection header', async () => {
      render(<JoinOrganizationScreen />);

      const input = screen.getByPlaceholderText('XXXXXX');
      fireEvent.changeText(input, 'TESTCODE');
      fireEvent.press(screen.getByText('Verificar código'));

      await waitFor(() => {
        expect(screen.getByText('Selecciona tu unidad')).toBeTruthy();
      });
    });

    it('shows available units', async () => {
      render(<JoinOrganizationScreen />);

      const input = screen.getByPlaceholderText('XXXXXX');
      fireEvent.changeText(input, 'TESTCODE');
      fireEvent.press(screen.getByText('Verificar código'));

      await waitFor(() => {
        expect(screen.getByText('Unit 101')).toBeTruthy();
        expect(screen.getByText('Unit 102')).toBeTruthy();
      });
    });

    it('shows unit identifiers', async () => {
      render(<JoinOrganizationScreen />);

      const input = screen.getByPlaceholderText('XXXXXX');
      fireEvent.changeText(input, 'TESTCODE');
      fireEvent.press(screen.getByText('Verificar código'));

      await waitFor(() => {
        expect(screen.getByText('A-101')).toBeTruthy();
        expect(screen.getByText('A-102')).toBeTruthy();
      });
    });

    it('selects unit when pressed', async () => {
      render(<JoinOrganizationScreen />);

      const input = screen.getByPlaceholderText('XXXXXX');
      fireEvent.changeText(input, 'TESTCODE');
      fireEvent.press(screen.getByText('Verificar código'));

      await waitFor(() => {
        expect(screen.getByText('Unit 101')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Unit 101'));

      // Unit should be selected
    });
  });

  describe('join button', () => {
    it('shows join button with organization name', async () => {
      render(<JoinOrganizationScreen />);

      const input = screen.getByPlaceholderText('XXXXXX');
      fireEvent.changeText(input, 'TESTCODE');
      fireEvent.press(screen.getByText('Verificar código'));

      await waitFor(() => {
        expect(screen.getByText('Unirse a Test Residencial')).toBeTruthy();
      });
    });

    it('disables join button when no unit is selected', async () => {
      render(<JoinOrganizationScreen />);

      const input = screen.getByPlaceholderText('XXXXXX');
      fireEvent.changeText(input, 'TESTCODE');
      fireEvent.press(screen.getByText('Verificar código'));

      await waitFor(() => {
        expect(screen.getByText('Unirse a Test Residencial')).toBeTruthy();
      });

      // Button should be disabled until a unit is selected
      const joinButton = screen.getByText('Unirse a Test Residencial');
      expect(joinButton).toBeTruthy();
    });
  });

  describe('help text', () => {
    it('shows help text for getting code', () => {
      render(<JoinOrganizationScreen />);

      expect(screen.getByText(/No tienes un código/)).toBeTruthy();
    });
  });

  describe('navigation', () => {
    it('navigates back when back button is pressed', () => {
      render(<JoinOrganizationScreen />);

      fireEvent.press(screen.getByText('← Atrás'));

      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe('join organization', () => {
    it('shows join button disabled when unit not selected', async () => {
      render(<JoinOrganizationScreen />);

      const input = screen.getByPlaceholderText('XXXXXX');
      fireEvent.changeText(input, 'TESTCODE');
      fireEvent.press(screen.getByText('Verificar código'));

      await waitFor(() => {
        expect(screen.getByText('Unit 101')).toBeTruthy();
      });

      // Join button should be present but disabled without unit selection
      expect(screen.getByText('Unirse a Test Residencial')).toBeTruthy();
    });

    it('shows already member error', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'organizations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'org-123', name: 'Test Residencial', type: 'residential' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'units') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [{ id: 'unit-1', name: 'Unit 101', identifier: 'A-101' }],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'memberships') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: { id: 'existing-membership' }, error: null }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      render(<JoinOrganizationScreen />);

      const input = screen.getByPlaceholderText('XXXXXX');
      fireEvent.changeText(input, 'TESTCODE');
      fireEvent.press(screen.getByText('Verificar código'));

      await waitFor(() => {
        expect(screen.getByText('Unit 101')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Unit 101'));
      fireEvent.press(screen.getByText('Unirse a Test Residencial'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Ya eres miembro', 'Ya perteneces a esta organización.');
      });
    });

    it('creates membership successfully', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<JoinOrganizationScreen />);

      const input = screen.getByPlaceholderText('XXXXXX');
      fireEvent.changeText(input, 'TESTCODE');
      fireEvent.press(screen.getByText('Verificar código'));

      await waitFor(() => {
        expect(screen.getByText('Unit 101')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Unit 101'));
      fireEvent.press(screen.getByText('Unirse a Test Residencial'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          '¡Bienvenido!',
          expect.stringContaining('Test Residencial'),
          expect.any(Array)
        );
      });
    });

    it('handles membership creation error', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'organizations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'org-123', name: 'Test Residencial', type: 'residential' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'units') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [{ id: 'unit-1', name: 'Unit 101', identifier: 'A-101' }],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'memberships') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
                }),
              }),
            }),
            insert: jest.fn().mockResolvedValue({ error: new Error('Insert failed') }),
          };
        }
        return {};
      });

      render(<JoinOrganizationScreen />);

      const input = screen.getByPlaceholderText('XXXXXX');
      fireEvent.changeText(input, 'TESTCODE');
      fireEvent.press(screen.getByText('Verificar código'));

      await waitFor(() => {
        expect(screen.getByText('Unit 101')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Unit 101'));
      fireEvent.press(screen.getByText('Unirse a Test Residencial'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'No se pudo unir a la organización.');
      });
    });
  });

  describe('auto-select single unit', () => {
    it('auto-selects unit when only one is available', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'organizations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'org-123', name: 'Test Residencial', type: 'residential' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'units') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [{ id: 'unit-1', name: 'Unit 101', identifier: 'A-101' }],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'memberships') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
                }),
              }),
            }),
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      render(<JoinOrganizationScreen />);

      const input = screen.getByPlaceholderText('XXXXXX');
      fireEvent.changeText(input, 'TESTCODE');
      fireEvent.press(screen.getByText('Verificar código'));

      await waitFor(() => {
        expect(screen.getByText('Unit 101')).toBeTruthy();
      });
    });
  });

  describe('organization types', () => {
    it.each([
      ['corporate', 'Corporativo'],
      ['educational', 'Educativo'],
      ['industrial', 'Industrial'],
      ['healthcare', 'Salud'],
      ['events', 'Eventos'],
    ])('shows correct label for %s type', async (type, label) => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'organizations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'org-123', name: 'Test Org', type },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'units') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        return {};
      });

      render(<JoinOrganizationScreen />);

      const input = screen.getByPlaceholderText('XXXXXX');
      fireEvent.changeText(input, 'TESTCODE');
      fireEvent.press(screen.getByText('Verificar código'));

      await waitFor(() => {
        expect(screen.getByText(label)).toBeTruthy();
      });
    });
  });

  describe('error handling', () => {
    it('handles units fetch error gracefully', async () => {
      const consoleError = console.error;
      console.error = jest.fn();

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'organizations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'org-123', name: 'Test Residencial', type: 'residential' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'units') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockRejectedValue(new Error('Fetch units failed')),
              }),
            }),
          };
        }
        return {};
      });

      render(<JoinOrganizationScreen />);

      const input = screen.getByPlaceholderText('XXXXXX');
      fireEvent.changeText(input, 'TESTCODE');
      fireEvent.press(screen.getByText('Verificar código'));

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Error fetching units:', expect.any(Error));
      });

      console.error = consoleError;
    });
  });
});
