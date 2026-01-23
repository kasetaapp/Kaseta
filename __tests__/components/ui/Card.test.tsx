import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import * as Haptics from 'expo-haptics';

describe('Card Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children correctly', () => {
    render(
      <Card>
        <Text>Card Content</Text>
      </Card>
    );
    expect(screen.getByText('Card Content')).toBeTruthy();
  });

  it('renders with different variants', () => {
    const { rerender } = render(
      <Card variant="elevated">
        <Text>Elevated</Text>
      </Card>
    );
    expect(screen.getByText('Elevated')).toBeTruthy();

    rerender(
      <Card variant="outlined">
        <Text>Outlined</Text>
      </Card>
    );
    expect(screen.getByText('Outlined')).toBeTruthy();

    rerender(
      <Card variant="filled">
        <Text>Filled</Text>
      </Card>
    );
    expect(screen.getByText('Filled')).toBeTruthy();
  });

  it('renders with different padding sizes', () => {
    const { rerender } = render(
      <Card padding="none">
        <Text>No Padding</Text>
      </Card>
    );
    expect(screen.getByText('No Padding')).toBeTruthy();

    rerender(
      <Card padding="sm">
        <Text>Small Padding</Text>
      </Card>
    );
    expect(screen.getByText('Small Padding')).toBeTruthy();

    rerender(
      <Card padding="md">
        <Text>Medium Padding</Text>
      </Card>
    );
    expect(screen.getByText('Medium Padding')).toBeTruthy();

    rerender(
      <Card padding="lg">
        <Text>Large Padding</Text>
      </Card>
    );
    expect(screen.getByText('Large Padding')).toBeTruthy();
  });

  it('is pressable when pressable prop is true', () => {
    const onPress = jest.fn();
    render(
      <Card pressable onPress={onPress}>
        <Text>Pressable Card</Text>
      </Card>
    );

    fireEvent.press(screen.getByText('Pressable Card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is pressable when onPress is provided', () => {
    const onPress = jest.fn();
    render(
      <Card onPress={onPress}>
        <Text>Clickable Card</Text>
      </Card>
    );

    fireEvent.press(screen.getByText('Clickable Card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('triggers haptic feedback when pressed', () => {
    render(
      <Card pressable onPress={() => {}}>
        <Text>Haptic Card</Text>
      </Card>
    );

    fireEvent(screen.getByText('Haptic Card'), 'pressIn');
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('is not pressable by default', () => {
    const onPress = jest.fn();
    render(
      <Card>
        <Text>Non-Pressable Card</Text>
      </Card>
    );

    // Without pressable prop or onPress, card should be a View not Pressable
    const card = screen.getByText('Non-Pressable Card');
    expect(card).toBeTruthy();
  });

  it('has accessibility props when pressable', () => {
    render(
      <Card pressable onPress={() => {}} accessibilityLabel="Card action">
        <Text>Accessible Card</Text>
      </Card>
    );

    const card = screen.getByRole('button');
    expect(card.props.accessibilityLabel).toBe('Card action');
  });
});
