# Bildirim Sistemi

**Durum:** Yerel bildirim ve uygulama içi bildirim merkezi **Uygulandı**; uzak push, e-posta bildirimi ve teslimat işçisi **Kapsam dışı / Planlı** (aşağıda bölüm başlarında etiketli). Karar: [ADR 0009](../decisions/0009-supabase-only-architecture.md).

## 1. Amaç

Kullanıcıyı doğru zamanda, doğru kanaldan ve tekrar etmeyen biçimde yaklaşan yenileme veya trial bitişi hakkında bilgilendirmek.

## 2. Kanallar

Expo SDK 57 istemcisi `expo-notifications` ile cihaz planını eşitler. Planlı kayıtların kimliği yanında UTC tetikleme anı, başlık, gövde ve abonelik kimliğinden parmak izi saklar. Saat, IANA bölgesi veya içerik değişince eski planlı kayıt iptal edilip yenisi yazılır; aynı parmak izinde işlem yapılmaz. `st:z|` erteleme ve `st:test|` test kayıtları eşitleme dışında kalır. Bir kayıt değiştiğinde önce eski kayıt iptal edilir ve yenisi kurulur; yeni kayıt kurulamazsa eski kayıt, cihazda okunan içerik ve tarih tetikleyicisiyle geri yüklenir (Expo'nun aynı kimlikle yeniden zamanlamanın mevcut kaydı değiştirdiğini belgelemediği için sıralama buna dayanmaz). Planlama hatası ekranda gösterilir ve uygulama yeniden öne geldiğinde tekrar denenir. Expo Go 57.0.9 Android denemesinde modül açılışı hata verdiği için Go'da bildirim desteği kapalıdır; cihaz kabulü development/native build ile yapılır.

- Cihaz üzerinde yerel bildirim (`flutter_local_notifications`)
- Uygulama içi kalıcı bildirim
- E-posta: Supabase Auth akışları için kullanılabilir; yenileme e-postası bu sürümde aktif bir kanal değildir

Bu sürümde FCM/APNs tabanlı uzak push veya cihaz token gönderimi yoktur. Birincil
hatırlatma kanalı, abonelik kaydı üzerinden cihazda zamanlanan yerel bildirimin
kendisidir.

## 3. Bildirim tipleri

**Durum: Kısmi.** Aşağıdaki tipler hedef listedir. Bugün uygulanan: yenileme ve trial hatırlatmaları (yerel) ile `pg_cron` işinin ürettiği uygulama içi `renewal_today` / `renewal_soon` / `renewal_upcoming` bildirimleri.

| Tip | Açıklama |
|---|---|
| `RENEWAL_REMINDER` | Normal yenileme yaklaşıyor |
| `TRIAL_ENDING` | Ücretsiz deneme bitiyor |
| `ANNUAL_HIGH_VALUE` | Yüksek tutarlı yıllık ödeme yaklaşıyor |
| `RENEWAL_CONFIRMATION` | Beklenen yenileme gerçekleşti mi? |
| `PRICE_CHANGED` | Kullanıcı fiyat değişikliği kaydetti |
| `REVIEW_SUBSCRIPTION` | Uzun süredir değerlendirilmeyen abonelik |

MVP için ilk ikisi zorunludur.

## 4. Mevcut üretim akışı

```text
1. Mobil uygulama abonelik, bildirim kuralları ve kullanıcının kaydedilmiş IANA saat dilimi tercihini yükler.
2. Tercih yoksa cihaz IANA bölgesi başlangıç varsayılanıdır; kayıtlı tercih varsa cihaz bölgesi kullanılmaz. Flutter tercihi cihazda, Expo tercihi kullanıcı profilinde saklar. Geçmiş tarihler bu etkin bölgeye göre elenir.
3. Yenileme ve trial adayları yerel scheduler’a yazılır.
4. Bildirim payload’ı abonelik kimliğini taşır.
5. Kullanıcı bildirime dokununca ilgili detay ekranına gider veya 30 dakika erteler.

Sunucu worker/outbox modeli gelecekteki uzak bildirim kapsamıdır; mevcut mobil
uygulamanın çalışma yolu değildir.
```

## 5. Zamanlama

- Kullanıcı zaman dilimi IANA zone olarak saklanır; Expo'da profil tercihi, Flutter'da cihaz tercihi kullanılır. İlk kurulumda cihaz bölgesi başlangıç değeri olabilir.
- Varsayılan teslimat saati kullanıcı yerel saatinde 09:00 olabilir.
- `days_before` 0–30 aralığındadır.
- Trial için farklı günler desteklenebilir: 7, 3, 1.
- Sunucu bütün hesapları UTC ile çalıştırır, planı yerel saate dönüştürür.

### 5.1 Yedek (catch-up) ve gecikme bildirimi (Expo)

Teslim saati kaçmış hatırlatma sessizce kaybolmaz; planlayıcı (`reminderPlanner.planReminders`) tek seferlik yedek üretir. "Bugün" kullanıcının IANA gününe göre hesaplanır; yalnızca aktif ve en az bir etkin bildirim kuralı (veya varsayılan gün) olan kayıtlar için geçerlidir.

- **Yenileme bugün, saat geçmiş:** kimlik `st:c|<id>|<yenilemeTarihi>`, now+60 sn, içerik "Bugün yenileniyor — tutar · tarih". Aynı yenileme tarihi için en fazla bir kez.
- **Yenileme tarihi geçmişte (gecikmiş):** kimlik `st:o|<id>|<bugün>`, now+60 sn, içerik "Vadesi geçti — tutar · tarih. Ödemeyi kontrol et." Günde en fazla bir kez; kayıt ödenip yenileme tarihi ilerleyene ya da iptal edilene kadar her yeni gün bir tane.
- Yedekler 60 bildirim sınırında normal adaylardan önce gelir.
- **Gönderildi işareti:** planlayıcı saf kalır, `sentMarkers` girdisini alır. `NotificationSync` yedekler cihaza planlanınca kimliği kullanıcıya özel `notifications.catchup.sent.<userId>` anahtarına (şifreli depo) işler; 7 günden eski işaretler budanır. İşaretli kimlik yeniden üretilmez, bekleyen yedek de iptal edilmez.
- Yedek kimliklerde zaman parmak izine girmez; senkron her çalıştığında now+60 sn kaymasıyla yeniden zamanlanmaz.
- `cancelAllReminders`, hesap değişimi ve silinen abonelik temizliği `st:c|`/`st:o|` kayıtlarını da kapsar.

## 6. Tekrar engelleme

**Durum: Kısmi.** Yerel planlamada aynı plan için hash değişmezse yeniden zamanlanmaz. Sunucu tarafındaki `notification_deliveries` tablosu şemada vardır ancak istemci veya işçi tarafından kullanılmaz; aşağıdaki cihaz-token ifadesi hedef içindir.

Unique anahtar:

```text
occurrence_id + channel + notification_type
```

Aynı kullanıcı için birden fazla cihaz tokenı varsa teslimat kayıt modeli cihaz alt denemelerini ayrıca tutabilir; kullanıcı düzeyinde aynı olay iki bildirim olarak görünmemelidir.

## 7. Retry

**Durum: Kapsam dışı** (uzak teslimat yok). Aşağıdaki politika, ileride uzak bildirim eklenirse geçerli olacak taslaktır.

Önerilen politika:

- Geçici provider/network hatası: exponential backoff
- Geçersiz device token: token revoke, tekrar yok
- Yetki/credential hatası: alarm, otomatik sınırsız retry yok
- Maksimum denemeden sonra `DEAD`

## 8. Push payload

**Durum: Kapsam dışı** (uzak push yok). Yerel bildirimin payload'ı abonelik kimliği taşır ve dokunmayla ilgili detayı açar.

Payload minimum ve gizlilik odaklı olmalıdır.

```json
{
  "type": "RENEWAL_REMINDER",
  "notificationId": "ntf_...",
  "subscriptionId": "sub_...",
  "deepLink": "subscripttrack://subscriptions/sub_..."
}
```

Kilit ekranında fiyat gösterimi kullanıcı tercihine bağlanabilir.

## 9. Bildirim metinleri

### Yenileme

Başlık:

> Netflix 3 gün sonra yenilenecek

Gövde:

> Tahmini tutar 279,99 ₺. Aboneliği kontrol et.

### Trial

Başlık:

> Figma denemen yarın bitiyor

Gövde:

> Ücretliye dönüşmeden önce devam veya iptal kararını ver.

Metinler lokalizasyon anahtarı ve parametrelerle oluşturulmalıdır; veritabanında tek dilde sabit cümle saklanmamalıdır.

## 10. Deep link davranışı

- Kullanıcı oturum açmışsa doğrudan detay
- Oturum yoksa auth sonrası hedefe devam
- Kaynak arşivlenmişse detay yine açılabilir
- Kaynak silinmişse güvenli hata ve liste yönlendirmesi

## 11. Uygulama içi bildirim

- `read_at` ile okunma durumu
- Badge sayısı unread kayıt sayısından gelir
- Bildirim listesi tarih sıralı
- “Tümünü okundu işaretle”
- İlgili aboneliğe navigasyon

## 12. İzin deneyimi

1. Önce ürün içi açıklama
2. Kullanıcı “Bildirimleri aç” der
3. Sistem izni istenir
4. Reddedilirse sessiz ve saygılı fallback
5. Ayarlarda sistem ayarına gitme bağlantısı
6. Expo: bildirimler açıkken izin "denied" ise bildirim ayarları ekranında kalıcı uyarı bandı ("Bildirim izni kapalı; hatırlatmalar gelmeyecek.") ve "Ayarları aç" düğmesi (`Linking.openSettings()`) gösterilir; uygulama öne dönünce izin yenilenir, verilince bant kaybolur.

### 12.1 Tam zamanlı alarm izni (`SCHEDULE_EXACT_ALARM`)

Hatırlatmalar kullanıcının seçtiği saatte (örn. yenileme günü 09:00) gösterilmelidir; takvim/hatırlatıcı niteliği taşıyan çekirdek özelliktir ve yaklaşık zamanlama (saat farkı) ürün vaadini bozar. Bu yüzden `SCHEDULE_EXACT_ALARM` izni tutulur (güvenlik denetimi F-24). İzin reddedilirse/Android 14+'da verilmezse uygulama yaklaşık zamanlamaya düşer ve kullanıcıya ayarlardan izin verme bağlantısı sunulur (bkz. §12). Play Console beyan metni: [RELEASE.md](../operations/RELEASE.md#8-release-kontrol-listesi).

## 13. E-posta

**Durum: Kapsam dışı.** Bugün yalnızca Supabase Auth e-postaları (doğrulama, şifre sıfırlama) gönderilir; yenileme e-postası yoktur.

E-posta:

- Servis adı
- Fiyat/para birimi
- Yenileme tarihi
- Güvenli görüntüleme bağlantısı
- Bildirim tercihleri bağlantısı

Unsubscribe işlemi pazarlama e-postasından ayrı değerlendirilmelidir; işlem bildirimi tercihleri uygulama ayarlarıyla yönetilir.

## 14. Operasyon metrikleri

**Durum: Planlı.** Bu metrikleri toplayan bir altyapı yoktur.

- Oluşturulan teslimat sayısı
- Gönderim başarı oranı
- Provider hata kodları
- Gecikmiş job sayısı
- Duplicate engellenen kayıt
- Açılma/deep link oranı
- Geçersiz token oranı

## 15. Test matrisi

**Durum: Kısmi.** Yerel planlama, saat dilimi ve ay sonu senaryoları otomatik testlidir (`local_notification_*`, `reminder_planner_test`, `evidence_paket5/6`); gerçek cihazda zaman dilimi, izin reddi ve uygulama durumları [DEVICE_ACCEPTANCE.md](../operations/DEVICE_ACCEPTANCE.md) kapsamındadır ve henüz kaydedilmemiştir.

- Zaman dilimi değişimi
- Yaz/kış saati geçişi
- Ay sonu
- Leap year
- Aynı cron'un iki kez çalışması
- İptal edilen abonelik
- Push izni kapalı
- Birden fazla cihaz
- Geçersiz token
- Uygulama kapalı/arka planda/açık
# Expo bildirim sorumlulukları — 12 Ekim 2026

`notificationRuntime.ts` native modülün yüklenmesi, kanal/kategori ve izinleri; `notificationResponses.ts` dokunma, ilk açılış ve ertelemeyi; `notificationScheduler.ts` plan eşitleme, test bildirimi ve toplu iptali yönetir. Scheduler mevcut dış API'yi yeniden export eder. Ayrıştırma yeni bildirim davranışı eklemez; plan değiştirme ve erteleme testleri korunur. Gerçek Android/iOS teslim, soğuk açılış ve izin kabulü ayrıca gereklidir.

## Expo 59 senaryo sözleşmesi — 12 Ekim 2026

**Expo için güncel kullanıcı kararı:** [Gereksinim, API/veri modeli ve dağıtım sözleşmesi](../quality/expo-59/CONTRACT.md). Önceki Expo anlatımıyla çelişen tarih, mantıksal silme, 1.000 kota, 2.000 not, tüm para birimleri, device/fixed bölge ve açık/koyu/sistem tema kurallarında bu sözleşme geçerlidir. Flutter mevcut uygulaması korunur. Kod hazırlığı canlı/native kabul anlamına gelmez.

### Uygulama içi bildirim merkezi davranışı (13 Ekim 2026)

Merkez, aynı abonelik ve türdeki tekrarları tek satırda toplar (×N); okundu ve kapatma grubun tüm bildirimlerine uygulanır. Filtre Tümü/Okunmamış'tır. Vadesi gelmiş yenileme bildirimlerinde onaylı "Ödendi" ve "Aboneliği aç" satır içi eylemleri çıkar; deneme türlerinde yalnız "Aboneliği aç". Bildirim izni reddedilmişse merkez uyarı bandı gösterir. Yerel zamanlama ve sunucu üretim kuralları değişmedi.
