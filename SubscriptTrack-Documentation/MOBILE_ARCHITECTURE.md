# Mobil Uygulama Mimarisi

Son güncelleme: 30 Eylül 2026 (bağımlılık güncellemesi ve karmaşıklık sadeleştirmesi; bkz. bölüm 12)

---

## 1. Teknoloji kararları

- **Flutter 3.47.2 / Dart 3.13.2** — iOS + Android tek kod tabanı (ADR-0008)
- **State yönetimi:** `Provider` + `ChangeNotifier` — go_router redirect guard ile entegre
- **Navigation:** `go_router ^18` — declarative, deep link, redirect guard
- **Backend:** Supabase (auth + PostgREST) — `--dart-define` inject, kaynak kodda secret yok
- **Para hesaplamaları:** `Money` value class, integer minor unit — floating point drift yok (ADR-0004)
- **Zaman:** UTC depolama, saat dilimi gösterimde uygulanır (ADR-0005)

---

## 2. Klasör yapısı (uygulanan)

```
mobile/lib/
├── app/
│   ├── router/          app_router.dart          — go_router, redirect guard
│   └── shell/           app_shell.dart            — bottom nav (4 sekme)
│                        authenticated_shell.dart  — auth kontrolü, controller init
│                        top_bar.dart              — bildirim badge
│   └── theme/           app_theme.dart
│
├── core/
│   ├── config/          app_environment.dart      — SUPABASE_URL/KEY/API_BASE_URL (dart-define)
│   ├── datasources/     auth_data_source.dart     — abstract auth interface
│   │                    subscription_data_source.dart — abstract CRUD interface
│   ├── domain/          money.dart                — Money value class (minor units)
│   ├── errors/          app_exception.dart        — NetworkException, AuthException, ValidationException
│   ├── network/         api_client.dart           — Bearer token, X-Request-ID, Idempotency-Key, retry
│   │                    token_provider.dart       — abstract + SupabaseTokenProvider
│   ├── services/        local_notification_service.dart   — flutter_local_notifications, timezone
│   │                    offline_mutation_queue.dart        — şifreli cihaz kuyruğu
│   │                    notification_read_sync_service.dart — POST /v1/notifications/read-batch
│   ├── storage/         local_storage.dart        — şifreli abonelik JSON cache; eski SharedPreferences kaydını taşır
│   │                    secure_storage.dart       — hassas veri (flutter_secure_storage)
│   └── utils/           date_time_utils.dart      — formatDate, formatCurrency, renewalLabel
│
└── features/
    ├── auth/
    │   ├── data/        supabase_auth_repository.dart
    │   ├── domain/      auth_models.dart (AppUser, AuthStatus)
    │   └── presentation/ auth_controller.dart, login_screen.dart, register_screen.dart
    │                     forgot_password_screen.dart, reset_password_screen.dart
    │
    ├── subscriptions/
    │   ├── data/        subscription_repository.dart          — local in-memory
    │   │                supabase_subscription_repository.dart — PostgREST CRUD
    │   │                api_subscription_repository.dart       — REST API + cursor pagination
    │   ├── domain/      subscription_models.dart              — Subscription, BillingCycle, status transitions
    │   └── presentation/ subscription_controller.dart         — CRUD, lifecycle, offline queue, pagination
    │                     screens/  add, edit, detail, list, archived
    │                     widgets/  subscription_form.dart
    │
    ├── dashboard/       DashboardScreen — totalsByCurrency, upcoming 30 gün, _OfflineBanner
    ├── calendar/        CalendarController, CalendarScreen — renewalsForDay, totalsByCurrencyForMonth
    ├── notifications/   NotificationController, NotificationCenterScreen — in-app, read sync
    ├── stats/           StatsScreen — per-currency monthly/yearly commitment, category breakdown, payment/projection trend; loading/error/empty/offline states
    ├── savings/         SavingsScreen — multi-currency top-3 scenario kartlar, yerel/bulut geçmiş
    ├── onboarding/      OnboardingScreen — 4 sayfa, ilk açılışta
    └── settings/        SettingsController — currency, timezone, daysBefore, notifications, paymentMethods
                         data/payment_methods_api.dart — authenticated Edge Function API istemcisi
                         AppearanceScreen, NotificationPreferencesScreen, PaymentMethodsScreen
                         ExportDataScreen (CSV), DeleteAccountScreen
```

