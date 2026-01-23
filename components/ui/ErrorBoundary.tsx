/**
 * KASETA UI - ErrorBoundary Component
 * Catches JavaScript errors anywhere in child component tree
 * Tier S quality with recovery options
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text } from './Text';
import { Button } from './Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text variant="displayLg" style={styles.icon}>
              😵
            </Text>
            <Text variant="h2" center style={styles.title}>
              Algo salió mal
            </Text>
            <Text variant="body" color="secondary" center style={styles.description}>
              Ocurrió un error inesperado. Por favor intenta de nuevo.
            </Text>
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text variant="caption" color="error" style={styles.errorText}>
                  {this.state.error.message}
                </Text>
              </View>
            )}
            <Button
              onPress={this.handleRetry}
              variant="primary"
              size="lg"
              style={styles.retryButton}
              accessibilityLabel="Intentar de nuevo"
            >
              Intentar de nuevo
            </Button>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  icon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  description: {
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  errorDetails: {
    backgroundColor: Colors.errorBg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    width: '100%',
  },
  errorText: {
    fontFamily: 'monospace',
  },
  retryButton: {
    minWidth: 200,
  },
});

export default ErrorBoundary;
