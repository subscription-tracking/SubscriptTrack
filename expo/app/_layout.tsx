import { useThemeRevision } from '../src/shared/design/useThemeRevision';
import { useEffect } from 'react';
import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppState } from 'react-native';
import { type Href, Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { AuthProvider, useAuth } from '../src/features/auth/AuthProvider';
import { resolveRedirect } from '../src/features/auth/domain/sessionState';
import { appFonts } from '../src/shared/design/fonts';
import { colors } from '../src/shared/design/tokens';
import { textStyle } from '../src/shared/design/typography';
import { AppSnackbarProvider } from '../src/shared/widgets/AppSnackbar';
import { AppLockProvider } from '../src/features/settings/ui/AppLockProvider';
import { useOnboardingFlag } from '../src/features/onboarding/data/onboardingFlag';
import { AsyncStateView } from '../src/shared/widgets/AsyncStateView';
import { ThemeProvider } from '../src/shared/design/ThemeProvider';

const queryClient = new QueryClient();

// Açılış ekranı fontlar yüklenene kadar görünür kalır (kök yükleme kapısıyla aynı an).
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  useThemeRevision();
  const [fontsLoaded] = useFonts(appFonts);
  useEffect(() => {
    focusManager.setFocused(AppState.currentState === 'active');
    const subscription = AppState.addEventListener('change', (state) => focusManager.setFocused(state === 'active'));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <AsyncStateView<null> state={{ status: 'loading' }}>{() => null}</AsyncStateView>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <AppSnackbarProvider>
        <AuthProvider>
          <AppLockProvider>
            <ThemeStatusBar />
            <AuthGate />
          </AppLockProvider>
        </AuthProvider>
      </AppSnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function ThemeStatusBar() {
  const theme = useThemeRevision();
  return <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />;
}

/**
 * Oturum durumu belirlenene kadar yükleniyor gösterir, sonra yönlendirme
 * kurallarını uygular ([resolveRedirect]). Oturum yoksa giriş ekranına,
 * e-posta bağlantısıyla şifre sıfırlama açıksa yeni şifre ekranına gider.
 */
function AuthGate() {
  useThemeRevision();
  const auth = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const onboarding = useOnboardingFlag();

  useEffect(() => {
    if (!onboarding.ready) return;
    const target = resolveRedirect(
      { status: auth.status, user: auth.user, passwordRecoveryMode: auth.passwordRecoveryMode },
      segments[0],
      segments[1],
      !onboarding.done,
    );
    if (target) router.replace(target as Href);
  }, [auth.status, auth.user, auth.passwordRecoveryMode, segments, router, onboarding.ready, onboarding.done]);

  if (auth.status === 'unknown' || !onboarding.ready) {
    return <AsyncStateView<null> state={{ status: 'loading' }}>{() => null}</AsyncStateView>;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.onBackground,
        headerTitleStyle: textStyle('title'),
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
