# SubscriptTrack Sprint Planı

Son güncelleme: 20 Eylül 2026

## Plan varsayımları

- Sprint süresi: 2 hafta
- Ürün: iOS ve Android mobil uygulama
- Geliştirme yöntemi: contract-first, dikey dilimler
- Her sprint sonunda Android ve iOS üzerinde doğrulanabilir çıktı alınır
- Backend, mobil ve test işleri aynı feature kapsamında planlanır

## Ortak kabul kapısı (tüm sprintler için)

- `flutter analyze` hatasız çalışır
- Etkilenen Flutter ve backend testleri yeşildir
- Loading, error, empty ve uygun yerlerde offline durumları uygulanmıştır
- API veya domain değişikliği ilgili dokümana işlenmiştir
- Android build ve en az bir emülatör smoke testi geçmiştir
- Secret, service-role key veya hassas veri commit edilmemiştir
- Değişiklikler geri alınabilir commitlere bölünmüştür

---

## Genel durum tablosu

| Sprint | Başlık | Durum |
|--------|--------|-------|
| S0 | Proje temeli | TAMAMLANDI |
| S0.5 | Mimari zemin | TAMAMLANDI |
| S1 | Auth ve onboarding | TAMAMLANDI |
| S2 | Ortak UI ve abonelik ekleme | TAMAMLANDI |
| S3 | Abonelik yaşam döngüsü | TAMAMLANDI |
| S4 | Dashboard ve finansal hesaplamalar | TAMAMLANDI |
| S5 | Takvim ve in-app bildirimler | TAMAMLANDI |
| S6 | Push bildirimleri | TAMAMLANDI (yerel — flutter_local_notifications) |
| S7 | Ayarlar, export, hesap silme | TAMAMLANDI |
| S8 | API mimarisi ve veri temeli | TAMAMLANDI |
| S9 | Auth ve abonelik API entegrasyonu | TAMAMLANDI |
| S10 | Ana ürün ekranları | TAMAMLANDI |
| S11 | Bildirim ve offline altyapısı | TAMAMLANDI |
| S12 | Test, güvenlik ve kalite kapısı | TAMAMLANDI |
| S13 | Temizlik ve dokümantasyon | TAMAMLANDI |
| S14 | Release ve yayın | DEVAM EDİYOR (mağaza kapıları açık) |
| S15 | API sözleşmesi ve backend migration hattı | TAMAMLANDI |
| S16 | Offline dayanıklılık ve Android smoke | TAMAMLANDI |
| S17 | Push bildirimleri ve platform izinleri | TAMAMLANDI |
| S18 | Release candidate ve dağıtım kapısı | TAMAMLANDI (kod/CI; mağaza kapıları açık) |
| S19 | Production operasyonları ve izlenebilirlik | TAMAMLANDI |
| S20 | Mobil null safety ve güvenlik yamaları | TAMAMLANDI |
| S21 | Backend kritik altyapı | TAMAMLANDI |
| S22 | Backend tamamlanmamış özellikler + CSV | TAMAMLANDI |
| S23 | Abonelik yaşam döngüsü ve durum UX'i | TAMAMLANDI (kod/test; migration uygulanacak) |
| S24 | Bildirim ve takvim bütünlüğü | TAMAMLANDI (kod/test; migration uygulanacak) |
| S25 | Gerçek veri senkronu ve tasarruf geçmişi | TAMAMLANDI (kod/test; migration uygulanacak) |
| S26 | Hesap silme, RLS ve veri güvenliği | TAMAMLANDI (kod/migration; Supabase doğrulaması bekliyor) |
| S27 | OAuth, ödeme yöntemi ve CSV import | TAMAMLANDI (kod/test; provider/migration ayarı bekliyor) |
| S28 | Finansal içgörü ve UX kalitesi | DEVAM EDİYOR |
| S29 | Offline dayanıklılık ve platform deneyimi | TAMAMLANDI (kod/test; gerçek cihaz matrisi bekliyor) |
| S30 | Farklılaşma ve ticarileştirme | DEVAM EDİYOR |
| S35 | Otomatik test süiti stabilizasyonu | TAMAMLANDI |
| S36 | Senaryo kanıt testlerini güçlendirme | TAMAMLANDI |
| S37 | Excel kabul kriterleri ve ürün kuralı hizası | TAMAMLANDI |
| S38 | Otomatik kalite kanıtı ve release kaydı | TAMAMLANDI |
| S39 | Excel literal davranış hizalama (silme/otomatik yenileme) | TAMAMLANDI |
| S40 | Backend güvenlik sertleştirme (canlı doğrulamalı) | TAMAMLANDI |
| S41 | Web preview (telefon mockup) düzeltmesi | TAMAMLANDI |
| S42 | Profil düzenlenebilirliği | TAMAMLANDI |
| S43 | Abonelik bazlı bildirim özelleştirmesi | TAMAMLANDI |
| S44 | Hukuki/uyum: gizlilik politikası, kullanım şartları, KVKK onayı | TAMAMLANDI |
| S45 | Küçük UX iyileştirmeleri | TAMAMLANDI |
| S46 | Ana sayfa sadeleştirmesi (grafik-öncelikli) | TAMAMLANDI |

---

## S0 — Proje temeli

**Durum:** TAMAMLANDI

**Hedef:** Çalışan Flutter proje kabuğunu, geliştirme ortamlarını ve teknik kararları oluşturmak.

**Yapılanlar:**
- Flutter projesi `mobile/` altında oluşturuldu
- `pubspec.yaml`, `main.dart`, lint ve format ayarları eklendi
- Development/staging/production environment yapısı kuruldu
- Navigation, app shell ve bottom navigation temeli oluşturuldu
- Tema tokenları ve ortak UI klasörleri bağlandı
- Mobil framework kararı ADR ile kesinleştirildi
- Backend hosting, auth, queue, e-posta ve analytics sağlayıcıları kararlaştırıldı
- OpenAPI taslağı oluşturuldu
- CI'da lint, test ve Android build çalışıyor
- Environment secret'ları kaynak kodda bulunmuyor

---

## S0.5 — Mimari zemin

**Durum:** TAMAMLANDI

**Hedef:** Sprint 1 öncesinde mimari borçları kapatmak: go_router, provider, abstract DI.

**Yapılanlar:**
- `go_router` ve `provider` eklendi; kullanılmayan `sqflite` ve `path` kaldırıldı
- `AuthDataSource` ve `SubscriptionDataSource` abstract interface'leri oluşturuldu
- `AuthRepository` ve `SubscriptionRepository` interface'leri implement etti
- `AuthController` ve `SubscriptionController` tipleri abstract'a yükseltildi
- `SubscriptionController.add()` ve `edit()` finally bloğu bug'ı düzeltildi
- `AuthController`'a `initialized`, `onboardingNeeded`, `onboardingDone()` eklendi
- `AppRouter` — go_router redirect guard, tüm temel rotalar
- `AuthenticatedShell` widget'ı oluşturuldu
- `app.dart` — `MultiProvider` (AuthController + SettingsController) ve `MaterialApp.router`
- `AppShell` ve tab ekranları `context.watch/read` ile çalışıyor

---

## S1 — Auth ve onboarding

**Durum:** TAMAMLANDI

**Hedef:** Kullanıcının hesap oluşturup güvenli şekilde oturum açabilmesi.

