/**
 * KASETA - Maintenance Request Detail
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Clock, Wrench, CheckCircle, AlertCircle, Calendar } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Text, Card, Badge, Skeleton, Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', color: '#F59E0B', icon: Clock },
  in_progress: { label: 'En progreso', color: '#3B82F6', icon: Wrench },
  completed: { label: 'Completado', color: '#10B981', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: '#6B7280', icon: AlertCircle },
};

const PRIORITY_CONFIG = {
  low: { label: 'Baja', color: '#6B7280' },
  medium: { label: 'Media', color: '#F59E0B' },
  high: { label: 'Alta', color: '#EF4444' },
  urgent: { label: 'Urgente', color: '#DC2626' },
};

export default function MaintenanceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const [request, setRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequest = useCallback(async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setRequest(data);
    } catch (error) {
      console.error('Error fetching request:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

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

  if (!request) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Solicitud</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text variant="h1" center>😕</Text>
          <Text variant="h3" center style={{ marginTop: Spacing.md }}>Solicitud no encontrada</Text>
          <Button onPress={handleBack} style={{ marginTop: Spacing.xl }}>Volver</Button>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG];
  const priorityConfig = PRIORITY_CONFIG[request.priority as keyof typeof PRIORITY_CONFIG];
  const StatusIcon = statusConfig.icon;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text variant="h2">Solicitud</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.statusContainer}>
          <View style={[styles.statusIcon, { backgroundColor: statusConfig.color + '20' }]}>
            <StatusIcon size={28} color={statusConfig.color} />
          </View>
          <Badge variant="default" size="md">{statusConfig.label}</Badge>
        </Animated.View>

        {/* Title & Priority */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text variant="h1" style={styles.title}>{request.title}</Text>
          <View style={styles.metaRow}>
            <Badge variant="default" size="sm">{request.category}</Badge>
            <View style={styles.priorityBadge}>
              <View style={[styles.priorityDot, { backgroundColor: priorityConfig.color }]} />
              <Text variant="caption" customColor={priorityConfig.color}>
                Prioridad {priorityConfig.label}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>Descripción</Text>
          <Card variant="filled" padding="lg">
            <Text variant="body" style={styles.descriptionText}>{request.description}</Text>
          </Card>
        </Animated.View>

        {/* Dates */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>Información</Text>
          <Card variant="filled" padding="md">
            <View style={styles.infoRow}>
              <Calendar size={16} color={colors.textMuted} />
              <View style={styles.infoContent}>
                <Text variant="caption" color="muted">Fecha de creación</Text>
                <Text variant="bodyMedium">{formatDate(request.created_at)}</Text>
              </View>
            </View>
            {request.updated_at !== request.created_at && (
              <View style={[styles.infoRow, { marginTop: Spacing.md }]}>
                <Clock size={16} color={colors.textMuted} />
                <View style={styles.infoContent}>
                  <Text variant="caption" color="muted">Última actualización</Text>
                  <Text variant="bodyMedium">{formatDate(request.updated_at)}</Text>
                </View>
              </View>
            )}
          </Card>
        </Animated.View>
      </ScrollView>
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
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  statusContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  statusIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  title: { marginBottom: Spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  priorityBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { marginTop: Spacing.lg, marginBottom: Spacing.sm },
  descriptionText: { lineHeight: 24 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  infoContent: { flex: 1 },
});
