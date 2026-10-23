import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';

import { useAuth } from '../../auth/AuthProvider';
import { messageForError } from '../../auth/domain/authErrors';
import { PASSWORD_REQUIREMENT, validateLoginPassword, validateNewPassword } from '../../auth/domain/authRules';
import { formatTimestampDate } from '../../../core/format/date';
import { colors, gaps, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { PasswordField } from '../../../shared/widgets/PasswordField';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { KeyboardScreen } from '../../../shared/widgets/KeyboardScreen';
import { ScreenBottomInset } from '../../../shared/widgets/ScreenBottomInset';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { TextField } from '../../../shared/widgets/TextField';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { useUserTimeZone } from '../data/useActiveCurrency';
import { SettingsPanel } from './SettingsControls';

/** Flutter `ProfileScreen`: başlık (avatar, e-posta, üyelik tarihi), görünen ad, e-posta ve şifre değiştirme. */
export function ProfileScreen() {
  useThemeRevision();
  const { user } = useAuth();
  if (!user) return null;
  return (
    <KeyboardScreen style={styles.screen}>
      <ScreenTopBar title="Profil" />
      <ProfileBody email={user.email} displayName={user.displayName} createdAt={user.createdAt} />
    </KeyboardScreen>
  );
}

function ProfileBody({ email, displayName, createdAt }: { email: string; displayName: string | null; createdAt: string }) {
  useThemeRevision();
  const { updateDisplayName, updateEmail, updatePassword, signIn } = useAuth();
  const snackbar = useSnackbar();
  const timeZone = useUserTimeZone();
  // Ad yoksa alan boş kalır; e-posta öneki ad olarak gösterilmez.
  const currentName = displayName?.trim() ?? '';
  const [name, setName] = useState(currentName);
  const [newEmail, setNewEmail] = useState(email);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [submitted, setSubmitted] = useState(false);

  const nameChanged = name.trim().length > 0 && name.trim() !== currentName;
  const emailChanged = newEmail.trim().toLowerCase() !== email.toLowerCase();
  const passwordReady =
    passwords.current.length > 0 && validateNewPassword(passwords.next) === null && passwords.next === passwords.confirm;

  const passwordTouched = passwords.current.length > 0 || passwords.next.length > 0 || passwords.confirm.length > 0;

  const nameSave = useMutation({
    mutationFn: () => updateDisplayName(name.trim()),
    onSuccess: () => snackbar.show('İsim güncellendi.', 'primary'),
    onError: (error: unknown) => snackbar.show(messageForError(error), 'error'),
  });

  const emailSave = useMutation({
    mutationFn: () => updateEmail(newEmail),
    onSuccess: () => snackbar.show('E-posta güncellendi. Yeni adresine doğrulama bağlantısı gönderildi.', 'primary'),
    onError: (error: unknown) => snackbar.show(messageForError(error), 'error'),
  });

  const passwordSave = useMutation({
    mutationFn: async () => {
      // Mevcut şifreyi doğrula: yeniden oturum açmak, şifre değişiminin sahibini kanıtlar.
      await signIn(email, passwords.current);
      await updatePassword(passwords.next);
    },
    onSuccess: () => {
      setPasswords({ current: '', next: '', confirm: '' });
      setSubmitted(false);
      snackbar.show('Şifren güncellendi.', 'primary');
    },
    onError: (error: unknown) => snackbar.show(messageForError(error), 'error'),
  });

  const confirmError = submitted && passwords.next !== passwords.confirm ? 'Şifreler eşleşmiyor.' : null;

  function submitPassword() {
    setSubmitted(true);
    if (validateLoginPassword(passwords.current) || validateNewPassword(passwords.next) || confirmError) return;
    passwordSave.mutate();
  }

  const initial = (displayName?.trim() ? displayName.trim() : email).charAt(0).toUpperCase();
  const memberSince = formatTimestampDate(createdAt, timeZone);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <SettingsPanel style={styles.header}>
        <View style={styles.avatar}>
          <Text style={textStyle('headline', { color: colors.onPrimaryContainer })}>{initial}</Text>
        </View>
        <Text style={textStyle('bodySmall', { marginTop: spacing.xs })}>{email}</Text>
        <Text style={textStyle('bodySmall', { marginTop: spacing.xxs / 2 })}>{`Üyelik tarihi: ${memberSince}`}</Text>
      </SettingsPanel>

      <View style={styles.gap28} />
      <SettingsPanel style={styles.formPanel}>
      <Text style={textStyle('bodyStrong')}>İsim</Text>
      <View style={styles.gap8} />
      <TextField label="Adın" prefixIcon="person-outline" value={name} onChangeText={setName} placeholder="Adını gir" editable={!nameSave.isPending} />
      {nameChanged ? (
        <>
          <View style={styles.gap12} />
          <PrimaryButton label="Adı kaydet" tall={false} loading={nameSave.isPending} onPress={() => nameSave.mutate()} />
        </>
      ) : null}
      </SettingsPanel>

      <View style={styles.gap28} />
      <SettingsPanel style={styles.formPanel}>
      <Text style={textStyle('bodyStrong')}>E-posta</Text>
      <View style={styles.gap8} />
      <TextField label="E-posta" prefixIcon="email" value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" autoComplete="email" editable={!emailSave.isPending} />
      <Text style={textStyle('caption', { color: colors.onSurfaceVariant, marginTop: spacing.xxs })}>
        E-postanı değiştirirsen yeni adresine doğrulama bağlantısı gönderilir.
      </Text>
      {emailChanged ? (
        <>
          <View style={styles.gap12} />
          <PrimaryButton label="E-postayı güncelle" tall={false} loading={emailSave.isPending} onPress={() => emailSave.mutate()} />
        </>
      ) : null}
      </SettingsPanel>

      <View style={styles.gap32} />
      <SettingsPanel style={styles.formPanel}>
      <Text style={textStyle('bodyStrong')}>Şifre değiştir</Text>
      <View style={styles.gap12} />
      <PasswordField
        label="Mevcut şifre"
        value={passwords.current}
        onChangeText={(current) => setPasswords((prev) => ({ ...prev, current }))}
        error={submitted ? validateLoginPassword(passwords.current) : null}
        editable={!passwordSave.isPending}
      />
      <View style={styles.gap12} />
      <PasswordField
        label={`Yeni şifre (${PASSWORD_REQUIREMENT.toLowerCase()})`}
        value={passwords.next}
        onChangeText={(next) => setPasswords((prev) => ({ ...prev, next }))}
        error={submitted ? validateNewPassword(passwords.next) : null}
        editable={!passwordSave.isPending}
      />
      <View style={styles.gap12} />
      <PasswordField
        label="Yeni şifre (tekrar)"
        value={passwords.confirm}
        onChangeText={(confirm) => setPasswords((prev) => ({ ...prev, confirm }))}
        error={confirmError}
        editable={!passwordSave.isPending}
      />
      {passwordTouched ? (
        <>
          <View style={styles.gap12} />
          <PrimaryButton label="Şifreyi güncelle" tall={false} loading={passwordSave.isPending} disabled={!passwordReady} onPress={submitPassword} />
        </>
      ) : null}
      </SettingsPanel>
      <ScreenBottomInset />
    </ScrollView>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  formPanel: {
    padding: spacing.md,
  },
  avatar: {
    width: sizes.profileAvatar,
    height: sizes.profileAvatar,
    borderRadius: sizes.profileAvatar / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryContainer,
  },
  gap8: {
    height: spacing.xs,
  },
  gap12: {
    height: gaps.rowLoose - 2,
  },
  gap20: {
    height: gaps.cardInset + spacing.xxs,
  },
  gap28: {
    height: gaps.sectionTop,
  },
  gap32: {
    height: spacing.xxl,
  },
  bottom: {
    height: sizes.bottomNavHeight,
  },
}));
