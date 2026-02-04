/**
 * KASETA - Scan Screen
 * QR code scanner for guards with real Supabase validation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Button, Card, Input, Badge, Avatar, Skeleton } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  validateInvitation,
  registerAccess,
  Invitation,
  InvitationType,
} from '@/lib/invitations';
import { supabase } from '@/lib/supabase';

type ScanMode = 'qr' | 'code';
type ScanState = 'idle' | 'scanning' | 'validating' | 'success' | 'error';

interface AccessLog {
  id: string;
  visitor_name: string;
  direction: 'entry' | 'exit';
  entry_type: 'invitation' | 'manual' | 'resident';
  created_at: string;
}

const INVITATION_TYPE_LABELS: Record<InvitationType, string> = {
  single: 'Visita única',
  recurring: 'Acceso recurrente',
  temporary: 'Acceso temporal',
};

export default function ScanScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentOrganization, canScanAccess } = useOrganization();
  const { user } = useAuth();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanMode, setScanMode] = useState<ScanMode>('qr');
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [manualCode, setManualCode] = useState('');
  const [validatedInvitation, setValidatedInvitation] = useState<Invitation | null>(null);
  const [validationMessage, setValidationMessage] = useState('');
  const [recentLogs, setRecentLogs] = useState<AccessLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isScanning, setIsScanning] = useState(true);

  // Animation values
  const shakeX = useSharedValue(0);
  const scale = useSharedValue(1);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Fetch recent access logs
  const fetchRecentLogs = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      setIsLoadingLogs(true);
      const { data, error } = await supabase
        .from('access_logs')
        .select('id, visitor_name, direction, entry_type, created_at')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      // Transform Supabase response (arrays to objects for related data)
      const transformedData = (data || []).map((log: any) => ({
        ...log,
        unit: Array.isArray(log.unit) ? log.unit[0] : log.unit,
      }));
      setRecentLogs(transformedData as AccessLog[]);
    } catch (error) {
      console.error('Error fetching recent logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    fetchRecentLogs();
  }, [fetchRecentLogs]);

  const handleModeChange = (mode: ScanMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScanMode(mode);
    setScanState('idle');
    setValidatedInvitation(null);
    setValidationMessage('');
    setIsScanning(true);
  };

  const handleValidateCode = async (code: string) => {
    if (!code || code.length < 6) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setScanState('validating');
    setIsScanning(false);

    const result = await validateInvitation(code);

    if (result.valid && result.invitation) {
      setScanState('success');
      setValidatedInvitation(result.invitation);
      setValidationMessage(result.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      scale.value = withSequence(
        withSpring(1.05),
        withSpring(1)
      );
    } else {
      setScanState('error');
      setValidatedInvitation(result.invitation);
      setValidationMessage(result.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  };

  const handleBarCodeScanned = useCallback(({ data }: { data: string }) => {
    if (!isScanning || scanState !== 'idle') return;
    handleValidateCode(data);
  }, [isScanning, scanState]);

  const handleManualSubmit = () => {
    handleValidateCode(manualCode);
  };

  const handleAllowEntry = async () => {
    if (!validatedInvitation || !user?.id) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const { success, error } = await registerAccess(
      validatedInvitation.id,
      user.id,
      'entry'
    );

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Acceso registrado',
        `Se ha registrado la entrada de ${validatedInvitation.visitor_name}`,
        [{ text: 'OK', onPress: handleReset }]
      );
      fetchRecentLogs();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'No se pudo registrar el acceso. Intente de nuevo.');
    }
  };

  const handleDenyEntry = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    handleReset();
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScanState('idle');
    setValidatedInvitation(null);
    setValidationMessage('');
    setManualCode('');
    setIsScanning(true);
  };

  const formatRelativeTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  // No permission for scanning
  if (!canScanAccess) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centeredContent}>
          <Text variant="h1" center style={{ marginBottom: Spacing.md }}>
            🔒
          </Text>
          <Text variant="h3" center style={{ marginBottom: Spacing.sm }}>
            Sin permisos
          </Text>
          <Text variant="body" color="secondary" center>
            No tienes permisos para escanear códigos de acceso.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Result state (success or error)
  if ((scanState === 'success' || scanState === 'error') && (validatedInvitation || validationMessage)) {
    const isValid = scanState === 'success';

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <Animated.View
            entering={FadeIn.springify()}
            style={[styles.resultContainer, scaleStyle]}
          >
            {/* Status indicator */}
            <Animated.View
              style={[
                styles.statusIndicator,
                { backgroundColor: isValid ? colors.successBg : colors.errorBg },
                shakeStyle,
              ]}
            >
              <Text variant="h1">{isValid ? '✓' : '✕'}</Text>
            </Animated.View>

            <Text
              variant="h2"
              center
              customColor={isValid ? colors.success : colors.error}
              style={styles.statusTitle}
            >
              {isValid ? 'Invitación Válida' : 'Invitación Inválida'}
            </Text>

            <Text variant="body" color="secondary" center style={styles.statusMessage}>
              {validationMessage}
            </Text>

            {/* Invitation details card */}
            {validatedInvitation && (
              <Card variant="outlined" style={styles.resultCard} padding="lg">
                <View style={styles.resultHeader}>
                  <Avatar name={validatedInvitation.visitor_name} size="lg" />
                  <View style={styles.resultInfo}>
                    <Text variant="h3">{validatedInvitation.visitor_name}</Text>
                    <Text variant="bodySm" color="secondary">
                      Visitante
                    </Text>
                  </View>
                </View>

                <View style={[styles.resultDetails, { borderTopColor: colors.border }]}>
                  <View style={styles.resultRow}>
                    <Text variant="bodySm" color="muted">
                      Tipo de acceso
                    </Text>
                    <Text variant="bodyMedium">
                      {INVITATION_TYPE_LABELS[validatedInvitation.type]}
                    </Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text variant="bodySm" color="muted">
                      Válida hasta
                    </Text>
                    <Text variant="bodyMedium">
                      {new Date(validatedInvitation.valid_until).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  {validatedInvitation.notes && (
                    <View style={[styles.resultRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                      <Text variant="bodySm" color="muted" style={{ marginBottom: Spacing.xs }}>
                        Notas
                      </Text>
                      <Text variant="body">{validatedInvitation.notes}</Text>
                    </View>
                  )}
                </View>
              </Card>
            )}

            {/* Actions */}
            {isValid ? (
              <View style={styles.actionButtons}>
                <Button
                  onPress={handleAllowEntry}
                  fullWidth
                  style={styles.allowButton}
                >
                  Permitir entrada
                </Button>
                <Button
                  variant="ghost"
                  onPress={handleDenyEntry}
                  fullWidth
                >
                  Denegar
                </Button>
              </View>
            ) : (
              <View style={styles.actionButtons}>
                <Button
                  variant="destructive"
                  onPress={handleDenyEntry}
                  fullWidth
                >
                  No permitir entrada
                </Button>
                <Button variant="ghost" onPress={handleReset} fullWidth>
                  Escanear otra
                </Button>
              </View>
            )}
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text variant="h1" style={styles.title}>
            Escanear
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Escanea el código QR o ingresa el código manualmente
          </Text>
        </Animated.View>

        {/* Mode Toggle */}
        <Animated.View
          entering={FadeInDown.delay(150).springify()}
          style={[styles.toggleContainer, { backgroundColor: colors.surface }]}
        >
          <Pressable
            onPress={() => handleModeChange('qr')}
            style={[
              styles.toggleButton,
              scanMode === 'qr' && { backgroundColor: colors.background },
            ]}
          >
            <Text
              variant="bodyMedium"
              color={scanMode === 'qr' ? 'default' : 'muted'}
            >
              📷 Escanear QR
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleModeChange('code')}
            style={[
              styles.toggleButton,
              scanMode === 'code' && { backgroundColor: colors.background },
            ]}
          >
            <Text
              variant="bodyMedium"
              color={scanMode === 'code' ? 'default' : 'muted'}
            >
              ⌨️ Código manual
            </Text>
          </Pressable>
        </Animated.View>

        {/* Scanner / Manual Input */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={styles.scannerContainer}
        >
          {scanMode === 'qr' ? (
            permission?.granted ? (
              <View style={styles.cameraContainer}>
                <CameraView
                  style={styles.camera}
                  facing="back"
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                  }}
                  onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
                />
                <View style={styles.cameraOverlay}>
                  <View style={[styles.scanFrame, { borderColor: colors.accent }]} />
                </View>
                {scanState === 'validating' && (
                  <Animated.View
                    entering={FadeIn}
                    exiting={FadeOut}
                    style={styles.validatingOverlay}
                  >
                    <View style={[styles.validatingBox, { backgroundColor: colors.background }]}>
                      <Text variant="bodyMedium">Validando...</Text>
                    </View>
                  </Animated.View>
                )}
              </View>
            ) : (
              <Card variant="filled" style={styles.scannerPlaceholder} padding="lg">
                <Text variant="h1" center style={styles.cameraIcon}>
                  📷
                </Text>
                <Text variant="h3" center style={styles.cameraTitle}>
                  {permission === null ? 'Cargando...' : 'Permiso de cámara requerido'}
                </Text>
                <Text variant="body" color="secondary" center>
                  {permission === null
                    ? 'Verificando permisos de cámara...'
                    : 'Necesitamos acceso a tu cámara para escanear códigos QR'
                  }
                </Text>
                {permission && !permission.granted && (
                  <Button
                    variant="secondary"
                    onPress={requestPermission}
                    style={styles.switchModeButton}
                  >
                    Permitir cámara
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onPress={() => handleModeChange('code')}
                  style={{ marginTop: Spacing.sm }}
                >
                  Usar código manual
                </Button>
              </Card>
            )
          ) : (
            <Card variant="outlined" style={styles.manualInputCard} padding="lg">
              <Text variant="h3" center style={styles.manualTitle}>
                Ingresa el código
              </Text>
              <Text variant="bodySm" color="secondary" center style={styles.manualSubtitle}>
                El código de 6 caracteres que aparece en la invitación
              </Text>

              <Input
                placeholder="ABC123"
                value={manualCode}
                onChangeText={(text) => setManualCode(text.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
                containerStyle={styles.codeInput}
                inputContainerStyle={styles.codeInputContainer}
              />

              <Button
                onPress={handleManualSubmit}
                disabled={manualCode.length < 6}
                loading={scanState === 'validating'}
                fullWidth
              >
                Verificar código
              </Button>
            </Card>
          )}
        </Animated.View>

        {/* Manual Entry Button */}
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <Card
            pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/(app)/manual-entry');
            }}
            variant="outlined"
            style={styles.manualEntryCard}
            padding="md"
          >
            <View style={styles.manualEntryContent}>
              <Text variant="body">📝</Text>
              <View style={styles.manualEntryInfo}>
                <Text variant="bodyMedium">Entrada manual</Text>
                <Text variant="caption" color="muted">
                  Registrar visitante sin invitación
                </Text>
              </View>
              <Text variant="body" color="accent">→</Text>
            </View>
          </Card>
        </Animated.View>

        {/* Recent scans */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text variant="h4" style={styles.recentTitle}>
            Escaneos recientes
          </Text>

          {isLoadingLogs ? (
            <Card variant="filled" style={styles.recentCard} padding="md">
              <View style={styles.recentRow}>
                <Skeleton width={40} height={40} variant="circular" />
                <View style={styles.recentInfo}>
                  <Skeleton width={120} height={16} style={{ marginBottom: Spacing.xs }} />
                  <Skeleton width={80} height={14} />
                </View>
                <Skeleton width={60} height={24} />
              </View>
            </Card>
          ) : recentLogs.length === 0 ? (
            <Card variant="filled" style={styles.recentCard} padding="md">
              <Text variant="bodySm" color="muted" center>
                Sin escaneos recientes
              </Text>
            </Card>
          ) : (
            <View style={styles.recentList}>
              {recentLogs.map((log, index) => (
                <Card
                  key={log.id}
                  variant="filled"
                  style={[styles.recentCard, index > 0 && { marginTop: Spacing.sm }]}
                  padding="md"
                >
                  <View style={styles.recentRow}>
                    <Avatar name={log.visitor_name || 'Visitante'} size="sm" />
                    <View style={styles.recentInfo}>
                      <Text variant="bodySmMedium">{log.visitor_name || 'Visitante'}</Text>
                      <Text variant="caption" color="muted">
                        {formatRelativeTime(log.created_at)}
                      </Text>
                    </View>
                    <Badge
                      variant={log.direction === 'entry' ? 'success' : 'default'}
                      size="sm"
                    >
                      {log.direction === 'entry' ? 'Entrada' : 'Salida'}
                    </Badge>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.lg,
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: Spacing.xs,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.smd,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  scannerContainer: {
    marginBottom: Spacing.xl,
  },
  cameraContainer: {
    height: 280,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
  },
  validatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  validatingBox: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  scannerPlaceholder: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  cameraIcon: {
    marginBottom: Spacing.md,
  },
  cameraTitle: {
    marginBottom: Spacing.sm,
  },
  switchModeButton: {
    marginTop: Spacing.lg,
  },
  manualInputCard: {
    alignItems: 'center',
  },
  manualTitle: {
    marginBottom: Spacing.xs,
  },
  manualSubtitle: {
    marginBottom: Spacing.lg,
  },
  codeInput: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  codeInputContainer: {
    alignItems: 'center',
  },
  manualEntryCard: {
    marginBottom: Spacing.lg,
  },
  manualEntryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  manualEntryInfo: {
    flex: 1,
  },
  recentTitle: {
    marginBottom: Spacing.md,
  },
  recentList: {},
  recentCard: {},
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentInfo: {
    flex: 1,
    marginLeft: Spacing.smd,
  },
  resultContainer: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  statusIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  statusTitle: {
    marginBottom: Spacing.sm,
  },
  statusMessage: {
    marginBottom: Spacing.xl,
  },
  resultCard: {
    marginBottom: Spacing.xl,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  resultInfo: {
    marginLeft: Spacing.md,
  },
  resultDetails: {
    borderTopWidth: 1,
    paddingTop: Spacing.md,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  actionButtons: {
    gap: Spacing.sm,
  },
  allowButton: {
    marginBottom: Spacing.xs,
  },
});
