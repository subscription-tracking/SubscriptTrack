# Supabase Canlı Durumu

**Durum: Uygulandı (2026-09-30 tarihinde dashboard'dan salt okunur alındı).** Proje ref: `tdbljrojcmyjwchawfif` (adı "SubscriptTrack"). Bu belge tarihli bir anlık görüntüdür; canlı ortam değiştiğinde yeniden alınmalıdır.

## Özet

| Konu | Durum |
|---|---|
| Tablolar | 15, hepsinde RLS açık |
| Güvenlik advisor | 0 hata, 5 uyarı (4 tasarım gereği RPC, 1 aksiyon gerekli) |
| Performans advisor | 0 uyarı (migration 031 sonrası; öncesi 15), 14 bilgi notu |
| Edge Function | 4 adet, hepsi kimlik doğruluyor |
| Realtime | Yalnızca `subscriptions` |
| Storage | `exports` (özel) |
| Zamanlanmış iş | `notification-producer` (pg_cron, saatlik: `0 * * * *`) |
| Uzantılar | pg_cron, pgcrypto, uuid-ossp, supabase_vault, pg_stat_statements |
| Migration geçmişi | **Boş** (SQL dashboard'dan elle çalıştırılmış; `001–031` uygulanmışlığı buradan doğrulanamaz) |

## Advisor bulguları

| Uyarı | Değerlendirme |
|---|---|
| `SECURITY DEFINER` fonksiyonlar oturum açmış kullanıcıya açık (4): `create_subscription_idempotent`, `update_subscription_idempotent`, `record_payment_idempotent`, `request_export_idempotent` | **Tasarım gereği.** Hepsi `auth.uid()` boşsa reddeder; güncelleme `user_id` ile filtreler; ödeme kaydı abonelik sahipliğini doğrular (026); `anon` erişimi 027'de kaldırıldı |
| Leaked Password Protection kapalı | **Aksiyon gerekli** (Authentication ayarlarından açılır; plan kısıtı doğrulanmadı) |
| 15× Auth RLS Initialization Plan | Migration 031 ile giderildi |

## Auth ayarları

| Ayar | Değer |
|---|---|
| E-posta ile giriş | Açık |
| E-posta doğrulama (Confirm email) | Açık |
| Yeni kayıt | Açık |
| Anonim giriş | Kapalı |
| Manuel bağlama | Kapalı |
| Sosyal sağlayıcılar (Google, Apple, GitHub …) | Hepsi kapalı |
| İzinli yönlendirme URL'leri | Yalnızca `subscripttrack://auth-callback` |

> Bulgu: GitHub Pages web önizleme adresi izinli yönlendirme listesinde **yok**; web önizlemede e-posta doğrulama/şifre sıfırlama dönüşü bu yüzden çalışmayabilir. Ayrıntı için [RELEASE.md](../operations/RELEASE.md#4-github-pages-web-önizleme).

## RLS politikaları

Tüm politikalar `auth.uid()` ile kullanıcı sahipliğini denetler (031'den sonra `(select auth.uid())` biçiminde).

| Tablo | Politika | Komut | Roller |
|---|---|---|---|
| `device_tokens` | users manage own tokens | ALL | public |
| `exports` | own_exports | ALL | public |
| `idempotency_keys` | own_idempotency_keys | ALL | public |
| `notification_deliveries` | own_notification_deliveries | ALL | public |
| `notification_rules` | own_notification_rules | ALL | public |
| `notifications` | own_notifications | ALL | public |
| `payment_events` | users_own_payment_events | ALL | public |
| `payment_methods` | users_own_payment_methods | ALL | public |
| `profiles` | own_profiles | ALL | public |
| `renewal_occurrences` | own_renewal_occurrences | ALL | public |
| `savings_events` | own_savings_events | ALL | public |
| `service_catalog` | service_catalog_public_read | SELECT | anon, authenticated |
| `subscription_events` | own_subscription_events | ALL | public |
| `subscriptions` | user sees own subscriptions | ALL | public |
| `support_tickets` | support_tickets_own_read / _own_insert | SELECT / INSERT | authenticated |

## Fonksiyonlar (`public`)

| Fonksiyon | Tür | anon | authenticated |
|---|---|---|---|
| `create_subscription_idempotent(…)` | DEFINER | hayır | evet |
| `update_subscription_idempotent(…)` | DEFINER | hayır | evet |
| `record_payment_idempotent(…)` | DEFINER | hayır | evet |
| `request_export_idempotent(p_idempotency_key)` | DEFINER | hayır | evet |
| `replace_payment_methods(p_user_id, p_names)` | DEFINER | hayır | hayır (yalnızca service role, Edge Function çağırır) |
| `handle_new_user_profile()` | DEFINER (tetikleyici) | hayır | hayır |
| `sync_renewal_occurrence()` | DEFINER (tetikleyici) | hayır | hayır |
| `set_updated_at()` | INVOKER (tetikleyici) | evet | evet |

Tetikleyiciler (`subscriptions`): `trg_subscriptions_updated_at` (BEFORE UPDATE), `trg_sync_renewal_occurrence` (AFTER INSERT/UPDATE).

## Edge Function'lar

| Fonksiyon | Yöntem | Kimlik doğrulama | Ayrıntı |
|---|---|---|---|
| `delete-account` | POST | `auth.getUser()` | [API.md](API.md#delete-account) |
| `payment-methods` | GET, PUT | `auth.getUser()` | [API.md](API.md#payment-methods) |
| `process-export` | POST | `auth.getUser()` | [API.md](API.md#process-export) |
| `support-catalog` | GET, POST | `auth.getUser()` | [API.md](API.md#support-catalog) |

Bilinen açık bulgular ve hız sınırı eksikliği: [SECURITY.md](../architecture/SECURITY.md#3-bilinen-açık-bulgular).

## Repo ile canlı arasındaki sapma

Repodaki `backend/migrations/001–005` zinciri `users`, `services`, `categories`, `billing_schedules` tablolarını oluşturur; **canlıda bu tablolar yoktur**. Canlıda ayrıca repodaki tek tek migration'lardan üretilmemiş bir geçmiş vardır (migration geçmişi boş). Kalıcı çözüm: canlıdan bir baseline migration üretmek ve "canlıya elle DDL yok" kuralı (bkz. [RELEASE.md](../operations/RELEASE.md#9-veritabanı-migration-ve-canlı-şema)).

## Nasıl yeniden alınır

Dashboard > SQL Editor'de yalnızca `SELECT` çalıştırılır (`information_schema.columns`, `pg_policies`, `pg_proc`, `information_schema.triggers`, `storage.buckets`, `cron.job`, `pg_publication_tables`, `pg_extension`); Auth ayarları Authentication > Sign In / Providers ve URL Configuration'dan okunur; advisor'lar Advisors sayfasından. Hiçbir yazma yapılmaz.