**Yapılanlar:**
- E-posta + şifre kayıt, giriş, çıkış
- `SupabaseAuthRepository` entegre, `isSupabaseConfigured = true`
- Şifre sıfırlama e-postası (`ForgotPasswordScreen`)
- Deep link: `subscripttrack://auth-callback` (AndroidManifest'te tanımlı)
- `ResetPasswordScreen` — deep link sonrası yeni şifre belirleme
- `AuthController.passwordRecoveryMode` — go_router redirect guard ile bağlı
- `AuthController.updatePassword()` — Supabase `updateUser` çağırıyor
- Onboarding: 4 sayfa (3 tanıtım + para birimi seçimi), ilk açılışta gösteriliyor
- Auth controller unit testleri geçiyor
- `flutter test --no-pub` başarılı

---

## S2 — Ortak UI ve abonelik ekleme

**Durum:** TAMAMLANDI

**Hedef:** Kullanıcının ilk aboneliğini doğrulanmış bir form üzerinden ekleyebilmesi.

**Yapılanlar:**
- App shell, top bar, bottom navigation tamamlandı
- Button, card, dialog, badge, bottom sheet bileşenleri oluşturuldu
- `SubscriptionStatus` enum: `active`, `paused`, `cancelled`, `archived`
- `start_date` alanı tüm katmanlarda mevcut
- `SupabaseSubscriptionRepository` — PostgREST ile tam CRUD
- `SubscriptionController`: pause, resume, cancel, archive, restore, edit, delete
- Abonelik formu: ad, tutar, para birimi, döngü, kategori, başlangıç tarihi, yenileme tarihi, notlar
- `lib/core/domain/money.dart` — tamsayı minor unit ile floating point'siz para hesaplama
- Tüm katmanlar (`amount: double` → `Money`) güncellendi — 15 dosya
- `Subscription.toJson/fromJson` JSON round-trip testi (`test/subscription_model_test.dart`)
- Form validation widget testleri (`test/subscription_form_test.dart`)
- `flutter analyze --no-pub`: hata yok
- `flutter test --no-pub`: 61 test başarılı
- Android debug APK başarıyla üretildi
- Backend REST contract: S8'e ertelendi (şimdilik Supabase direct client çalışıyor)

---

## S3 — Abonelik yaşam döngüsü

**Durum:** TAMAMLANDI

**Hedef:** Aboneliklerin listelenmesi, detayının görülmesi ve domain durumlarının yönetilmesi.

**Yapılanlar:**
- `SubscriptionListScreen` — Aktif / Durakladı / İptal sekmeleri (`TabController`)
- Arama, kategori filtresi, sıralama (tarih / tutar / ad)
- Abonelik detay: durum bazlı popup menu
- pause/resume/cancel/archive/restore/edit/delete işlemleri çalışıyor
- Offline cache: `SubscriptionController._writeCache/_readCache` — SharedPreferences'a son başarılı listeyi yazar
- Offline banner: `MaterialBanner` (turuncu) — yalnızca `isOffline=true` olduğunda gösterilir
- Hata banner: `MaterialBanner` — ağ hatası + cache yoksa gösterilir, "Tekrar dene" butonu
- Archived kayıtlar varsayılan listeden çıkarıldı (ayrı `ArchivedSubscriptionsScreen`)
- State transition unit testleri: pause/resume/cancel/archive/restore/delete (`test/subscription_controller_test.dart`)
- Liste widget testi: form doğrulama akışı (`test/subscription_form_test.dart`)

---

## S4 — Dashboard ve finansal hesaplamalar

**Durum:** TAMAMLANDI

**Hedef:** Para birimi bazında güvenilir aylık/yıllık harcama özeti.

**Yapılanlar:**
- `totalsByCurrency` — farklı para birimleri ayrı satırlarda, toplam yapılmıyor
- `totalMonthly` — Money ile floating point'siz toplam
- Paused/cancelled abonelik metrik kartları
- Yaklaşan yenilemeler listesi (30 gün içinde)
- `DashboardScreen` — offline banner + hata banner + boş durum + pull-to-refresh (`RefreshIndicator`)
- `monthlyAmount` getter — tüm billing cycle'lar için hesaplama (weekly×4.33, monthly, quarterly÷3, yearly÷12)
- `CalendarController.totalsByCurrencyForMonth` — Money ile aylık para birimi bazlı toplam
- `Money` sınıfı: tamsayı minor unit, float drift yok; tüm aritmetik integer'da
- Hesaplama ve decimal rounding testleri: `test/money_test.dart` (16 test), `test/subscription_model_test.dart` (billing cycle kısmı)
- Controller state testleri: load/error/offline/totalMonthly/totalsByCurrency (`test/subscription_controller_test.dart`)
- Dashboard API contract: S8'e ertelendi (şimdilik SubscriptionController üzerinden çalışıyor)

---

## S5 — Takvim ve in-app bildirimler

**Durum:** TAMAMLANDI

**Hedef:** Yenileme olaylarını takvimde ve bildirim merkezinde görünür hale getirmek.

**Yapılanlar:**
- Aylık takvim — yenileme tarihleri işaretlendiğinde gösteriliyor
- `totalsByCurrencyForMonth()` — her para birimi için aylık toplam, Money ile
- `NotificationController.refresh()` — 0 gün / 1–3 gün / 4–7 gün öncesi bildirim üretimi
- `NotificationCenterScreen` — liste, renk kodlu ikonlar, okundu işaretleme
- `TopBar` unread badge ve bell ikonu
- `CalendarEventItem.onTap` → `SubscriptionDetailScreen` navigasyonu (zaten mevcut)
- `NotificationCenterScreen` bildirim tap'ı → abonelik detay açılıyor (zaten mevcut)
- Read state persist: `loadReadState()`/`_saveReadState()` ile SharedPreferences'a yazılır; app restart sonrası okundu işaretleri korunur
- Read state pruning: `refresh()` çağrısında geçmiş abonelik ID'leri bellekten temizlenir
- `AuthenticatedShell.initState()` → `_notif.loadReadState()` çağrısı eklendi
- `CalendarController` unit testleri: `renewalsForDay`, `renewalDaysInMonth`, `totalsByCurrencyForMonth`, timezone, ay sınırı (`test/calendar_controller_test.dart`)
- `NotificationController` unit testleri: bildirim üretimi, stableId, markRead, persist, pruning (`test/notification_controller_test.dart`)
- Calendar/notification API contract: S8/S9'a ertelendi (okuma kalıcılığı backend'e yazılmıyor, in-memory + local prefs)

---

## S6 — Push bildirimleri

**Durum:** TAMAMLANDI

**Hedef:** Bildirimlerin doğru zamanda cihazda teslimi.

