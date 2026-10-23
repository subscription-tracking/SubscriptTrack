import { supabase } from '../../../core/supabase/client';
import { env } from '../../../core/config/env';
import { formatCivilDate, type CivilDate } from '../../../core/time/calendar';
import { SubscriptionWriteError } from './subscriptionWriteRepository';

export async function confirmAtomicRenewal(input: { idempotencyKey: string; timeZone?: string }, current: { id: string; nextRenewalDate: CivilDate }, next: CivilDate, today: CivilDate): Promise<void> {
  const timezoneAware = env.timezoneModeEnabled;
  const { error } = await supabase.rpc(timezoneAware ? 'confirm_subscription_renewal_in_timezone_idempotent' : 'confirm_subscription_renewal_idempotent', {
    p_idempotency_key: input.idempotencyKey,
    p_subscription_id: current.id,
    p_expected_old_date: formatCivilDate(current.nextRenewalDate),
    p_next_date: formatCivilDate(next),
    p_today: formatCivilDate(today),
    ...(timezoneAware ? { p_timezone: input.timeZone } : {}),
  });
  if (error) {
    if (error.code === 'P0001') throw new SubscriptionWriteError('Yenileme durumu değişti. Listeyi yenileyip tekrar dene.');
    if (error.code === '23505') throw new SubscriptionWriteError('İşlem anahtarı farklı bir yenilemede kullanıldı.');
    throw new SubscriptionWriteError('Ödeme ve yenileme kaydedilemedi. Bağlantını kontrol edip tekrar dene.');
  }
}
