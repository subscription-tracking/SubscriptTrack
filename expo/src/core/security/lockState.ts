import { useSyncExternalStore } from 'react';

/**
 * Uygulama kilidinin salt okunur, bağımsız görünümü. `AppLockProvider` yazar; `shared` bileşenleri
 * (ör. `LockAwareModal`) feature katmanını import etmeden okur.
 */
let locked = false;
const listeners = new Set<() => void>();

export function setAppLocked(next: boolean): void {
  if (locked === next) return;
  locked = next;
  listeners.forEach((listener) => listener());
}

export function useAppLocked(): boolean {
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    () => locked,
    () => false,
  );
}
