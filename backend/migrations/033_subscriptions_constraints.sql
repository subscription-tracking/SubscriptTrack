-- 033: `subscriptions` için veri bütünlüğü kısıtları (güvenlik denetimi F-07).
--
-- Canlıda tablo 002'deki CREATE TABLE IF NOT EXISTS atlandığı için CHECK
-- kısıtları yoktu; doğrudan REST yazımı (RLS yalnızca sahipliği denetler)
-- sınırsız uzunlukta/değerde satır kabul ediyordu. Kısıtlar RPC'lerin ve
-- uygulamanın zaten ürettiği değerlerle birebir uyumludur (lowercase anahtarlar).
--
-- Güvenli uygulama: önce NOT VALID (yeni yazımları hemen korur, mevcut satırları
-- taramaz), ardından VALIDATE (mevcut satırlar uymuyorsa hata verir ve değişiklik
-- geri alınır; önce `033_precheck` sorgusuyla ihlal sayısını görün).
-- Geri alma: her kısıt için `ALTER TABLE ... DROP CONSTRAINT <ad>`.
--
-- Bu migration repoda yazılmıştır; canlıda UYGULANMAMIŞTIR.

-- Ön kontrol (salt okunur): her sayı 0 olmalı.
--   SELECT count(*) FILTER (WHERE char_length(name) NOT BETWEEN 1 AND 160) AS name,
--          count(*) FILTER (WHERE amount < 0 OR amount > 1000000000)       AS amount,
--          count(*) FILTER (WHERE currency::text !~ '^[A-Z]{3}$')           AS currency,
--          count(*) FILTER (WHERE billing_cycle NOT IN ('weekly','monthly','quarterly','yearly')) AS cycle,
--          count(*) FILTER (WHERE category NOT IN ('streaming','music','gaming','software','cloud','fitness','news','food','education','other')) AS category,
--          count(*) FILTER (WHERE status NOT IN ('trial','active','paused','cancelled','expired','archived')) AS status,
--          count(*) FILTER (WHERE char_length(notes) > 2000)                AS notes,
--          count(*) FILTER (WHERE char_length(payment_method) > 80)         AS payment_method,
--          count(*) FILTER (WHERE pg_column_size(notification_rules) > 4096) AS rules
--   FROM public.subscriptions;

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_name_length,
  DROP CONSTRAINT IF EXISTS subscriptions_amount_range,
  DROP CONSTRAINT IF EXISTS subscriptions_currency_format,
  DROP CONSTRAINT IF EXISTS subscriptions_billing_cycle_allowed,
  DROP CONSTRAINT IF EXISTS subscriptions_category_allowed,
  DROP CONSTRAINT IF EXISTS subscriptions_status_allowed,
  DROP CONSTRAINT IF EXISTS subscriptions_notes_length,
  DROP CONSTRAINT IF EXISTS subscriptions_payment_method_length,
  DROP CONSTRAINT IF EXISTS subscriptions_notification_rules_size;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_name_length
    CHECK (char_length(name) BETWEEN 1 AND 160) NOT VALID,
  ADD CONSTRAINT subscriptions_amount_range
    CHECK (amount >= 0 AND amount <= 1000000000) NOT VALID,
  ADD CONSTRAINT subscriptions_currency_format
    CHECK (currency::text ~ '^[A-Z]{3}$') NOT VALID,
  ADD CONSTRAINT subscriptions_billing_cycle_allowed
    CHECK (billing_cycle IN ('weekly','monthly','quarterly','yearly')) NOT VALID,
  ADD CONSTRAINT subscriptions_category_allowed
    CHECK (category IN ('streaming','music','gaming','software','cloud',
                        'fitness','news','food','education','other')) NOT VALID,
  ADD CONSTRAINT subscriptions_status_allowed
    CHECK (status IN ('trial','active','paused','cancelled','expired','archived')) NOT VALID,
  ADD CONSTRAINT subscriptions_notes_length
    CHECK (notes IS NULL OR char_length(notes) <= 2000) NOT VALID,
  ADD CONSTRAINT subscriptions_payment_method_length
    CHECK (payment_method IS NULL OR char_length(payment_method) <= 80) NOT VALID,
  ADD CONSTRAINT subscriptions_notification_rules_size
    CHECK (pg_column_size(notification_rules) <= 4096) NOT VALID;

ALTER TABLE public.subscriptions
  VALIDATE CONSTRAINT subscriptions_name_length,
  VALIDATE CONSTRAINT subscriptions_amount_range,
  VALIDATE CONSTRAINT subscriptions_currency_format,
  VALIDATE CONSTRAINT subscriptions_billing_cycle_allowed,
  VALIDATE CONSTRAINT subscriptions_category_allowed,
  VALIDATE CONSTRAINT subscriptions_status_allowed,
  VALIDATE CONSTRAINT subscriptions_notes_length,
  VALIDATE CONSTRAINT subscriptions_payment_method_length,
  VALIDATE CONSTRAINT subscriptions_notification_rules_size;
