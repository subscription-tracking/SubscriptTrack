# S31–S34 — Release Evidence Kapanış Planı

## Amaç

Kod ve otomatik testlerle tamamlanan ürün davranışını, gerçek backend ve cihaz
kanıtına dönüştürmek. Bu plan yeni ürün özelliği eklemez; mevcut kabul
kriterlerinin yayınlanabilir olduğuna dair kanıt üretir.

## Başlangıç durumu — 18 Eylül 2026

- Flutter otomatik regresyon paketi: **301/301 başarılı**.
- `flutter analyze --no-pub`: **0 issue**.
- Backend migration planı testleri: **7/7 başarılı**; 022–025 migration'larının
  RPC sözleşmeleri ve profile-trigger şema uyumu ayrıca denetlenir.
- Android debug APK üretildi ve emülatöre temiz kurulumla yüklendi.
- Excel'deki 59 senaryo için otomatik kanıt paketleri mevcut.
- Kanıtlı uçtan uca kabul sayısı hâlâ **23/59 (%39)**. Bu sayı, gerçek
  cihaz/canlı ortamda doğrulanmamış senaryoları otomatik test başarılı olsa da
  kabul edilmiş saymaz.

## S38 — Otomatik kalite kanıtı (19 Eylül 2026, 18:52 UTC+03:00)

Bu bölüm yalnız yerelde tekrar üretilebilen kaynak, test ve statik kalite
kontrollerinin kanıtıdır. Staging, canlı Supabase, fiziksel cihaz, mağaza,
imzalama veya dağıtım kabulü yerine geçmez.

| Kontrol | Komut | Sonuç |
|---|---|---|
| Flutter regresyon | `flutter test --no-pub --reporter compact --timeout 2m` | **306 geçti, 0 başarısız, 0 atlandı** (46 sn) |
| Statik analiz | `flutter analyze --no-pub` | **0 issue** (5,7 sn) |
| Biçim | `dart format --set-exit-if-changed lib test` | **115 dosya, 0 değişiklik** (0,37 sn) |
| Secret scan | `flutter test --no-pub test/security_scan_test.dart --reporter compact --timeout 2m` | **4 geçti, 0 başarısız** |
| Backend migration sözleşmesi | `npm test` | **7 geçti, 0 başarısız, 0 atlandı** (429 ms) |

İlk biçim kontrolü 37 dosyada stil farkı buldu; standart Dart biçimi uygulandı.
Ardından format kontrolü temiz, analiz temiz ve tam Flutter paketi yeniden
çalıştırıldı. Bu işlem davranış değişikliği değil, kalite kapısını temizlemek
için biçim ve beş `curly_braces_in_flow_control_structures` düzeltmesidir.

### Excel senaryo eşlemesi

Excel’in 59 satırının otomatik test eşlemesi
[`TEST_TRACEABILITY.md`](TEST_TRACEABILITY.md) dosyasındadır. Bu kayıt,
59 satırın her biri için test dosyasını gösterir; **kod kanıtı, cihaz/canlı
kabulü değildir**. Cihaz/canlı kabulü ayrıca gereken satırlar: 35–38, 41, 47,
53, 54 ve 59.

### Önceki kanıta göre fark

18 Eylül’deki **301/301** Flutter sonucuna göre toplam **+5** teste çıktı.
Artış S36’da eklenen `excel_scenarios_1_2_9_10_test.dart` içindeki Excel
1, 2, 9 ve 10 senaryoları ile deterministik yenileme-tarihi kontrolünden
kaynaklanır. S37’de Excel kabul metni 18–21, 40, 45 ve 46 için ürün
kurallarıyla hizalandı; uygulama davranışı eklenmedi. Bu çalışma ağacında bu
değişiklikler henüz commit kimliğiyle ilişkilendirilmemiştir.

Yerel ham test günlükleri: `outputs/audit-20260919/`. Bu günlükler destekleyici
çıktıdır; bu bölüm kalıcı, denetlenebilir özet kaydıdır.

## S31 — Staging şeması ve kimliği doğrulanmış veri akışı

**Hedef:** Uygulamanın gerçek kullanıcı oturumuyla staging Supabase üzerinde
CRUD, yaşam döngüsü, offline replay ve Realtime akışını kanıtlamak.

**Kapatılacak işler**

- [x] `backend/migrations/022_subscription_start_date_update.sql` migration'ını
  bağlı Supabase projesine uygula ve migration durumunu kaydet.
