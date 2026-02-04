import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

// Mock @react-navigation/bottom-tabs
jest.mock('@react-navigation/bottom-tabs', () => ({
  BottomTabBarButtonProps: {},
}));

// Mock @react-navigation/elements
jest.mock('@react-navigation/elements', () => ({
  PlatformPressable: ({ children, onPressIn, ...props }: any) => {
    const { Pressable } = require('react-native');
    return (
      <Pressable onPressIn={onPressIn} testID="platform-pressable" {...props}>
        {children}
      </Pressable>
    );
  },
}));

import { HapticTab } from '@/components/haptic-tab';

describe('HapticTab Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders without crashing', () => {
      render(
        <HapticTab>
          <Text>Tab Content</Text>
        </HapticTab>
      );

      expect(screen.getByText('Tab Content')).toBeTruthy();
    });

    it('renders children', () => {
      render(
        <HapticTab>
          <Text testID="tab-text">Home</Text>
        </HapticTab>
      );

      expect(screen.getByTestId('tab-text')).toBeTruthy();
    });
  });

  describe('haptic feedback', () => {
    it('has haptics module available', () => {
      render(
        <HapticTab>
          <Text>Tab</Text>
        </HapticTab>
      );

      expect(Haptics.impactAsync).toBeDefined();
    });

    it('renders as pressable', () => {
      render(
        <HapticTab>
          <Text>Tab</Text>
        </HapticTab>
      );

      expect(screen.getByTestId('platform-pressable')).toBeTruthy();
    });
  });

  describe('press handling', () => {
    it('calls onPressIn when provided', () => {
      const onPressIn = jest.fn();

      render(
        <HapticTab onPressIn={onPressIn}>
          <Text>Tab</Text>
        </HapticTab>
      );

      const pressable = screen.getByTestId('platform-pressable');
      fireEvent(pressable, 'pressIn');

      expect(onPressIn).toHaveBeenCalled();
    });
  });

  describe('props forwarding', () => {
    it('forwards accessibilityLabel', () => {
      render(
        <HapticTab accessibilityLabel="Home tab">
          <Text>Home</Text>
        </HapticTab>
      );

      expect(screen.getByLabelText('Home tab')).toBeTruthy();
    });
  });
});
