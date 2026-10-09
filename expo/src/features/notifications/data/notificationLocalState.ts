import { useCallback, useEffect, useState } from 'react';

import { readJson, writeJson } from '../../../core/storage/secureJsonStore';

/**
 * Bildirim merkezinin cihaz başına durumu (Flutter `NotificationController` ile aynı): okunmuş ve kaydırılarak
 * kapatılmış kimlikler. Bu durum asıl kaynaktır; sunucu okundu işareti en iyi çabayla yazılır.
 */

const READ_KEY = 'notifications.read';
const DISMISSED_KEY = 'notifications.dismissed';

function asIds(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function useNotificationLocalState() {
  const [read, setRead] = useState<ReadonlySet<string>>(new Set());
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([readJson(READ_KEY), readJson(DISMISSED_KEY)])
      .then(([readIds, dismissedIds]) => {
        if (!active) return;
        setRead(new Set(asIds(readIds)));
        setDismissed(new Set(asIds(dismissedIds)));
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const markRead = useCallback(
    (ids: readonly string[]) => {
      const next = new Set([...read, ...ids]);
      setRead(next);
      void writeJson(READ_KEY, [...next]).catch(() => undefined);
    },
    [read],
  );

  const dismiss = useCallback(
    (id: string) => {
      const next = new Set([...dismissed, id]);
      setDismissed(next);
      void writeJson(DISMISSED_KEY, [...next]).catch(() => undefined);
    },
    [dismissed],
  );

  return { ready, read, dismissed, markRead, dismiss };
}
