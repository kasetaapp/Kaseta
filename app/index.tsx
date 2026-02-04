/**
 * KASETA - Entry Point
 * Redirects to auth or app based on authentication state
 */

import { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
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

  // Show loading state with branding (Tier S: never spinners alone)
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.loadingContent}>
        {/* Logo with KASETA branding */}
        <View style={[styles.logoContainer, { backgroundColor: colors.accent }]}>
          <Text style={styles.logoText}>K</Text>
        </View>
        <Text style={[styles.brandName, { color: colors.text }]}>KASETA</Text>
        <View style={styles.loadingIndicator}>
          <Skeleton width={120} height={4} variant="rounded" />
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
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#18181B',
  },
  brandName: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 16,
  },
  loadingIndicator: {
    marginTop: 24,
  },
});
