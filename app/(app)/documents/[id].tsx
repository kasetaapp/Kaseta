/**
 * KASETA - Document Detail Screen
 * View document details and open file
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  FileText,
  Calendar,
  User,
  Download,
  ExternalLink,
  ScrollText,
  FileCheck,
  ClipboardList,
  Bell,
} from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Badge, Skeleton, Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';

interface DocumentDetail {
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

const CATEGORY_CONFIG = {
  regulations: { icon: ScrollText, color: '#6366F1', label: 'Reglamento' },
  contracts: { icon: FileCheck, color: '#10B981', label: 'Contrato' },
  forms: { icon: ClipboardList, color: '#F59E0B', label: 'Formulario' },
  notices: { icon: Bell, color: '#EF4444', label: 'Aviso' },
};

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocument = useCallback(async () => {
    if (!id) return;

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
        .eq('id', id)
        .single();

      if (error) throw error;

      setDocument({
        ...data,
        uploaded_by: Array.isArray(data.uploaded_by) ? data.uploaded_by[0] : data.uploaded_by,
      });
    } catch (error) {
      console.error('Error fetching document:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleOpenDocument = async () => {
    if (!document?.file_url) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const supported = await Linking.canOpenURL(document.file_url);
      if (supported) {
        await Linking.openURL(document.file_url);
      } else {
        console.error('Cannot open URL:', document.file_url);
      }
    } catch (error) {
      console.error('Error opening document:', error);
    }
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

  if (!document) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Documento</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text variant="h1" center>📄</Text>
          <Text variant="h3" center style={{ marginTop: Spacing.md }}>
            Documento no encontrado
          </Text>
          <Button onPress={handleBack} style={{ marginTop: Spacing.xl }}>
            Volver
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const config = CATEGORY_CONFIG[document.category] || CATEGORY_CONFIG.regulations;
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
        <Text variant="h2">Documento</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Category Badge */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.typeContainer}>
          <View style={[styles.typeIcon, { backgroundColor: config.color + '20' }]}>
            <Icon size={24} color={config.color} />
          </View>
          <Badge variant="default" size="md">
            {config.label}
          </Badge>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text variant="h1" style={styles.title}>
            {document.title}
          </Text>
        </Animated.View>

        {/* Meta info */}
        <Animated.View entering={FadeInDown.delay(250).springify()} style={styles.metaContainer}>
          <View style={styles.metaRow}>
            <Calendar size={16} color={colors.textMuted} />
            <Text variant="bodySm" color="muted">
              {formatDate(document.created_at)}
            </Text>
          </View>
          {document.uploaded_by?.full_name && (
            <View style={styles.metaRow}>
              <User size={16} color={colors.textMuted} />
              <Text variant="bodySm" color="muted">
                Subido por: {document.uploaded_by.full_name}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Description */}
        {document.description && (
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Card variant="filled" padding="lg">
              <Text variant="body" style={styles.descriptionText}>
                {document.description}
              </Text>
            </Card>
          </Animated.View>
        )}

        {/* File info */}
        <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.fileInfoContainer}>
          <Card variant="outlined" padding="md">
            <View style={styles.fileInfoRow}>
              <View style={[styles.fileIconContainer, { backgroundColor: colors.surface }]}>
                <FileText size={24} color={colors.accent} />
              </View>
              <View style={styles.fileDetails}>
                <Text variant="bodyMedium">Archivo adjunto</Text>
                <Text variant="caption" color="muted">
                  Tipo: {document.file_type.toUpperCase()}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Open button */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.buttonContainer}>
          <Button
            onPress={handleOpenDocument}
            variant="primary"
            size="lg"
            fullWidth
          >
            Abrir documento
          </Button>
        </Animated.View>
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
    flexDirection: 'column',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  descriptionText: {
    lineHeight: 24,
  },
  fileInfoContainer: {
    marginTop: Spacing.lg,
  },
  fileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  buttonContainer: {
    marginTop: Spacing.xl,
  },
  openButton: {
    width: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  buttonText: {
    color: '#FFFFFF',
  },
});
