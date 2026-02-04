import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { ThemedText } from '@/components/themed-text';

describe('ThemedText Component', () => {
  describe('basic rendering', () => {
    it('renders without crashing', () => {
      render(<ThemedText>Hello World</ThemedText>);
      expect(screen.getByText('Hello World')).toBeTruthy();
    });

    it('renders text content', () => {
      render(<ThemedText>Test content</ThemedText>);
      expect(screen.getByText('Test content')).toBeTruthy();
    });
  });

  describe('type variants', () => {
    it('renders default type', () => {
      render(<ThemedText type="default">Default text</ThemedText>);
      expect(screen.getByText('Default text')).toBeTruthy();
    });

    it('renders title type', () => {
      render(<ThemedText type="title">Title text</ThemedText>);
      expect(screen.getByText('Title text')).toBeTruthy();
    });

    it('renders defaultSemiBold type', () => {
      render(<ThemedText type="defaultSemiBold">Semi bold text</ThemedText>);
      expect(screen.getByText('Semi bold text')).toBeTruthy();
    });

    it('renders subtitle type', () => {
      render(<ThemedText type="subtitle">Subtitle text</ThemedText>);
      expect(screen.getByText('Subtitle text')).toBeTruthy();
    });

    it('renders link type', () => {
      render(<ThemedText type="link">Link text</ThemedText>);
      expect(screen.getByText('Link text')).toBeTruthy();
    });
  });

  describe('color props', () => {
    it('accepts lightColor prop', () => {
      render(<ThemedText lightColor="#FF0000">Light colored text</ThemedText>);
      expect(screen.getByText('Light colored text')).toBeTruthy();
    });

    it('accepts darkColor prop', () => {
      render(<ThemedText darkColor="#00FF00">Dark colored text</ThemedText>);
      expect(screen.getByText('Dark colored text')).toBeTruthy();
    });

    it('accepts both light and dark colors', () => {
      render(
        <ThemedText lightColor="#FF0000" darkColor="#00FF00">
          Themed text
        </ThemedText>
      );
      expect(screen.getByText('Themed text')).toBeTruthy();
    });
  });

  describe('style prop', () => {
    it('accepts custom style', () => {
      render(
        <ThemedText style={{ fontSize: 20 }}>
          Styled text
        </ThemedText>
      );
      expect(screen.getByText('Styled text')).toBeTruthy();
    });

    it('merges custom style with type style', () => {
      render(
        <ThemedText type="title" style={{ color: 'red' }}>
          Merged styles
        </ThemedText>
      );
      expect(screen.getByText('Merged styles')).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('accepts accessibilityLabel', () => {
      render(
        <ThemedText accessibilityLabel="Accessible text">
          Content
        </ThemedText>
      );
      expect(screen.getByLabelText('Accessible text')).toBeTruthy();
    });

    it('accepts testID', () => {
      render(<ThemedText testID="themed-text">Test</ThemedText>);
      expect(screen.getByTestId('themed-text')).toBeTruthy();
    });
  });

  describe('other text props', () => {
    it('accepts numberOfLines', () => {
      render(
        <ThemedText numberOfLines={1}>
          Long text that should be truncated
        </ThemedText>
      );
      expect(screen.getByText('Long text that should be truncated')).toBeTruthy();
    });

    it('accepts ellipsizeMode', () => {
      render(
        <ThemedText numberOfLines={1} ellipsizeMode="tail">
          Truncated text
        </ThemedText>
      );
      expect(screen.getByText('Truncated text')).toBeTruthy();
    });
  });

  describe('default behavior', () => {
    it('uses default type when not specified', () => {
      render(<ThemedText>No type specified</ThemedText>);
      expect(screen.getByText('No type specified')).toBeTruthy();
    });
  });
});
