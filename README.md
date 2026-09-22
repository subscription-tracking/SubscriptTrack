# SubscriptTrack

## Aboneliklerini tek yerde gör. Yenilemeleri kaçırma.

SubscriptTrack, dijital abonelikleri ve ücretsiz denemeleri iOS ve Android üzerinde takip etmeyi sağlayan mobil uygulamadır. Yenileme tarihlerini, tahmini harcamaları, ödeme geçmişini ve iptal sonrası tasarrufu tek akışta yönetir.

<p align="center">
  <a href="https://subscription-tracking.github.io/SubscriptTrack/">Web önizleme</a>
  ·
  <a href="SubscriptTrack-Documentation/CURRENT_STATUS.md">Güncel durum</a>
  ·
  <a href="outputs/reports/SubscriptTrack_Teknik_Yapi_ve_Ozellik_Envanteri.md">Teknik rapor</a>
</p>

---

## Ürünün ana fikri

SubscriptTrack bir banka veya ödeme uygulaması değildir.

- Karttan veya banka hesabından para çekmez.
- Kart numarası, CVV veya banka şifresi tutmaz.
- Kullanıcı abonelik bilgilerini manuel girer veya servis kataloğundan seçer.
- Ödeme yöntemi alanı yalnızca kullanıcının yazdığı etikettir: Garanti Bonus, İş Bankası veya PayPal gibi.

## Mevcut özellikler

| Alan | Durum |
|---|---|
| Abonelik ekleme, düzenleme ve arşivleme | Aktif |
| Netflix, Spotify vb. servis kataloğu | Aktif |
| Aylık/yıllık toplamlar | Aktif |
| Takvim ve yaklaşan yenilemeler | Aktif |
| Ücretsiz deneme takibi | Aktif |
| Ödendi ve yenilendi akışı | Aktif |
| Ödeme geçmişi ekleme/düzenleme | Aktif |
| Ödeme yöntemi etiketleri | Aktif |
| CSV içe/dışa aktarma | Aktif |
| Destek ticket oluşturma | Aktif |
| Yerel yenileme bildirimleri | Aktif |
| Offline son veri ve mutation queue | Aktif |
| Supabase Realtime senkronizasyonu | Aktif altyapı |
| Şifre sıfırlama ve e-posta doğrulama | Kod hazır, canlı mail testi gerekli |
| Google / Apple giriş | Kod yolu hazır, sağlayıcı ayarı gerekli |
| Uzak push bildirimleri | Ürün kapsamında yok |

## Teknoloji

| Katman | Seçim |
|---|---|
| Mobil | Flutter 3.44.8 · Dart 3.12.2 |
| UI ve state | Material UI · Provider · ChangeNotifier |
| Navigasyon | go_router |
| Kimlik | Supabase Auth |
| Veri | Supabase PostgreSQL · PostgREST · RPC |
| Yetkilendirme | JWT · Row Level Security |
| Canlı senkron | Supabase Realtime |
| Sunucu fonksiyonları | Deno TypeScript Edge Functions |
| Yerel bildirim | flutter_local_notifications · timezone |
| Yerel güvenli depolama | flutter_secure_storage |
| Para hesaplama | Money / minor unit |
| CI/CD | GitHub Actions · GitHub Pages |

## Nasıl çalışıyor

```text
Kullanıcı
   ↓
Flutter mobil ekranı
   ↓
Controller ve domain kuralları
   ↓
Repository / Supabase Edge Function
   ↓
Supabase Auth · PostgREST · RPC · Realtime
   ↓
PostgreSQL
   ↓
Cache ve arayüz güncellemesi
```

Mobil uygulama Supabase yapılandırmasıyla derlenmişse bulut verisini kullanır. Ağ kesilirse son başarılı veri cihaz cache’inden gösterilir; başarısız yazmalar bağlantı geldiğinde sırayla tekrar denenir.

## Kod yapısı

```text
mobile/lib/
├── app/                    Router, shell ve tema
├── core/                   Domain, network, storage ve servisler
└── features/
    ├── auth/               Kayıt, giriş, şifre ve e-posta
    ├── subscriptions/      Abonelik domain, repository ve ekranlar
    ├── dashboard/          Toplamlar ve yaklaşan yenilemeler
    ├── calendar/           Aylık takvim
    ├── notifications/      Uygulama içi bildirimler
    ├── stats/              İstatistik ve ödeme geçmişi
    ├── savings/            Tasarruf olayları
    └── settings/           Profil, export, ödeme etiketleri, destek

backend/
├── migrations/              PostgreSQL ve RLS migration’ları
├── supabase/functions/      Hesap, export, payment ve support/catalog
└── scripts/                 Canlı inventory ve smoke testleri
```

## Hızlı başlangıç

### Gereksinimler

- Flutter 3.44.8 veya uyumlu stable sürüm
- Dart 3.12.2
- Android Studio veya Xcode
- Supabase projesi

### Supabase bağlantılı çalıştırma

```bash
cd mobile
flutter pub get
flutter run --dart-define-from-file=.env
```

.env dosyasında şu iki değer bulunur:

```text
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

Service role anahtarını mobil veya web build’ine koymayın.

### Kalite ve release

```bash
cd mobile
flutter analyze --no-pub
flutter test --no-pub
flutter build apk --release --dart-define-from-file=.env
```

Authenticated smoke testleri:

```bash
cd backend
S31_SMOKE_CONFIRM=run node scripts/authenticated-subscription-smoke.mjs
S31_SMOKE_CONFIRM=run node scripts/authenticated-feature-smoke.mjs
```

## Güncel dağıtımlar

| Dağıtım | Bağlantı |
|---|---|
| Android release APK | [SubscriptTrack-latest-release.apk](outputs/apk/SubscriptTrack-latest-release.apk) |
| GitHub Pages web önizleme | [subscription-tracking.github.io/SubscriptTrack](https://subscription-tracking.github.io/SubscriptTrack/) |
| Supabase teknik raporu | [Teknoloji ve Özellik Envanteri](outputs/reports/SubscriptTrack_Teknik_Yapi_ve_Ozellik_Envanteri.md) |

GitHub Actions; main dalındaki mobil değişikliklerden sonra Flutter Web build’ini oluşturur ve Pages’e yayınlar.

## Dokümantasyon

Güncel dokümantasyon merkezi:

[SubscriptTrack-Documentation](SubscriptTrack-Documentation/README.md)

Önemli belgeler:

- [Güncel proje durumu](SubscriptTrack-Documentation/CURRENT_STATUS.md)
- [Ürün kapsamı](SubscriptTrack-Documentation/PRODUCT.md)
- [Sistem mimarisi](SubscriptTrack-Documentation/ARCHITECTURE.md)
- [Mobil mimari](SubscriptTrack-Documentation/MOBILE_ARCHITECTURE.md)
- [API sözleşmesi](SubscriptTrack-Documentation/API.md)
- [Veri modeli](SubscriptTrack-Documentation/DATA_MODEL.md)
- [Bildirimler](SubscriptTrack-Documentation/NOTIFICATIONS.md)
- [Deployment](SubscriptTrack-Documentation/DEPLOYMENT.md)
- [Arşivlenmiş sprint kayıtları](SubscriptTrack-Documentation/archive)

## Lisans ve kapsam

SubscriptTrack’in ürün kapsamı mobil uygulamadır. Web sayfası tanıtım, yardım, yasal içerik ve auth dönüşleri için destekleyici yüzdür; tam web dashboard’u değildir.
