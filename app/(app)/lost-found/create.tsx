/**
 * KASETA - Create Lost/Found Item Report
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
import { ChevronLeft, Search, Eye, MapPin, Phone } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Button, Input, Card } from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

type ItemType = 'lost' | 'found';

const TYPE_OPTIONS = [
  {
    key: 'lost' as ItemType,
    label: 'Perdi algo',
    description: 'Reportar un objeto perdido',
    icon: Search,
    color: '#EF4444',
    bgColor: '#FEF2F2',
  },
  {
    key: 'found' as ItemType,
    label: 'Encontre algo',
    description: 'Reportar un objeto encontrado',
    icon: Eye,
    color: '#10B981',
    bgColor: '#F0FDF4',
  },
];

export default function CreateLostFoundScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  const [type, setType] = useState<ItemType>('lost');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleTypeSelect = (selectedType: ItemType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setType(selectedType);
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Error', 'El titulo es requerido');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'La descripcion es requerida');
      return false;
    }
    if (!location.trim()) {
      Alert.alert('Error', 'La ubicacion es requerida');
      return false;
    }
    if (!contactPhone.trim()) {
      Alert.alert('Error', 'El telefono de contacto es requerido');
      return false;
    }
    return true;
  };

  const handleCreate = useCallback(async () => {
    if (!validateForm()) return;

    if (!currentOrganization?.id || !user?.id) {
      Alert.alert('Error', 'No autorizado');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('lost_found_items').insert({
        organization_id: currentOrganization.id,
        reported_by: user.id,
        type,
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        contact_phone: contactPhone.trim(),
        status: 'open',
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Exito',
        type === 'lost'
          ? 'Tu reporte de objeto perdido ha sido creado'
          : 'Gracias por reportar el objeto encontrado',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error creating report:', error);
      Alert.alert('Error', 'No se pudo crear el reporte');
    } finally {
      setLoading(false);
    }
  }, [type, title, description, location, contactPhone, currentOrganization, user]);

  const isFormValid = title.trim() && description.trim() && location.trim() && contactPhone.trim();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text variant="h2">Nuevo reporte</Text>
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
              Que deseas reportar?
            </Text>
            <View style={styles.typeContainer}>
              {TYPE_OPTIONS.map((option) => {
                const isSelected = type === option.key;
                const IconComponent = option.icon;

                return (
                  <Pressable
                    key={option.key}
                    onPress={() => handleTypeSelect(option.key)}
                    style={[
                      styles.typeCard,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? option.color + '30'
                            : option.bgColor
                          : colors.surface,
                        borderColor: isSelected ? option.color : colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.typeIconContainer,
                        {
                          backgroundColor: isSelected
                            ? option.color + '20'
                            : colors.surfaceHover,
                        },
                      ]}
                    >
                      <IconComponent
                        size={24}
                        color={isSelected ? option.color : colors.textMuted}
                      />
                    </View>
                    <Text
                      variant="bodyMedium"
                      customColor={isSelected ? option.color : colors.text}
                    >
                      {option.label}
                    </Text>
                    <Text
                      variant="caption"
                      color={isSelected ? 'default' : 'muted'}
                      center
                    >
                      {option.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>
              Detalles del objeto
            </Text>
            <Card variant="filled" padding="md">
              <Input
                label="Titulo"
                placeholder={
                  type === 'lost'
                    ? 'Ej: Llaves con llavero azul'
                    : 'Ej: Cartera negra encontrada'
                }
                value={title}
                onChangeText={setTitle}
              />

              <View style={styles.inputSpacing}>
                <Input
                  label="Descripcion"
                  placeholder="Describe el objeto con el mayor detalle posible..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </Card>
          </Animated.View>

          {/* Location */}
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>
              {type === 'lost' ? 'Donde lo perdiste?' : 'Donde lo encontraste?'}
            </Text>
            <Card variant="filled" padding="md">
              <Input
                label="Ubicacion"
                placeholder="Ej: Estacionamiento nivel 2, junto al elevador"
                value={location}
                onChangeText={setLocation}
                leftElement={<MapPin size={18} color={colors.textMuted} />}
              />
            </Card>
          </Animated.View>

          {/* Contact */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text variant="h4" style={styles.sectionTitle}>
              Informacion de contacto
            </Text>
            <Card variant="filled" padding="md">
              <Input
                label="Telefono de contacto"
                placeholder="Ej: 55 1234 5678"
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
                leftElement={<Phone size={18} color={colors.textMuted} />}
              />
            </Card>
          </Animated.View>

          {/* Submit */}
          <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.submitContainer}>
            <Button
              onPress={handleCreate}
              loading={loading}
              disabled={!isFormValid}
              fullWidth
              size="lg"
            >
              {type === 'lost' ? 'Reportar como perdido' : 'Reportar como encontrado'}
            </Button>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: { padding: Spacing.xs },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  sectionTitle: { marginTop: Spacing.lg, marginBottom: Spacing.sm },
  typeContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    gap: Spacing.xs,
  },
  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  inputSpacing: { marginTop: Spacing.md },
  submitContainer: { marginTop: Spacing.xl },
});
