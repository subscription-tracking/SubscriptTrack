# Guncel proje durumu

Son guncelleme: 31 Temmuz 2026

---

## Ortam

- Flutter stable 3.44.8 / Dart 3.12.2
- Supabase credentials are injected with `--dart-define`; no secret is committed.
- Android debug APK basariyla uretilebiliyor
- `flutter analyze` basarili

---

## Sprint durumu

| Sprint | Baslik | Durum |
|--------|--------|-------|
| S0 | Proje temeli (Flutter, ortam, CI) | TAMAMLANDI |
| S0.5 | Mimari zemin (go_router, provider, soyut DI) | TAMAMLANDI |
| S1 | Auth ve onboarding | TAMAMLANDI |
| S2 | Ortak UI + abonelik ekleme | TAMAMLANDI |
| S3 | Abonelik yasam dongusu | TAMAMLANDI |
| S4 | Dashboard ve finansal hesaplamalar | TAMAMLANDI |
| S5 | Takvim ve in-app bildirimler | TAMAMLANDI |
| S6 | Push bildirimleri | KISMI |
| S7 | Ayarlar, export, hesap silme | TAMAMLANDI |
| S8 | Kalite, guvenlik, release candidate | BASLANMADI |
| S9 | Beta ve magaza yayini | BASLANMADI |

---

## Tamamlanan isler (S0–S7)

