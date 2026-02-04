/**
 * Tests for IconSymbol component
 */

import React from 'react';
import { render } from '@testing-library/react-native';

// The component uses different implementations on iOS vs Android/Web
// For testing purposes, we test the common behavior

describe('IconSymbol', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('renders without crashing', () => {
    const { IconSymbol } = require('@/components/ui/icon-symbol');

    const { toJSON } = render(
      <IconSymbol name="house.fill" color="#000" />
    );

    expect(toJSON()).toBeTruthy();
  });

  it('accepts size prop', () => {
    const { IconSymbol } = require('@/components/ui/icon-symbol');

    const { toJSON } = render(
      <IconSymbol name="house.fill" color="#000" size={32} />
    );

    expect(toJSON()).toBeTruthy();
  });

  it('accepts color prop', () => {
    const { IconSymbol } = require('@/components/ui/icon-symbol');

    const { toJSON } = render(
      <IconSymbol name="house.fill" color="#FF0000" />
    );

    expect(toJSON()).toBeTruthy();
  });

  it('renders different icon names', () => {
    const { IconSymbol } = require('@/components/ui/icon-symbol');

    const icons = ['house.fill', 'paperplane.fill', 'chevron.right'];

    icons.forEach(name => {
      const { toJSON } = render(
        <IconSymbol name={name} color="#000" />
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  it('accepts style prop', () => {
    const { IconSymbol } = require('@/components/ui/icon-symbol');

    const customStyle = { marginTop: 10 };
    const { toJSON } = render(
      <IconSymbol name="house.fill" color="#000" style={customStyle} />
    );

    expect(toJSON()).toBeTruthy();
  });
});