---

## 3. Repository seçim önceliği

```
isApiConfigured (API_BASE_URL dart-define)
  → ApiSubscriptionRepository   (REST + cursor pagination + Idempotency-Key)
isSupabaseConfigured (SUPABASE_URL + KEY dart-define)
  → SupabaseSubscriptionRepository  (PostgREST)
else
  → SubscriptionRepository   (local in-memory, test/offline)
```

---

## 4. Katman sorumlulukları

| Katman | Sorumluluk | Örnekler |
|--------|-----------|---------|
| **Presentation** | Widget, UI state, format | Screen, Controller (ChangeNotifier) |
| **Domain** | Framework bağımsız entity ve kurallar | `Subscription`, `Money`, `canTransitionTo()` |
| **Data** | Network, cache, mapping | `ApiClient`, `SupabaseSubscriptionRepository`, `LocalStorage` |
| **Core** | Yatay cross-cutting | `AppException`, `DateTimeUtils`, `OfflineMutationQueue` |

---

## 5. State modeli

Her `ChangeNotifier` controller şu durumları yönetir:

| Getter | Anlamı |
|--------|--------|
| `loading` | İlk yükleme devam ediyor |
| `error` | Kurtarılabilir hata mesajı |
| `isOffline` | Cache'ten gösteriliyor, ağ yok |
| `lastSyncAt` | Son başarılı sync UTC zamanı |
| `hasMore` | Cursor pagination devam ediyor |

İstatistik sekmesi ana `AppShell` içindeki Scaffold'a gömülüdür; bu kipte
`StatsScreen` yalnızca içerik widget'ı döndürür. Aylık/yıllık tutarlar para
birimi başına aktif aboneliklerin aylıklaştırılmış tutarlarından hesaplanır.
Ödeme kaydı yoksa trend grafiği geçmiş ayları uydurma tutarlarla doldurmaz;
yalnızca aktif aboneliklerden hesaplanan bu ayın tahmini toplamını gösterir.
Ödeme kayıtları varsa seçilen dönemin kaydedilmiş tutarları gösterilir. İlk yükleme,
hata, abonelik bulunmaması ve cache'ten çevrimdışı görüntüleme ayrı UI
durumlarıdır.

---

## 6. Offline mimarisi (S11)

```
load() başarısız
  ↓ NetworkException
  cache okuma (LocalStorage JSON)
    cache var  → _items = cache, isOffline = true   ← UI banner gösterir
    cache yok  → _error = mesaj

status/lifecycle çağrısı → NetworkException
  ↓ OfflineMutationQueue.enqueue(type, payload)
  Optimistic local update (_updateLocalStatus)
  ↓ LocalStorage cache güncellemesi (uygulama yeniden açılsa da korunur)

load() başarılı
  ↓ _replayOfflineQueue()
  queue.peek() → repo çağrısı → başarılıysa queue.removeFirst()
  offline create gerçek sunucu kimliği alırsa takip eden mutation kimlikleri güncellenir
  Başarısız → head yerinde kalır; sonraki mutation çalıştırılmaz (FIFO korunur)
```

Geçmiş `nextRenewalDate` değerleri yükleme sırasında değiştirilmez. Aktif kayıt
arayüzde **Gecikmiş** olarak görünür; kullanıcı **Yenilendi** eylemini seçerse
başlangıç gününü koruyan sonraki yenileme tarihi hesaplanır ve kaydedilir.

Fiziksel silme controller katmanında yalnızca `mistakenRecord: true` ile
çağrılabilir. Tek kayıt ekranındaki **Yanlış kayıt** onayı bu akışı kullanır;
çoklu seçim ise kayıtları fiziksel silmeden arşivler.

---

## 7. Bildirim mimarisi (S6 + S11)

