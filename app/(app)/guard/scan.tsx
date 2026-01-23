/**
 * KASETA - Guard QR Scanner Screen
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { X, Flashlight, FlashlightOff, CheckCircle, XCircle } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Button, Card } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.7;

interface ScanResult {
  success: boolean;
  message: string;
  visitorName?: string;
  unitNumber?: string;
  invitationId?: string;
}

export default function GuardScanScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [processing, setProcessing] = useState(false);

  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleToggleTorch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTorch(!torch);
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || processing) return;

    setScanned(true);
    setProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Parse QR data - could be invitation ID or short code
      let invitationId = data;
      
      // Check if it's a short code (6 characters)
      if (data.length === 6) {
        const { data: invitation, error } = await supabase
          .from('invitations')
          .select('id')
          .eq('short_code', data.toUpperCase())
          .single();

        if (error || !invitation) {
          setScanResult({
            success: false,
            message: 'Código no encontrado',
          });
          return;
        }
        invitationId = invitation.id;
      }

      // Fetch invitation details
      const { data: invitation, error: invError } = await supabase
        .from('invitations')
        .select(`
          *,
          unit:unit_id(unit_number, building)
        `)
        .eq('id', invitationId)
        .single();

      if (invError || !invitation) {
        setScanResult({
          success: false,
          message: 'Invitación no encontrada',
        });
        return;
      }

      // Validate invitation
      if (invitation.status === 'expired') {
        setScanResult({
          success: false,
          message: 'Invitación expirada',
          visitorName: invitation.visitor_name,
        });
        return;
      }

      if (invitation.status === 'cancelled') {
        setScanResult({
          success: false,
          message: 'Invitación cancelada',
          visitorName: invitation.visitor_name,
        });
        return;
      }

      if (invitation.status === 'used' && invitation.type === 'single') {
        setScanResult({
          success: false,
          message: 'Invitación ya utilizada',
          visitorName: invitation.visitor_name,
        });
        return;
      }

      if (invitation.valid_until && new Date(invitation.valid_until) < new Date()) {
        setScanResult({
          success: false,
          message: 'Invitación vencida',
          visitorName: invitation.visitor_name,
        });
        return;
      }

      // Valid invitation - create access log
      await supabase.from('access_logs').insert({
        organization_id: currentOrganization?.id,
        unit_id: invitation.unit_id,
        invitation_id: invitation.id,
        visitor_name: invitation.visitor_name,
        visitor_phone: invitation.visitor_phone,
        vehicle_plate: invitation.vehicle_plate,
        access_type: 'invitation',
        entry_method: 'qr',
        direction: 'entry',
        granted_by: user?.id,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setScanResult({
        success: true,
        message: 'Acceso autorizado',
        visitorName: invitation.visitor_name,
        unitNumber: invitation.unit?.building 
          ? `${invitation.unit.building} - ${invitation.unit.unit_number}`
          : invitation.unit?.unit_number,
        invitationId: invitation.id,
      });

    } catch (error) {
      console.error('Scan error:', error);
      setScanResult({
        success: false,
        message: 'Error al procesar',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScanned(false);
    setScanResult(null);
  };

  if (!permission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text variant="body" color="muted">Cargando cámara...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text variant="h3" center style={{ marginBottom: Spacing.md }}>
            Permiso de cámara requerido
          </Text>
          <Text variant="body" color="muted" center style={{ marginBottom: Spacing.xl }}>
            Necesitamos acceso a la cámara para escanear códigos QR
          </Text>
          <Button onPress={requestPermission}>Permitir cámara</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top Bar */}
        <SafeAreaView edges={['top']}>
          <View style={styles.topBar}>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#FFF" />
            </Pressable>
            <Text variant="h3" customColor="#FFF">
              Escanear QR
            </Text>
            <Pressable onPress={handleToggleTorch} style={styles.torchButton}>
              {torch ? (
                <FlashlightOff size={24} color="#FFF" />
              ) : (
                <Flashlight size={24} color="#FFF" />
              )}
            </Pressable>
          </View>
        </SafeAreaView>

        {/* Scan Frame */}
        <View style={styles.scanFrameContainer}>
          <View style={[styles.scanFrame, { width: SCAN_SIZE, height: SCAN_SIZE }]}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          {!scanResult && (
            <Text variant="body" customColor="#FFF" center style={{ marginTop: Spacing.lg }}>
              Apunta al código QR de la invitación
            </Text>
          )}
        </View>

        {/* Result */}
        {scanResult && (
          <Animated.View entering={FadeInDown.springify()} style={styles.resultContainer}>
            <Card
              variant="elevated"
              padding="lg"
              style={[
                styles.resultCard,
                { borderColor: scanResult.success ? colors.success : colors.error },
              ]}
            >
              <View style={styles.resultHeader}>
                {scanResult.success ? (
                  <CheckCircle size={48} color={colors.success} />
                ) : (
                  <XCircle size={48} color={colors.error} />
                )}
              </View>

              <Text
                variant="h2"
                center
                customColor={scanResult.success ? colors.success : colors.error}
              >
                {scanResult.message}
              </Text>

              {scanResult.visitorName && (
                <Text variant="h3" center style={{ marginTop: Spacing.md }}>
                  {scanResult.visitorName}
                </Text>
              )}

              {scanResult.unitNumber && (
                <Text variant="body" color="secondary" center>
                  Unidad {scanResult.unitNumber}
                </Text>
              )}

              <View style={styles.resultActions}>
                <Button
                  variant={scanResult.success ? 'primary' : 'secondary'}
                  onPress={handleReset}
                  fullWidth
                >
                  Escanear otro
                </Button>
                {scanResult.success && (
                  <Button variant="secondary" onPress={handleClose} fullWidth>
                    Cerrar
                  </Button>
                )}
              </View>
            </Card>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  overlay: { ...StyleSheet.absoluteFillObject },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  closeButton: { padding: Spacing.sm },
  torchButton: { padding: Spacing.sm },
  scanFrameContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: BorderRadius.lg,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#FFF',
  },
  topLeft: { top: -1, left: -1, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: BorderRadius.lg },
  topRight: { top: -1, right: -1, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: BorderRadius.lg },
  bottomLeft: { bottom: -1, left: -1, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: BorderRadius.lg },
  bottomRight: { bottom: -1, right: -1, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: BorderRadius.lg },
  resultContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  resultCard: { borderWidth: 2 },
  resultHeader: { alignItems: 'center', marginBottom: Spacing.md },
  resultActions: { marginTop: Spacing.lg, gap: Spacing.sm },
});
