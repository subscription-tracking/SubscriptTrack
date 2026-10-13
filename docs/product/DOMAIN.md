# Domain Modeli ve İş Kuralları

## 1. Amaç

Bu dosya frontend, backend, tasarım ve test ekiplerinin aynı iş kavramlarını aynı anlamda kullanmasını sağlar.

## 2. Temel kavramlar

> **Kavram → veri eşlemesi (2026-09-30, canlı şema):** Bu belge iş kavramlarını ve kurallarını anlatır; alan adları kavramsaldır. Canlıda karşılıkları: User → Supabase Auth; Profile → `profiles`; Service → `service_catalog`; Subscription → `subscriptions`; **Billing Schedule ayrı tablo değildir**, `subscriptions` içindeki `amount`, `currency`, `billing_cycle`, `next_renewal_date` alanlarıdır; Renewal Occurrence → `renewal_occurrences`; Notification Rule → `notification_rules` ve `subscriptions.notification_rules` (jsonb); Notification Delivery → `notification_deliveries` (kullanılmıyor); Savings Event → `savings_events`. Metindeki `next_renewal_at` / `trial_end_at` canlıda `next_renewal_date` / `trial_end_date` (date) alanlarıdır. `cancelled_at`, `access_ends_at`, `archived_at` alanları **canlıda yoktur**: iptal/arşiv `status` ve `is_archived` ile temsil edilir. Ayrıntı: [DATA_MODEL.md](../reference/DATA_MODEL.md).

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

Başlangıç tarihi bugünden ileride olan `ACTIVE` veya `TRIAL` kayıtlar, kalıcı
yaşam döngüsü durumunu değiştirmeden istemcide türetilen **Henüz başlamadı**
sunum durumuyla gösterilir. Bu kayıtlar aktif harcama toplamına ve normal
yenileme bildirimlerine dahil edilmez; başlangıç günü geldiğinde mevcut kalıcı
durumlarıyla görünürler.

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

`CANCELLED → ACTIVE` kullanıcı onayıyla yeniden etkinleştirmedir. İptal anındaki geçmiş `savings_events` kaydı silinmez; yeniden etkinleştirme yeni tasarruf olayı üretmez. Detay ekranı yalnız mevcut durumdan izinli eylemleri gösterir.

## 4. İptal, bitiş ve silme farkı

- `cancelled_at`: Kullanıcının yenilemeyi iptal ettiği zaman
- `access_ends_at`: Servise erişimin sona ereceği zaman
- `archived_at`: Kaydın ana listeden kaldırıldığı zaman
- Fiziksel silme: Yanlış oluşturulmuş kayıt veya yasal veri silme dışında normal kullanıcı akışı değildir
- **Flutter durumu (2026-09-30, ürün kuralıyla çelişiyor):** Flutter detay ve çoklu seçim ekranı herhangi bir aboneliği kalıcı silebilir ([MOBILE.md §6](../architecture/MOBILE.md)). Ürün sahibi bu davranışın değiştirilip değiştirilmeyeceğini ayrıca onaylamadı; Expo'ya taşınmadı.
- **Expo kararı (2026-10-10, kullanıcı tarafından seçildi):** Kalıcı silme yalnız yanlış oluşturulmuş arşiv kaydının düzeltmesinde yapılır. Kullanıcı yanlış kayıt olduğunu açıkça doğrular; işlem çevrimdışı yapılamaz. Sunucuda nedeni doğrulayan alan bulunmadığından bu istemci beyanıdır ([ADR 0006](../decisions/0006-archive-over-delete.md)).

## 5. Para kuralları

