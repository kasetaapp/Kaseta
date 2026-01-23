/**
 * KASETA - Package Detail Screen
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Package, Truck, CheckCircle, Clock, Calendar, User, Copy } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Text, Card, Badge, Skeleton, Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';

const STATUS_CONFIG = {
  pending: { label: 'En tránsito', color: '#F59E0B', icon: Truck },
  received: { label: 'Recibido', color: '#3B82F6', icon: Package },
  picked_up: { label: 'Entregado', color: '#10B981', icon: CheckCircle },
  returned: { label: 'Devuelto', color: '#6B7280', icon: Clock },
};

export default function PackageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const [pkg, setPkg] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const fetchPackage = useCallback(async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('packages')
        .select(`
          *,
          received_by_user:received_by(full_name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setPkg(data);
    } catch (error) {
      console.error('Error fetching package:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPackage();
  }, [fetchPackage]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleCopyTracking = async () => {
    if (!pkg?.tracking_number) return;
    await Clipboard.setStringAsync(pkg.tracking_number);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copiado', 'Número de rastreo copiado');
  };

  const handleMarkAsPickedUp = async () => {
    if (!pkg) return;

    Alert.alert(
      'Confirmar recogida',
      '¿Marcar este paquete como recogido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setMarking(true);
            try {
              const { error } = await supabase
                .from('packages')
                .update({
                  status: 'picked_up',
                  picked_up_at: new Date().toISOString(),
                })
                .eq('id', pkg.id);

              if (error) throw error;

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              fetchPackage();
            } catch (error) {
              console.error('Error updating package:', error);
              Alert.alert('Error', 'No se pudo actualizar el paquete');
            } finally {
              setMarking(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  if (!pkg) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Paquete</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text variant="h1" center>😕</Text>
          <Text variant="h3" center style={{ marginTop: Spacing.md }}>Paquete no encontrado</Text>
          <Button onPress={handleBack} style={{ marginTop: Spacing.xl }}>Volver</Button>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = STATUS_CONFIG[pkg.status as keyof typeof STATUS_CONFIG];
  const StatusIcon = statusConfig.icon;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text variant="h2">Paquete</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.statusContainer}>
          <View style={[styles.statusIcon, { backgroundColor: statusConfig.color + '20' }]}>
            <StatusIcon size={32} color={statusConfig.color} />
          </View>
          <Badge variant="default" size="md">{statusConfig.label}</Badge>
        </Animated.View>

        {/* Carrier & Description */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text variant="h1" style={styles.title}>{pkg.carrier || 'Paquete'}</Text>
          {pkg.description && (
            <Text variant="body" color="secondary" style={styles.description}>
              {pkg.description}
            </Text>
          )}
        </Animated.View>

        {/* Tracking Number */}
        {pkg.tracking_number && (
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>Número de rastreo</Text>
            <Card variant="filled" padding="md">
              <Pressable onPress={handleCopyTracking} style={styles.trackingRow}>
                <Text variant="bodyMedium" style={styles.trackingNumber}>
                  {pkg.tracking_number}
                </Text>
                <Copy size={18} color={colors.accent} />
              </Pressable>
            </Card>
          </Animated.View>
        )}

        {/* Timeline */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>Historial</Text>
          <Card variant="filled" padding="md">
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: '#3B82F6' }]} />
              <View style={styles.timelineContent}>
                <Text variant="bodyMedium">Recibido en caseta</Text>
                <View style={styles.timelineInfo}>
                  <Calendar size={14} color={colors.textMuted} />
                  <Text variant="caption" color="muted">{formatDate(pkg.received_at)}</Text>
                </View>
                {pkg.received_by_user?.full_name && (
                  <View style={styles.timelineInfo}>
                    <User size={14} color={colors.textMuted} />
                    <Text variant="caption" color="muted">
                      Por: {pkg.received_by_user.full_name}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {pkg.picked_up_at && (
              <View style={[styles.timelineItem, { marginTop: Spacing.md }]}>
                <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]} />
                <View style={styles.timelineContent}>
                  <Text variant="bodyMedium">Recogido por residente</Text>
                  <View style={styles.timelineInfo}>
                    <Calendar size={14} color={colors.textMuted} />
                    <Text variant="caption" color="muted">{formatDate(pkg.picked_up_at)}</Text>
                  </View>
                </View>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Action Button */}
        {pkg.status === 'received' && (
          <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.actionContainer}>
            <Button
              onPress={handleMarkAsPickedUp}
              loading={marking}
              fullWidth
              size="lg"
            >
              Marcar como recogido
            </Button>
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
  statusContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  statusIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  title: { marginBottom: Spacing.xs },
  description: { marginBottom: Spacing.lg },
  sectionTitle: { marginTop: Spacing.lg, marginBottom: Spacing.sm },
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackingNumber: { fontFamily: 'monospace' },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4, marginRight: Spacing.sm },
  timelineContent: { flex: 1 },
  timelineInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xs },
  actionContainer: { marginTop: Spacing.xl },
});
