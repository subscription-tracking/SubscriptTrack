import { useQuery } from '@tanstack/react-query';

import { fetchPayments } from './paymentRepository';

/**
 * Ödeme sorguları. Anahtarlar kullanıcı kimliğini içerir.
 * `networkMode: 'always'`: çevrimdışıyken de sorgu çalışır; hata durumu ekranda gösterilir
 * (bu veriler için yerel cache yok; bkz. ARCHITECTURE "Offline").
 */

export const analyticsKeys = {
  payments: (userId: string) => ['payments', userId] as const,
};

export function usePaymentsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: analyticsKeys.payments(userId ?? ''),
    queryFn: fetchPayments,
    enabled: Boolean(userId),
    networkMode: 'always',
    retry: 1,
  });
}
