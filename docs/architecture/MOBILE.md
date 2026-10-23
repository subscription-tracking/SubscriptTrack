# Mobil Uygulama Mimarisi

**Durum: Uygulandı.** Bu belge güncel kod yapısını anlatır; sprint tarihçesi ve o günlere ait sayılar [ARCHITECTURE_CHANGELOG.md](../archive/ARCHITECTURE_CHANGELOG.md) içindedir. Sistem düzeyi için [ARCHITECTURE.md](ARCHITECTURE.md). Test sayısı ve kapsama gibi ölçümler burada yazılmaz, [kalite raporundadır](../quality/index.html).

## 1. Teknoloji kararları

- **Flutter / Dart** — iOS + Android tek kod tabanı ([ADR 0008](../decisions/0008-flutter-mobile-framework.md)); sürümler `mobile/pubspec.lock` ve [CURRENT_STATUS.md](../CURRENT_STATUS.md).
- **State:** `Provider` + `ChangeNotifier`.
- **Navigasyon:** `go_router` — declarative, deep link, redirect guard.
- **Backend:** Supabase (Auth, PostgREST, RPC, Realtime, Edge Functions); `--dart-define` ile yapılandırılır, kaynak kodda secret yoktur.
- **Para:** `Money` (integer minor unit) — floating point yok ([ADR 0004](../decisions/0004-money-as-decimal.md)).
- **Zaman:** UTC saklama, saat dilimi gösterimde uygulanır ([ADR 0005](../decisions/0005-utc-and-user-timezone.md)).
- **Tema:** yalnızca koyu (`AppTheme.dark`); açık tema Planlı.

## 2. Klasör yapısı

```text
mobile/lib/
├── app/                 app.dart (composition root), splash_screen.dart
│   ├── router/          app_router.dart, route_helpers.dart (ShellRoute, contentRoute)
│   ├── shell/           app_shell, authenticated_shell, bottom_navigation, top_bar
│   └── theme/           app_theme.dart, app_colors.dart
├── core/
│   ├── config/          app_environment.dart (SUPABASE_URL/KEY)
│   ├── datasources/     auth_data_source, subscription_data_source (arayüzler)
│   ├── domain/          money.dart, currency.dart
│   ├── errors/          app_exception, error_messages
│   ├── navigation/      app_routes.dart (yalnızca yol sabitleri)
│   ├── network/         support_catalog_api.dart
│   ├── preferences/     app_preferences.dart
│   ├── services/        local_notification_service, notification_scheduler, reminder_planner,
│   │                    notification_read_sync_service, offline_mutation_queue,
│   │                    app_lock_service, app_lock_gate
│   ├── storage/         local_storage, secure_storage, secure_supabase_storage
│   └── utils/           date_time_utils, csv_safety
├── shared/              design/ (tokenlar, responsive), widgets/ (ortak bileşenler)
└── features/            auth · subscriptions · dashboard · calendar · notifications ·
                         stats · savings · onboarding · settings
                         (her biri data / domain / presentation)
```

`subscriptions` feature'ı: `domain/` (enums, models, lifecycle, selectors), `data/` (Supabase ve yerel repository, operasyonlar, cache, offline senkron, realtime, CSV içe aktarma), `presentation/` (controller, liste görünüm modeli, ekranlar, widget'lar).

## 3. Repository seçimi

```text
isSupabaseConfigured (SUPABASE_URL + SUPABASE_ANON_KEY dart-define)
  → SupabaseSubscriptionRepository   (PostgREST + RPC)
aksi halde
  → LocalSubscriptionRepository      (cihazda, yerel mod: geliştirme/demo)
```

Ayrı bir REST API istemcisi yoktur ([ADR 0009](../decisions/0009-supabase-only-architecture.md)).

## 4. Katmanlar ve kurallar (`test/architecture_test.dart` ile korunur)

| Katman | Sorumluluk |
|---|---|
| **Presentation** | Widget, UI durumu, controller (`ChangeNotifier`) |
| **Domain** | Framework bağımsız entity ve kurallar (`Subscription`, `Money`, yaşam döngüsü) |
| **Data** | Supabase/yerel erişim, cache, eşleme |
| **Core / shared** | Yatay ortak altyapı; feature'ların yalnızca `domain` katmanını kullanır |

