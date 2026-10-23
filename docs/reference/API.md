# API Sözleşmesi (Supabase)

**22 Ekim kapanış güncellemesi:** `record_deferred_payment_idempotent` aynı imzayla kullanıcı/yol/anahtar kilidi altında paralel tekrarları tek sonuca bağlar. Ödeme geçmişi `(paid_at DESC,id DESC)` cursor kullanır; eşzamanlı tarih düzenlemesinde snapshot garantisi yoktur, sonraki yenileme uzlaştırır. `process-export` READY tekrarında tam iş/indirme alanlarını döndürür; süresi geçmiş işi yeniden üretir. Kullanıcı başına latest dosya yolu korunur; eski imzalı latest bağlantısı geçerli olduğu sürece en güncel dosyayı gösterebilir. Hesap silme Storage'ın tüm sayfalarını ve alt klasörlerini tarar; temizlik hatasında Auth silinmez. [Kabul ve dağıtım](../expo/CLOSURE_SPRINTS.md).

**Durum: Uygulandı.** SubscriptTrack'in ayrı bir REST API sunucusu **yoktur**. Mobil istemci yalnızca Supabase yüzeylerini kullanır: Auth, PostgREST (tablo sorguları), Postgres RPC fonksiyonları, Realtime ve 4 Edge Function. Yetkilendirme JWT + RLS ile yapılır; istemciden gelen kullanıcı kimliğine güvenilmez. Şema için bkz. [DATA_MODEL.md](DATA_MODEL.md), canlı durum için [SUPABASE_LIVE_STATUS.md](SUPABASE_LIVE_STATUS.md).

> Eski taslakta anlatılan `/api/v1` REST sözleşmesi, cihaz token kaydı (`/notifications/devices`) ve OpenAPI üretimi hayata geçmedi ve kapsam dışıdır ([ADR 0009](../decisions/0009-supabase-only-architecture.md)).

## 1. Ortak kurallar

- Taban adres: `SUPABASE_URL` (istemciye `--dart-define` ile verilir); anahtar: yalnızca `SUPABASE_ANON_KEY` (publishable). Service-role anahtarı istemcide bulunmaz.
- Kimlik: `Authorization: Bearer <kullanıcı JWT'si>` (Supabase SDK ekler).
- Para: veritabanında `numeric`, istemcide `Money` (minor unit).
- `subscriptions.amount` için migration 033 `0–1.000.000.000,00` CHECK sözleşmesini tanımlar; migration dosyasının başlığı 10 Ekim'de canlıya uygulandığını bildirir. İstemciler form ve CSV içe aktarmada aynı sınırı kuruş cinsinden denetler. Bu turda canlı SQL envanteri veya üst-sınır RPC denemesi yapılmadı; canlı kanıt durumu [SUPABASE_LIVE_STATUS.md](SUPABASE_LIVE_STATUS.md) içinde ayrıdır.
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
| `record_deferred_payment_idempotent` (037; canlıda uygulandı, 12 Ekim 2026) | Ertelenmiş ilk ödeme kaydı (`status = DEFERRED`, toplamlara girmez); sahiplik ve idempotency `record_payment_idempotent` ile aynıdır | `p_idempotency_key text, p_subscription_id uuid, p_amount numeric, p_currency text, p_paid_at timestamptz, p_deferred_until date` |
| `confirm_subscription_renewal_idempotent` (036; canlıda uygulandı, 12 Ekim 2026) | Ödeme, sonraki tarih ve `RENEWAL_ADVANCED` olayını tek işlemde yazar | `p_idempotency_key text, p_subscription_id uuid, p_expected_old_date date, p_next_date date, p_today date` |
| `request_export_idempotent` | Dışa aktarma işi oluştur | `p_idempotency_key` |

**Expo istemcisi notları (S1, 2026-10-09):**

`p_today`, sunucuda `profiles.timezone` IANA bölgesindeki gerçek günle ayrıca eşleştirilir; yanlış gün `P0001` ile reddedilir.

