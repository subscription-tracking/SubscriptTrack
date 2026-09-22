# Bildirim Sistemi

## 1. Amaç

Kullanıcıyı doğru zamanda, doğru kanaldan ve tekrar etmeyen biçimde yaklaşan yenileme veya trial bitişi hakkında bilgilendirmek.

## 2. Kanallar

- Cihaz üzerinde yerel bildirim (`flutter_local_notifications`)
- Uygulama içi kalıcı bildirim
- E-posta: Supabase Auth akışları için kullanılabilir; yenileme e-postası bu sürümde aktif bir kanal değildir

Bu sürümde FCM/APNs tabanlı uzak push veya cihaz token gönderimi yoktur. Birincil
hatırlatma kanalı, abonelik kaydı üzerinden cihazda zamanlanan yerel bildirimin
kendisidir.

## 3. Bildirim tipleri

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
1. Mobil uygulama abonelik ve bildirim kurallarını yükler.
2. Cihaz timezone’ı okunur ve geçmiş tarihler elenir.
3. Yenileme ve trial adayları yerel scheduler’a yazılır.
4. Bildirim payload’ı abonelik kimliğini taşır.
5. Kullanıcı bildirime dokununca ilgili detay ekranına gider veya 30 dakika erteler.

Sunucu worker/outbox modeli gelecekteki uzak bildirim kapsamıdır; mevcut mobil
uygulamanın çalışma yolu değildir.
```

## 5. Zamanlama

- Kullanıcı zaman dilimi IANA zone olarak saklanır.
- Varsayılan teslimat saati kullanıcı yerel saatinde 09:00 olabilir.
- `days_before` 0–30 aralığındadır.
- Trial için farklı günler desteklenebilir: 7, 3, 1.
- Sunucu bütün hesapları UTC ile çalıştırır, planı yerel saate dönüştürür.

## 6. Tekrar engelleme

Unique anahtar:

```text
occurrence_id + channel + notification_type
```

Aynı kullanıcı için birden fazla cihaz tokenı varsa teslimat kayıt modeli cihaz alt denemelerini ayrıca tutabilir; kullanıcı düzeyinde aynı olay iki bildirim olarak görünmemelidir.

## 7. Retry

Önerilen politika:

- Geçici provider/network hatası: exponential backoff
- Geçersiz device token: token revoke, tekrar yok
- Yetki/credential hatası: alarm, otomatik sınırsız retry yok
- Maksimum denemeden sonra `DEAD`

## 8. Push payload

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

## 13. E-posta

E-posta:

- Servis adı
- Fiyat/para birimi
- Yenileme tarihi
- Güvenli görüntüleme bağlantısı
- Bildirim tercihleri bağlantısı

Unsubscribe işlemi pazarlama e-postasından ayrı değerlendirilmelidir; işlem bildirimi tercihleri uygulama ayarlarıyla yönetilir.

## 14. Operasyon metrikleri

- Oluşturulan teslimat sayısı
- Gönderim başarı oranı
- Provider hata kodları
- Gecikmiş job sayısı
- Duplicate engellenen kayıt
- Açılma/deep link oranı
- Geçersiz token oranı

## 15. Test matrisi

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
