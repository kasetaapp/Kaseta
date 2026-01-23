/**
 * KASETA - Create Announcement Screen
 * Admin can create new announcements
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Bell, AlertTriangle, Info, Megaphone } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Button, Input, Card } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

type AnnouncementType = 'info' | 'warning' | 'urgent' | 'general';

const TYPES: { key: AnnouncementType; label: string; icon: any; color: string }[] = [
  { key: 'general', label: 'General', icon: Megaphone, color: '#6366F1' },
  { key: 'info', label: 'Información', icon: Info, color: '#3B82F6' },
  { key: 'warning', label: 'Aviso', icon: AlertTriangle, color: '#F59E0B' },
  { key: 'urgent', label: 'Urgente', icon: Bell, color: '#EF4444' },
];

export default function CreateAnnouncementScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentOrganization, isAdmin } = useOrganization();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<AnnouncementType>('general');
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleTypeSelect = (t: AnnouncementType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setType(t);
  };

  const handleCreate = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'El título es requerido');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Error', 'El contenido es requerido');
      return;
    }
    if (!currentOrganization || !user?.id) {
      Alert.alert('Error', 'No autorizado');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('announcements').insert({
        organization_id: currentOrganization.id,
        created_by: user.id,
        title: title.trim(),
        content: content.trim(),
        type,
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Éxito', 'Anuncio publicado correctamente', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error creating announcement:', error);
      Alert.alert('Error', 'No se pudo crear el anuncio');
    } finally {
      setLoading(false);
    }
  }, [title, content, type, currentOrganization, user]);

  if (!isAdmin) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Nuevo anuncio</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text variant="h1" center>🔒</Text>
          <Text variant="h3" center style={{ marginTop: Spacing.md }}>
            Sin permisos
          </Text>
          <Text variant="body" color="secondary" center>
            Solo administradores pueden crear anuncios
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.header}
        >
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Nuevo anuncio</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Type Selection */}
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>
              Tipo de anuncio
            </Text>
            <View style={styles.typesGrid}>
              {TYPES.map((t) => {
                const Icon = t.icon;
                const isSelected = type === t.key;
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => handleTypeSelect(t.key)}
                    style={[
                      styles.typeOption,
                      {
                        backgroundColor: isSelected ? t.color + '20' : colors.surface,
                        borderColor: isSelected ? t.color : colors.border,
                      },
                    ]}
                  >
                    <Icon size={20} color={isSelected ? t.color : colors.textMuted} />
                    <Text
                      variant="bodySm"
                      customColor={isSelected ? t.color : colors.textSecondary}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>
              Contenido
            </Text>
            <Card variant="filled" padding="md">
              <Input
                label="Título"
                placeholder="Título del anuncio"
                value={title}
                onChangeText={setTitle}
                autoCapitalize="sentences"
              />
              <View style={styles.inputSpacing}>
                <Input
                  label="Contenido"
                  placeholder="Escribe el mensaje del anuncio..."
                  value={content}
                  onChangeText={setContent}
                  multiline
                  numberOfLines={6}
                  autoCapitalize="sentences"
                />
              </View>
            </Card>
          </Animated.View>

          {/* Submit */}
          <Animated.View
            entering={FadeInDown.delay(250).springify()}
            style={styles.submitContainer}
          >
            <Button
              onPress={handleCreate}
              loading={loading}
              disabled={!title.trim() || !content.trim()}
              fullWidth
              size="lg"
            >
              Publicar anuncio
            </Button>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  sectionTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.smd,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  inputSpacing: {
    marginTop: Spacing.md,
  },
  submitContainer: {
    marginTop: Spacing.xl,
  },
});