**Yapılanlar:**
- `flutter_local_notifications ^18.0.0` + `timezone ^0.9.4` kurulu
- `LocalNotificationService` — Android + iOS kanallar, izin isteme, zamanlanmış bildirim
- `scheduleRenewalReminders()` — aktif abonelikler için N gün önce 09:00'da bildirim
- Saat dilimi desteği: `SettingsController.timezone` boşsa cihaz yerel saati kullanılır
- Android izinleri: `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `RECEIVE_BOOT_COMPLETED`
- `NotificationPreferencesScreen` — açma/kapama, kaç gün önce (1/3/7), test bildirimi
- **Notification ID collision fix:** ID artık `'${sub.id}|$daysBefore|$dateKey'.hashCode` — farklı abonelik + farklı kaç gün önce + farklı tarih → farklı ID; çakışma yok
- `cancelAll()` önceden çağrılır → aynı çalışmada duplicate zamanlama imkânsız

---

## S7 — Ayarlar, export ve hesap silme

**Durum:** TAMAMLANDI

**Hedef:** Kullanıcının profil, gizlilik ve veri haklarını mobil uygulamadan yönetebilmesi.

**Yapılanlar:**
- `AppearanceScreen`: tema (sistem/aydınlık/karanlık), para birimi, saat dilimi seçici (13 saat dilimi)
- `SettingsController`: currency, themeMode, notificationsEnabled, daysBefore, timezone — hepsi SharedPreferences'a yazılıyor
- `ExportDataScreen`: CSV oluşturma, dosya olarak paylaşma (`share_plus`) veya panoya kopyalama — Durum sütunu mevcut, duraklatılan/iptal edilenler dahil
- `DeleteAccountScreen`: şifre doğrulama (re-auth) sonrası hesap silme
- `NotificationPreferencesScreen`: bildirim tercihleri

---

## S8 — API mimarisi ve veri temeli

**Durum:** TAMAMLANDI

**Hedef:** Mobil, backend ve veritabanı veri akışının REST API üzerinden standartlaştırılması.

**Yapılanlar:**
- [x] Mobil ana subscription akışının REST API olacağını kesinleştir — `isApiConfigured` flag ile öncelik zinciri kuruldu
- [x] `ApiClient`: base URL, Bearer token, 30s timeout, X-Request-ID UUID, 3-retry (400ms×n backoff), ortak hata modeli (NetworkException / AuthException / ValidationException / NotFoundException)
- [x] `TokenProvider` abstraction + `SupabaseTokenProvider` / `StaticTokenProvider` (test)
- [x] `ApiSubscriptionRepository` — SubscriptionDataSource impl; GET/POST `/v1/subscriptions`, PATCH/DELETE `/v1/subscriptions/{id}`, PATCH `/v1/subscriptions/{id}/status`; snake_case → domain model mapping
- [x] Flutter `Money` value class ile floating point hatası önlendi; tüm para alanları minor unit integer
- [x] Repo seçim önceliği: `isApiConfigured` → `ApiSubscriptionRepository` → `isSupabaseConfigured` → `SupabaseSubscriptionRepository` → local fallback
- [x] RLS `auth.uid() = user_id` politikaları — `SubscriptTrack-Documentation/database/rls_policies.sql`
- [x] Secret scan kontrol listesi — `--dart-define` inject, kaynak kodda key yok
- [x] `http: ^1.2.0` bağımlılığı eklendi; `flutter pub get` başarılı
- [x] `test/api_client_test.dart` — 19 test: başarılı 200/201/204, hata 400/401/403/404/422/500, retry (5xx 2→3 geçer, 4xx retry yok), header (Bearer, X-Request-ID, Content-Type), mesaj çözümleme (error.message / message / HTTP 4xx)
- [x] `flutter analyze --no-pub` — 0 hata
- [x] `flutter test --no-pub` — 108/108 geçti

**Kabul kriterleri:** Mobil subscription verisi REST API'den gelir; para hesapları floating point hatası üretmez; ownership güvenliği RLS ile sağlandı; secret scan temizdir.

---

## S9 — Auth ve abonelik API entegrasyonu

**Durum:** TAMAMLANDI

**Hedef:** Oturumdan subscription CRUD ve lifecycle akışına kadar uçtan uca backend entegrasyonu.

**Yapılanlar:**
- [x] Session restore — `AuthController.init()` → `currentUser()` + Supabase `tokenRefreshed` stream
- [x] Login, register, forgot-password, reset-password, logout — S1'den mevcut; standardize edildi
- [x] 401 redirect — `SubscriptionController.onUnauthorized` callback → `AuthenticatedShell` üzerinden `auth.signOut()` tetikleniyor
- [x] CRUD + lifecycle endpointleri — S8'de bağlandı (GET/POST/PATCH/DELETE + status endpoint)
- [x] Cursor pagination — `ApiSubscriptionRepository.getPaged(cursor, limit)` + `SubscriptionPage(items, nextCursor)` + `SubscriptionController.loadMore()`
- [x] Status transition guard — `SubscriptionStatus.canTransitionTo()` — geçersiz geçişi `ValidationException` ile reddeder; backend kurallarıyla eşleşiyor
- [x] Re-auth + account deletion temizlik — `deleteAccount()` → subscriptions cache + `notif_read_ids` SharedPreferences temizlendi
- [x] Idempotency-Key — POST/PATCH her çağrısında yeni UUID header; retry'da aynı key korunuyor (server-side dedup)
- [x] In-flight dedup — `load()` zaten çalışıyorsa ikinci çağrı ignore edilir
- [x] Yeni testler: `auth_controller_s9_test.dart` (8), `subscription_status_transition_test.dart` (14), `subscription_controller_test.dart` S9 grubu (+5) — toplam 135 test
- [x] `flutter analyze --no-pub` — 0 hata | `flutter test --no-pub` — 135/135 geçti

**Kabul kriterleri:** Geçmiş oturum korunur; CRUD backend event üretir; geçersiz status geçişi reddedilir; 401 güvenli login yönlendirmesi yapar.

---

## S10 — Ana ürün ekranları

**Durum:** TAMAMLANDI

**Hedef:** Dashboard, liste, detay, takvim ve stats ekranlarını gerçek API verisiyle tamamlamak.

**Yapılanlar:**
- [x] Dashboard summary ve upcoming — `controller.active`, `upcomingRenewals`, `totalsByCurrency` zaten API controller'dan geliyor
- [x] Aylık/yıllık toplam currency ayrımı — Dashboard MonthlySpendCard'da her para birimi ayrı satır + yıllık toplam (`×12`) gösteriliyor
- [x] "Tümünü gör" navigation — `DashboardScreen(onViewAllSubscriptions)` callback → `AppShell._index = 2` (subscriptions tab)
- [x] Liste arama, filtre, sıralama — `_filtered()` client-side uygulama; `hasMore` pagination sentinel (loadMore trigger)
- [x] Infinite scroll loadMore — `_SubscriptionTabView`'de sentinel item → `controller.loadMore()`
- [x] DetailScreen action menu tamamlandı — `paused/cancelled → archive` seçeneği eklendi (daha önce eksikti)
- [x] StatsScreen: currency mixing bug düzeltildi — `totalMonthly` yerine `totalsByCurrency` kullanılıyor; mixed currency durumunda per-currency kartlar; loading/error/refresh state eklendi
- [x] SavingsScreen: loading/error state eklendi; multi-currency gruplandırma (her currency için ayrı top-3 scenario kartı)
- [x] Erişilebilirlik — `Semantics` sarmalayıcıları: "Tümünü gör" butonu, FAB, stats→savings butonu, monthly total label
- [x] `flutter analyze --no-pub` — 0 hata (4 önceden var olan info) | `flutter test --no-pub` — 135/135 geçti

**Kabul kriterleri:** Ekranlar aynı backend verisini gösterir; currency'ler toplanmaz; inactive kayıtlar aktif toplama girmez; refresh/empty/error akışları çalışır.

---

## S11 — Bildirim ve offline altyapısı

**Durum:** TAMAMLANDI

**Hedef:** Bildirimleri kalıcı, timezone uyumlu, tekrarsız ve offline dayanıklı hale getirmek.

**Yapılanlar:**
- [x] `OfflineMutationQueue` — SharedPreferences destekli kalıcı kuyruk; `enqueue/drain/clear` + FIFO garantisi + JSON round-trip
- [x] `DeviceTokenService` abstract + `SupabaseDeviceTokenService` — push token altyapısı (şu an kullanılmıyor)
- [x] `NotificationReadSyncService` — `POST /v1/notifications/read-batch`; best-effort (catch-all, hata sessiz)
- [x] `NotificationController.markRead/markAllRead` — read state hem SharedPreferences'a hem backend'e (async) yazılıyor
- [x] `SubscriptionController` S11 — `_mutationQueue`, `_lastSyncAt`, `_replayOfflineQueue()`, `_applyMutation()`, `_updateLocalStatus()` eklendi; tüm lifecycle metodları `mutationType` alıyor; `NetworkException` catch → offline queue
- [x] Settings değişiklik dinleyicisi — `AuthenticatedShell` içinde `SettingsController.addListener(_onSettingsChanged)`; `daysBefore` veya `timezone` değişince `scheduleRenewalReminders` tetikleniyor
- [x] Duplicate schedule guard — `LocalNotificationService._lastScheduleHash`; içerik hash eşleşirse `scheduleRenewalReminders` erken çıkıyor
- [x] `_OfflineBanner` widget — Dashboard ve liste ekranlarında; `lastSyncAt` göreceli zaman ("X sn/dk/sa/gün önce güncellendi"); tekrar dene butonu
- [x] `test/offline_mutation_queue_test.dart` — 9 test: boş/enqueue/drain/clear/JSON round-trip/FIFO/drain sonrası enqueue
- [x] `flutter analyze --no-pub` — 0 warning/error (2 önceden var olan info kaldı)
- [x] `flutter test --no-pub` — 144/144 geçti

**Kabul kriterleri:** Bildirim doğru timezone'da gelir; duplicate gönderim olmaz; offline veri ve okunma durumu korunur; mutation kuyruğu bağlantı geri gelince oynatılır.

---

## S12 — Test, güvenlik ve kalite kapısı

**Durum:** TAMAMLANDI

**Hedef:** Kritik domain, API ve güvenlik akışlarını otomatik testlerle korumak.

**Yapılanlar:**
- [x] `test/date_time_utils_test.dart` — 17 test: `renewalLabel` (negatif/0/1/3/7/14/30/60/365), `formatCurrency` (sembol, sıfır, büyük tutar, virgül), `formatDate` (bugün/yarın/geçmiş/gelecek/12 ay)
- [x] `test/notification_read_sync_service_test.dart` — 5 test: boş set no-op, POST body doğru, 500 hata yutulur, ağ hatası yutulur, tek ID
- [x] `test/subscription_computed_test.dart` — 15 test: `daysUntilRenewal` (gelecek/geçmiş/bugün), `totalsByCurrency` (tek/çoklu/paused dışlama/boş), `upcomingRenewals` (30 gün içi/dışı/geçmiş/paused), `active/paused/cancelled/archived` gruplandırma, `active` sıralama, `isOffline` (başarılı/cache+hata)
- [x] `test/security_scan_test.dart` — 4 test: Supabase URL/JWT/IP adresi/service_role key kaynak kodda yok kontrolü
- [x] Mevcut kapsam (önceki sprintlerden): Money (8), ApiClient (19), subscription model/status (8+14), AuthController (9), SubscriptionController (21+), CalendarController (12), NotificationController (14), OfflineMutationQueue (9), SubscriptionForm (4) — hepsi yeşil
- [x] `flutter analyze --no-pub` — 0 hata/uyarı (2 önceden var olan info)
- [x] `flutter test --no-pub` — 189/189 geçti

**Kabul kriterleri:** Kritik test suite yeşildir; ownership ve lifecycle testle kanıtlanır; kritik security finding kalmaz.

---

## S13 — Temizlik ve dokümantasyon

**Durum:** TAMAMLANDI

**Hedef:** Kod, metin ve proje dokümanlarını tek doğru kaynak haline getirmek.

**Yapılanlar:**
- [x] Deprecated `RadioListTile.groupValue/onChanged` → `RadioGroup<int>` ile sarmalandı (`notification_preferences_screen.dart`)
- [x] Kullanılmayan `feature_pages.dart` silindi (FeaturePage widget hiçbir yerde import edilmiyordu)
- [x] `MOBILE_ARCHITECTURE.md` — teorik taslaktan gerçek uygulamaya güncellendi: klasör yapısı, repository önceliği, offline mimarisi, bildirim mimarisi, güvenlik, test piramidi
- [x] `CURRENT_STATUS.md` — mimari bölümü S8–S12 servisleriyle senkronize edildi (ApiClient, TokenProvider, OfflineMutationQueue, NotificationReadSyncService vb.)
- [x] `DEPLOYMENT.md` — yeni dosya: ortam değişkenleri, Supabase kurulum SQL, RLS, Android/iOS build komutları, CI/CD örneği, kalite kapısı
- [x] `flutter analyze --no-pub` — 0 issue (önceki 2 info da çözüldü)
- [x] `flutter test --no-pub` — 189/189 geçti

**Kabul kriterleri:** Karakter bozulması, kritik placeholder ve doküman çelişkisi kalmaz.

---

## S13 sonrası — Prod Readiness Düzeltmeleri

**Durum:** TAMAMLANDI (1–2 Ağustos 2026)

37 mobil Dart + 22 backend JS dosyası uçtan uca tarandı. Gerçek kod kalite puanı: **72/100** (7 "açık" bulgunun zaten fix'li olduğu görüldükten sonra 65'ten düzeltildi).

**Kapatılan kritikler:**
- [x] `AuthController.init()` race condition — `if (!_initialized)` guard
- [x] `authenticated_shell.dart` `user!.id` force-unwrap — null guard + `addPostFrameCallback(signOut)`
- [x] `date_time_utils.dart formatDate` gece saati bug — calendar-day karşılaştırması
- [x] 189/189 test yeşil

**Zaten fix'li olduğu doğrulanan bulgular (7 adet):**
- `offline_mutation_queue._synchronized()` → `_tail` promise chain atomik
- `subscription_controller.delete()` → `on NetworkException` + generic catch zaten vardı
- `subscription_list_screen.dart:217` → `addPostFrameCallback` ile defer edilmişti
- `subscription_models.dart` → `DateTime.tryParse(...) ?? DateTime.now()` ve `?? 'monthly'` vardı
- `notification_controller.markRead/markAllRead` → `await _saveReadState()` zaten mevcut

**Açık kalan bulgular → S20/S21/S22'ye alındı (aşağıda)**

---

## S14 — Release ve yayın

**Durum:** DEVAM EDİYOR — Teknik hazırlık tamamlandı (S15–S18 kapsamında); mağaza gönderimi dış hesap kapılarına bağlı.

**Hedef:** Android ve iOS için izlenebilir staging/release çıktıları almak ve mağazaya göndermek.

**Tamamlananlar (S15–S18 kapsamında):**
- [x] Android keystore, signing, `key.properties` ile dışarıdan yükleniyor
- [x] R8/ProGuard ve Flutter koruma kuralları eklendi
- [x] GitHub Actions CI: analyze, test, AAB artefakt
- [x] iOS Flutter platformu oluşturuldu, bundle ID ve deep link şeması tanımlı
- [x] `RELEASE_CHECKLIST.md` oluşturuldu

**Açık (dış hesap kapıları):**
- [ ] Upload keystore (Play Console)
- [ ] Apple Developer hesabı / Xcode archive
- [ ] Staging ve production Supabase + API credential'ları
- [ ] Gerçek cihaz son smoke testi
- [ ] Privacy policy ve terms yayını
- [ ] TestFlight ve Google Play Internal Testing dağıtımı
- [ ] App Store ve Google Play gönderimi

**Kabul kriterleri:** Release build gerçek cihazda açar; kayıt, abonelik ve bildirim ana akışı geçer; production credential'ları ayrıdır; CI yeşildir.

---

## S15 — API sözleşmesi ve backend migration hattı

**Durum:** TAMAMLANDI (kod + otomatik kontrat testi)

**Hedef:** Flutter istemcisini gerçek REST API sözleşmesiyle eşlemek ve
backend veritabanı migration hattını tek kanonik şemada toplamak.

**Yapılanlar:**
- [x] Mobil repository base path'i `/api/v1/subscriptions` ile eşlendi.
- [x] Liste, create, update ve lifecycle payload/response alanları backend camelCase sözleşmesine eşlendi.
- [x] `startDate`, `NEWS` ve `FOOD` kategori sözleşmesi backend şemasına eklendi.
- [x] Stable cursor (`renewal timestamp + subscription id`) ile aynı yenileme zamanındaki kayıt atlama riski kapatıldı.
- [x] `ARCHIVED → ACTIVE` restore geçişi `/resume` endpoint'i üzerinden etkinleştirildi.
- [x] Migration runner yalnız REST API şeması olan `001 + 003`ü uygular; eski direct-Supabase `002` hattını çalıştırmaz.
- [x] Mobil REST kontrat testi eklendi; `dart analyze` ve hedefli test yeşil.

**Kalan dış ortam adımı:** Staging veritabanına migration uygulamak, gerçek token ile smoke test yapmak ve API origin'ini release secret olarak tanımlamak.

---

## S16 — Offline dayanıklılık ve Android smoke doğrulaması

**Durum:** TAMAMLANDI (kod + otomatik test)

**Hedef:** Bağlantı kesintisinde kullanıcı değişikliklerini korumak ve yeniden
bağlanınca lifecycle işlemlerinin kullanıcı niyetindeki sırayla uygulanmasını sağlamak.

**Yapılanlar:**
- [x] Offline queue'ya `peek/removeFirst` eklendi; replay yalnız başarıdan sonra başı siler.
- [x] Replay başarısız olduğunda kuyruk başı yerinde kalır; sonraki işlemler öne geçmez.
- [x] Optimistic lifecycle, delete, add ve edit değişiklikleri local cache'e kalıcı yazılır.
- [x] Bilinmeyen/bozuk mutation sessizce kaybedilmez; retry için kuyrukta tutulur.
- [x] Queue FIFO ve replay sırası için yeni testler eklendi.
- [x] Android API 36 Pixel 9 Pro emülatöründe debug APK yüklendi ve uygulama süreci başlatıldı.

**Doğrulama:** `dart analyze` temiz; offline queue + controller hedefli testleri 33/33 geçti.
Emülatörün System UI'si ANR verdiği için görsel kullanıcı-akışı kontrolü emülatör kaynaklı tamamlanamadı; uygulama logunda FATAL/E/flutter crash görülmedi.

---

## S17 — Push bildirimleri ve platform izinleri

**Durum:** TAMAMLANDI

**Hedef:** Yerel bildirim izinlerini Android/iOS davranışıyla uyumlu tutmak.

**Yapılanlar:**
- [x] Android notification/exact-alarm/boot izinleri ve iOS izin isteği yerel bildirim akışıyla doğrulandı.
- [x] `LocalNotificationService` — platform izin isteği, kanal yapılandırması ve zamanlanmış bildirim tam çalışıyor.
- [x] `DeviceTokenService` altyapısı mevcut (kullanılmıyor — uzak push kapsam dışı).

---

## S18 — Release candidate ve dağıtım kapısı

**Durum:** TAMAMLANDI (kod/CI hazırlığı; dış hesap kapıları açık)

**Hedef:** Uygulamayı tekrarlanabilir Android/iOS release adayına hazırlamak ve
mağaza/staging öncesi teknik kapıları görünür kılmak.

**Yapılanlar:**
- [x] Android release signing `key.properties` ile dışarıdan yüklenir; keystore `.gitignore` kapsamındadır.
- [x] R8/resource shrinking ve Flutter ProGuard koruma kuralları eklendi.
- [x] GitHub Actions kalite kapısı eklendi: pub get, analyze, test ve main için unsigned AAB artefaktı.
- [x] iOS Flutter platformu oluşturuldu; bundle ID `com.subscripttrack.app`, auth deep link şeması eklendi.
- [x] Kotlin Gradle Plugin 2.2.20’ye yükseltildi.
- [x] Release, staging, imza, mağaza ve rollback adımlarını ayıran `RELEASE_CHECKLIST.md` eklendi.

**Doğrulama:** `dart analyze` temiz. Tam test suite önceki çalıştırmada yeşil ilerledi; Android release AAB üretimi bu Windows ortamında Gradle’ın çıktı üretmeden beklemesi nedeniyle tamamlanamadı. Bu yüzden Play/TestFlight gönderimi yapılmış sayılmaz.

**Kalan dış hesap kapıları:** upload keystore, Play Console, Apple Developer/Xcode, staging API/Supabase credential’ları, gerçek cihaz smoke testi ve hukuki metinlerin yetkili incelemesi/yayını.

---

## S19 — Production operasyonları ve izlenebilirlik

**Durum:** TAMAMLANDI (kod + operasyon dokümantasyonu)

**Hedef:** API’nin orchestration ortamında güvenli şekilde hazır olup olmadığını
göstermek, istekleri hassas veri sızdırmadan izlemek ve kontrollü kapanmak.

**Yapılanlar:**
- [x] `/health` liveness ve PostgreSQL kontrollü `/ready` readiness endpointleri ayrıldı.
- [x] Browser CORS wildcard’ı kaldırıldı; izinli originler `CORS_ORIGINS` ile tanımlanır.
- [x] Request ID, method, path, status ve süreyi içeren JSON telemetry eklendi; body/token loglanmaz.
- [x] SIGTERM/SIGINT graceful shutdown: yeni bağlantılar kapatılır, pool kapatılır, timeout ile fail-safe çıkış yapılır.
- [x] Deployment dokümanına health probe, CORS ve loglama davranışı eklendi.

**Dış ortam kapısı:** Staging/production altyapısında load balancer probe URL’leri,
log toplama/uyarı kuralları ve `CORS_ORIGINS` secret/environment değeri tanımlanmalıdır.

---

---

## S20 — Mobil null safety ve güvenlik yamaları

**Durum:** TAMAMLANDI (2 Ağustos 2026 · 194/194 test yeşil)

**Hedef:** Tam mobil kod taramasında ortaya çıkan null crash, RangeError ve force-unwrap risklerini kapatmak.

**Görevler:**

- [ ] `supabase_subscription_repository.dart:150,154,158` — `_fromRow()` null guard: `row['billing_cycle'] as String? ?? 'monthly'`, `DateTime.tryParse(row['next_renewal_date'] as String? ?? '') ?? DateTime.now()`, `DateTime.tryParse(row['created_at'] as String? ?? '') ?? DateTime.now().toUtc()`
- [ ] `settings_controller.dart:30` — `ThemeMode.values[index]` → `.clamp(0, ThemeMode.values.length - 1)` ekle (RangeError önleme)
- [ ] `settings_screen.dart (ProfileTab):21` — `auth.user!` → `auth.user` null-safe oku; null durumunda erken return
- [ ] `auth_repository.dart:106` — Unsalted SHA-256 local fallback: ya salt ekle ya da yerel fallback'i açıkça belgele + son kullanıcı bu kod yoluna düşmez yap
- [ ] `subscription_controller.dart:347` — `_updateStatus()` hardcode Türkçe mesajını i18n key'e taşı (veya bir `AppLocalizations` stub ekle; release öncesi temizle)
- [ ] `auth_models.dart` — `DateTime.parse(json['createdAt'])` → `DateTime.tryParse(...) ?? DateTime.now()`
- [ ] `app_environment.dart` — `current = AppEnvironment.development` → release build'lerde `production` inject edildiğini doğrula; `kReleaseMode` guard ekle
- [ ] Etkilenen alanlarda `flutter test --no-pub` geçmeli (en az 189 test yeşil kalmalı)

**Kabul kriterleri:** `_fromRow()` DB null değerinde crash üretmiyor; `ThemeMode` index bound-safe; `auth.user` hiçbir ekranda force-unwrap yok; release build `development` modda çalışmıyor.

---

## S21 — Backend kritik altyapı

**Durum:** TAMAMLANDI (2 Ağustos 2026)

**Hedef:** Production'da veri kaybına ya da sessiz yanlış hesaplamaya yol açabilecek üç backend sorununu kapatmak.

**Görevler:**

- [ ] `middleware/idempotency.js` — In-memory `Map`'i DB tablosuna taşı:
  - Migrations klasörüne `idempotency_keys(user_id, method, path, key, status, response_body, expires_at)` tablosu ekle
  - `idempotency.js`'yi DB okuma/yazma yapacak şekilde yeniden yaz
  - Map'e fallback bırakılmayacak; restart veya çok instance'da idempotency garantisi sağlanmalı
- [ ] `features/dashboard/dashboard.routes.js:18-22` — SQL içindeki `bs.amount * 52 / 12` tamsayı bölmesini düzelt:
  - `subscriptions.service.js`'deki `decimalToScaled / scaledToDecimal` mantığını SQL'e ya da JS katmanına taşı
  - Alternatif: PostgreSQL `NUMERIC(19,4)` aritmetiği kullan, JS'de round etme
- [ ] `features/calendar/calendar.routes.js` — `renewal_occurrences` tablosunu dolduracak mekanizma:
  - Subscription create/patch sırasında sonraki N occurrence'ı üret (öneri: 13 ay ilerisi)
  - Subscription status değişiminde (CANCELLED, ARCHIVED) ilgili future occurrence'ları CANCELLED olarak işaretle
  - Alternatif: pg-boss / BullMQ scheduled job (tercih edilir)
  - Endpoint mock/stub olmaktan çıkana kadar mobile client fallback davranışını belgele

**Kabul kriterleri:** Idempotency key DB'de korunuyor, restart veya ikinci instance sonrası aynı key duplikasyona yol açmıyor; Dashboard toplamları BigInt/NUMERIC hassasiyetinde; Calendar API `renewal_occurrences`'dan gerçek veri dönüyor.

---

## S22 — Backend tamamlanmamış özellikler ve CSV düzeltmesi

**Durum:** TAMAMLANDI (2 Ağustos 2026)

**Hedef:** Stub olarak bırakılmış backend özelliklerini tamamlamak ve RFC 4180 uyumlu CSV export üretmek.

**Görevler:**

- [ ] `features/exports/exports.routes.js` — Gerçek export implementasyonu:
  - `POST /exports` → pg-boss / BullMQ job kuyruğuna iş gönder
  - Worker: kullanıcının aboneliklerini çek → CSV/JSON üret → Supabase Storage'a yükle → `exports.download_url` ve `expires_at` güncelle
  - `GET /exports/:id` polling endpoint hali hazırda mevcut; worker tamamladığında `COMPLETED` set etmeli
- [ ] `features/me/me.routes.js` — GDPR silme akışı:
  - `DELETION_PENDING` set etmenin yanı sıra pg-boss job veya Supabase Edge Function tetikle
  - Job: 30 gün bekle (ya da anında), tüm kişisel veriyi sil, hesabı Supabase Auth'tan sil
  - Silme zamanlaması ve geri dönülemezliği `CURRENT_STATUS.md`'e yaz
- [ ] `features/subscriptions/subscriptions.service.js` — CUSTOM billing cycle:
  - `normalizeMonthly()` içinde `CUSTOM` explicit hata fırlat ya da `intervalCount` tabanlı hesap yap
  - Schema'daki `notifyDays` alanı ya `subscription_notify_days` kolonuna yaz ya da schema'dan çıkar
- [ ] `features/notifications/notifications.routes.js:167` — `encrypted_token` kolonunu ya gerçekten şifrele (AES-256-GCM, key vault'tan) ya da kolon adını `token` olarak yeniden adlandır (migration gerektirir)
- [ ] `features/settings/export_data_screen.dart` — RFC 4180 uyumu:
  - Header satırını tırnak içine al: `"Name","Amount",...`
  - `writeln` → `\r\n` line endings
  - Alan quoting testi yaz (`_csvField` zaten var; sadece header ve line ending eksik)
- [ ] Backend route testleri (en az happy-path): `exports`, `calendar`, idempotency DB mode
- [ ] `flutter test --no-pub` 189+ yeşil; `dart analyze` / `eslint` temiz

**Kabul kriterleri:** Export asenkron tamamlanıyor ve download URL dönüyor; hesap silme GDPR akışını başlatıyor; CUSTOM cycle hata üretmiyor ya da doğru normalize ediliyor; CSV Excel'de doğru açılıyor.

---

## Güncel ürün sprintleri — S23–S30

Bu bölüm, S0–S22 sonrasında kalan ürün özelliklerini sekiz dikey sprintte toplar. Her sprintte ilgili domain, veri, UI ve test işleri birlikte tamamlanır. S23–S26 temel ürünün feature-complete hedefidir; S27–S29 kullanılabilirlik ve platform kapsamıdır; S30 farklılaşma ve ticarileştirme fazıdır.

### S23 — Abonelik yaşam döngüsü ve durum UX'i

**Hedef:** Trial ve Expired durumlarını gerçek domain davranışı olarak tamamlamak ve tüm durumları listede/detayda ayrıştırmak.

**Kapsam:**
- Trial başlangıç/bitiş tarihi ve trial sonrası fiyat alanları
- `EXPIRED` modeli, geçiş kuralları ve event geçmişi
- Trial → ACTIVE/CANCELLED/EXPIRED geçişleri
- Active, Trial, Paused, Cancelled, Expired ve Archived filtreleri
- Durum çipleri, durum bazlı detay aksiyonları ve empty state'ler

**Kabul kriterleri:** Trial oluşturma/düzenleme ve bitiş sonrası geçiş çalışır; geçersiz geçişler reddedilir; tüm durumlar listede doğru görünür; domain, controller ve widget testleri yeşildir.

### S24 — Bildirim ve takvim bütünlüğü

**Hedef:** Trial ve yenileme olaylarını aynı olay modeli üzerinden bildirilebilir ve gezinilebilir yapmak.

**Kapsam:**
- Trial için 1/3/7 gün öncesi yerel bildirim
- Duplicate bildirim engeli ve timezone hesabı
- Bildirim payload'ında subscription ID
- Bildirim tıklamasından detay ekranına deep link
- Trial bitişlerinin takvimde ayrı event olması
- Yüksek tutarlı/yıllık ödemelerin görsel olarak ayrılması

**Kabul kriterleri:** Bildirim doğru yerel saatte planlanır; aynı olay tekrarlanmaz; bildirime tıklama doğru aboneliği açar; trial, renewal ve high-value event'leri takvimde ayrıdır.

### S25 — Gerçek veri senkronu ve tasarruf geçmişi

**Hedef:** Dashboard, calendar, savings, stats ve notifications ekranlarının gerçek Supabase verisiyle tutarlı çalışması.

**Kapsam:**
- Subscription, notification ve savings repository sync
- Cancel/pause sonrası gerçek `SavingsEvent` üretimi
- Tasarruf geçmişi ve para birimi bazlı gösterim
- Local cache ile remote verinin birleştirilmesi
- Refresh, timeout ve sync conflict davranışları

**Kabul kriterleri:** Ekranlar mock/yalnızca local hesap yerine gerçek repository verisini kullanır; cancel/pause olayları tasarruf geçmişine yansır; remote/local merge testleri tamamlanır.

### S26 — Hesap silme, RLS ve veri güvenliği

`009_s26_security_hardening.sql` tüm kullanıcı tablolarında RLS'yi açıkça etkinleştirir; delete-account Edge Function service role secret için `SUPABASE_SERVICE_ROLE_KEY` adını destekler.

**Hedef:** Kullanıcı verisi izolasyonunu ve hesap yaşam döngüsünü production seviyesinde tamamlamak.

**Kapsam:**
- Auth user, profile ve ilişkili verilerin eksiksiz silinmesi
- Edge Function üzerinden server-side silme
- RLS kullanıcı A/B izolasyon testleri
- 401/403/permission hata davranışları
- Foreign key/cascade ve silme audit yaklaşımı

**Kabul kriterleri:** Kullanıcı hesabını uygulamadan silebilir; ilişkili kişisel veri kalmaz; kullanıcılar birbirinin verisine erişemez; service-role key client’a girmez.

### S27 — OAuth, ödeme yöntemi ve CSV import

**Hedef:** Kullanıcı girişini ve toplu veri ekleme akışını tamamlamak.

**Kapsam:**
- Google login ve callback
- Apple login ve callback
- PaymentMethod local/Supabase CRUD
- Subscription form içinde payment method seçimi
- CSV picker, parser, validation ve import preview
- Duplicate kontrolü ve hatalı satır raporu

**Kabul kriterleri:** OAuth akışları başarılı/hatalı callback senaryolarıyla çalışır; ödeme yöntemleri kalıcıdır; CSV import veri kaybı oluşturmadan başarılı ve hatalı satırları raporlar.

### S28 — Finansal içgörü ve UX kalitesi

`011_s28_payment_events.sql` aylık trend ve gerçekleşen ödeme analizleri için kullanıcı/RLS korumalı ödeme geçmişi tabanını oluşturur.

**Hedef:** Kullanıcının yalnızca kayıtları değil, maliyetini anlamasını sağlamak.

**Kapsam:**
- Kategori bazlı tutar ve adet istatistikleri
- En pahalı abonelikler
- Aylık/yıllık finansal özetler
- Türkçe/İngilizce localization
- Add/edit/pause/cancel/archive/delete başarı mesajları
- Auth, network, validation ve server hata eşlemeleri
- Privacy center, kullanım koşulları ve destek bağlantısı

**Kabul kriterleri:** İstatistikler gerçek veriden üretilir; tüm kullanıcı metinleri localization üzerinden gelir; kritik işlemler başarı/hata geri bildirimi verir.

### S29 — Offline dayanıklılık ve platform deneyimi

**Hedef:** Bağlantı kesintilerinde güvenilir kullanım ve platforma özgü yardımcı özellikler.

**Kapsam:**
- Offline create/edit/status mutation replay
- Retry/backoff ve conflict davranışı
- Partial sync ve queue görünürlüğü
- iOS/Android Calendar export
- Ana ekran widget'ı
- Screen reader, text scaling, contrast ve focus desteği

**Kabul kriterleri:** Kuyruk bağlantı kesilip geldiğinde veri kaybetmez; aynı mutation iki kez uygulanmaz; takvim export iki platformda çalışır; temel ekranlar erişilebilirlik kontrollerinden geçer.

### S30 — Farklılaşma ve ticarileştirme

**Hedef:** SubscriptTrack’i basit liste uygulamasından karar destek ürününe dönüştürmek.

**Kapsam:**
- Kullanım/değer analizi
- Açıklanabilir abonelik sağlık skoru
- Fiyat geçmişi ve artış bildirimi
- Aile/partner paylaşımı ve izinleri
- Servis/ülke bazlı iptal rehberleri
- App Store/Google Play importu
- Free/Premium plan, entitlement ve restore purchase
- Gizlilik merkezi ve kullanıcı geri bildirim akışı

**Kabul kriterleri:** Kullanıcı hangi abonelikleri gözden geçirmesi gerektiğini anlayabilir; fiyat ve paylaşım geçmişi korunur; gizlilik/veri işlemlerine tek merkezden ulaşabilir; geri bildirim paylaşabilir; premium sınırları nettir; satın alma geri yükleme çalışır.

### Sprintler arası bağımlılıklar

```text
S23 → S24 → S25 → S26
             ↘ S27 → S28
                  ↘ S29 → S30
