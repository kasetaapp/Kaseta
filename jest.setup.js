// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({})),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  Link: 'Link',
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;

  // Create a chainable mock for entering animations
  const createEnteringAnimation = () => {
    const animation = {
      delay: jest.fn(() => animation),
      springify: jest.fn(() => animation),
      duration: jest.fn(() => animation),
      damping: jest.fn(() => animation),
      mass: jest.fn(() => animation),
      stiffness: jest.fn(() => animation),
      overshootClamping: jest.fn(() => animation),
      restDisplacementThreshold: jest.fn(() => animation),
      restSpeedThreshold: jest.fn(() => animation),
      withInitialValues: jest.fn(() => animation),
      withCallback: jest.fn(() => animation),
      build: jest.fn(() => ({})),
    };
    return animation;
  };

  return {
    default: {
      createAnimatedComponent: (component) => component,
      addWhitelistedNativeProps: () => {},
      addWhitelistedUIProps: () => {},
    },
    useSharedValue: jest.fn((init) => ({ value: init })),
    useAnimatedStyle: jest.fn(() => ({})),
    useDerivedValue: jest.fn((fn) => ({ value: fn() })),
    useAnimatedProps: jest.fn(() => ({})),
    withTiming: jest.fn((value) => value),
    withSpring: jest.fn((value) => value),
    withDelay: jest.fn((_, value) => value),
    withSequence: jest.fn((...args) => args[args.length - 1]),
    withRepeat: jest.fn((value) => value),
    Easing: {
      linear: jest.fn((v) => v),
      ease: jest.fn((v) => v),
      bezier: jest.fn(() => jest.fn((v) => v)),
      out: jest.fn(() => jest.fn((v) => v)),
      in: jest.fn(() => jest.fn((v) => v)),
      inOut: jest.fn(() => jest.fn((v) => v)),
      cubic: jest.fn((v) => v),
      quad: jest.fn((v) => v),
      circle: jest.fn((v) => v),
      exp: jest.fn((v) => v),
      elastic: jest.fn(() => jest.fn((v) => v)),
      back: jest.fn(() => jest.fn((v) => v)),
      bounce: jest.fn((v) => v),
    },
    Extrapolate: {
      CLAMP: 'clamp',
    },
    interpolate: jest.fn((value) => value),
    runOnJS: jest.fn((fn) => fn),
    runOnUI: jest.fn((fn) => fn),
    createAnimatedComponent: (component) => component,
    View,
    Text: require('react-native').Text,
    Image: require('react-native').Image,
    ScrollView: require('react-native').ScrollView,
    FlatList: require('react-native').FlatList,
    // Entering animations
    FadeInDown: createEnteringAnimation(),
    FadeInUp: createEnteringAnimation(),
    FadeIn: createEnteringAnimation(),
    FadeOut: createEnteringAnimation(),
    SlideInRight: createEnteringAnimation(),
    SlideInLeft: createEnteringAnimation(),
    SlideOutRight: createEnteringAnimation(),
    SlideOutLeft: createEnteringAnimation(),
    ZoomIn: createEnteringAnimation(),
    ZoomOut: createEnteringAnimation(),
  };
});

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
  },
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return new Proxy({}, {
    get: () => (props) => React.createElement(View, { testID: 'icon', ...props }),
  });
});

// Mock expo
jest.mock('expo', () => ({}));

// Silence console warnings during tests
const originalConsole = { ...console };
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