- `presentation`, `shared`, `app`: `supabase_flutter` import etmez (oturum olayları `AuthStateDataSource`, e-posta doğrulama `EmailConfirmationDataSource`, destek/ödeme yöntemi `SupportCatalogApi` / `PaymentMethodsApi` arayüzleriyle).
- `domain`: `data` / `presentation` / `supabase` import etmez.
- `data`: `presentation` import etmez.
- Feature/katman bağımlılık grafiği döngüsüzdür; dosya boyutu sınırı testte tanımlıdır.
- Sayfa geçişleri yalnızca `context.push(AppRoutes…)`; `Navigator.push` / `MaterialPageRoute` yasaktır.

### Abonelik controller'ı ve parçaları

`SubscriptionController` public API'yi tutar; iç sorumluluklar ayrıdır: `SubscriptionSelectors` (saf listeler ve toplamlar), `SubscriptionLifecycle` (deneme bitişi, gecikmiş yenileme), `OfflineSyncCoordinator` (kuyruk, `apply/replay`), `SubscriptionCache`, `PaymentHistoryStore`, `SubscriptionOperations` ve `SubscriptionStatusOperations` (ekleme/düzenleme/durum kuralları, iyimser + çevrimdışı kuyruk), `SubscriptionRealtimeSync`. Bağımlılıklar isteğe bağlı ctor parametresidir; testte sahte uygulama verilir.

### Saf hesap katmanları
`stats/domain/payment_analytics` ve `stats_view_model` (Money minor unit üzerinden), `subscription_list_view_model` (filtre/sıralama), `subscription_form_validators`, `core/services/reminder_planner` (saat dilimi, 60 bildirim sınırı), `core/errors/error_messages` (`userMessageFor` ham istisna metnini sızdırmaz), `shared/widgets/async_state_view` (ortak loading/error/empty/offline).

### Bağımlılık enjeksiyonu (composition root: `app/app.dart`)
`SettingsController`, `AppLockService` ve `NotificationScheduler` uygulama kökünde oluşturulup `Provider` ile sağlanır; `.instance` singleton'ları kaldırılmıştır. Ayarlara `AppPreferences` arayüzüyle erişilir. `LocalStorage`/`SecureStorage` durumsuz sarmalayıcılardır (`.instance` bilinçli korunmuştur, ctor ile değiştirilebilir).

### Navigasyon (go_router)
`core/navigation/app_routes.dart` yalnızca yol sabitlerini içerir; yol → ekran eşlemesi `app/router/app_router.dart`'tadır (feature'lar birbirinin ekranını import etmez). Oturum açmış rotalar bir `ShellRoute` içindedir: `AuthenticatedShell` controller'ları oluşturur ve `Provider` ile sağlar. Sabit yollar (`/subscriptions/add`) `:id` yolundan önce tanımlanır; bilinmeyen id "bulunamadı" ekranı gösterir.

## 5. State modeli

Her `ChangeNotifier` controller şu durumları yönetir:

| Getter | Anlamı |
|---|---|
| `loading` | İlk yükleme devam ediyor |
| `error` | Kurtarılabilir hata mesajı |
| `isOffline` | Cache'ten gösteriliyor, ağ yok |
| `lastSyncAt` | Son başarılı sync UTC zamanı |
| `hasMore` | Liste sayfalama (istemci tarafı görünür sınır) devam ediyor |

İstatistik sekmesi `AppShell` içindeki Scaffold'a gömülüdür; `StatsScreen` bu kipte yalnızca içerik döndürür. Aylık/yıllık tutarlar para birimi başına aktif aboneliklerin aylıklaştırılmış tutarlarından hesaplanır. Ödeme kaydı yoksa trend grafiği geçmiş ayları uydurma tutarlarla doldurmaz; kayıt varsa seçilen dönemin kaydedilmiş tutarları gösterilir. İlk yükleme, hata, boş ve çevrimdışı görüntüleme ayrı UI durumlarıdır.

