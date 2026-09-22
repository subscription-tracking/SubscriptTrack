# Güncel Proje Durumu

Son güncelleme: 22 Eylül 2026

Bu dosya güncel teknik durumu özetler. Tarihli sprint raporları `archive/` altında tutulur.

## Genel durum

SubscriptTrack; Flutter mobil istemci, Supabase Auth/PostgreSQL/Realtime, Edge Functions ve GitHub Pages web önizlemesinden oluşur. Kod ve backend özellikleri tamamlanmış; kalan doğrulamalar gerçek e-posta, gerçek cihaz veya iki ayrı canlı oturum gerektiren kabul adımlarıdır.

## Teknoloji

- Flutter 3.44.8 / Dart 3.12.2
- Provider + ChangeNotifier
- go_router
- Supabase Flutter SDK
- PostgreSQL + Row Level Security
- Supabase Realtime
- Deno TypeScript Edge Functions
- flutter_local_notifications + timezone
- flutter_secure_storage ve yerel cache
- Money/minor unit para modeli
- GitHub Actions + GitHub Pages

## Özellik durumu

| Özellik | Durum | Açıklama |
|---|---|---|
| Onboarding | Aktif | İlk açılış akışı ve tamamlanma kaydı |
| E-posta kayıt ve giriş | Aktif | Supabase Auth; local fallback da mevcut |
| Şifremi unuttum | Kısmi | Kod ve reset ekranı mevcut; gerçek mail/redirect testi gerekli |
| E-posta doğrulama | Kısmi | Oturumsuz sign-up doğru ele alınıyor; mail sağlayıcısı testi gerekli |
| Google / Apple giriş | Kısmi | Kod yolu var; sağlayıcı ayarı ve canlı OAuth testi yok |
| Abonelik CRUD | Aktif | Supabase RPC/PostgREST ve RLS |
| Abonelik durumları | Aktif | Active, paused, cancelled, expired, archived |
| Servis kataloğu | Aktif | service_catalog + support-catalog Function + mobil fallback |
| Payment label | Aktif | payment-methods Function ile GET/PUT |
| Ödeme geçmişi | Aktif | Ekleme, düzenleme, silme |
| Ödendi ve yenilendi | Aktif | Payment event ve sonraki yenileme tarihi |
| Dashboard / takvim | Aktif | Para birimi bazlı toplamlar ve yenilemeler |
| Yerel bildirim | Aktif | Cihaz üzerinde planlama, test, erteleme, deep-link |
| Uzak push | Yok | FCM/APNs kullanılmıyor |
| Offline cache/kuyruk | Aktif | Son veri ve FIFO mutation queue |
| Realtime çoklu cihaz | Kısmi | Kod/publication var; iki canlı oturum testi gerekli |
| CSV export/import | Aktif | Canonical 11 alanlı şema |
| Hesap silme | Aktif | delete-account v2; canlı test gerekli |
| Destek ticket | Aktif | Tablo, ekran ve support-catalog POST |
| Biyometrik kilit | Kısmi | Kod ve 5 dakika timeout var; cihaz testi gerekli |

## Canlı backend

- delete-account v2: ACTIVE
- process-export v2: ACTIVE
- payment-methods v1: ACTIVE
- support-catalog v1: ACTIVE
- 028 payment methods migration: uygulandı
- 029 support/catalog migration: uygulandı
- 030 Realtime publication migration: uygulandı

## Dağıtım

- Git branch: `main`
- Güncel commit: `733ad6b`
- Release APK: `outputs/apk/SubscriptTrack-latest-release.apk`
- GitHub Pages: https://subscription-tracking.github.io/SubscriptTrack/
- Pages workflow: başarılı
- Supabase project ref: `tdbljrojcmyjwchawfif`

## Doğrulama

- `flutter analyze --no-pub`: başarılı
- Controller/UI testleri: başarılı
- Release APK build: başarılı
- Supabase live inventory: Auth, Storage ve ana tablolar erişilebilir
- Authenticated smoke yardımcıları:
  - `backend/scripts/authenticated-subscription-smoke.mjs`
  - `backend/scripts/authenticated-feature-smoke.mjs`

Gerçek hesap ve cihaz gerektiren e-posta teslimi, deep-link, hesap silme, export indirme ve iki oturumlu Realtime testleri bu teknik durumun dışında canlı kabul doğrulamasıdır.

