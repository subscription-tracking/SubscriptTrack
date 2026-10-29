# Görsel kanıt ve kabul matrisi

## Mevcut kanıt ve sınırı

Bu fazda kişisel veri içermeyen doğrulanmış fixture oturumu yoktu; mevcut bağlı cihazın kullanıcı verisine erişilmedi, yeni ekran görüntüsü alınmadı. [22 Ekim fiziksel Android raporu](../../../docs/quality/android-physical-acceptance-2026-10-22.md) ve [23 Ekim detay raporu](../../../docs/quality/subscription-detail-redesign-2026-10-23.md) tarihli/kısmi kanıttır, güncel tüm ekran kabulü değildir. Faz 1 kod temelli puanlar görsel puan değildir. Grafikler veya tasarım yönlerinin başarıları ölçülmedi.

## Anonim fixture sözleşmesi

İzole, açıkça test amaçlı hesap veya yerel fixture; gerçek kişi, e-posta, gerçek servis hesabı ve ödeme yöntemi verisi yok. Önce yetkili bir test ortamında fixture'ların kaynağı ve sıfırlama biçimi belgelenir; üretim verisi okunmaz/yazılmaz. İçerikler sentetik servis adları, farklı uzunluklar, deneme ve durumlar kullanır. Aynı tutarlar üç tasarım seçeneğinde aynı kalır; test verisi tahmini veya gerçekleşmiş etiketini doğru taşır. Çok para birimi TRY/USD/EUR ayrı, kur dönüştürülmez. Ekran görüntülerinde durum çubuğu veya cihaz bildirimiyle kimlik sızıntısı kontrol edilir.

## Yakalama matrisi

Her satır için **önce/sonra**, açık/koyu tema ve Android+iOS gerekir. Küçük/büyük ekran örnekleri hedef: yaklaşık 360×780 ve 430×930 mantıksal piksel; gerçek cihaz boyutu, OS, ölçek ve güvenli alan rapora kaydedilir. Bu sayılar cihaz bulunabilirliğine göre örnektir, piyasadaki belirli modellerin ölçüsü iddiası değildir. Büyük font için sistem varsayılanı ve en az 1,3×; daha büyük ayar destekleniyorsa ayrıca. Her durumun tüm çapraz kombinasyonları otomatik olarak test edildiği varsayılmaz.

| Ekran / akış | Fixture ve çekilmesi gereken durum | Ek kabul |
|---|---|---|
| Dashboard | 0, 1, çok; tümü tamam; gecikmiş; trial bitişi; çok birim; ödeme yüklenemiyor; offline/önbelleksiz; loading/error | A/B/C aynı fixture; ilk görünür ekranda birincil bilgi/eylem ve kaydırma altı görüntüsü. |
| Liste | 0, 1, 1000 sentetik kayıt; sonuç yok; filtre aktif; seçim; offline | Arama/filtre, ekran okuyucu seçili durumu ve kaydırma ölçümü. |
| Detay | uzun ad, büyük tutar, aktif/trial/cancelled/archived; boş/yüklenmeyen ödeme geçmişi | Menü, onay, çok para birimi ve satır taşması. |
| Ekle/düzenle | ilk kayıt, uzun metin, doğrulama hatası, tarih sonu, keyboard açık, bekleyen kayıt | iOS/Android tarih seçici, focus, para birimi, kaydetmeden geri. |
| İstatistik/ödeme geçmişi/tasarruf | 0/1/çok, eksik ödeme, tek/çok kategori, çok para birimi | Gerçek/tahmini ayrımı, grafik metin eşleniği, uzun liste. |
| Takvim | boş ay, tek/çok olay, gecikme, trial, ay sonu/DST | Her gün etiketi, seçili durum ve olay sayısı VoiceOver/TalkBack. |
| Bildirim merkezi/tercih | boş/çok, okunmamış, izin reddi, saat seçimi, offline | Android/iOS yerel izin, cold-start, geri dönüş; test bildirimi sentetik. |
| Auth/onboarding | her sayfa, uzun metin, alan hata, keyboard, geçersiz callback | Uygulama kilidi, odak ve reduce motion. |
| Ayarlar/profil/görünüm/ödeme yöntemi | normal, bekleyen, hata, büyük yazı | Tema geçişi, seçim durumu, uzun etiket. |
| Kilit/gizlilik/export/hesap silme | biyometri iptal, PIN hata, export hata/offline, silmeden vazgeçme | Gerçek hesap silme yapılmaz; test ortamı ve açık yetki gerekir. |
| CSV/iptal rehberi/geri bildirim/yasal | örnek ve hata, dış bağlantı, uzun metin, keyboard | Dosya seçici platformları, sahte otomatik iptal iması yok. |

## Kabul koşulları ve ölçüm kaydı

- **Bilgi:** Kullanıcıya 0/1/çok kayıtta kalan, ödenen ve sonraki olayın ne olduğu sorulur. 3 saniye hedefi hipotezdir; katılımcı sayısı, görev, başarı ve süre kaydedilir; kanıt olmadan “3 saniyede anlaşılır” denmez.
- **Doğruluk:** Bilinmeyen ödeme verisi sıfır olarak sunulmaz; TRY/USD/EUR ayrı; trial ve gecikme açık; gecikme kullanıcı onayı olmadan ilerlemez. Fixture hesaplarına karşı beklenen değerler kayıt altına alınır.
- **Erişilebilirlik:** Metin kontrastı ≥4,5:1, anlamlı kontrol sınırı ≥3:1; tüm etkileşimli hedefler mevcut sözleşmeye göre ≥48 px. Ölçüm aracı, tema ve renk eşleri kaydedilir. TalkBack/VoiceOver odağı, durum duyurusu, modal geri dönüşü ve grafik metni manuel doğrulanır.
- **Yerleşim:** Güvenli alan, keyboard, uzun isim ve sistem yazısı taşma/kırpma olmadan; tutar sadece küçültülerek görünür kılınıyorsa okunabilirlik ayrıca kabul edilir.
- **Hareket/perf:** Reduce-motion açıkken alternatif; ekran açılışı ve 1000 kayıt kaydırması aynı cihaz/build/fixture ile önce ve sonra ölçülür. P95/başlangıç ve yöntem belirlenmeden kazanım iddia edilmez.
- **Durumlar:** Loading, error/retry, empty ve offline/queue sonuçları ayrıdır. Hesap ve uygulama kilidi sırasında hassas içerik gizlenir.

Her kanıt için: tarih, commit ve dirty diff, build/SDK, cihaz/OS, mantıksal boyut/font, tema, fixture kimliği, eylemler, beklenen/gözlenen sonuç, görüntü konumu, test eden ve açık sorun. Görseller yalnız güvenli konumda tutulur; bu dosya onların var olduğunu varsaymaz.