- **Yerel push:** `flutter_local_notifications` — `scheduleRenewalReminders()` N gün önce 09:00
- **Duplicate guard:** `Object.hashAll(...)` abonelik kimliği, adı, tutarı, para birimi, yenileme/trial tarihi, durumu, kuralı, genel ayarı ve saat dilimini kapsar; bunlardan biri değişmezse schedule atlanır
- **Settings listener:** `daysBefore` veya `timezone` değişince otomatik yeniden zamanlama
- **Saat dilimi yenileme:** Uygulama `resumed` durumuna döndüğünde cihazın IANA saat dilimi yeniden okunur; değişmişse yerel bildirim planı yeniden kurulur.
- **Cold-start yönlendirmesi:** Bildirim payload'ındaki abonelik kimliği, abonelik listesi yüklenene kadar saklanır; yüklendikten sonra detay ekranı açılır.
- **Plan sınırı:** Düzenli hatırlatmalar ve snooze bildirimleri, cihazda bekleyen en fazla 60 yerel bildirim sınırını aşmaz.
- **Exact alarm fallback:** Android 12+ exact-alarm izni kapalıysa scheduler hata vermek yerine `inexactAllowWhileIdle` ile planlama yapar.
- **Push yöntemi:** Yalnızca `flutter_local_notifications` ile cihaz üzeri zamanlama. Uzak push/token altyapısı bulunmaz.
- **Read sync:** `NotificationReadSyncService` → `POST /v1/notifications/read-batch` (best-effort)

---

## 8. Güvenlik

- Tüm credential'lar `--dart-define` ile inject edilir; kaynak kodda yoktur
- RLS: `auth.uid() = user_id` her tablo için
- `ApiClient`: Bearer token her istekte, X-Request-ID UUID trace
- `OfflineMutationQueue` ve abonelik cache'i `flutter_secure_storage` ile şifreli cihaz depolamasındadır; eski düz metin SharedPreferences kaydı ilk okumada taşınır ve silinir
- `service_role` key client'a hiçbir zaman gönderilmez

---

## 9. Test piramidi (S8–S12)

| Seviye | Kapsam | Dosya sayısı |
|--------|--------|-------------|
| Domain unit | `Money`, `BillingCycle`, `SubscriptionStatus` | `money_test`, `subscription_model_test`, `subscription_status_transition_test` |
| Service unit | `OfflineMutationQueue`, `NotificationReadSyncService`, `DateTimeUtils` | 3 dosya |
| Controller unit | `AuthController`, `SubscriptionController`, `CalendarController`, `NotificationController` | 5 dosya |
| API unit | `ApiClient` (retry, headers, errors) | `api_client_test` |
| Güvenlik | Secret scan (kaynak kodda URL/JWT/service_role yok) | `security_scan_test` |
| Form | `SubscriptionForm` validasyon | `subscription_form_test` |

Toplam: **409 test**, hepsi yeşil (`flutter test --no-pub`; 2026-09-29 kod kalitesi sprintinden sonra). `test/architecture_test.dart` katman kurallarını denetler (bkz. bölüm 12).

---

## 10. Build ortamları

```
Development  — dart-define ile yerel/staging backend
Staging      — CI tarafından enjekte, TestFlight/Internal Test
Production   — Play Store / App Store release
```

Detay: `DEPLOYMENT.md`

## 11. Cihaz kabulü

Yerel bildirim, izin, cold-start, biyometri ve çoklu cihaz Realtime davranışı
widget testleriyle kanıtlanamaz. Sürüm kabulünde
`SPRINT_3_DEVICE_ACCEPTANCE.md` kontrol listesi Android ve iOS gerçek cihaz
kanıtlarıyla tamamlanır.

Supabase Realtime için `public.subscriptions` tablosu `supabase_realtime`
publication'a eklenmiştir (`backend/migrations/030_realtime_publication.sql`).
Mobil istemci kullanıcı filtresiyle INSERT/UPDATE/DELETE değişikliklerini
dinler; iki ayrı oturumla canlı kabul testi yine cihaz/test hesabı gerektirir.

---

## 12. Kod kalitesi sprinti sonrası yapı (2026-09-29)

Davranış değiştirmeden god-file ve katman sızıntıları temizlendi. Ayrıntılı bulgular: `code-review-report/index.html`.

### Abonelik controller'ı parçalandı

`SubscriptionController` (874 → 299 satır) public API'sini korur; iç sorumluluklar ayrıldı:

