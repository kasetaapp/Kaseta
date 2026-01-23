/**
 * KASETA - Main Tab Navigator
 * Dynamic tabs based on user role and organization type
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Home, Mail, Scan, User, LayoutDashboard, Users, Shield } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Layout, Spacing } from '@/constants/Spacing';
import { Shadows } from '@/constants/Shadows';
import { useOrganization } from '@/contexts/OrganizationContext';

/**
 * Tab bar icon component with Lucide icons
 */
function TabIcon({
  name,
  color,
  focused,
}: {
  name: string;
  color: string;
  focused: boolean;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const iconProps = {
    size: 24,
    color: focused ? colors.primary : color,
    strokeWidth: focused ? 2.5 : 2,
  };

  const icons: Record<string, React.ReactNode> = {
    home: <Home {...iconProps} />,
    invitations: <Mail {...iconProps} />,
    scan: <Scan {...iconProps} />,
    profile: <User {...iconProps} />,
    dashboard: <LayoutDashboard {...iconProps} />,
    residents: <Users {...iconProps} />,
    access: <Shield {...iconProps} />,
  };

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.iconContainer,
        focused && styles.iconContainerFocused,
        animatedStyle,
      ]}
    >
      {icons[name] || <Home {...iconProps} />}
      {focused && (
        <View
          style={[
            styles.focusIndicator,
            { backgroundColor: colors.accent },
          ]}
        />
      )}
    </Animated.View>
  );
}

/**
 * Custom tab button with haptic feedback
 */
function HapticTabButton({
  children,
  onPress,
  accessibilityState,
  ...props
}: any) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Pressable
      {...props}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={styles.tabButton}
    >
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentRole, isGuard, isAdmin, isSuperAdmin } = useOrganization();

  // Determine which tabs to show based on role
  const showDashboard = isAdmin || isSuperAdmin;
  const showResidents = isAdmin || isSuperAdmin;
  const showScan = isGuard || isAdmin || isSuperAdmin;
  const showInvitations = !isGuard; // Everyone except guards

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarButton: HapticTabButton,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Layout.tabBarHeight + (Platform.OS === 'ios' ? 20 : 0),
          paddingBottom: Platform.OS === 'ios' ? 20 : Spacing.sm,
          paddingTop: Spacing.sm,
          ...Shadows.sm,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      {/* Home - always visible */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} />
          ),
        }}
      />

      {/* Invitations - visible for residents and admins */}
      <Tabs.Screen
        name="invitations"
        options={{
          title: 'Invitaciones',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="invitations" color={color} focused={focused} />
          ),
          href: showInvitations ? undefined : null,
        }}
      />

      {/* Scan - visible for guards and admins */}
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Escanear',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="scan" color={color} focused={focused} />
          ),
          href: showScan ? undefined : null,
        }}
      />

      {/* Profile - always visible */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="profile" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 32,
  },
  iconContainerFocused: {
    // Active state styles
  },
  focusIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
