/**
 * KASETA - Entry Point
 * Redirects to auth or app based on authentication state
 */

import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui';

export default function Index() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { isLoading, isAuthenticated, isConfigured } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      router.replace('/(app)/(tabs)/home');
    } else {
      router.replace('/(auth)/login');
    }
  }, [isLoading, isAuthenticated]);

  // Show loading state with skeleton (Tier S: never spinners alone)
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.loadingContent}>
        {/* Logo placeholder */}
        <Skeleton width={80} height={80} variant="circular" />
        <View style={styles.loadingText}>
          <Skeleton width={120} height={24} style={styles.skeletonLine} />
          <Skeleton width={80} height={16} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 24,
    alignItems: 'center',
  },
  skeletonLine: {
    marginBottom: 8,
  },
});
