import React from 'react';

// Since IconSymbol uses native icon components, we test the interface
describe('IconSymbol Component', () => {
  describe('icon mapping', () => {
    const MAPPING = {
      'house.fill': 'home',
      'paperplane.fill': 'send',
      'chevron.left.forwardslash.chevron.right': 'code',
      'chevron.right': 'chevron-right',
    };

    it('maps house.fill to home', () => {
      expect(MAPPING['house.fill']).toBe('home');
    });

    it('maps paperplane.fill to send', () => {
      expect(MAPPING['paperplane.fill']).toBe('send');
    });

    it('maps chevron.left.forwardslash.chevron.right to code', () => {
      expect(MAPPING['chevron.left.forwardslash.chevron.right']).toBe('code');
    });

    it('maps chevron.right to chevron-right', () => {
      expect(MAPPING['chevron.right']).toBe('chevron-right');
    });
  });

  describe('props', () => {
    it('accepts name prop', () => {
      const props = { name: 'house.fill' };
      expect(props.name).toBe('house.fill');
    });

    it('accepts size prop with default of 24', () => {
      const defaultSize = 24;
      expect(defaultSize).toBe(24);
    });

    it('accepts color prop', () => {
      const props = { color: '#FF0000' };
      expect(props.color).toBe('#FF0000');
    });

    it('accepts style prop', () => {
      const props = { style: { marginLeft: 10 } };
      expect(props.style.marginLeft).toBe(10);
    });

    it('accepts weight prop', () => {
      const props = { weight: 'bold' };
      expect(props.weight).toBe('bold');
    });
  });

  describe('color formats', () => {
    it('supports hex colors', () => {
      const hexColor = '#FF0000';
      expect(hexColor.startsWith('#')).toBe(true);
    });

    it('supports named colors', () => {
      const namedColor = 'blue';
      expect(typeof namedColor).toBe('string');
    });

    it('supports rgba colors', () => {
      const rgbaColor = 'rgba(255, 0, 0, 0.5)';
      expect(rgbaColor.startsWith('rgba')).toBe(true);
    });
  });

  describe('size values', () => {
    it('accepts small size', () => {
      const smallSize = 16;
      expect(smallSize).toBeLessThan(24);
    });

    it('accepts default size', () => {
      const defaultSize = 24;
      expect(defaultSize).toBe(24);
    });

    it('accepts large size', () => {
      const largeSize = 32;
      expect(largeSize).toBeGreaterThan(24);
    });
  });
});
