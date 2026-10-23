import { createContext, useContext } from 'react';

/**
 * Uygulama kilidi bağlamı. Ayrı bir modülde tutulur: sağlayıcı (AppLockProvider) kilit ekranını
 * (LockScreen) çizer, kilit ekranı da bu bağlamı kullanır. Bağlam sağlayıcıda olsaydı iki dosya
 * birbirini içe aktarır ve döngü oluşurdu.
 */

export type UnlockResult = 'ok' | 'wrong' | 'locked_out' | 'storage_error';

/** PIN denemesinin sonucu ve denemeden SONRAKİ güncel hak/bekleme değerleri. */
export interface UnlockOutcome {
  result: UnlockResult;
  attemptsLeft: number;
  lockoutRemainingMs: number;
}

export interface AppLockValue {
  ready: boolean;
  enabled: boolean;
  locked: boolean;
  biometricEnabled: boolean;
  timeoutMinutes: number;
  /** Bekleme sürüyorsa kalan süre (ms). */
  lockoutRemainingMs: number;
  attemptsLeft: number;
  unlockWithPin: (pin: string) => Promise<UnlockOutcome>;
  unlockWithBiometrics: () => Promise<boolean>;
  /** Ayarlar değiştiğinde durumu yeniden okur. */
  refresh: () => Promise<void>;
}

export const AppLockContext = createContext<AppLockValue | null>(null);

export function useAppLock(): AppLockValue {
  const value = useContext(AppLockContext);
  if (!value) throw new Error('useAppLock, AppLockProvider içinde kullanılmalıdır.');
  return value;
}
