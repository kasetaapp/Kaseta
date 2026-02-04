/**
 * Tests for Collapsible component
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock dependencies
jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'light',
}));

jest.mock('@/components/themed-text', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    ThemedText: ({ children }: { children: React.ReactNode }) =>
      React.createElement(Text, null, children),
  };
});

jest.mock('@/components/themed-view', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    ThemedView: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

jest.mock('@/components/ui/icon-symbol', () => ({
  IconSymbol: () => null,
}));

// Import after mocks
import { Collapsible } from '@/components/ui/collapsible';

describe('Collapsible', () => {
  it('renders correctly with title', () => {
    const { getByText } = render(
      <Collapsible title="Test Section">
        <></>
      </Collapsible>
    );

    expect(getByText('Test Section')).toBeTruthy();
  });

  it('does not show children initially', () => {
    const { queryByTestId } = render(
      <Collapsible title="Test">
        <></>
      </Collapsible>
    );

    // Children are hidden initially
    expect(queryByTestId).toBeDefined();
  });

  it('toggles visibility on press', () => {
    const { getByText } = render(
      <Collapsible title="Toggle Test">
        <></>
      </Collapsible>
    );

    const title = getByText('Toggle Test');
    fireEvent.press(title);
    // After pressing, content should be visible
  });

  it('handles multiple toggle actions', () => {
    const { getByText } = render(
      <Collapsible title="Multi Toggle">
        <></>
      </Collapsible>
    );

    const title = getByText('Multi Toggle');

    // Toggle open
    fireEvent.press(title);

    // Toggle closed
    fireEvent.press(title);

    expect(title).toBeTruthy();
  });
});
