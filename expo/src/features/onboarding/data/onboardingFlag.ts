import { useEffect, useState } from 'react';

import { readJson, writeJson } from '../../../core/storage/secureJsonStore';

/**
 * Tanıtımın görülüp görülmediği (cihaz başına). Flutter `SharedPreferences` bayrağının karşılığı;
 * şifreli depoda tutulur. Okunamazsa tanıtım yeniden gösterilir (güvenli varsayılan).
 *
 * Bayrak tek bir paylaşılan durumdur: tanıtım ekranı tamamlayınca oturum kapısı da aynı değeri görür
 * (aksi halde giriş ekranına dönüşte tanıtım yeniden açılırdı).
 */

const KEY = 'onboarding.done';

let cached: boolean | null = null;
const listeners = new Set<(done: boolean) => void>();

export async function readOnboardingDone(): Promise<boolean> {
  if (cached === null) cached = (await readJson(KEY)) === true;
  return cached;
}

export async function markOnboardingDone(): Promise<void> {
  await writeJson(KEY, true);
  cached = true;
  listeners.forEach((listener) => listener(true));
}

/** Bayrak okunana kadar `ready` false döner; oturum kapısı bu süreyi bekler. */
export function useOnboardingFlag(): { ready: boolean; done: boolean; markDone: () => Promise<void> } {
  const [state, setState] = useState<{ ready: boolean; done: boolean }>({ ready: cached !== null, done: cached === true });

  useEffect(() => {
    const listener = (done: boolean) => setState({ ready: true, done });
    listeners.add(listener);
    let active = true;
    void readOnboardingDone().then((done) => {
      if (active) setState({ ready: true, done });
    });
    return () => {
      active = false;
      listeners.delete(listener);
    };
  }, []);

  return { ready: state.ready, done: state.done, markDone: markOnboardingDone };
}