| Parça | Konum | Sorumluluk |
|---|---|---|
| `SubscriptionSelectors` | `subscriptions/domain/subscription_selectors.dart` | active/trials/paused/… listeleri, `totalsByCurrency` (saf, önbellekli) |
| `SubscriptionLifecycle` | `subscriptions/domain/subscription_lifecycle.dart` | deneme bitişi, gecikmiş yenileme ilerletme (saf) |
| `OfflineSyncCoordinator` | `subscriptions/data/offline_sync_coordinator.dart` | mutasyon kuyruğu ve `apply/replay` |
| `SubscriptionCache` | `subscriptions/data/subscription_cache.dart` | çevrimdışı liste önbelleği |
| `PaymentHistoryStore` | `subscriptions/data/payment_history_store.dart` | ödeme ve tasarruf olayları |
| `SubscriptionOperations` | `subscriptions/data/subscription_operations.dart` | ekleme, düzenleme, silme, yaşam döngüsü kuralları (iyimser + çevrimdışı kuyruk) |
| `SubscriptionStatusOperations` | `subscriptions/data/subscription_status_operations.dart` | toplu silme/arşivleme, arşivle/geri al/duraklat/sürdür/iptal |
| `SubscriptionRealtimeSync` | `subscriptions/data/subscription_realtime_sync.dart` | Supabase Realtime dinleme ve birleştirme |

Controller yeni bağımlılıkları isteğe bağlı ctor parametresi olarak alır (`mutationQueue`, `cache`, `paymentHistory`, `notifications`); testte sahte uygulama enjekte edilebilir.

**Hata düzeltmesi:** Çevrimdışıyken biten deneme, kuyruğa desteklenmeyen `'expire'` tipiyle giriyor ve replay'i kalıcı olarak tıkıyordu. Artık tam abonelik anlık görüntüsüyle `'update'` olarak kuyruğa alınır.

### Katman kuralları (test ile korunur)

- `presentation`, `shared`, `app`: `supabase_flutter` import etmez. Oturum olayları `AuthStateDataSource`, e-posta doğrulama bilgisi `EmailConfirmationDataSource` arayüzüyle; destek/ödeme yöntemi erişimi `SupportCatalogApi.canCreateTicket` / `PaymentMethodsApi.isAvailable` ile sağlanır.
- `domain`: `data`/`presentation`/`supabase` import etmez (`PaymentEvent` → `stats/domain`, `SavingsEvent` → `savings/domain`; repository dosyaları geriye uyumluluk için re-export eder).
- `data`: `presentation` import etmez. `core`/`shared`: feature'ların yalnızca `domain` katmanını kullanır.
- Hiçbir `lib` dosyası 320 satırı aşmaz.

### Yeni saf hesap katmanları

- `stats/domain/payment_analytics.dart` — aylık toplam ve ay-ay değişim; yalnızca `Money.minorUnits` (int) üzerinden. Dashboard ve Stats aynı sınıfı kullanır.
- `stats/domain/stats_view_model.dart` — Stats ekranı için saf görünüm modeli.
- `subscriptions/presentation/subscription_list_view_model.dart` — liste filtre/sıralama.
- `subscriptions/presentation/widgets/subscription_form_validators.dart` — form doğrulayıcıları.
- `core/services/reminder_planner.dart` — bildirim planlama (saat dilimi, 60 sınır); `NotificationScheduler` arayüzü controller'ı statik `LocalNotificationService`'ten ayırır.
- `core/errors/error_messages.dart` — `userMessageFor` ham istisna metnini kullanıcıya sızdırmaz; `logIgnoredError` bilinçli yutulan hataları debug günlüğüne yazar.
- `shared/widgets/async_state_view.dart` — ortak loading/error/empty/offline dallanması (Stats ekranı kullanır).

### Bağımlılık enjeksiyonu (composition root: `app/app.dart`)

- `SettingsController`, `AppLockService` ve `NotificationScheduler` uygulama kökünde oluşturulup `Provider` ile sağlanır; `.instance` singleton'ları kaldırıldı. Feature'lar ayarlara `AppPreferences` arayüzüyle (`core/preferences`) erişir; `InMemoryAppPreferences` yalnızca izole testler içindir.
- `NotificationScheduler` arayüzü (`core/services`): somut uygulama `LocalNotificationService` (artık örnek sınıf, statik değişken durum yok), web/test için `NoopNotificationScheduler`. Saf planlama `ReminderPlanner`'dadır.
- `LocalStorage` ve `SecureStorage` durumsuz altyapı sarmalayıcılarıdır (`FlutterSecureStorage` üzerinde); `.instance` erişimi bilinçli olarak korunmuştur ve repository/cache ctor parametresiyle değiştirilebilir.

