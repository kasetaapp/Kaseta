/**
 * KASETA - Admin Invitations Screen
 * View all invitations in the organization
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Search, Calendar, User } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Badge, Input, Skeleton, EmptyState, Avatar } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase';
import { Invitation, InvitationStatus } from '@/lib/invitations';

interface InvitationWithUnit extends Invitation {
  unit?: {
    id: string;
    name: string;
    identifier: string | null;
  };
  creator?: {
    id: string;
    full_name: string | null;
  };
}

const STATUS_CONFIG: Record<InvitationStatus, { label: string; variant: 'default' | 'success' | 'error' | 'warning' }> = {
  active: { label: 'Activa', variant: 'success' },
  used: { label: 'Usada', variant: 'default' },
  expired: { label: 'Expirada', variant: 'error' },
  cancelled: { label: 'Cancelada', variant: 'warning' },
};

type FilterStatus = 'all' | InvitationStatus;

export default function AdminInvitationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentOrganization } = useOrganization();

  const [invitations, setInvitations] = useState<InvitationWithUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const fetchInvitations = useCallback(async () => {
    if (!currentOrganization?.id) return;

    try {
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          unit:units(id, name, identifier),
          creator:profiles!created_by(id, full_name)
        `)
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform response
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        unit: Array.isArray(item.unit) ? item.unit[0] : item.unit,
        creator: Array.isArray(item.creator) ? item.creator[0] : item.creator,
      }));

      setInvitations(transformedData as InvitationWithUnit[]);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchInvitations();
    setRefreshing(false);
  }, [fetchInvitations]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const handleInvitationPress = useCallback((invitation: InvitationWithUnit) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/(app)/invitation/[id]',
      params: { id: invitation.id },
    });
  }, []);

  const filteredInvitations = invitations.filter((invitation) => {
    // Filter by status
    if (filterStatus !== 'all' && invitation.status !== filterStatus) {
      return false;
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const visitorName = invitation.visitor_name?.toLowerCase() || '';
      const unitName = invitation.unit?.name?.toLowerCase() || '';
      const shortCode = invitation.short_code?.toLowerCase() || '';
      return (
        visitorName.includes(query) ||
        unitName.includes(query) ||
        shortCode.includes(query)
      );
    }

    return true;
  });

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderInvitation = useCallback(
    ({ item, index }: { item: InvitationWithUnit; index: number }) => {
      const statusConfig = STATUS_CONFIG[item.status];

      return (
        <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
          <Pressable onPress={() => handleInvitationPress(item)}>
            <Card variant="filled" padding="md" style={styles.invitationCard}>
              <View style={styles.invitationHeader}>
                <Avatar name={item.visitor_name} size="md" />
                <View style={styles.invitationInfo}>
                  <Text variant="bodyMedium" numberOfLines={1}>
                    {item.visitor_name}
                  </Text>
                  <Text variant="caption" color="muted">
                    {item.unit?.name || 'Sin unidad'}
                  </Text>
                </View>
                <Badge variant={statusConfig.variant} size="sm">
                  {statusConfig.label}
                </Badge>
              </View>

              <View style={styles.invitationDetails}>
                <View style={styles.detailRow}>
                  <Calendar size={14} color={colors.textMuted} />
                  <Text variant="caption" color="secondary">
                    {formatDate(item.valid_from)}
                    {item.valid_until && ` - ${formatDate(item.valid_until)}`}
                  </Text>
                </View>
                {item.creator && (
                  <View style={styles.detailRow}>
                    <User size={14} color={colors.textMuted} />
                    <Text variant="caption" color="secondary">
                      Creada por {item.creator.full_name || 'Usuario'}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.invitationFooter}>
                <View style={[styles.shortCode, { backgroundColor: colors.surface }]}>
                  <Text variant="mono" color="muted">
                    {item.short_code}
                  </Text>
                </View>
              </View>
            </Card>
          </Pressable>
        </Animated.View>
      );
    },
    [colors, handleInvitationPress]
  );

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Search */}
      <Input
        placeholder="Buscar por visitante, unidad o código..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        leftElement={<Search size={18} color={colors.textMuted} />}
      />

      {/* Status Filter */}
      <View style={styles.filterTabs}>
        {(['all', 'active', 'used', 'expired'] as FilterStatus[]).map((status) => (
          <Pressable
            key={status}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilterStatus(status);
            }}
            style={[
              styles.filterTab,
              {
                backgroundColor:
                  filterStatus === status ? colors.primary : colors.surface,
              },
            ]}
          >
            <Text
              variant="bodySm"
              customColor={
                filterStatus === status ? colors.background : colors.textSecondary
              }
            >
              {status === 'all' ? 'Todas' : STATUS_CONFIG[status].label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text variant="caption" color="muted" style={styles.resultCount}>
        {filteredInvitations.length} invitación{filteredInvitations.length !== 1 ? 'es' : ''}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Invitaciones</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.content}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={120} style={{ marginBottom: Spacing.sm }} />
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
        <Text variant="h2">Invitaciones</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <FlatList
        data={filteredInvitations}
        keyExtractor={(item) => item.id}
        renderItem={renderInvitation}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="✉️"
            title="Sin invitaciones"
            description="No hay invitaciones que coincidan con tu búsqueda"
          />
        }
        contentContainerStyle={[
          styles.content,
          filteredInvitations.length === 0 && styles.contentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      />
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
  contentEmpty: {
    flex: 1,
  },
  listHeader: {
    marginBottom: Spacing.md,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  resultCount: {
    marginTop: Spacing.md,
  },
  invitationCard: {
    marginBottom: Spacing.sm,
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  invitationInfo: {
    flex: 1,
    marginLeft: Spacing.smd,
  },
  invitationDetails: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  invitationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  shortCode: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
});
