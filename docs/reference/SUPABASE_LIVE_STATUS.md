# Supabase Canlı Durumu

**13 Ekim 2026 salt okunur kontrol (MCP `execute_sql`, `list_migrations`, `list_edge_functions`):** Migration geçmişi hâlâ yalnız 033, 036 ve 037'yi gösterir; ancak canlı şemada 038 ve 039 nesneleri mevcuttur: `subscriptions.deleted_at`, `profiles.timezone_mode`, `soft_delete_subscriptions_idempotent`, `confirm_subscription_renewal_in_timezone_idempotent`, `guard_deleted_subscription*` tetikleyicileri, `subscriptions_visible` politikası ve 1.000 kayıtlık `enforce_subscription_quota` (advisory lock, `deleted_at IS NULL` sayımı). Yeni fonksiyonlarda `anon` çalıştıramaz, `authenticated` çalıştırabilir. Bu nesneler geçmişe kayıtlı olmadan uygulandığı için 038/039 dosyalarını yeniden uygulamak gerekmez; 039'daki `ADD CONSTRAINT` idempotent değildir ve yeniden uygulama hata verir. `process-export` canlı sürümü (v2) hâlâ eski satır içi sürümdür: `deleted_at` süzgeci, ortak yardımcılar, hız sınırı ve CSV formül koruması yoktur; soft-delete edilmiş kayıtları dışa aktarabilir. Repodaki sürüm dağıtılana kadar `EXPO_PUBLIC_SOFT_DELETION_ENABLED` açılmamalıdır.

**12 Ekim 2026 güncel doğrulama (MCP, salt okunur + yalnızca 036/037 uygulama):**
- Migration geçmişi (`list_migrations`): `033_subscriptions_constraints`, `036_confirm_subscription_renewal_idempotent` (`20261011221006`), `037_record_deferred_payment_idempotent` (`20261011221011`). 001–032 ve 034–035 geçmişte kayıtlı değil, ama etkileri katalogda doğrulandı: 026 sahiplik kontrolü, 032 `rate_limits`/`check_rate_limit`, 034 `trg_quota_*` ve yetki daraltması (`device_tokens` yok), 035 `trg_owner_*` tetikleyicileri, 013 `status`/`deferred_until` kolonları.
- 036 ve 037 RPC'leri `authenticated` tarafından çalıştırılabilir, `anon` tarafından çalıştırılamaz. `subscription_events.payload` kolonu var.
- Veri kontrolü: sahipsiz ödeme, bildirim veya olay yok (3 `STATUS_CHANGED` olayı ve 1 `PAID` kaydının aboneliği boş; abonelik silinince `SET NULL` kuralıyla uyumlu). Tutar hatası ve aktif abonelikte eksik yenileme tarihi yok.
- Güvenlik danışmanları: `SECURITY DEFINER` RPC uyarıları bilinçli tasarım (her fonksiyonda `auth.uid()` kontrolü). `rate_limits` RLS politikasız (yalnızca service_role). **Leaked password protection kapalı** (Auth ayarı, açılması gerekiyor).
- Uygulama bayrakları (`EXPO_PUBLIC_ATOMIC_RENEWAL_ENABLED`, `EXPO_PUBLIC_IDEMPOTENT_DEFERRED_ENABLED`) hâlâ `false`; açmak yeni bir build gerektirir.

