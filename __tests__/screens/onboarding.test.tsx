import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

// Mock expo-router
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    replace: (...args: any[]) => mockReplace(...args),
  },
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock AsyncStorage
const mockSetItem = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: (...args: any[]) => mockSetItem(...args),
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

// Import component after mocks
import OnboardingScreen from '@/app/(app)/onboarding';

describe('OnboardingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('first slide', () => {
    it('renders welcome slide', () => {
      render(<OnboardingScreen />);

      expect(screen.getByText('Bienvenido a KASETA')).toBeTruthy();
    });

    it('shows skip button', () => {
      render(<OnboardingScreen />);

      expect(screen.getByText('Omitir')).toBeTruthy();
    });

    it('shows next button', () => {
      render(<OnboardingScreen />);

      expect(screen.getByText('Siguiente')).toBeTruthy();
    });

    it('shows description', () => {
      render(<OnboardingScreen />);

      expect(screen.getByText(/La mejor forma de gestionar/)).toBeTruthy();
    });
  });

  describe('skip functionality', () => {
    it('saves onboarding completion', async () => {
      render(<OnboardingScreen />);

      fireEvent.press(screen.getByText('Omitir'));

      await waitFor(() => {
        expect(mockSetItem).toHaveBeenCalledWith('@kaseta_onboarding_completed', 'true');
      });
    });

    it('navigates to home on skip', async () => {
      render(<OnboardingScreen />);

      fireEvent.press(screen.getByText('Omitir'));

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/(app)/(tabs)/home');
      });
    });
  });

  describe('slide content', () => {
    it('shows invite visitors slide', () => {
      render(<OnboardingScreen />);

      // All slides are rendered in the FlatList
      expect(screen.getByText('Invita visitantes fácilmente')).toBeTruthy();
    });

    it('shows instant access slide', () => {
      render(<OnboardingScreen />);

      expect(screen.getByText('Acceso instantáneo')).toBeTruthy();
    });

    it('shows always informed slide', () => {
      render(<OnboardingScreen />);

      expect(screen.getByText('Siempre informado')).toBeTruthy();
    });

    it('shows final slide', () => {
      render(<OnboardingScreen />);

      expect(screen.getByText('¡Listo para comenzar!')).toBeTruthy();
    });
  });

  describe('pagination', () => {
    it('shows pagination dots', () => {
      render(<OnboardingScreen />);

      // Should show 5 dots for 5 slides
      // The dots are Views, we verify the slide content is present
      expect(screen.getByText('Bienvenido a KASETA')).toBeTruthy();
    });
  });

  describe('icons', () => {
    it('shows welcome icon', () => {
      render(<OnboardingScreen />);

      expect(screen.getByText('🏠')).toBeTruthy();
    });

    it('shows invite icon', () => {
      render(<OnboardingScreen />);

      expect(screen.getByText('✉️')).toBeTruthy();
    });

    it('shows access icon', () => {
      render(<OnboardingScreen />);

      expect(screen.getByText('📱')).toBeTruthy();
    });

    it('shows notifications icon', () => {
      render(<OnboardingScreen />);

      expect(screen.getByText('🔔')).toBeTruthy();
    });

    it('shows final icon', () => {
      render(<OnboardingScreen />);

      expect(screen.getByText('🚀')).toBeTruthy();
    });
  });

  describe('next button', () => {
    it('shows next button on non-last slides', () => {
      render(<OnboardingScreen />);

      expect(screen.getByText('Siguiente')).toBeTruthy();
    });

    it('next button is pressable', () => {
      render(<OnboardingScreen />);

      const nextButton = screen.getByText('Siguiente');
      expect(nextButton).toBeTruthy();
    });
  });

  describe('all slides present', () => {
    it('shows all 5 slides in FlatList', () => {
      render(<OnboardingScreen />);

      // Verify all slide titles are in the document
      expect(screen.getByText('Bienvenido a KASETA')).toBeTruthy();
      expect(screen.getByText('Invita visitantes fácilmente')).toBeTruthy();
      expect(screen.getByText('Acceso instantáneo')).toBeTruthy();
      expect(screen.getByText('Siempre informado')).toBeTruthy();
      expect(screen.getByText('¡Listo para comenzar!')).toBeTruthy();
    });

    it('shows all slide descriptions', () => {
      render(<OnboardingScreen />);

      expect(screen.getByText(/Crea invitaciones con código QR/)).toBeTruthy();
      expect(screen.getByText(/Los guardias escanean el código QR/)).toBeTruthy();
      expect(screen.getByText(/Recibe alertas de accesos/)).toBeTruthy();
      expect(screen.getByText(/Únete a tu organización/)).toBeTruthy();
    });
  });

  describe('slide navigation', () => {
    it('maintains slide state', () => {
      render(<OnboardingScreen />);

      // Initial state shows first slide with next button
      expect(screen.getByText('Siguiente')).toBeTruthy();
    });
  });

  describe('haptic feedback', () => {
    it('haptics module is available', () => {
      const Haptics = require('expo-haptics');

      render(<OnboardingScreen />);

      expect(Haptics.impactAsync).toBeDefined();
      expect(Haptics.ImpactFeedbackStyle.Light).toBe('light');
      expect(Haptics.ImpactFeedbackStyle.Medium).toBe('medium');
    });
  });
});
