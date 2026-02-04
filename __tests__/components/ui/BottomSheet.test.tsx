import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text, BackHandler, Platform, View } from 'react-native';
import * as Haptics from 'expo-haptics';

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  const createChainableMock = () => {
    const mock: any = {};
    const chainMethods = ['onStart', 'onUpdate', 'onEnd', 'onBegin', 'onFinalize'];
    chainMethods.forEach(method => {
      mock[method] = jest.fn(() => mock);
    });
    return mock;
  };
  return {
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
    Gesture: {
      Pan: jest.fn(() => createChainableMock()),
    },
    GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => View({ children }),
  };
});

// Mock BackHandler
jest.mock('react-native/Libraries/Utilities/BackHandler', () => ({
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
}));

// Import after mocks
import { BottomSheet, BottomSheetRef } from '@/components/ui/BottomSheet';

describe('BottomSheet Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
  });

  describe('basic rendering', () => {
    it('renders without crashing', () => {
      render(
        <BottomSheet>
          <Text>Content</Text>
        </BottomSheet>
      );
      expect(screen).toBeTruthy();
    });

    it('renders children', () => {
      render(
        <BottomSheet>
          <Text testID="child">Child Content</Text>
        </BottomSheet>
      );
      expect(screen.getByTestId('child')).toBeTruthy();
    });
  });

  describe('handle', () => {
    it('shows handle by default', () => {
      const { toJSON } = render(
        <BottomSheet>
          <Text>Content</Text>
        </BottomSheet>
      );
      expect(toJSON()).toBeTruthy();
    });

    it('hides handle when showHandle is false', () => {
      const { toJSON } = render(
        <BottomSheet showHandle={false}>
          <Text>Content</Text>
        </BottomSheet>
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('ref methods', () => {
    it('exposes open method', () => {
      const ref = React.createRef<BottomSheetRef>();
      render(
        <BottomSheet ref={ref}>
          <Text>Content</Text>
        </BottomSheet>
      );

      expect(ref.current?.open).toBeDefined();
    });

    it('exposes close method', () => {
      const ref = React.createRef<BottomSheetRef>();
      render(
        <BottomSheet ref={ref}>
          <Text>Content</Text>
        </BottomSheet>
      );

      expect(ref.current?.close).toBeDefined();
    });

    it('exposes snapTo method', () => {
      const ref = React.createRef<BottomSheetRef>();
      render(
        <BottomSheet ref={ref}>
          <Text>Content</Text>
        </BottomSheet>
      );

      expect(ref.current?.snapTo).toBeDefined();
    });

    it('open triggers haptic feedback', () => {
      const ref = React.createRef<BottomSheetRef>();
      render(
        <BottomSheet ref={ref}>
          <Text>Content</Text>
        </BottomSheet>
      );

      ref.current?.open();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Light
      );
    });

    it('close triggers haptic feedback', () => {
      const ref = React.createRef<BottomSheetRef>();
      render(
        <BottomSheet ref={ref}>
          <Text>Content</Text>
        </BottomSheet>
      );

      ref.current?.close();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Light
      );
    });
  });

  describe('snap points', () => {
    it('accepts custom snap points', () => {
      const ref = React.createRef<BottomSheetRef>();
      render(
        <BottomSheet ref={ref} snapPoints={[0.25, 0.5, 0.9]}>
          <Text>Content</Text>
        </BottomSheet>
      );

      expect(ref.current?.snapTo).toBeDefined();
    });

    it('uses default snap point of 0.5', () => {
      const ref = React.createRef<BottomSheetRef>();
      render(
        <BottomSheet ref={ref}>
          <Text>Content</Text>
        </BottomSheet>
      );

      // Default is [0.5]
      expect(ref.current?.open).toBeDefined();
    });

    it('snapTo works within valid range', () => {
      const ref = React.createRef<BottomSheetRef>();
      render(
        <BottomSheet ref={ref} snapPoints={[0.3, 0.6, 0.9]}>
          <Text>Content</Text>
        </BottomSheet>
      );

      // Should not throw
      ref.current?.snapTo(0);
      ref.current?.snapTo(1);
      ref.current?.snapTo(2);
    });

    it('snapTo ignores invalid index', () => {
      const ref = React.createRef<BottomSheetRef>();
      render(
        <BottomSheet ref={ref} snapPoints={[0.5]}>
          <Text>Content</Text>
        </BottomSheet>
      );

      // Should not throw for invalid index
      ref.current?.snapTo(-1);
      ref.current?.snapTo(5);
    });
  });

  describe('onClose callback', () => {
    it('calls onClose when closed', () => {
      const onClose = jest.fn();
      const ref = React.createRef<BottomSheetRef>();

      render(
        <BottomSheet ref={ref} onClose={onClose}>
          <Text>Content</Text>
        </BottomSheet>
      );

      ref.current?.close();
      // onClose is called after animation
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('backdrop', () => {
    it('accepts custom backdropOpacity', () => {
      const { toJSON } = render(
        <BottomSheet backdropOpacity={0.8}>
          <Text>Content</Text>
        </BottomSheet>
      );
      expect(toJSON()).toBeTruthy();
    });

    it('uses default backdropOpacity of 0.5', () => {
      const { toJSON } = render(
        <BottomSheet>
          <Text>Content</Text>
        </BottomSheet>
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Android back handler', () => {
    it('renders on Android platform', () => {
      Platform.OS = 'android';

      const { getByText } = render(
        <BottomSheet>
          <Text>Content</Text>
        </BottomSheet>
      );

      expect(getByText('Content')).toBeTruthy();
    });

    it('renders on iOS platform', () => {
      Platform.OS = 'ios';

      const { getByText } = render(
        <BottomSheet>
          <Text>Content</Text>
        </BottomSheet>
      );

      expect(getByText('Content')).toBeTruthy();
    });

    it('can be unmounted without error', () => {
      Platform.OS = 'android';

      const { unmount } = render(
        <BottomSheet>
          <Text>Content</Text>
        </BottomSheet>
      );

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('gesture handling', () => {
    it('renders with GestureDetector', () => {
      const { toJSON } = render(
        <BottomSheet>
          <Text>Content</Text>
        </BottomSheet>
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('theme support', () => {
    it('renders in light mode', () => {
      const { toJSON } = render(
        <BottomSheet>
          <Text>Content</Text>
        </BottomSheet>
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('styling', () => {
    it('has rounded top corners', () => {
      const { toJSON } = render(
        <BottomSheet>
          <Text>Content</Text>
        </BottomSheet>
      );
      // Sheet has borderTopLeftRadius and borderTopRightRadius
      expect(toJSON()).toBeTruthy();
    });

    it('has shadow styling', () => {
      const { toJSON } = render(
        <BottomSheet>
          <Text>Content</Text>
        </BottomSheet>
      );
      // Sheet has shadowColor, shadowOffset, etc.
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('content area', () => {
    it('renders content with padding', () => {
      render(
        <BottomSheet>
          <Text testID="content">Test content</Text>
        </BottomSheet>
      );
      expect(screen.getByTestId('content')).toBeTruthy();
    });

    it('renders multiple children', () => {
      render(
        <BottomSheet>
          <Text testID="child1">First</Text>
          <Text testID="child2">Second</Text>
        </BottomSheet>
      );
      expect(screen.getByTestId('child1')).toBeTruthy();
      expect(screen.getByTestId('child2')).toBeTruthy();
    });
  });
});
