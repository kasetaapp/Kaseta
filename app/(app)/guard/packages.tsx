/**
 * KASETA - Guard Packages Screen
 * Log and manage incoming packages
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Plus, Package, Building2, X, Truck } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Badge, Skeleton, EmptyState, Button, Input } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface PackageItem {
  id: string;
  tracking_number: string | null;
  carrier: string | null;
  description: string | null;
  status: string;
  received_at: string;
  unit: { unit_number: string; building: string | null } | { unit_number: string; building: string | null }[] | null;
}

export default function GuardPackagesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [unitNumber, setUnitNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPackages = useCallback(async () => {
    if (!currentOrganization) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('packages')
        .select(`
          id,
          tracking_number,
          carrier,
          description,
          status,
          received_at,
          unit:unit_id(unit_number, building)
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'received')
        .order('received_at', { ascending: false });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchPackages();
    setRefreshing(false);
  }, [fetchPackages]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleAddPackage = async () => {
    if (!unitNumber.trim()) {
      Alert.alert('Error', 'El número de unidad es requerido');
      return;
    }

    if (!currentOrganization || !user?.id) {
      Alert.alert('Error', 'No autorizado');
      return;
    }

    setSubmitting(true);

    try {
      // Find unit
      const { data: unit, error: unitError } = await supabase
        .from('units')
        .select('id')
        .eq('organization_id', currentOrganization.id)
        .eq('unit_number', unitNumber.trim())
        .single();

      if (unitError || !unit) {
        Alert.alert('Error', `Unidad ${unitNumber} no encontrada`);
        setSubmitting(false);
        return;
      }

      // Create package
      const { error } = await supabase.from('packages').insert({
        organization_id: currentOrganization.id,
        unit_id: unit.id,
        carrier: carrier.trim() || null,
        tracking_number: trackingNumber.trim() || null,
        description: description.trim() || null,
        status: 'received',
        received_by: user.id,
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAddModal(false);
      resetForm();
      fetchPackages();
      Alert.alert('Éxito', 'Paquete registrado');
    } catch (error) {
      console.error('Error creating package:', error);
      Alert.alert('Error', 'No se pudo registrar el paquete');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setUnitNumber('');
    setCarrier('');
    setTrackingNumber('');
    setDescription('');
  };

  const formatTime = (dateStr: string): string => {
    return new Date(dateStr).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderPackage = ({ item, index }: { item: PackageItem; index: number }) => (
    <Animated.View entering={FadeIn.delay(index * 50)}>
      <Card variant="elevated" style={styles.packageCard} padding="md">
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: '#F59E0B20' }]}>
            <Package size={24} color="#F59E0B" />
          </View>
          <View style={styles.cardInfo}>
            <Text variant="h4">{item.carrier || 'Paquete'}</Text>
            {item.tracking_number && (
              <Text variant="caption" color="muted">#{item.tracking_number}</Text>
            )}
          </View>
          <Badge variant="warning" size="sm">Pendiente</Badge>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.unitInfo}>
            <Building2 size={14} color={colors.textMuted} />
            <Text variant="bodySm" color="muted">
              {(() => {
                const unit = Array.isArray(item.unit) ? item.unit[0] : item.unit;
                return unit?.building ? `${unit.building} - Unidad ${unit?.unit_number}` : `Unidad ${unit?.unit_number}`;
              })()}
            </Text>
          </View>
          <Text variant="caption" color="muted">{formatTime(item.received_at)}</Text>
        </View>
      </Card>
    </Animated.View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Paquetes</Text>
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
        <Text variant="h2">Paquetes</Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowAddModal(true);
          }}
          style={[styles.addButton, { backgroundColor: colors.accent }]}
        >
          <Plus size={20} color={colors.textOnAccent} />
        </Pressable>
      </Animated.View>

      {packages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="📦"
            title="Sin paquetes pendientes"
            description="Los paquetes por entregar aparecerán aquí"
          />
        </View>
      ) : (
        <FlatList
          data={packages}
          keyExtractor={(item) => item.id}
          renderItem={renderPackage}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
            />
          }
          ListHeaderComponent={
            <Text variant="caption" color="muted" style={styles.countText}>
              {packages.length} paquetes pendientes
            </Text>
          }
        />
      )}

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowAddModal(false)} />
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text variant="h3">Registrar paquete</Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <X size={24} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formRow}>
                <Building2 size={20} color={colors.textMuted} />
                <Input
                  placeholder="Número de unidad *"
                  value={unitNumber}
                  onChangeText={setUnitNumber}
                  style={styles.formInput}
                />
              </View>
              <View style={styles.formRow}>
                <Truck size={20} color={colors.textMuted} />
                <Input
                  placeholder="Paquetería (FedEx, DHL, etc.)"
                  value={carrier}
                  onChangeText={setCarrier}
                  style={styles.formInput}
                />
              </View>
              <View style={styles.formRow}>
                <Package size={20} color={colors.textMuted} />
                <Input
                  placeholder="Número de rastreo"
                  value={trackingNumber}
                  onChangeText={setTrackingNumber}
                  style={styles.formInput}
                />
              </View>
              <Input
                placeholder="Descripción (opcional)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.modalFooter}>
              <Button
                variant="secondary"
                onPress={() => setShowAddModal(false)}
                style={{ flex: 1 }}
              >
                Cancelar
              </Button>
              <Button
                onPress={handleAddPackage}
                loading={submitting}
                disabled={!unitNumber.trim()}
                style={{ flex: 1 }}
              >
                Registrar
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  addButton: { padding: Spacing.sm, borderRadius: BorderRadius.md },
  content: { flex: 1, paddingHorizontal: Spacing.lg },
  emptyContainer: { flex: 1, justifyContent: 'center', padding: Spacing.lg },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  countText: { marginBottom: Spacing.md },
  packageCard: { marginBottom: Spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, marginLeft: Spacing.md },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  unitInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Spacing.xxxl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalBody: { padding: Spacing.lg, gap: Spacing.md },
  formRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  formInput: { flex: 1 },
  modalFooter: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.lg },
});
