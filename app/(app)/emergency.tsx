/**
 * KASETA - Emergency Contacts Screen
 * Quick access to emergency numbers and community contacts
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Phone, AlertTriangle, Shield, Flame, Heart, Building2 } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Card, Skeleton } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase';

// Default emergency numbers for Mexico
const DEFAULT_EMERGENCY_CONTACTS = [
  {
    id: 'emergency-911',
    name: 'Emergencias',
    phone: '911',
    icon: AlertTriangle,
    color: '#EF4444',
    description: 'Policía, Ambulancia, Bomberos',
  },
  {
    id: 'police',
    name: 'Policía',
    phone: '911',
    icon: Shield,
    color: '#3B82F6',
    description: 'Seguridad pública',
  },
  {
    id: 'fire',
    name: 'Bomberos',
    phone: '911',
    icon: Flame,
    color: '#F97316',
    description: 'Incendios y rescate',
  },
  {
    id: 'ambulance',
    name: 'Cruz Roja',
    phone: '065',
    icon: Heart,
    color: '#DC2626',
    description: 'Emergencias médicas',
  },
];

interface CommunityContact {
  id: string;
  name: string;
  phone: string;
  role: string;
  is_emergency: boolean;
}

export default function EmergencyScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentOrganization } = useOrganization();

  const [communityContacts, setCommunityContacts] = useState<CommunityContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchContacts = useCallback(async () => {
    if (!currentOrganization) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('community_contacts')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('is_emergency', { ascending: false })
        .order('name');

      if (error) throw error;
      setCommunityContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchContacts();
    setRefreshing(false);
  }, [fetchContacts]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleCall = (phone: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      `Llamar a ${name}`,
      `¿Deseas llamar al ${phone}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Llamar',
          onPress: () => Linking.openURL(`tel:${phone}`),
        },
      ]
    );
  };

  const handleEmergencyCall = (phone: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Linking.openURL(`tel:${phone}`);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Emergencias</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.content}>
          <Skeleton width="100%" height={120} />
          <Skeleton width="100%" height={200} style={{ marginTop: Spacing.lg }} />
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
        <Text variant="h2">Emergencias</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* Emergency Warning */}
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <Card variant="filled" padding="md" style={[styles.warningCard, { backgroundColor: '#FEF3C7' }]}>
            <View style={styles.warningContent}>
              <AlertTriangle size={20} color="#D97706" />
              <Text variant="bodySm" customColor="#92400E" style={styles.warningText}>
                En caso de emergencia real, llama al 911 inmediatamente
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* National Emergency Numbers */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>Números de emergencia</Text>
          <View style={styles.emergencyGrid}>
            {DEFAULT_EMERGENCY_CONTACTS.map((contact, index) => {
              const IconComponent = contact.icon;
              return (
                <Animated.View key={contact.id} entering={FadeIn.delay(index * 50)}>
                  <Pressable
                    onPress={() => handleEmergencyCall(contact.phone)}
                    style={[styles.emergencyCard, { backgroundColor: contact.color + '15' }]}
                  >
                    <View style={[styles.emergencyIcon, { backgroundColor: contact.color + '25' }]}>
                      <IconComponent size={24} color={contact.color} />
                    </View>
                    <Text variant="h4" style={styles.emergencyName}>{contact.name}</Text>
                    <Text variant="h1" customColor={contact.color}>{contact.phone}</Text>
                    <Text variant="caption" color="muted" center>{contact.description}</Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* Community Contacts */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>Contactos de la comunidad</Text>

          {communityContacts.length === 0 ? (
            <Card variant="filled" padding="lg">
              <View style={styles.emptyState}>
                <Building2 size={32} color={colors.textMuted} />
                <Text variant="body" color="muted" center style={{ marginTop: Spacing.sm }}>
                  No hay contactos de la comunidad configurados
                </Text>
              </View>
            </Card>
          ) : (
            communityContacts.map((contact, index) => (
              <Animated.View key={contact.id} entering={FadeIn.delay(index * 50)}>
                <Card
                  variant="elevated"
                  style={styles.contactCard}
                  padding="md"
                  pressable
                  onPress={() => handleCall(contact.phone, contact.name)}
                >
                  <View style={styles.contactRow}>
                    <View style={styles.contactInfo}>
                      <View style={styles.contactHeader}>
                        <Text variant="h4">{contact.name}</Text>
                        {contact.is_emergency && (
                          <View style={[styles.emergencyBadge, { backgroundColor: colors.error + '15' }]}>
                            <AlertTriangle size={12} color={colors.error} />
                            <Text variant="caption" customColor={colors.error}>Emergencia</Text>
                          </View>
                        )}
                      </View>
                      <Text variant="bodySm" color="muted">{contact.role}</Text>
                    </View>
                    <Pressable
                      onPress={() => handleCall(contact.phone, contact.name)}
                      style={[styles.callButton, { backgroundColor: colors.success + '15' }]}
                    >
                      <Phone size={20} color={colors.success} />
                    </Pressable>
                  </View>
                </Card>
              </Animated.View>
            ))
          )}
        </Animated.View>

        {/* Safety Tips */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>Consejos de seguridad</Text>
          <Card variant="filled" padding="md">
            <View style={styles.tipItem}>
              <Text variant="body">🚨</Text>
              <Text variant="bodySm" style={styles.tipText}>
                Mantén la calma y proporciona tu ubicación exacta al llamar a emergencias
              </Text>
            </View>
            <View style={[styles.tipItem, { marginTop: Spacing.md }]}>
              <Text variant="body">🏥</Text>
              <Text variant="bodySm" style={styles.tipText}>
                Ten a la mano información médica importante y alergias conocidas
              </Text>
            </View>
            <View style={[styles.tipItem, { marginTop: Spacing.md }]}>
              <Text variant="body">🔑</Text>
              <Text variant="bodySm" style={styles.tipText}>
                Conoce las salidas de emergencia de tu edificio y punto de reunión
              </Text>
            </View>
            <View style={[styles.tipItem, { marginTop: Spacing.md }]}>
              <Text variant="body">📱</Text>
              <Text variant="bodySm" style={styles.tipText}>
                Mantén tu teléfono cargado y guarda estos números en tus contactos
              </Text>
            </View>
          </Card>
        </Animated.View>
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
  content: { flex: 1, paddingHorizontal: Spacing.lg },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  warningCard: { borderRadius: BorderRadius.lg },
  warningContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  warningText: { flex: 1 },
  sectionTitle: { marginTop: Spacing.xl, marginBottom: Spacing.md },
  emergencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  emergencyCard: {
    width: '47%',
    minWidth: 150,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  emergencyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emergencyName: { marginBottom: Spacing.xxs },
  emptyState: { alignItems: 'center', padding: Spacing.lg },
  contactCard: { marginBottom: Spacing.sm },
  contactRow: { flexDirection: 'row', alignItems: 'center' },
  contactInfo: { flex: 1 },
  contactHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  emergencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.sm,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  tipText: { flex: 1, lineHeight: 20 },
});
