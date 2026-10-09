import { supabase } from '../../../core/supabase/client';

/**
 * Abonelik tablosundaki değişiklikleri dinler. Filtre `user_id` ile yapılır; RLS da
 * yalnızca kullanıcının satırlarını yayınlar. Dönen fonksiyon aboneliği kapatır
 * ([API.md](../../../../../docs/reference/API.md), realtime yayını `subscriptions` tablosunu içerir).
 */
export function subscribeToSubscriptionChanges(userId: string, onChange: () => void): () => void {
  const channel = supabase
    .channel(`subscriptions:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${userId}` },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
