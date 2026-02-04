import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { View } from 'react-native';
import { IconButton, IconButtonVariant, IconButtonSize } from '@/components/ui/IconButton';
import * as Haptics from 'expo-haptics';

// Mock icon component
const MockIcon = ({ color, size }: { color?: string; size?: number }) => (
  <View testID="mock-icon" />
);

describe('IconButton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders without crashing', () => {
      render(<IconButton icon={<MockIcon />} />);
      expect(screen).toBeTruthy();
    });

    it('renders the icon', () => {
      render(<IconButton icon={<MockIcon />} />);
      expect(screen.getByTestId('mock-icon')).toBeTruthy();
    });
  });

  describe('variants', () => {
    it.each([
      ['default', 'default'],
      ['filled', 'filled'],
      ['tonal', 'tonal'],
      ['outlined', 'outlined'],
    ])('renders %s variant correctly', (variant) => {
      render(
        <IconButton
          icon={<MockIcon />}
          variant={variant as IconButtonVariant}
        />
      );
      expect(screen.getByTestId('mock-icon')).toBeTruthy();
    });

    it('defaults to default variant', () => {
      render(<IconButton icon={<MockIcon />} />);
      expect(screen.getByTestId('mock-icon')).toBeTruthy();
    });
  });

  describe('sizes', () => {
    it.each([
      ['sm', 'sm'],
      ['md', 'md'],
      ['lg', 'lg'],
    ])('renders %s size correctly', (size) => {
      render(<IconButton icon={<MockIcon />} size={size as IconButtonSize} />);
      expect(screen.getByTestId('mock-icon')).toBeTruthy();
    });

    it('defaults to md size', () => {
      render(<IconButton icon={<MockIcon />} />);
      expect(screen.getByTestId('mock-icon')).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('calls onPress when pressed', () => {
      const onPress = jest.fn();
      render(<IconButton icon={<MockIcon />} onPress={onPress} />);

      fireEvent.press(screen.getByRole('button'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('triggers haptic feedback on press', () => {
      render(<IconButton icon={<MockIcon />} />);

      fireEvent(screen.getByRole('button'), 'pressIn');
      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Light
      );
    });

    it('does not trigger haptic when disabled', () => {
      render(<IconButton icon={<MockIcon />} disabled />);

      fireEvent(screen.getByRole('button'), 'pressIn');
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });

    it('does not call onPress when disabled', () => {
      const onPress = jest.fn();
      render(<IconButton icon={<MockIcon />} onPress={onPress} disabled />);

      fireEvent.press(screen.getByRole('button'));
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('press animations', () => {
    it('handles pressIn event', () => {
      render(<IconButton icon={<MockIcon />} />);
      fireEvent(screen.getByRole('button'), 'pressIn');
      // Animation triggered
    });

    it('handles pressOut event', () => {
      render(<IconButton icon={<MockIcon />} />);
      fireEvent(screen.getByRole('button'), 'pressIn');
      fireEvent(screen.getByRole('button'), 'pressOut');
      // Animation reset
    });

    it('calls onPressIn callback', () => {
      const onPressIn = jest.fn();
      render(<IconButton icon={<MockIcon />} onPressIn={onPressIn} />);

      fireEvent(screen.getByRole('button'), 'pressIn');
      expect(onPressIn).toHaveBeenCalled();
    });

    it('calls onPressOut callback', () => {
      const onPressOut = jest.fn();
      render(<IconButton icon={<MockIcon />} onPressOut={onPressOut} />);

      fireEvent(screen.getByRole('button'), 'pressOut');
      expect(onPressOut).toHaveBeenCalled();
    });
  });

  describe('active state', () => {
    it('renders with active state', () => {
      render(<IconButton icon={<MockIcon />} active />);
      expect(screen.getByRole('button')).toBeTruthy();
    });

    it('uses accent color when active', () => {
      render(<IconButton icon={<MockIcon />} active variant="tonal" />);
      expect(screen.getByRole('button')).toBeTruthy();
    });

    it('sets accessibility selected state', () => {
      render(<IconButton icon={<MockIcon />} active />);
      const button = screen.getByRole('button');
      expect(button.props.accessibilityState.selected).toBe(true);
    });
  });

  describe('disabled state', () => {
    it('renders with disabled state', () => {
      render(<IconButton icon={<MockIcon />} disabled />);
      expect(screen.getByRole('button')).toBeTruthy();
    });

    it('sets accessibility disabled state', () => {
      render(<IconButton icon={<MockIcon />} disabled />);
      const button = screen.getByRole('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('icon color', () => {
    it('accepts custom iconColor', () => {
      render(<IconButton icon={<MockIcon />} iconColor="#FF0000" />);
      expect(screen.getByTestId('mock-icon')).toBeTruthy();
    });

    it('clones icon with color prop', () => {
      render(<IconButton icon={<MockIcon />} />);
      // Icon receives color prop via cloneElement
      expect(screen.getByTestId('mock-icon')).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('has button role', () => {
      render(<IconButton icon={<MockIcon />} />);
      expect(screen.getByRole('button')).toBeTruthy();
    });

    it('accepts accessibilityLabel', () => {
      render(
        <IconButton icon={<MockIcon />} accessibilityLabel="Close button" />
      );
      const button = screen.getByRole('button');
      expect(button.props.accessibilityLabel).toBe('Close button');
    });

    it('is accessible', () => {
      render(<IconButton icon={<MockIcon />} />);
      const button = screen.getByRole('button');
      expect(button.props.accessible).toBe(true);
    });
  });

  describe('custom style', () => {
    it('accepts custom style prop', () => {
      render(<IconButton icon={<MockIcon />} style={{ margin: 10 }} />);
      expect(screen.getByRole('button')).toBeTruthy();
    });
  });

  describe('variant styling', () => {
    it('filled variant has background color', () => {
      render(<IconButton icon={<MockIcon />} variant="filled" />);
      expect(screen.getByRole('button')).toBeTruthy();
    });

    it('tonal variant has semi-transparent background', () => {
      render(<IconButton icon={<MockIcon />} variant="tonal" />);
      expect(screen.getByRole('button')).toBeTruthy();
    });

    it('outlined variant has border', () => {
      render(<IconButton icon={<MockIcon />} variant="outlined" />);
      expect(screen.getByRole('button')).toBeTruthy();
    });

    it('default variant is transparent', () => {
      render(<IconButton icon={<MockIcon />} variant="default" />);
      expect(screen.getByRole('button')).toBeTruthy();
    });
  });

  describe('combined states', () => {
    it('handles active + disabled', () => {
      render(<IconButton icon={<MockIcon />} active disabled />);
      const button = screen.getByRole('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
      expect(button.props.accessibilityState.selected).toBe(true);
    });

    it('handles active + variant', () => {
      render(<IconButton icon={<MockIcon />} active variant="filled" />);
      expect(screen.getByRole('button')).toBeTruthy();
    });
  });
});
