/**
 * KASETA - Documents Screen
 * View community documents and regulations
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SectionList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, FileText, ScrollText, FileCheck, ClipboardList, Bell } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Badge, Skeleton, EmptyState } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase';

interface Document {
  id: string;
  title: string;
  description: string | null;
  category: 'regulations' | 'contracts' | 'forms' | 'notices';
  file_url: string;
  file_type: string;
  created_at: string;
  uploaded_by?: {
    full_name: string;
  };
}

interface SectionData {
  title: string;
  data: Document[];
}

const CATEGORY_CONFIG = {
  regulations: { icon: ScrollText, color: '#6366F1', label: 'Reglamentos', bg: '#EEF2FF' },
  contracts: { icon: FileCheck, color: '#10B981', label: 'Contratos', bg: '#D1FAE5' },
  forms: { icon: ClipboardList, color: '#F59E0B', label: 'Formularios', bg: '#FFFBEB' },
  notices: { icon: Bell, color: '#EF4444', label: 'Avisos', bg: '#FEF2F2' },
};

const CATEGORY_ORDER: Array<keyof typeof CATEGORY_CONFIG> = ['regulations', 'contracts', 'forms', 'notices'];

export default function DocumentsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentOrganization } = useOrganization();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!currentOrganization) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          title,
          description,
          category,
          file_url,
          file_type,
          created_at,
          uploaded_by:profiles!documents_uploaded_by_fkey(full_name)
        `)
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformed = (data || []).map((d: any) => ({
        ...d,
        uploaded_by: Array.isArray(d.uploaded_by) ? d.uploaded_by[0] : d.uploaded_by,
      }));

      setDocuments(transformed);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchDocuments();
    setRefreshing(false);
  }, [fetchDocuments]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handlePress = (document: Document) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/(app)/documents/[id]',
      params: { id: document.id },
    });
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getSections = (): SectionData[] => {
    const sections: SectionData[] = [];

    for (const category of CATEGORY_ORDER) {
      const categoryDocs = documents.filter(d => d.category === category);
      if (categoryDocs.length > 0) {
        sections.push({
          title: CATEGORY_CONFIG[category].label,
          data: categoryDocs,
        });
      }
    }

    return sections;
  };

  const renderSectionHeader = ({ section }: { section: SectionData }) => {
    const category = CATEGORY_ORDER.find(c => CATEGORY_CONFIG[c].label === section.title);
    const config = category ? CATEGORY_CONFIG[category] : CATEGORY_CONFIG.regulations;
    const Icon = config.icon;

    return (
      <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
        <View style={[styles.sectionIcon, { backgroundColor: isDark ? colors.surface : config.bg }]}>
          <Icon size={18} color={config.color} />
        </View>
        <Text variant="bodyMedium" color="secondary">
          {section.title}
        </Text>
        <Text variant="caption" color="muted" style={styles.sectionCount}>
          {section.data.length}
        </Text>
      </View>
    );
  };

  const renderDocument = ({ item, index }: { item: Document; index: number }) => {
    const config = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.regulations;

    return (
      <Animated.View entering={FadeIn.delay(index * 50)}>
        <Card
          variant="outlined"
          style={styles.documentCard}
          padding="md"
          pressable
          onPress={() => handlePress(item)}
        >
          <View style={styles.documentHeader}>
            <View style={[styles.fileIcon, { backgroundColor: isDark ? colors.surface : config.bg }]}>
              <FileText size={20} color={config.color} />
            </View>
            <View style={styles.documentInfo}>
              <Text variant="bodyMedium" numberOfLines={1}>
                {item.title}
              </Text>
              <View style={styles.documentMeta}>
                <Badge variant="default" size="sm">
                  {item.file_type.toUpperCase()}
                </Badge>
                <Text variant="caption" color="muted">
                  {formatDate(item.created_at)}
                </Text>
              </View>
            </View>
          </View>

          {item.description && (
            <Text variant="bodySm" color="secondary" numberOfLines={2} style={styles.description}>
              {item.description}
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
          <Text variant="h2">Documentos</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.content}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width="100%" height={100} style={{ marginBottom: Spacing.md }} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  const sections = getSections();

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
        <Text variant="h2">Documentos</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      {/* List */}
      {sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="📄"
            title="Sin documentos"
            description="Los documentos y reglamentos de la comunidad aparecerán aquí"
          />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderDocument}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  sectionCount: {
    marginLeft: Spacing.xs,
  },
  documentCard: {
    marginBottom: Spacing.sm,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  description: {
    marginTop: Spacing.sm,
  },
});