## 6. Offline mimarisi

```text
load() başarısız
  ↓ NetworkException
  cache okuma (LocalStorage JSON)
    cache var  → _items = cache, isOffline = true   ← UI banner gösterir
    cache yok  → _error = mesaj

status/lifecycle çağrısı → NetworkException
  ↓ OfflineMutationQueue.enqueue(type, payload)
  Optimistic local update
  ↓ LocalStorage cache güncellemesi (uygulama yeniden açılsa da korunur)

load() başarılı
  ↓ replay: queue.peek() → repo çağrısı → başarılıysa queue.removeFirst()
  offline create gerçek sunucu kimliği alırsa takip eden mutation kimlikleri güncellenir
  Başarısız → head yerinde kalır; sonraki mutation çalıştırılmaz (FIFO korunur)
```

**Yaşam döngüsü kuralları (yükleme sırasında):** `SubscriptionOperations.applyLifecycleRules()` bitmiş denemeleri `expired` yapar ve gecikmiş aktif aboneliklerin `nextRenewalDate` değerini bir sonraki döneme **otomatik ilerletir** (`SubscriptionLifecycle.advanceOverdue`, Excel Test 45). Kullanıcı **Yenilendi** derse `markRenewed` yarın veya sonrasına taşır. 

**Silme:** Controller `delete` ve `deleteMany` sunar; detay ekranı menüsü ve liste çoklu seçimi herhangi bir abonelik için **"Kalıcı olarak sil"** onayı gösterir (arşivle/iptal ayrı seçeneklerdir).

> **Ürün kuralıyla çelişki (karar bekliyor):** [DOMAIN.md §4/§7](../product/DOMAIN.md), [ADR 0006](../decisions/0006-archive-over-delete.md) ve `AGENTS.md` normal akışta fiziksel silme yapılmamasını ve yenileme tarihinin sessizce ilerletilmemesini ister; uygulama ikisini de farklı yapıyor. Hangisinin doğru olduğu ürün sahibinin kararıdır; kod bu belgede değiştirilmedi.

## 7. Bildirim mimarisi

Yalnızca cihaz üzerinde `flutter_local_notifications`; uzak push/token altyapısı yoktur ([NOTIFICATIONS.md](NOTIFICATIONS.md)).

- `ReminderPlanner` yenileme/trial hatırlatmalarını N gün önce 09:00'a planlar; `NotificationScheduler` arayüzü controller'ı statik servisten ayırır.
- **Duplicate guard:** abonelik kimliği, ad, tutar, para birimi, yenileme/trial tarihi, durum, kural, genel ayar ve saat dilimini kapsayan hash değişmezse schedule atlanır.
- `daysBefore` veya kaydedilmiş kullanıcı saat dilimi tercihi değişince, ve uygulama `resumed` olduğunda tercih edilen IANA bölgesiyle plan yenilenir. Tercih varsa cihaz saat dilimi değişikliği bu değeri ezmez; tercih boşken cihaz bölgesi varsayılan olarak izlenir.
- Cold-start: bildirim payload'ındaki abonelik kimliği, liste yüklenene kadar saklanır, sonra detay açılır.
- Plan sınırı: cihazda bekleyen en fazla 60 yerel bildirim (düzenli + erteleme).
- Android 12+ exact-alarm izni kapalıysa `inexactAllowWhileIdle` ile planlanır.
- **Read sync:** `NotificationReadSyncService`, okunan bildirimlerin `read_at` değerini `notifications` tablosuna PostgREST ile yazar (best-effort; yerel okunma durumu esastır).

## 8. Güvenlik

