import { useState } from 'react';
import { useRouter } from 'expo-router';

import { useAuth } from '../../src/features/auth/AuthProvider';
import { messageForError } from '../../src/features/auth/domain/authErrors';
import { validateAuthEmail, validateLoginPassword } from '../../src/features/auth/domain/authRules';
import { AuthHeader, AuthScaffold } from '../../src/features/auth/ui/AuthScaffold';
import { PasswordField } from '../../src/shared/widgets/PasswordField';
import { devTestAccount } from '../../src/core/config/devTestAccount';
import { OutlinedButton } from '../../src/shared/widgets/OutlinedButton';
import { PrimaryButton } from '../../src/shared/widgets/PrimaryButton';
import { Spacer } from '../../src/shared/widgets/Spacer';
import { TextField } from '../../src/shared/widgets/TextField';
import { TextLink } from '../../src/shared/widgets/TextLink';
import { useSnackbar } from '../../src/shared/widgets/AppSnackbar';
import { spacing } from '../../src/shared/design/tokens';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const snackbar = useSnackbar();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Flutter gibi doğrulama yalnızca gönderimden sonra inline gösterilir.
  const emailError = submitted ? validateAuthEmail(email) : null;
  const passwordError = submitted ? validateLoginPassword(password) : null;

  async function signInAsTestAccount() {
    if (!devTestAccount) return;
    setSubmitting(true);
    try {
      await signIn(devTestAccount.email, devTestAccount.password);
    } catch (error) {
      snackbar.show(messageForError(error), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function submit() {
    setSubmitted(true);
    if (validateAuthEmail(email) || validateLoginPassword(password)) return;

    setSubmitting(true);
    try {
      // Başarılı girişte yönlendirme AuthGate tarafından yapılır.
      await signIn(email.trim(), password);
    } catch (error) {
      snackbar.show(messageForError(error), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScaffold>
      <AuthHeader
        icon="account-balance-wallet"
        title="Tekrar hoş geldin"
        subtitle="Aboneliklerini yönetmek için giriş yap."
      />
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
        autoComplete="password"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={submit}
        editable={!submitting}
      />
      <Spacer size={spacing.xs} />
      <TextLink label="Şifremi unuttum" align="end" onPress={() => router.push('/forgot-password')} />
      <Spacer size={spacing.md} />
      <PrimaryButton label="Giriş yap" onPress={submit} loading={submitting} />
      {devTestAccount ? (
        <>
          <Spacer size={spacing.sm} />
          <OutlinedButton label="Test hesabıyla gir" onPress={signInAsTestAccount} />
        </>
      ) : null}
      <Spacer size={spacing.sm} />
      <TextLink label="Hesabın yok mu? Kayıt ol" onPress={() => router.push('/register')} />
    </AuthScaffold>
  );
}
