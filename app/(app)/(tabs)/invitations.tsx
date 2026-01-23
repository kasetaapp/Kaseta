/**
 * KASETA - Invitations Screen
 * List and manage visitor invitations with real-time updates
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Plus } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Button, EmptyState, Skeleton } from '@/components/ui';
import { InvitationCard, InvitationCardSkeleton } from '@/components/features/invitations';
import { useInvitations } from '@/hooks/useInvitations';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Invitation, InvitationStatus } from '@/lib/invitations';

type FilterTab = 'all' | 'active' | 'used' | 'expired';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'active', label: 'Activas' },
  { key: 'used', label: 'Usadas' },
  { key: 'expired', label: 'Vencidas' },
];

export default function InvitationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentMembership, currentOrganization } = useOrganization();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { invitations, isLoading, refresh } = useInvitations();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleTabChange = useCallback((tab: FilterTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  }, []);

  const handleInvitationPress = useCallback((invitation: Invitation) => {
    router.push({
      pathname: '/(app)/invitation/[id]',
      params: { id: invitation.id },
    });
  }, []);

  const handleCreateInvitation = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(app)/invitation/create');
  }, []);

  const filteredInvitations = invitations.filter((inv) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return inv.status === 'active';
    if (activeTab === 'used') return inv.status === 'used';
    if (activeTab === 'expired') return inv.status === 'expired' || inv.status === 'cancelled';
    return true;
  });

  const renderInvitation = useCallback(
    ({ item, index }: { item: Invitation; index: number }) => (
      <InvitationCard
        invitation={item}
        onPress={handleInvitationPress}
        index={index}
      />
    ),
    [handleInvitationPress]
  );

  const renderEmpty = () => {
    if (isLoading) return null;

    const emptyConfig = {
      all: {
        icon: '✉️',
        title: 'Sin invitaciones',
        description: 'Crea tu primera invitación para un visitante',
        action: 'Crear invitación',
      },
      active: {
        icon: '📭',
        title: 'Sin invitaciones activas',
        description: 'No tienes invitaciones pendientes de uso',
        action: 'Crear invitación',
      },
      used: {
        icon: '✅',
        title: 'Sin invitaciones usadas',
        description: 'Las invitaciones usadas aparecerán aquí',
        action: undefined,
      },
      expired: {
        icon: '⏰',
        title: 'Sin invitaciones vencidas',
        description: 'Las invitaciones vencidas aparecerán aquí',
        action: undefined,
      },
    };

    const config = emptyConfig[activeTab];

    return (
      <EmptyState
        icon={config.icon}
        title={config.title}
        description={config.description}
        actionLabel={config.action}
        onAction={config.action ? handleCreateInvitation : undefined}
      />
    );
  };

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {FILTER_TABS.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => handleTabChange(tab.key)}
            style={[
              styles.filterTab,
              {
                backgroundColor:
                  activeTab === tab.key
                    ? colors.primary
                    : colors.surface,
              },
            ]}
          >
            <Text
              variant="bodySm"
              customColor={
                activeTab === tab.key
                  ? colors.background
                  : colors.textSecondary
              }
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  // Loading state
  if (isLoading && invitations.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Skeleton width={150} height={32} />
          <Skeleton width={100} height={40} />
        </View>
        <View style={styles.content}>
          {[0, 1, 2].map((i) => (
            <InvitationCardSkeleton key={i} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // No organization selected
  if (!currentMembership || !currentOrganization) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="🏢"
          title="Sin organización"
          description="Selecciona o únete a una organización para ver tus invitaciones"
          actionLabel="Seleccionar"
          onAction={() => {
            // TODO: Open organization switcher
          }}
        />
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
        <View>
          <Text variant="h1">Invitaciones</Text>
          <Text variant="caption" color="muted">
            {currentOrganization.name}
          </Text>
        </View>
        <Button
          onPress={handleCreateInvitation}
          size="sm"
          leftIcon={<Plus size={18} color={colors.textOnAccent} />}
        >
          Nueva
        </Button>
      </Animated.View>

      {/* Content */}
      <FlatList
        data={filteredInvitations}
        keyExtractor={(item) => item.id}
        renderItem={renderInvitation}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
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
            colors={[colors.accent]}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
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
    marginTop: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
});
