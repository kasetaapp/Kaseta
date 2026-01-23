/**
 * KASETA - Lost & Found Items Screen
 * View and filter lost and found items
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Plus, Search, Package, MapPin, Calendar } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Badge, Skeleton, EmptyState, Input } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase';

interface LostFoundItem {
  id: string;
  type: 'lost' | 'found';
  title: string;
  description: string;
  location: string;
  contact_phone: string;
  status: 'open' | 'claimed';
  photo_url: string | null;
  created_at: string;
  reported_by: string;
}

type FilterType = 'all' | 'lost' | 'found';

const TYPE_CONFIG = {
  lost: { label: 'Perdido', color: '#EF4444', bgColor: '#FEF2F2' },
  found: { label: 'Encontrado', color: '#10B981', bgColor: '#F0FDF4' },
};

const STATUS_CONFIG = {
  open: { label: 'Abierto', variant: 'info' as const },
  claimed: { label: 'Reclamado', variant: 'success' as const },
};

export default function LostFoundScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentOrganization } = useOrganization();

  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<LostFoundItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchItems = useCallback(async () => {
    if (!currentOrganization?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('lost_found_items')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching lost & found items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    let result = items;

    // Apply type filter
    if (activeFilter !== 'all') {
      result = result.filter((item) => item.type === activeFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.location.toLowerCase().includes(query)
      );
    }

    setFilteredItems(result);
  }, [items, activeFilter, searchQuery]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchItems();
    setRefreshing(false);
  }, [fetchItems]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleCreate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(app)/lost-found/create');
  };

  const handlePress = (item: LostFoundItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/(app)/lost-found/[id]',
      params: { id: item.id },
    });
  };

  const handleFilterChange = (filter: FilterType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filter);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  const renderFilterTab = (filter: FilterType, label: string) => {
    const isActive = activeFilter === filter;
    return (
      <Pressable
        key={filter}
        onPress={() => handleFilterChange(filter)}
        style={[
          styles.filterTab,
          {
            backgroundColor: isActive ? colors.accent : colors.surface,
            borderColor: isActive ? colors.accent : colors.border,
          },
        ]}
      >
        <Text
          variant="labelSm"
          customColor={isActive ? colors.textOnAccent : colors.textSecondary}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  const renderItem = ({ item, index }: { item: LostFoundItem; index: number }) => {
    const typeConfig = TYPE_CONFIG[item.type];
    const statusConfig = STATUS_CONFIG[item.status];

    return (
      <Animated.View entering={FadeIn.delay(index * 50)}>
        <Card
          variant="outlined"
          style={styles.itemCard}
          padding="none"
          pressable
          onPress={() => handlePress(item)}
        >
          <View style={styles.cardContent}>
            {item.photo_url ? (
              <Image source={{ uri: item.photo_url }} style={styles.itemImage} />
            ) : (
              <View style={[styles.itemImagePlaceholder, { backgroundColor: colors.surface }]}>
                <Package size={24} color={colors.textMuted} />
              </View>
            )}

            <View style={styles.itemInfo}>
              <View style={styles.itemHeader}>
                <View
                  style={[
                    styles.typeBadge,
                    { backgroundColor: isDark ? typeConfig.color + '30' : typeConfig.bgColor },
                  ]}
                >
                  <Text variant="captionMedium" customColor={typeConfig.color}>
                    {typeConfig.label}
                  </Text>
                </View>
                <Badge variant={statusConfig.variant} size="sm">
                  {statusConfig.label}
                </Badge>
              </View>

              <Text variant="bodyMedium" numberOfLines={1} style={styles.itemTitle}>
                {item.title}
              </Text>

              <View style={styles.itemMeta}>
                <View style={styles.metaItem}>
                  <MapPin size={12} color={colors.textMuted} />
                  <Text variant="caption" color="muted" numberOfLines={1}>
                    {item.location}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Calendar size={12} color={colors.textMuted} />
                  <Text variant="caption" color="muted">
                    {formatDate(item.created_at)}
                  </Text>
                </View>
              </View>
            </View>
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
          <Text variant="h2">Objetos Perdidos</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.content}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={100} style={{ marginBottom: Spacing.md }} />
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
        <Text variant="h2">Objetos Perdidos</Text>
        <Pressable onPress={handleCreate} style={styles.addButton}>
          <Plus size={24} color={colors.accent} />
        </Pressable>
      </Animated.View>

      {/* Search */}
      <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.searchContainer}>
        <Input
          placeholder="Buscar objeto..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftElement={<Search size={18} color={colors.textMuted} />}
        />
      </Animated.View>

      {/* Filter Tabs */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.filterContainer}>
        {renderFilterTab('all', 'Todos')}
        {renderFilterTab('lost', 'Perdidos')}
        {renderFilterTab('found', 'Encontrados')}
      </Animated.View>

      {filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="📦"
            title={searchQuery ? 'Sin resultados' : 'Sin objetos'}
            description={
              searchQuery
                ? 'No se encontraron objetos con esa busqueda'
                : 'Reporta objetos perdidos o encontrados'
            }
            actionLabel="Reportar objeto"
            onAction={handleCreate}
          />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
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
  searchContainer: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  emptyContainer: { flex: 1, justifyContent: 'center', padding: Spacing.lg },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  itemCard: { marginBottom: Spacing.md },
  cardContent: { flexDirection: 'row' },
  itemImage: {
    width: 80,
    height: 80,
    borderTopLeftRadius: BorderRadius.xl,
    borderBottomLeftRadius: BorderRadius.xl,
  },
  itemImagePlaceholder: {
    width: 80,
    height: 80,
    borderTopLeftRadius: BorderRadius.xl,
    borderBottomLeftRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: { flex: 1, padding: Spacing.sm },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.sm,
  },
  itemTitle: { marginBottom: Spacing.xs },
  itemMeta: { flexDirection: 'row', gap: Spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xxs },
});
