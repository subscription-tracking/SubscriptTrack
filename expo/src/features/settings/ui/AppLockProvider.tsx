import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus, View, Text, Pressable } from 'react-native';
import { colors, spacing } from '../../../shared/design/tokens';
import { usePreventScreenCapture } from 'expo-screen-capture';

import { setAppLocked } from '../../../core/security/lockState';
import { useAuth } from '../../auth/AuthProvider';
import { createPinUnlockService } from '../data/pinUnlockService';
import { FREE_ATTEMPTS, shouldLockOnResume } from '../domain/appLockRules';
import { readAppLock } from '../data/appLockStore';
import { authenticateWithBiometrics } from '../data/biometrics';
import { LockScreen } from './LockScreen';
import { AppLockContext, type AppLockValue, type UnlockOutcome } from './appLockContext';

export function AppLockProvider({ children }: { children: ReactNode }) {
  useThemeRevision();
  const { user } = useAuth();
  const [state, setState] = useState<Omit<AppLockValue, 'unlockWithPin' | 'unlockWithBiometrics' | 'refresh'>>({
    ready: false,
    enabled: false,
    locked: false,
    biometricEnabled: false,
    timeoutMinutes: 0,
    lockoutRemainingMs: 0,
    attemptsLeft: FREE_ATTEMPTS,
  });
  const backgroundedAt = useRef<number | null>(null);
  const currentUser = useRef(user?.id);
  useLayoutEffect(() => { currentUser.current = user?.id; }, [user?.id]);
  const loadedUser = useRef<string | undefined>(undefined);
  const [hydratedUser, setHydratedUser] = useState<string | undefined>(undefined);
  const pinUnlock = useRef(createPinUnlockService());
  const [storageError, setStorageError] = useState(false);
  const hasUser = Boolean(user);

  const refresh = useCallback(async () => {
    const expectedUser = user?.id;
    try {
      // Kilit kaydı kullanıcıya bağlıdır; oturum yokken okunacak kayıt yoktur.
      const stored = expectedUser
        ? await readAppLock(expectedUser)
        : { pinRecord: null, biometric: false, timeoutMinutes: 0, failed: 0, lockedUntil: null };
      if (expectedUser !== currentUser.current) return;
      const accountChanged = loadedUser.current !== expectedUser;
      loadedUser.current = expectedUser;
      setHydratedUser(expectedUser);
      setStorageError(false);
      const enabled = stored.pinRecord !== null;
      // SecureStore resolves asynchronously; this is session hydration, not a render-time state mirror.

      setState((current) => ({
        ...current,
        ready: true,
        enabled,
        locked: enabled && hasUser && (accountChanged || current.locked || current.ready === false),
        biometricEnabled: stored.biometric,
        timeoutMinutes: stored.timeoutMinutes,
        attemptsLeft: Math.max(0, FREE_ATTEMPTS - stored.failed),
        lockoutRemainingMs: Math.max(0, (stored.lockedUntil ?? 0) - Date.now()),
      }));
    } catch { setStorageError(true); }
  }, [hasUser, user?.id]);

  useEffect(() => {
    // refresh waits for secure storage before setting state; no synchronous render cascade occurs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh, user?.id]);

  useEffect(() => {
    function onChange(next: AppStateStatus) {
      if (!state.enabled || !hasUser) return;
      if (next === 'background' || next === 'inactive') {
        if (state.timeoutMinutes === 0) {
          setState((current) => ({ ...current, locked: true }));
        } else if (backgroundedAt.current === null) {
          backgroundedAt.current = Date.now();
        }
        return;
      }
      if (next === 'active') {
        const timeoutMs = state.timeoutMinutes * 60_000;
        if (shouldLockOnResume(backgroundedAt.current, Date.now(), timeoutMs)) {
          setState((current) => ({ ...current, locked: true }));
        }
        backgroundedAt.current = null;
      }
    }
    const subscription = AppState.addEventListener('change', onChange);
    return () => subscription.remove();
  }, [state.enabled, state.timeoutMinutes, hasUser]);

  const unlockWithPin = useCallback(async (pin: string): Promise<UnlockOutcome> => {
    const expectedUser = currentUser.current;
    const current = { attemptsLeft: state.attemptsLeft, lockoutRemainingMs: state.lockoutRemainingMs };
    try {
      if (!expectedUser) return { result: 'wrong', ...current };
      const outcome = await pinUnlock.current(expectedUser, pin);
      if (expectedUser !== currentUser.current) return { result: 'wrong', ...current };
      setState((prev) => ({ ...prev, locked: outcome.result !== 'ok', attemptsLeft: outcome.attemptsLeft, lockoutRemainingMs: outcome.remaining }));
      return { result: outcome.result, attemptsLeft: outcome.attemptsLeft, lockoutRemainingMs: outcome.remaining };
    } catch {
      setStorageError(true);
      return { result: 'storage_error', ...current };
    }
  }, [state.attemptsLeft, state.lockoutRemainingMs]);

  const unlockWithBiometrics = useCallback(async () => {
    if (storageError || !state.biometricEnabled || hydratedUser !== currentUser.current) return false;
    const expectedUser = currentUser.current;
    try {
      const ok = await authenticateWithBiometrics();
      if (expectedUser !== currentUser.current) return false;
      if (ok) setState((current) => ({ ...current, locked: false }));
      return ok;
    } catch { return false; }
  }, [storageError, state.biometricEnabled, hydratedUser]);

  const value: AppLockValue = {
    ...state,
    unlockWithPin,
    unlockWithBiometrics,
    refresh,
  };
  const showLock = state.ready && state.enabled && state.locked && hasUser;

  const lockVisible = showLock && !storageError;
  // Modal gibi ayrı pencerelerin kilit ekranının üstünde kalmaması için kilit durumu paylaşılır.
  useEffect(() => {
    setAppLocked(lockVisible);
    return () => setAppLocked(false);
  }, [lockVisible]);

  return (
    <AppLockContext.Provider value={value}>
      {hasUser && (!state.ready || storageError || hydratedUser !== user?.id) ? (
        <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center' }}>
          <Text style={{ color: colors.onSurface }}>{storageError ? 'Güvenli kilit verisi okunamadı.' : 'Güvenli kilit yükleniyor...'}</Text>
          {storageError ? <Pressable accessibilityRole="button" accessibilityLabel="Kilidi tekrar yükle" onPress={() => void refresh()}><Text style={{ color: colors.primary }}>Tekrar dene</Text></Pressable> : null}
        </View>
      ) : (
        <View
          style={{ flex: 1 }}
          importantForAccessibility={lockVisible ? 'no-hide-descendants' : 'auto'}
          accessibilityElementsHidden={lockVisible}
        >
          {children}
        </View>
      )}
      {state.enabled ? <ScreenCaptureGuard /> : null}
      {lockVisible ? <LockScreen /> : null}
    </AppLockContext.Provider>
  );
}

/**
 * Uygulama kilidi açıkken ekran görüntüsünü ve son uygulamalar önizlemesini engeller (Flutter `PrivacyScreen`
 * karşılığı, F-17). Yalnızca kilit etkinken mount edilir; kapatılınca koruma kalkar.
 */
function ScreenCaptureGuard() {
  usePreventScreenCapture('app-lock');
  return null;
}
