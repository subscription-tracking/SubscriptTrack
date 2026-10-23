# Expo Go yerel bildirim düzeltmesi - 22 Ekim 2026

## Değişiklik

Android ve iOS Expo Go için tüm bildirimleri engelleyen kontrol kaldırıldı. Go oturumları `localNotifications.ts` üzerinden yalnızca SDK 57 yerel API'lerini yükler. Paket kökündeki uzak push token/otomatik kayıt yan etkisi başlatılmaz. Web ve gerçek yükleme hatası için `unsupported` davranışı korunur. Native/development build mevcut paket girişini kullanır.

Samsung'daki Go 57.0.9 özel Android kanal oluştururken `NotificationsChannelsProvider` null hatası verdi. Bu nedenle yalnız Go'da özel kanal oluşturulmaz; OS varsayılan kanalı test bildirimini teslim etti. Kendi APK'mizde `renewals` kanalı korunur. İç `build/` girişleri SDK yükseltmelerinde tekrar kontrol edilmelidir; node_modules yaması yapılmadı.

## Kanıt

- `npm run typecheck`: başarılı.
- `npm run lint`: başarılı, uyarı yok.
- `node node_modules/jest/bin/jest.js --runInBand --testPathPattern=notifications`: 14 suite, 97 test başarılı.
- Tam Expo paketi: `node node_modules/jest/bin/jest.js --runInBand`, 141 suite / 884 test başarılı. Bazı mevcut UI testlerinde başarısızlık oluşturmayan `act` uyarıları var.
- Doküman kontrolü `--working-tree` ile temiz. Tracked-only kontrol, mevcut izlenmeyen dokümanlar nedeniyle temiz checkout kabulü yerine sayılmadı.
- Samsung SM-S711B / Expo Go 57.0.9: kullanıcı yerel Metro 8083 oturumunda giriş yaptı.
- Go bildirim izni UI üzerinden verildi; uygulama tercih anahtarı açıldı.
- “Test bildirimi gönder” 5 saniyelik yerel bildirim planladı. Uygulama arka plana alındı; `dumpsys notification` içinde `host.exp.exponent`, `tag=st:test` ve `expo_notifications_fallback_notification_channel` kaydı görüldü.
- Yerel kanıt `.local/closure-report-20261022/notification-delivery-evidence.txt`; bu, gerçek aboneliğin yenileme zamanında teslimi değildir.

## Açık kalanlar

- iPhone/iOS Go fiziksel izin ve teslim kabulü.
- Go'da gerçek abonelik bildiriminden detay rotasına geçiş, cold-start, 30 dakika erteleme ve yeniden teslim.
- Reboot ve gerçek yenileme tarih/saat kabulü; bağımsız APK regresyonu.
- Mevcut dış 8082 CI Metro paketi hâlâ önceki kodu sunuyor. HTTPS manifest/paket kontrolünde yeni adaptör bulunmadı. Mevcut paylaşım adresini değiştirmemek için dış sunucu yeniden başlatılmadı; yeni kod telefondaki yerel oturumda çalışıyor.

Bu çalışma iOS kabulünü veya S7 sprintinin tamamını kapatmaz. Raporun 197 sprint maddesi ve puanları yeniden değerlendirilmedi; Expo Go eki güncellendi.

Kaynak: [SDK 57 bildirim API'si](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/).
