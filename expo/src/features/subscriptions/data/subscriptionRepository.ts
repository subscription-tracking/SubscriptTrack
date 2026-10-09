import { supabase } from '../../../core/supabase/client';
import { type SubscriptionRow } from '../domain/subscription';

/**
 * Abonelik okuma çağrıları. Yetkilendirme RLS ile yapılır: istemci yalnızca kendi
 * satırlarını görür ([API.md §3](../../../../../docs/reference/API.md)). Satırlar ham
 * olarak döner; önbellek ham satırı saklar, dönüşüm domain'de yapılır.
 */

const COLUMNS =
  'id, name, amount, currency, billing_cycle, category, status, is_archived, start_date, next_renewal_date, payment_method, notes, website, trial_end_date, trial_price_after, notification_rules';

export class SubscriptionReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SubscriptionReadError';
  }
}

export async function fetchSubscriptionRows(): Promise<SubscriptionRow[]> {
  // Arşiv filtrelemesi istemcide yapılır (subscriptionFromRow): hem is_archived hem status 'archived' arşivdir.
  const { data, error } = await supabase
    .from('subscriptions')
    .select(COLUMNS)
    .order('next_renewal_date', { ascending: true, nullsFirst: false });
  if (error) throw new SubscriptionReadError('Abonelikler yüklenemedi. Bağlantını kontrol edip tekrar dene.');
  return data as SubscriptionRow[];
}
