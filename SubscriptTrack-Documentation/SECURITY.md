# Güvenlik ve Gizlilik

## 1. Güvenlik hedefleri

- Kullanıcı yalnızca kendi verisine erişebilir.
- Token ve secret'lar istemci kaynak kodunda bulunmaz.
- Finansal harcama bilgileri gereksiz sistemlere aktarılmaz.
- Bildirim ve export linkleri tahmin edilemez ve süreli olur.
- Hesap silme ve veri dışa aktarma uygulanabilir olmalıdır.

## 2. Tehdit modeli özeti

Korunacak varlıklar:

- Kimlik ve e-posta
- Abonelik adları, fiyatları ve notları
- Bildirim tercihleri
- Device tokenları
- Export dosyaları
- Admin erişimi

Temel tehditler:

- Başka kullanıcının kaydına IDOR erişimi
- Çalınmış token
- Mobil binary içinden secret çıkarma
- Loglarda hassas veri
- Push token sızıntısı
- Kötü amaçlı deep link
- Rate limit olmadan abuse
- Hesap silme sürecinin eksikliği

## 3. Authentication

- OAuth/OIDC standartları kullanılır.
- Apple ve Google girişinde server-side token validation yapılır.
- Access token kısa ömürlü olmalıdır.
- Refresh token güvenli saklanır ve revoke destekler.
- Hassas işlemlerde recent authentication istenebilir.

## 4. Authorization

Backend her istekte kullanıcı kimliğini token'dan çıkarır.

Yanlış:

```text
GET /users/{userId}/subscriptions
```

Tercih:

```text
GET /subscriptions
```

Sahiplik sorgusu her zaman `id + authenticated_user_id` ile yapılır. Bulunmayan ve başkasına ait kayıtlar için bilgi sızdırmayan cevap kullanılır.

## 5. Mobil güvenlik

- Token secure storage/keychain/keystore içinde tutulur.
- API secret mobil uygulamaya gömülmez.
- Debug log production'da kapatılır.
- Certificate pinning risk ve operasyon maliyetiyle ayrıca değerlendirilir.
- Root/jailbreak tespiti tek güvenlik kontrolü olarak kullanılmaz.
- Clipboard'a hassas veri otomatik kopyalanmaz.

## 6. Veri güvenliği

- Transit: TLS
- At rest: platform/DB encryption
- Backup erişimi kısıtlı
- Device tokenları hassas kabul edilir
- Not alanının uzunluğu ve içeriği doğrulanır
- Dosya yükleme varsa MIME/size/malware kontrolleri gerekir

## 7. Secret yönetimi

- Secret'lar environment/secret manager üzerinden gelir.
- Repository'ye `.env` veya gerçek anahtar eklenmez.
- Production ve staging anahtarları ayrıdır.
- Anahtar rotasyonu prosedürü bulunur.

## 8. Loglama

Loglanmamalı:

- Access/refresh token
- Tam push token
- Kullanıcı notu
- OAuth credential
- Export dosya içeriği

Loglanabilir:

- Request ID
- Kullanıcı ID'sinin gerektiğinde hash/pseudonym hali
- Endpoint
- HTTP status
- Hata kodu
- Süre

## 9. Rate limiting

Özellikle:

- Login/şifre sıfırlama
- Service search
- Subscription create/update
- Export
- Device token register
- Hesap silme

endpoint'lerinde kullanıcı/IP bazlı limit uygulanır.

## 10. Input validation

- Para negatif olamaz.
- Para birimi allow-list/ISO doğrulaması
- URL yalnızca izin verilen protokoller
- Metin uzunluk limitleri
- Enum/check constraint
- SQL injection ORM kullansak bile parametreli sorgu
- HTML içerik gösteriliyorsa sanitize

## 11. Deep link güvenliği

- Sadece tanımlı route ve parametreler kabul edilir.
- Deep link sahiplik kontrolünü atlamaz.
- Dış URL açılmadan önce güvenilir protokol kontrolü yapılır.
- İptal linkleri kullanıcıya açıkça gösterilir.

## 12. Hesap silme

- Uygulama içinden ulaşılabilir.
- Etki açıkça anlatılır.
- Yeniden doğrulama uygulanabilir.
- Kullanıcı verileri, device tokenları ve export'lar kapsanır.
- Silme işlemi audit kaydı üretir ancak kişisel veri minimumda tutulur.

## 13. Veri dışa aktarma

- Export yalnızca sahibi tarafından başlatılır.
- Dosya şifreli depolamada kısa süre tutulur.
- İndirme bağlantısı süreli ve tek kullanıcıya bağlıdır.
- Dosya süresi dolunca silinir.

## 14. Gizlilik ilkeleri

- Banka/kart bağlantısı yoktur.
- Analytics'e abonelik adı, not veya tam fiyat gibi gereksiz kişisel detay gönderilmez.
- Kullanıcı verisi reklam hedeflemesi için satılmaz.
- Veri minimizasyonu uygulanır.
- App Store ve Google Play privacy formları gerçek uygulama davranışıyla eşleşir.

## 15. Güvenlik testi

- SAST/dependency scan
- Secret scan
- API authorization integration testleri
- IDOR testleri
- Rate limit testleri
- Mobile secure storage kontrolü
- Staging üzerinde periyodik penetration test

## 16. Güvenlik olayı

En azından şu prosedür yazılı olmalıdır:

1. Olayı doğrula
2. Etkilenen sistemi izole et
3. Anahtar/token revoke et
4. Etkiyi belirle
5. Yasal bildirim gereksinimini değerlendir
6. Kullanıcı iletişimi
7. Kök neden ve önleyici aksiyon
