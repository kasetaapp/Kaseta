/**
 * KASETA - Lost & Found Item Detail
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  MapPin,
  Phone,
  Calendar,
  Package,
  User,
  CheckCircle,
} from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Badge, Skeleton, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase';

interface LostFoundItem {
  id: string;
  organization_id: string;
  reported_by: string;
  type: 'lost' | 'found';
  title: string;
  description: string;
  location: string;
  contact_phone: string;
  status: 'open' | 'claimed';
  photo_url: string | null;
  created_at: string;
}

const TYPE_CONFIG = {
  lost: { label: 'Perdido', color: '#EF4444', bgColor: '#FEF2F2', icon: 'search' },
  found: { label: 'Encontrado', color: '#10B981', bgColor: '#F0FDF4', icon: 'check' },
};

const STATUS_CONFIG = {
  open: { label: 'Abierto', variant: 'info' as const },
  claimed: { label: 'Reclamado', variant: 'success' as const },
};

export default function LostFoundDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  const [item, setItem] = useState<LostFoundItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);

  const fetchItem = useCallback(async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('lost_found_items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setItem(data);
    } catch (error) {
      console.error('Error fetching item:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleCall = () => {
    if (!item?.contact_phone) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`tel:${item.contact_phone}`);
  };

  const handleClaim = useCallback(async () => {
    if (!item || !user) return;

    Alert.alert(
      'Reclamar objeto',
      'Estas seguro que deseas marcar este objeto como reclamado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setIsClaiming(true);
            try {
              const { error } = await supabase
                .from('lost_found_items')
                .update({ status: 'claimed' })
                .eq('id', item.id);

              if (error) throw error;

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setItem((prev) => (prev ? { ...prev, status: 'claimed' } : null));
              Alert.alert('Exito', 'El objeto ha sido marcado como reclamado');
            } catch (error) {
              console.error('Error claiming item:', error);
              Alert.alert('Error', 'No se pudo reclamar el objeto');
            } finally {
              setIsClaiming(false);
            }
          },
        },
      ]
    );
  }, [item, user]);

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
          <Skeleton width="100%" height={100} style={{ marginTop: Spacing.md }} />
        </View>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Detalle</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text variant="h1" center>
            📦
          </Text>
          <Text variant="h3" center style={{ marginTop: Spacing.md }}>
            Objeto no encontrado
          </Text>
          <Button onPress={handleBack} style={{ marginTop: Spacing.xl }}>
            Volver
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const typeConfig = TYPE_CONFIG[item.type];
  const statusConfig = STATUS_CONFIG[item.status];
  const isOwner = user?.id === item.reported_by;
  const canClaim = item.status === 'open';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text variant="h2">Detalle</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Photo */}
        {item.photo_url ? (
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <Image source={{ uri: item.photo_url }} style={styles.image} resizeMode="cover" />
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeInDown.delay(150).springify()}
            style={[styles.imagePlaceholder, { backgroundColor: colors.surface }]}
          >
            <Package size={48} color={colors.textMuted} />
            <Text variant="bodySm" color="muted" style={{ marginTop: Spacing.sm }}>
              Sin imagen
            </Text>
          </Animated.View>
        )}

        {/* Status & Type */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.statusRow}>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: isDark ? typeConfig.color + '30' : typeConfig.bgColor },
            ]}
          >
            <Text variant="bodyMedium" customColor={typeConfig.color}>
              {typeConfig.label}
            </Text>
          </View>
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <Text variant="h1" style={styles.title}>
            {item.title}
          </Text>
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>
            Descripcion
          </Text>
          <Card variant="filled" padding="lg">
            <Text variant="body" style={styles.descriptionText}>
              {item.description}
            </Text>
          </Card>
        </Animated.View>

        {/* Location */}
        <Animated.View entering={FadeInDown.delay(350).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>
            {item.type === 'lost' ? 'Donde se perdio' : 'Donde se encontro'}
          </Text>
          <Card variant="filled" padding="md">
            <View style={styles.infoRow}>
              <MapPin size={18} color={colors.accent} />
              <Text variant="bodyMedium" style={styles.infoText}>
                {item.location}
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Contact */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>
            Contacto
          </Text>
          <Card variant="filled" padding="md" pressable onPress={handleCall}>
            <View style={styles.infoRow}>
              <Phone size={18} color={colors.accent} />
              <Text variant="bodyMedium" style={styles.infoText}>
                {item.contact_phone}
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Date */}
        <Animated.View entering={FadeInDown.delay(450).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>
            Fecha de reporte
          </Text>
          <Card variant="filled" padding="md">
            <View style={styles.infoRow}>
              <Calendar size={18} color={colors.textMuted} />
              <Text variant="body" style={styles.infoText}>
                {formatDate(item.created_at)}
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Actions */}
        {canClaim && (
          <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.actionsContainer}>
            <Button
              onPress={handleCall}
              variant="secondary"
              leftIcon={<Phone size={18} color={colors.text} />}
              fullWidth
            >
              Llamar
            </Button>
            {(isOwner || item.type === 'found') && (
              <Button
                onPress={handleClaim}
                variant="primary"
                loading={isClaiming}
                leftIcon={<CheckCircle size={18} color={colors.textOnAccent} />}
                fullWidth
                style={{ marginTop: Spacing.sm }}
              >
                Marcar como reclamado
              </Button>
            )}
          </Animated.View>
        )}

        {item.status === 'claimed' && (
          <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.claimedBanner}>
            <CheckCircle size={20} color={colors.success} />
            <Text variant="bodyMedium" customColor={colors.success}>
              Este objeto ya fue reclamado
            </Text>
          </Animated.View>
        )}
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
  image: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
  },
  imagePlaceholder: {
    width: '100%',
    height: 160,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  title: { marginBottom: Spacing.md },
  sectionTitle: { marginTop: Spacing.lg, marginBottom: Spacing.sm },
  descriptionText: { lineHeight: 24 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  infoText: { flex: 1 },
  actionsContainer: { marginTop: Spacing.xl },
  claimedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#F0FDF4',
  },
});
