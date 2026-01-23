/**
 * KASETA - Join Organization Screen
 * Join an organization with invite code and unit selection
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Check, Home, Building2 } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Button, Input, Card, Skeleton } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface OrganizationPreview {
  id: string;
  name: string;
  type: string;
  memberCount?: number;
}

interface Unit {
  id: string;
  name: string;
  identifier: string | null;
}

const ORG_TYPE_LABELS: Record<string, string> = {
  residential: 'Residencial',
  corporate: 'Corporativo',
  educational: 'Educativo',
  industrial: 'Industrial',
  healthcare: 'Salud',
  events: 'Eventos',
};

const ORG_TYPE_ICONS: Record<string, string> = {
  residential: '🏠',
  corporate: '🏢',
  educational: '🎓',
  industrial: '🏭',
  healthcare: '🏥',
  events: '🎪',
};

export default function JoinOrganizationScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { user } = useAuth();

  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [organization, setOrganization] = useState<OrganizationPreview | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [loadingUnits, setLoadingUnits] = useState(false);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleCodeChange = (code: string) => {
    // Format: uppercase, alphanumeric only
    const formatted = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setInviteCode(formatted);

    // Reset organization preview when code changes
    if (organization) {
      setOrganization(null);
      setUnits([]);
      setSelectedUnit(null);
    }
  };

  // Fetch units when organization is verified
  const fetchUnits = useCallback(async (organizationId: string) => {
    setLoadingUnits(true);
    try {
      const { data, error } = await supabase
        .from('units')
        .select('id, name, identifier')
        .eq('organization_id', organizationId)
        .order('identifier', { ascending: true });

      if (error) throw error;

      setUnits(data || []);
      // Auto-select if only one unit
      if (data && data.length === 1) {
        setSelectedUnit(data[0]);
      }
    } catch (err) {
      console.error('Error fetching units:', err);
    } finally {
      setLoadingUnits(false);
    }
  }, []);

  const handleSelectUnit = useCallback((unit: Unit) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedUnit(unit);
  }, []);

  const handleVerifyCode = useCallback(async () => {
    if (inviteCode.length < 6) {
      Alert.alert('Error', 'El código debe tener al menos 6 caracteres.');
      return;
    }

    setVerifying(true);

    try {
      // Look up organization by invite code
      // In production, this would be a separate invite_codes table
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, type')
        .eq('slug', inviteCode.toLowerCase())
        .single();

      if (error || !data) {
        Alert.alert('Error', 'Código de invitación no válido.');
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setOrganization(data as OrganizationPreview);

      // Fetch available units for this organization
      await fetchUnits(data.id);
    } catch (err) {
      Alert.alert('Error', 'No se pudo verificar el código.');
    } finally {
      setVerifying(false);
    }
  }, [inviteCode, fetchUnits]);

  const handleJoin = useCallback(async () => {
    if (!organization || !user) return;

    // Require unit selection if units are available
    if (units.length > 0 && !selectedUnit) {
      Alert.alert('Selecciona tu unidad', 'Por favor selecciona tu departamento, casa u oficina.');
      return;
    }

    setLoading(true);

    try {
      // Check if already a member
      const { data: existingMembership } = await supabase
        .from('memberships')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', organization.id)
        .single();

      if (existingMembership) {
        Alert.alert('Ya eres miembro', 'Ya perteneces a esta organización.');
        router.back();
        return;
      }

      // Create membership with unit
      const { error } = await supabase.from('memberships').insert({
        user_id: user.id,
        organization_id: organization.id,
        unit_id: selectedUnit?.id || null,
        role: 'resident',
        is_active: true,
      });

      if (error) {
        Alert.alert('Error', 'No se pudo unir a la organización.');
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '¡Bienvenido!',
        `Te has unido a ${organization.name}${selectedUnit ? ` - ${selectedUnit.name}` : ''}.`,
        [{ text: 'OK', onPress: () => router.replace('/(app)/(tabs)/home') }]
      );
    } catch (err) {
      Alert.alert('Error', 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  }, [organization, user, units, selectedUnit]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={styles.header}
          >
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Text variant="body" color="secondary">
                ← Atrás
              </Text>
            </Pressable>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <Text variant="h1" style={styles.title}>
              Unirse a organización
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              Ingresa el código de invitación que recibiste
            </Text>
          </Animated.View>

          {/* Code Input */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Card variant="filled" padding="lg" style={styles.codeCard}>
              <Input
                label="Código de invitación"
                placeholder="XXXXXX"
                value={inviteCode}
                onChangeText={handleCodeChange}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={12}
              />

              {!organization && (
                <Button
                  onPress={handleVerifyCode}
                  loading={verifying}
                  disabled={inviteCode.length < 6}
                  variant="secondary"
                  fullWidth
                  style={styles.verifyButton}
                >
                  Verificar código
                </Button>
              )}
            </Card>
          </Animated.View>

          {/* Organization Preview */}
          {organization && (
            <Animated.View entering={FadeIn.springify()}>
              <Card
                variant="elevated"
                padding="lg"
                style={[styles.orgCard, { borderColor: colors.accent, borderWidth: 2 }]}
              >
                <View style={styles.orgHeader}>
                  <View
                    style={[
                      styles.orgIcon,
                      { backgroundColor: colors.accent + '20' },
                    ]}
                  >
                    <Text variant="displayLg">
                      {ORG_TYPE_ICONS[organization.type] || '🏢'}
                    </Text>
                  </View>
                  <View style={styles.orgInfo}>
                    <Text variant="h3">{organization.name}</Text>
                    <Text variant="bodySm" color="muted">
                      {ORG_TYPE_LABELS[organization.type] || organization.type}
                    </Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <Text variant="bodySm" color="secondary" center>
                  Te unirás como <Text variant="bodySmMedium">Residente</Text>
                </Text>
              </Card>

              {/* Unit Selection */}
              {loadingUnits ? (
                <Card variant="filled" padding="md" style={styles.unitSelectionCard}>
                  <Skeleton width={150} height={20} style={{ marginBottom: Spacing.md }} />
                  <Skeleton width="100%" height={50} />
                  <Skeleton width="100%" height={50} style={{ marginTop: Spacing.sm }} />
                </Card>
              ) : units.length > 0 ? (
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                  <Text variant="h4" style={styles.unitTitle}>
                    Selecciona tu unidad
                  </Text>
                  <Card variant="filled" padding="sm" style={styles.unitSelectionCard}>
                    {units.map((unit, index) => (
                      <Pressable
                        key={unit.id}
                        onPress={() => handleSelectUnit(unit)}
                        style={[
                          styles.unitItem,
                          {
                            backgroundColor:
                              selectedUnit?.id === unit.id
                                ? colors.accent + '15'
                                : 'transparent',
                            borderColor:
                              selectedUnit?.id === unit.id
                                ? colors.accent
                                : colors.border,
                          },
                          index > 0 && { marginTop: Spacing.sm },
                        ]}
                      >
                        <View style={styles.unitItemContent}>
                          <View
                            style={[
                              styles.unitIcon,
                              { backgroundColor: colors.surface },
                            ]}
                          >
                            <Home size={18} color={colors.textMuted} />
                          </View>
                          <View style={styles.unitItemInfo}>
                            <Text variant="bodyMedium">{unit.name}</Text>
                            {unit.identifier && (
                              <Text variant="caption" color="muted">
                                {unit.identifier}
                              </Text>
                            )}
                          </View>
                        </View>
                        {selectedUnit?.id === unit.id && (
                          <View
                            style={[
                              styles.checkIcon,
                              { backgroundColor: colors.accent },
                            ]}
                          >
                            <Check size={14} color={colors.textOnAccent} />
                          </View>
                        )}
                      </Pressable>
                    ))}
                  </Card>
                </Animated.View>
              ) : null}

              <Button
                onPress={handleJoin}
                loading={loading}
                disabled={units.length > 0 && !selectedUnit}
                fullWidth
                style={styles.joinButton}
              >
                {`Unirse a ${organization.name}`}
              </Button>
            </Animated.View>
          )}

          {/* Help Text */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={styles.helpContainer}
          >
            <Text variant="caption" color="muted" center>
              ¿No tienes un código? Contacta al administrador de tu residencial, edificio o empresa para obtener uno.
            </Text>
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
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.xl,
  },
  codeCard: {
    marginBottom: Spacing.lg,
  },
  verifyButton: {
    marginTop: Spacing.md,
  },
  orgCard: {
    marginBottom: Spacing.lg,
  },
  orgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  orgIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  orgInfo: {
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  joinButton: {
    marginBottom: Spacing.xl,
  },
  helpContainer: {
    paddingHorizontal: Spacing.lg,
  },
  unitTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  unitSelectionCard: {
    marginBottom: Spacing.lg,
  },
  unitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  unitItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  unitIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.smd,
  },
  unitItemInfo: {
    flex: 1,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