### Navigasyon (go_router)

- Tüm sayfa geçişleri `context.push(AppRoutes...)` ile yapılır; `Navigator.push`/`MaterialPageRoute` kullanımı test ile yasaklıdır.
- `core/navigation/app_routes.dart` yalnızca yol sabitlerini içerir (ekran import etmez); yol → ekran eşlemesi `app/router/app_router.dart` içindedir. Böylece feature'lar birbirinin ekranını import etmez.
- Oturum açmış kullanıcının rotaları bir `ShellRoute` içindedir: `AuthenticatedShell` controller'ları oluşturur ve alt rotalara `Provider` ile sağlar. Rota oluşturucuları controller'ı `Builder` içinden `context.read` ile okur.
- Sabit yollar (`/subscriptions/add`) `:id` yolundan önce tanımlanmalıdır. Bilinmeyen abonelik id'si "bulunamadı" ekranı gösterir (soğuk başlangıçta liste yüklenene kadar derin bağlantı bu ekrana düşebilir).
- Testler gerçek rotaları `test/support/routed_app.dart` ile kullanır; `test/app/app_router_test.dart` yönlendirme kurallarını ve shell kapsamını uçtan uca doğrular.

### Katman kuralları (ek)

- `test/architecture_test.dart` ayrıca feature/katman bağımlılık grafiğinin döngüsüz olduğunu ve hiçbir `lib` dosyasının 320 satırı aşmadığını denetler.

### Bilinçli olarak ertelenenler

- `subscriptions → settings` gibi bazı feature'lar arası presentation bağımlılıkları tek yönlü olarak duruyor (ör. dashboard/calendar/stats → `SubscriptionController`); döngü yoktur.
- Testler `test/features/<feature>/`, `test/core/`, `test/app/`, `test/evidence/` altına taşındı; `evidence_paket*` dosya adları izlenebilirlik için korundu (`TEST_TRACEABILITY.md` yollarla güncellendi).

### Bağımlılık güncellemesi (2026-09-30)

11 doğrudan paketin tamamı güncel (ana sürümce geride: 0/11). Kod tarafında etkilenen noktalar:

| Paket | Değişiklik | Etkilenen yer |
|---|---|---|
| `flutter_local_notifications` 18 → 22 | Tüm çağrılar adlandırılmış parametre; `uiLocalNotificationDateInterpretation` kaldırıldı | `core/services/notification_platform.dart` |
| `timezone` 0.11 | Varsayılan konum adı `Etc/UTC` | `evidence_paket5_notification_test.dart` beklentisi |
| `flutter_timezone` 5 | `TimezoneInfo` döner (`.identifier`) | `local_notification_service.dart` |
| `flutter_secure_storage` 11 | `encryptedSharedPreferences` seçeneği kaldırıldı, `AndroidOptions()` kullanılır | `local_storage`, `secure_storage`, `secure_supabase_storage`, `offline_mutation_queue` |
| `local_auth` 3 | `AuthenticationOptions` yok; `biometricOnly`, `persistAcrossBackgrounding` doğrudan parametre | `app_lock_service.dart` |
| `share_plus` 13 | `SharePlus.instance.share(ShareParams(...))` | export ve feedback ekranları |
| `file_picker` 13 | Statik `FilePicker.pickFile`, `PlatformFile.readAsBytes` | `csv_import_screen.dart` |
| `google_fonts` 9 | `material_ui` `TextTheme` tipi; alan alan dönüştürülür | `app/theme/app_theme.dart` |
| `go_router` 18, `supabase_flutter` 2.17, `flutter_lints` 6 | Kod değişikliği gerekmedi | — |

**Risk (cihazda doğrulanmadı):** `flutter_secure_storage` 11 Android'de EncryptedSharedPreferences yerine yeni AES-GCM/RSA depolamayı kullanır. Mevcut kullanıcıların kuyruk ve önbellek verisinin geçişi paketin yerleşik geçişine dayanır; gerçek cihazda güncelleme senaryosu denenmelidir.

### Karmaşıklık sadeleştirmesi (2026-09-30)

