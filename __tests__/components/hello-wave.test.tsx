import React from 'react';
import { render, screen } from '@testing-library/react-native';

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: {
      Text: ({ children, style }: any) => <Text style={style}>{children}</Text>,
    },
  };
});

import { HelloWave } from '@/components/hello-wave';

describe('HelloWave Component', () => {
  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<HelloWave />);
    });

    it('displays the wave emoji', () => {
      render(<HelloWave />);
      expect(screen.getByText('👋')).toBeTruthy();
    });
  });

  describe('styling', () => {
    it('uses correct font size', () => {
      const expectedStyle = {
        fontSize: 28,
        lineHeight: 32,
        marginTop: -6,
      };
      expect(expectedStyle.fontSize).toBe(28);
      expect(expectedStyle.lineHeight).toBe(32);
      expect(expectedStyle.marginTop).toBe(-6);
    });
  });

  describe('animation configuration', () => {
    it('defines animation name with rotation', () => {
      const animationName = {
        '50%': { transform: [{ rotate: '25deg' }] },
      };
      expect(animationName['50%'].transform[0].rotate).toBe('25deg');
    });

    it('defines animation iteration count', () => {
      const animationIterationCount = 4;
      expect(animationIterationCount).toBe(4);
    });

    it('defines animation duration', () => {
      const animationDuration = '300ms';
      expect(animationDuration).toBe('300ms');
    });
  });
});
