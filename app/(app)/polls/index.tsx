/**
 * KASETA - Polls Screen
 * View community polls and surveys
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
import { ChevronLeft, Plus, BarChart2, Clock, CheckCircle, Users } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Badge, Skeleton, EmptyState } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase';

interface Poll {
  id: string;
  title: string;
  description: string | null;
  status: 'active' | 'closed';
  ends_at: string | null;
  created_at: string;
  total_votes: number;
}

export default function PollsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentOrganization, isAdmin } = useOrganization();

  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPolls = useCallback(async () => {
    if (!currentOrganization) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch polls with vote counts
      const { data: pollsData, error: pollsError } = await supabase
        .from('polls')
        .select(`
          id,
          title,
          description,
          status,
          ends_at,
          created_at
        `)
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (pollsError) throw pollsError;

      // Fetch vote counts for each poll
      const pollsWithVotes = await Promise.all(
        (pollsData || []).map(async (poll) => {
          const { count } = await supabase
            .from('poll_votes')
            .select('*', { count: 'exact', head: true })
            .eq('poll_id', poll.id);

          return {
            ...poll,
            total_votes: count || 0,
          };
        })
      );

      setPolls(pollsWithVotes);
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchPolls();
    setRefreshing(false);
  }, [fetchPolls]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleCreate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(app)/polls/create');
  };

  const handlePress = (poll: Poll) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/(app)/polls/[id]',
      params: { id: poll.id },
    });
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatEndDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Sin fecha limite';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / 86400000);

    if (diffDays < 0) return 'Finalizada';
    if (diffDays === 0) return 'Termina hoy';
    if (diffDays === 1) return 'Termina manana';
    if (diffDays < 7) return `Termina en ${diffDays} dias`;
    return `Termina el ${formatDate(dateStr)}`;
  };

  const isExpired = (poll: Poll): boolean => {
    if (!poll.ends_at) return false;
    return new Date(poll.ends_at) < new Date();
  };

  const activePolls = polls.filter((p) => p.status === 'active' && !isExpired(p));
  const closedPolls = polls.filter((p) => p.status === 'closed' || isExpired(p));

  const renderPoll = ({ item, index }: { item: Poll; index: number }) => {
    const isActive = item.status === 'active' && !isExpired(item);

    return (
      <Animated.View entering={FadeIn.delay(index * 50)}>
        <Card
          variant="outlined"
          style={styles.pollCard}
          padding="md"
          pressable
          onPress={() => handlePress(item)}
        >
          <View style={styles.pollHeader}>
            <View style={[styles.iconContainer, { backgroundColor: isActive ? colors.infoBg : colors.surface }]}>
              <BarChart2 size={20} color={isActive ? colors.info : colors.textMuted} />
            </View>
            <Badge
              variant={isActive ? 'info' : 'default'}
              size="sm"
            >
              {isActive ? 'Activa' : 'Cerrada'}
            </Badge>
          </View>

          <Text variant="bodyMedium" style={styles.pollTitle}>
            {item.title}
          </Text>

          {item.description && (
            <Text variant="bodySm" color="secondary" numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.pollMeta}>
            <View style={styles.metaItem}>
              <Users size={14} color={colors.textMuted} />
              <Text variant="caption" color="muted">
                {item.total_votes} {item.total_votes === 1 ? 'voto' : 'votos'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              {isActive ? (
                <Clock size={14} color={colors.textMuted} />
              ) : (
                <CheckCircle size={14} color={colors.textMuted} />
              )}
              <Text variant="caption" color="muted">
                {isActive ? formatEndDate(item.ends_at) : 'Cerrada'}
              </Text>
            </View>
          </View>
        </Card>
      </Animated.View>
    );
  };

  const renderSection = (title: string, data: Poll[], emptyMessage: string) => {
    if (data.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text variant="h4" style={styles.sectionTitle}>
          {title}
        </Text>
        {data.map((poll, index) => (
          <View key={poll.id}>
            {renderPoll({ item: poll, index })}
          </View>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Encuestas</Text>
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
        <Text variant="h2">Encuestas</Text>
        {isAdmin && (
          <Pressable onPress={handleCreate} style={styles.addButton}>
            <Plus size={24} color={colors.accent} />
          </Pressable>
        )}
        {!isAdmin && <View style={{ width: 40 }} />}
      </Animated.View>

      {/* List */}
      {polls.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="📊"
            title="Sin encuestas"
            description="Las encuestas de la comunidad apareceran aqui"
          />
        </View>
      ) : (
        <FlatList
          data={[]}
          keyExtractor={() => 'sections'}
          renderItem={null}
          ListHeaderComponent={
            <>
              {renderSection('Encuestas activas', activePolls, 'No hay encuestas activas')}
              {renderSection('Encuestas cerradas', closedPolls, 'No hay encuestas cerradas')}
            </>
          }
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
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  pollCard: {
    marginBottom: Spacing.md,
  },
  pollHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pollTitle: {
    marginBottom: Spacing.xs,
  },
  pollMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
});
