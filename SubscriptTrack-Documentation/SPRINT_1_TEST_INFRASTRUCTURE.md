# Sprint 1 — Test Altyapısı

## Amaç

59 Excel senaryosunu unit/widget, integration ve gerçek cihaz testlerine ayırmak; staging testleri için tekrarlanabilir veri ve çalışır bir kalite kapısı sağlamak.

## Tamamlanan altyapı

- Backend Node test runner manifesti eklendi.
- Migration planı için deterministik `migrationId`, `checksum` ve canonical migration seçimi eklendi.
- Staging değişkenleri için `backend/.env.example` eklendi.
- TRY/USD/EUR/GBP, tüm subscription status değerleri ve bildirim günleri için ortak fixture eklendi.

## Çalıştırma

```text
cd backend
npm test

cd ../mobile
flutter analyze --no-pub
flutter test --no-pub
```

Staging smoke testi için `STAGING_API_BASE_URL` tanımlanmalıdır:

```text
node backend/scripts/staging-smoke.mjs
```

## Sprint çıkış kriterleri

- Backend test runner çalışır.
- Flutter analyze hatasız tamamlanır.
- Flutter testleri başarılı tamamlanır.
- Gerçek staging URL ve Supabase bilgileri CI secret olarak tanımlanmadan staging smoke testi PASS kabul edilmez.
- Android emulator smoke testi ayrı bir cihaz kanıtı olarak tutulur.

## Doğrulama sonucu — 17 Eylül 2026

- `backend/npm test`: 3/3 başarılı.
- `mobile/flutter test --no-pub`: 278/278 başarılı.
- `mobile/flutter analyze --no-pub`: derleme hatası yok; 3 lint/info mevcut.
- Android `Pixel_9_Pro` emulator (`emulator-5554`) açıldı.
- Debug APK üretildi, emulator’a kuruldu ve `com.subscripttrack.app` başlatıldı.
- Fiziksel USB cihazı `unauthorized` olduğu için test kapsamına alınmadı.
- Gerçek staging credential bulunmadığından staging smoke testi çalıştırılmadı.

## Sprint 2 başlangıç notu

Para birimi sözleşmesi için `mobile/test/currency_e2e_contract_test.dart` eklendi. Bu test dört desteklenen para biriminin Money/JSON round-trip davranışını, ayrı toplamlarını ve sembol gösterimini doğrular.

## Sprint 3 güncellemesi

`NotificationRule` artık `Subscription` modelinde JSON ile taşınır; add/edit formundaki 0, 1, 3 ve 7 gün seçimleri controller üzerinden kayda gider. Supabase için `backend/migrations/014_notification_rules_json.sql` migration'ı eklendi. Local scheduling aboneliğin kendi aktif kurallarını kullanır; kural yoksa global `daysBefore` kullanılır.

## Sprint 4 güncellemesi

`LocalNotificationService.cancelForSubscription()` eklendi. Pending notification payload'ları abonelik ID'siyle eşleşen tüm kayıtlar (snooze dahil) tekil olarak iptal ediliyor. Cold-start deep-link ve snooze callback sözleşmeleri için regresyon testleri eklendi.

## Sprint 5 doğrulaması — 17 Eylül 2026

- `flutter build apk --debug --no-pub`: başarılı; güncel debug APK üretildi.
- Android `emulator-5554`: `device` olarak erişilebilir.
- Güncel APK `com.subscripttrack.app` paketine yeniden kuruldu: `Success`.
- `MainActivity` force-stop sonrası yeniden başlatıldı.
- Paket sürümü: `0.1.0`.
- Emulator'da `POST_NOTIFICATIONS` izni verildi ve `dumpsys package` çıktısında `granted=true` doğrulandı.
- `RECEIVE_BOOT_COMPLETED`, `INTERNET` ve `VIBRATE` izinleri de paket durumunda mevcut.
- Fiziksel Android cihaz `R5CX42A745H` hâlâ `unauthorized`; cihaz bildirimi testi bu cihazda yapılamadı.
- iOS Simulator/cihaz macOS/Xcode gerektirdiği için bu Windows çalışma ortamında çalıştırılamadı; iOS Sprint 5 çıkış kriteri beklemede.

Sprint 5 Android emulator kurulumu ve başlatma/izin smoke doğrulaması tamamlandı. Sprint bütünü iOS gerçek çalışma kanıtı olmadığı için henüz tamamen kapatılmadı.

## Sprint 6 doğrulaması — 17 Eylül 2026

- Offline/cache/force-kill kapsamındaki test paketi çalıştırıldı: `evidence_paket7_negative_test.dart`, `offline_mutation_queue_test.dart`, `subscription_offline_replay_test.dart` ve `subscription_controller_test.dart` toplam 43/43 başarılı.
- Offline açılışta cache'den veri gösterilmesi ve `isOffline=true` durumu doğrulandı.
- Offline add/edit/delete işlemlerinin optimistic uygulanması ve `OfflineMutationQueue` içine FIFO olarak alınması doğrulandı.
- Bağlantı geri geldiğinde create/update replay ve geçici `local-*` ID'nin sunucu ID'sine dönüşmesi doğrulandı.
- Cache yazımından sonra Android emulator'da uygulama force-stop edilip cold-start ile yeniden açıldı: `Status: ok`, `LaunchState: COLD`.
- Cold-start sonrasında paket sürümü `0.1.0`, bildirim izni `POST_NOTIFICATIONS: granted=true` olarak kaldı.

