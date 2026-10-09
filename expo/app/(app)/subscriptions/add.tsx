import { useLocalSearchParams } from 'expo-router';

import { SubscriptionFormScreen } from '../../../src/features/subscriptions/ui/SubscriptionFormScreen';

/**
 * Yeni abonelik formu. Takvimdeki "Bu tarihte başlayan abonelik ekle" bağlantısı `start=YYYY-AA-GG` ile açar;
 * geçersiz ya da eksik değer bugünü kullanır (Flutter `AppRoutes.addSubscriptionOn`).
 */
export default function AddSubscriptionRoute() {
  const { start } = useLocalSearchParams<{ start?: string }>();
  return <SubscriptionFormScreen initialStart={typeof start === 'string' ? start : undefined} />;
}
