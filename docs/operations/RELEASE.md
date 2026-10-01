# Yayın, Dağıtım ve Release Kontrolü

**Durum: Kısmi.** Geliştirme ve web önizleme dağıtımı çalışır; imzalı mobil release, cihaz doğrulaması ve iOS henüz yapılmadı. Güncel durum: [CURRENT_STATUS.md](../CURRENT_STATUS.md). Cihaz kabulü: [DEVICE_ACCEPTANCE.md](DEVICE_ACCEPTANCE.md).

## 1. Gereksinimler

Flutter/Dart sürümü `mobile/pubspec.lock` ve CI iş akışından okunur (bu belgede sürüm numarası tutulmaz). Ayrıca Android Studio veya Xcode ve Supabase erişimi.

## 2. Ortam değişkenleri

| Değişken | Amaç | Zorunlu |
|---|---|---|
| `SUPABASE_URL` | Supabase proje URL'i | Evet (Supabase modu) |
| `SUPABASE_ANON_KEY` | Supabase publishable anahtarı | Evet (Supabase modu) |

İkisi de yoksa uygulama **yerel modda** çalışır (auth SharedPreferences'ta, abonelikler cihazda). Yerel bildirimler cihazda planlanır; harici push sağlayıcısı yoktur. `service_role` anahtarı hiçbir istemci build'ine konmaz.

## 3. Geliştirme kurulumu

`mobile/.env.example` dosyasını `mobile/.env` olarak kopyalayıp gerçek değerleri ekleyin (`.env` git tarafından izlenmez). Android Studio'da `Supabase Development` çalıştırma profili otomatik olarak `--dart-define-from-file=.env` kullanır.

```bash
cd mobile
flutter run --dart-define-from-file=.env
```

## 4. GitHub Pages web önizleme

Flutter'ın web hedefi yalnızca geliştirme ve demo önizlemesidir; ürün dashboard'u değildir. Adres: https://subscription-tracking.github.io/SubscriptTrack/

Yerelde: kök dizinden `start-web.bat` (Windows) veya `./start-web.sh`, ya da `cd mobile && flutter run -d chrome [--dart-define-from-file=.env]`.

**Bir defalık GitHub ayarları:** Settings → Pages → Source = GitHub Actions; Settings → Secrets → Actions altında `SUPABASE_URL` ve `SUPABASE_ANON_KEY`. `main`'de `mobile/` veya `deploy-web-preview.yml` değişince workflow (Deploy web preview) yeni önizleme yayınlar; secret'lar yoksa bilinçli olarak başarısız olur (yerel modun yanlışlıkla canlıya çıkmasını engeller). `service_role` anahtarını secret olarak bile eklemeyin.

**Supabase Auth URL ayarı (açık iş):** e-posta doğrulama ve şifre sıfırlama bağlantılarının web önizlemeye dönmesi için Authentication → URL Configuration'da **Site URL** ve **Redirect URLs** listesine Pages adresi eklenmelidir. 2026-09-30 itibarıyla izinli listede yalnızca `subscripttrack://auth-callback` vardır ([SUPABASE_LIVE_STATUS.md](../reference/SUPABASE_LIVE_STATUS.md)). OAuth sağlayıcıları ileride açılırsa aynı adres sağlayıcı callback listesine de eklenir.

## 5. Doğrulama kapısı

```bash
cd mobile
flutter analyze --no-pub
flutter test --no-pub
flutter build apk --debug
cd ../backend && npm test
```

Canlı Supabase smoke testleri (gerçek test hesabıyla; uzak yazma yalnızca açık onay değişkeniyle):

```bash
cd backend
S31_SMOKE_CONFIRM=run node scripts/authenticated-subscription-smoke.mjs
S31_SMOKE_CONFIRM=run node scripts/authenticated-feature-smoke.mjs
node scripts/supabase-smoke.mjs   # canlı erişim/envanter kontrolü
```

> Var olmayan bir staging API'sini hedefleyen `staging-smoke.mjs` ve `npm run smoke:staging` **kaldırıldı** (ayrı API sunucusu yoktur, bkz. [ADR 0009](../decisions/0009-supabase-only-architecture.md)).

## 6. CI (`.github/workflows/mobile-quality.yml`)

| İş | İçerik | Durum (2026-09-30) |
|---|---|---|
| `analyze-and-test` | `flutter analyze`, `flutter test` | Başarılı |
| `backend-test` | `npm test` | Başarılı |
| `android-release-candidate` | `flutter build appbundle --release` (imzasız AAB) | **Başarılı** (2026-09-30, `28f2106`, 6 dk 20 sn). Önceki koşu `JetifyTransform` `Java heap space` ile kırmızıydı; `gradle.properties` `-Xmx1536M` → `-Xmx4G` ile giderildi |

Kök neden: AAB üç ABI'nin Flutter motor jar'larını aynı anda Jetify'a soktuğu için Gradle JVM'i 1,5 GB belleğe sığmıyordu (APK tek ABI'ye bölündüğünde sığıyordu). Bellek sınırı yükseltildi ve CI'ın yeşile döndüğü doğrulandı. Yerelde `flutter build apk --release` debug anahtarıyla üretilebilmiştir.

## 7. Android imzalama (Planlı)

`mobile/android/app/build.gradle` release imzası için `key.properties` arar; dosya yoksa release derlemesi **hata verir**; debug keystore ile derleme yalnızca `ALLOW_DEBUG_SIGNING=true` ortam değişkeni (CI doğrulama derlemesi) veya `-PallowDebugSigning` ile bilinçli yapılır ve mağazaya yüklenemez.

1. Bir **upload keystore** üretin (`keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload`); dosyayı ve şifreleri güvenli yerde yedekleyin.
2. `mobile/android/key.properties` oluşturun (`storeFile`, `storePassword`, `keyAlias`, `keyPassword`); **repoya eklemeyin**.
3. CI için keystore'u base64 olarak ve şifreleri repository secret olarak saklayın; yalnızca imzalı release iş akışında kullanın.
4. `flutter build appbundle --release` ile AAB üretin ve Play Internal Testing'e yükleyin.

### 7.1 Play Console: tam zamanlı alarm beyanı (F-24)

Uygulama içeriği > "Exact alarm" (Tam zamanlı alarm) beyanında: izin `SCHEDULE_EXACT_ALARM`; amaç **takvim/hatırlatıcı** — kullanıcının belirlediği abonelik yenileme hatırlatmalarını seçtiği saatte göstermek; yaklaşık zamanlama işlevi bozar. Alarm yalnızca kullanıcı bir abonelik oluşturup hatırlatma açtığında kurulur; arka planda başka amaçla kullanılmaz.

## 8. Release kontrol listesi

**Otomatik kapı**
- [x] `flutter analyze` temiz (CI)
- [x] `flutter test` yeşil (CI)
- [x] Backend testleri yeşil (CI)
- [x] Secret taraması: çalışma ağacında gizli değer yok (gitleaks, `security_scan_test`); git geçmişindeki tek bulgu publishable anon anahtarıdır
- [x] Doğrudan bağımlılıklar güncel (ana sürüm geride yok)
- [x] CI'da Android release AAB derlemesi (imzasız; yeşil, bölüm 6)

**Staging / canlı doğrulama** (ayrı staging projesi yok; testler tek Supabase projesinde yapılır)
- [ ] Gerçek Supabase oturumuyla CRUD, yaşam döngüsü ve offline replay smoke testi
- [ ] Android gerçek cihazda giriş, abonelik ekleme, bildirim izni, export
- [ ] iOS gerçek cihazda giriş, abonelik ekleme, bildirim izni (iOS build henüz yok)
- [ ] Hesap silme sonrası kalıntı veri kontrolü; e-posta teslimi ve yönlendirme; iki oturumlu Realtime

**Dağıtım**
- [ ] Upload keystore yalnızca CI secret store'unda; `key.properties` repoda yok
- [ ] AAB release keystore ile imzalandı ve Play Internal Testing'e yüklendi
- [ ] iOS imzalama, archive ve TestFlight
- [ ] Gizlilik politikası, kullanım şartları, mağaza girdisi (Data Safety) ve destek iletişimi yayınlandı
- [ ] Geri alma sorumlusu, olay iletişim kanalı ve sürüm geri alma adımı belirlendi
- [ ] Leaked Password Protection açıldı ve hız sınırı kararı verildi ([SECURITY.md](../architecture/SECURITY.md))

Bu liste teknik hazırlığın yerini tutmaz: mağaza hesapları, imza sertifikaları ve hukuki metinlerin yayını yetkili hesap sahiplerince yapılmalıdır.

## 9. Veritabanı migration ve canlı şema

- Şema değişikliği yalnızca `backend/migrations/` altındaki yeni numaralı migration ile yapılır; uygulanmış migration değiştirilmez (içerik checksum ile izlenir, `backend/src/db/migrationPlan.js`).
- **Bugünkü sorun:** canlı şema SQL Editor'den elle kurulmuştur; canlıda migration geçmişi boştur ve repodaki `001–005` zinciri canlıda olmayan tabloları (`users`, `services`, `categories`, `billing_schedules`) tanımlar. Ayrıntı: [SUPABASE_LIVE_STATUS.md](../reference/SUPABASE_LIVE_STATUS.md).
- **Kalıcı çözüm (Planlı, Supabase CLI girişi ve DB erişimi gerektirir):** `supabase link --project-ref <ref>` sonra `supabase db dump --schema public` ile canlıdan bir baseline migration üretmek; eski `001–005` ve canlıda olmayan tabloları arşive taşımak; bundan sonra **canlıya elle DDL yapmamak**, `supabase db push` ile migration uygulamak.
- Migration uygulandığında [DATA_MODEL.md](../reference/DATA_MODEL.md), [API.md](../reference/API.md) ve SUPABASE_LIVE_STATUS aynı değişiklikte güncellenir.
