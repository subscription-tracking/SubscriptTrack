import { useCallback, useEffect, useState } from 'react';

import { readJson, removeJson, writeJson } from '../../../core/storage/secureJsonStore';

/**
 * Bildirim merkezinin cihaz başına durumu (Flutter `NotificationController` ile aynı): okunmuş ve kaydırılarak
 * kapatılmış kimlikler. Bu durum asıl kaynaktır; sunucu okundu işareti en iyi çabayla yazılır.
 */

const readKey = (userId: string) => `notifications.read.${userId}`;
const dismissedKey = (userId: string) => `notifications.dismissed.${userId}`;
/** Çıkış/hesap silmede kullanıcının okunmuş ve kapatılmış bildirim kayıtlarını siler. */
export async function clearNotificationLocalState(userId: string): Promise<void> {
  await Promise.all([removeJson(readKey(userId)), removeJson(dismissedKey(userId))]);
}
const EMPTY_IDS: ReadonlySet<string> = new Set();

function asIds(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function useNotificationLocalState(userId: string | undefined) {
  const [state, setState] = useState<{
    userId: string;
    read: ReadonlySet<string>;
    dismissed: ReadonlySet<string>;
  } | null>(null);
  const ready = Boolean(userId && state?.userId === userId);
  const read = ready ? state?.read ?? EMPTY_IDS : EMPTY_IDS;
  const dismissed = ready ? state?.dismissed ?? EMPTY_IDS : EMPTY_IDS;

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    void Promise.all([readJson(readKey(userId)), readJson(dismissedKey(userId))])
      .then(([readIds, dismissedIds]) => {
        if (!active) return;
        setState({ userId, read: new Set(asIds(readIds)), dismissed: new Set(asIds(dismissedIds)) });
      })
      .catch(() => {
        if (active) setState({ userId, read: new Set(), dismissed: new Set() });
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const markRead = useCallback(
    (ids: readonly string[]) => {
      if (!userId || !ready) return;
      const next = new Set([...read, ...ids]);
      setState((current) => current?.userId === userId ? { ...current, read: next } : current);
      void writeJson(readKey(userId), [...next]).catch(() => undefined);
    },
    [read, ready, userId],
  );

  const dismiss = useCallback(
    (id: string) => {
      if (!userId || !ready) return;
      const next = new Set([...dismissed, id]);
      setState((current) => current?.userId === userId ? { ...current, dismissed: next } : current);
      void writeJson(dismissedKey(userId), [...next]).catch(() => undefined);
    },
    [dismissed, ready, userId],
  );

  return { ready, read, dismissed, markRead, dismiss };
}

/** Yedek (catch-up/gecikme) bildirim işaretleri: kimlik -> planlandığı an (ms). Kullanıcıya özel, 7 gün sonra budanır. */
const sentKey = (userId: string) => `notifications.catchup.sent.${userId}`;
export const SENT_MARKER_TTL_MS = 7 * 24 * 60 * 60 * 1000;
let sentChain: Promise<unknown> = Promise.resolve();

function asMarkers(value: unknown): Record<string, number> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, number] => typeof entry[1] === 'number'));
}

function pruned(markers: Record<string, number>, now: number): Record<string, number> {
  return Object.fromEntries(Object.entries(markers).filter(([, at]) => now - at <= SENT_MARKER_TTL_MS));
}

/** Daha önce planlanmış yedek bildirim kimlikleri (7 günden eskiler yok sayılır). */
export async function readSentMarkers(userId: string, now: Date = new Date()): Promise<ReadonlySet<string>> {
  return new Set(Object.keys(pruned(asMarkers(await readJson(sentKey(userId))), now.getTime())));
}

/** Kimlikleri işaretler ve eski işaretleri budar. Yazmalar sıralıdır; eşzamanlı çağrılar birbirini ezmez. */
export function markSentMarkers(userId: string, identifiers: readonly string[], now: Date = new Date()): Promise<void> {
  const run = async () => {
    const markers = pruned(asMarkers(await readJson(sentKey(userId))), now.getTime());
    for (const id of identifiers) markers[id] = now.getTime();
    await writeJson(sentKey(userId), markers);
  };
  const next = sentChain.then(run, run);
  sentChain = next.catch(() => undefined);
  return next;
}
