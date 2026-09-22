# SubscriptTrack

SubscriptTrack, kullanıcıların dijital aboneliklerini tek yerde takip ettiği iOS ve Android uygulamasıdır. Kullanıcı; yenileme tarihlerini, deneme sürelerini, para birimi bazlı tahmini harcamalarını, ödeme geçmişini ve tasarruflarını yönetir.

> Banka veya kredi kartı bağlamaz. Karttan para çekmez. Kullanıcı yalnızca kendi yazdığı ödeme yöntemi etiketlerini saklayabilir.

## Güncel durum

| Alan | Durum |
|---|---|
| Mobil istemci | Flutter 3.44.8 / Dart 3.12.2 |
| Backend | Supabase Auth, PostgreSQL, RLS, Realtime ve Edge Functions |
| Android release APK | [Güncel APK](outputs/apk/SubscriptTrack-latest-release.apk) |
| Web önizleme | [GitHub Pages](https://subscription-tracking.github.io/SubscriptTrack/) |
| Teknik rapor | [Teknoloji ve özellik envanteri](outputs/reports/SubscriptTrack_Teknik_Yapi_ve_Ozellik_Envanteri.docx) |
| Güncel teknik durum | [CURRENT_STATUS.md](SubscriptTrack-Documentation/CURRENT_STATUS.md) |

## Ürün neleri yapıyor

- E-posta ile kayıt, giriş ve oturum yönetimi
- Şifre sıfırlama ve e-posta değiştirme akışları
- Manuel abonelik ekleme, düzenleme, durum değiştirme ve arşivleme
- Netflix, Spotify ve benzeri servisler için servis kataloğu önerileri
- Aylık/yıllık toplamları para birimine göre ayrı hesaplama
- Takvim, yaklaşan yenilemeler ve ücretsiz deneme takibi
- Ödeme geçmişine kayıt ekleme, düzenleme ve silme
- “Ödendi ve yenilendi” ile sonraki yenileme tarihini ilerletme
- Kullanıcının tanımladığı ödeme yöntemi etiketleri
- Cihaz üzerinde yerel yenileme ve trial bildirimleri
- Çevrimdışı son veriyi görüntüleme ve başarısız yazmaları kuyruğa alma
- CSV içe/dışa aktarma
- Destek ticket oluşturma
- Hesap ve ilişkili verileri silme
- Supabase Realtime ile abonelik değişikliklerini dinleme

## Bilinçli ürün sınırları

- FCM/APNs uzak push sistemi yoktur; bildirimler cihazda planlanır.
- Banka, kredi kartı veya ödeme sağlayıcısı entegrasyonu yoktur.
- Uygulama içinde kart numarası, CVV veya finansal erişim bilgisi tutulmaz.
- Web yüzü tam abonelik dashboard’u değildir; mobil uygulama ana üründür.
- Google/Apple giriş kod yolu mevcut olsa da sağlayıcı ayarı ve canlı OAuth kabulü ayrıca gerekir.

## Teknoloji yığını

| Katman | Teknoloji |
|---|---|
| Mobil | Flutter, Dart, Material UI |
| Durum | Provider, ChangeNotifier |
| Navigasyon | go_router |
| Kimlik | Supabase Auth |
| Veri | Supabase PostgREST, PostgreSQL, RPC |
| Güvenlik | JWT, Row Level Security, secure storage |
| Canlı senkron | Supabase Realtime |
| Sunucu | Deno TypeScript Edge Functions |
| Yerel bildirim | flutter_local_notifications, timezone |
| Para | Money/minor unit |
| CI/CD | GitHub Actions, GitHub Pages |

## Kod yapısı

```text
mobile/lib/
  app/                  router, shell, tema
  core/                 config, domain, network, storage, servisler
  features/auth/        kayıt, giriş, şifre ve e-posta akışları
  features/subscriptions/ abonelik domain, repository ve ekranlar
  features/dashboard/  özetler ve yaklaşan yenilemeler
  features/calendar/   takvim
  features/notifications/ uygulama içi bildirimler
  features/stats/      istatistik ve ödeme geçmişi
  features/savings/    tasarruf olayları
  features/settings/   profil, export, payment label, destek

backend/
  migrations/           PostgreSQL ve RLS migration’ları
  supabase/functions/   delete, export, payment, support/catalog
  scripts/               canlı inventory ve authenticated smoke testleri
```

## Temel akış

```text
Flutter ekranı
  → Controller
  → Repository / Supabase Function
  → Auth, PostgREST, RPC veya Realtime
  → PostgreSQL
  → Cache ve UI güncellemesi
```

## Geliştirme

Supabase bağlantılı mobil çalıştırma:

```bash
cd mobile
flutter pub get
flutter run --dart-define-from-file=.env
```

Kalite kontrolleri:

```bash
flutter analyze --no-pub
flutter test --no-pub
flutter build apk --release --dart-define-from-file=.env
```

Authenticated smoke testleri gerçek test hesabı ister ve açık onay olmadan uzak projede yazma yapmaz:

```bash
cd backend
S31_SMOKE_CONFIRM=run node scripts/authenticated-subscription-smoke.mjs
S31_SMOKE_CONFIRM=run node scripts/authenticated-feature-smoke.mjs
```

## Dokümantasyon

Güncel dokümanların indeksi: [SubscriptTrack-Documentation/docs/INDEX.md](SubscriptTrack-Documentation/docs/INDEX.md)

Temel belgeler:

- [Güncel durum](SubscriptTrack-Documentation/CURRENT_STATUS.md)
- [Ürün kapsamı](SubscriptTrack-Documentation/PRODUCT.md)
- [Sistem mimarisi](SubscriptTrack-Documentation/ARCHITECTURE.md)
- [Mobil mimari](SubscriptTrack-Documentation/MOBILE_ARCHITECTURE.md)
- [API sözleşmesi](SubscriptTrack-Documentation/API.md)
- [Veri modeli](SubscriptTrack-Documentation/DATA_MODEL.md)
- [Bildirimler](SubscriptTrack-Documentation/NOTIFICATIONS.md)
- [Güvenlik](SubscriptTrack-Documentation/SECURITY.md)
- [Deployment](SubscriptTrack-Documentation/DEPLOYMENT.md)
- [Test stratejisi](SubscriptTrack-Documentation/TESTING.md)

Tarihli sprint ve release kayıtları [SubscriptTrack-Documentation/archive](SubscriptTrack-Documentation/archive) altında tutulur.

