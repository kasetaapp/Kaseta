/**
 * KASETA - Community Directory Screen
 * View residents and contact information (opt-in)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Phone, MessageCircle, Search, User, Building2 } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Skeleton, EmptyState, Input } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase';

interface DirectoryEntry {
  id: string;
  full_name: string;
  phone: string | null;
  show_in_directory: boolean;
  unit: {
    unit_number: string;
    building: string | null;
  } | null;
}

export default function DirectoryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentOrganization } = useOrganization();

  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<DirectoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDirectory = useCallback(async () => {
    if (!currentOrganization) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch users who opted in to show in directory
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          user:user_id(
            id,
            full_name,
            phone,
            show_in_directory
          ),
          unit:unit_id(
            unit_number,
            building
          )
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'active');

      if (error) throw error;

      // Filter and format entries
      const directoryEntries: DirectoryEntry[] = (data || [])
        .filter((m: any) => m.user?.show_in_directory)
        .map((m: any) => ({
          id: m.user.id,
          full_name: m.user.full_name,
          phone: m.user.phone,
          show_in_directory: m.user.show_in_directory,
          unit: m.unit,
        }))
        .sort((a: DirectoryEntry, b: DirectoryEntry) => {
          // Sort by unit number if available
          if (a.unit?.unit_number && b.unit?.unit_number) {
            return a.unit.unit_number.localeCompare(b.unit.unit_number, undefined, { numeric: true });
          }
          return a.full_name.localeCompare(b.full_name);
        });

      setEntries(directoryEntries);
      setFilteredEntries(directoryEntries);
    } catch (error) {
      console.error('Error fetching directory:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    fetchDirectory();
  }, [fetchDirectory]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEntries(entries);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = entries.filter(
      (entry) =>
        entry.full_name.toLowerCase().includes(query) ||
        entry.unit?.unit_number.toLowerCase().includes(query) ||
        entry.unit?.building?.toLowerCase().includes(query)
    );
    setFilteredEntries(filtered);
  }, [searchQuery, entries]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchDirectory();
    setRefreshing(false);
  }, [fetchDirectory]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleCall = (phone: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`tel:${phone}`);
  };

  const handleMessage = (phone: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`sms:${phone}`);
  };

  const handleWhatsApp = (phone: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Clean phone number and add country code if needed
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.startsWith('52') ? cleanPhone : `52${cleanPhone}`;
    Linking.openURL(`whatsapp://send?phone=${phoneWithCode}`).catch(() => {
      Alert.alert('Error', 'WhatsApp no está instalado');
    });
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderEntry = ({ item, index }: { item: DirectoryEntry; index: number }) => {
    return (
      <Animated.View entering={FadeIn.delay(index * 30)}>
        <Card variant="elevated" style={styles.entryCard} padding="md">
          <View style={styles.entryHeader}>
            <View style={[styles.avatar, { backgroundColor: colors.accent + '20' }]}>
              <Text variant="h4" customColor={colors.accent}>
                {getInitials(item.full_name)}
              </Text>
            </View>
            <View style={styles.entryInfo}>
              <Text variant="h4">{item.full_name}</Text>
              {item.unit && (
                <View style={styles.unitRow}>
                  <Building2 size={14} color={colors.textMuted} />
                  <Text variant="bodySm" color="muted">
                    {item.unit.building ? `${item.unit.building} - ` : ''}
                    Unidad {item.unit.unit_number}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {item.phone && (
            <View style={styles.actionsRow}>
              <Pressable
                onPress={() => handleCall(item.phone!)}
                style={[styles.actionButton, { backgroundColor: colors.success + '15' }]}
              >
                <Phone size={18} color={colors.success} />
                <Text variant="bodySm" customColor={colors.success}>Llamar</Text>
              </Pressable>
              <Pressable
                onPress={() => handleMessage(item.phone!)}
                style={[styles.actionButton, { backgroundColor: colors.accent + '15' }]}
              >
                <MessageCircle size={18} color={colors.accent} />
                <Text variant="bodySm" customColor={colors.accent}>SMS</Text>
              </Pressable>
              <Pressable
                onPress={() => handleWhatsApp(item.phone!)}
                style={[styles.actionButton, { backgroundColor: '#25D36620' }]}
              >
                <Text variant="body">💬</Text>
                <Text variant="bodySm" customColor="#25D366">WhatsApp</Text>
              </Pressable>
            </View>
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
          <Text variant="h2">Directorio</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.content}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width="100%" height={120} style={{ marginBottom: Spacing.md }} />
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
        <Text variant="h2">Directorio</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      {/* Search */}
      <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.searchContainer}>
        <View style={[styles.searchInputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search size={18} color={colors.textMuted} />
          <Input
            placeholder="Buscar por nombre o unidad..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>
      </Animated.View>

      {entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="👥"
            title="Directorio vacío"
            description="Los residentes que compartan su información aparecerán aquí"
          />
        </View>
      ) : filteredEntries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="🔍"
            title="Sin resultados"
            description="No se encontraron residentes con ese criterio"
          />
        </View>
      ) : (
        <FlatList
          data={filteredEntries}
          keyExtractor={(item) => item.id}
          renderItem={renderEntry}
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
          ListHeaderComponent={
            <Text variant="caption" color="muted" style={styles.countText}>
              {filteredEntries.length} {filteredEntries.length === 1 ? 'residente' : 'residentes'}
            </Text>
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
  searchContainer: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  countText: { marginBottom: Spacing.sm },
  entryCard: { marginBottom: Spacing.md },
  entryHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryInfo: { flex: 1, marginLeft: Spacing.md },
  unitRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xxs },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
});
