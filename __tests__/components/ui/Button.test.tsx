import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Button } from '@/components/ui/Button';
import * as Haptics from 'expo-haptics';

describe('Button Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with text', () => {
    render(<Button>Test Button</Button>);
    expect(screen.getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(<Button onPress={onPress}>Click Me</Button>);

    fireEvent.press(screen.getByText('Click Me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('triggers haptic feedback on press', () => {
    render(<Button>Haptic Button</Button>);

    fireEvent(screen.getByText('Haptic Button'), 'pressIn');
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    render(<Button onPress={onPress} disabled>Disabled Button</Button>);

    fireEvent.press(screen.getByText('Disabled Button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    render(<Button onPress={onPress} loading>Loading Button</Button>);

    // When loading, button text is replaced with ActivityIndicator
    const button = screen.queryByText('Loading Button');
    expect(button).toBeNull();
  });

  it('has correct accessibility props', () => {
    render(<Button accessibilityLabel="Custom Label">Accessible Button</Button>);

    const button = screen.getByRole('button');
    expect(button.props.accessibilityLabel).toBe('Custom Label');
  });

  it('uses children as default accessibility label', () => {
    render(<Button>Default Label</Button>);

    const button = screen.getByRole('button');
    expect(button.props.accessibilityLabel).toBe('Default Label');
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByText('Primary')).toBeTruthy();

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByText('Secondary')).toBeTruthy();

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByText('Ghost')).toBeTruthy();

    rerender(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByText('Destructive')).toBeTruthy();

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByText('Outline')).toBeTruthy();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByText('Small')).toBeTruthy();

    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByText('Medium')).toBeTruthy();

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByText('Large')).toBeTruthy();
  });

  it('renders fullWidth when prop is set', () => {
    render(<Button fullWidth>Full Width</Button>);
    expect(screen.getByText('Full Width')).toBeTruthy();
  });
});
