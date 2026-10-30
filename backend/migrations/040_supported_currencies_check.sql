-- DRAFT: canlıya UYGULANMADI. Para birimi sözleşmesi: yalnız TRY, USD, EUR (kur çevrimi yok).
-- Bugün subscriptions.currency yalnız `^[A-Z]{3}$` ile sınırlı; her üç harfli kod girebilir.
-- Canlı veri (2026-10-30): subscriptions ve savings_events yalnız TRY/USD/EUR.
--   payment_events: 1 adet GBP kaydı. renewal_occurrences: 2 adet eski PENDING kayıt, currency = '₺  '.
-- Bu yüzden bu iki tablonun kısıtı NOT VALID eklenir: yeni kayıtlar denetlenir, eski kayıtlar
-- karara bağlanana kadar korunur. Karardan sonra VALIDATE çalıştırılır.
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_currency_supported CHECK (currency IN ('TRY','USD','EUR'));

ALTER TABLE public.payment_events
  ADD CONSTRAINT payment_events_currency_supported CHECK (currency IN ('TRY','USD','EUR')) NOT VALID;

ALTER TABLE public.renewal_occurrences
  ADD CONSTRAINT renewal_occurrences_currency_supported CHECK (currency IN ('TRY','USD','EUR')) NOT VALID;

ALTER TABLE public.savings_events
  ADD CONSTRAINT savings_events_currency_supported CHECK (currency IN ('TRY','USD','EUR'));

-- Eski kayıtlar düzeltildikten sonra:
--   UPDATE public.renewal_occurrences SET currency = 'TRY' WHERE currency <> 'TRY' AND trim(currency) = '₺';
--   ALTER TABLE public.renewal_occurrences VALIDATE CONSTRAINT renewal_occurrences_currency_supported;
--   (GBP kararından sonra) ALTER TABLE public.payment_events VALIDATE CONSTRAINT payment_events_currency_supported;
