/**
 * KASETA - Root Layout
 * App-wide providers and navigation setup
 */

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { AuthProvider } from '@/contexts/AuthContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { ErrorBoundary } from '@/components/ui';

// Custom themes that match our design system
const KasetaLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.accent,
    background: Colors.background,
    card: Colors.background,
    text: Colors.text,
    border: Colors.border,
    notification: Colors.accent,
  },
};

const KasetaDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: DarkColors.accent,
    background: DarkColors.background,
    card: DarkColors.background,
    text: DarkColors.text,
    border: DarkColors.border,
    notification: DarkColors.accent,
  },
};

export const unstable_settings = {
  // Ensure the auth screens can be accessed
  initialRouteName: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <GestureHandlerRootView style={styles.container}>
      <ErrorBoundary>
        <AuthProvider>
          <OrganizationProvider>
            <ThemeProvider value={isDark ? KasetaDarkTheme : KasetaLightTheme}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(app)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="modal"
                  options={{
                    presentation: 'modal',
                    title: 'Modal',
                  }}
                />
              </Stack>
              <StatusBar style={isDark ? 'light' : 'dark'} />
            </ThemeProvider>
          </OrganizationProvider>
        </AuthProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
