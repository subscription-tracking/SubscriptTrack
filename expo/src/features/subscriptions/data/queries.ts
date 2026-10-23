import { useQuery } from '@tanstack/react-query';
import { env } from '../../../core/config/env';

import { fetchServiceCatalog } from './serviceCatalogRepository';
import { loadQueue, resolveRows } from './subscriptionSync';
import { type Subscription, subscriptionFromRow } from '../domain/subscription';

/**
 * Abonelik sorguları. Anahtarlar kullanıcı kimliğini içerir: oturum değişince önbellek
 * karışmaz ([ARCHITECTURE.md §Durum](../../../../../docs/expo/ARCHITECTURE.md)).
 *
 * `networkMode: 'always'`: TanStack varsayılanı çevrimdışıyken sorguyu duraklatır; bu
 * uygulama çevrimdışıyken de yerel veriyle çalışmalı.
 */

export const subscriptionKeys = {
  all: (userId: string) => ['subscriptions', userId] as const,
  list: (userId: string) => [...subscriptionKeys.all(userId), 'list'] as const,
  detail: (userId: string, id: string) => [...subscriptionKeys.all(userId), 'detail', id] as const,
  pending: (userId: string) => [...subscriptionKeys.all(userId), 'pending'] as const,
};

export function useSubscriptionsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: subscriptionKeys.list(userId ?? ''),
    queryFn: async (): Promise<Subscription[]> => {
      const rows = await resolveRows(userId ?? '');
      return rows.map(subscriptionFromRow);
    },
    enabled: Boolean(userId),
    // Restrictive soft-delete RLS can suppress the final realtime UPDATE event.
    // Foreground polling is the fallback; native/live latency remains an acceptance gate.
    refetchInterval: env.softDeletionEnabled ? 4000 : false,
    networkMode: 'always',
    retry: 1,
  });
}

export function useSubscriptionQuery(userId: string | undefined, id: string) {
  return useQuery({
    queryKey: subscriptionKeys.detail(userId ?? '', id),
    queryFn: async (): Promise<Subscription | null> => {
      const row = (await resolveRows(userId ?? '')).find((item) => item.id === id);
      return row ? subscriptionFromRow(row) : null;
    },
    enabled: Boolean(userId) && id.length > 0,
    networkMode: 'always',
    retry: 1,
  });
}

/** Gönderilmemiş yazım sayısı (çevrimdışı şerit için). */
export function usePendingWritesQuery(userId: string | undefined) {
  return useQuery({
    queryKey: subscriptionKeys.pending(userId ?? ''),
    queryFn: async () => (await loadQueue(userId ?? '')).length,
    enabled: Boolean(userId),
    networkMode: 'always',
  });
}

/** Servis kataloğu kullanıcıya özel değildir; uzun süre önbellekte tutulur. Hata olursa çağıran yedek listeyi kullanır. */
export function useServiceCatalogQuery() {
  return useQuery({
    queryKey: ['service-catalog'],
    queryFn: fetchServiceCatalog,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });
}