Migration 037 (`record_deferred_payment_idempotent`) ertelenmiş ilk ödemeyi `record_payment_idempotent` ile aynı sahiplik ve idempotency kurallarıyla yazar; anahtar `/payment-events/deferred` yolunda saklanır. İstemci bu RPC'yi yalnız `EXPO_PUBLIC_IDEMPOTENT_DEFERRED_ENABLED=true` iken çağırır; varsayılan `false` olduğundan 037 canlıya uygulanana kadar eski doğrudan `payment_events` yazımı kullanılır. Migration 036 çağrısı abonelik satırını sahiplik koşuluyla kilitler; aynı anahtar ve aynı girdide kaydedilmiş sonucu döner, farklı girdide `23505`, değişmiş durum/tarihte `P0001`, bulunmayan veya başkasına ait kayıtta `P0002` üretir. Kullanıcının IANA bölgesindeki `p_today` UTC bugünün ±1 günüyle sınırlanır. Üç yazımdan biri hata verirse PostgreSQL işlev çağrısının tamamı geri alınır. `EXPO_PUBLIC_ATOMIC_RENEWAL_ENABLED` varsayılan `false` olduğundan Expo bugün eski iki çağrılı yolu kullanır; canlı migration doğrulanıp anahtar ayrı bir dağıtımda açılana kadar eski yolun ödeme/tarih atomikliği **yoktur**. Eski `record_payment_idempotent` ve `update_subscription_idempotent` işlevleri eski istemciler için korunur. Aynı anahtarın sonucu `idempotency_keys` saklama süresi boyunca garanti edilir; temizleme sonrası tekrar ayrı işlem sayılabilir.

- `update_subscription_idempotent` tüm alanları yazar; `p_notification_rules` null ise `[]` yazar. İstemci her güncellemede mevcut kuralları okuyup geri gönderir, aksi halde bildirim kuralları sıfırlanır.
- RPC `subscription_events` satırı yazmaz. İstemci, güncellemeden sonra olay satırını kendi RLS yetkisiyle ekler (`own_subscription_events`). İki çağrı atomik değildir: olay yazımı başarısız olursa güncelleme geri alınmaz ve arayüz "geçmiş kaydı yazılamadı" uyarısı gösterir.
- Olay tipleri: `PRICE_CHANGED` (tutar veya para birimi değişti; payload `from_amount, from_currency, to_amount, to_currency`) ve `STATUS_CHANGED` (payload `from_status, to_status`). `STATUS_CHANGED` Flutter'da henüz yazılmaz; Expo'da yeni kuraldır.
- Tasarruf (S5): duraklatma (`PAUSED`) ve iptalde (`CANCELLED`) `savings_events` satırı yazılır: `monthly_amount` aylık eşdeğer, `annual_amount` × 12. Yazım kuyrukta üçüncü aşamadır; olay ve tasarruf birbirinden bağımsız yeniden denenir.
- Dışa aktarma: Expo arayüzü hem cihazda CSV üretimini hem `request_export_idempotent` → `process-export` bulut yolunu çağırıyor. 10 Ekim 2026'da test hesabıyla canlı RPC, idempotency, Function `READY`, 1 saatlik imzalı bağlantı ve 9 satırlık CSV indirme geçti. Eski "canlıda RPC yok" kaydı geçersizdir. Cihaz paylaşımı, dosya geri içe aktarımı ve iki platform kabulü açık ([Expo denetimi](../quality/expo-migration-audit.md)).
- İptal akışı (S5+): iptal tarihi ve varsa erişim bitişi `STATUS_CHANGED` olayının payload'ında (`cancelled_on`, `access_ends_on`) saklanır; `subscriptions` tablosunda bu kolonlar yoktur ([DOMAIN §4](../product/DOMAIN.md)).
- Ödeme kaydı `record_payment_idempotent` ile yazılır; çevrimdışıyken kuyruğa alınmaz (kullanıcı girdisi olan tarih ve tutar sonradan yanlış dönemi yazabilir). Flutter ve Expo'daki "Ödendi ve yenilendi" eylemi önce manuel ödeme kaydını, sonra abonelik tarihini/`RENEWAL_ADVANCED` olayını yazar; Expo iki istekte aynı idempotency anahtarını kullanır. Bu iki API yazımı tek veritabanı işlemi değildir; ödeme başarılı olduktan sonra yenileme yazımı başarısız kalırsa ödeme geçmişinde kayıt kalabilir ve canlı hata/tekrar senaryosu ayrıca kabul edilmelidir. Düzenleme (tutar ve tarih) ve silme doğrudan `payment_events` üzerinden RLS ile yapılır; para birimi değişmez. Expo etkilenen satır kimliğini geri ister; RLS nedeniyle sıfır satır değişirse başarı göstermek yerine "bulunamadı" hatası verir. Abonelik kalıcı silme yalnız yanlış oluşturulmuş arşiv kaydı için, kullanıcı beyanından sonra `subscriptions` tablosunda RLS ile yapılır; çevrimdışıyken yapılmaz. Bu tablodaki RLS delete politikası ve bağımlı kayıtların cascade davranışı canlıda henüz doğrulanmadı.

