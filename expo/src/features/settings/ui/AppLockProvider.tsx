import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { usePreventScreenCapture } from 'expo-screen-capture';

import { useAuth } from '../../auth/AuthProvider';
import { verifyPinRecord } from '../../../core/security/pinRecord';
import { FREE_ATTEMPTS, lockoutMs, shouldLockOnResume } from '../domain/appLockRules';
import { readAppLock, writeAttempts } from '../data/appLockStore';
import { authenticateWithBiometrics } from '../data/biometrics';
import { LockScreen } from './LockScreen';
import { AppLockContext, type AppLockValue, type UnlockResult } from './appLockContext';

export function AppLockProvider({ children }: { children: ReactNode }) {
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
  const failed = useRef(0);
  const lockedUntil = useRef<number | null>(null);
  const hasUser = Boolean(user);

  const refresh = useCallback(async () => {
    const stored = await readAppLock();
    failed.current = stored.failed;
    lockedUntil.current = stored.lockedUntil;
    const enabled = stored.pinRecord !== null;
    setState((current) => ({
      ...current,
      ready: true,
      enabled,
      locked: enabled && hasUser && (current.locked || current.ready === false),
      biometricEnabled: stored.biometric,
      timeoutMinutes: stored.timeoutMinutes,
      attemptsLeft: Math.max(0, FREE_ATTEMPTS - stored.failed),
    }));
  }, [hasUser]);

  useEffect(() => {
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

  const unlockWithPin = useCallback(async (pin: string): Promise<UnlockResult> => {
    const remaining = (lockedUntil.current ?? 0) - Date.now();
    if (remaining > 0) return 'locked_out';
    const stored = await readAppLock();
    if (!stored.pinRecord) return 'ok';
    if (await verifyPinRecord(pin, stored.pinRecord)) {
      failed.current = 0;
      lockedUntil.current = null;
      await writeAttempts(0, null);
      setState((current) => ({ ...current, locked: false, attemptsLeft: FREE_ATTEMPTS, lockoutRemainingMs: 0 }));
      return 'ok';
    }
    failed.current += 1;
    const wait = lockoutMs(failed.current);
    lockedUntil.current = wait > 0 ? Date.now() + wait : null;
    await writeAttempts(failed.current, lockedUntil.current);
    setState((current) => ({
      ...current,
      attemptsLeft: Math.max(0, FREE_ATTEMPTS - failed.current),
      lockoutRemainingMs: wait,
    }));
    return wait > 0 ? 'locked_out' : 'wrong';
  }, []);

  const unlockWithBiometrics = useCallback(async () => {
    const ok = await authenticateWithBiometrics();
    if (ok) setState((current) => ({ ...current, locked: false }));
    return ok;
  }, []);

  const value: AppLockValue = {
    ...state,
    unlockWithPin,
    unlockWithBiometrics,
    refresh,
  };
  const showLock = state.ready && state.enabled && state.locked && hasUser;

  return (
    <AppLockContext.Provider value={value}>
      {children}
      {state.enabled ? <ScreenCaptureGuard /> : null}
      {showLock ? <LockScreen /> : null}
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