### Auth (S1)
- E-posta + sifre kayit, giris, cikis
- Supabase `SupabaseAuthRepository` entegre, `isSupabaseConfigured = true`
- Sifre sifirlama e-postasi (`ForgotPasswordScreen`)
- Sifre sifirlama deep link: `subscripttrack://auth-callback` (AndroidManifest'te tanimli)
- `ResetPasswordScreen` — deep link sonrasi yeni sifre belirleme
- `AuthController.passwordRecoveryMode` — go_router'da redirect guard ile bagli
- `AuthController.updatePassword()` — Supabase `updateUser` cagiriyor
- Onboarding: 4 sayfa (3 tanitim + para birimi secimi), ilk acilista gosteriliyor

### Abonelik CRUD (S2, S3)
- `SubscriptionStatus` enum: `active`, `paused`, `cancelled`, `archived`
- `start_date` alani tum katmanlarda mevcut (model, form, supabase repo, local repo)
- `SupabaseSubscriptionRepository` — PostgREST ile tam CRUD
- `SubscriptionRepository` — local in-memory fallback
- `SubscriptionController`: pause, resume, cancel, archive, restore, edit, delete
- Abonelik formu: ad, tutar, para birimi, donum, kategori, baslangic tarihi, yenileme tarihi, notlar

### Dashboard (S4)
- `totalsByCurrency` — farkli para birimleri ayri satirlarda gosteriliyor, toplam yapilmiyor
- Paused / cancelled abone sayisi metrik kartlari
- Yaklasan yenilemeler listesi (30 gun icinde)

### Liste (S2–S3)
- `SubscriptionListScreen` — Aktif / Durakladi / Iptal tablari (`TabController`)
- Arama, kategori filtresi, siralama (tarih / tutar / ad)
- Abonelik detay: durum bazli popup menu (pause, resume, cancel, archive, delete)
- Basta gecerli ayda toplam tutarlar

### Takvim (S5)
- Aylik takvim — yenileme tarihleri isgallendiginde gosteriliyor
- `totalsByCurrencyForMonth()` — her para birimi icin aylik toplam
- Aylik baslik bolgesi cok para birimini ayri satirlarda gosteriyor

### In-app bildirimler (S5)
- `NotificationController.refresh()` — aktif aboneliklerden bildirim uretir
  - 0 gun: bugün yenileniyor
  - 1–3 gun: yaklasan yenileme
  - 4–7 gun: gelecek yenileme
- `NotificationCenterScreen` — liste, renk kodlu ikonlar, okundu isaretleme
- `TopBar` — unread badge, bell ikonu ile acilir
- `AuthenticatedShell` — abonelikler degistiginde bildirimler otomatik yenilenir

### Yerel push bildirimleri (S6 - kismi)
- `flutter_local_notifications ^18.0.0` + `timezone ^0.9.4` kurulu
- `LocalNotificationService` — Android + iOS kanallar, izin isteme, zamanlanmis bildirim
- `scheduleRenewalReminders()` — aktif abonelikler icin `N gun once` 09:00'da bildirim
- Saat dilimi destegi: `SettingsController.timezone` bos ise cihaz yerel saati kullanilir
- Android: `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `RECEIVE_BOOT_COMPLETED` izinleri
- `NotificationPreferencesScreen` — acma/kapama, kac gun once (1/3/7), test bildirimi
- EKSIK: FCM/APNs device token, backend push worker (S6 backlog)

### Ayarlar (S7)
- `AppearanceScreen`: tema (sistem/aydinlik/karanlik), para birimi, saat dilimi secici (13 saat dilimi)
- `SettingsController`: currency, themeMode, notificationsEnabled, daysBefore, timezone — hepsi SharedPreferences'a yaziliyor
- `ExportDataScreen`: CSV olusturma, dosya olarak paylasma (`share_plus`) veya panoya kopyalama
  - CSV'de Durum sutunu mevcut, duraklatilan/iptal edilen abonelikler dahil
- `DeleteAccountScreen`: sifre dogrulama (re-auth) sonrasi hesap silme
- `NotificationPreferencesScreen`: bildirim tercihleri

---

## Mimari

```
lib/
  app/
    router/         app_router.dart (go_router, redirect guard)
    shell/          authenticated_shell.dart, top_bar.dart, app_shell.dart
    theme/          app_theme.dart
  core/
    config/         app_environment.dart (Supabase keys, isFirebaseConfigured flag)
    datasources/    auth_data_source.dart, subscription_data_source.dart (soyut)
    errors/         app_exception.dart
    services/       local_notification_service.dart
    storage/        local_storage.dart, secure_storage.dart
    utils/          date_time_utils.dart
  features/
    auth/           AuthController, SupabaseAuthRepository, AuthRepository
    subscriptions/  SubscriptionController, SupabaseSubscriptionRepository, SubscriptionRepository
    dashboard/      DashboardScreen
    calendar/       CalendarController, CalendarScreen
    notifications/  NotificationController, NotificationCenterScreen
    settings/       SettingsController, AppearanceScreen, ExportDataScreen, DeleteAccountScreen
    onboarding/     OnboardingScreen (4 sayfa)
    stats/          StatsScreen
    savings/        SavingsScreen
```

---

## Bagimliliklari (pubspec.yaml - onemli paketler)

- `supabase_flutter: ^2.0.0`
- `go_router: ^14.0.0`
- `provider: ^6.1.2`
- `flutter_local_notifications: ^18.0.0`
- `timezone: ^0.9.4`
- `share_plus: ^10.0.0`
- `path_provider: ^2.1.4`
- `shared_preferences`

---

## Supabase yapilacaklar

Henuz calistirilmadiysa bu SQL'i dashboard'da calistir:

```sql
alter table public.subscriptions
  add column if not exists status text not null default 'active';
```

Authentication > URL Configuration > Redirect URLs'e ekle:
```
subscripttrack://auth-callback
```

---

## Kalan isler (S6 backlog + S8 + S9)

### S6 backlog
- [ ] FCM/APNs device token kaydi (Supabase Edge Function ile yapilabilir)
- [ ] Backend push worker — yenileme oncesi sunucu tarafi bildirim

### S8 — Kalite ve release candidate
- [ ] Unit testleri (AuthController, SubscriptionController, Money hesaplamalari)
- [ ] Widget testleri (form, liste, dashboard)
- [ ] Erisebilirlik (text scaling, kontrast)
- [ ] Crash reporting entegrasyonu
- [ ] iOS build / signing dogrulamasi
- [ ] Android release APK / App Bundle

### S9 — Beta ve magaza
- [ ] TestFlight beta dagitimi
- [ ] Google Play Internal Testing
- [ ] Store listing, gizlilik politikasi, kullanim sartlari
- [ ] Production Supabase ortami dogrulamasi
- [ ] App Store ve Google Play gonderimleri
