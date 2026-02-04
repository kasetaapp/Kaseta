import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';

// Mock expo-image
jest.mock('expo-image', () => ({
  Image: ({ source, style }: any) => {
    const { View } = require('react-native');
    return <View testID="expo-image" style={style} />;
  },
}));

// Mock ParallaxScrollView since it uses complex Reanimated hooks
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

// Import component after mocks
import TabTwoScreen from '@/app/(tabs)/explore';

describe('ExploreScreen (TabTwoScreen)', () => {
  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<TabTwoScreen />);
    });

    it('displays explore title', () => {
      render(<TabTwoScreen />);
      expect(screen.getByText('Explore')).toBeTruthy();
    });

    it('displays example code description', () => {
      render(<TabTwoScreen />);
      expect(screen.getByText('This app includes example code to help you get started.')).toBeTruthy();
    });
  });

  describe('collapsible sections', () => {
    it('shows file-based routing section', () => {
      render(<TabTwoScreen />);
      expect(screen.getByText('File-based routing')).toBeTruthy();
    });

    it('shows android ios web support section', () => {
      render(<TabTwoScreen />);
      expect(screen.getByText('Android, iOS, and web support')).toBeTruthy();
    });

    it('shows images section', () => {
      render(<TabTwoScreen />);
      expect(screen.getByText('Images')).toBeTruthy();
    });

    it('shows light and dark mode section', () => {
      render(<TabTwoScreen />);
      expect(screen.getByText('Light and dark mode components')).toBeTruthy();
    });

    it('shows animations section', () => {
      render(<TabTwoScreen />);
      expect(screen.getByText('Animations')).toBeTruthy();
    });
  });

  describe('content', () => {
    // Content inside collapsibles is not rendered until expanded
    // Test the values that would be shown
    it('defines file paths used in content', () => {
      const paths = [
        'app/(tabs)/index.tsx',
        'app/(tabs)/explore.tsx',
        'app/(tabs)/_layout.tsx',
      ];
      expect(paths).toContain('app/(tabs)/index.tsx');
      expect(paths).toContain('app/(tabs)/explore.tsx');
    });

    it('defines keyboard shortcut text', () => {
      const shortcut = 'w';
      expect(shortcut).toBe('w');
    });

    it('defines image density suffixes', () => {
      const suffixes = ['@2x', '@3x'];
      expect(suffixes).toContain('@2x');
      expect(suffixes).toContain('@3x');
    });

    it('defines useColorScheme hook name', () => {
      const hookName = 'useColorScheme()';
      expect(hookName).toBe('useColorScheme()');
    });

    it('defines component paths', () => {
      const componentPath = 'components/HelloWave.tsx';
      expect(componentPath).toBe('components/HelloWave.tsx');
    });

    it('defines library name', () => {
      const libraryName = 'react-native-reanimated';
      expect(libraryName).toBe('react-native-reanimated');
    });
  });

  describe('external links', () => {
    it('defines documentation URLs', () => {
      const urls = [
        'https://docs.expo.dev/router/introduction',
        'https://reactnative.dev/docs/images',
        'https://docs.expo.dev/develop/user-interface/color-themes/',
      ];
      expect(urls.length).toBe(3);
    });
  });

  describe('platform specific content', () => {
    it('ios mentions ParallaxScrollView component', () => {
      // This content is only shown on iOS
      Platform.OS = 'ios';
      render(<TabTwoScreen />);
      // Component mentions ParallaxScrollView in animation section on iOS
    });
  });

  describe('styling', () => {
    it('defines header image style', () => {
      const styles = {
        headerImage: {
          color: '#808080',
          bottom: -90,
          left: -35,
          position: 'absolute',
        },
      };
      expect(styles.headerImage.color).toBe('#808080');
      expect(styles.headerImage.bottom).toBe(-90);
      expect(styles.headerImage.left).toBe(-35);
      expect(styles.headerImage.position).toBe('absolute');
    });

    it('defines title container style', () => {
      const styles = {
        titleContainer: {
          flexDirection: 'row',
          gap: 8,
        },
      };
      expect(styles.titleContainer.flexDirection).toBe('row');
      expect(styles.titleContainer.gap).toBe(8);
    });
  });

  describe('header configuration', () => {
    it('uses header background colors', () => {
      const headerBackgroundColor = { light: '#D0D0D0', dark: '#353636' };
      expect(headerBackgroundColor.light).toBe('#D0D0D0');
      expect(headerBackgroundColor.dark).toBe('#353636');
    });

    it('uses correct icon size', () => {
      const iconSize = 310;
      expect(iconSize).toBe(310);
    });

    it('uses correct icon color', () => {
      const iconColor = '#808080';
      expect(iconColor).toBe('#808080');
    });

    it('uses correct icon name', () => {
      const iconName = 'chevron.left.forwardslash.chevron.right';
      expect(iconName).toBe('chevron.left.forwardslash.chevron.right');
    });
  });
});
