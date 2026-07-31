# Product Requirements — SubscriptTrack

## 1. Vizyon

İnsanlar Netflix, Spotify, Adobe, ChatGPT, bulut depolama ve çeşitli SaaS araçları gibi birçok servise abone olur. Yenileme tarihleri unutulur, ücretsiz denemeler ücretliye dönüşür ve kullanılmayan abonelikler aylarca fatura kesmeye devam eder.

**SubscriptTrack**, kullanıcının bütün dijital aboneliklerini mobil cihazında tek merkezde görmesini; yenilemelerden önce karar vermesini ve iptal ettiği giderlerden oluşan tasarrufu takip etmesini sağlar.

## 2. Ürün konumlandırması

> Banka hesabını bağlamadan tüm aboneliklerini iOS ve Android'de takip et. Yenilemeler ve ücretsiz denemeler yaklaşınca bildirim al, iptal seçeneklerine ulaş ve ne kadar tasarruf ettiğini gör.

SubscriptTrack yalnızca abonelik listesi değildir. Ürünün temel döngüsü:

```text
Görünürlük → yaklaşan risk → karar → tasarruf → tekrar kullanım
```

## 3. Hedef kullanıcılar

### Birincil

- Birden fazla dijital araç kullanan freelancer ve bağımsız çalışanlar
- Farklı para birimleriyle abonelik ödeyen dijital göçebeler
- Çok sayıda eğlence, oyun ve teknoloji aboneliği bulunan bireysel kullanıcılar

### İkincil

- Aile içindeki ortak dijital üyelikleri takip etmek isteyen kullanıcılar
- Kendi kişisel SaaS maliyetini izleyen geliştiriciler ve içerik üreticileri

### MVP dışındaki hedef

- Takım çapında lisans ve SaaS gideri yöneten küçük işletmeler

## 4. Platform kararı

| Konu | Karar |
|---|---|
| Birincil platform | iOS ve Android mobil uygulama |
| Destekleyici platform | Pazarlama, SEO, yardım ve iptal rehberi odaklı web sitesi |
| Birincil bildirim | Mobil push bildirim |
| İkincil bildirim | Uygulama içi bildirim ve isteğe bağlı e-posta |
| Veri yaklaşımı | Bulut senkronizasyonlu; çevrimdışı son veriyi görüntüleyebilme |
| Para birimi | Kullanıcı girişi; MVP'de otomatik kur dönüşümü yok |
| Banka bağlantısı | Kalıcı non-goal |

## 5. Ana ürün ilkeleri

1. İlk abonelik üç dakikadan kısa sürede eklenebilmelidir.
2. Kullanıcı ilk oturumda aylık ve yıllık toplamını görebilmelidir.
3. Bildirimler bilgi vermekle kalmamalı, ilgili abonelik aksiyonuna götürmelidir.
4. Kullanıcı verisi başka kullanıcılarla karışmamalıdır.
5. Para birimleri dönüşüm yapılmadan ayrı toplamlar halinde gösterilmelidir.
6. Silme yerine geçmişi koruyan durum değişiklikleri tercih edilmelidir.
7. Tasarım sistemi bütün ekranlarda ortak token ve bileşenlerden oluşmalıdır.

## 6. MVP kapsamı

### 6.1 Kimlik doğrulama

- E-posta ve şifreyle kayıt/giriş
- Google ile giriş
- iOS'ta Apple ile giriş
- Şifre sıfırlama
- Oturum yenileme ve güvenli çıkış
- Hesap ve verileri uygulama içinden silme

**Kabul kriterleri**

- Kullanıcı kayıt olabilir, giriş yapabilir ve çıkış yapabilir.
- Bir kullanıcı başka kullanıcının verisine erişemez.
- Hesap silme tamamlandığında kişisel veriler ürün politikasına uygun biçimde silinir veya anonimleştirilir.

### 6.2 Abonelik ekleme ve yönetme

Zorunlu alanlar:

- İsim veya hazır servis
- Fiyat
- Para birimi: TRY, USD, EUR, GBP; mimari diğer ISO 4217 kodlarına açık olmalıdır
- Fatura döngüsü: haftalık, aylık, üç aylık, altı aylık, yıllık, özel
- Sonraki yenileme tarihi
- Kategori

Opsiyonel alanlar:

- Ücretsiz deneme bilgisi
- Website ve hesap yönetim bağlantısı
- İptal bağlantısı
- Not
- Ödeme yöntemi etiketi
- Özel bildirim günü

Durumlar:

- `TRIAL`
- `ACTIVE`
- `PAUSED`
- `CANCELLED`
- `EXPIRED`
- `ARCHIVED`

**Kabul kriterleri**

- Kullanıcı abonelik ekleyebilir, görebilir, düzenleyebilir ve arşivleyebilir.
- Durum değişikliği geçmiş kaydı silmez.
- Yaklaşan yenileme listesi tarihe göre sıralanır.
- Yenilemesine yedi gün veya daha az kalan aktif kayıtlar vurgulanır.

### 6.3 Dashboard

Dashboard üzerinde:

- Para birimi bazında aylık tahmini toplam
- Para birimi bazında yıllık tahmini toplam
- Önümüzdeki yedi gündeki yenilemeler
- Ücretsiz denemeler
- Aktif abonelik sayısı
- İptallerden doğan tahmini tasarruf
- Okunmamış bildirim rozeti

Hesaplama:

- Aylık: `amount`
- Yıllık: `amount / 12`
- Haftalık: `amount × 52 / 12`
- Üç aylık: `amount / 3`
- Altı aylık: `amount / 6`

Yalnızca maliyete dahil edilmesi gereken aktif kayıtlar hesaplanır. Para birimleri birbirine çevrilmez.

### 6.4 Takvim

- Aylık takvim görünümü
- Gün bazında toplam ve abonelik listesi
- Normal yenileme, trial bitişi ve yüksek tutarlı yıllık ödeme ayrımı
- Takvim öğesine dokununca abonelik detayına geçiş

### 6.5 Bildirimler

- Backend tarafından planlanan push bildirim
- Uygulama içi bildirim merkezi
- İsteğe bağlı e-posta
- Kullanıcının kaç gün önce uyarılacağını seçmesi
- Bildirime dokununca ilgili aboneliğe deep link
- Aynı olay ve kanal için tekrar gönderim engeli
- Kullanıcının zaman dilimine göre teslimat

### 6.6 Ücretsiz deneme takibi

- Deneme bitiş tarihi
- Denemeden sonra uygulanacak normal fiyat
- Otomatik ücretliye dönüşüm bilgisi
- Trial bitişi için ayrı bildirim kuralları

### 6.7 İptal ve tasarruf

- Hesap/iptal bağlantısını açma
- “İptal ettim”, “Durdurdum”, “Kullanmaya devam et” aksiyonları
- İptal sonrası tahmini aylık ve yıllık tasarruf
- Tasarruf olaylarının geçmişte saklanması

### 6.8 Ayarlar

- Ad, soyad ve e-posta
- Tercih edilen para birimi
- Zaman dilimi
- Dil ve tema
- Push, uygulama içi ve e-posta tercihleri
- Varsayılan bildirim günü
- Veri dışa aktarma
- Hesap silme

## 7. Sistem kategorileri

| Kod | Kategori | Önerilen ikon |
|---|---|---|
| `ENTERTAINMENT` | Eğlence | `tv` |
| `MUSIC` | Müzik | `music` |
| `SOFTWARE` | Yazılım ve Araçlar | `code` |
| `CLOUD` | Bulut ve Depolama | `cloud` |
| `EDUCATION` | Eğitim | `book-open` |
| `BUSINESS` | İş ve Finans | `briefcase` |
| `HEALTH` | Sağlık | `heart` |
| `GAMING` | Oyun | `gamepad-2` |
| `OTHER` | Diğer | `tag` |

Kategori rengi ve durum rengi aynı token olarak kullanılmamalıdır.

## 8. MVP dışında

- Otomatik banka veya kredi kartı entegrasyonu
- Kullanıcı adına otomatik abonelik iptali
- Canlı kur dönüşümü
- Takım rolleri ve lisans/koltuk yönetimi
- Web üzerinde tam abonelik dashboard'u
- Gelişmiş yapay zekâ tavsiyeleri
- Fatura ve e-posta kutusundan otomatik tarama
- Native desktop uygulaması

## 9. Kalıcı non-goals

- Bankacılık şifresi veya kart bilgisi toplama
- Kullanıcı adına finansal işlem başlatma
- Kurumsal satın alma ve sözleşme pazarlığı
- Abonelik sağlayıcıları adına ödeme tahsil etme

## 10. Başarı metrikleri

| Metrik | Başlangıç hedefi |
|---|---:|
| Kayıt → ilk abonelik ekleme | 3 dakikadan kısa |
| Kullanıcı başına eklenen abonelik | En az 8 |
| İlk gün dashboard değer anına ulaşma | %70+ |
| 30 günlük aktif kullanıcı oranı | %40+ |
| Push bildirime izin verme | %60+ |
| Bildirim açılma oranı | %35+ |
| Kullanıcı başına iptal/durdurma aksiyonu | En az 1 |
| Bildirim tekrar hatası | %0 hedef |
| Crash-free session | %99,5+ |

## 11. Ana kullanıcı hikâyeleri

- Kullanıcı olarak Apple veya Google hesabımla hızlı giriş yapmak istiyorum.
- Yeni bir aboneliği birkaç dokunuşla eklemek istiyorum.
- Bu ay ve bu yıl ne kadar ödeyeceğimi para birimi bazında görmek istiyorum.
- Ücretsiz deneme ücretliye dönüşmeden önce bildirim almak istiyorum.
- Bir yenileme bildirimine dokunduğumda doğrudan ilgili aboneliğe gitmek istiyorum.
- Aboneliği iptal ettiğimde geçmişi korumak ve tasarrufumu görmek istiyorum.
- İnternet yokken son abonelik listemi görmek istiyorum.
- Verilerimi dışa aktarabilmek ve hesabımı silebilmek istiyorum.