- Test kullanıcısıyla create, edit, yanlış-kayıt silme, archive/restore,
  cancel/pause/resume akışlarını çalıştır.
- Aynı idempotency anahtarıyla tekrar isteği ve farklı payload çakışmasını
  doğrula.
- İki oturumda Realtime değişikliği ve offline queue replay akışını doğrula.
- Yetkisiz kullanıcı için RLS/401/403 negatif kontrollerini çalıştır.

**Çıkış kanıtı:** Zaman damgalı staging smoke çıktısı, migration sonucu ve
temizlenmiş test verisi kaydı.

**Bağımlılık:** Staging proje erişimi ve test kullanıcısı.

**Tekrarlanabilir ön kontrol:** `npm test` ile migration sözleşmesini,
`STAGING_API_BASE_URL=... npm run smoke:staging` ile API health/readiness
uçlarını ve `SUPABASE_URL=... SUPABASE_ANON_KEY=... npm run smoke:supabase`
ile salt-okunur Supabase erişimini doğrula.

Kimliği doğrulanmış CRUD ve idempotency kanıtı için yalnızca ayrı bir staging
test hesabıyla `S31_TEST_EMAIL`, `S31_TEST_PASSWORD` ve
`S31_SMOKE_CONFIRM=run` tanımlanarak `npm run smoke:authenticated` çalıştırılır.
Araç create, aynı idempotency anahtarıyla tekrar create, `start_date` içeren
update, update tekrarı ve farklı payload çakışmasını kontrol eder; kendi
oluşturduğu tek kayıt için `finally` bloğunda fiziksel cleanup yapar.

### S31 ön kontrol sonucu — 18 Eylül 2026

- `npm test`: **4/4 başarılı**; 022 migration'ındaki `start_date` parametresi,
  güncelleme ataması ve authenticated execute izni doğrulandı.
- `npm run smoke:supabase`: auth settings, Storage, subscriptions ve exports
  uçlarının her biri **HTTP 200** döndürdü.
- `smoke:staging` betiği paket komutu olarak eklendi; URL verilmediğinde
  kontrollü biçimde durur ve yanlış ortama istek göndermez.

### S31 migration uygulama sonucu — 18 Eylül 2026

`supabase db query --linked --file
backend/migrations/022_subscription_start_date_update.sql` komutu bağlı
Supabase projesinde başarıyla çalıştı. Ardından yapılan SQL metadata sorgusu,
`update_subscription_idempotent` fonksiyonunda `p_start_date date` ve
`p_next_renewal_date date` parametrelerini, gövdede `start_date=p_start_date`
atamasını ve `authenticated` rolü için execute iznini doğruladı.

### S31 canlı authenticated CRUD sonucu — 18 Eylül 2026

Geçici bir kullanıcıyla canlı Supabase üzerinde oturum açma, abonelik oluşturma,
oluşturulan kaydı okuma, create/update idempotency, farklı payload çakışması,
abonelik cleanup ve `delete-account` ile hesap cleanup adımları geçti. Test
sonunda `s1-audit-%@example.invalid` denetim hesabı sayısı SQL ile **0**
doğrulandı.

Bu çalışma sırasında üç canlı şema/servis sorunu bulundu ve giderildi:

- 023, profil tetikleyicisinden tabloda bulunmayan alan kullanımını kaldırdı.
- 024, canlıda eksik olan create-subscription RPC'sini geri yükledi.
- 025, idempotency fonksiyonlarının Supabase `extensions` şemasındaki
  `pgcrypto` işlevlerini çözebilmesini sağladı.

Realtime, ikinci kullanıcı RLS negatif testi ve offline replay hâlâ
gerçekleştirilmemiştir.

### S34 Android build doğrulaması — 18 Eylül 2026

İlk Gradle denemesi yanıt vermeden beklediği için daemon durduruldu. Temiz
daemon ile `flutter build appbundle --release --no-pub
--dart-define-from-file=.env` yeniden çalıştırıldı ve
`mobile/build/app/outputs/bundle/release/app-release.aab` üretildi.

Bu çalışma ortamında `android/key.properties` bulunmadığından build scriptinin
tanımlı debug-keystore fallback'i kullanıldı. Dolayısıyla artefakt üretim kapısı
tamamlandı; upload keystore ile imzalama ve Play Internal Testing'e yükleme hâlâ
S34 dış hesap adımlarıdır.