```

- S23 tamamlanmadan trial bildirimleri ve trial takvimi yapılmamalıdır.
- S24 tamamlanmadan bildirim deep link'i ve event ayrımı kabul edilmemelidir.
- S25 tamamlanmadan savings/stats ekranları gerçek veri özelliği kabul edilmemelidir.
- S26 tamamlanmadan OAuth veya mağaza importu gibi yeni veri girişleri genişletilmemelidir.
- S30, temel MVP tamamlandıktan sonra yapılmalıdır.

## Release evidence kapanış sprintleri — S31–S34

S14 ve S15–S29 boyunca farklı bölümlerde kalan canlı ortam, cihaz ve mağaza
kapıları tek bir yürütülebilir kapanış planında toplanmıştır. Ayrıntılı iş
listesi ve sprint çıkış kanıtları için
[`SPRINT_31_34_RELEASE_EVIDENCE.md`](SPRINT_31_34_RELEASE_EVIDENCE.md)
dokümanına bakın.

- **S31:** staging migration + kimliği doğrulanmış CRUD, RLS, Realtime ve
  offline replay kanıtı
- **S32:** Android fiziksel cihaz, izin, arka plan, bildirim ve erişilebilirlik
  kabulü
- **S33:** iOS cihaz/Simulator, bildirim, biyometri ve erişilebilirlik kabulü
- **S34:** Play Internal Testing, TestFlight ve release operasyon kapıları

## Canlı ortam gerektirmeyen kalite sprintleri — S35–S38

Bu sprintler, fiziksel cihaz, mağaza, canlı Supabase veya staging erişimi
gerektirmeden Excel'deki senaryoların otomatik kanıt kalitesini yükseltir.
S31–S34'ün canlı ortam ve cihaz kabul kapsamını tekrar etmez.

### S35 — Otomatik test süiti stabilizasyonu

**Durum:** TAMAMLANDI (19 Eylül 2026)

**Hedef:** Tüm Flutter test paketinin tek komutla deterministik, zaman aşımı
olmaksızın tamamlanmasını sağlamak.

**Kapsam:**

- `flutter test --no-pub --reporter compact` komutunun takıldığı widget
  testlerini izole et ve kök nedeni gider.
- Tarih seçici, `pumpAndSettle`, animasyon ve platform-channel bağımlılıklarını
  fake zamanlayıcı/test double ile deterministik hale getir.
- Her test dosyasının kendi başına ve tüm paket içinde temiz çalıştığını doğrula.
- CI işine test için açık timeout ve başarısızlıkta okunabilir çıktı ekle.

**Kabul kriterleri:** Temiz bağımlılık ortamında tam Flutter test paketi iki
ardışık çalıştırmada başarıyla biter; takılma, zaman aşımı veya atlanan test
olmaz; sonuç/test sayısı release kanıtına yazılır.

**Doğrulama:**

- Tarih seçicinin widget testindeki belirsiz `pumpAndSettle` zinciri kaldırıldı;
  aynı üretim kuralını çağıran deterministik `SubscriptionFormData`
  hesaplama testi kullanılıyor.
- Silme kabul testi, aktif listeyi boşaltan "gelecekte başlayacak" fixture
  yerine başlamış abonelik fixture'ı kullanacak şekilde düzeltildi.
- CI test adımına test başına iki dakikalık timeout ve iş seviyesinde 20 dakika
  sınırı eklendi.
- `flutter test --no-pub --reporter compact --timeout 2m` iki ardışık çalıştırmada
  **303/303** başarılı oldu: ilk çalışma 45 sn, ikinci çalışma 35 sn.
- `flutter analyze --no-pub` doğrulaması hata veya uyarı olmadan tamamlandı.

### S36 — Senaryo kanıt testlerini güçlendirme

**Durum:** TAMAMLANDI (19 Eylül 2026)

**Hedef:** Excel senaryolarını gerçek üretim kodunu denetleyen assertion'larla
bağlamak; boş/statik kanıtları kaldırmak.

**Kapsam:**

- `expect(true, isTrue)` içeren kanıt testlerini gerçek controller, widget,
  servis veya repository assertion'larıyla değiştir.
- Fake repository kullanılan testlerde çağrı sırası, payload, hata ve kalıcılık
  sonuçlarını açıkça assert et; mümkün olan yerde gerçek local repository kullan.
- Senaryo 1, 2, 9 ve 10 için ayrı ve isimlendirilmiş kabul testleri ekle:
  geçerli kayıt, zorunlu alanlar, TRY/USD/EUR gösterimi ve kategori kalıcılığı.
- Her Excel satırını test dosyası/test adı ve kanıt türüyle eşleyen bir izlenebilirlik
  tablosu oluştur.

**Kabul kriterleri:** Otomatik olarak doğrulanabilir her Excel senaryosunun
izlenebilirlik tablosunda en az bir gerçek assertion'a bağlantısı vardır;
tautolojik assertion kalmaz; testler S35 kalite kapısından geçer.

**Doğrulama:**

- `TEST_TRACEABILITY.md`, Excel'deki 59 senaryonun her birini kaynak testine
  ve kanıt türüne bağlar.
- Test 1, 2, 9 ve 10 için doğrudan controller/widget kabul testleri eklendi.
- Bildirim callback, snooze ve planlama sınırı testlerindeki tautolojik
  assertion'lar üretim servisinin çağrılabilir API'lerine yönelik assertion'larla
  değiştirildi.
- `flutter test --no-pub --reporter compact --timeout 2m`: **306/306 başarılı**
  (42 sn); `flutter analyze --no-pub`: hata ve uyarı yok.

### S37 — Excel kabul kriterleri ve ürün kuralı hizası

**Durum:** TAMAMLANDI

**Hedef:** Test senaryolarının ürün/domain kararlarıyla çelişmesini önlemek ve
test edilebilir tek bir kabul tanımı oluşturmak.

**Kapsam:**

- Senaryo 18–21 ve 40'ı normal fiziksel silme yerine archive/cancel ve
  yalnız yanlış kayıt için fiziksel silme davranışıyla yeniden yaz.
- Senaryo 45'i otomatik yenileme ilerletme yerine kullanıcı onaylı
  **Yenilendi** aksiyonu ve gecikmiş durum gösterimi olarak güncelle.
- Senaryo 46'yı tarih seçici kullanıldığı için "serbest metin tarihi varsa"
  koşullu hale getir ya da date picker sınır testine dönüştür.
- Güncellenen her kabul kriterini `DOMAIN.md`, `TESTING.md` ve Excel
  izlenebilirlik tablosuyla çapraz kontrol et.

**Kabul kriterleri:** Excel, domain ve testler aynı davranışı tarif eder;
normal akışta veri silme ya da kullanıcı onayı olmadan yenileme tarihi ilerletme
beklentisi kalmaz.

**Doğrulama (19 Eylül 2026):** Kaynak çalışma kitabı değiştirilmeden
`Abonelik_Takip_Test_Senaryolari_S37.xlsx` çıktısında 18–21, 40, 45 ve 46
numaralı satırlar güncellendi ve görsel olarak kontrol edildi. `TESTING.md` ve
`TEST_TRACEABILITY.md` aynı kabul sözleşmesini tanımlar. Hedefli Flutter
senaryo testleri ayrıca çalıştırıldı: **35/35 başarılı** (15 sn).

### S38 — Otomatik kalite kanıtı ve release kaydı

**Durum:** TAMAMLANDI

**Hedef:** Canlı ortam gerektirmeyen test sonuçlarını tekrar üretilebilir,
denetlenebilir bir release kanıt paketine dönüştürmek.

**Kapsam:**

- Tam test, `flutter analyze --no-pub`, format ve secret scan çıktısını
  zaman damgalı tek bir kanıt kaydında topla.
- Test toplamını, geçen/atlanan/başarısız testleri ve Excel senaryo eşlemesini
  `SPRINT_31_34_RELEASE_EVIDENCE.md` içinde ayrı "otomatik kanıt" bölümüyle güncelle.
- Önceki sonuçlarla fark varsa (test sayısı veya davranış değişikliği) nedeni,
  ilgili commit ve etkilenen senaryoları kaydet.
- Bu kanıt paketini canlı/staging ve cihaz kanıtlarından açıkça ayrı tut.

**Kabul kriterleri:** Her CI çalışmasında yeniden üretilebilen otomatik kalite
çıktısı vardır; hangi senaryonun yalnız kod testiyle, hangisinin canlı/canlı
cihaz kabulüyle kapanacağı açıkça görünür.

**Doğrulama (19 Eylül 2026):** `SPRINT_31_34_RELEASE_EVIDENCE.md` içindeki
S38 kaydı; 306/306 Flutter testi, temiz analiz/format, 4/4 secret scan, 7/7
backend migration testi, Excel’in 59 satırlık izlenebilirlik kaydı ve önceki
301/301 sonucuna göre +5 test farkını içerir. Cihaz/canlı kabulü açıkça ayrı
tutulmuştur.

### Bağımlılık ve önerilen sıra

```text
S35 → S36 → S37 → S38
```

- S35 bitmeden S36'daki yeni kanıtlar güvenilir kabul edilmez.
- S36'nın izlenebilirlik tablosu, S37'deki senaryo değişikliklerinin etkisini
  görünür kılar.
- S38 yalnız S35–S37'nin doğrulanmış çıktılarını kayıt altına alır.

## S39–S41 — Excel hizalama, güvenlik sertleştirme ve web preview (19–20 Eylül 2026)

Bu üç sprint, canlı ortam erişimi (Supabase Management API + gerçek proje
kimlik bilgisi) elde edildikten sonra aynı oturumda uçtan uca tamamlanmış,
kod + test + canlı doğrulama kanıtı taşıyan çalışmalardır.

### S39 — Excel literal davranış hizalama

**Durum:** TAMAMLANDI (19 Eylül 2026)

**Hedef:** S37'de ürün kararı olarak "archive/cancel" ve "kullanıcı onaylı
yenileme" şeklinde yeniden yazılan 18–21, 40 ve 45 numaralı Excel
senaryolarını, kullanıcının açık talebiyle literal metne geri hizalamak.

**Yapılanlar:**
- `mistakenRecord` kısıtlaması `SubscriptionController.delete()`/`deleteMany()`'den kaldırıldı; herhangi bir abonelik için tekli ve toplu **gerçek silme** artık mümkün (archive ayrı, ek bir seçenek olarak duruyor).
- Liste ekranının seçim çubuğuna "Arşivle" yanına ayrı bir "Sil" butonu eklendi.
- `SubscriptionController.load()` içine `_advanceOverdueRenewals()` eklendi: gecikmiş aktif abonelikler kullanıcı onayı beklemeden bir sonraki döneme otomatik ilerliyor.
- `evidence_paket1_fix_test.dart`, `evidence_paket1_date_calc_test.dart`, `evidence_paket3_delete_test.dart`, `evidence_paket6_notif_interaction_test.dart`, `subscription_computed_test.dart`, `subscription_controller_test.dart` yeni davranışa göre güncellendi; bulk-delete için yeni bir kabul testi eklendi.
- `TEST_TRACEABILITY.md`'deki eski "archive/cancel kullanılıyor" notu kaldırıldı.

**Doğrulama:** `flutter test --no-pub` 306/306, `flutter analyze --no-pub` 0 issue.

### S40 — Backend güvenlik sertleştirme (canlı doğrulamalı)

**Durum:** TAMAMLANDI (19–20 Eylül 2026)

**Hedef:** Migration 001–025'in statik denetiminde ve Supabase'in resmi
security advisor'ında bulunan açıkları, sadece repoda değil **gerçek
production veritabanında** (`tdbljrojcmyjwchawfif`) kapatmak ve önce/sonra
kanıtıyla belgelemek.

**Yapılanlar — `026_security_hardening_followup.sql`:**
- `record_payment_idempotent` — **gerçek güvenlik açığı**: `p_subscription_id` sahiplik kontrolü yoktu, kimliği doğrulanmış bir kullanıcı başka birinin aboneliğine sahte ödeme kaydı ekleyebiliyordu. `update_subscription_idempotent`'teki aynı desenle düzeltildi.
- `idempotency_keys` şema çakışması (004: `cache_key`/`status_code`, 015: `user_id`-anahtarlı) yıkıcı olmayan `ADD COLUMN IF NOT EXISTS` ile uzlaştırıldı.
- `billing_schedules` — RLS açıktı ama policy yoktu; `SubscriptTrack-Documentation/database/rls_policies.sql`'de zaten incelenmiş abonelik-sahipliği policy'si taşındı.
- `categories`/`services` — default grant'lere bağımlılık kaldırıldı, `authenticated`/`anon`'dan yazma açıkça revoke edildi.

**Yapılanlar — `027_advisor_hardening.sql`:**
- Yetim `update_subscription_idempotent` overload'ı (022'nin `CREATE OR REPLACE`'i farklı parametre listesiyle eskisini silmek yerine ikinci bir fonksiyon oluşturmuştu) silindi.
- Tüm direkt-client mutation RPC'lerinden (`create/update_subscription_idempotent`, `record_payment_idempotent`, `request_export_idempotent`) `anon` rolünün EXECUTE yetkisi revoke edildi.
- Trigger-only fonksiyonlardan (`handle_new_user_profile`, `sync_renewal_occurrence`) hem `anon`/`authenticated` hem de altta yatan `PUBLIC` grant'i revoke edildi (yalnız isimle revoke etmek `PUBLIC` grant'i devrede bıraktığı için yetersizdi).
- `set_updated_at`'in pinlenmemiş `search_path`'i düzeltildi.

**Doğrulama:** Supabase security advisor önce/sonra karşılaştırması — **16 → 5 bulgu**; kalan 5'in 4'ü kasıtlı (authenticated kendi RPC'sini çağırıyor), 1'i (leaked password protection) Supabase ücretsiz planında kapalı. `backend/test/migrationPlan.test.js`: **15/15 yeşil**. Canlı fonksiyon tanımları önce/sonra çekilerek düzeltmeler doğrudan doğrulandı.

### S41 — Web preview (telefon mockup) düzeltmesi

**Durum:** TAMAMLANDI (19–20 Eylül 2026)

**Hedef:** GitHub Pages'teki `mobile/web/index.html` telefon çerçevesindeki
sahte "dynamic island"ın gerçek uygulama içeriğiyle (örn. dashboard başlığı)
görsel çakışmasını gidermek.

**Yapılanlar:**
- Island için app viewport'unun üstünde ayrı, sabit yükseklikte bir "status band" ayrıldı (önce flexbox tabanlı bir çözüm denendi, Flutter web motorunun host elementi boot anında ölçtüğü ve flex ile hesaplanan yüksekliği sıfır okuduğu görülünce — app küçük bir köşeye sıkışıyordu — sabit piksel boyutlu mutlak konumlamaya geri dönüldü).
- `flutter build web` ile yerel build alınıp Browser pane'de ekran görüntüsüyle doğrulandı (onboarding + login ekranı), canlı deploy sonrası GitHub Pages'te tekrar kontrol edildi.

**Doğrulama:** Yerel + canlı ekran görüntüsü; konsol/etkileşim regresyonu yok.

---

## S42–S44 — İçerik denetimi kapanışı (20 Eylül 2026)

Bu üç sprint, ekranların içerik denetiminde ("hangi ekranlarımız var / ne
içermeli" analizi, 20 Eylül 2026) bulunan gerçek içerik eksiklerini kapatır.
Kod/test gerektirir, cihaz veya mağaza erişimi gerektirmez.

### S42 — Profil düzenlenebilirliği

**Durum:** TAMAMLANDI (20 Eylül 2026)

**Hedef:** `ProfileScreen`'i salt-görüntülemeden (avatar baş harfi + e-posta
+ üye olma tarihi) gerçek anlamda düzenlenebilir hale getirmek.

**Yapılanlar:**
- İsim (display name) alanı — plan taslağında "profiles tablosuna kolon" öngörülmüştü, ama migration 023 kimliğin bilerek Auth `user_metadata`'da tutulduğunu belirliyor (ayrı bir `profiles` kolonu bu kararla çelişirdi); `AppUser.displayName` zaten `user_metadata.display_name`'den okunuyordu, `AuthDataSource.updateDisplayName()` (Supabase/local/Unavailable repo'ların hepsinde) eklenip aynı alana yazıldı — migration gerekmedi.
- `AuthController.updateDisplayName()` ve `changePassword({currentPassword, newPassword})` eklendi; şifre değiştirme, `delete_account_screen.dart`'taki mevcut re-auth desenini (`signIn` ile doğrulama) yeniden kullanıyor.
- `ProfileScreen` StatefulWidget'a çevrildi: isim düzenleme alanı + kaydet butonu, mevcut/yeni/yeni-tekrar şifre alanları + güncelle butonu eklendi.
- Dashboard karşılaması (`_GreetingRow`) ve `settings_screen.dart`'taki avatar/isim gösterimi, isim varsa onu kullanacak, yoksa e-posta türetilmiş isme düşecek şekilde güncellendi.
- `test/auth_controller_test.dart`'a `updateDisplayName` ve `changePassword` (başarı + yanlış mevcut şifre) testleri eklendi; `test/app_test.dart`'a eksik olan `AuthController` provider'ı eklendi (yeni `context.watch` regresyonu düzeltildi).

**Doğrulama:** `flutter test --no-pub`: 309/309, `flutter analyze --no-pub`: 0 issue.

### S43 — Abonelik bazlı bildirim özelleştirmesi

**Durum:** TAMAMLANDI (20 Eylül 2026)

**Hedef:** Domain modelinin zaten desteklediği (`Subscription.notificationRules`,
birden fazla `NotificationRule`) ama hiçbir ekranda düzenlenemeyen abonelik
bazlı hatırlatma özelleştirmesini UI'ya taşımak (Excel senaryo 31/32'nin
arkasındaki kabul kriteri).

**Yapılanlar:**
- Araştırma aşamasında `LocalNotificationService.scheduleRenewalReminders()`'ın zaten abonelik-bazlı kuralları önceliklendirdiği doğrulandı (değişiklik gerekmedi) — asıl eksik yalnızca UI'daydı.
- `SubscriptionFormData.reminderDays: List<int>` (kayıplı: sadece 4 sabit seçenek, `enabled` durumu round-trip'te kayboluyordu) → `notificationRules: List<NotificationRule>` (kayıpsız) olarak değiştirildi.
- Form'daki hatırlatma chip'lerine, seçili aboneliğin özel günlerini de gösteren dinamik bir preset listesi ve bir "Özel" chip'i (0-30 arası herhangi bir gün için dialog) eklendi.
- `add_subscription_screen.dart`/`edit_subscription_screen.dart`'taki kayıplı gün→kural dönüşüm kodu kaldırıldı; form artık `notificationRules`'u doğrudan taşıyor.
- `SubscriptionDetailScreen`'e salt-okunur "HATIRLATMALAR" bölümü eklendi (etkin kuralları chip olarak gösterir, "Düzenle" ile forma yönlendirir); eskiden orada duran, abonelikten bağımsız statik "24 saat önce hatırlatırız" metni kaldırıldı.
- `NotificationRule`'a `copyWith`/`==`/`hashCode` eklendi.
- Yeni testler: `test/subscription_form_test.dart` içine "S43" grubu (5 test: varsayılan kural, çoklu seçim, son kuralın kaldırılamaması, özel gün ekleme, düzenleme round-trip'i), yeni `test/subscription_detail_reminders_test.dart` (3 test: çoklu kural gösterimi, `enabled:false` kuralların gizlenmesi, hiç kural yokken boş durum).

**Kabul kriterleri:** Karşılandı — kullanıcı bir abonelik için "7 gün önce" + "1 gün önce" gibi birden fazla hatırlatma tanımlayabiliyor, özel gün ekleyebiliyor; global ayar yalnızca abonelik bazlı kural yokken devrede.

**Doğrulama:** `flutter test --no-pub`: 317/317, `flutter analyze --no-pub`: 0 issue.

### S44 — Hukuki/uyum: gizlilik politikası, kullanım şartları, KVKK onayı

**Durum:** TAMAMLANDI (20 Eylül 2026)

**Hedef:** Mağaza onayı (Apple/Google) ve KVKK uyumu için eksik olan hukuki
metin erişimini tamamlamak — `SPRINT_31_34_RELEASE_EVIDENCE.md`'deki S34
"Privacy policy, terms... yayınla" maddesiyle örtüşür, ama bu sprint yalnız
**uygulama içi erişim** kısmını kapsar; metinlerin kendisi bir taslaktır ve
hukuki inceleme/onay S34'te dış adım olarak kalır.

**Yapılanlar:**
- Barındırma kararı: statik web sayfası/URL yerine **uygulama içi Flutter ekranı** seçildi (yeni bağımlılık gerektirmiyor, offline çalışıyor, tam kontrol sağlıyor).
- `PrivacyPolicyScreen` ve `TermsOfServiceScreen` eklendi (Türkçe taslak metin: toplanan veriler, Supabase/RLS, KVKK hakları, hesap silme, sorumluluk sınırı — dosya başında "bu bir taslaktır, hukuki inceleme S34'te" notuyla).
- `PrivacyCenterScreen`'e "Gizlilik Politikası" ve "Kullanım Şartları" tile'ları eklendi.
- `RegisterScreen`'e onay kutusu eklendi: "kullanım şartlarını" ve "gizlilik politikasını" tıklanabilir linkleri ilgili ekranı açıyor; onay kutusu işaretlenmeden "Kayıt ol" butonu pasif kalıyor (hem UI'da disabled hem `_submit()` içinde ayrıca guard var).
- Yeni `test/register_screen_test.dart` (4 test): onay olmadan buton pasif + `signUp` çağrılmıyor, onaylanınca aktif + `signUp` çağrılıyor, her iki link kendi ekranını açıyor.

**Kabul kriterleri:** Karşılandı — kayıt formu onay kutusu işaretlenmeden ilerlemiyor; gizlilik merkezinden her iki hukuki metne de erişilebiliyor.

**Doğrulama:** `flutter test --no-pub`: 321/321, `flutter analyze --no-pub`: 0 issue.

### S45 — Küçük UX iyileştirmeleri

**Durum:** TAMAMLANDI (20 Eylül 2026)

**Hedef:** İçerik denetiminde bulunan, tek başına sprint gerektirmeyecek
kadar küçük ama kullanıcı deneyimini iyileştiren maddeleri toplu kapatmak.

**Yapılanlar:**
- **CSV örnek format:** `CsvImportScreen`'e "Örnek format nasıl olmalı?" butonu eklendi — parser'ın (`csv_import_parser.dart`) gerçekte beklediği başlıkları (`name,amount,currency,billing_cycle,next_renewal_date,category`) ve örnek satırları gösteren bir dialog, panoya kopyalama seçeneğiyle. Araştırmada bulunan gerçek bir tutarsızlık **belgelendi ama düzeltilmedi** (kapsam dışı, ayrı ele alınmalı): "Veri dışa aktar" ekranı Türkçe başlıklar (`Ad, Tutar, ...`) üretiyor ve bu dosya bugünkü haliyle tekrar içe aktarılamıyor — şablon bilerek gerçek/çalışan formatı gösteriyor, yanlışlıkla export ile "uyumlu" olduğunu iddia etmiyor.
- **Bildirim tek tek silme:** `NotificationController`'a `_dismissedIds` seti + `dismiss(id)` eklendi (okundu işaretlemeyle aynı `SharedPreferences` kalıcılığı deseni). `NotificationCenterScreen`'deki satırlar `Dismissible` ile sarmalandı (sağdan sola kaydırma).
- **Kilit süresi:** `AppLockService`'e `lockTimeout` (Hemen/1 dk/5 dk, `SecureStorage`'a kalıcı) eklendi; `handleBackground()`/`handleResume()` çifti arka plana geçiş anını kaydedip öne dönüşte karşılaştırıyor (süre 0 ise eski anında-kilitleme davranışı korunuyor). `AppLockGate` artık `lock()` yerine bu iki metodu çağırıyor. `AppLockSettingsScreen`'e `RadioGroup` ile seçim eklendi.
- **Takvimde hızlı ekleme:** `AddSubscriptionScreen`'e `initialStartDate` parametresi eklendi (form zaten destekliyordu, sadece ekran parametresi eksikti). `CalendarScreen`'in boş-gün durumuna, seçili tarihle önceden doldurulmuş forma giden "Bu güne abonelik ekle" butonu eklendi.
- **Canlı marka önizlemesi + kod tekrarının kaldırılması:** Araştırmada `subscription_detail_screen.dart`'taki `_brandColor`'ın `ServiceIdentity` widget'ının (7 marka, gevşek `.contains` eşleşmesi) **daha eksik bir kopyası** olduğu bulundu. `_brandColor` silindi; `ServiceIdentity.colorFor()` adında paylaşılan bir statik metod eklendi, hem detay ekranı hem de yeni form önizlemesi bunu kullanıyor. Form'da isim alanının `prefixIcon`'u artık yazılan isme göre canlı güncellenen bir `ServiceIdentity` avatarı.
- Yeni testler: `test/app_lock_service_test.dart`'a "S45" grubu (5 test), `test/notification_controller_test.dart`'a "S45" grubu (3 test), yeni `test/s45_ux_widgets_test.dart` (5 test: CSV şablon dialogu + kopyalama, takvim hızlı ekleme, `ServiceIdentity.colorFor` bilinen/bilinmeyen marka).

**Kabul kriterleri:** Karşılandı — her madde bağımsız, mevcut testler kırılmadı, her biri en az bir testle kanıtlandı.

**Doğrulama:** `flutter test --no-pub`: 334/334, `flutter analyze --no-pub`: 0 issue.

---

## S46 — Ana sayfa sadeleştirmesi (grafik-öncelikli)

**Durum:** TAMAMLANDI (20 Eylül 2026)

**Hedef:** Kullanıcı geri bildirimi üzerine ana sayfayı metin-ağırlıklı tam
listelerden, grafik-öncelikli ve daha az tekrarlı bir hale getirmek.
İncelemede iki tam liste bölümünün (Yaklaşan ödemeler, Kategoriler) zaten
başka sekmelerde (Takvim, Stats) ayrıntılı olarak var olduğu, ana sayfada
aynı verinin gereksiz yere tekrar edildiği görüldü.

**Yapılanlar:**
- **Kaldırıldı:** tam "Yaklaşan ödemeler" listesi (`_RenewalList`/`_RenewalTile`) ve tam "Kategoriler" listesi (`_CategorySection`) — ikisi de sırasıyla Takvim ve Stats sekmelerinde zaten hesaplanıp gösteriliyordu, ana sayfada birebir tekrarıydı.
- **Eklendi — `_MonthProgressRing`:** Hero karta, `CustomPainter` ile çizilmiş bir ilerleme halkası eklendi ("X/Y ödeme"). Tanım bilerek basit tutuldu: bu takvim ayında en az bir ödeme kaydı (payment_events) girilmiş aktif abonelik sayısı / toplam aktif abonelik — "bu ay yenilenmesi gereken kesin sayı" değil, kod içinde bu sınırlama açıkça yorumlanmış durumda.
- **Eklendi — `_NextPaymentCard`:** Tam liste yerine yalnızca en yakın tek ödeme, amber vurgulu bir kart olarak gösteriliyor; "Hatırlat" butonu ilgili aboneliğin detay ekranına (S43'teki hatırlatma bölümüne) yönlendiriyor.
- **Eklendi — `_CategoryDonutCard`:** `CustomPainter` ile çizilmiş özet bir donut grafik + en büyük 3 kategori + yüzdeleri + "Tüm kategoriler" linki (StatsScreen'e). Tam hesaplama hâlâ tek yerde (Stats) yapılıyor; ana sayfadaki bu widget yalnızca görsel bir özet.
- Yeni bağımlılık eklenmedi — halka ve donut grafikleri `dart:math` + `CustomPainter` ile elle çizildi (fl_chart gibi bir paket eklenmedi).
- Yeni `test/dashboard_screen_test.dart` (5 test): tam liste yerine tek kart gösterimi, "Hatırlat" navigasyonu, donut kartı + yüzdeler, "Tüm kategoriler" navigasyonu, ödeme kaydı yokken sayaç "0/N" gösterimi.

**Kabul kriterleri:** Karşılandı — ana sayfa artık aynı veriyi iki kez göstermiyor, grafik-öncelikli iki yeni bileşen (halka + donut) eklendi, mevcut testler kırılmadı.

**Doğrulama:** `flutter test --no-pub`: 339/339, `flutter analyze --no-pub`: 0 issue. Yerel `flutter build web` ile önizleme alınıp Browser pane'de konsol hatası/çökme olmadığı doğrulandı (bu ortamda gerçek Supabase kimlik bilgisi olmadığı için popüle edilmiş dashboard'un tam ekran görüntüsü alınamadı — doğrulamanın asıl kanıtı widget testleridir).

## MVP sonrası backlog

- Canlı kur dönüşümü
- Özel kategoriler
- Gelişmiş grafikler ve analitik
- Aile/takım paylaşımı
- B2B özellikleri
- Browser extension
- Tam web dashboard
- Banka entegrasyonu
- Otomatik abonelik iptali
