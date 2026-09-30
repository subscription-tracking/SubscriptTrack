# Veri Modeli

**Durum: Uygulandı — canlı Supabase şemasına birebir** (2026-09-30, bkz. [SUPABASE_LIVE_STATUS.md](SUPABASE_LIVE_STATUS.md)).

## 1. İlkeler

- Tüm tablolar `public` şemasındadır ve **RLS açıktır**; kullanıcı tabloları `user_id = auth.uid()` ile korunur.
- Kimlikler UUID (`gen_random_uuid()`), zaman damgaları `timestamptz`.
- Tutarlar `numeric`; istemcide `Money` (minor unit) olarak taşınır ([ADR 0004](../decisions/0004-money-as-decimal.md)).
- Normal yaşam döngüsünde silme yok; iptal/arşiv ([ADR 0006](../decisions/0006-archive-over-delete.md)). Fiziksel silme yalnızca hesap silmede (Auth kullanıcısı silinir; `delete-account` fonksiyon yorumuna göre `subscriptions` cascade ile temizlenir, diğer tablolardaki FK/cascade kuralları canlıda ayrıca doğrulanmadı).
- Şema değişikliği yalnızca migration ile yapılır ([CONTRIBUTING.md](../operations/CONTRIBUTING.md)).

## 2. Tablolar

Aşağıda `PK` = `id`, kullanıcı tablolarında `user_id uuid NOT NULL` vardır.

### 2.1 `subscriptions` — istemcinin doğrudan okuduğu ana tablo
| Kolon | Tür | Not |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | NOT NULL |
| `name` | text | NOT NULL |
| `amount` | numeric | NOT NULL |
| `currency` | text | varsayılan `'TRY'` |
| `billing_cycle` | text | varsayılan `'monthly'` |
| `category` | text | varsayılan `'other'` |
| `start_date` | date | varsayılan bugün |
| `next_renewal_date` | date | |
| `status` | text | varsayılan `'active'` (`trial, active, paused, cancelled, expired, archived`) |
| `is_archived` | boolean | varsayılan `false` |
| `payment_method`, `notes`, `website`, `logo_url` | text | |
| `color` | integer | |
| `trial_end_date` | date | |
| `trial_price_after` | numeric | |
| `notification_rules` | jsonb | varsayılan `[{"enabled": true, "daysBefore": 3}]` |
| `created_at`, `updated_at` | timestamptz | `updated_at` tetikleyiciyle |

Realtime yayınında olan tek tablo.

### 2.2 `payment_events` — ödeme geçmişi
`id`, `user_id`, `subscription_id`, `amount numeric NOT NULL`, `currency char`, `paid_at timestamptz NOT NULL`, `source text` (varsayılan `'manual'`), `status text` (varsayılan `'PAID'`), `deferred_until date`, `created_at`.

### 2.3 `payment_methods` — kullanıcının kendi yazdığı etiketler
`id`, `user_id`, `name text NOT NULL`, `created_at`. Banka/kart bağlantısı **yoktur** ([ADR 0007](../decisions/0007-no-bank-integration.md)).

### 2.4 `renewal_occurrences` — yenileme olayları
`id`, `subscription_id`, `user_id`, `type` (varsayılan `RENEWAL`), `scheduled_at timestamptz`, `expected_amount text`, `currency`, `status` (varsayılan `PENDING`), `created_at`. `sync_renewal_occurrence()` tetikleyicisi `subscriptions` değişince doldurur.

### 2.5 `notifications`, `notification_rules`, `notification_deliveries`
- `notifications`: `id`, `user_id`, `subscription_id`, `occurrence_id`, `type`, `title_key`, `body_params jsonb`, `deep_link`, `read_at`, `created_at` (uygulama içi bildirim merkezi).
- `notification_rules`: `id`, `user_id`, `subscription_id`, `days_before smallint`, `enabled boolean`, `created_at`.
- `notification_deliveries`: `id`, `user_id`, `notification_id`, `channel`, `status` (varsayılan `PENDING`), `delivered_at`, `created_at`.

