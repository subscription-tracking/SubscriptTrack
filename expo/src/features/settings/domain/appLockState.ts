export interface AppLockState {
  pinRecord: string | null;
  biometric: boolean;
  timeoutMinutes: number;
  failed: number;
  /** Bekleme bitişi (epoch ms) veya null. */
  lockedUntil: number | null;
}
