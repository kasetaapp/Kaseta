/**
 * KASETA - Admin Stack Layout
 */

import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';

export default function AdminLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="users" />
      <Stack.Screen name="units" />
      <Stack.Screen name="members" />
      <Stack.Screen name="access-logs" />
      <Stack.Screen name="invitations" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="roles" />
    </Stack>
  );
}
