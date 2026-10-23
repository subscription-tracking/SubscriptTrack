import { useThemeRevision } from '../src/shared/design/useThemeRevision';
import { themedStyles } from '../src/shared/design/themeRuntime';
import { useEffect, useRef, useState } from 'react';
import { spacing , colors } from '../src/shared/design/tokens';
import { Link, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { useAuth } from '../src/features/auth/AuthProvider';
import { messageForError } from '../src/features/auth/domain/authErrors';
import { AuthScaffold } from '../src/features/auth/ui/AuthScaffold';
import { textStyle } from '../src/shared/design/typography';
import { AsyncStateView } from '../src/shared/widgets/AsyncStateView';
import { Spacer } from '../src/shared/widgets/Spacer';

const INVALID_LINK = 'Bağlantı geçersiz ya da süresi dolmuş.';

/**
 * `subscripttrack://auth-callback?code=…` bağlantısını karşılar: e-posta doğrulama
 * ve şifre sıfırlama bağlantıları bu rotaya gelir. PKCE kodu oturuma çevrilir;
 * sonrasında yönlendirme AuthGate tarafından yapılır.
 */
export default function AuthCallbackScreen() {
  useThemeRevision();
  const params = useLocalSearchParams<{ code?: string; error?: string; error_description?: string }>();
  const { exchangeCodeForSession } = useAuth();
  const [failure, setFailure] = useState<string | null>(null);
  const invalid = Boolean(params.error || params.error_description) || typeof params.code !== 'string' || params.code.length === 0;
  // Kod tek kullanımlıktır; StrictMode'un çift efektinde ikinci kez gönderilmez.
  const exchanged = useRef(false);

  useEffect(() => {
    if (exchanged.current) return;
    if (invalid || typeof params.code !== 'string') return;

    exchanged.current = true;
    exchangeCodeForSession(params.code).catch((error: unknown) => {
      setFailure(messageForError(error));
    });
  }, [params.code, invalid, exchangeCodeForSession]);

  const displayFailure = invalid ? INVALID_LINK : failure;
  if (!displayFailure) {
    return <AsyncStateView<null> state={{ status: 'loading' }}>{() => null}</AsyncStateView>;
  }

  return (
    <AuthScaffold>
      <Text style={textStyle('headline')}>Bağlantı açılamadı</Text>
      <Spacer size={spacing.md} />
      <Text style={[textStyle('bodySmall', { color: colors.error })]}>{displayFailure}</Text>
      <Spacer size={spacing.xl} />
      <Link href="/login" style={styles.link}>
        Girişe dön
      </Link>
    </AuthScaffold>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  link: {
    color: colors.primary,
    ...textStyle('label'),
    padding: spacing.sm,
  },
}));
