# Domain Modeli ve İş Kuralları

## 1. Amaç

Bu dosya frontend, backend, tasarım ve test ekiplerinin aynı iş kavramlarını aynı anlamda kullanmasını sağlar.

## 2. Temel kavramlar

### User

Uygulamada kimliği doğrulanmış ve kendi abonelik verilerinin sahibi olan kişidir.

### Profile

Kullanıcının ad, zaman dilimi, dil, tema ve bildirim varsayılanlarını içerir.

### Service

Netflix, Spotify veya ChatGPT gibi hazır katalog girdisidir. Bir abonelik katalog servisine bağlı olmak zorunda değildir.

### Subscription

Kullanıcının takip ettiği ücretli üyelik, ücretsiz deneme veya yinelenen hizmet kaydıdır.

### Billing Schedule

Aboneliğin tutarını, para birimini, fatura döngüsünü ve sonraki beklenen yenileme tarihini tanımlar.

### Renewal Occurrence

Belirli bir aboneliğin belirli bir tarihte gerçekleşmesi beklenen tek yenileme olayıdır. Bildirim tekrarını önlemek için abonelikten ayrı kimliği vardır.

### Notification Rule

Kullanıcının bir olaydan kaç gün önce, hangi kanaldan bildirim almak istediğini tanımlar.

### Notification Delivery

Bir bildirimin belirli bir kanala gönderilme denemesidir.

### Savings Event

İptal, plan düşürme veya durdurma nedeniyle hesaplanan tahmini tasarruf kaydıdır.

## 3. Abonelik durumları

| Durum | Anlam |
|---|---|
| `TRIAL` | Henüz ücretli döneme geçmemiştir |
| `ACTIVE` | Yenilenmesi beklenen aktif aboneliktir |
| `PAUSED` | Geçici olarak durdurulmuştur; yenileme beklenmez |
| `CANCELLED` | Gelecek yenileme iptal edilmiştir; erişim bir süre devam edebilir |
| `EXPIRED` | Erişim sona ermiştir |
| `ARCHIVED` | Geçmiş kayıt olarak saklanır ve aktif listelerde varsayılan görünmez |

### İzin verilen temel geçişler

```text
TRIAL → ACTIVE | CANCELLED | EXPIRED | ARCHIVED
ACTIVE → PAUSED | CANCELLED | ARCHIVED
PAUSED → ACTIVE | CANCELLED | ARCHIVED
CANCELLED → ACTIVE | EXPIRED | ARCHIVED
EXPIRED → ACTIVE | ARCHIVED
ARCHIVED → ACTIVE | PAUSED | CANCELLED | EXPIRED
```

Geçişlerin tamamı `subscription_events` ile kaydedilir.

## 4. İptal, bitiş ve silme farkı

- `cancelled_at`: Kullanıcının yenilemeyi iptal ettiği zaman
- `access_ends_at`: Servise erişimin sona ereceği zaman
- `archived_at`: Kaydın ana listeden kaldırıldığı zaman
- Fiziksel silme: Yanlış oluşturulmuş kayıt veya yasal veri silme dışında normal kullanıcı akışı değildir

## 5. Para kuralları

- Para değeri binary floating point ile saklanmaz.
- Tutar ve para birimi birlikte anlamlıdır.
- Farklı para birimleri otomatik olarak toplanmaz.
- Gösterim mobil istemcide locale'e göre yapılır.
- API para tutarını string olarak döndürür: `"279.99"`.

## 6. Aylıklaştırma kuralları

| Döngü | Aylık tahmin |
|---|---|
| Weekly | `amount × 52 / 12` |
| Monthly | `amount` |
| Quarterly | `amount / 3` |
| Semiannual | `amount / 6` |
| Yearly | `amount / 12` |
| Custom | Yıllık occurrence sayısına göre |
| One-time | Aylık tekrar toplamına dahil edilmez |

Yıllık tahmin, aylık tahmin × 12 olarak hesaplanabilir. Yuvarlama yalnızca görüntüleme sınırında yapılır.

## 7. Yenileme tarihi kuralları

- Veritabanında zaman UTC tutulur.
- Kullanıcıya yerel zaman diliminde gösterilir.
- Tarih bazlı üyeliklerde kullanıcının yerel gün başlangıcı dikkate alınır.
- Ay sonunda başlayan aylık üyelik için sonraki ayın son geçerli günü kullanılır.
- Örnek: 31 Ocak → 28/29 Şubat → 31 Mart niyeti korunmalıdır.
- Yenileme tarihi sessizce ilerletilmemelidir; occurrence oluşturma yaklaşımı kullanılmalıdır.

## 8. Bildirim kuralları

- Sadece kullanıcının açık kanalları kullanılır.
- `CANCELLED`, `EXPIRED` ve `ARCHIVED` kayıtlar normal yenileme bildirimi üretmez.
- `PAUSED` kayıtlar varsayılan olarak bildirim üretmez.
- Aynı occurrence + kanal + bildirim tipi için tek teslimat kaydı olabilir.
- Trial uyarısı normal yenilemeden ayrı tiptir.
- Bildirime dokununca ilgili abonelik açılır.

## 9. Tasarruf kuralları

Bir abonelik iptal edildiğinde tahmini tasarruf:

- İlk yaklaşan yenilemeden itibaren hesaplanır.
- Para birimi bazında saklanır.
- Gerçekleşmiş finansal kazanç olarak sunulmaz; “tahmini” ifadesi kullanılır.
- Kullanıcı aboneliği yeniden aktif ederse önceki tasarruf olayı geçmişte korunur ancak aktif toplam buna göre güncellenir.

## 10. Trial kuralları

- `trial_end_at` zorunludur.
- Ücretliye dönüşecekse `regular_amount` ve `currency` önerilir.
- Trial bitişi yaklaşırken daha erken ve daha sık bildirim kuralı uygulanabilir.
- Trial sona erdiğinde kullanıcı onayı olmadan otomatik `ACTIVE` geçişi yapılmamalıdır; backend occurrence üretebilir ve kullanıcıya doğrulama sorabilir.

## 11. Katalog kuralları

- Service katalog girdisi kullanıcı aboneliğinin sahibi değildir.
- Katalog verisi değişse bile kullanıcının özel fiyatı ve notu korunur.
- İptal linkleri `last_verified_at` alanı taşır.
- Logo bulunamazsa uygulama adın ilk harfini gösterir.

## 12. Domain invariants

- `amount >= 0`
- `currency` geçerli ISO 4217 kodudur.
- `next_renewal_at`, aktif/trial kayıt için gereklidir.
- `trial_end_at`, `TRIAL` için gereklidir.
- `user_id` bütün kullanıcı verilerinde zorunludur.
- Bir kullanıcı başka kullanıcının entity kimliğiyle işlem yapamaz.
