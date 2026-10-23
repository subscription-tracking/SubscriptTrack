import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMutation } from '@tanstack/react-query';

import { useAuth } from '../../auth/AuthProvider';
import { messageForError } from '../../auth/domain/authErrors';
import { useOnlineStatus } from '../../../core/network/useOnlineStatus';
import { borderWidth, colors, gaps, radius, sizes, spacing, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { CheckboxRow } from '../../../shared/widgets/CheckboxRow';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { PasswordField } from '../../../shared/widgets/PasswordField';
import { KeyboardScreen } from '../../../shared/widgets/KeyboardScreen';
import { ScreenBottomInset } from '../../../shared/widgets/ScreenBottomInset';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { TextField } from '../../../shared/widgets/TextField';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { DeleteAccountError, requestAccountDeletion } from '../data/accountRepository';
import { CONFIRM_WORD, hasDeleteErrors, type DeleteAccountErrors, validateDeleteAccount } from '../domain/deleteAccountRules';
import { SettingsPanel } from './SettingsControls';

const OFFLINE_MESSAGE = 'Hesabını silmek için internet bağlantısı gerekir.';

/**
 * Hesabı sil (Flutter `DeleteAccountScreen`). Kalıcıdır: hesap, abonelikler, ödeme kayıtları, tasarruf geçmişi ve
 * dışa aktarma dosyaları silinir. Yakın giriş için şifre yeniden doğrulanır; "sil" yazılması ve silinecekleri
 * anlama onayı da gerekir (Flutter'da yalnızca şifre ve "sil" vardır; onay kutusu Expo'nun ek güvencesidir).
 */
export function DeleteAccountScreen() {
  useThemeRevision();
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
      // Yakın giriş: şifre yeniden doğrulanır, sonra silme isteği gönderilir.
      await signIn(user.email, password);
      await requestAccountDeletion();
    },
    onSuccess: async () => {
      snackbar.show('Hesabın silindi.', 'default');
      try {
        await signOut({ accountDeleted: true });
      } catch {
        // Hesap silindi; yerel oturum temizlenemezse yönlendirme oturum kapısında yapılır.
      }
    },
    onError: (error: unknown) => {
      if (error instanceof DeleteAccountError) {
        snackbar.show(error.message, 'error');
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
    <KeyboardScreen style={styles.screen}>
      <ScreenTopBar title="Hesabı sil" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.warning}>
          <MaterialIcons name="warning" size={sizes.iconButtonSize} color={colors.error} />
          <Text style={textStyle('bodySmall', { color: colors.onErrorContainer, marginLeft: spacing.md, flex: 1 })}>
            Bu işlem geri alınamaz. Hesabın ve tüm abonelik verilerin kalıcı olarak silinecek.
          </Text>
        </View>

        <View style={styles.gapLarge} />
        <SettingsPanel style={styles.formPanel}>
        <Text style={textStyle('bodySmall')}>Devam etmek için şifreni gir:</Text>
        <View style={styles.gap} />
        <PasswordField
          label="Şifre"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          editable={!remove.isPending}
        />

        <View style={styles.gapLarge} />
        <Text style={textStyle('bodySmall')}>{`Onaylamak için aşağıya "${CONFIRM_WORD}" yaz:`}</Text>
        <View style={styles.gap} />
        <TextField
          label={CONFIRM_WORD}
          value={confirmation}
          onChangeText={setConfirmation}
          error={errors.confirmation}
          editable={!remove.isPending}
        />

        <View style={styles.gap} />
        <CheckboxRow checked={acknowledged} onChange={setAcknowledged}>
          <Text style={textStyle('bodySmall')}>Silinecek verileri anladım.</Text>
        </CheckboxRow>
        {errors.acknowledged ? <Text style={textStyle('caption', { color: colors.error, marginTop: spacing.xs })}>{errors.acknowledged}</Text> : null}
        {!online ? <Text style={textStyle('caption', { color: colors.error, marginTop: spacing.xs })}>{OFFLINE_MESSAGE}</Text> : null}

        <View style={styles.gapLarge} />
        <PrimaryButton
          label="Hesabı kalıcı olarak sil"
          tone="danger"
          loading={remove.isPending}
          disabled={!online}
          onPress={submit}
        />
        </SettingsPanel>
        <ScreenBottomInset />
      </ScrollView>
    </KeyboardScreen>
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
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.medium,
    borderWidth: borderWidth.hairline,
    borderColor: withAlpha(colors.error, 0.4),
    backgroundColor: colors.errorContainer,
  },
  formPanel: {
    padding: spacing.md,
  },
  gap: {
    height: spacing.xs,
  },
  gapLarge: {
    height: gaps.sectionTop - 4,
  },
  bottom: {
    height: sizes.bottomNavHeight,
  },
}));
