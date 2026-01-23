/**
 * KASETA - Invitation Card Component
 * Premium invitation card with status, QR preview, and actions
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Clock, User, Phone, Calendar, ChevronRight } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Shadows, DarkShadows } from '@/constants/Shadows';
import { Text, Badge, Avatar } from '@/components/ui';
import { Invitation, InvitationStatus, AccessType } from '@/lib/invitations';

export interface InvitationCardProps {
  invitation: Invitation;
  onPress?: (invitation: Invitation) => void;
  index?: number;
}

const getStatusConfig = (status: InvitationStatus) => {
  const configs: Record<InvitationStatus, { label: string; variant: 'default' | 'success' | 'error' | 'warning' | 'accent' }> = {
    active: { label: 'Activa', variant: 'success' },
    used: { label: 'Usada', variant: 'default' },
    expired: { label: 'Expirada', variant: 'error' },
    cancelled: { label: 'Cancelada', variant: 'warning' },
  };
  return configs[status];
};

const getAccessTypeLabel = (type: AccessType): string => {
  const labels: Record<AccessType, string> = {
    single: 'Uso único',
    multiple: 'Múltiples usos',
    permanent: 'Permanente',
    temporary: 'Temporal',
  };
  return labels[type];
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();

  if (isToday) {
    return `Hoy, ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (isTomorrow) {
    return `Mañana, ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function InvitationCard({
  invitation,
  onPress,
  index = 0,
}: InvitationCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;
  const shadows = isDark ? DarkShadows : Shadows;

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1);
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(invitation);
  }, [invitation, onPress]);

  const statusConfig = getStatusConfig(invitation.status);
  const isActive = invitation.status === 'active';

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      style={animatedStyle}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          {
            backgroundColor: colors.background,
            borderColor: isActive ? colors.accent + '30' : colors.border,
          },
          shadows.sm,
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Avatar
              name={invitation.visitor_name}
              size="md"
            />
            <View style={styles.headerInfo}>
              <Text variant="bodyMedium" numberOfLines={1}>
                {invitation.visitor_name}
              </Text>
              <Text variant="caption" color="muted">
                {getAccessTypeLabel(invitation.access_type)}
              </Text>
            </View>
          </View>
          <Badge
            variant={statusConfig.variant}
            size="sm"
          >
            {statusConfig.label}
          </Badge>
        </View>

        {/* Details */}
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Calendar size={14} color={colors.textMuted} />
            <Text variant="bodySm" color="secondary">
              {formatDate(invitation.valid_from)}
              {invitation.valid_until && ` - ${formatDate(invitation.valid_until)}`}
            </Text>
          </View>

          {invitation.visitor_phone && (
            <View style={styles.detailRow}>
              <Phone size={14} color={colors.textMuted} />
              <Text variant="bodySm" color="secondary">
                {invitation.visitor_phone}
              </Text>
            </View>
          )}

          {invitation.access_type === 'multiple' && (
            <View style={styles.detailRow}>
              <User size={14} color={colors.textMuted} />
              <Text variant="bodySm" color="secondary">
                {invitation.current_uses} / {invitation.max_uses} usos
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={[styles.shortCode, { backgroundColor: colors.surface }]}>
            <Text variant="mono" color="muted">
              {invitation.short_code}
            </Text>
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function InvitationCardSkeleton() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  return (
    <View
      style={[
        styles.card,
        styles.skeleton,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.skeletonAvatar,
              { backgroundColor: colors.surfaceHover },
            ]}
          />
          <View style={styles.headerInfo}>
            <View
              style={[
                styles.skeletonText,
                { width: 120, backgroundColor: colors.surfaceHover },
              ]}
            />
            <View
              style={[
                styles.skeletonText,
                styles.skeletonSmall,
                { width: 80, backgroundColor: colors.surfaceHover },
              ]}
            />
          </View>
        </View>
      </View>
      <View style={styles.details}>
        <View
          style={[
            styles.skeletonText,
            { width: 180, backgroundColor: colors.surfaceHover },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  skeleton: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.smd,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerInfo: {
    marginLeft: Spacing.smd,
    flex: 1,
  },
  details: {
    gap: Spacing.xs,
    marginBottom: Spacing.smd,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.smd,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  shortCode: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  skeletonText: {
    height: 16,
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonSmall: {
    height: 12,
  },
});

export default InvitationCard;
