import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../../auth/AuthProvider';
import { messageForError } from '../../auth/domain/authErrors';
import { validateNewPassword, validatePasswordConfirmation, validateLoginPassword } from '../../auth/domain/authRules';
import { colors, radius, screenGutter, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { ChoiceChips, type ChoiceOption } from '../../../shared/widgets/ChoiceChips';
import { PasswordField } from '../../../shared/widgets/PasswordField';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { Spacer } from '../../../shared/widgets/Spacer';
import { TextField } from '../../../shared/widgets/TextField';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { fetchProfile, type Profile, saveProfile } from '../data/profileRepository';
import { PREFERRED_CURRENCIES, type PreferredCurrency, type ProfileErrors, validateProfile } from '../domain/profileRules';

const CURRENCY_OPTIONS: ChoiceOption<PreferredCurrency>[] = PREFERRED_CURRENCIES.map((value) => ({ value, label: value }));

/** Profil: ad, soyad, tercih edilen para birimi ve şifre değiştirme. */
export function ProfileScreen() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['profile', user?.id ?? ''],
    queryFn: () => fetchProfile(user?.id ?? ''),
    enabled: Boolean(user),
    networkMode: 'always',
  });

  const state: AsyncState<Profile> = query.isPending
    ? { status: 'loading' }
    : query.isError
      ? { status: 'error', message: 'Profil yüklenemedi. Tekrar dene.', onRetry: () => void query.refetch() }
      : { status: 'ready', data: query.data };

  return (
    <View style={styles.screen}>
      <ScreenTopBar title="Profil" />
      <AsyncStateView state={state}>
        {(profile) => <ProfileForm profile={profile} email={user?.email ?? ''} />}
      </AsyncStateView>
    </View>
  );
}

function ProfileForm({ profile, email }: { profile: Profile; email: string }) {
  const { user, updatePassword, signIn } = useAuth();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const [values, setValues] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    preferredCurrency: profile.preferredCurrency,
  });
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordErrors, setPasswordErrors] = useState<{ current?: string | null; next?: string | null; confirm?: string | null }>({});

  const save = useMutation({
    mutationFn: () => {
      if (!user) throw new Error('Oturum bulunamadı. Yeniden giriş yap.');
      return saveProfile(user.id, values);
    },
    onSuccess: async () => {
      if (user) await queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      snackbar.show('Profil kaydedildi.', 'primary');
    },
    onError: (error: Error) => snackbar.show(error.message, 'error'),
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      // Mevcut şifreyi doğrula: yeniden oturum açmak, şifre değişiminin sahibini kanıtlar.
      await signIn(email, passwords.current);
      await updatePassword(passwords.next);
    },
    onSuccess: () => {
      setPasswords({ current: '', next: '', confirm: '' });
      snackbar.show('Şifre güncellendi.', 'primary');
    },
    onError: (error: unknown) => snackbar.show(messageForError(error), 'error'),
  });

  function submitProfile() {
    const next = validateProfile(values);
    setErrors(next);
    if (next.firstName || next.lastName) return;
    save.mutate();
  }

  function submitPassword() {
    const next = {
      current: validateLoginPassword(passwords.current),
      next: validateNewPassword(passwords.next),
      confirm: validatePasswordConfirmation(passwords.next, passwords.confirm, 'Şifreler eşleşmiyor.'),
    };
    setPasswordErrors(next);
    if (next.current || next.next || next.confirm) return;
    changePassword.mutate();
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>E-posta</Text>
        <Text style={textStyle('bodySmall')}>{email}</Text>
        <Spacer size={spacing.xs} />
        <TextField label="Ad" value={values.firstName} onChangeText={(firstName) => setValues((c) => ({ ...c, firstName }))} error={errors.firstName} maxLength={60} editable={!save.isPending} />
        <TextField label="Soyad" value={values.lastName} onChangeText={(lastName) => setValues((c) => ({ ...c, lastName }))} error={errors.lastName} maxLength={60} editable={!save.isPending} />
        <Text style={textStyle('label', { color: colors.onSurfaceVariant })}>Tercih edilen para birimi</Text>
        <ChoiceChips
          options={CURRENCY_OPTIONS}
          value={values.preferredCurrency}
          onChange={(preferredCurrency) => setValues((c) => ({ ...c, preferredCurrency }))}
        />
        <PrimaryButton label="Profili kaydet" onPress={submitProfile} loading={save.isPending} />
      </View>

      <Spacer size={spacing.lg} />
      <View style={styles.card}>
        <Text style={textStyle('titleSmall')}>Şifre değiştir</Text>
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>Önce mevcut şifreni gir.</Text>
        <PasswordField
          label="Mevcut şifre"
          value={passwords.current}
          onChangeText={(current) => setPasswords((c) => ({ ...c, current }))}
          error={passwordErrors.current}
          editable={!changePassword.isPending}
        />
        <PasswordField
          label="Yeni şifre"
          value={passwords.next}
          onChangeText={(next) => setPasswords((c) => ({ ...c, next }))}
          error={passwordErrors.next}
          editable={!changePassword.isPending}
        />
        <PasswordField
          label="Yeni şifre (tekrar)"
          value={passwords.confirm}
          onChangeText={(confirm) => setPasswords((c) => ({ ...c, confirm }))}
          error={passwordErrors.confirm}
          editable={!changePassword.isPending}
        />
        <PrimaryButton label="Şifreyi güncelle" onPress={submitPassword} loading={changePassword.isPending} />
      </View>
      <Spacer size={sizes.bottomNavHeight} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xxl,
  },
  content: {
    paddingHorizontal: screenGutter,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.outline,
    gap: spacing.sm,
  },
});
