/**
 * KASETA - Access Log Detail Screen
 * View details of a specific access event
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Clock,
  User,
  Home,
  Shield,
  FileText,
  QrCode,
} from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Shadows, DarkShadows } from '@/constants/Shadows';
import { Text, Card, Badge, Avatar, Skeleton, Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';

interface AccessLogDetail {
  id: string;
  organization_id: string;
  invitation_id: string | null;
  unit_id: string | null;
  visitor_name: string | null;
  access_type: 'entry' | 'exit';
  method: 'qr_scan' | 'manual_code' | 'manual_entry';
  accessed_at: string;
  authorized_by: string;
  notes: string | null;
  unit?: {
    id: string;
    name: string;
    identifier: string | null;
  };
  authorizer?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  invitation?: {
    id: string;
    visitor_name: string;
    visitor_phone: string | null;
    visitor_email: string | null;
    access_type: string;
    short_code: string | null;
  };
}

const METHOD_LABELS: Record<string, string> = {
  qr_scan: 'Escaneo de QR',
  manual_code: 'Código manual',
  manual_entry: 'Entrada manual',
};

export default function AccessLogDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;
  const shadows = isDark ? DarkShadows : Shadows;

  const [log, setLog] = useState<AccessLogDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLog = useCallback(async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('access_logs')
        .select(`
          *,
          unit:units(id, name, identifier),
          authorizer:profiles!authorized_by(id, full_name, avatar_url),
          invitation:invitations(id, visitor_name, visitor_phone, visitor_email, access_type, short_code)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Transform response
      const transformedData = {
        ...data,
        unit: Array.isArray(data.unit) ? data.unit[0] : data.unit,
        authorizer: Array.isArray(data.authorizer) ? data.authorizer[0] : data.authorizer,
        invitation: Array.isArray(data.invitation) ? data.invitation[0] : data.invitation,
      };

      setLog(transformedData as AccessLogDetail);
    } catch (error) {
      console.error('Error fetching access log:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const handleViewInvitation = useCallback(() => {
    if (!log?.invitation_id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/(app)/invitation/[id]',
      params: { id: log.invitation_id },
    });
  }, [log]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };
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
          <Skeleton width="100%" height={120} style={{ marginBottom: Spacing.lg }} />
          <Skeleton width="100%" height={200} />
        </View>
      </SafeAreaView>
    );
  }

  if (!log) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Registro</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text variant="displayLg" center>😕</Text>
          <Text variant="h3" center style={styles.errorTitle}>
            Registro no encontrado
          </Text>
          <Text variant="body" color="secondary" center>
            El registro que buscas no existe
          </Text>
          <Button onPress={handleBack} style={styles.errorButton}>
            Volver
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const isEntry = log.access_type === 'entry';
  const { date, time } = formatDateTime(log.accessed_at);

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
        <Text variant="h2">Detalle de acceso</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <Animated.View entering={FadeIn.delay(150).springify()}>
          <Card
            variant="elevated"
            padding="lg"
            style={[
              styles.statusCard,
              shadows.md,
              { borderLeftColor: isEntry ? colors.success : colors.warning, borderLeftWidth: 4 },
            ]}
          >
            <View style={styles.statusHeader}>
              <View
                style={[
                  styles.statusIcon,
                  { backgroundColor: isEntry ? colors.successBg : colors.warningBg },
                ]}
              >
                {isEntry ? (
                  <ArrowDownLeft size={28} color={colors.success} />
                ) : (
                  <ArrowUpRight size={28} color={colors.warning} />
                )}
              </View>
              <View style={styles.statusInfo}>
                <Text variant="h3">{log.visitor_name || 'Visitante'}</Text>
                <Badge variant={isEntry ? 'success' : 'warning'} size="md">
                  {isEntry ? 'Entrada' : 'Salida'}
                </Badge>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Details */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text variant="h4" style={styles.sectionTitle}>
            Información
          </Text>
          <Card variant="filled" padding="md">
            <View style={styles.detailRow}>
              <Calendar size={18} color={colors.textMuted} />
              <View style={styles.detailContent}>
                <Text variant="caption" color="muted">Fecha</Text>
                <Text variant="bodyMedium">{date}</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.detailRow}>
              <Clock size={18} color={colors.textMuted} />
              <View style={styles.detailContent}>
                <Text variant="caption" color="muted">Hora</Text>
                <Text variant="bodyMedium">{time}</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.detailRow}>
              <QrCode size={18} color={colors.textMuted} />
              <View style={styles.detailContent}>
                <Text variant="caption" color="muted">Método</Text>
                <Text variant="bodyMedium">{METHOD_LABELS[log.method]}</Text>
              </View>
            </View>

            {log.unit && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.detailRow}>
                  <Home size={18} color={colors.textMuted} />
                  <View style={styles.detailContent}>
                    <Text variant="caption" color="muted">Unidad</Text>
                    <Text variant="bodyMedium">
                      {log.unit.name}
                      {log.unit.identifier && ` (${log.unit.identifier})`}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {log.notes && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.detailRow}>
                  <FileText size={18} color={colors.textMuted} />
                  <View style={styles.detailContent}>
                    <Text variant="caption" color="muted">Notas</Text>
                    <Text variant="body">{log.notes}</Text>
                  </View>
                </View>
              </>
            )}
          </Card>
        </Animated.View>

        {/* Authorized By */}
        {log.authorizer && (
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>
              Autorizado por
            </Text>
            <Card variant="filled" padding="md">
              <View style={styles.authorizerRow}>
                <Avatar
                  name={log.authorizer.full_name || 'Guardia'}
                  source={log.authorizer.avatar_url}
                  size="md"
                />
                <View style={styles.authorizerInfo}>
                  <Text variant="bodyMedium">
                    {log.authorizer.full_name || 'Guardia'}
                  </Text>
                  <View style={styles.authorizerRole}>
                    <Shield size={12} color={colors.textMuted} />
                    <Text variant="caption" color="muted">Personal de seguridad</Text>
                  </View>
                </View>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Related Invitation */}
        {log.invitation && (
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>
              Invitación relacionada
            </Text>
            <Card
              variant="outlined"
              padding="md"
              pressable
              onPress={handleViewInvitation}
            >
              <View style={styles.invitationRow}>
                <View style={styles.invitationInfo}>
                  <Text variant="bodyMedium">{log.invitation.visitor_name}</Text>
                  <Text variant="caption" color="muted">
                    Código: {log.invitation.short_code}
                  </Text>
                </View>
                <Text variant="body" color="accent">Ver →</Text>
              </View>
            </Card>
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
  errorTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorButton: {
    marginTop: Spacing.xl,
  },
  statusCard: {
    marginBottom: Spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  statusInfo: {
    flex: 1,
    gap: Spacing.sm,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  detailContent: {
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.xs,
  },
  authorizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorizerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  authorizerRole: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xxs,
  },
  invitationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  invitationInfo: {
    flex: 1,
  },
});