- Ölçüm: `tools/quality/complexity`. CC>10 tek metot kaldı (`Subscription.copyWith`, CC 14; 13 isteğe bağlı parametrenin `??` birleşimi, bölünmedi); 60 satırı aşan metot yok (0/976).
- `Subscription.fromJson` küçük yardımcılara ayrıldı; `SupabaseSubscriptionRepository._fromRow` artık `Subscription.fromJson`'a devreder (camelCase/snake_case, `isArchived`/`is_archived` tek yerde).
- `CsvImportParser.parse` başlık doğrulama ve `_parseRow` olarak, `NotificationController._generate` yenileme/deneme üreticilerine, `OfflineSyncCoordinator.apply` yaşam döngüsü geçişi yardımcısına bölündü.
- Uzun `build` metotları özel alt widget'lara bölündü (trend/insights/hero kartları, giriş/kayıt/şifre ekranları, dashboard, abonelik listesi, detay bölümleri vb.). Davranış değişmedi.
- `shared/widgets/app_offline_banner.dart` içine `AppStatusBanner` eklendi (çevrimdışı şeridi veya kapatılabilir hata bandı); dashboard ve abonelik listesi kullanır.
- `AppTheme.dark` metin, buton ve girdi temalarını ayrı statik üyelere ayırır; `AppRouter.contentRoutes` abonelik/analiz/ayar gruplarına bölündü (sıra kuralı korunur).
- Doğrulama: 723 test yeşil, `flutter analyze` temiz, `flutter build apk --release` başarılı (evrensel 60,2 MB; Play için ABI bölünmüş arm64-v8a 21,7 MB).

### Dosya boyutu sadeleştirmesi (2026-09-30)

Hiçbir `lib` dosyası 300 satırı aşmaz (en büyük 300; başlangıçta 1.177). Sınır `architecture_test.dart` içinde 320'dir.

- Alt widget'lar ayrı dosyalara taşındı: `trend_card_parts.dart` + `trend_bars.dart`, `settings/presentation/widgets/settings_parts.dart` + `profile_parts.dart`, `onboarding_info_page.dart`, `dashboard_hero_parts.dart` (`dashboard_hero_card.dart` yeniden dışa aktarır), `dashboard_next_payment_parts.dart`, `subscriptions/presentation/widgets/list/filter_sheet.dart` (filtre/sıralama sayfası).
- `subscription_models.dart`: enum ve etiket uzantıları `subscription_enums.dart` dosyasına ayrıldı; eski import yolları `export` ile çalışır.
- `auth_controller.dart`: yerel yan durum (`AuthLocalState`: onboarding kontrolü, okundu bilgisi, hesap verisi silme) `auth/data/auth_local_state.dart` dosyasına alındı.
- `app_theme.dart`: renk paleti `app_colors.dart` dosyasına ayrıldı (yeniden dışa aktarılır); `app_router.dart`: `contentRoute`, `findSubscription`, `RouteNotFoundScreen` `route_helpers.dart` dosyasına taşındı.
- Doğrulama: 723 test yeşil, analyzer temiz.

### Uzun metot sadeleştirmesi (2026-09-30)

60 satırı aşan 27 metotun tamamı bölündü (en uzun metot 60 satır).

- Ekran `build` metotları özel yardımcılara ayrıldı (`_warningCard`, `_infoCard`, `_daysSelector`, `_nameSection`, `_tabViews` vb.); uzun sabit metinler (`terms_of_service`, `privacy_policy`) `static const _sections` listesine alındı.
- `payment_history_screen.dart`: "Ödeme kaydı ekle" iletişim kutusu `_AddPaymentDialog` (StatefulWidget) oldu.
- `SubscriptionOperations.add`: taslak `Subscription` (yerel `local-...` kimlikli) `add` içinde oluşturulur; `_addInternal(draft)` önce `_createRemote(draft)` dener, bağlantı yoksa aynı taslağı iyimser ekler ve kuyruğa alır (önceden alanlar iki kez kuruluyordu).
- `AppRouter._redirect` + `_forcedRoute`; `SubscriptionCategoryLabel.label` ve `ServiceIdentity._categoryColor` tablo tabanlı oldu.
- `calendar/presentation/widgets/empty_day_state.dart`, `shared/widgets/app_offline_banner.dart` içine `AppStatusBanner` eklendi.
- Doğrulama: 723 test yeşil, analyzer temiz.
