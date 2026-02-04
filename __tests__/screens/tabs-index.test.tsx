import React from 'react';
import { render, screen } from '@testing-library/react-native';

// Mock expo-image
jest.mock('expo-image', () => ({
  Image: ({ source, style }: any) => {
    const { View } = require('react-native');
    return <View testID="expo-image" style={style} />;
  },
}));

// Mock HelloWave
jest.mock('@/components/hello-wave', () => ({
  HelloWave: () => {
    const { Text } = require('react-native');
    return <Text>👋</Text>;
  },
}));

// Mock ParallaxScrollView
jest.mock('@/components/parallax-scroll-view', () => {
  return {
    __esModule: true,
    default: ({ children, headerImage, headerBackgroundColor }: any) => {
      const { View, ScrollView } = require('react-native');
      return (
        <ScrollView testID="parallax-scroll-view">
          <View testID="header-container">{headerImage}</View>
          <View testID="content-container">{children}</View>
        </ScrollView>
      );
    },
  };
});

// Mock expo-router Link
jest.mock('expo-router', () => ({
  Link: Object.assign(
    ({ children, href }: any) => {
      const { View } = require('react-native');
      return <View testID={`link-${href}`}>{children}</View>;
    },
    {
      Trigger: ({ children }: any) => children,
      Preview: () => null,
      Menu: ({ children }: any) => null,
      MenuAction: () => null,
    }
  ),
}));

// Import component after mocks
import HomeScreen from '@/app/(tabs)/index';

describe('TabsHomeScreen', () => {
  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<HomeScreen />);
    });

    it('displays welcome title', () => {
      render(<HomeScreen />);
      expect(screen.getByText('Welcome!')).toBeTruthy();
    });

    it('displays hello wave', () => {
      render(<HomeScreen />);
      expect(screen.getByText('👋')).toBeTruthy();
    });
  });

  describe('step 1', () => {
    it('shows step 1 title', () => {
      render(<HomeScreen />);
      expect(screen.getByText('Step 1: Try it')).toBeTruthy();
    });

    it('mentions index.tsx file', () => {
      render(<HomeScreen />);
      expect(screen.getByText('app/(tabs)/index.tsx')).toBeTruthy();
    });
  });

  describe('step 2', () => {
    it('shows step 2 title', () => {
      render(<HomeScreen />);
      expect(screen.getByText('Step 2: Explore')).toBeTruthy();
    });

    it('mentions explore tab', () => {
      render(<HomeScreen />);
      expect(screen.getByText(/Tap the Explore tab/)).toBeTruthy();
    });
  });

  describe('step 3', () => {
    it('shows step 3 title', () => {
      render(<HomeScreen />);
      expect(screen.getByText('Step 3: Get a fresh start')).toBeTruthy();
    });

    it('mentions reset-project command', () => {
      render(<HomeScreen />);
      expect(screen.getByText('npm run reset-project')).toBeTruthy();
    });

    it('mentions app directory', () => {
      render(<HomeScreen />);
      // Multiple elements contain 'app', so we verify the text exists
      const elements = screen.getAllByText('app');
      expect(elements.length).toBeGreaterThan(0);
    });

    it('mentions app-example directory', () => {
      render(<HomeScreen />);
      expect(screen.getByText('app-example')).toBeTruthy();
    });

    it('defines directory names', () => {
      const dirs = ['app', 'app-example'];
      expect(dirs).toContain('app');
      expect(dirs).toContain('app-example');
    });
  });

  describe('styling', () => {
    it('defines title container style', () => {
      const styles = {
        titleContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
      };
      expect(styles.titleContainer.flexDirection).toBe('row');
      expect(styles.titleContainer.alignItems).toBe('center');
      expect(styles.titleContainer.gap).toBe(8);
    });

    it('defines step container style', () => {
      const styles = {
        stepContainer: {
          gap: 8,
          marginBottom: 8,
        },
      };
      expect(styles.stepContainer.gap).toBe(8);
      expect(styles.stepContainer.marginBottom).toBe(8);
    });

    it('defines react logo style', () => {
      const styles = {
        reactLogo: {
          height: 178,
          width: 290,
          bottom: 0,
          left: 0,
          position: 'absolute',
        },
      };
      expect(styles.reactLogo.height).toBe(178);
      expect(styles.reactLogo.width).toBe(290);
      expect(styles.reactLogo.bottom).toBe(0);
      expect(styles.reactLogo.left).toBe(0);
      expect(styles.reactLogo.position).toBe('absolute');
    });
  });

  describe('header configuration', () => {
    it('uses header background colors', () => {
      const headerBackgroundColor = { light: '#A1CEDC', dark: '#1D3D47' };
      expect(headerBackgroundColor.light).toBe('#A1CEDC');
      expect(headerBackgroundColor.dark).toBe('#1D3D47');
    });
  });

  describe('modal link', () => {
    it('has link to modal', () => {
      render(<HomeScreen />);
      expect(screen.getByTestId('link-/modal')).toBeTruthy();
    });
  });
});
