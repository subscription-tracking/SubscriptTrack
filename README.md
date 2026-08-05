# SubscriptTrack

SubscriptTrack, dijital abonelikleri iOS ve Android'de takip etmeye yönelik bir mobil uygulamadır. Yenilemeleri ve denemeleri görünür kılar, yaklaşan ödemeler için hatırlatma sunar ve iptal edilen aboneliklerin tahmini tasarrufunu para birimi bazında gösterir.

> Web hedefi yalnızca geliştirme, demo ve UI önizlemesi içindir. Ürünün web üzerinde abonelik dashboard'u yoktur ve bu kapsamda geliştirilmeyecektir. Tanıtım, yardım, iptal rehberleri ve yasal sayfalar için bağımsız bir web sitesi ileride ayrıca konumlanır.

## Öne çıkanlar

- Abonelik, deneme, yenileme tarihi ve fatura döngüsü takibi
- Para birimi bazında aylık/yıllık tahmini toplamlar
- Takvim, yaklaşan yenilemeler ve bildirim merkezi
- İptal, duraklatma ve arşivleme ile geçmişi koruyan yaşam döngüsü
- Supabase yapılandırılmadığında cihazda çalışan yerel mod
- Flutter ile iOS ve Android için tek kod tabanı

## Hızlı başlangıç

Gerekenler:

- Flutter SDK (proje şu anda Flutter 3.44.8 / Dart 3.12.2 ile doğrulanmıştır)
- Android için Android Studio; iOS için macOS + Xcode
- İsteğe bağlı: Supabase projesi

Repoyu aldıktan sonra bir kez bağımlılıkları kurun:

```bash
git clone https://github.com/Krayirhan/SubscriptTrack.git
cd SubscriptTrack
```

Windows:

```bat
setup.bat
```

macOS / Linux:

```bash
chmod +x setup.sh start-web.sh
./setup.sh
```

Kurulum scripti Flutter'ı kontrol eder, gerekirse `mobile/.env` dosyasını şablondan oluşturur ve `flutter pub get` çalıştırır. Supabase bilgileri yoksa kurulum durmaz: uygulama yerel modda çalışır.

## Web'de başlatma

Bu komutlar Flutter uygulamasını Chrome'da geliştirici önizlemesi olarak açar:

Windows:

```bat
start-web.bat
```

macOS / Linux:

```bash
./start-web.sh
```

Alternatif olarak `mobile/` içinden:

```bash
make web
# veya Make olmadan
flutter run -d chrome
```

`mobile/.env` varsa komutlar onu `--dart-define-from-file` ile yükler; yoksa yerel modda başlar. Headless geliştirme sunucusu için:

```bash
cd mobile
make web-server
```

GitHub Pages üzerinde Supabase bağlı canlı önizleme yayınlamak için [GitHub Pages + Supabase rehberini](SubscriptTrack-Documentation/GITHUB_PAGES_SUPABASE.md) izleyin.

## Mobilde başlatma

Önce bağlı/emülatör cihazları görün:

```bash
cd mobile
flutter devices
flutter run
```

Android release APK üretmek için:

```bash
make android
```

Bağlı Android cihaza kurmak için:

```bash
make install
```

## Supabase ile çalışma

Bulut kimlik doğrulama ve senkronizasyon için `mobile/.env.example` dosyasını `mobile/.env` olarak kopyalayıp şu değerleri girin:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

Bu dosya Git tarafından izlenmez. `SUPABASE_URL` veya `SUPABASE_ANON_KEY` yoksa uygulama yerel auth ve cihaz içi depolama fallback'iyle çalışır. İstemciye `service_role` anahtarı eklemeyin.

## Doğrulama

Flutter kurulu bir ortamda:

```bash
cd mobile
flutter analyze --no-pub
flutter test --no-pub
```

## Proje yapısı

```text
mobile/                         Flutter uygulaması (Android · Web önizleme)
SubscriptTrack-Documentation/   Ürün, domain, API ve mimari dokümantasyonu
setup.bat / setup.sh            İlk kurulum (Flutter kontrolü + bağımlılıklar)
start-web.bat / start-web.sh    Chrome'da web önizlemeyi başlatma
```

## Mimari sınırlar

- Mobil istemci veritabanına doğrudan bağlanmaz; API sözleşmesi kullanılır.
- Para hesapları floating point ile yapılmaz.
- Tarihler UTC saklanır, kullanıcıya IANA zaman diliminde gösterilir.
- Normal akışta silme yerine cancel, expire veya archive kullanılır.
- Web önizlemesi ürünün web dashboard'u olduğu anlamına gelmez.

## Dokümantasyon

Başlangıç noktası: [dokümantasyon indeksi](SubscriptTrack-Documentation/docs/INDEX.md).

- [Ürün gereksinimleri](SubscriptTrack-Documentation/PRODUCT.md)
- [Sistem mimarisi](SubscriptTrack-Documentation/ARCHITECTURE.md)
- [Domain kuralları](SubscriptTrack-Documentation/DOMAIN.md)
- [API sözleşmesi](SubscriptTrack-Documentation/API.md)
- [Mobil mimari](SubscriptTrack-Documentation/MOBILE_ARCHITECTURE.md)
- [Dağıtım rehberi](SubscriptTrack-Documentation/DEPLOYMENT.md)
- [GitHub Pages + Supabase](SubscriptTrack-Documentation/GITHUB_PAGES_SUPABASE.md)
- [Katkı rehberi](SubscriptTrack-Documentation/CONTRIBUTING.md)
