# Supabase canlı envanteri — 17 Eylül 2026

## Kapsam

Bu rapor `D:\SubscriptTrack\mobile\.env` içindeki Supabase projesine yapılan salt-okunur REST kontrollerinden ve repository/migration incelemesinden oluşturuldu. Anon anahtar rapora yazılmadı.

## Canlı gözlem

| Kontrol | Sonuç |
|---|---|
| Proje | `SubscriptTrack` |
| Project ref | `tdbljrojcmyjwchawfif` |
| Auth settings | HTTP 200 |
| Email auth | Açık |
| Anonymous users | Kapalı |
| Google/Apple OAuth | Kapalı |
| Storage bucket listesi | Boş (`[]`) |

### Public REST görünürlüğü

HTTP 200, endpoint'in public REST tarafından görüldüğünü; anonim kullanıcı için boş liste dönmesi RLS ile uyumludur. HTTP 404 ise tablo yok, farklı schema'da veya PostgREST'e expose edilmemiş olabilir; tek başına kesin yokluk kanıtı değildir.

| Tablo | HTTP | REST gözlemi |
|---|---:|---|
| `subscriptions` | 200 | Görünür, anonim sonuç boş |
| `device_tokens` | 200 | Görünür, anonim sonuç boş |
| `payment_methods` | 200 | Görünür, anonim sonuç boş |
| `payment_events` | 200 | Görünür, anonim sonuç boş |
| `profiles` | 404 | REST’te görünmüyor |
| `notifications` | 404 | REST’te görünmüyor |
| `notification_rules` | 404 | REST’te görünmüyor |
| `renewal_occurrences` | 404 | REST’te görünmüyor |
| `subscription_events` | 404 | REST’te görünmüyor |
| `savings_events` | 404 | REST’te görünmüyor |
| `exports` | 404 | REST’te görünmüyor |
| `idempotency_keys` | 404 | REST’te görünmüyor |

## Migration koduyla farklar

Migration zinciri 001–014 arasında 12’den fazla tablo, trigger, RLS policy, cron ve notification occurrence yapısı tanımlıyor. Public REST gözlemi bu yapıların yalnızca bir kısmını doğruluyor. Kolon, policy, trigger, cron ve Realtime publication durumu bu yöntemle doğrulanamaz.

## Supabase CLI ile canlı proje kanıtı

- Linked project: `tdbljrojcmyjwchawfif` (`SubscriptTrack`), durum `ACTIVE_HEALTHY`.
- `supabase functions list`: `delete-account` canlıda `ACTIVE`, `verify_jwt=true`.
- `supabase migration list --linked`: migration history boş döndü.
- Bu sonuç migration SQL'lerinin kesinlikle uygulanmadığını kanıtlamaz; Dashboard SQL Editor ile manuel uygulanmış olabilir. Ancak CLI migration geçmişi ile repository'deki 001–014 dosyaları arasında izlenebilirlik yoktur.
- `supabase db dump --linked` ve `db diff --linked` Docker shadow database gerektirdiği için çalıştırılamadı; bu Docker'ın proje için zorunlu olduğu anlamına gelmez, yalnızca Supabase CLI'nin bu iki komut için yerel gereksinimidir.

## S12 sonucu

S12 REST envanteri tamamlandı; ancak tam SQL metadata envanteri tamamlanmış sayılmaz. Bunun için Supabase SQL Editor veya service-role/admin bağlantısıyla `information_schema`, `pg_policies`, `pg_trigger`, `pg_publication_tables`, `cron.job` ve `storage.buckets` sorguları çalıştırılmalıdır.

## CLI remote SQL inspection sonucu

Supabase CLI'nin remote inspection komutları Docker gerektirmeden çalıştı:

- Proje durumu: `ACTIVE_HEALTHY`.
- `public` uygulama tabloları: yalnızca `subscriptions` (7 tahmini kayıt), `payment_events` (1), `device_tokens` (0), `payment_methods` (0).
- `profiles`, `notifications`, `notification_rules`, `renewal_occurrences`, `subscription_events`, `savings_events`, `exports` ve `idempotency_keys` canlı tablo istatistiklerinde yok.
- Replikasyon slotu: yok.
- Veritabanı boyutu: 11 MB; index hit rate: 0.96; table hit rate: 0.99.
- `delete-account` Edge Function: `ACTIVE`, `verify_jwt=true`.
- CLI migration history: boş.

### Doğrudan remote SQL metadata bulguları

- `information_schema.tables`: canlı `public` şemasında yalnızca 4 tablo var: `subscriptions`, `device_tokens`, `payment_methods`, `payment_events`.
- `subscriptions.user_id` doğru biçimde `auth.users(id) ON DELETE CASCADE` foreign key'ine bağlı.
- `payment_events.subscription_id` `subscriptions(id) ON DELETE SET NULL` bağlı.
- RLS policy listesinde yalnızca bu 4 tablo için policy görüldü; her biri `auth.uid() = user_id` ile sınırlandırılmış.
- `pg_publication_tables`: boş; `subscriptions` Realtime publication'a ekli değil.
- `cron.job` sorgusu `cron.job` relation does not exist döndürdü; `pg_cron` extension/job canlıda yok.
- `subscriptions` üzerinde iki adet `updated_at` trigger'ı var: `subscriptions_updated_at` ve `trg_subscriptions_updated_at`. Aynı işi yapan duplicate trigger temizlenmeli.
- Canlı `subscriptions` kolonları mobil repository ile büyük ölçüde uyumlu; `notification_rules` kolonu canlıda yok.

Bu bulgular S13/S14/S16/S17 için doğrudan canlı kanıt niteliğindedir.

## Uygulanan düzeltmeler — 17 Eylül 2026

- `015_live_schema_completion.sql` canlı linked project'e uygulandı; eksik 9 uygulama tablosu ve `subscriptions.notification_rules` kolonu oluşturuldu.
- Canlı tablo sayısı 4'ten 13'e çıktı; mevcut 7 subscription kaydı korunuyor.
- Yeni tabloların tamamında `auth.uid() = user_id` kullanan RLS policy'leri oluşturuldu.
- `subscriptions` üzerindeki duplicate policy kaldırıldı.
- `subscriptions` `supabase_realtime` publication'a eklendi.
- `016_notification_pipeline_live.sql` uygulandı; renewal trigger kuruldu, mevcut kayıtlar için 9 occurrence üretildi.
- `notification-producer` cron job aktif ve saatlik (`0 * * * *`) çalışacak şekilde kuruldu.
- Duplicate `subscriptions_updated_at` trigger kaldırıldı; tek `trg_subscriptions_updated_at` trigger'ı bırakıldı.
- İlk eski `006` migration denemesi, olmayan cron job'ı `unschedule` etmeye çalıştığı için transaction rollback oldu; veri değişmedi. Düzeltilmiş `016` başarıyla uygulandı.

S13–S17 için canlı yapılandırma düzeltmeleri uygulandı. Kalan doğrulama: gerçek authenticated kullanıcıyla CRUD, Realtime event ve cron tarafından notification üretimi smoke testidir.

Bu remote SQL inspection, önceki REST 404 bulgularını güçlendirir: söz konusu tabloların canlı `public` şemasında bulunmadığı artık yüksek güvenle doğrulanmıştır. S13/S14 önceliği canlı şemayı migration zinciriyle hizalamaktır.

## Tekrarlanabilir komut

```text
SUPABASE_URL=... SUPABASE_ANON_KEY=... node backend/scripts/supabase-live-inventory.mjs
```
