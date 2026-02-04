import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Component that throws an error
function ThrowError({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <Text testID="child">Child Content</Text>;
}

// Component that throws on click
function ThrowOnClick() {
  const [shouldThrow, setShouldThrow] = React.useState(false);

  if (shouldThrow) {
    throw new Error('Clicked error');
  }

  return (
    <Text testID="throw-button" onPress={() => setShouldThrow(true)}>
      Click to throw
    </Text>
  );
}

describe('ErrorBoundary Component', () => {
  // Suppress console.error for these tests since errors are expected
  let consoleError: typeof console.error;

  beforeAll(() => {
    consoleError = console.error;
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = consoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('normal rendering', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <Text testID="child">Child Content</Text>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child')).toBeTruthy();
      expect(screen.getByText('Child Content')).toBeTruthy();
    });

    it('renders nested children correctly', () => {
      render(
        <ErrorBoundary>
          <View testID="parent">
            <Text testID="nested-child">Nested</Text>
          </View>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('parent')).toBeTruthy();
      expect(screen.getByTestId('nested-child')).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('catches errors and displays fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Algo salió mal')).toBeTruthy();
      expect(screen.getByText('Ocurrió un error inesperado. Por favor intenta de nuevo.')).toBeTruthy();
    });

    it('displays retry button', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Intentar de nuevo')).toBeTruthy();
    });

    it('logs error to console', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error),
        expect.any(Object)
      );
    });

    it('shows error details in development mode', () => {
      const originalDev = (global as any).__DEV__;
      (global as any).__DEV__ = true;

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Test error message')).toBeTruthy();

      (global as any).__DEV__ = originalDev;
    });
  });

  describe('custom fallback', () => {
    it('renders custom fallback when provided', () => {
      const customFallback = <Text testID="custom-fallback">Custom Error UI</Text>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeTruthy();
      expect(screen.getByText('Custom Error UI')).toBeTruthy();
      expect(screen.queryByText('Algo salió mal')).toBeNull();
    });
  });

  describe('onError callback', () => {
    it('calls onError callback when error occurs', () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('passes error object to onError', () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      );

      const [error] = onError.mock.calls[0];
      expect(error.message).toBe('Test error message');
    });
  });

  describe('retry functionality', () => {
    it('shows retry button and can be pressed', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Error UI should be shown
      expect(screen.getByText('Algo salió mal')).toBeTruthy();

      // Retry button should be visible and pressable
      const retryButton = screen.getByText('Intentar de nuevo');
      expect(retryButton).toBeTruthy();

      // Press retry - should not throw
      expect(() => {
        fireEvent.press(retryButton);
      }).not.toThrow();
    });

    it('has correct accessibility label on retry button', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: 'Intentar de nuevo' });
      expect(retryButton).toBeTruthy();
    });
  });

  describe('state management', () => {
    it('initializes with no error', () => {
      render(
        <ErrorBoundary>
          <Text>Safe content</Text>
        </ErrorBoundary>
      );

      expect(screen.queryByText('Algo salió mal')).toBeNull();
    });

    it('getDerivedStateFromError sets hasError to true', () => {
      const result = ErrorBoundary.getDerivedStateFromError(new Error('Test'));

      expect(result.hasError).toBe(true);
      expect(result.error).toBeTruthy();
    });
  });

  describe('error emoji display', () => {
    it('displays error emoji', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // The emoji is displayed as text
      expect(screen.getByText('😵')).toBeTruthy();
    });
  });

  describe('multiple errors', () => {
    it('catches different errors from different components', () => {
      // Test that error boundary properly catches errors
      const { unmount } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Algo salió mal')).toBeTruthy();
      unmount();

      // Mount a fresh error boundary with a different error
      function ThrowDifferentError(): React.ReactElement {
        throw new Error('Different error');
      }

      render(
        <ErrorBoundary>
          <ThrowDifferentError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Algo salió mal')).toBeTruthy();
    });
  });

  describe('error boundary isolation', () => {
    it('does not affect sibling components', () => {
      render(
        <View>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
          <Text testID="sibling">Sibling Content</Text>
        </View>
      );

      expect(screen.getByText('Algo salió mal')).toBeTruthy();
      expect(screen.getByTestId('sibling')).toBeTruthy();
    });

    it('nested error boundaries work independently', () => {
      render(
        <ErrorBoundary>
          <Text testID="outer-child">Outer</Text>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </ErrorBoundary>
      );

      // Outer child should still render
      expect(screen.getByTestId('outer-child')).toBeTruthy();
      // Inner boundary catches the error
      expect(screen.getByText('Algo salió mal')).toBeTruthy();
    });
  });
});
