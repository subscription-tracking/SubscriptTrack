# Deployment Rehberi

Son güncelleme: 1 Ağustos 2026

## Gereksinimler

- Flutter 3.44.8 / Dart 3.12.2
- Android Studio veya Xcode
- Supabase Authentication
- PostgreSQL erişimli REST API (`API_BASE_URL`)

## Ortam değişkenleri

| Değişken | Amaç | Zorunlu |
|---|---|---|
| `SUPABASE_URL` | Supabase proje URL'i | Evet |
| `SUPABASE_ANON_KEY` | Supabase anon anahtarı | Evet |
| `API_BASE_URL` | REST API origin'i | Evet |
| `CORS_ORIGINS` | Browser istekleri için izinli originler | Production web için |

Yerel bildirimler cihazda planlanır; harici push sağlayıcısı veya cihaz token kaydı yoktur.

## Mobil Supabase geliştirme kurulumu

`mobile/.env.example` dosyasını `mobile/.env` olarak kopyalayıp gerçek
`SUPABASE_URL` ve `SUPABASE_ANON_KEY` değerlerini ekleyin. `.env` Git tarafından
izlenmez. Android Studio'da `Supabase Development` çalıştırma profilini seçin;
profil otomatik olarak `--dart-define-from-file=.env` ile başlatır.

Komut satırı eşdeğeri:

```bash
flutter run --dart-define-from-file=.env
```

## Doğrulama kapısı

```bash
flutter analyze --no-pub
flutter test --no-pub
flutter build apk --debug
```

## Staging smoke testi

Staging API yayınlandıktan sonra backend kökünde aşağıdaki komut çalıştırılır:

```bash
STAGING_API_BASE_URL=https://api-staging.example.com npm run smoke:staging
```

Araç `GET /health` ve `GET /ready` kontrollerini yapar; başarısız olursa sıfır
olmayan çıkış kodu döner. Ardından gerçek kullanıcı oturumuyla mobilde login,
abonelik CRUD, lifecycle, offline replay, yerel bildirim ve export akışları
manuel smoke kontrolünden geçirilir.

Release için ayrıca imzalı Android App Bundle, gerçek Android/iOS cihaz smoke testi,
staging API doğrulaması ve mağaza dağıtım adımları tamamlanmalıdır.

## Veritabanı

REST API için kanonik şema `001_initial_schema.sql` ve
`003_subscription_api_contract.sql` ile tanımlıdır. `002_mobile_ready.sql`,
eski doğrudan istemci prototipidir; production migration zincirine dahil değildir.
