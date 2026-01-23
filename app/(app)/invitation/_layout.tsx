/**
 * KASETA - Invitation Routes Layout
 */

import { Stack } from 'expo-router';

export default function InvitationLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="create" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
