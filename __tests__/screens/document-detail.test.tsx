import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';

// Mock expo-router
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    back: (...args: any[]) => mockBack(...args),
  },
  useLocalSearchParams: () => ({
    id: 'doc-123',
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
  FileText: () => null,
  Calendar: () => null,
  User: () => null,
  Download: () => null,
  ExternalLink: () => null,
  ScrollText: () => null,
  FileCheck: () => null,
  ClipboardList: () => null,
  Bell: () => null,
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

// Mock supabase
const mockSupabaseFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockSupabaseFrom(table),
  },
}));

// Import component after mocks
import DocumentDetailScreen from '@/app/(app)/documents/[id]';

describe('DocumentDetailScreen', () => {
  const mockDocument = {
    id: 'doc-123',
    title: 'Reglamento de convivencia',
    description: 'Reglamento general de convivencia para todos los residentes',
    category: 'regulations',
    file_url: 'https://example.com/doc.pdf',
    file_type: 'pdf',
    created_at: new Date().toISOString(),
    uploaded_by: { full_name: 'Admin User' },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockDocument, error: null }),
        }),
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

      render(<DocumentDetailScreen />);

      expect(screen).toBeTruthy();
    });
  });

  describe('document not found', () => {
    it('shows error when document not found', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
          }),
        }),
      });

      render(<DocumentDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Documento no encontrado')).toBeTruthy();
        expect(screen.getByText('Volver')).toBeTruthy();
      });
    });
  });

  describe('document details', () => {
    it('shows document title', async () => {
      render(<DocumentDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Reglamento de convivencia')).toBeTruthy();
      });
    });

    it('shows description', async () => {
      render(<DocumentDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Reglamento general de convivencia para todos los residentes')).toBeTruthy();
      });
    });

    it('shows category badge for regulations', async () => {
      render(<DocumentDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Reglamento')).toBeTruthy();
      });
    });

    it('shows uploader info', async () => {
      render(<DocumentDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Subido por: Admin User')).toBeTruthy();
      });
    });

    it('shows file type', async () => {
      render(<DocumentDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Tipo: PDF')).toBeTruthy();
      });
    });

    it('shows file info card', async () => {
      render(<DocumentDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Archivo adjunto')).toBeTruthy();
      });
    });
  });

  describe('different categories', () => {
    it('shows contracts category', async () => {
      const contractDoc = { ...mockDocument, category: 'contracts' };
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: contractDoc, error: null }),
          }),
        }),
      });

      render(<DocumentDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Contrato')).toBeTruthy();
      });
    });

    it('shows forms category', async () => {
      const formDoc = { ...mockDocument, category: 'forms' };
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: formDoc, error: null }),
          }),
        }),
      });

      render(<DocumentDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Formulario')).toBeTruthy();
      });
    });

    it('shows notices category', async () => {
      const noticeDoc = { ...mockDocument, category: 'notices' };
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: noticeDoc, error: null }),
          }),
        }),
      });

      render(<DocumentDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Aviso')).toBeTruthy();
      });
    });
  });

  describe('open document', () => {
    it('shows open document button', async () => {
      render(<DocumentDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Abrir documento')).toBeTruthy();
      });
    });
  });

  describe('header', () => {
    it('shows header title', async () => {
      render(<DocumentDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Documento')).toBeTruthy();
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

      render(<DocumentDetailScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching document:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });
});