### S34 güvenlik ve bağımlılık ön kontrolü — 18 Eylül 2026

- Kaynak yollarında yapılan secret scan credential-benzeri literal bulmadı.
- Flutter bağımlılık incelemesi 24 kilitli güncelleme ile iki transitif kullanım
  dışı paketi (`flutter_secure_storage_macos`, `js`) gösterdi. Bunlar büyük
  sürüm/platform değişikliği gerektirebileceğinden release adayına alınmadı;
  ayrı bağımlılık yükseltme sprintinde ele alınmalıdır.
- Backend'de `package-lock.json` bulunmadığı için `npm audit` çalıştırılamadı.
  Lockfile üretimi dependency çözümünü değiştireceğinden, yayın hazırlığına
  otomatik eklenmedi.

## S32 — Android fiziksel cihaz kabulü

**Hedef:** Android'de gerçek cihaz, izin ve arka plan davranışını doğrulamak.

**Kapatılacak işler**

- Yetkili fiziksel cihazda debug/release-candidate APK kurulumu ve cold start.
- Giriş, abonelik ekleme/düzenleme, archive, gecikmiş yenilemeyi `Yenilendi`
  ile ilerletme ve CSV export smoke akışı.
- Bildirim izni, exact-alarm izinli/izinsiz fallback, timezone değişimi,
  arka plan/yeniden başlatma ve notification deep-link testi.
- PIN ve biyometrik kilit açma testi.
- Erişilebilirlik: büyük metin ve TalkBack temel navigasyon smoke testi.

**Çıkış kanıtı:** Cihaz modeli/Android sürümü, APK sürümü, her senaryonun PASS
sonucu ve başarısızsa log/screenshot referansı.

**Bağımlılık:** USB debugging'i yetkilendirilmiş Android cihaz.

**Tekrarlanabilir ön kontrol:** `powershell -ExecutionPolicy Bypass -File
scripts/android-device-preflight.ps1` komutu yalnız okuma yapan ADB kontrolleri
ile cihazın Android/API sürümünü, APK varlığını, uygulama kurulumunu ve bildirim
izinlerini `outputs/audit-20260918/android-device-preflight.json` dosyasına
kaydeder. Birden fazla ya da yetkisiz cihazda bilinçli olarak durur.

## S33 — iOS fiziksel cihaz veya Simulator kabulü

**Hedef:** iOS platform davranışını macOS/Xcode üzerinde doğrulamak.

**Kapatılacak işler**

- Xcode build, imzalama ve uygulama açılışı.
- Giriş, abonelik CRUD/lifecycle, offline açılış ve CSV export smoke akışı.
- Yerel bildirim izni, timezone değişimi, deep-link ve arka plan testi.
- Face ID/Touch ID destekli uygulama kilidi ve VoiceOver temel navigasyonu.

**Çıkış kanıtı:** iOS sürümü, cihaz/simulator bilgisi, build çıktısı ve test
sonuçları.

**Bağımlılık:** macOS, Xcode ve iOS signing erişimi.

## S34 — Yayın adayı ve mağaza kapısı

**Hedef:** Doğrulanmış sürümü kontrollü dağıtıma hazırlamak.

**Kapatılacak işler**

- Production ortam değişkenleri, CORS, health/readiness ve telemetry
  yapılandırmasını doğrula.
- Android AAB'yi upload keystore ile imzala ve Play Internal Testing'e yükle.
- iOS archive oluştur ve TestFlight'a gönder.
- Privacy policy, terms, mağaza listeleri ve destek iletişimini yayınla.
- Rollback sorumlusu ve sürüm geri alma adımını kayda geçir.

**Çıkış kanıtı:** Internal Testing/TestFlight dağıtım kaydı ve
`RELEASE_CHECKLIST.md` maddelerinin kapanmış hali.

**Bağımlılık:** Play Console, Apple Developer, imza sertifikaları ve hukuk/metin
onayı.

## Sıra ve ilerleme ölçümü

```text
S31 staging/backend → S32 Android saha → S33 iOS saha → S34 dağıtım
```

- S31, canlı veriye bağlı senaryoların kanıtını üretir.
- S32 ve S33 paralel yürütülebilir; ikisi de S34'ten önce tamamlanır.
- Her sprint sonunda 59 senaryoluk rapordaki ilgili satırlar yeniden
  değerlendirilir; yalnız somut kanıt oluştuğunda `Tamamlandı` sayılır.
