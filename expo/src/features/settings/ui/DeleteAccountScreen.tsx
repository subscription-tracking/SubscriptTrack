import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';

import { useAuth } from '../../auth/AuthProvider';
import { messageForError } from '../../auth/domain/authErrors';
import { useOnlineStatus } from '../../../core/network/useOnlineStatus';
import { colors, radius, screenGutter, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { CheckboxRow } from '../../../shared/widgets/CheckboxRow';
import { PasswordField } from '../../../shared/widgets/PasswordField';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { Spacer } from '../../../shared/widgets/Spacer';
import { TextField } from '../../../shared/widgets/TextField';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { DeleteAccountError, requestAccountDeletion } from '../data/accountRepository';
import { CONFIRM_WORD, hasDeleteErrors, type DeleteAccountErrors, validateDeleteAccount } from '../domain/deleteAccountRules';

const OFFLINE_MESSAGE = 'Hesabını silmek için internet bağlantısı gerekir.';

/**
 * Hesabı sil. Kalıcıdır: hesap, abonelikler, ödeme kayıtları, tasarruf geçmişi ve dışa aktarma
 * dosyaları silinir. Yakın giriş için parola yeniden istenir.
 */
export function DeleteAccountScreen() {
  const { user, signIn, signOut } = useAuth();
  const online = useOnlineStatus();
  const snackbar = useSnackbar();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [errors, setErrors] = useState<DeleteAccountErrors>({});

  const remove = useMutation({
    mutationFn: async () => {
      if (!online) throw new Error(OFFLINE_MESSAGE);
      if (!user?.email) throw new Error('Oturum bulunamadı. Yeniden giriş yap.');
      // Yakın giriş: parolayı yeniden doğrula, sonra silme isteği gönder.
      await signIn(user.email, password);
      await requestAccountDeletion();
    },
    onSuccess: async () => {
      snackbar.show('Hesabın silindi.', 'default');
      try {
        await signOut();
      } catch {
        // Hesap silindi; yerel oturum temizlenemezse yönlendirme oturum kapısında yapılır.
      }
    },
    onError: (error: unknown) => {
      if (error instanceof DeleteAccountError || (error instanceof Error && error.message === OFFLINE_MESSAGE)) {
        snackbar.show((error as Error).message, 'error');
        return;
      }
      snackbar.show(messageForError(error), 'error');
    },
  });

  function submit() {
    const next = validateDeleteAccount({ password, confirmation, acknowledged });
    setErrors(next);
    if (hasDeleteErrors(next)) return;
    remove.mutate();
  }

  return (
    <View style={styles.screen}>
      <ScreenTopBar title="Hesabı sil" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={textStyle('titleSmall', { color: colors.error })}>Bu işlem geri alınamaz</Text>
          <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>
            Hesabın, tüm aboneliklerin, ödeme kayıtların, tasarruf geçmişin ve dışa aktarma dosyaların kalıcı olarak silinir.
          </Text>
          {!online ? <Text style={textStyle('caption', { color: colors.error })}>{OFFLINE_MESSAGE}</Text> : null}
        </View>

        <Spacer size={spacing.md} />
        <View style={styles.card}>
          <PasswordField label="Şifren" value={password} onChangeText={setPassword} error={errors.password} editable={!remove.isPending} />
          <TextField
            label={`Onaylamak için "${CONFIRM_WORD}" yaz`}
            value={confirmation}
            onChangeText={setConfirmation}
            error={errors.confirmation}
            editable={!remove.isPending}
          />
          <CheckboxRow checked={acknowledged} onChange={setAcknowledged}>
            <Text style={textStyle('bodySmall')}>Silinecek verileri anladım.</Text>
          </CheckboxRow>
          {errors.acknowledged ? <Text style={textStyle('caption', { color: colors.error })}>{errors.acknowledged}</Text> : null}
          <PrimaryButton label="Hesabımı kalıcı olarak sil" onPress={submit} loading={remove.isPending} disabled={!online} />
        </View>
        <Spacer size={sizes.bottomNavHeight} />
      </ScrollView>
    </View>
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