- **Aktif para birimi:** Uygulama tek bir aktif para birimi kullanır: `TRY`, `USD` veya `EUR`. Etkin değer önce profildeki `preferred_currency` (yoksa bu cihazdaki son seçim, o da yoksa `TRY`). Ana sayfa, liste, takvim, istatistik, tasarruf ve ödeme geçmişi yalnızca aktif para birimindeki kayıtları gösterir; başka para birimindeki kayıtlar gizlenir ve listede kaç kayıt gizlendiği belirtilir. Kur çevrimi yapılmaz. Form varsayılanı aktif para birimidir.
- Para değeri binary floating point ile saklanmaz.
- Tutar ve para birimi birlikte anlamlıdır.
- Farklı para birimleri otomatik olarak toplanmaz.
- Gösterim mobil istemcide locale'e göre yapılır.
- API para tutarını string olarak döndürür: `"279.99"`.
- Abonelik tutarı sözleşmesi migration 033'te `0–1.000.000.000,00` CHECK'i olarak tanımlıdır; migration başlığı canlıya 10 Ekim'de uygulandığını bildirir, ancak bu kabul turunda canlı CHECK ayrıca sınanmadı ([API.md](../reference/API.md), [SUPABASE_LIVE_STATUS.md](../reference/SUPABASE_LIVE_STATUS.md)). Expo ve Flutter formu ile CSV içe aktarma aynı üst sınırı kuruş cinsinden doğrular. Bu alan sınırı, toplamlarda kullanılan genel `Money` aritmetik türünün üst sınırı değildir.

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
- **Flutter durumu (2026-09-30, ürün kuralıyla çelişiyor):** Flutter, yükleme sırasında gecikmiş aktif aboneliğin sonraki yenileme tarihini otomatik ilerletir (Excel Test 45, S39 kararı). 11 Ekim 2026'da kullanıcı Expo için yenilemenin yalnız açık onaydan sonra ilerletilmesini seçti; sessiz Flutter davranışı Expo'ya taşınmaz. Bu karar Flutter davranışını değiştirmez.

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
- Düzenlemede deneme durumu: aktif kayda deneme (bitiş tarihiyle) eklenirse durum `trial`, deneme kapatılırsa ve durum `trial` ise `active` olur; duraklatılmış, iptal, süresi dolmuş ve arşivlenmiş kayıtların durumu düzenlemeyle değişmez.
- Aynı isim serbesttir: ekleme formunda ad (kırpılmış, büyük/küçük harf duyarsız, tr-TR) silinmemiş bir kayıtla eşleşirse engellenmez, "Aynı isimde bir abonelik zaten var; yine de kaydedebilirsin." uyarısı gösterilir.

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
# Expo yerel kayıt sınırı — 12 Ekim 2026

Cache ve FIFO kuyruğunda yalnız alan tipi değil Money değeri, gerçek takvim tarihi, bilinen durum/kategori/döngü ve büyük harfli üç harfli para birimi doğrulanır. API'nin sıfır tutarı ve üst sınırı korunur; geçerli eski sayısal tutarlar ve EUR gibi para birimleri reddedilmez. Bozuk kayıt boş kuyruk gibi yorumlanmaz veya üzerine yazılmaz. Bu kontrol yeni bir ürün kuralı oluşturmaz; mevcut sözleşmeyi yerel veri sınırında uygular.

## Expo 59 senaryo sözleşmesi — 12 Ekim 2026

Ek (13 Ekim 2026): Yıllık toplam her kaydın yıllık eşdeğerinden tam sayı (minor unit) olarak hesaplanır (haftalık ×52, aylık ×12, üç aylık ×4, yıllık ×1); aylıktan türetilmiş yuvarlama kullanılmaz. Para birimi seçilmeden fiyat sıralaması önce para birimine (TRY, USD, EUR) göre gruplanır, grup içinde aylık eşdeğere göre sıralanır; kur dönüşümü yoktur. Bugün vadeli ve teslim saati geçmiş kayıt için tek seferlik yedek bildirim, gecikmiş aktif kayıt için günde bir vade geçti bildirimi planlanır.

**Expo için güncel kullanıcı kararı:** [Gereksinim, API/veri modeli ve dağıtım sözleşmesi](../quality/expo-59/CONTRACT.md). Önceki Expo anlatımıyla çelişen tarih, mantıksal silme, 1.000 kota, 2.000 not, tüm para birimleri, device/fixed bölge ve açık/koyu/sistem tema kurallarında bu sözleşme geçerlidir. Flutter mevcut uygulaması korunur. Kod hazırlığı canlı/native kabul anlamına gelmez.
