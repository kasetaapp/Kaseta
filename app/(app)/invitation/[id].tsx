/**
 * KASETA - Invitation Detail Screen
 * View invitation details, QR code, and share
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import {
  ChevronLeft,
  Share2,
  Copy,
  Trash2,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Shadows, DarkShadows } from '@/constants/Shadows';
import { Text, Button, Card, Badge, Skeleton, IconButton } from '@/components/ui';
import { useInvitation } from '@/hooks/useInvitations';
import { AccessType, InvitationStatus } from '@/lib/invitations';

const getStatusConfig = (status: InvitationStatus) => {
  const configs: Record<InvitationStatus, { label: string; variant: 'default' | 'success' | 'error' | 'warning' | 'accent' }> = {
    active: { label: 'Activa', variant: 'success' },
    used: { label: 'Usada', variant: 'default' },
    expired: { label: 'Expirada', variant: 'error' },
    cancelled: { label: 'Cancelada', variant: 'warning' },
  };
  return configs[status];
};

const getAccessTypeLabel = (type: AccessType): string => {
  const labels: Record<AccessType, string> = {
    single: 'Uso único',
    multiple: 'Múltiples usos',
    permanent: 'Permanente',
    temporary: 'Temporal',
  };
  return labels[type];
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function InvitationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;
  const shadows = isDark ? DarkShadows : Shadows;

  const { invitation, isLoading, cancel } = useInvitation(id || null);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const handleCopyCode = useCallback(async () => {
    if (!invitation?.short_code) return;

    await Clipboard.setStringAsync(invitation.short_code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copiado', 'Código copiado al portapapeles');
  }, [invitation]);

  const handleShare = useCallback(async () => {
    if (!invitation) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const message = `
¡Hola ${invitation.visitor_name}!

Te comparto esta invitación de acceso:

📍 Código: ${invitation.short_code}
📅 Válida desde: ${formatDate(invitation.valid_from)}
${invitation.valid_until ? `⏰ Válida hasta: ${formatDate(invitation.valid_until)}` : ''}

Presenta este código o el QR al llegar.

Invitación generada con KASETA.
    `.trim();

    try {
      await Share.share({
        message,
        title: 'Invitación de acceso',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [invitation]);

  const handleCancel = useCallback(() => {
    Alert.alert(
      'Cancelar invitación',
      '¿Estás seguro de que deseas cancelar esta invitación? Esta acción no se puede deshacer.',
      [
        {
          text: 'No, mantener',
          style: 'cancel',
        },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            const success = await cancel();
            if (success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            }
          },
        },
      ]
    );
  }, [cancel]);

  // Loading state
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
        <View style={styles.loadingContainer}>
          <Skeleton width={200} height={200} style={{ alignSelf: 'center' }} />
          <Skeleton width="100%" height={100} style={{ marginTop: Spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  if (!invitation) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Invitación</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text variant="displayLg" center>
            😕
          </Text>
          <Text variant="h3" center style={styles.errorTitle}>
            Invitación no encontrada
          </Text>
          <Text variant="body" color="secondary" center>
            La invitación que buscas no existe o fue eliminada
          </Text>
          <Button onPress={handleBack} style={styles.errorButton}>
            Volver
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = getStatusConfig(invitation.status);
  const isActive = invitation.status === 'active';

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
        <Text variant="h2">Invitación</Text>
        <IconButton
          icon={<Share2 size={20} color={colors.text} />}
          onPress={handleShare}
          variant="default"
          size="sm"
        />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* QR Code Card */}
        <Animated.View entering={FadeIn.delay(150).springify()}>
          <Card
            variant="elevated"
            style={[styles.qrCard, shadows.lg]}
            padding="lg"
          >
            <View style={styles.qrHeader}>
              <Badge variant={statusConfig.variant} size="md">
                {statusConfig.label}
              </Badge>
            </View>

            {isActive && (
              <View style={styles.qrContainer}>
                <QRCode
                  value={invitation.qr_code}
                  size={200}
                  color={colors.primary}
                  backgroundColor={colors.background}
                />
              </View>
            )}

            {!isActive && (
              <View style={[styles.qrPlaceholder, { backgroundColor: colors.surface }]}>
                <Text variant="displayLg" center>
                  {invitation.status === 'used' ? '✅' : '❌'}
                </Text>
                <Text variant="body" color="muted" center>
                  Esta invitación ya no es válida
                </Text>
              </View>
            )}

            {/* Short Code */}
            <Pressable
              onPress={handleCopyCode}
              style={[styles.shortCodeContainer, { backgroundColor: colors.surface }]}
            >
              <Text variant="mono" style={styles.shortCode}>
                {invitation.short_code}
              </Text>
              <Copy size={18} color={colors.textMuted} />
            </Pressable>

            <Text variant="caption" color="muted" center style={styles.codeHint}>
              Toca para copiar el código
            </Text>
          </Card>
        </Animated.View>

        {/* Visitor Info */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>
            Visitante
          </Text>
          <Card variant="filled" padding="md">
            <View style={styles.infoRow}>
              <User size={18} color={colors.textMuted} />
              <View style={styles.infoContent}>
                <Text variant="caption" color="muted">
                  Nombre
                </Text>
                <Text variant="bodyMedium">{invitation.visitor_name}</Text>
              </View>
            </View>

            {invitation.visitor_phone && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.infoRow}>
                  <Phone size={18} color={colors.textMuted} />
                  <View style={styles.infoContent}>
                    <Text variant="caption" color="muted">
                      Teléfono
                    </Text>
                    <Text variant="bodyMedium">{invitation.visitor_phone}</Text>
                  </View>
                </View>
              </>
            )}

            {invitation.visitor_email && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.infoRow}>
                  <Mail size={18} color={colors.textMuted} />
                  <View style={styles.infoContent}>
                    <Text variant="caption" color="muted">
                      Email
                    </Text>
                    <Text variant="bodyMedium">{invitation.visitor_email}</Text>
                  </View>
                </View>
              </>
            )}
          </Card>
        </Animated.View>

        {/* Details */}
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>
            Detalles
          </Text>
          <Card variant="filled" padding="md">
            <View style={styles.infoRow}>
              <Calendar size={18} color={colors.textMuted} />
              <View style={styles.infoContent}>
                <Text variant="caption" color="muted">
                  Tipo de acceso
                </Text>
                <Text variant="bodyMedium">
                  {getAccessTypeLabel(invitation.access_type)}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.infoRow}>
              <Clock size={18} color={colors.textMuted} />
              <View style={styles.infoContent}>
                <Text variant="caption" color="muted">
                  Válida desde
                </Text>
                <Text variant="bodyMedium">{formatDate(invitation.valid_from)}</Text>
              </View>
            </View>

            {invitation.valid_until && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.infoRow}>
                  <Clock size={18} color={colors.textMuted} />
                  <View style={styles.infoContent}>
                    <Text variant="caption" color="muted">
                      Válida hasta
                    </Text>
                    <Text variant="bodyMedium">{formatDate(invitation.valid_until)}</Text>
                  </View>
                </View>
              </>
            )}

            {invitation.access_type === 'multiple' && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.infoRow}>
                  <User size={18} color={colors.textMuted} />
                  <View style={styles.infoContent}>
                    <Text variant="caption" color="muted">
                      Usos
                    </Text>
                    <Text variant="bodyMedium">
                      {invitation.current_uses} / {invitation.max_uses}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {invitation.notes && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.infoRow}>
                  <FileText size={18} color={colors.textMuted} />
                  <View style={styles.infoContent}>
                    <Text variant="caption" color="muted">
                      Notas
                    </Text>
                    <Text variant="body">{invitation.notes}</Text>
                  </View>
                </View>
              </>
            )}
          </Card>
        </Animated.View>

        {/* Actions */}
        {isActive && (
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={styles.actions}
          >
            <Button
              variant="primary"
              onPress={handleShare}
              fullWidth
              leftIcon={<Share2 size={18} color={colors.textOnAccent} />}
            >
              Compartir invitación
            </Button>
            <Button
              variant="destructive"
              onPress={handleCancel}
              fullWidth
              leftIcon={<Trash2 size={18} color="#fff" />}
            >
              Cancelar invitación
            </Button>
          </Animated.View>
        )}
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
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  loadingContainer: {
    padding: Spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorButton: {
    marginTop: Spacing.xl,
  },
  qrCard: {
    alignItems: 'center',
  },
  qrHeader: {
    marginBottom: Spacing.lg,
  },
  qrContainer: {
    padding: Spacing.md,
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  shortCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.smd,
    borderRadius: BorderRadius.md,
  },
  shortCode: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 4,
  },
  codeHint: {
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.smd,
    paddingVertical: Spacing.xs,
  },
  infoContent: {
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  actions: {
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
});
