# API Sözleşmesi (Supabase)

**Durum: Uygulandı.** SubscriptTrack'in ayrı bir REST API sunucusu **yoktur**. Mobil istemci yalnızca Supabase yüzeylerini kullanır: Auth, PostgREST (tablo sorguları), Postgres RPC fonksiyonları, Realtime ve 4 Edge Function. Yetkilendirme JWT + RLS ile yapılır; istemciden gelen kullanıcı kimliğine güvenilmez. Şema için bkz. [DATA_MODEL.md](DATA_MODEL.md), canlı durum için [SUPABASE_LIVE_STATUS.md](SUPABASE_LIVE_STATUS.md).

> Eski taslakta anlatılan `/api/v1` REST sözleşmesi, cihaz token kaydı (`/notifications/devices`) ve OpenAPI üretimi hayata geçmedi ve kapsam dışıdır ([ADR 0009](../decisions/0009-supabase-only-architecture.md)).

## 1. Ortak kurallar

- Taban adres: `SUPABASE_URL` (istemciye `--dart-define` ile verilir); anahtar: yalnızca `SUPABASE_ANON_KEY` (publishable). Service-role anahtarı istemcide bulunmaz.
- Kimlik: `Authorization: Bearer <kullanıcı JWT'si>` (Supabase SDK ekler).
- Para: veritabanında `numeric`, istemcide `Money` (minor unit).
- Tarih: `date` (yenileme/başlangıç), `timestamptz` UTC (olaylar). Tarih hesapları [DOMAIN.md](../product/DOMAIN.md) kurallarına uyar.
- Hata: Edge Function'lar `{ "error": "mesaj" }` döner; RPC/PostgREST hataları Supabase SDK istisnası olarak gelir ve istemcide `error_messages.dart` ile Türkçeleştirilir.

## 2. Auth

Supabase Auth (e-posta + şifre). Sosyal sağlayıcılar canlıda kapalıdır. Akışlar: kayıt (e-posta doğrulama açık), giriş, `resetPasswordForEmail`, `updateUser(password)`, oturum yenileme. Dönüş adresi: `subscripttrack://auth-callback`.

## 3. PostgREST (tablo sorguları)

İstemci şu tabloları doğrudan sorgular; her biri RLS ile korunur.

| Tablo | Kullanım | Kaynak |
|---|---|---|
| `subscriptions` | Liste, okuma, durum güncelleme, Realtime | `supabase_subscription_repository.dart` |
| `payment_events` | Ödeme geçmişi okuma | `payment_events_repository.dart` |
| `notifications` | Uygulama içi bildirim merkezi, okundu işareti | `notification_repository.dart`, `notification_read_sync_service.dart` |
| `savings_events` | Tasarruf olayları | `savings_repository.dart` |

## 4. RPC fonksiyonları (`authenticated`)

Hepsi `SECURITY DEFINER`; `auth.uid()` boşsa `42501 not authenticated` ile reddeder. `Idempotency` anahtarı tekrarları engeller (`idempotency_keys`, 24 saat).

| RPC | Amaç | İmza |
|---|---|---|
| `create_subscription_idempotent` | Abonelik ekle | `p_idempotency_key, p_name, p_amount, p_currency, p_billing_cycle, p_start_date, p_next_renewal_date, p_category, p_notes, p_payment_method, p_trial_end_date, p_trial_price_after` |
| `update_subscription_idempotent` | Abonelik güncelle (durum dahil) | `p_idempotency_key, p_subscription_id, p_name, p_amount, p_currency, p_billing_cycle, p_start_date, p_next_renewal_date, p_category, p_notes, p_payment_method, p_trial_end_date, p_trial_price_after, p_notification_rules jsonb, p_status` |
| `record_payment_idempotent` | Ödeme kaydı ekle (abonelik sahipliği doğrulanır) | `p_idempotency_key, p_subscription_id, p_amount, p_currency, p_paid_at` |
| `request_export_idempotent` | Dışa aktarma işi oluştur | `p_idempotency_key` |

`replace_payment_methods(p_user_id, p_names)` yalnızca `service_role` içindir (Edge Function çağırır).

## 5. Edge Function'lar

