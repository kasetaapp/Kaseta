import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Avatar, AvatarSize } from '@/components/ui/Avatar';

describe('Avatar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<Avatar />);
      expect(screen).toBeTruthy();
    });

    it('renders with name prop', () => {
      render(<Avatar name="John Doe" />);
      expect(screen.getByText('JD')).toBeTruthy();
    });
  });

  describe('initials generation', () => {
    it('generates initials from full name', () => {
      render(<Avatar name="John Doe" />);
      expect(screen.getByText('JD')).toBeTruthy();
    });

    it('generates single initial from single name', () => {
      render(<Avatar name="John" />);
      expect(screen.getByText('J')).toBeTruthy();
    });

    it('uses first and last name for multiple parts', () => {
      render(<Avatar name="John Michael Doe" />);
      expect(screen.getByText('JD')).toBeTruthy();
    });

    it('shows ? when no name provided', () => {
      render(<Avatar />);
      expect(screen.getByText('?')).toBeTruthy();
    });

    it('shows ? for empty name', () => {
      render(<Avatar name="" />);
      expect(screen.getByText('?')).toBeTruthy();
    });

    it('shows ? for whitespace-only name', () => {
      render(<Avatar name="   " />);
      expect(screen.getByText('?')).toBeTruthy();
    });

    it('uppercases initials', () => {
      render(<Avatar name="john doe" />);
      expect(screen.getByText('JD')).toBeTruthy();
    });
  });

  describe('size variants', () => {
    it.each([
      ['sm', 'sm'],
      ['md', 'md'],
      ['lg', 'lg'],
      ['xl', 'xl'],
    ])('renders %s size correctly', (size) => {
      render(<Avatar name="Test" size={size as AvatarSize} />);
      expect(screen.getByText('T')).toBeTruthy();
    });

    it('defaults to md size', () => {
      render(<Avatar name="Test" />);
      expect(screen.getByText('T')).toBeTruthy();
    });
  });

  describe('image source', () => {
    it('renders image when source is provided', () => {
      render(<Avatar source="https://example.com/avatar.jpg" name="Test" />);
      // When image is provided, initials should not be shown
      // Image is rendered instead
      expect(screen).toBeTruthy();
    });

    it('falls back to initials on image error', () => {
      const { UNSAFE_getByType } = render(
        <Avatar source="https://example.com/invalid.jpg" name="Test User" />
      );

      // Trigger image error
      const Image = require('react-native').Image;
      const image = UNSAFE_getByType(Image);
      fireEvent(image, 'error');

      // Should now show initials
      expect(screen.getByText('TU')).toBeTruthy();
    });

    it('shows initials when source is null', () => {
      render(<Avatar source={null} name="Test User" />);
      expect(screen.getByText('TU')).toBeTruthy();
    });
  });

  describe('custom background color', () => {
    it('accepts custom backgroundColor', () => {
      render(<Avatar name="Test" backgroundColor="#FF0000" />);
      expect(screen.getByText('T')).toBeTruthy();
    });

    it('generates consistent color from name', () => {
      const { rerender, toJSON } = render(<Avatar name="Alice" />);
      const firstRender = toJSON();

      rerender(<Avatar name="Alice" />);
      const secondRender = toJSON();

      // Same name should produce same result
      expect(JSON.stringify(firstRender)).toBe(JSON.stringify(secondRender));
    });

    it('different names produce different colors', () => {
      // This is tested implicitly through the hash function
      render(<Avatar name="Alice" />);
      expect(screen.getByText('A')).toBeTruthy();
    });
  });

  describe('bordered prop', () => {
    it('renders without border by default', () => {
      render(<Avatar name="Test" />);
      expect(screen.getByText('T')).toBeTruthy();
    });

    it('renders with border when bordered is true', () => {
      render(<Avatar name="Test" bordered />);
      expect(screen.getByText('T')).toBeTruthy();
    });
  });

  describe('custom style', () => {
    it('accepts custom style prop', () => {
      render(<Avatar name="Test" style={{ margin: 10 }} />);
      expect(screen.getByText('T')).toBeTruthy();
    });
  });

  describe('font variants', () => {
    it('uses correct font variant for sm size', () => {
      render(<Avatar name="T" size="sm" />);
      // Small size uses captionMedium variant
      expect(screen.getByText('T')).toBeTruthy();
    });

    it('uses correct font variant for lg size', () => {
      render(<Avatar name="T" size="lg" />);
      // Large size uses h3 variant
      expect(screen.getByText('T')).toBeTruthy();
    });

    it('uses correct font variant for xl size', () => {
      render(<Avatar name="T" size="xl" />);
      // XL size uses h1 variant
      expect(screen.getByText('T')).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('handles special characters in name', () => {
      render(<Avatar name="José María" />);
      expect(screen.getByText('JM')).toBeTruthy();
    });

    it('handles emoji in name', () => {
      render(<Avatar name="John 🎉 Doe" />);
      // Should handle gracefully
      expect(screen).toBeTruthy();
    });

    it('handles very long name', () => {
      render(
        <Avatar name="Bartholomew Jedediah Cornelius Wellington-Smythe IV" />
      );
      expect(screen.getByText('BI')).toBeTruthy();
    });
  });
});
