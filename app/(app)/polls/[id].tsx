/**
 * KASETA - Poll Detail Screen
 * View poll details and vote
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, BarChart2, Calendar, Users, Check, Clock } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Badge, Skeleton, Button } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  vote_count: number;
}

interface PollDetail {
  id: string;
  title: string;
  description: string | null;
  status: 'active' | 'closed';
  ends_at: string | null;
  created_at: string;
  options: PollOption[];
}

export default function PollDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  const [poll, setPoll] = useState<PollDetail | null>(null);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);

  const fetchPoll = useCallback(async () => {
    if (!id) return;

    try {
      // Fetch poll details
      const { data: pollData, error: pollError } = await supabase
        .from('polls')
        .select(`
          id,
          title,
          description,
          status,
          ends_at,
          created_at
        `)
        .eq('id', id)
        .single();

      if (pollError) throw pollError;

      // Fetch poll options with vote counts
      const { data: optionsData, error: optionsError } = await supabase
        .from('poll_options')
        .select('*')
        .eq('poll_id', id)
        .order('id', { ascending: true });

      if (optionsError) throw optionsError;

      setPoll({
        ...pollData,
        options: optionsData || [],
      });

      // Check if user has already voted
      if (user?.id) {
        const { data: voteData } = await supabase
          .from('poll_votes')
          .select('option_id')
          .eq('poll_id', id)
          .eq('user_id', user.id)
          .single();

        if (voteData) {
          setUserVote(voteData.option_id);
          setSelectedOption(voteData.option_id);
        }
      }
    } catch (error) {
      console.error('Error fetching poll:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    fetchPoll();
  }, [fetchPoll]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSelectOption = (optionId: string) => {
    if (userVote || !canVote) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedOption(optionId);
  };

  const handleVote = useCallback(async () => {
    if (!selectedOption || !poll || !user?.id || userVote) return;

    setIsVoting(true);

    try {
      // Insert vote
      const { error: voteError } = await supabase.from('poll_votes').insert({
        poll_id: poll.id,
        user_id: user.id,
        option_id: selectedOption,
      });

      if (voteError) throw voteError;

      // Increment vote count on option
      const { error: updateError } = await supabase.rpc('increment_poll_vote', {
        p_option_id: selectedOption,
      });

      // If RPC doesn't exist, manually update
      if (updateError) {
        const option = poll.options.find((o) => o.id === selectedOption);
        if (option) {
          await supabase
            .from('poll_options')
            .update({ vote_count: option.vote_count + 1 })
            .eq('id', selectedOption);
        }
      }

      setUserVote(selectedOption);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Refresh poll data
      await fetchPoll();
    } catch (error: any) {
      console.error('Error voting:', error);
      if (error.code === '23505') {
        Alert.alert('Error', 'Ya has votado en esta encuesta');
      } else {
        Alert.alert('Error', 'No se pudo registrar tu voto');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsVoting(false);
    }
  }, [selectedOption, poll, user?.id, userVote, fetchPoll]);

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const isExpired = (endDate: string | null): boolean => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  const canVote = poll && poll.status === 'active' && !isExpired(poll.ends_at) && !userVote;

  const totalVotes = poll?.options.reduce((sum, opt) => sum + opt.vote_count, 0) || 0;

  const getPercentage = (voteCount: number): number => {
    if (totalVotes === 0) return 0;
    return Math.round((voteCount / totalVotes) * 100);
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

  if (!poll) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Encuesta</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text variant="h1" center>
            :(
          </Text>
          <Text variant="h3" center style={{ marginTop: Spacing.md }}>
            Encuesta no encontrada
          </Text>
          <Button onPress={handleBack} style={{ marginTop: Spacing.xl }}>
            Volver
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const isPollActive = poll.status === 'active' && !isExpired(poll.ends_at);

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
        <Text variant="h2">Encuesta</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Poll Icon and Status */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.statusContainer}>
          <View style={[styles.iconContainer, { backgroundColor: isPollActive ? colors.infoBg : colors.surface }]}>
            <BarChart2 size={32} color={isPollActive ? colors.info : colors.textMuted} />
          </View>
          <Badge variant={isPollActive ? 'info' : 'default'} size="md">
            {isPollActive ? 'Activa' : 'Cerrada'}
          </Badge>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text variant="h1" style={styles.title}>
            {poll.title}
          </Text>
        </Animated.View>

        {/* Description */}
        {poll.description && (
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <Text variant="body" color="secondary" style={styles.description}>
              {poll.description}
            </Text>
          </Animated.View>
        )}

        {/* Meta info */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.metaContainer}>
          <View style={styles.metaRow}>
            <Calendar size={16} color={colors.textMuted} />
            <Text variant="bodySm" color="muted">
              Creada el {formatDate(poll.created_at)}
            </Text>
          </View>
          {poll.ends_at && (
            <View style={styles.metaRow}>
              <Clock size={16} color={colors.textMuted} />
              <Text variant="bodySm" color="muted">
                {isExpired(poll.ends_at) ? 'Finalizo' : 'Finaliza'} el {formatDate(poll.ends_at)}
              </Text>
            </View>
          )}
          <View style={styles.metaRow}>
            <Users size={16} color={colors.textMuted} />
            <Text variant="bodySm" color="muted">
              {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}
            </Text>
          </View>
        </Animated.View>

        {/* User vote status */}
        {userVote && (
          <Animated.View entering={FadeIn.delay(350)}>
            <Card variant="filled" padding="sm" style={[styles.votedCard, { backgroundColor: colors.successBg }]}>
              <View style={styles.votedContent}>
                <Check size={18} color={colors.success} />
                <Text variant="bodySm" customColor={colors.success}>
                  Ya votaste en esta encuesta
                </Text>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Options */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Text variant="h4" style={styles.optionsTitle}>
            Opciones
          </Text>

          {poll.options.map((option, index) => {
            const percentage = getPercentage(option.vote_count);
            const isSelected = selectedOption === option.id;
            const isUserVote = userVote === option.id;

            return (
              <Animated.View key={option.id} entering={FadeIn.delay(450 + index * 50)}>
                <Pressable
                  onPress={() => handleSelectOption(option.id)}
                  disabled={!!userVote || !canVote}
                >
                  <Card
                    variant="outlined"
                    padding="md"
                    style={[
                      styles.optionCard,
                      isSelected && !userVote && { borderColor: colors.accent, borderWidth: 2 },
                      isUserVote && { borderColor: colors.success, borderWidth: 2 },
                    ]}
                  >
                    <View style={styles.optionHeader}>
                      <View style={styles.optionTextContainer}>
                        {(isSelected || isUserVote) && (
                          <View
                            style={[
                              styles.checkIcon,
                              { backgroundColor: isUserVote ? colors.success : colors.accent },
                            ]}
                          >
                            <Check size={14} color={colors.white} />
                          </View>
                        )}
                        <Text
                          variant="bodyMedium"
                          customColor={isUserVote ? colors.success : undefined}
                        >
                          {option.option_text}
                        </Text>
                      </View>
                      <Text variant="bodyMedium" color="muted">
                        {percentage}%
                      </Text>
                    </View>

                    {/* Progress bar */}
                    <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${percentage}%`,
                            backgroundColor: isUserVote ? colors.success : colors.info,
                          },
                        ]}
                      />
                    </View>

                    <Text variant="caption" color="muted">
                      {option.vote_count} {option.vote_count === 1 ? 'voto' : 'votos'}
                    </Text>
                  </Card>
                </Pressable>
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* Vote Button */}
        {canVote && (
          <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.voteContainer}>
            <Button
              onPress={handleVote}
              loading={isVoting}
              disabled={!selectedOption}
              fullWidth
              size="lg"
            >
              Votar
            </Button>
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginBottom: Spacing.sm,
  },
  description: {
    marginBottom: Spacing.md,
  },
  metaContainer: {
    flexDirection: 'column',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  votedCard: {
    marginBottom: Spacing.lg,
  },
  votedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  optionsTitle: {
    marginBottom: Spacing.sm,
  },
  optionCard: {
    marginBottom: Spacing.sm,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  optionTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  checkIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: Spacing.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  voteContainer: {
    marginTop: Spacing.xl,
  },
});
