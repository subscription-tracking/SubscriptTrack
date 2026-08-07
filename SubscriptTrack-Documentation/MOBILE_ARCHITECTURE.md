# Mobil Uygulama Mimarisi

Son güncelleme: 2 Ağustos 2026 (S0–S13 tamamlandı)

---

## 1. Teknoloji kararları

- **Flutter 3.44.8 / Dart 3.12.2** — iOS + Android tek kod tabanı (ADR-0008)
- **State yönetimi:** `Provider` + `ChangeNotifier` — go_router redirect guard ile entegre
- **Navigation:** `go_router ^14` — declarative, deep link, redirect guard
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
│   │                    offline_mutation_queue.dart        — SharedPreferences kuyruk
│   │                    device_token_service.dart          — push token (kullanılmıyor)
│   │                    notification_read_sync_service.dart — POST /v1/notifications/read-batch
│   ├── storage/         local_storage.dart        — abonelik JSON cache (SharedPreferences)
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
    ├── stats/           StatsScreen — per-currency category breakdown, RefreshIndicator
    ├── savings/         SavingsScreen — multi-currency top-3 scenario kartlar
    ├── onboarding/      OnboardingScreen — 4 sayfa, ilk açılışta
    └── settings/        SettingsController — theme, currency, timezone, daysBefore, notifications, paymentMethods
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
  Başarısız → head yerinde kalır; sonraki mutation çalıştırılmaz (FIFO korunur)
```

---

## 7. Bildirim mimarisi (S6 + S11)

- **Yerel push:** `flutter_local_notifications` — `scheduleRenewalReminders()` N gün önce 09:00
- **Duplicate guard:** `Object.hashAll(subs + daysBefore + timezone)` — hash değişmezse schedule atlanır
- **Settings listener:** `daysBefore` veya `timezone` değişince otomatik yeniden zamanlama
- **Push yöntemi:** Yalnızca `flutter_local_notifications` ile cihaz üzeri zamanlama. Uzak push altyapısı kullanılmaz.
- **Read sync:** `NotificationReadSyncService` → `POST /v1/notifications/read-batch` (best-effort)

---

## 8. Güvenlik

- Tüm credential'lar `--dart-define` ile inject edilir; kaynak kodda yoktur
- RLS: `auth.uid() = user_id` her tablo için
- `ApiClient`: Bearer token her istekte, X-Request-ID UUID trace
- `OfflineMutationQueue`: payload'da yalnızca ID ve status; kullanıcı verisi queue'ya yazılmaz
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

Toplam: **189 test**, hepsi yeşil (`flutter test --no-pub`)

---

## 10. Build ortamları

```
Development  — dart-define ile yerel/staging backend
Staging      — CI tarafından enjekte, TestFlight/Internal Test
Production   — Play Store / App Store release
```

Detay: `DEPLOYMENT.md`
