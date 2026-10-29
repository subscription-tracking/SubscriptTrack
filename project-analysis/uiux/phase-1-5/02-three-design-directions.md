# Üç tasarım yönü

Bu yönler aynı gerçek veriyi ve mevcut domain sınırlarını kullanır; aşağıdaki yerleşimler tasarım hipotezleridir. [Faz 1 ana sayfa kanıtı](../01-current-ui-audit.md) ve [mevcut tokenlar](../../../expo/src/shared/design/tokens.ts) temel alınır. Renk örnekleri ürün kararı veya kontrast onayı değildir.

| Boyut | A — Minimal Financial | B — Editorial Premium | C — Utility First |
|---|---|---|---|
| Karakter | Ölçülü, hesap özeti gibi güven veren | Finansal dergi sayfası gibi sakin ve karakterli | Hızlı karar veren yoğun kontrol merkezi |
| Renk | Nötr zemin, tek düşük yoğunluklu vurgu; durum rengi yalnız semantik | Nötr zemin, ölçülü marka tonu; başlık ve çizgiyle ritim | Nötr zemin, eylem/durum ayrımı güçlü; renk asla tek işaret değil |
| Açık/koyu | Eşit kontrastlı düz yüzeyler, sınır öncelikli | Her iki temada tutar ve boşluk hiyerarşisi eşit; tersine çevrilmiş renk otomatik yeterli sayılmaz | İki temada yüksek yoğunlukta satır/ayırıcı ayrımı; durum tonu test edilir |
| Tipografi | Rakam ve kısa etiketler; sınırlı boyut farkı | Büyük tutar, küçük açıklayıcı üst satır, belirgin bölüm başlıkları; tabular rakam | Orta boy rakam, güçlü satır başlığı ve yoğun yardımcı bilgiler |
| Yüzey | Çoğu içerik çizgilerle ayrılır; tek özet yüzeyi | Hero zemine oturur; tarihli satır, kompakt uyarı ve ayrı yüzey gerektiğinde kullanılır | Kompakt segment ve liste grupları; kritik eylem için sınırlandırılmış alan |
| Navigasyon | Mevcut dört sekme; birincil eylem bağlam içinde | Sekmeler korunur, ana sayfada doğal ekleme ve liste geçişi; başlık/boşluk ile yönlendirme | Sekmeler korunur; listede arama/filtre/seçim yakın, sık eylemler hızlı erişimde |
| İkon | En az simge, metinle beraber | Sınırlı tanınabilir çizgi dili; servis monogramı | İşlevi tanımlayan tutarlı simgeler ve açık etiketler |
| Grafik | Tek kategori metin, çok kategoride sade çubuk | Grafik yalnız karar taşıyorsa; metinsel özet ve gerektiğinde çubuk | Sıralanabilir satır/tablo öncelikli; grafik ikincil |
| Mikro etkileşim | Hafif durum geçişleri, dokunuş geri bildirimi | Bölüm açılma ve durum değişiminde kısa yönlendirici hareket | Arama/filtre/seçim sonucunun hızlı ve açık geri bildirimi |
| Özgünlük | Hassas oran, düzen ve veri dili üzerinden; abartısız | Başlık-tutar-tarih ritmi ve kompozisyon çeşitliliği üzerinden güçlü imza | Eylem ve veri organizasyonunun kalitesi üzerinden; verimlilik odaklı |
| AI slop riski | Aşırı boşluk ve anonim beyaz/koyu şablon | Büyük başlıklar, dekoratif çizgiler ve gereksiz boşluk aşırılığı | Aşırı rozet/kontrol, okunamaz yoğunluk ve küçük dokunma alanları |
| Uygulanabilirlik | Mevcut token/typography ve satırlarla yüksek olasılık; doğrulanmadı | Mevcut altyapıya kompozisyon varyantları eklenebilir; büyük font ve iki tema çalışması gerekir | Mevcut FlatList ve kontrollerle başlanabilir; 1000 kayıt ve erişilebilir yoğunluk ölçülmeli |

## Karşılaştırılabilir örnek kompozisyonlar

**A:** üstte `Bu ay · kalan` + tutar; altında ödenen/toplam metni; ince ayırıcı; yakın tarihler listesi; sonda kategori özeti. Eylem: listeye veya eklemeye açık bağlantı.

**B:** üstte tarih bağlamı; büyük kalan tutar ve küçük durum; hemen altında yalnız gerektiğinde gecikme/deneme karar satırı; tarih başlıkları altında yaklaşanlar; tek kategori satır, çok kategoride özlü dağılım. Ekranın odağı veri ve sonraki kararın ilişkisi.

**C:** üstte para birimi seçimi ve kompakt kalan/ödenen; hemen altında gecikmiş/deneme filtreli işlem satırları; kısa yaklaşan liste ve hızlı ekleme. Eylemler daha görünür, ancak küçük ekran ve büyük font riski daha yüksek.

Her yön için 0/1/çok kayıt ve offline varyantları [dashboard seçeneklerinde](03-dashboard-redesign-options.md) tanımlanır. Mevcut [BottomNavigation](../../../expo/src/shared/widgets/BottomNavigation.tsx), [AsyncStateView](../../../expo/src/shared/widgets/AsyncStateView.tsx), [GroupedList](../../../expo/src/shared/widgets/GroupedList.tsx) ve [tema](../../../expo/src/shared/design/ThemeProvider.tsx) başlangıç noktasıdır; bu aşamada yeni paket veya token kesinleştirilmez.
