import { useQuery } from '@tanstack/react-query';

import { fetchSavings } from './savingsRepository';

/** Tasarruf sorguları. `networkMode: 'always'`: çevrimdışıyken de çalışır; hata ekranda gösterilir. */

export const savingsKeys = {
  all: (userId: string) => ['savings', userId] as const,
};

export function useSavingsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: savingsKeys.all(userId ?? ''),
    queryFn: fetchSavings,
    enabled: Boolean(userId),
    networkMode: 'always',
    retry: 1,
  });
}
