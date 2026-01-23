/**
 * KASETA - Announcement Detail Screen
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Bell, AlertTriangle, Info, Megaphone, Calendar, User } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Badge, Skeleton, Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';

interface AnnouncementDetail {
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
  info: { icon: Info, color: '#3B82F6', label: 'Información' },
  warning: { icon: AlertTriangle, color: '#F59E0B', label: 'Aviso' },
  urgent: { icon: Bell, color: '#EF4444', label: 'Urgente' },
  general: { icon: Megaphone, color: '#6366F1', label: 'General' },
};

export default function AnnouncementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const [announcement, setAnnouncement] = useState<AnnouncementDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnnouncement = useCallback(async () => {
    if (!id) return;

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
        .eq('id', id)
        .single();

      if (error) throw error;

      setAnnouncement({
        ...data,
        author: Array.isArray(data.author) ? data.author[0] : data.author,
      });
    } catch (error) {
      console.error('Error fetching announcement:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAnnouncement();
  }, [fetchAnnouncement]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Skeleton width={150} height={24} />
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.content}>
          <Skeleton width="100%" height={200} />
        </View>
      </SafeAreaView>
    );
  }

  if (!announcement) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Anuncio</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text variant="h1" center>😕</Text>
          <Text variant="h3" center style={{ marginTop: Spacing.md }}>
            Anuncio no encontrado
          </Text>
          <Button onPress={handleBack} style={{ marginTop: Spacing.xl }}>
            Volver
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const config = TYPE_CONFIG[announcement.type] || TYPE_CONFIG.general;
  const Icon = config.icon;

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
        <Text variant="h2">Anuncio</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Type Badge */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.typeContainer}>
          <View style={[styles.typeIcon, { backgroundColor: config.color + '20' }]}>
            <Icon size={24} color={config.color} />
          </View>
          <Badge
            variant={announcement.type === 'urgent' ? 'error' : 'default'}
            size="md"
          >
            {config.label}
          </Badge>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text variant="h1" style={styles.title}>
            {announcement.title}
          </Text>
        </Animated.View>

        {/* Meta info */}
        <Animated.View entering={FadeInDown.delay(250).springify()} style={styles.metaContainer}>
          <View style={styles.metaRow}>
            <Calendar size={16} color={colors.textMuted} />
            <Text variant="bodySm" color="muted">
              {formatDate(announcement.created_at)}
            </Text>
          </View>
          {announcement.author?.full_name && (
            <View style={styles.metaRow}>
              <User size={16} color={colors.textMuted} />
              <Text variant="bodySm" color="muted">
                {announcement.author.full_name}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Content */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Card variant="filled" padding="lg">
            <Text variant="body" style={styles.contentText}>
              {announcement.content}
            </Text>
          </Card>
        </Animated.View>

        {announcement.expires_at && (
          <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.expiresContainer}>
            <Text variant="caption" color="muted">
              Este anuncio expira: {formatDate(announcement.expires_at)}
            </Text>
          </Animated.View>
        )}
      </ScrollView>
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
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginBottom: Spacing.md,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  contentText: {
    lineHeight: 24,
  },
  expiresContainer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
});
