/**
 * KASETA - Maintenance Requests Screen
 * View and create maintenance requests
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
import { ChevronLeft, Plus, Wrench, Clock, CheckCircle, AlertCircle } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Badge, Skeleton, EmptyState } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase';

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

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

export default function MaintenanceScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentMembership } = useOrganization();

  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!currentMembership?.unit_id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('unit_id', currentMembership.unit_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentMembership]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchRequests();
    setRefreshing(false);
  }, [fetchRequests]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleCreate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(app)/maintenance/create');
  };

  const handlePress = (request: MaintenanceRequest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/(app)/maintenance/[id]',
      params: { id: request.id },
    });
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  const renderRequest = ({ item, index }: { item: MaintenanceRequest; index: number }) => {
    const statusConfig = STATUS_CONFIG[item.status];
    const priorityConfig = PRIORITY_CONFIG[item.priority];
    const StatusIcon = statusConfig.icon;

    return (
      <Animated.View entering={FadeIn.delay(index * 50)}>
        <Card
          variant="outlined"
          style={styles.requestCard}
          padding="md"
          pressable
          onPress={() => handlePress(item)}
        >
          <View style={styles.requestHeader}>
            <View style={[styles.statusIcon, { backgroundColor: statusConfig.color + '20' }]}>
              <StatusIcon size={18} color={statusConfig.color} />
            </View>
            <View style={styles.requestMeta}>
              <Badge variant="default" size="sm">{statusConfig.label}</Badge>
              <Text variant="caption" color="muted">{formatDate(item.created_at)}</Text>
            </View>
          </View>

          <Text variant="bodyMedium" style={styles.requestTitle}>
            {item.title}
          </Text>
          <Text variant="bodySm" color="secondary" numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.requestFooter}>
            <Text variant="caption" color="muted">{item.category}</Text>
            <View style={[styles.priorityDot, { backgroundColor: priorityConfig.color }]} />
          </View>
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
          <Text variant="h2">Mantenimiento</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.content}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={120} style={{ marginBottom: Spacing.md }} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        entering={FadeInDown.delay(100).springify()}
        style={styles.header}
      >
        <Pressable onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text variant="h2">Mantenimiento</Text>
        <Pressable onPress={handleCreate} style={styles.addButton}>
          <Plus size={24} color={colors.accent} />
        </Pressable>
      </Animated.View>

      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="🔧"
            title="Sin solicitudes"
            description="Reporta problemas o solicita reparaciones"
            actionLabel="Nueva solicitud"
            onAction={handleCreate}
          />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequest}
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
  addButton: { padding: Spacing.xs },
  content: { flex: 1, paddingHorizontal: Spacing.lg },
  emptyContainer: { flex: 1, justifyContent: 'center', padding: Spacing.lg },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  requestCard: { marginBottom: Spacing.md },
  requestHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  statusIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  requestMeta: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginLeft: Spacing.sm },
  requestTitle: { marginBottom: Spacing.xs },
  requestFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.sm },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
});
