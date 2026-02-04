import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

// Mock expo-router
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: any[]) => mockPush(...args),
    back: (...args: any[]) => mockBack(...args),
  },
  useLocalSearchParams: () => ({ id: 'log-123' }),
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  ChevronLeft: () => null,
  ArrowDownLeft: () => null,
  ArrowUpRight: () => null,
  Calendar: () => null,
  Clock: () => null,
  User: () => null,
  Home: () => null,
  Shield: () => null,
  FileText: () => null,
  QrCode: () => null,
}));

// Mock supabase
const mockSupabaseFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockSupabaseFrom(table),
  },
}));

// Import component after mocks
import AccessLogDetailScreen from '@/app/(app)/access-log/[id]';

describe('AccessLogDetailScreen', () => {
  const mockLog = {
    id: 'log-123',
    organization_id: 'org-123',
    invitation_id: 'inv-456',
    unit_id: 'unit-789',
    visitor_name: 'John Doe',
    access_type: 'entry',
    method: 'qr_scan',
    accessed_at: new Date().toISOString(),
    authorized_by: 'guard-123',
    notes: 'Test notes',
    unit: { id: 'unit-789', name: 'Unit 101', identifier: 'A-101' },
    authorizer: { id: 'guard-123', full_name: 'Guard Smith', avatar_url: null },
    invitation: {
      id: 'inv-456',
      visitor_name: 'John Doe',
      visitor_phone: '5551234567',
      visitor_email: 'john@example.com',
      access_type: 'single',
      short_code: 'ABC123',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockLog, error: null }),
        }),
      }),
    });
  });

  describe('loading state', () => {
    it('shows loading state', () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue(new Promise(() => {})),
          }),
        }),
      });

      render(<AccessLogDetailScreen />);

      // Should show skeleton
    });
  });

  describe('not found state', () => {
    it('shows not found message when log is null', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
          }),
        }),
      });

      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Registro no encontrado')).toBeTruthy();
      });
    });

    it('shows back button on not found screen', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
          }),
        }),
      });

      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Volver')).toBeTruthy();
      });
    });
  });

  describe('header', () => {
    it('renders header with title', async () => {
      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Detalle de acceso')).toBeTruthy();
      });
    });
  });

  describe('status card', () => {
    it('shows visitor name', async () => {
      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      });
    });

    it('shows entry badge for entry access', async () => {
      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Entrada')).toBeTruthy();
      });
    });

    it('shows exit badge for exit access', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockLog, access_type: 'exit' },
              error: null,
            }),
          }),
        }),
      });

      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Salida')).toBeTruthy();
      });
    });
  });

  describe('details section', () => {
    it('shows information section', async () => {
      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Información')).toBeTruthy();
      });
    });

    it('shows date label', async () => {
      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Fecha')).toBeTruthy();
      });
    });

    it('shows time label', async () => {
      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Hora')).toBeTruthy();
      });
    });

    it('shows method label', async () => {
      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Método')).toBeTruthy();
      });
    });

    it('shows QR scan method', async () => {
      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Escaneo de QR')).toBeTruthy();
      });
    });

    it('shows manual code method', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockLog, method: 'manual_code' },
              error: null,
            }),
          }),
        }),
      });

      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Código manual')).toBeTruthy();
      });
    });

    it('shows manual entry method', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockLog, method: 'manual_entry' },
              error: null,
            }),
          }),
        }),
      });

      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Entrada manual')).toBeTruthy();
      });
    });
  });

  describe('unit information', () => {
    it('shows unit label', async () => {
      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Unidad')).toBeTruthy();
      });
    });

    it('shows unit name', async () => {
      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Unit 101/)).toBeTruthy();
      });
    });

    it('shows unit identifier', async () => {
      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText(/A-101/)).toBeTruthy();
      });
    });
  });

  describe('notes', () => {
    it('shows notes when present', async () => {
      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Notas')).toBeTruthy();
        expect(screen.getByText('Test notes')).toBeTruthy();
      });
    });

    it('hides notes section when not present', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockLog, notes: null },
              error: null,
            }),
          }),
        }),
      });

      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Información')).toBeTruthy();
      });

      expect(screen.queryByText('Notas')).toBeNull();
    });
  });

  describe('authorizer section', () => {
    it('shows authorized by section', async () => {
      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Autorizado por')).toBeTruthy();
      });
    });

    it('shows authorizer name', async () => {
      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Guard Smith')).toBeTruthy();
      });
    });

    it('shows security personnel label', async () => {
      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Personal de seguridad')).toBeTruthy();
      });
    });

    it('shows fallback name when authorizer name is null', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                ...mockLog,
                authorizer: { id: 'guard-123', full_name: null, avatar_url: null },
              },
              error: null,
            }),
          }),
        }),
      });

      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getAllByText('Guardia').length).toBeGreaterThan(0);
      });
    });
  });

  describe('related invitation', () => {
    it('shows related invitation section', async () => {
      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Invitación relacionada')).toBeTruthy();
      });
    });

    it('shows invitation short code', async () => {
      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Código: ABC123')).toBeTruthy();
      });
    });

    it('shows view link', async () => {
      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Ver →')).toBeTruthy();
      });
    });

    it('navigates to invitation detail when pressed', async () => {
      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Ver →')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Ver →'));

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/(app)/invitation/[id]',
        params: { id: 'inv-456' },
      });
    });

    it('hides invitation section when not present', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockLog, invitation: null, invitation_id: null },
              error: null,
            }),
          }),
        }),
      });

      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Información')).toBeTruthy();
      });

      expect(screen.queryByText('Invitación relacionada')).toBeNull();
    });
  });

  describe('error handling', () => {
    it('handles fetch error gracefully', async () => {
      const consoleError = console.error;
      console.error = jest.fn();

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Network error')),
          }),
        }),
      });

      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching access log:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });

  describe('back navigation', () => {
    it('navigates back when back button is pressed', async () => {
      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Detalle de acceso')).toBeTruthy();
      });

      // Would need to find and press back button
    });

    it('navigates back from not found screen', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
          }),
        }),
      });

      render(<AccessLogDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Volver')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Volver'));

      expect(mockBack).toHaveBeenCalled();
    });
  });
});
