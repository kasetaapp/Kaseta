import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from '@/components/ui/Text';

describe('Text Component', () => {
  it('renders text content correctly', () => {
    render(<Text>Hello World</Text>);
    expect(screen.getByText('Hello World')).toBeTruthy();
  });

  it('renders with different variants', () => {
    const variants = [
      'displayLg',
      'display',
      'h1',
      'h2',
      'h3',
      'h4',
      'bodyLg',
      'body',
      'bodyMedium',
      'bodySm',
      'caption',
      'button',
    ] as const;

    variants.forEach((variant) => {
      const { unmount } = render(<Text variant={variant}>{variant}</Text>);
      expect(screen.getByText(variant)).toBeTruthy();
      unmount();
    });
  });

  it('renders with different color props', () => {
    const colors = ['default', 'secondary', 'muted', 'accent', 'error', 'success', 'warning', 'info'] as const;

    colors.forEach((color) => {
      const { unmount } = render(<Text color={color}>{color}</Text>);
      expect(screen.getByText(color)).toBeTruthy();
      unmount();
    });
  });

  it('applies custom color when provided', () => {
    render(<Text customColor="#FF0000">Custom Color</Text>);
    const textElement = screen.getByText('Custom Color');
    expect(textElement).toBeTruthy();
  });

  it('centers text when center prop is true', () => {
    render(<Text center>Centered Text</Text>);
    const textElement = screen.getByText('Centered Text');
    expect(textElement.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ textAlign: 'center' }),
      ])
    );
  });

  it('passes through additional props', () => {
    render(<Text numberOfLines={1}>Truncated text that is very long</Text>);
    const textElement = screen.getByText('Truncated text that is very long');
    expect(textElement.props.numberOfLines).toBe(1);
  });

  it('renders nested text correctly', () => {
    render(
      <Text>
        Hello <Text variant="bodyMedium">World</Text>
      </Text>
    );
    expect(screen.getByText(/Hello/)).toBeTruthy();
    expect(screen.getByText(/World/)).toBeTruthy();
  });
});
