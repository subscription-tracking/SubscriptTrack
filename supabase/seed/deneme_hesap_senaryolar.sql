-- deneme.hesap test hesabına örnek abonelik senaryoları.
-- Kullanım: Supabase SQL Editor'da çalıştır. Aşağıdaki uid'yi test hesabının auth.users kimliğiyle değiştir.
-- Tüm satırlar notes = 'SEED-TEST' ile işaretlenir; temizlemek için: delete from subscriptions where user_id = '<uid>' and notes = 'SEED-TEST';
-- (Normal akışta silme yok, bu yalnızca test verisi temizliğidir.) Fiyatlar ve tarihler örnektir.

do $$
declare
  uid uuid := '00000000-0000-0000-0000-000000000000';
  s_netflix uuid := gen_random_uuid();
  s_spotify uuid := gen_random_uuid();
  s_icloud uuid := gen_random_uuid();
  s_youtube uuid := gen_random_uuid();
  s_gym uuid := gen_random_uuid();
  s_duolingo uuid := gen_random_uuid();
  s_adobe uuid := gen_random_uuid();
  s_xbox uuid := gen_random_uuid();
  s_gazete uuid := gen_random_uuid();
begin
  if uid = '00000000-0000-0000-0000-000000000000' then
    raise exception 'Önce uid değerini test hesabının kimliğiyle değiştir.';
  end if;

  insert into subscriptions (id, user_id, name, amount, currency, billing_cycle, category, start_date, next_renewal_date, status, is_archived, payment_method, notes, trial_end_date, trial_price_after) values
    -- 1. Aktif, yakında yenilenecek (hatırlatma senaryosu)
    (s_netflix, uid, 'Netflix', 15.99, 'USD', 'monthly', 'streaming', current_date - 90, current_date + 4, 'active', false, 'Garanti Bonus ****1234', 'SEED-TEST', null, null),
    -- 2. Deneme süresinde, deneme bitişi yaklaşmış, deneme sonrası fiyatlı
    (s_spotify, uid, 'Spotify Premium', 79.99, 'TRY', 'monthly', 'music', current_date - 5, current_date + 6, 'trial', false, null, 'SEED-TEST', current_date + 6, 79.99),
    -- 3. Gecikmiş yenileme ("Ödendi ve yenilendi" akışını test eder)
    (s_icloud, uid, 'iCloud+ 200 GB', 49.99, 'TRY', 'monthly', 'cloud', current_date - 200, current_date - 3, 'active', false, 'Yapı Kredi ****5678', 'SEED-TEST', null, null),
    -- 4. Aktif, yabancı para birimi (EUR)
    (s_youtube, uid, 'YouTube Premium', 11.99, 'EUR', 'monthly', 'streaming', current_date - 120, current_date + 20, 'active', false, 'Garanti Bonus ****1234', 'SEED-TEST', null, null),
    -- 5. Duraklatılmış, üç aylık döngü
    (s_gym, uid, 'Fitness Salonu', 2400.00, 'TRY', 'quarterly', 'fitness', current_date - 300, current_date + 45, 'paused', false, null, 'SEED-TEST', null, null),
    -- 6. İptal edilmiş, yıllık döngü
    (s_duolingo, uid, 'Duolingo Max', 6.99, 'USD', 'yearly', 'education', current_date - 400, null, 'cancelled', false, null, 'SEED-TEST', null, null),
    -- 7. Arşivlenmiş (ana listeden kaldırılmış)
    (s_adobe, uid, 'Adobe Creative Cloud', 54.99, 'USD', 'monthly', 'software', current_date - 500, current_date - 60, 'archived', true, null, 'SEED-TEST', null, null),
    -- 8. Aktif, bugün-yakın yenileme (bildirim ve takvim için)
    (s_xbox, uid, 'Xbox Game Pass', 499.00, 'TRY', 'monthly', 'gaming', current_date - 60, current_date + 2, 'active', false, 'Yapı Kredi ****5678', 'SEED-TEST', null, null),
    -- 9. Haftalık döngü, süresi dolmuş
    (s_gazete, uid, 'Dijital Gazete', 39.90, 'TRY', 'weekly', 'news', current_date - 120, current_date - 30, 'expired', false, null, 'SEED-TEST', null, null);

  -- Ödeme geçmişi: Netflix aylık, iCloud, Fitness üç aylık, Adobe arşiv öncesi, Duolingo tek ödeme.
  insert into payment_events (user_id, subscription_id, amount, currency, paid_at, source, status) values
    (uid, s_netflix, 15.99, 'USD', now() - interval '60 days', 'manual', 'PAID'),
    (uid, s_netflix, 15.99, 'USD', now() - interval '30 days', 'manual', 'PAID'),
    (uid, s_icloud, 49.99, 'TRY', now() - interval '33 days', 'manual', 'PAID'),
    (uid, s_icloud, 49.99, 'TRY', now() - interval '3 days', 'manual', 'PAID'),
    (uid, s_gym, 2400.00, 'TRY', now() - interval '120 days', 'manual', 'PAID'),
    (uid, s_gym, 2400.00, 'TRY', now() - interval '210 days', 'manual', 'PAID'),
    (uid, s_adobe, 54.99, 'USD', now() - interval '150 days', 'manual', 'PAID'),
    (uid, s_adobe, 54.99, 'USD', now() - interval '120 days', 'manual', 'PAID'),
    (uid, s_duolingo, 6.99, 'USD', now() - interval '380 days', 'manual', 'PAID');
end $$;
