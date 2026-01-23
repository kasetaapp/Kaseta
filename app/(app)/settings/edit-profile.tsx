/**
 * KASETA - Edit Profile Screen
 * Edit user profile information
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
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, DarkColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Text, Button, Input, Avatar, Card } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

export default function EditProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DarkColors : Colors;

  const { user, profile, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [loading, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Descartar cambios',
        '¿Estás seguro de que deseas descartar los cambios?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Descartar',
            style: 'destructive',
            onPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            },
          },
        ]
      );
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.back();
    }
  };

  const handleFieldChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setHasChanges(true);
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          'Necesitamos acceso a tu galería para cambiar la foto de perfil.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setAvatarUrl(result.assets[0].uri);
        setHasChanges(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleSave = useCallback(async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'El nombre es requerido.');
      return;
    }

    setSaving(true);

    try {
      const { error } = await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
        avatar_url: avatarUrl,
      });

      if (error) {
        Alert.alert('Error', error.message || 'No se pudo actualizar el perfil.');
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Éxito', 'Perfil actualizado correctamente.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', 'Ocurrió un error inesperado.');
    } finally {
      setSaving(false);
    }
  }, [fullName, phone, avatarUrl, updateProfile]);

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
            <Text variant="h2">Editar perfil</Text>
            <View style={styles.headerSpacer} />
          </Animated.View>

          {/* Avatar */}
          <Animated.View
            entering={FadeInDown.delay(150).springify()}
            style={styles.avatarSection}
          >
            <Pressable onPress={handlePickImage}>
              <Avatar
                name={fullName || 'Usuario'}
                source={avatarUrl}
                size="xl"
              />
              <View style={[styles.editBadge, { backgroundColor: colors.accent }]}>
                <Text variant="caption" customColor={colors.textOnAccent}>
                  📷
                </Text>
              </View>
            </Pressable>
            <Pressable onPress={handlePickImage}>
              <Text
                variant="bodySm"
                customColor={colors.accent}
                style={styles.changePhotoText}
              >
                Cambiar foto
              </Text>
            </Pressable>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Card variant="filled" padding="md">
              <Input
                label="Nombre completo"
                placeholder="Tu nombre"
                value={fullName}
                onChangeText={handleFieldChange(setFullName)}
                autoCapitalize="words"
                autoComplete="name"
              />

              <View style={styles.inputSpacing}>
                <Input
                  label="Correo electrónico"
                  placeholder="tu@email.com"
                  value={profile?.email || user?.email || ''}
                  editable={false}
                  helperText="El correo no se puede cambiar"
                />
              </View>

              <View style={styles.inputSpacing}>
                <Input
                  label="Teléfono"
                  placeholder="+52 123 456 7890"
                  value={phone}
                  onChangeText={handleFieldChange(setPhone)}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
              </View>
            </Card>
          </Animated.View>

          {/* Save Button */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={styles.buttonContainer}
          >
            <Button
              onPress={handleSave}
              loading={loading}
              disabled={!hasChanges}
              fullWidth
            >
              Guardar cambios
            </Button>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  backButton: {
    paddingVertical: Spacing.xs,
    paddingRight: Spacing.md,
  },
  headerSpacer: {
    width: 60,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoText: {
    marginTop: Spacing.sm,
  },
  inputSpacing: {
    marginTop: Spacing.md,
  },
  buttonContainer: {
    marginTop: Spacing.xl,
  },
});
