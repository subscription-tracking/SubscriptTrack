import { supabase } from '../../../core/supabase/client';
import { Money } from '../../../core/domain/money';
import { type SavingsDraft, type SavingsEvent } from '../domain/savingsSummary';
import { DataWriteError } from '../../../core/errors/dataWriteError';

/**
 * Tasarruf olayları (`savings_events`). Yazma ve okuma doğrudan tabloya yapılır; RLS yalnızca
 * kullanıcının kendi satırlarına izin verir ([API.md §3](../../../../../docs/reference/API.md)).
 */

export async function insertSavings(userId: string, subscriptionId: string, draft: SavingsDraft): Promise<void> {
  const { error } = await supabase.from('savings_events').insert({
    user_id: userId,
    subscription_id: subscriptionId,
    event_type: draft.eventType,
    monthly_amount: draft.monthlyAmount,
    annual_amount: draft.annualAmount,
    currency: draft.currency,
  });
  if (error) throw new DataWriteError('Tasarruf kaydı yazılamadı.', { code: error.code || undefined, retryable: !error.code });
}

interface SavingsRow {
  subscription_id: string | null;
  event_type: string;
  annual_amount: string | number;
  currency: string;
  effective_at: string;
}

export async function fetchSavings(): Promise<SavingsEvent[]> {
  const { data, error } = await supabase
    .from('savings_events')
    .select('subscription_id, event_type, annual_amount, currency, effective_at')
    .order('effective_at', { ascending: false })
    .limit(100);
  if (error) throw new Error('Tasarruf kayıtları yüklenemedi. Bağlantını kontrol edip tekrar dene.');
  return (data as SavingsRow[]).map((row) => ({
    subscriptionId: row.subscription_id,
    eventType: row.event_type,
    annual: Money.fromJson(row.annual_amount),
    currency: row.currency,
    effectiveAt: row.effective_at,
  }));
}