- Expo bildirim tercihleri: `profiles.push_enabled` ve `profiles.default_notify_days` PostgREST üzerinden hesapta saklanır. Yerel bildirimin gönderim saati `auth.users.user_metadata.reminder_hour` ile Supabase Auth API üzerinden hesapta saklanır (0–23; varsayılan 9). Eski cihaz yerel tercihi yalnız saat için geçiş yedeğidir; iki cihaz canlı eşitlemesi henüz doğrulanmadı. `push_enabled` mevcut şema alanının adıdır; Expo uzak push kullanmaz.
- Arşiv `status = 'archived'` ile yazılır. Liste `is_archived = true` olan kayıtları da arşiv sayar (Flutter modeliyle aynı).
- Yenileme onayı (S2): vadesi bugün veya geçmiş aktif abonelikte `record_payment_idempotent` abonelik tutarı/para birimiyle manuel ödeme ekler; `update_subscription_idempotent`, `p_next_renewal_date` alanını bugünden sonraki ilk döngüye ilerletir ve `RENEWAL_ADVANCED` olayı (`from_date, to_date`) yazar. Faturalama günü ay sonu kırpmasından korunur. Kullanıcı onayı gerekir; sessiz ilerletme yoktur. 11 Ekim 2026'da `backend/scripts/renewal-confirmation-smoke.mjs` canlı test hesabında ödeme, kasıtlı kısmi hata, idempotent tekrar, tarih/olay yazımı ve test verisi temizliğini doğruladı. İki ayrı API yazımı tek DB işlemi olmadığından bu test atomiklik garantisi vermez.
- Realtime: `subscriptions` tablosu `supabase_realtime` yayınındadır; istemci `user_id=eq.<id>` filtresiyle dinler ve olay gelince önbelleği geçersiz kılar.
- Servis kataloğu: `support-catalog` GET (`services[]`) form önerilerinde kullanılır; hata veya boş yanıtta mobil yedek liste (`servicePresets.ts`) kullanılır.

`replace_payment_methods(p_user_id, p_names)` yalnızca `service_role` içindir (Edge Function çağırır).

## 5. Edge Function'lar

Hepsi `Authorization` başlığındaki JWT'yi `auth.getUser()` ile doğrular; veriye service-role ile erişirken her zaman `user.id` ile kısıtlar. Aşağıdaki ortak hız sınırı korumaları canlıya dağıtıldı.

### Hız sınırı ve hata yanıtları (22 Ekim 2026 canlıda)