Hepsi `Authorization` başlığındaki JWT'yi `auth.getUser()` ile doğrular; veriye service-role ile erişirken her zaman `user.id` ile kısıtlar. Hız sınırı uygulanmaz ([SECURITY.md](../architecture/SECURITY.md#3-bilinen-açık-bulgular)).

### Hız sınırı ve hata yanıtları (repoda hazır, canlıda etkin değil)

- Kullanıcı başına sabit pencere sayacı (`public.check_rate_limit`, migration 032; yalnızca `service_role`). Aşılınca `429` ve `Retry-After`. Sınırlar (1 saat): `delete-account` 3, `process-export` 10, `support-catalog` POST 10 / GET 120, `payment-methods` PUT 60 / GET 240. Sayaç veritabanına ulaşamazsa istek geçirilir (fail-open) ve hata günlüğe yazılır.
- İç hata metni istemciye dönmez: `500 { "error": "Beklenmeyen bir hata oluştu" }`; ayrıntı yalnızca sunucu günlüğündedir.
- CORS: yalnızca `https://subscription-tracking.github.io` ve `localhost` kaynakları yansıtılır (`*` yok); mobil istemci Origin göndermez.
- Bu davranışlar canlıya **henüz deploy edilmedi**; canlıda eski sürüm çalışır ([SUPABASE_LIVE_STATUS.md](SUPABASE_LIVE_STATUS.md)).

### `payment-methods`
| | |
|---|---|
| `GET` | `200 { "methods": ["Garanti Bonus", …] }` (`created_at` sırasıyla) |
| `PUT` | Gövde `{ "methods": [string] }` (en çok 40, her biri 1–80 karakter, büyük/küçük harf duyarsız benzersiz) → `200 { "methods": […] }`; geçersizse `400` |
| Hatalar | `401` (token yok/geçersiz), `405`, `503` (yapılandırma), `502` (kayıt hatası) |

### `support-catalog`
| | |
|---|---|
| `GET` | `200 { "services": [{ "id", "name", "category" }] }` (`is_active`, `sort_order` sırasıyla) |
| `POST` | Gövde `{ "message": string (1–2000), "category"?: string (en çok 60 karakter) }` → `201 { "id", "status", "created_at" }`; mesaj geçersizse `400` |
| Not | Canlıdaki eski sürüm `category`'yi doğrulamaz; repodaki sürüm 60 karakter sınırı uygular |

### `process-export`
| | |
|---|---|
| `POST` | Gövde `{ "export_id": uuid }` (önce `request_export_idempotent` ile oluşturulur) → CSV üretir, özel `exports` bucket'ına yükler, 1 saatlik imzalı bağlantı döner: `200 { id, status: "READY", download_url, expires_at, … }` |
| CSV | 11 alanlı kanonik şema: `name, amount, currency, billing_cycle, next_renewal_date, category, status, notes, payment_method, trial_end_date, trial_price_after`; kullanıcı metni CSV enjeksiyonuna karşı etkisizleştirilir |
| Hatalar | `400` (`export_id` yok), `404`, `405`, `503`, `500` |

### `delete-account`
| | |
|---|---|
| `POST` | `200 { "success": true }`; çağıran kullanıcının Auth kaydını service-role ile siler |
| Hatalar | `401`, `405`, `503`, `500` |

## 6. Realtime

`supabase_realtime` yayınında yalnızca `subscriptions` vardır. İstemci `watchAll(userId)` ile dinler; gelen liste yerel listeyle birleştirilir. İki cihazlı canlı doğrulama açık iştir ([DEVICE_ACCEPTANCE.md](../operations/DEVICE_ACCEPTANCE.md)).

## 7. Uygulanmayanlar (Planlı / kapsam dışı)

| Konu | Durum |
|---|---|
| `/api/v1` REST sunucusu, OpenAPI | Kapsam dışı |
| Cihaz token kaydı, uzak push (FCM/APNs) | Kapsam dışı |
| Dashboard/takvim toplamlarının sunucuda hesaplanması | Kapsam dışı (istemcide hesaplanır) |
| Uygulama düzeyinde hız sınırı | Kısmi: repoda hazır (aşağıda), **canlıda etkin değil** |
