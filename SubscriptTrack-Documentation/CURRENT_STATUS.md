# Güncel proje durumu

Son güncelleme: 2 Ağustos 2026 (S0–S19 tamamlandı · tam kod taraması yapıldı · S20–S22 planlandı)

---

## Ortam

- Flutter stable 3.44.8 / Dart 3.12.2
- Supabase credentials `--dart-define` ile inject ediliyor; kaynak kodda secret yok
- Android debug APK başarıyla üretilebiliyor
- `flutter analyze --no-pub`: hata yok, 2 önceden mevcut info (Radio deprecation)
- `flutter test --no-pub`: 194/194 test başarılı (S20–S22 sonrası +5 test güncellendi)

---

## Sprint durumu

| Sprint | Başlık | Durum |
|--------|--------|-------|
| S0 | Proje temeli | TAMAMLANDI |
| S0.5 | Mimari zemin | TAMAMLANDI |
| S1 | Auth ve onboarding | TAMAMLANDI |
| S2 | Ortak UI ve abonelik ekleme | TAMAMLANDI |
| S3 | Abonelik yaşam döngüsü | TAMAMLANDI |
| S4 | Dashboard ve finansal hesaplamalar | TAMAMLANDI |
| S5 | Takvim ve in-app bildirimler | TAMAMLANDI |
| S6 | Push bildirimleri | TAMAMLANDI (yerel; FCM S11'e) |
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

---

## Prod Readiness Düzeltmeleri (S13 sonrası · 1–2 Ağustos 2026)

58 ajan prod çıkış incelemesi + uçtan uca manuel doğrulama + S20–S22 tam fix sonucu.
Kod kalite puanı: **80/100** (S20–S22 öncesi 72, 13 bulgu kapatıldıktan sonra güncellendi).

| Kategori | Ağırlık | Puan | Katkı |
|---|---|---|---|
| Mimari | %25 | 85 | 21.25 |
| Güvenlik | %20 | 74 | 14.80 |
| Android/Build | %20 | 82 | 16.40 |
| Kod | %15 | 82 | 12.30 |
| Veri | %10 | 80 | 8.00 |
| UX | %10 | 76 | 7.60 |
| **Toplam** | | | **80.35 → 80** |

Kalan açıklar (100'e ulaşmak için): FCM push end-to-end çalışması, durable job queue (GDPR/export), iOS test, mağaza gönderimi, entegrasyon testleri.

### Kapatılan kritikler (S13 sonrası fix)

| # | Dosya | Sorun | Düzeltme |
|---|-------|-------|----------|
| 1 | `auth_controller.dart:96` | `Future.wait` Supabase stream'inin zaten set ettiği state'i race condition ile ezip yanlış auth durumuna düşürüyordu | `if (!_initialized)` guard eklendi |
| 2 | `authenticated_shell.dart:30` | `auth.user!.id` force-unwrap oturum geçiş anında null crash üretiyordu | `auth.user` null guard + `addPostFrameCallback(signOut)`, nullable fields |

### Zaten fix'li olan (önceden "açık" zannedilen) bulgular

| Dosya | Durum |
|-------|-------|
| `offline_mutation_queue.dart` | `_synchronized()` via `_tail` promise chain → atomik |
| `subscription_controller.dart:delete()` | `on NetworkException` + generic catch zaten vardı |
| `subscription_list_screen.dart:itemBuilder` | `addPostFrameCallback` ile defer edilmiş |
| `subscription_models.dart:202,206,198` | `DateTime.tryParse(...) ?? DateTime.now()` ve `?? 'monthly'` fallback'ler mevcut |
| `notification_controller.dart:46` | `await _saveReadState()` zaten var (markRead ve markAllRead'de) |

### Bonus düzeltme

- `date_time_utils.dart:formatDate` — calendar-day bazlı karşılaştırmaya geçildi (189 test geçiyor)

### Açık bulgular — tam tarama sonucu (2 Ağustos 2026) — Durum: 5 Ağustos 2026

37 mobil Dart dosyası tarandı. Tüm mobil bulgular kapatıldı. Backend kaldırıldı (Supabase-only stack).

#### Mobil — Kapatılan bulgular (5 Ağustos 2026 doğrulaması)

| Durum | Dosya | Notlar |
|-------|-------|--------|
| ✅ KAPANDI | `supabase_subscription_repository.dart:150,154,158` | `as String? ?? 'monthly'`, `?? ''` null guard'ları mevcut |
| ✅ KAPANDI | `auth_repository.dart` | Email-salt SHA-256 uygulanmış; local-only mod, production'ı etkilemez |
| ✅ KAPANDI | `export_data_screen.dart` | `const eol = '\r\n'` + `.map(_csvField)` header'da quote uygulanıyor |
| ✅ KAPANDI | `settings_controller.dart:30` | `.clamp(0, ThemeMode.values.length - 1)` eklendi |
| ✅ KAPANDI | `settings_screen.dart (ProfileTab)` | `if (user == null) return const SizedBox.shrink()` guard mevcut |
| ✅ KAPANDI | `auth_models.dart` | `DateTime.tryParse` kullanılıyor |

#### Kalan açık (düşük öncelik)

| Dosya | Sorun |
|-------|-------|
| `subscription_controller.dart:347` | `ValidationException` mesajı hardcode Türkçe — i18n sonrası ilgili |
| `app_environment.dart` | `current = AppEnvironment.development` — release build için `--dart-define=APP_ENV=production` gerekiyor |

---

## Tamamlanan işler

### Auth (S1)
- E-posta + şifre kayıt, giriş, çıkış
- Supabase `SupabaseAuthRepository` entegre, `isSupabaseConfigured = true`
- Şifre sıfırlama e-postası (`ForgotPasswordScreen`)
- Deep link: `subscripttrack://auth-callback` (AndroidManifest'te tanımlı)
- `ResetPasswordScreen` — deep link sonrası yeni şifre belirleme
- `AuthController.passwordRecoveryMode` — go_router redirect guard ile bağlı
- `AuthController.updatePassword()` — Supabase `updateUser` çağırıyor
- Onboarding: 4 sayfa (3 tanıtım + para birimi seçimi), ilk açılışta gösteriliyor

### Abonelik CRUD (S2, S3 — kısmi)
- `SubscriptionStatus` enum: `active`, `paused`, `cancelled`, `archived`
- `start_date` alanı tüm katmanlarda mevcut (model, form, supabase repo, local repo)
- `SupabaseSubscriptionRepository` — PostgREST ile tam CRUD
- `SubscriptionRepository` — local in-memory fallback
- `SubscriptionController`: pause, resume, cancel, archive, restore, edit, delete
- Abonelik formu: ad, tutar, para birimi, döngü, kategori, başlangıç tarihi, yenileme tarihi, notlar

### Dashboard (S4 — kısmi)
- `totalsByCurrency` — farklı para birimleri ayrı satırlarda gösteriliyor, toplam yapılmıyor
- Paused / cancelled abonelik sayısı metrik kartları
- Yaklaşan yenilemeler listesi (30 gün içinde)

### Liste (S2–S3 — kısmi)
- `SubscriptionListScreen` — Aktif / Durakladı / İptal sekmeleri (`TabController`)
- Arama, kategori filtresi, sıralama (tarih / tutar / ad)
- Abonelik detay: durum bazlı popup menu (pause, resume, cancel, archive, delete)
- Başta geçerli ayda toplam tutarlar

### Takvim (S5 — kısmi)
- Aylık takvim — yenileme tarihleri işaretlendiğinde gösteriliyor
- `totalsByCurrencyForMonth()` — her para birimi için aylık toplam
- Aylık başlık bölgesi çok para birimini ayrı satırlarda gösteriyor

### In-app bildirimler (S5 — kısmi)
- `NotificationController.refresh()` — aktif aboneliklerden bildirim üretir
  - 0 gün: bugün yenileniyor
  - 1–3 gün: yaklaşan yenileme
  - 4–7 gün: gelecek yenileme
- `NotificationCenterScreen` — liste, renk kodlu ikonlar, okundu işaretleme
- `TopBar` — unread badge, bell ikonu ile açılır
- `AuthenticatedShell` — abonelikler değiştiğinde bildirimler otomatik yenilenir

### Yerel push bildirimleri (S6 — kısmi)
- `flutter_local_notifications ^18.0.0` + `timezone ^0.9.4` kurulu
- `LocalNotificationService` — Android + iOS kanallar, izin isteme, zamanlanmış bildirim
- `scheduleRenewalReminders()` — aktif abonelikler için N gün önce 09:00'da bildirim
- Saat dilimi desteği: `SettingsController.timezone` boşsa cihaz yerel saati kullanılır
- Android: `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `RECEIVE_BOOT_COMPLETED` izinleri
- `NotificationPreferencesScreen` — açma/kapama, kaç gün önce (1/3/7), test bildirimi

### Offline altyapı ve bildirim güçlendirme (S11)
- `OfflineMutationQueue` — SharedPreferences'a kalıcı kuyruk; enqueue/drain/clear + FIFO + JSON round-trip
- `DeviceTokenService` abstract + `PlaceholderDeviceTokenService` — FCM entegre edilene kadar no-op
- `NotificationReadSyncService` — okundu durumu `POST /v1/notifications/read-batch` ile backend'e best-effort sync
- `NotificationController.markRead/markAllRead` — hem local SharedPreferences'a hem backend'e yazıyor
- `SubscriptionController` — `_lastSyncAt`, `_replayOfflineQueue`, `_applyMutation`, `_updateLocalStatus`; `NetworkException` → mutation kuyruğuna
- Settings değişiklik dinleyicisi — `daysBefore` veya `timezone` değişince bildirimler otomatik yeniden zamanlanıyor
- Duplicate schedule guard — içerik hash (`Object.hashAll`) eşleşince `scheduleRenewalReminders` erken çıkıyor
- `_OfflineBanner` widget — Dashboard ve liste ekranında; göreceli sync zamanı ("X sn/dk/sa önce")
- `test/offline_mutation_queue_test.dart` — 9 yeni test; toplam 144

### Ayarlar (S7)
- `AppearanceScreen`: tema (sistem/aydınlık/karanlık), para birimi, saat dilimi seçici (13 saat dilimi)
- `SettingsController`: currency, themeMode, notificationsEnabled, daysBefore, timezone — hepsi SharedPreferences'a yazılıyor
- `ExportDataScreen`: CSV oluşturma, dosya olarak paylaşma (`share_plus`) veya panoya kopyalama — Durum sütunu mevcut, duraklatılan/iptal edilenler dahil
- `DeleteAccountScreen`: şifre doğrulama (re-auth) sonrası hesap silme
- `NotificationPreferencesScreen`: bildirim tercihleri

---

## Mimari

Detay: `MOBILE_ARCHITECTURE.md`

```
lib/
  app/
    router/         app_router.dart (go_router, redirect guard)
    shell/          authenticated_shell.dart, top_bar.dart, app_shell.dart
    theme/          app_theme.dart
  core/
    config/         app_environment.dart (SUPABASE_URL/KEY/API_BASE_URL — dart-define)
    datasources/    auth_data_source.dart, subscription_data_source.dart (soyut)
    domain/         money.dart (Money value class, integer minor units)
    errors/         app_exception.dart (NetworkException, AuthException, ValidationException)
    network/        api_client.dart (Bearer, X-Request-ID, Idempotency-Key, retry)
                    token_provider.dart (abstract + SupabaseTokenProvider)
    services/       local_notification_service.dart (flutter_local_notifications, hash guard)
                    offline_mutation_queue.dart (SharedPreferences kuyruk)
                    device_token_service.dart (FCM placeholder)
                    notification_read_sync_service.dart (POST /v1/notifications/read-batch)
    storage/        local_storage.dart, secure_storage.dart
    utils/          date_time_utils.dart
  features/
    auth/           AuthController, SupabaseAuthRepository, AuthRepository
    subscriptions/  SubscriptionController (offline queue, pagination, 401 redirect)
                    ApiSubscriptionRepository, SupabaseSubscriptionRepository, SubscriptionRepository
    dashboard/      DashboardScreen (_OfflineBanner, totalsByCurrency)
    calendar/       CalendarController, CalendarScreen
    notifications/  NotificationController (read sync), NotificationCenterScreen
    settings/       SettingsController, AppearanceScreen, NotificationPreferencesScreen
                    ExportDataScreen (CSV), DeleteAccountScreen
    onboarding/     OnboardingScreen (4 sayfa)
    stats/          StatsScreen (per-currency, RefreshIndicator)
    savings/        SavingsScreen (multi-currency)
```

---

## Bağımlılıklar (pubspec.yaml — önemli paketler)

- `supabase_flutter: ^2.0.0`
- `go_router: ^14.0.0`
- `provider: ^6.1.2`
- `flutter_local_notifications: ^18.0.0`
- `timezone: ^0.9.4`
- `share_plus: ^10.0.0`
- `path_provider: ^2.1.4`
- `shared_preferences`

---

## Supabase yapılacaklar

Henüz çalıştırılmadıysa bu SQL'i dashboard'da çalıştır:

```sql
alter table public.subscriptions
  add column if not exists status text not null default 'active';
```

Authentication > URL Configuration > Redirect URLs'e ekle:
```
subscripttrack://auth-callback
```

---

## Aktif sprint: S5

### Tamamlanan S2/S3/S4 (31 Temmuz 2026)

**S2 — Money/decimal model:**
- [x] `lib/core/domain/money.dart` oluşturuldu — tamsayı minor unit aritmetiği
- [x] `Subscription.amount`: `double` → `Money` (tüm katmanlar güncellendi)
- [x] `monthlyAmount` getter: `double` → `Money`
- [x] `totalsByCurrency`, `totalMonthly`: `Money` toplama ile tamsayı aritmetiği
- [x] `SupabaseSubscriptionRepository`, `SubscriptionRepository`, `SubscriptionDataSource`: Money geçişi
- [x] `AddSubscriptionScreen`, `EditSubscriptionScreen`: `Money.parse()` kullanıyor
- [x] 15 ekran/servis dosyası `amount.amount` ile güncellendi
- [x] `test/money_test.dart`: 16 Money unit testi (parse, fromJson, aritmetik, billing cycle)

**S2 — Form validasyon:**
- [x] Yenileme tarihi seçici artık başlangıç tarihinden önceki tarihleri engelliyor

**S3 — Hata gösterimi:**
- [x] `SubscriptionListScreen`: hata durumunda `MaterialBanner` gösteriyor
- [x] `DashboardScreen`: hata durumunda `MaterialBanner` + "Tekrar dene" butonu

**S4 — Dashboard error state:**
- [x] Dashboard error state tamamlandı (MaterialBanner)
- [x] `CalendarController.totalsByCurrencyForMonth`: Money toplama

**S5 — Bildirim duplicate fix:**
- [x] `NotificationController`: ID artık yenileme tarihine sabitlendi (`sub.id_YYYYMMDD`)
  — `days` değişse bile aynı bildirimin ID'si değişmiyor; eski okundu işaretleri geçerli kalıyor

**S5 — Takvim timezone fix:**
- [x] `CalendarController`: `nextRenewalDate.toLocal()` ile UTC→yerel dönüşüm eklendi

### S2 kapandı ✅
- Money/decimal model, form validasyon widget testleri, JSON round-trip testleri, Android smoke build
- Backend REST contract → S8'e ertelendi (Supabase direct çalışıyor)

### S3 kapandı ✅
- Offline cache + banner, state transition unit testleri, archived ayrımı

### S4 kapandı ✅
- Money ile floating point'siz toplam/hesaplama, dashboard boş+hata+offline state, pull-to-refresh, birim testleri
- Dashboard API contract → S8'e ertelendi

### S5 kapandı ✅
- Read state persist (SharedPreferences), in-memory pruning, CalendarController testleri, NotificationController testleri, timezone/ay sınırı coverage
- Calendar API + okuma backend kalıcılığı → S8/S9'a ertelendi

### S6 kapandı ✅
- Notification ID collision fix (composite key), `cancelAll()` ile duplicate schedule engeli
- FCM/APNs device token, backend push worker → S11'e ertelendi

---

## Kritik teknik borçlar

| Borç | Hedef sprint |
|------|-------------|
| ~~Mobil `double` para modeli → Money/decimal~~ | ✅ S2'de tamamlandı |
| ~~Direct Supabase → REST API standardizasyonu~~ | ✅ S8'de tamamlandı |
| ~~RLS user-owned policy kapsamı doğrulama~~ | ✅ S8'de tamamlandı |
| ~~Backend ve API contract testleri yok~~ | ✅ S12'de tamamlandı |
| ~~FCM/APNs device token + backend push worker~~ | ✅ S11'de altyapı kuruldu (FCM S14'e) |
| ~~AuthController race condition (Future.wait stream'i eziyor)~~ | ✅ 1 Ağustos 2026 kapatıldı |
| ~~authenticated_shell.dart user! force-unwrap~~ | ✅ 1 Ağustos 2026 kapatıldı |
| Mobil null safety + güvenlik (7 madde) | → **S20** |
| Backend idempotency DB-backed + calendar job | → **S21** |
| Backend exports/GDPR/CSV/CUSTOM cycle (5 madde) | → **S22** |

---

## Sprint kapatma kaydı

- S0: TAMAMLANDI
- S0.5: TAMAMLANDI
- S1: TAMAMLANDI — `flutter test --no-pub` başarılı, hata yok
- S2: TAMAMLANDI
- S3: TAMAMLANDI
- S4: TAMAMLANDI
- S5: TAMAMLANDI
- S6: TAMAMLANDI (yerel push; FCM/APNs S11'e ertelendi)
- S7: TAMAMLANDI (S2–S6 öncesinde tamamlandı; bağımlılık gerektirmeyen ayarlar/export/hesap silme kapsamı)
- Sonraki sprintlere geçiş: mevcut sprintin kabul kriterleri ve testleri geçmeden yapılmayacak