**Durum: Uygulandı (2026-09-30 tarihinde dashboard'dan salt okunur alındı).** Proje ref: `tdbljrojcmyjwchawfif` (adı "SubscriptTrack"). Bu belge tarihli bir anlık görüntüdür; canlı ortam değiştiğinde yeniden alınmalıdır.

**2026-10-10/11 canlı denetimi:** Auth settings, Storage ve `subscriptions`/`profiles`/`notifications`/`exports` uçları HTTP 200 döndü. `profiles.timezone`, `default_notify_days`, `push_enabled` ve `notifications.read_at` sütunları yalnız seçme isteğinde HTTP 200 döndü. `support_tickets` anonim isteği HTTP 401, `device_tokens` REST route'u HTTP 404 döndü. Repodaki migration 034 `device_tokens` tablosunu kaldırmayı öngörür; 404 bununla uyumludur ancak tek başına migration'ın canlıya uygulandığını kanıtlamaz. 11 Ekim yenileme onayı smoke'u geçici abonelik, ödeme ve olay yazımı/okumasını, kısmi hata sonrası tekrar davranışını ve temizliği test hesabında doğruladı ([API.md](API.md)). RLS'in iki hesap arasındaki izolasyonunu salt okunur kontroller doğrulamaz. Aşağıdaki 30 Eylül envanteri tarihsel kayıttır.

**Canlı tekrar (11 Ekim 2026, S14):** Yenileme smoke'u tekrar geçti: geçici gecikmiş abonelik ve ödeme oluşturma/okuma; geçersiz tarih güncellemesinden sonra ödeme ve eski tarihin korunması; ödeme RPC tekrarının idempotent olması; geçerli onayla yenileme tarihi ve olay yazımı; geçici satırların temizliği. Kimliği doğrulanmış salt-okunur smoke profil sahipliğini, anonim profil izolasyonunu, abonelik/bildirim/export/ödeme okumalarını ve `support-catalog` GET'ini geçti; OpenAPI kökü 401 döndü. Export preflight mevcut test hesabında **1 export kaydı ve 1 özel nesne** buldu; üzerine yazma riski nedeniyle cloud-export smoke çalıştırılmadı. Salt-okunur public REST envanteri 11 Ekim'de yenilendi: `device_tokens` 404; `support_tickets` korumalı; geri kalan listelenen tablolar erişilebilir. Bu envanter sütun, politika, trigger, cron, Realtime publication veya migration içeriğini açığa çıkarmaz. İki hesap RLS, cihaz offline FIFO, ayrı hesap silme ve migration/admin SQL uzlaştırması açık kalır.

**Test hesabıyla salt okunur kontrol (10 Ekim 2026):** `backend/scripts/expo-authenticated-readonly-smoke.mjs` giriş (HTTP 200), hesaba ait profil satırı, abonelik/bildirim/export/ödeme okuma ve `support-catalog` GET çağrılarını doğruladı. Aynı testte anonim `profiles` sorgusu sıfır satır döndü; bu yalnız anonim profil ayrımına kanıttır. Başka kullanıcıya ait veriyi okuma/yazma reddi, RPC/Function yazımları, export ve hesap silme test edilmedi.

**Salt okunur sözleşme tekrarı (11 Ekim 2026):** Aynı smoke testi Expo `.env` değişkenlerini kullanacak şekilde çalıştırıldı. Test hesabı oturumu, profil sahipliği, anonim profil izolasyonu, abonelik/bildirim/export/ödeme okumaları ve `support-catalog` HTTP 200 döndü; kimlik doğrulanmış OpenAPI kökü HTTP 401 verdi. İstek/yanıt gövdeleri veya kimlik bilgileri rapora alınmadı. Bu tekrar çapraz hesap RLS, yazım ve OpenAPI envanterini doğrulamaz.

**Migration durumlarının uzlaştırılması (11 Ekim 2026):** `supabase migration list --linked` uzak projede `20261010162939` sürümünü gösterdi. Repoda `supabase/migrations` kaynağı bulunmadığından bu sürümün hangi SQL değişikliğine karşılık geldiği ve yerel migration zinciriyle eşleşmesi belirlenemedi; sürüm numarası tek başına canlı DDL'in içeriğini kanıtlamaz. `request_export_idempotent` ve `process-export` canlı işlevsel smoke ile doğrulandı (migration 019'un içeriğini birebir kanıtlamaz). Yenileme RPC'sinin canlı argüman imzası ve `authenticated` EXECUTE izni okundu; geçici kayıtlarla işlevsel smoke da geçti. Rate limit migration 032 [SECURITY.md](../architecture/SECURITY.md) ve [API.md](API.md) kaydına göre canlıda etkin değildir. Migration 033 dosya başlığı 10 Ekim'de uygulandığını bildirir; `subscriptions.amount` CHECK kısıtı SQL/admin üzerinden okunmadı. Migration 034'ün `device_tokens` kaldırma beklentisi REST 404 ile uyumludur ama uygulandığını kanıtlamaz. Migration 035'in kendi başlığı canlıya uygulanmadığını söyler. Migration 032–035'in uygulanma durumu ve `20261010162939` eşlemesi için kaynak SQL/admin kanıtı gerekir.

