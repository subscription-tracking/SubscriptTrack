import { useThemeRevision } from '../../src/shared/design/useThemeRevision';
import { themedStyles } from '../../src/shared/design/themeRuntime';
import { useState } from 'react';
import { spacing , colors } from '../../src/shared/design/tokens';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAuth } from '../../src/features/auth/AuthProvider';
import { messageForError } from '../../src/features/auth/domain/authErrors';
import { PASSWORD_REQUIREMENT, validateNewPassword, validatePasswordConfirmation } from '../../src/features/auth/domain/authRules';

import { textStyle } from '../../src/shared/design/typography';
import { PasswordField } from '../../src/shared/widgets/PasswordField';
import { PrimaryButton } from '../../src/shared/widgets/PrimaryButton';
import { Spacer } from '../../src/shared/widgets/Spacer';
import { useSnackbar } from '../../src/shared/widgets/AppSnackbar';

/**
 * E-posta bağlantısıyla açılan yeni şifre ekranı (Flutter `ResetPasswordScreen`).
 * Başarıda snackbar gösterilir; kurtarma modu kapanınca AuthGate ana sayfaya yönlendirir.
 */
export default function ResetPasswordScreen() {
  useThemeRevision();
  const { updatePassword } = useAuth();
  const snackbar = useSnackbar();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const passwordError = submitted ? validateNewPassword(password) : null;
  const confirmError = submitted ? validatePasswordConfirmation(password, confirm) : null;

  async function submit() {
    setSubmitted(true);
    setServerError(null);
    if (validateNewPassword(password) || validatePasswordConfirmation(password, confirm)) return;

    setSubmitting(true);
    try {
      await updatePassword(password);
      snackbar.show('Şifren güncellendi.');
    } catch (error) {
      setServerError(messageForError(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title: 'Yeni şifre oluştur' }} />
      <Spacer size={spacing.md} />
      <View style={styles.iconWrap}>
        <MaterialIcons name="lock-reset" size={64} color={colors.primary} />
      </View>
      <Spacer size={spacing.xl} />
      <Text style={[textStyle('title'), styles.text]}>Yeni şifreni belirle</Text>
      <Spacer size={spacing.xs} />
      <Text style={[textStyle('bodySmall'), styles.text]}>
        {`${PASSWORD_REQUIREMENT} uzunluğunda güçlü bir şifre seç.`}
      </Text>
      <Spacer size={spacing.xxl} />
      <PasswordField
        label="Yeni şifre"
        value={password}
        onChangeText={setPassword}
        error={passwordError}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        editable={!submitting}
      />
      <Spacer size={spacing.md} />
      <PasswordField
        label="Şifreyi onayla"
        value={confirm}
        onChangeText={setConfirm}
        error={confirmError}
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={submit}
        editable={!submitting}
      />
      {serverError ? <Text style={[textStyle('bodySmall', { color: colors.error }), styles.text, styles.topGap]}>{serverError}</Text> : null}
      <Spacer size={spacing.xl} />
      <PrimaryButton label="Şifremi güncelle" onPress={submit} loading={submitting} />
    </SafeAreaView>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    // Flutter ResetPasswordScreen: tüm kenarlar 24 (AuthPageScaffold ile aynı).
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  iconWrap: {
    alignItems: 'center',
  },
  text: {
    textAlign: 'center',
  },
  topGap: {
    marginTop: spacing.sm,
  },
}));
