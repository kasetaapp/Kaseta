import { renderHook } from '@testing-library/react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

// Mock useColorScheme hook
const mockUseColorScheme = jest.fn();

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => mockUseColorScheme(),
}));

// Mock the Colors constant
jest.mock('@/constants/theme', () => ({
  Colors: {
    light: {
      text: '#11181C',
      background: '#fff',
      tint: '#0a7ea4',
      icon: '#687076',
    },
    dark: {
      text: '#ECEDEE',
      background: '#151718',
      tint: '#fff',
      icon: '#9BA1A6',
    },
  },
}));

describe('useThemeColor Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns light theme color when color scheme is light', () => {
    mockUseColorScheme.mockReturnValue('light');

    const { result } = renderHook(() =>
      useThemeColor({}, 'text')
    );

    expect(result.current).toBe('#11181C');
  });

  it('returns dark theme color when color scheme is dark', () => {
    mockUseColorScheme.mockReturnValue('dark');

    const { result } = renderHook(() =>
      useThemeColor({}, 'text')
    );

    expect(result.current).toBe('#ECEDEE');
  });

  it('returns light theme color when color scheme is null', () => {
    mockUseColorScheme.mockReturnValue(null);

    const { result } = renderHook(() =>
      useThemeColor({}, 'background')
    );

    expect(result.current).toBe('#fff');
  });

  it('returns custom light color when provided', () => {
    mockUseColorScheme.mockReturnValue('light');

    const { result } = renderHook(() =>
      useThemeColor({ light: '#custom-light' }, 'text')
    );

    expect(result.current).toBe('#custom-light');
  });

  it('returns custom dark color when provided', () => {
    mockUseColorScheme.mockReturnValue('dark');

    const { result } = renderHook(() =>
      useThemeColor({ dark: '#custom-dark' }, 'text')
    );

    expect(result.current).toBe('#custom-dark');
  });

  it('returns default color when custom color is not provided', () => {
    mockUseColorScheme.mockReturnValue('light');

    const { result } = renderHook(() =>
      useThemeColor({ dark: '#only-dark' }, 'icon')
    );

    // Since we're in light mode and only dark is provided, it should return the default light icon color
    expect(result.current).toBe('#687076');
  });

  it('returns different background colors for different themes', () => {
    mockUseColorScheme.mockReturnValue('light');
    const { result: lightResult } = renderHook(() =>
      useThemeColor({}, 'background')
    );
    expect(lightResult.current).toBe('#fff');

    mockUseColorScheme.mockReturnValue('dark');
    const { result: darkResult } = renderHook(() =>
      useThemeColor({}, 'background')
    );
    expect(darkResult.current).toBe('#151718');
  });
});
