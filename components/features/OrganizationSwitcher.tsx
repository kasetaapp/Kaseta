/**
 * KASETA - Organization Switcher
 * Premium organization selection component with BottomSheet
 */

import React, { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Shadows, DarkShadows } from '@/constants/Shadows';
import { Text, Avatar, Badge } from '@/components/ui';
import { BottomSheet, BottomSheetRef } from '@/components/ui/BottomSheet';
import { useOrganization, Membership, OrganizationType } from '@/contexts/OrganizationContext';

export interface OrganizationSwitcherRef {
  open: () => void;
  close: () => void;
}

const getOrganizationTypeLabel = (type: OrganizationType): string => {
  const labels: Record<OrganizationType, string> = {
    residential: 'Residencial',
    corporate: 'Corporativo',
    educational: 'Educativo',
    industrial: 'Industrial',
    healthcare: 'Salud',
    events: 'Eventos',
  };
  return labels[type] || type;
};

const getOrganizationTypeEmoji = (type: OrganizationType): string => {
  const emojis: Record<OrganizationType, string> = {
    residential: '🏠',
    corporate: '🏢',
    educational: '🎓',
    industrial: '🏭',
    healthcare: '🏥',
    events: '🎪',
  };
  return emojis[type] || '🏢';
};

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    resident: 'Residente',
    admin: 'Administrador',
    guard: 'Guardia',
    super_admin: 'Super Admin',
  };
  return labels[role] || role;
};

interface OrganizationItemProps {
  membership: Membership;
  isActive: boolean;
  onPress: () => void;
  index: number;
}

function OrganizationItem({
  membership,
  isActive,
  onPress,
  index,
}: OrganizationItemProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;
  const shadows = isDark ? DarkShadows : Shadows;

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const org = membership.organization;
  if (!org) return null;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      style={animatedStyle}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.orgItem,
          {
            backgroundColor: isActive ? colors.accent + '15' : colors.surface,
            borderColor: isActive ? colors.accent : colors.border,
          },
          isActive && shadows.sm,
        ]}
      >
        <View style={styles.orgItemContent}>
          <Avatar
            name={org.name}
            source={org.logo_url}
            size="md"
          />
          <View style={styles.orgInfo}>
            <View style={styles.orgNameRow}>
              <Text variant="bodyMedium" numberOfLines={1}>
                {org.name}
              </Text>
              {isActive && (
                <Badge variant="accent" size="sm">
                  Actual
                </Badge>
              )}
            </View>
            <View style={styles.orgMeta}>
              <Text variant="caption" color="muted">
                {getOrganizationTypeEmoji(org.type)}{' '}
                {getOrganizationTypeLabel(org.type)}
              </Text>
              <Text variant="caption" color="muted">
                •
              </Text>
              <Text variant="caption" color="secondary">
                {getRoleLabel(membership.role)}
              </Text>
            </View>
            {membership.unit && (
              <Text variant="caption" color="muted">
                {membership.unit.name}
                {membership.unit.identifier && ` (${membership.unit.identifier})`}
              </Text>
            )}
          </View>
        </View>

        {isActive && (
          <View style={[styles.checkmark, { backgroundColor: colors.accent }]}>
            <Text variant="caption" customColor={colors.textOnAccent}>
              ✓
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export const OrganizationSwitcher = forwardRef<OrganizationSwitcherRef>(
  function OrganizationSwitcher(_, ref) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = isDark ? DarkColors : Colors;

    const bottomSheetRef = useRef<BottomSheetRef>(null);

    const {
      memberships,
      currentMembership,
      switchOrganization,
    } = useOrganization();

    const open = useCallback(() => {
      bottomSheetRef.current?.open();
    }, []);

    const close = useCallback(() => {
      bottomSheetRef.current?.close();
    }, []);

    useImperativeHandle(ref, () => ({
      open,
      close,
    }));

    const handleSelectOrganization = useCallback(
      async (membershipId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await switchOrganization(membershipId);
        close();
      },
      [switchOrganization, close]
    );

    return (
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={[0.6, 0.9]}
        showHandle
      >
        <View style={styles.container}>
          <Text variant="h3" style={styles.title}>
            Organizaciones
          </Text>

          {memberships.length === 0 ? (
            <View style={styles.emptyState}>
              <Text variant="displayLg" center style={styles.emptyIcon}>
                🏢
              </Text>
              <Text variant="body" color="secondary" center>
                No perteneces a ninguna organización
              </Text>
              <Text variant="bodySm" color="muted" center style={styles.emptyHint}>
                Pide a un administrador que te agregue
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {memberships.map((membership, index) => (
                <OrganizationItem
                  key={membership.id}
                  membership={membership}
                  isActive={currentMembership?.id === membership.id}
                  onPress={() => handleSelectOrganization(membership.id)}
                  index={index}
                />
              ))}
            </View>
          )}

          <Pressable
            style={[styles.joinButton, { borderColor: colors.border }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              close();
              router.push('/(app)/organization/join');
            }}
          >
            <Text variant="body" color="secondary" center>
              + Unirse a una organización
            </Text>
          </Pressable>
        </View>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.md,
  },
  title: {
    marginBottom: Spacing.lg,
  },
  list: {
    gap: Spacing.sm,
  },
  orgItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  orgItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orgInfo: {
    flex: 1,
    marginLeft: Spacing.smd,
  },
  orgNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  orgMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xxs,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIcon: {
    marginBottom: Spacing.md,
  },
  emptyHint: {
    marginTop: Spacing.sm,
  },
  joinButton: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});

export default OrganizationSwitcher;