- Kullanıcı başına sabit pencere sayacı (`public.check_rate_limit`, migration 032; yalnızca `service_role`). Aşılınca `429` ve `Retry-After`. Sınırlar (1 saat): `delete-account` 3, `process-export` 10, `support-catalog` POST 10 / GET 120, `payment-methods` PUT 60 / GET 240. Sayaç veritabanına ulaşamazsa istek geçirilir (fail-open) ve hata günlüğe yazılır.
- İç hata metni istemciye dönmez: `500 { "error": "Beklenmeyen bir hata oluştu" }`; ayrıntı yalnızca sunucu günlüğündedir.
- CORS: yalnızca `https://subscription-tracking.github.io` ve `localhost` kaynakları yansıtılır (`*` yok); mobil istemci Origin göndermez.
- Güncel canlı sürümler ve kabul kanıtı: [SUPABASE_LIVE_STATUS.md](SUPABASE_LIVE_STATUS.md).

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
| Durum kapsamı | Kullanıcı kararı: tüm abonelik durumları. Function ve Expo cihaz CSV'si tüm durumları içerir; korunan Flutter uygulamasındaki cihaz CSV'si yalnız `active`, `paused`, `cancelled` durumlarını içerir ([denetim](../quality/expo-migration-audit.md)). |
| Depolama | Kullanıcı başına **tek sabit dosya** (`<uid>/latest.csv`, üzerine yazılır); yeni export dosyaları birikmez; başarılı dışa aktarmadan sonra kullanıcının eski `exports` satırları da silinir (canlı process-export v4). Önceki sürümlerin bıraktığı dosyalar hesap temizliğinde tüm sayfa/alt klasörlerle taranır |
| Hatalar | `400` (`export_id` yok), `404`, `405`, `503`, `500` |

### `delete-account`
| | |
|---|---|
| `POST` | `200 { "success": true }`; önce kullanıcının Storage `exports/<uid>/` nesnelerini, sonra Auth kaydını service-role ile siler (Storage hatasında hesap silinmez, tekrar denenir) |
| Yakın giriş | JWT `amr` zaman damgası 5 dakikadan eskiyse `403` (token yenilemek süreyi sıfırlamaz); istemci silmeden önce parolayla yeniden giriş yapar |
| Hatalar | `401`, `403`, `405`, `503`, `500` |

Expo istemcisi yalnızca `success: true` yanıtını tamamlanmış silme sayar; boş veya `success: false` yanıtında kullanıcıya hata gösterir.

Exports Storage SELECT/INSERT politikaları kullanıcı klasörü yanında aktif `profiles` kaydı gerektirir. Hesap silindikten sonra süresi henüz dolmamış JWT ile yeni nesne yazılamaz. Önceden üretilmiş imzalı URL'ler kendi TTL kurallarına tabidir; hesap temizliği mevcut nesneleri kaldırır.

## 6. Realtime

`supabase_realtime` yayınında yalnızca `subscriptions` vardır. İstemci `watchAll(userId)` ile dinler; gelen liste yerel listeyle birleştirilir. İki cihazlı canlı doğrulama açık iştir ([DEVICE_ACCEPTANCE.md](../operations/DEVICE_ACCEPTANCE.md)).

## 7. Uygulanmayanlar (Planlı / kapsam dışı)

| Konu | Durum |
|---|---|
| `/api/v1` REST sunucusu, OpenAPI | Kapsam dışı |
| Cihaz token kaydı, uzak push (FCM/APNs) | Kapsam dışı |
| Dashboard/takvim toplamlarının sunucuda hesaplanması | Kapsam dışı (istemcide hesaplanır) |
| Uygulama düzeyinde hız sınırı | Dört Edge Function'da canlı; DB sayaç hatasında fail-open sınırı yukarıda belirtilmiştir |

## Expo 59 senaryo sözleşmesi — 12 Ekim 2026

**Expo için güncel kullanıcı kararı:** [Gereksinim, API/veri modeli ve dağıtım sözleşmesi](../quality/expo-59/CONTRACT.md). Önceki Expo anlatımıyla çelişen tarih, mantıksal silme, 1.000 kota, 2.000 not, tüm para birimleri, device/fixed bölge ve açık/koyu/sistem tema kurallarında bu sözleşme geçerlidir. Flutter mevcut uygulaması korunur. Kod hazırlığı canlı/native kabul anlamına gelmez.
