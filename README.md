# SubscriptTrack

## Aboneliklerini tek yerde gör. Yenilemeleri kaçırma.

SubscriptTrack, dijital abonelikleri ve ücretsiz denemeleri iOS ve Android üzerinde takip etmeyi sağlayan mobil uygulamadır. Yenileme tarihlerini, tahmini harcamaları, ödeme geçmişini ve iptal sonrası tasarrufu tek akışta yönetir.

<p align="center">
  <a href="https://subscription-tracking.github.io/SubscriptTrack/">Web önizleme</a>
  ·
  <a href="docs/CURRENT_STATUS.md">Güncel durum</a>
  ·
  <a href="docs/README.md">Dokümantasyon</a>
  ·
  <a href="docs/quality/index.html">Kalite raporu</a>
</p>

---

## Ürünün ana fikri

SubscriptTrack bir banka veya ödeme uygulaması değildir: karttan veya banka hesabından para çekmez, kart numarası, CVV veya banka şifresi tutmaz. Kullanıcı abonelik bilgilerini manuel girer veya servis kataloğundan seçer; "ödeme yöntemi" yalnızca kullanıcının yazdığı bir etikettir. Uzak push bildirimi yoktur; hatırlatmalar cihazda yerel bildirimle yapılır. Web sayfası tanıtım ve yardım içindir, abonelik dashboard'u değildir.

Özellik durumu (Uygulandı / Kısmi / Planlı) ve teknoloji sürümleri tek yerde tutulur: **[docs/CURRENT_STATUS.md](docs/CURRENT_STATUS.md)**.

## Nasıl çalışıyor

Flutter mobil uygulaması tek backend olarak Supabase'i kullanır (Auth, PostgreSQL + RLS, RPC, Realtime, Edge Functions). Supabase yapılandırması yoksa uygulama yerel modda çalışır. Ayrıntı: [Mimari](docs/architecture/ARCHITECTURE.md), [Mobil yapı](docs/architecture/MOBILE.md).

```text
mobile/      Flutter uygulaması (lib/app, lib/core, lib/features, lib/shared)
backend/     Supabase migration'ları, Edge Function'lar, smoke betikleri
docs/        Tüm dokümantasyon (harita: docs/README.md)
tools/       Kalite ölçümü ve doküman kontrolü
```

## Hızlı başlangıç

Gereksinimler: `mobile/pubspec.lock`'taki Flutter/Dart sürümü (stable), Android Studio veya Xcode, isteğe bağlı Supabase projesi.

```bash
cd mobile
flutter pub get
flutter run                                    # yerel mod (Supabase yok)
flutter run --dart-define-from-file=.env       # Supabase bağlantılı
```

`mobile/.env` içinde yalnızca `SUPABASE_URL` ve `SUPABASE_ANON_KEY` bulunur (bkz. `mobile/.env.example`). Service-role anahtarını mobil veya web build'ine koymayın. Ayrıntı: [docs/operations/RELEASE.md](docs/operations/RELEASE.md).

### Kalite

```bash
cd mobile
flutter analyze --no-pub
flutter test --no-pub
```

Güncel ölçümler ve puanlama: [docs/quality/index.html](docs/quality/index.html).

## Dokümantasyon

Tüm belgeler [docs/](docs/README.md) altındadır: ürün, mimari, referans (veri modeli, API, canlı Supabase durumu), operasyon (test, yayın, katkı) ve karar kayıtları (ADR).

## Kapsam

SubscriptTrack'in ürün kapsamı mobil uygulamadır. Web önizleme geliştirme ve tanıtım içindir.
