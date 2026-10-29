# Abonelik detay tasarımı - 23 Ekim 2026

## Değişiklikler

- Tam ekran kırmızı/SVG üst bant kaldırıldı. Ortak tema zemini, logo çevresinde servis rengi, ayrı ad/fiyat/kategori satırları kullanılır. Uzun servis adı sarılır. Geri, düzenle ve menü mevcut minimum 48 dp hedefini korur.
- Son ödemeler ve Tümünü gör aynı başlık satırındadır; dar ekranda kontrollü alt alta geçer.
- Kartlar ortak yüzey, md köşe, düzenli kenarlık ve md dolgu kullanır.
- Alt ve yatay safe-area değerleri kaydırılabilir alanın dışına uygulanır; iptal butonu OS gezinme alanına girmez. Gereksiz alt sekme yüksekliği kaldırıldı.
- Tahmini yıllık maliyet mevcut Money hesabını kullanır; finansal hesaplama değiştirilmedi. Toplam ödenen yalnız aynı para birimindeki PAID olaylarını toplar. Kayıtlı `kart` metni yalnız sunumda Kart olarak gösterilir.
- Ortak ListRow bileşenine isteğe bağlı ikon ve dikey yerleşim eklendi. Küçük ekran veya fontScale > 1.2 olduğunda detay özeti, ödeme kartı ve bilgi satırları dikey görünür.
- Ödeme geçmişi yükleniyor/hata/boş ayrımı ve tekrar yükleme eklendi; bilinmeyen toplam sıfır gösterilmez. Genel abonelik loading/error/empty ve shell offline davranışı korunur.

## Doğrulama

- İlk detay/domain paketi: 2 suite / 16 test geçti; sonrasında ödeme loading/error ve uzun ad/Kart gösterimi için üç senaryo eklendi.
- Typecheck ve lint başarılı.
- Son tam Expo paketi: 141 suite / 887 test başarılı. Doküman kontrolü `--working-tree` ile temiz.
- Samsung SM-S711B, Expo Go: Netflix detayının normal görünümü, ödeme geçmişi ve iptal butonunun güvenli alanda görünümü incelendi.
- Cihazda font_scale 1.3 ve 900x1950 ekran override ile dar/büyük yazı görünümü incelendi; özetler ve bilgi satırları dikey, tutarlar görünür. Sayfa sonuna kaydırılarak iptal butonunun erişilebilirliği görüldü.
- Mobil veri kısa süre kapatıldı: çevrimdışı açıklaması ve cache'teki Netflix bilgileri görünür kaldı. Ardından veri yeniden açıldı; font_scale 1.0 ve fiziksel 1080x2340 ekran boyutu geri getirildi.
- Yerel ekran kanıtları `.local/detail-*-20261023.png` altında tutulur; kişisel cihaz ekranları Git'e eklenmez.
- iOS native cihaz turu yapılmadı. Backend, Flutter, gerçek abonelik veya ödeme kayıtları değiştirilmedi.