**Canlı smoke tekrarı (11 Ekim 2026):** Test hesabında abonelik create/update RPC, idempotency tekrar ve çatışması, `start_date` korunumu, ödeme etiketi ve ödeme oluşturma/düzenleme/idempotency akışları geçti; geçici abonelik/ödeme satırları silinip doğrulandı, ödeme etiketleri önceki haline döndürüldü. Bildirim profil tercihleri ve okunmamış bir satırın `read_at` değeri geçici yazılıp okundu ve eski değerlerine döndürüldü. Önceden `reminder_hour` olmadığı için Auth metadata saat denemesi atlandı. `expo/scripts/realtime-smoke.mjs` iki ayrı oturum açtı; ikinci oturum ilk oturumun geçici abonelik INSERT olayını aldı ve fixture temizlendi. Bu, aynı kullanıcıdaki çoklu oturum Realtime kanıtıdır; iki farklı kullanıcı RLS sonucu değildir. Destek bileti ve hesap silme yapılmadı.

**Test hesabıyla geçici yazma kontrolü (10 Ekim 2026):** `authenticated-subscription-smoke.mjs` create/update RPC'leri, iki idempotency tekrarı, aynı anahtarla farklı payload çatışması ve satırın temizleme sonrası yokluğu için geçti. `authenticated-feature-smoke.mjs` ödeme yöntemi etiketi yazma/okuma ve eski değere geri alma ile destek kataloğu GET için geçti. Destek talebi gönderilmedi; hesap silinmedi. Bunlar yalnız tek hesapta sözleşme kanıtıdır; çapraz hesap RLS açık. Bulut export sonucu aşağıda ayrıca kayıtlıdır.

`notification-read-smoke.mjs` test hesabındaki tek okunmamış bildirim için `read_at` yazma/okuma ve önceki `null` değerine geri alma denemesini geçti. Bu, bildirim okundu yazımının tek hesapta çalıştığını gösterir; iki cihaz senkronu ve offline tekrar denemesi cihazda doğrulanmadı.

`notification-prefs-smoke.mjs` profilin `push_enabled` ve `default_notify_days` alanlarını geçici değiştirip yeniden okudu ve eski değerlere döndürdü. Test hesabında önceden `reminder_hour` meta verisi olmadığı için saat alanı kalıcı biçimi değiştirmemek adına atlandı. İki cihaz eşitlemesi ve saat tercihi canlı yazımı açık.

`authenticated-payment-smoke.mjs` geçici abonelikte ödeme RPC oluşturma/okuma, idempotency tekrar ve farklı payload çatışması, ödeme düzenleme ve ödeme ile aboneliğin temizleme sonrası yokluğu denemelerini geçti. Bu, tek hesapta ödeme API sözleşmesini doğrular; çapraz hesap RLS ve cihaz ekranı sonuçları değildir.

Kimliği doğrulanmış PostgREST OpenAPI kökü `/rest/v1/` bu denemede HTTP 401 döndürdü. Bu salt okunur envanter yolu RPC varlığına kanıt vermedi; aşağıdaki doğrudan canlı deneme RPC ve Function'ı doğruladı.

