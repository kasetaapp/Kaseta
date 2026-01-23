/**
 * KASETA - Notifications Inbox Screen
 * View all notifications and mark as read
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  Bell,
  Package,
  User,
  Megaphone,
  Wrench,
  Calendar,
  CheckCheck,
  Trash2,
} from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Skeleton, EmptyState, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any>;
  read_at: string | null;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
  visitor_arrival: { icon: User, color: '#3B82F6' },
  package_received: { icon: Package, color: '#F59E0B' },
  announcement: { icon: Megaphone, color: '#8B5CF6' },
  maintenance_update: { icon: Wrench, color: '#10B981' },
  reservation_reminder: { icon: Calendar, color: '#EC4899' },
  system: { icon: Bell, color: '#6B7280' },
};

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { user } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();

    // Real-time subscription
    if (!user?.id) return;

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, user]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.read_at) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notification.id);

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (unreadIds.length === 0) return;

    try {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds);

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notification: Notification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await supabase.from('notifications').delete().eq('id', notification.id);

      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    handleMarkAsRead(notification);

    // Navigate based on notification type
    const { type, data } = notification;

    switch (type) {
      case 'visitor_arrival':
        if (data?.access_log_id) {
          router.push('/(app)/visitor-history');
        }
        break;
      case 'package_received':
        if (data?.package_id) {
          router.push({
            pathname: '/(app)/packages/[id]',
            params: { id: data.package_id },
          });
        }
        break;
      case 'announcement':
        if (data?.announcement_id) {
          router.push({
            pathname: '/(app)/announcements/[id]',
            params: { id: data.announcement_id },
          });
        }
        break;
      case 'maintenance_update':
        if (data?.request_id) {
          router.push({
            pathname: '/(app)/maintenance/[id]',
            params: { id: data.request_id },
          });
        }
        break;
      case 'reservation_reminder':
        router.push('/(app)/amenities');
        break;
    }
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  const renderNotification = ({ item, index }: { item: Notification; index: number }) => {
    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.system;
    const IconComponent = config.icon;
    const isUnread = !item.read_at;

    return (
      <Animated.View entering={FadeIn.delay(index * 30)}>
        <Pressable onPress={() => handleNotificationPress(item)}>
          <Card
            variant={isUnread ? 'elevated' : 'filled'}
            style={[styles.notificationCard, isUnread && styles.unreadCard]}
            padding="md"
          >
            <View style={styles.cardContent}>
              <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
                <IconComponent size={20} color={config.color} />
              </View>

              <View style={styles.textContent}>
                <View style={styles.titleRow}>
                  <Text
                    variant={isUnread ? 'h4' : 'bodyMedium'}
                    numberOfLines={1}
                    style={styles.title}
                  >
                    {item.title}
                  </Text>
                  {isUnread && (
                    <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />
                  )}
                </View>
                <Text variant="bodySm" color="secondary" numberOfLines={2}>
                  {item.body}
                </Text>
                <Text variant="caption" color="muted" style={styles.time}>
                  {formatTime(item.created_at)}
                </Text>
              </View>

              <Pressable
                onPress={() => handleDelete(item)}
                hitSlop={8}
                style={styles.deleteButton}
              >
                <Trash2 size={16} color={colors.textMuted} />
              </Pressable>
            </View>
          </Card>
        </Pressable>
      </Animated.View>
    );
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Notificaciones</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.content}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width="100%" height={90} style={{ marginBottom: Spacing.sm }} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text variant="h2">Notificaciones</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      {/* Mark All as Read */}
      {unreadCount > 0 && (
        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.actionsBar}>
          <Text variant="bodySm" color="muted">
            {unreadCount} sin leer
          </Text>
          <Pressable onPress={handleMarkAllAsRead} style={styles.markAllButton}>
            <CheckCheck size={16} color={colors.accent} />
            <Text variant="bodySm" customColor={colors.accent}>
              Marcar todas como leídas
            </Text>
          </Pressable>
        </Animated.View>
      )}

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="🔔"
            title="Sin notificaciones"
            description="Tus notificaciones aparecerán aquí"
          />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: { padding: Spacing.xs },
  content: { flex: 1, paddingHorizontal: Spacing.lg },
  emptyContainer: { flex: 1, justifyContent: 'center', padding: Spacing.lg },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  notificationCard: { marginBottom: Spacing.sm },
  unreadCard: { borderLeftWidth: 3, borderLeftColor: '#3B82F6' },
  cardContent: { flexDirection: 'row', alignItems: 'flex-start' },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: { flex: 1, marginLeft: Spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  title: { flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  time: { marginTop: Spacing.xs },
  deleteButton: { padding: Spacing.xs },
});