- Credential'lar `--dart-define` ile verilir; kaynak kodda yoktur. `service_role` anahtarı istemciye hiç girmez.
- RLS: her tabloda `auth.uid()` sahiplik politikası ([SUPABASE_LIVE_STATUS.md](../reference/SUPABASE_LIVE_STATUS.md)).
- `OfflineMutationQueue` ve abonelik cache'i `flutter_secure_storage` ile şifreli depolanır; eski düz metin kayıt ilk okumada taşınır ve silinir (**taşımanın cihazda doğrulanması açık**).
- Uygulama kilidi: PIN salt'lı PBKDF2-HMAC-SHA256 (`v2:<tur>:<salt>:<özet>`, `core/services/pin_hasher.dart`); eski SHA-256 özet doğrulamada yükseltilir. 5 hatadan sonra üstel bekleme (30 sn → en çok 15 dk), sayaç güvenli depoda; saat geri alınırsa uygulama kilitlenir.
- Ekran gizliliği yalnızca kilit açıkken: Android `FLAG_SECURE` (`com.subscripttrack.app/privacy` kanalı) ve arka planda Flutter örtüsü; bildirim görünürlüğü `private`.
- Android yedekleme kapalı (`allowBackup=false`, `data_extraction_rules.xml`); release derlemesi imza anahtarı yoksa durur (`ALLOW_DEBUG_SIGNING=true` ile bilinçli geçilir).
- Çevrimdışı kuyruk kullanıcıya özeldir (`offline_mutation_queue_v3:<userId>`); parola kuralı `PasswordPolicy` (en az 10 karakter).
- Ayrıntı ve açık işler: [SECURITY.md](SECURITY.md).

## 9. Test yaklaşımı

Katmanlar: domain birim testleri (`Money`, yaşam döngüsü, tarih), servis birim testleri (kuyruk, planlayıcı, uygulama kilidi), controller/repository testleri (sahte HTTP ve sahte Supabase istemcisi), widget ve rota testleri (`test/support/routed_app.dart`), mimari kural testi (`test/architecture_test.dart`), kanıt paketleri (`test/evidence/`) ve güvenlik taraması (`security_scan_test.dart`). Strateji, izlenebilirlik ve güncel ölçümler: [TESTING.md](../operations/TESTING.md).

## 10. Build ortamları

```text
Yerel mod  — Supabase yapılandırması yok (geliştirme/demo)
Supabase   — dart-define ile tek Supabase projesi (ayrı staging yok, bkz. ARCHITECTURE.md)
Release    — imzalı AAB / iOS arşivi (henüz üretilmedi, bkz. RELEASE.md)
```

Ayrıntı: [RELEASE.md](../operations/RELEASE.md).

## 11. Cihaz kabulü

Expo yenileme geçişi: `EXPO_PUBLIC_ATOMIC_RENEWAL_ENABLED=false` varsayılanıyla mevcut ödeme ve tarih çağrıları çalışır. Migration 036 canlıda ayrı onayla doğrulandıktan sonra yeni tek işlemli RPC yolu bir Expo build'inde açılabilir. O zamana kadar ödeme başarılı, tarih güncellemesi başarısız olma riski devam eder. Expo ve Flutter iptal edilmiş aboneliği onayla yeniden etkinleştirir; detay düğmeleri durum geçiş tablosuyla sınırlıdır. Geçmiş tasarruf kayıtları korunur.

Yerel bildirim, izin, cold-start, biyometri ve çoklu cihaz Realtime davranışı widget testleriyle kanıtlanamaz; sürüm kabulünde [DEVICE_ACCEPTANCE.md](../operations/DEVICE_ACCEPTANCE.md) Android ve iOS gerçek cihazlarda tamamlanır. Realtime için `public.subscriptions` tablosu `supabase_realtime` yayınındadır (migration 030); istemci kullanıcı filtresiyle INSERT/UPDATE/DELETE dinler.

## Expo 59 senaryo sözleşmesi — 12 Ekim 2026

**Expo için güncel kullanıcı kararı:** [Gereksinim, API/veri modeli ve dağıtım sözleşmesi](../quality/expo-59/CONTRACT.md). Önceki Expo anlatımıyla çelişen tarih, mantıksal silme, 1.000 kota, 2.000 not, tüm para birimleri, device/fixed bölge ve açık/koyu/sistem tema kurallarında bu sözleşme geçerlidir. Flutter mevcut uygulaması korunur. Kod hazırlığı canlı/native kabul anlamına gelmez.
