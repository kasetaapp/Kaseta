/**
 * KASETA - Roles Stack Layout
 */

import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';

export default function RolesLayout() {
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
      <Stack.Screen name="[id]" />
      <Stack.Screen name="create" />
    </Stack>
  );
}
