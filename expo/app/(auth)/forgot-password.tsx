import { useState } from 'react';
import { spacing } from '../../src/shared/design/tokens';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAuth } from '../../src/features/auth/AuthProvider';
import { messageForError } from '../../src/features/auth/domain/authErrors';
import { validateEmail } from '../../src/features/auth/domain/authRules';
import { colors } from '../../src/shared/design/tokens';
import { textStyle } from '../../src/shared/design/typography';
import { OutlinedButton } from '../../src/shared/widgets/OutlinedButton';
import { PrimaryButton } from '../../src/shared/widgets/PrimaryButton';
import { TextField } from '../../src/shared/widgets/TextField';
import { Spacer } from '../../src/shared/widgets/Spacer';

/** Flutter `ForgotPasswordScreen`: app bar başlığı, form ve e-posta gönderildi görünümü. */
export default function ForgotPasswordScreen() {
  const { sendPasswordResetEmail } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const emailError = submitted ? validateEmail(email) : null;

  async function submit() {
    setSubmitted(true);
    setServerError(null);
    if (validateEmail(email)) return;

    setSubmitting(true);
    const address = email.trim();
    try {
      await sendPasswordResetEmail(address);
      setSentTo(address);
    } catch (error) {
      setServerError(messageForError(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title: 'Şifremi unuttum' }} />
      {sentTo !== null ? (
        <View style={styles.centered}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="mark-email-read" size={72} color={colors.primary} />
          </View>
          <Spacer size={spacing.xl} />
          <Text style={[textStyle('headlineSmall'), styles.center]}>Mail gönderildi!</Text>
          <Spacer size={spacing.sm} />
          <Text style={[textStyle('bodySmall'), styles.center]}>
            {`${sentTo} adresine şifre sıfırlama bağlantısı gönderildi.\nSpam klasörünü de kontrol et.`}
          </Text>
          <Spacer size={spacing.xxl} />
          <OutlinedButton label="Giriş ekranına dön" onPress={() => router.back()} />
        </View>
      ) : (
        <View style={styles.form}>
          <Spacer size={spacing.md} />
          <View style={styles.iconWrap}>
            <MaterialIcons name="lock-reset" size={64} color={colors.primary} />
          </View>
          <Spacer size={spacing.xl} />
          <Text style={[textStyle('headlineSmall'), styles.center]}>Şifre sıfırlama bağlantısı</Text>
          <Spacer size={spacing.xs} />
          <Text style={[textStyle('bodySmall'), styles.center]}>
            Kayıtlı e-posta adresine şifre sıfırlama bağlantısı göndereceğiz.
          </Text>
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
            returnKeyType="done"
            onSubmitEditing={submit}
            editable={!submitting}
          />
          {serverError ? (
            <Text style={[textStyle('bodySmall', { color: colors.error }), styles.center, styles.topGap]}>{serverError}</Text>
          ) : null}
          <Spacer size={spacing.xl} />
          <PrimaryButton label="Bağlantı gönder" onPress={submit} loading={submitting} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    // Flutter ForgotPasswordScreen: tüm kenarlar 24 (AuthPageScaffold ile aynı).
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  form: {
    flex: 1,
    alignItems: 'stretch',
  },
  iconWrap: {
    alignItems: 'center',
  },
  center: {
    textAlign: 'center',
  },
  topGap: {
    marginTop: spacing.sm,
  },
});
