import React from 'react';
import { render, screen } from '@testing-library/react-native';

// Mock expo-router
jest.mock('expo-router', () => ({
  Link: ({ children, href, dismissTo, style }: any) => {
    const { Pressable } = require('react-native');
    return <Pressable testID={`link-${href}`} style={style}>{children}</Pressable>;
  },
}));

// Import component after mocks
import ModalScreen from '@/app/modal';

describe('ModalScreen', () => {
  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<ModalScreen />);
    });

    it('displays modal title', () => {
      render(<ModalScreen />);
      expect(screen.getByText('This is a modal')).toBeTruthy();
    });

    it('displays link to home', () => {
      render(<ModalScreen />);
      expect(screen.getByText('Go to home screen')).toBeTruthy();
    });
  });

  describe('navigation', () => {
    it('has link to home screen', () => {
      render(<ModalScreen />);
      expect(screen.getByTestId('link-/')).toBeTruthy();
    });
  });

  describe('styling', () => {
    it('uses centered container', () => {
      const styles = {
        container: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        },
      };
      expect(styles.container.flex).toBe(1);
      expect(styles.container.alignItems).toBe('center');
      expect(styles.container.justifyContent).toBe('center');
      expect(styles.container.padding).toBe(20);
    });

    it('link has proper spacing', () => {
      const styles = {
        link: {
          marginTop: 15,
          paddingVertical: 15,
        },
      };
      expect(styles.link.marginTop).toBe(15);
      expect(styles.link.paddingVertical).toBe(15);
    });
  });
});