**Bulut dışa aktarma canlı denemesi (10 Ekim 2026):** Ön kontrol test hesabında sıfır export satırı ve sıfır depolama nesnesi gösterdi. `cloud-export-smoke.mjs` `request_export_idempotent` oluşturma/tekrar, `process-export` `READY`, imzalı URL'den kanonik başlıklı 9 veri satırlı CSV indirme ve özel `exports` bucket'ındaki nesne/satır doğrulamasını geçti. Test hesabında tek özel `latest.csv` ve bir `READY` export satırı bırakıldı; imzalı URL test çıktısına yazılmadı. Bu sonuç önceki OpenAPI 401'in RPC yokluğu anlamına gelmediğini gösterir. Cihazdan paylaşma ve geri içe alma ayrıca açık.

## Özet

| Konu | Durum |
|---|---|
| Tablolar | 15, hepsinde RLS açık |
| Güvenlik advisor | 0 hata, 5 uyarı (4 tasarım gereği RPC, 1 aksiyon gerekli) |
| Performans advisor | 0 uyarı (migration 031 sonrası; öncesi 15), 14 bilgi notu |
| Edge Function | 4 adet ve ACTIVE (`delete-account` v2, `process-export` v2, `payment-methods` v1, `support-catalog` v1), hepsi `verify_jwt=true`; hız sınırı çağrısı içermiyor (repodaki `_shared/ratelimit.js` canlıda değil) |
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

Açık güvenlik işleri ve canlıya alınmayı bekleyen düzeltmeler: [SECURITY.md](../architecture/SECURITY.md#3-açık-güvenlik-işleri).

## Repo ile canlı arasındaki sapma

Repodaki `backend/migrations/001–005` zinciri `users`, `services`, `categories`, `billing_schedules` tablolarını oluşturur; **canlıda bu tablolar yoktur**. Canlıda ayrıca repodaki tek tek migration'lardan üretilmemiş bir geçmiş vardır (migration geçmişi boş). Kalıcı çözüm: canlıdan bir baseline migration üretmek ve "canlıya elle DDL yok" kuralı (bkz. [RELEASE.md](../operations/RELEASE.md#9-veritabanı-migration-ve-canlı-şema)).

## Hesap silme ve silme kuralları (2026-10-01'de canlıdan doğrulandı)

`delete-account` yalnızca Auth kullanıcısını siler; tablo satırlarının temizlenmesi yabancı anahtarlara bağlıdır. Canlıda salt okunur sorguyla doğrulandı:

- Tüm `user_id` yabancı anahtarları `auth.users`'a **`ON DELETE CASCADE`** ile bağlıdır (abonelikler, ödeme olayları, bildirimler, profil, dışa aktarma kayıtları, destek kayıtları vb.). Aboneliğe bağlı olay tablolarında abonelik silinince `SET NULL` veya `CASCADE` uygulanır.
- **İstisna:** `device_tokens.user_id` anahtarında `CASCADE` yoktur (varsayılan `NO ACTION`). Tablo şu an boştur ve uygulama yazmaz; satır olsaydı hesap silme yabancı anahtar hatasıyla başarısız olurdu. Tablo kaldırılmalı veya anahtar `CASCADE` yapılmalıdır.
- Storage `exports` kovası özeldir, boyut/MIME sınırı tanımlı değildir ve şu an hiç dosya içermez. Hesap silme Storage nesnelerini **silmez** (bu yüzden dışa aktarma kullanıldığında temizlik gerekir; Planlı).

Tekrar doğrulamak için (salt okunur):

```sql
SELECT c.conrelid::regclass AS tablo, c.conname, c.confrelid::regclass AS hedef,
       CASE c.confdeltype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
            WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END AS silme_kurali
FROM pg_constraint c
WHERE c.contype = 'f' AND c.connamespace = 'public'::regnamespace
ORDER BY 1, 2;
```

## Nasıl yeniden alınır

Dashboard > SQL Editor'de yalnızca `SELECT` çalıştırılır (`information_schema.columns`, `pg_policies`, `pg_proc`, `information_schema.triggers`, `storage.buckets`, `cron.job`, `pg_publication_tables`, `pg_extension`); Auth ayarları Authentication > Sign In / Providers ve URL Configuration'dan okunur; advisor'lar Advisors sayfasından. Hiçbir yazma yapılmaz.
