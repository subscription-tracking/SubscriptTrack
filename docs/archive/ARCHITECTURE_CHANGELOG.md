# Mimari değişiklik günlüğü

Bu dosya, önceki `MOBILE_ARCHITECTURE.md` bölüm 12'nin (kod kalitesi sprinti, 2026-09-29/30) olduğu gibi taşınmış halidir. Tarihsel kayıttır; **içindeki sayılar o tarihe aittir** (ör. test sayısı, satır sayıları). Güncel yapı için [MOBILE.md](../architecture/MOBILE.md).

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

### Kod tekrarı azaltma (2026-09-30)

Tekrar oranı %5,3 → %3,0 (6 satırlık pencere).

- `settings/presentation/widgets/legal_document.dart`: gizlilik politikası ve kullanım şartları ortak `LegalDocumentScreen` + `LegalSection` kullanır; ekranlar yalnızca metni tutar.
- `auth/presentation/widgets/auth_form_parts.dart`: `AuthPageScaffold`, `authHeaderChildren`, `AuthEmailField`, `AuthPasswordField`; giriş ve kayıt ekranları paylaşır. `shared/widgets/loading_filled_button.dart` (`LoadingFilledButton`) giriş, kayıt, şifre ekranları ve abonelik ekleme/düzenleme ekranlarının yüklenirken ilerleme gösteren düğmesidir.
- `stats/presentation/widgets/stats_card_surface.dart`: istatistik kartlarının ortak yüzeyi.
- `AmbientBlob` (`shared/widgets/ambient_background.dart`): giriş ekranı arka planı ve tanıtım ekranı ortak ışık lekesi.
- `SubscriptionFormData`: `notesOrNull`, `trialEndOrNull`, `trialPriceOrNull` ve `applyTo(Subscription)`; ekleme/düzenleme ekranlarındaki alan eşlemesi tek yerde.
- Bilinçli olarak bırakılan tekrar: `add(...)` imzası (12 parametre) `SubscriptionDataSource`, iki repository, `SubscriptionOperations` ve `SubscriptionController` katmanlarında tekrarlanır. Bunu bir `NewSubscription` taslak nesnesiyle birleştirmek arayüz ve testleri geniş çapta değiştirir; ayrı iş olarak bırakıldı.
- Doğrulama: 723 test yeşil, analyzer temiz.

### Performans iyileştirmesi (2026-09-30)

Profil (1000 abonelik, host makine): selector hesabının baskın maliyeti algoritma değil, döngülerdeki yerel `DateTime(y, m, d)` kurucusuydu (Windows'ta çağrı başına ~17 µs; `DateTime.now()` alan okumaları da ~3 µs).

- `DateTimeUtils.dayNumber(DateTime)`: yıl/ay/günden UTC tabanlı takvim günü numarası (~0,05 µs). İki tarih arasındaki tam gün sayısı `dayNumber(a) - dayNumber(b)`; yaz saati kayması yoktur. Test: `test/core/day_number_test.dart`.
- Kullanıldığı yerler: `Subscription.isNotStartedAt/isNotStartedOnDay`, `daysUntilRenewal/daysUntilRenewalFrom`, `DateTimeUtils.nextOccurrenceOnOrAfter/formatDate/addMonthsClamped`, `SubscriptionLifecycle.endedTrials`, `CalendarController.renewalsForDay/trialsForDay`.
- `SubscriptionSelectors` bugünün gün numarasını oluşturulurken bir kez hesaplar; `active`, `notStarted`, `upcomingRenewals` abonelik başına `DateTime.now()` çağırmaz.
- Sonuç (3 koşu medyanı): `controller.load()` 57 → 13,5 ms, bildirim sonrası selector hesabı 49,8 → 0,43 ms. Takvim gün+ay hesabı 0,15 ms.
- Ölçüm aracı: `tools/quality/run_benchmark.py` (3 koşu, medyan). Cihaz ölçümü değildir.
- APK: Play'e giden ABI bölünmüş arm64 21,7 MB; ana kalem native kütüphaneler (Flutter motoru ~11 MB + Dart AOT ~8 MB). Uygulama kodu 595 KB, `timezone` verisi 451 KB. Eşiğin (20 MB) altına inmek için köklü bir değişiklik gerekir; yapılmadı.
- Bilinçli olarak yapılmadı: `projectedRenewals` (UI'da çağrılmıyor, 374 ms) ve `notifyListeners` başına selector yeniden oluşturma (veri değişimini ayırt etmek için işlemlerin yeniden yapılandırılması gerekir).

### Ekran incelemesi düzeltmeleri (2026-09-30)

Tarayıcıda gezilen ekranlardan çıkan bulgular giderildi (`code-review-report/screen-review.md`).

- `DateTimeUtils.formatLongDate`: "30 Eylül 2026"; formlar, profil ve detay bunu kullanır. `formatDate` (göreli "Bugün/Yarın") listelerde kalır.
- `SubscriptionForm.showPresets` (varsayılan `true`); düzenleme ekranı `false` geçer. Ad bilinen bir servisle eşleşince kategori otomatik atanır (`FormServiceSection._applyPresetCategory`).
- Detay ekranı arşivlemede `SnackBar` + "Geri al" (`controller.restore`) gösterir.
- Tasarruf başlığı (`_Top3Card._headline`) gerçek abonelik sayısını yazar; istatistik hero kartı önceki ay verisi yoksa değişim göstermez.
- Ekleme ve düzenleme ekranları ortak `SubscriptionFormScaffold` (başlık, form gövdesi, sabit alt eylem çubuğu) ve `showFormSaveError` kullanır.
- Testler: `test/features/screen_review_fixes_test.dart` ve mevcut ekran testlerine eklemeler (738 test).

### 12.x Hakkaniyet denetimi (2026-09-30)

Kalite puanları `tools/quality/audit_v2.py` ile yeniden değerlendirildi (kurallar mutasyon sonucu görülmeden yazıldı). Kod kalitesi 9,4 (v1) → **8,7** (v2); yayına hazırlık ayrı puan: **2,8**.

- Test puanı 10 → 8,4: 20 mutantlık örnekte 8'i derlenemedi, kalan geçerlilerde %81,8 yakalama; gerçek boşluklar `DateTimeUtils.addMonthsClamped` (preferredDay yokken) ve `AppLockService.disable()` sonrası durum. Edge function'ların davranış testi yok, migration testleri SQL metni üzerinde regex.
- Güvenlik 8,3 → 7,9: 3 açık düşük bulgu (hata metni sızıntısı, CORS `*`, doğrulanmayan `category`), doğrulanmamış kritik kontroller ve hız sınırı yok. Canlı Supabase advisor: 0 hata; 4 SECURITY DEFINER RPC uyarısı incelenmiş tasarım gereği; Leaked Password Protection kapalı. Migration 031 ile 15 RLS InitPlan uyarısı giderildi.
- Performans 9,3 → 8: yalnızca host ölçümü olduğu için tavan 8.
- Tekrar bağımsız araçla (jscpd) çapraz doğrulandı: %1,08 (bizim araç %2,9), yani şişirilmemiş.
- Yayına hazırlık: debug keystore yedeği, cihazda doğrulama yok, iOS build yok, son uzak CI koşusu kırmızı ve 12 commit itilmedi.