### 2.6 `savings_events`, `subscription_events`
- `savings_events`: `id`, `user_id`, `subscription_id`, `event_type`, `monthly_amount`, `annual_amount`, `currency`, `effective_at`.
- `subscription_events`: `id`, `user_id`, `subscription_id`, `event_type`, `payload jsonb`, `created_at` (yaşam döngüsü kaydı).

### 2.7 `profiles`
`user_id`, `first_name, `last_name`, `preferred_currency` (`'TRY'`), `timezone` (`'Europe/Istanbul'`), `locale` (`'tr-TR'`), `theme` (`'SYSTEM'`), `default_notify_days smallint` (3), `push_enabled boolean` (true), `created_at`, `updated_at`. Migration 021/023'e göre `handle_new_user_profile()` kayıtta oluşturur (`auth.users` tetikleyicisi canlıda ayrıca doğrulanmadı). **Not:** mobil istemci bu tabloyu şu an okumaz/yazmaz.

### 2.8 `service_catalog`
`id`, `name`, `category` (`'other'`), `is_active`, `sort_order`, `updated_at`. Herkese açık okuma (`anon`, `authenticated`); yazma yok.

### 2.9 `exports`, `idempotency_keys`, `support_tickets`, `device_tokens`
- `exports`: `id`, `user_id`, `status` (`PENDING`/`READY`), `storage_path`, `download_url`, `expires_at`, `error_message`, `created_at`. Dosyalar özel `exports` bucket'ında.
- `idempotency_keys`: `id`, `user_id`, `method`, `path`, `idempotency_key`, `request_hash`, `status int`, `response_body jsonb`, `expires_at` (24 saat), `created_at`. RPC'lerin tekrar korumasını sağlar.
- `support_tickets`: `id`, `user_id`, `category` (`'general'`), `message`, `status` (`'open'`), `created_at`, `updated_at`. Yalnızca oku/ekle.
- `device_tokens`: `id`, `user_id`, `token`, `platform`, `created_at`. **Planlı/kullanılmıyor:** uzak push yok, istemci yazmaz (bkz. [NOTIFICATIONS.md](../architecture/NOTIFICATIONS.md)).

### 2.10 `rate_limits` (repoda var, **canlıda yok**)
`user_id` (auth.users, cascade), `bucket`, `window_start`, `count`; PK `(user_id, bucket)`. RLS açık, politika yok, yalnızca `service_role` (migration 032, `check_rate_limit` fonksiyonu). Canlıya uygulanana kadar canlı şemada bulunmaz.

## 3. Repo migration'ında olup canlıda bulunmayan yapılar

`backend/migrations/001–005` şunları tanımlar; **canlıda yoktur**: `users`, `services`, `categories`, `billing_schedules`. Ayrıca migration 032 `rate_limits` tablosunu ve `check_rate_limit` fonksiyonunu tanımlar; henüz canlıda uygulanmamıştır. Kanonik şema bu belgedir; repo ile canlıyı eşitleme işi [RELEASE.md](../operations/RELEASE.md#9-veritabanı-migration-ve-canlı-şema) içinde izlenir.

## 4. Silme ve saklama

- Abonelik silinmez; `status` ve `is_archived` ile yönetilir.
- Hesap silme: `delete-account` Edge Function'ı Auth kullanıcısını siler. Fonksiyon yorumu `subscriptions` için `ON DELETE CASCADE` der; **diğer kullanıcı tablolarının canlıdaki FK/cascade kuralları doğrulanmadı** (açık iş: silme sonrası kalıntı veri kontrolü).
- `idempotency_keys` 24 saat sonra geçersiz sayılır (`expires_at`).
- Export dosyaları 1 saatlik imzalı bağlantıyla verilir.

## 5. Migration kuralları

- Uygulanmış migration değiştirilmez; yeni numaralı migration eklenir.
- Migration'lar `backend/migrations/` altındadır ve içeriği checksum ile izlenir (`backend/src/db/migrationPlan.js`).
- Bu belge ve [API.md](API.md) aynı değişiklikte güncellenir.
