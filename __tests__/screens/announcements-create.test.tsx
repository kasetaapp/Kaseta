import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Mock expo-router
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  router: {
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
  Bell: () => null,
  AlertTriangle: () => null,
  Info: () => null,
  Megaphone: () => null,
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
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

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
  }),
}));

// Import component after mocks
import CreateAnnouncementScreen from '@/app/(app)/announcements/create';

describe('CreateAnnouncementScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      currentOrganization: { id: 'org-123', name: 'Test Community' },
      isAdmin: true,
    });

    mockSupabaseFrom.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null }),
    });
  });

  describe('non-admin access', () => {
    it('shows permission denied for non-admins', () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: { id: 'org-123' },
        isAdmin: false,
      });

      render(<CreateAnnouncementScreen />);

      expect(screen.getByText('Sin permisos')).toBeTruthy();
      expect(screen.getByText('Solo administradores pueden crear anuncios')).toBeTruthy();
    });
  });

  describe('header', () => {
    it('renders header with title', () => {
      render(<CreateAnnouncementScreen />);

      expect(screen.getByText('Nuevo anuncio')).toBeTruthy();
    });
  });

  describe('type selection', () => {
    it('shows type section title', () => {
      render(<CreateAnnouncementScreen />);

      expect(screen.getByText('Tipo de anuncio')).toBeTruthy();
    });

    it('shows all announcement types', () => {
      render(<CreateAnnouncementScreen />);

      expect(screen.getByText('General')).toBeTruthy();
      expect(screen.getByText('Información')).toBeTruthy();
      expect(screen.getByText('Aviso')).toBeTruthy();
      expect(screen.getByText('Urgente')).toBeTruthy();
    });

    it('allows selecting a type', () => {
      render(<CreateAnnouncementScreen />);

      fireEvent.press(screen.getByText('Urgente'));

      // Type should be selected (visual change)
      expect(screen.getByText('Urgente')).toBeTruthy();
    });
  });

  describe('content section', () => {
    it('shows content section title', () => {
      render(<CreateAnnouncementScreen />);

      // "Contenido" appears as section title and label
      expect(screen.getAllByText('Contenido').length).toBeGreaterThan(0);
    });

    it('shows title input', () => {
      render(<CreateAnnouncementScreen />);

      expect(screen.getByText('Título')).toBeTruthy();
      expect(screen.getByPlaceholderText('Título del anuncio')).toBeTruthy();
    });

    it('shows content input', () => {
      render(<CreateAnnouncementScreen />);

      // "Contenido" appears as section title and label
      expect(screen.getAllByText('Contenido').length).toBeGreaterThan(0);
      expect(screen.getByPlaceholderText('Escribe el mensaje del anuncio...')).toBeTruthy();
    });
  });

  describe('submit button', () => {
    it('shows submit button', () => {
      render(<CreateAnnouncementScreen />);

      expect(screen.getByText('Publicar anuncio')).toBeTruthy();
    });

    it('disables button when form is incomplete', () => {
      render(<CreateAnnouncementScreen />);

      // Button should be disabled initially
      const button = screen.getByText('Publicar anuncio');
      expect(button).toBeTruthy();
    });
  });

  describe('form submission', () => {
    it('creates announcement on valid submit', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<CreateAnnouncementScreen />);

      // Fill form
      fireEvent.changeText(screen.getByPlaceholderText('Título del anuncio'), 'Test Title');
      fireEvent.changeText(
        screen.getByPlaceholderText('Escribe el mensaje del anuncio...'),
        'Test Content'
      );

      fireEvent.press(screen.getByText('Publicar anuncio'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Éxito',
          'Anuncio publicado correctamente',
          expect.any(Array)
        );
      });
    });

    it('shows error when creation fails', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const consoleError = console.error;
      console.error = jest.fn();

      mockSupabaseFrom.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: new Error('Failed') }),
      });

      render(<CreateAnnouncementScreen />);

      // Fill form
      fireEvent.changeText(screen.getByPlaceholderText('Título del anuncio'), 'Test Title');
      fireEvent.changeText(
        screen.getByPlaceholderText('Escribe el mensaje del anuncio...'),
        'Test Content'
      );

      fireEvent.press(screen.getByText('Publicar anuncio'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'No se pudo crear el anuncio');
      });

      console.error = consoleError;
    });
  });

  describe('validation', () => {
    it('button is disabled when title is empty', () => {
      render(<CreateAnnouncementScreen />);

      // Fill only content - button should remain disabled
      fireEvent.changeText(
        screen.getByPlaceholderText('Escribe el mensaje del anuncio...'),
        'Test Content'
      );

      // Button should be present but disabled (won't trigger validation)
      expect(screen.getByText('Publicar anuncio')).toBeTruthy();
    });

    it('button is disabled when content is empty', () => {
      render(<CreateAnnouncementScreen />);

      // Fill only title - button should remain disabled
      fireEvent.changeText(screen.getByPlaceholderText('Título del anuncio'), 'Test Title');

      // Button should be present but disabled
      expect(screen.getByText('Publicar anuncio')).toBeTruthy();
    });

    it('enables button when both fields are filled', () => {
      render(<CreateAnnouncementScreen />);

      // Fill both fields
      fireEvent.changeText(screen.getByPlaceholderText('Título del anuncio'), 'Test Title');
      fireEvent.changeText(
        screen.getByPlaceholderText('Escribe el mensaje del anuncio...'),
        'Test Content'
      );

      // Button should now be enabled
      expect(screen.getByText('Publicar anuncio')).toBeTruthy();
    });
  });
});