Sprint 6 çıkış kriterleri tamamlandı.

## Sprint 7 doğrulaması — 17 Eylül 2026

- `evidence_paket9_sync_test.dart`: 9/9 başarılı.
- Uygulama yeniden açılışında aynı kullanıcı cache/backend verisini koruyor.
- Backend erişilemezken son başarılı cache gösteriliyor ve offline durumu korunuyor.
- `SupabaseSubscriptionRepository.watchAll()` Realtime stream'i ve `SubscriptionController` aboneliği mevcut; INSERT/UPDATE/DELETE değişiklikleri manuel yenileme olmadan controller'a aktarılıyor.
- Realtime birleşiminde başka cihazdan gelen sunucu listesi korunurken henüz sync edilmemiş `local-*` offline kayıtlar kaybolmıyor.
- Eski camelCase/snake_case kayıt formatları ve additive migration uyumluluğu doğrulandı.
- Controller dispose edildiğinde Realtime subscription iptal ediliyor.

Sprint 7 çıkış kriterleri tamamlandı. Gerçek Supabase Realtime ağ kanıtı için staging credential gerektiğinden, gerçek ağ smoke testi ayrıca release öncesi checklist'te tutulmalıdır.

## Sprint 8 doğrulaması — 17 Eylül 2026

- Migration/upgrade doğrulama paketi: `evidence_paket9_sync_test.dart`, `subscription_model_test.dart` ve `money_test.dart` toplam 49/49 başarılı.
- Eski JSON kayıtlarında yeni alanlar yokken güvenli varsayılanlarla okuma doğrulandı.
- CamelCase yerel cache ve snake_case backend kayıtları birlikte destekleniyor.
- Para değerlerinin upgrade round-trip'inde minor-unit/Money bütünlüğü korundu.
- `012_schema_compatibility.sql` ve `014_notification_rules_json.sql` additive/idempotent migration desenleriyle doğrulandı.
- Backend migration testleri `backend/npm test`: 3/3 başarılı.

Sprint 8 kod, model, migration ve otomatik test kriterleri tamamlandı. Gerçek Supabase veritabanına migration uygulama kanıtı staging credential gerektirir ve release öncesi operasyon adımı olarak kalır.

## Sprint 9 doğrulaması — 17 Eylül 2026

- `auth_controller_s9_test.dart` ve `evidence_paket10_perf_security_test.dart`: 16/16 başarılı.
- Abonelik/finansal cache artık `FlutterSecureStorage` kullanıyor; Android'de `EncryptedSharedPreferences`, iOS'ta Keychain seçeneği etkin.
- Auth session/credential okuma-yazma ve sign-out davranışı doğrulandı.
- Hesap silme sonrasında abonelik cache'inin ve yerel kullanıcı verisinin temizlendiği doğrulandı.
- Güvenlik testi, abonelik verisinin düz metin `SharedPreferences` içine yazılmadığını doğruluyor.
- Bildirim/read-state ve offline mutation metadata gibi hassas olmayan tercihler ayrı olarak `SharedPreferences`'ta tutuluyor.

Sprint 9 çıkış kriterleri tamamlandı.

## Sprint 10 ilerleme — 17 Eylül 2026

- `AppLockService` eklendi: 4–8 haneli PIN doğrulaması, PIN'in yalnızca SHA-256 özeti, secure storage kaydı/silme ve biyometrik doğrulama API'si.
- `local_auth` bağımlılığı Android/iOS için eklendi.
- PIN formatı ve PIN yapılandırılmadan kilidin devreye girmemesi test edildi.
- `AppLockGate` uygulama lifecycle'ını dinliyor; PIN etkinse uygulama arka plana alındığında kilitli overlay gösteriyor.
- Ayarlar'a PIN etkinleştirme/devre dışı bırakma ve biyometrik kilit açma yönetimi eklendi.
- `app_lock_service_test.dart`: 2/2 başarılı; güncel Android debug APK başarıyla üretildi.

Sprint 10 çıkış kriterleri tamamlandı. Biyometri gerçek cihaz sensörü gerektirdiği için emulator üzerinde biyometri kabulü ayrıca gerçek cihaz smoke adımıdır.

## Sprint 11 doğrulaması — 17 Eylül 2026

- Final Flutter regression: 286/286 başarılı.
- Final backend regression: 3/3 başarılı.
- Güncel Android debug APK build'i başarılı.
- 59 Excel senaryosu için mevcut evidence paketleri ve Sprint 1–10 test kapsamı tekrar çalıştırıldı; başarısız test kalmadı.
- Kalan dış ortam kanıtları: gerçek Supabase staging credential, yetkili fiziksel Android cihaz ve macOS/Xcode üzerinde iOS cihaz/simulator.

Sprint 11 otomatik regression ve release-evidence kriterleri tamamlandı. Dış ortam smoke adımları release checklist'inde operasyonel bekleyenler olarak korunuyor.

## Supabase yeniden doğrulaması — 17 Eylül 2026

- `mobile/.env` mevcut ve gerçek proje URL'i içeriyor; anon anahtar placeholder değil.
- Supabase REST endpoint'i anon anahtarla HTTP 200 döndürdü.
- `flutter build apk --debug --dart-define-from-file=.env` başarılı; uygulama Supabase tanımlarıyla derlendi.
- Önceki değerlendirmedeki “credential yok” ifadesi düzeltilmiştir. Kalan konu credential yokluğu değil; gerçek authenticated CRUD/Realtime/migration smoke akışının çalıştırılmasıdır.
