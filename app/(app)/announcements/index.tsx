/**
 * KASETA - Announcements Screen
 * View community announcements
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
import { ChevronLeft, Plus, Bell, AlertTriangle, Info, Megaphone } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Badge, Skeleton, EmptyState } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'urgent' | 'general';
  created_at: string;
  expires_at: string | null;
  author?: {
    full_name: string;
  };
}

const TYPE_CONFIG = {
  info: { icon: Info, color: '#3B82F6', label: 'Información', bg: '#EFF6FF' },
  warning: { icon: AlertTriangle, color: '#F59E0B', label: 'Aviso', bg: '#FFFBEB' },
  urgent: { icon: Bell, color: '#EF4444', label: 'Urgente', bg: '#FEF2F2' },
  general: { icon: Megaphone, color: '#6366F1', label: 'General', bg: '#EEF2FF' },
};

export default function AnnouncementsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentOrganization, isAdmin } = useOrganization();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    if (!currentOrganization) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          id,
          title,
          content,
          type,
          created_at,
          expires_at,
          author:profiles!announcements_created_by_fkey(full_name)
        `)
        .eq('organization_id', currentOrganization.id)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformed = (data || []).map((a: any) => ({
        ...a,
        author: Array.isArray(a.author) ? a.author[0] : a.author,
      }));

      setAnnouncements(transformed);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchAnnouncements();
    setRefreshing(false);
  }, [fetchAnnouncements]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleCreate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(app)/announcements/create');
  };

  const handlePress = (announcement: Announcement) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/(app)/announcements/[id]',
      params: { id: announcement.id },
    });
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  const renderAnnouncement = ({ item, index }: { item: Announcement; index: number }) => {
    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.general;
    const Icon = config.icon;

    return (
      <Animated.View entering={FadeIn.delay(index * 50)}>
        <Card
          variant="outlined"
          style={[styles.announcementCard, { borderLeftColor: config.color, borderLeftWidth: 4 }]}
          padding="md"
          pressable
          onPress={() => handlePress(item)}
        >
          <View style={styles.announcementHeader}>
            <View style={[styles.typeIcon, { backgroundColor: isDark ? colors.surface : config.bg }]}>
              <Icon size={18} color={config.color} />
            </View>
            <View style={styles.announcementMeta}>
              <Badge
                variant={item.type === 'urgent' ? 'error' : 'default'}
                size="sm"
              >
                {config.label}
              </Badge>
              <Text variant="caption" color="muted">
                {formatDate(item.created_at)}
              </Text>
            </View>
          </View>

          <Text variant="bodyMedium" style={styles.announcementTitle}>
            {item.title}
          </Text>
          <Text variant="bodySm" color="secondary" numberOfLines={2}>
            {item.content}
          </Text>

          {item.author?.full_name && (
            <Text variant="caption" color="muted" style={styles.author}>
              Por: {item.author.full_name}
            </Text>
          )}
        </Card>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Anuncios</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.content}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={140} style={{ marginBottom: Spacing.md }} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.delay(100).springify()}
        style={styles.header}
      >
        <Pressable onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text variant="h2">Anuncios</Text>
        {isAdmin && (
          <Pressable onPress={handleCreate} style={styles.addButton}>
            <Plus size={24} color={colors.accent} />
          </Pressable>
        )}
        {!isAdmin && <View style={{ width: 40 }} />}
      </Animated.View>

      {/* List */}
      {announcements.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="📢"
            title="Sin anuncios"
            description="Los comunicados de la administración aparecerán aquí"
          />
        </View>
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(item) => item.id}
          renderItem={renderAnnouncement}
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  addButton: {
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  announcementCard: {
    marginBottom: Spacing.md,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  announcementMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: Spacing.sm,
  },
  announcementTitle: {
    marginBottom: Spacing.xs,
  },
  author: {
    marginTop: Spacing.sm,
  },
});
