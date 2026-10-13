import { useThemeRevision } from '../../src/shared/design/useThemeRevision';
import { themedStyles } from '../../src/shared/design/themeRuntime';
import { useState } from 'react';
import { spacing , colors } from '../../src/shared/design/tokens';
import { type Href, useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { useAuth } from '../../src/features/auth/AuthProvider';
import { messageForError } from '../../src/features/auth/domain/authErrors';
import { PASSWORD_MISMATCH_REGISTER, validateAuthEmail, validateNewPassword, validatePasswordConfirmation } from '../../src/features/auth/domain/authRules';
import { AuthHeader, AuthScaffold } from '../../src/features/auth/ui/AuthScaffold';
import { textStyle } from '../../src/shared/design/typography';
import { CheckboxRow } from '../../src/shared/widgets/CheckboxRow';
import { PasswordField } from '../../src/shared/widgets/PasswordField';
import { PrimaryButton } from '../../src/shared/widgets/PrimaryButton';
import { Spacer } from '../../src/shared/widgets/Spacer';
import { TextField } from '../../src/shared/widgets/TextField';
import { TextLink } from '../../src/shared/widgets/TextLink';
import { useSnackbar } from '../../src/shared/widgets/AppSnackbar';

export default function RegisterScreen() {
  useThemeRevision();
  const { signUp } = useAuth();
  const snackbar = useSnackbar();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  // Flutter'daki gibi iki parola alanı aynı görünürlük durumunu paylaşır.
  const [obscure, setObscure] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const emailError = submitted ? validateAuthEmail(email) : null;
  const passwordError = submitted ? validateNewPassword(password) : null;
  const confirmError = submitted ? validatePasswordConfirmation(password, confirm, PASSWORD_MISMATCH_REGISTER) : null;

  async function submit() {
    if (!agreed) return;
    setSubmitted(true);
    if (validateAuthEmail(email) || validateNewPassword(password) || validatePasswordConfirmation(password, confirm, PASSWORD_MISMATCH_REGISTER)) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await signUp(email.trim(), password);
      if (result.requiresEmailConfirmation) {
        snackbar.show('E-posta uygunsa doğrulama bağlantısı gönderildi.', 'primary');
        router.replace('/login');
      }
      // Oturum açıldıysa yönlendirme AuthGate tarafından yapılır.
    } catch (error) {
      snackbar.show(messageForError(error), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScaffold>
      <AuthHeader icon="person-add-alt-1" title="Hesap oluştur" subtitle="Aboneliklerini takip etmeye başla." />
      <Spacer size={spacing.xxl} />
      <TextField
        label="E-posta"
        prefixIcon="email"
        value={email}
        onChangeText={setEmail}
        error={emailError}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        editable={!submitting}
      />
      <Spacer size={spacing.md} />
      <PasswordField
        label="Şifre"
        value={password}
        onChangeText={setPassword}
        error={passwordError}
        obscure={obscure}
        onToggleObscure={setObscure}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        editable={!submitting}
      />
      <Spacer size={spacing.md} />
      <TextField
        label="Şifre tekrar"
        prefixIcon="lock-outline"
        value={confirm}
        onChangeText={setConfirm}
        error={confirmError}
        secureTextEntry={obscure}
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={submit}
        editable={!submitting}
      />
      <Spacer size={spacing.sm} />
      <CheckboxRow checked={agreed} onChange={setAgreed}>
        <Text style={textStyle('body')}>
          <Text style={styles.link} onPress={() => router.push('/legal/terms' as Href)}>
            Kullanım şartlarını
          </Text>
          <Text> ve </Text>
          <Text style={styles.link} onPress={() => router.push('/legal/privacy' as Href)}>
            gizlilik politikasını
          </Text>
          <Text> okudum, kabul ediyorum.</Text>
        </Text>
      </CheckboxRow>
      <Spacer size={spacing.md} />
      <PrimaryButton label="Kayıt ol" onPress={submit} loading={submitting} disabled={!agreed} tall={false} />
      <Spacer size={spacing.sm} />
      <TextLink label="Zaten hesabın var mı? Giriş yap" onPress={() => router.replace('/login')} />
    </AuthScaffold>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  link: textStyle('bodyStrong', { color: colors.primary, textDecorationLine: 'underline' }),
}));
