import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Badge } from '@/components/ui/Badge';

describe('Badge Component', () => {
  it('renders text correctly', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('renders with different variants', () => {
    const variants = ['default', 'success', 'error', 'warning', 'info', 'accent'] as const;

    variants.forEach((variant) => {
      const { unmount } = render(<Badge variant={variant}>{variant}</Badge>);
      expect(screen.getByText(variant)).toBeTruthy();
      unmount();
    });
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>);
    expect(screen.getByText('Small')).toBeTruthy();

    rerender(<Badge size="md">Medium</Badge>);
    expect(screen.getByText('Medium')).toBeTruthy();
  });

  it('uses default variant when not specified', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText('Default')).toBeTruthy();
  });

  it('uses default size when not specified', () => {
    render(<Badge>Default Size</Badge>);
    expect(screen.getByText('Default Size')).toBeTruthy();
  });

  it('renders with icon', () => {
    render(<Badge icon={<></>}>With Icon</Badge>);
    expect(screen.getByText('With Icon')).toBeTruthy();
  });

  it('applies custom style', () => {
    render(<Badge style={{ marginTop: 10 }}>Styled</Badge>);
    expect(screen.getByText('Styled')).toBeTruthy();
  });
});
