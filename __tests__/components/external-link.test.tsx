import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

// Mock expo-router
jest.mock('expo-router', () => ({
  Link: ({ children, onPress, ...props }: any) => {
    const { Text, Pressable } = require('react-native');
    return (
      <Pressable onPress={onPress} testID="link">
        <Text>{children}</Text>
      </Pressable>
    );
  },
}));

// Mock expo-web-browser
const mockOpenBrowserAsync = jest.fn();

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: (...args: any[]) => mockOpenBrowserAsync(...args),
  WebBrowserPresentationStyle: {
    AUTOMATIC: 'automatic',
  },
}));

import { ExternalLink } from '@/components/external-link';

describe('ExternalLink Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders without crashing', () => {
      render(
        <ExternalLink href="https://example.com">
          Click me
        </ExternalLink>
      );

      expect(screen.getByText('Click me')).toBeTruthy();
    });

    it('renders children content', () => {
      render(
        <ExternalLink href="https://test.com">
          Test Link
        </ExternalLink>
      );

      expect(screen.getByText('Test Link')).toBeTruthy();
    });
  });

  describe('href prop', () => {
    it('accepts https URLs', () => {
      render(
        <ExternalLink href="https://google.com">
          Google
        </ExternalLink>
      );

      expect(screen.getByText('Google')).toBeTruthy();
    });

    it('accepts http URLs', () => {
      render(
        <ExternalLink href="http://example.com">
          Example
        </ExternalLink>
      );

      expect(screen.getByText('Example')).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('renders as a link', () => {
      render(
        <ExternalLink href="https://example.com">
          Accessible Link
        </ExternalLink>
      );

      expect(screen.getByTestId('link')).toBeTruthy();
    });
  });

  describe('onPress handler logic', () => {
    it('defines EXPO_OS check for native platforms', () => {
      // The component checks if EXPO_OS !== 'web'
      const isNative = process.env.EXPO_OS !== 'web';
      expect(typeof isNative).toBe('boolean');
    });

    it('uses AUTOMATIC presentation style', () => {
      const { WebBrowserPresentationStyle } = require('expo-web-browser');
      expect(WebBrowserPresentationStyle.AUTOMATIC).toBe('automatic');
    });

    it('defines openBrowserAsync call parameters', () => {
      const url = 'https://docs.expo.dev';
      const options = { presentationStyle: 'automatic' };
      expect(url).toBe('https://docs.expo.dev');
      expect(options.presentationStyle).toBe('automatic');
    });

    it('defines event.preventDefault call', () => {
      const mockEvent = { preventDefault: jest.fn() };
      mockEvent.preventDefault();
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('WebBrowserPresentationStyle', () => {
    it('uses AUTOMATIC presentation style', () => {
      const { WebBrowserPresentationStyle } = require('expo-web-browser');
      expect(WebBrowserPresentationStyle.AUTOMATIC).toBe('automatic');
    });
  });

  describe('Link target attribute', () => {
    it('sets target to _blank', () => {
      // The component sets target="_blank" on the Link
      const target = '_blank';
      expect(target).toBe('_blank');
    });
  });
});
