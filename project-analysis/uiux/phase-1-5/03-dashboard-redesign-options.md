# Dashboard: üç bilgi mimarisi

Kaynak: [DashboardScreen](../../../expo/src/features/dashboard/ui/DashboardScreen.tsx), [HeroCard](../../../expo/src/features/dashboard/ui/HeroCard.tsx), [AttentionSection](../../../expo/src/features/dashboard/ui/AttentionSection.tsx), [UpcomingTimeline](../../../expo/src/features/dashboard/ui/UpcomingTimeline.tsx), [CategoryBarCard](../../../expo/src/features/dashboard/ui/CategoryBarCard.tsx). Mevcut ekran abonelik ve ödeme sorgularını ayrı kullanır; ödeme verisi `undefined` iken özet kullanılamıyor gösterir. Tasarımlar öneridir; sahte değer göstermez.

## Yerleşimler

**A — Hesap özeti:** `Ay / para birimi → kalan tutar → ödenen / toplam → dikkat gerektirenler → yakın tarihler → kategori özeti → abonelikler / ekle`. En az yüzey; rakam ve satır ayracı baskın. Dikkat gerektiren kayıt sayısı çoksa ilk üç ve tamamına geçiş.

**B — Karar odaklı editorial:** `Ay + kalan tutar → durum ve ödenen/toplam → varsa karar satırı → tarihe göre yaklaşanlar → kayıt özeti ve ekle → yalnız anlamlıysa kategori`. Farklı bölümlerde farklı kompozisyon; başlık ve tarih, dekoratif görselden güçlüdür. Dikkat satırında detay ve onaylı eylem ayrı dokunma hedefidir.

**C — Kontrol merkezi:** `Para birimi seçimi → kompakt kalan / ödenen → öncelikli işlem listesi → tarihli yakın kayıtlar → ekle / tümü → analitik bağlantısı`. Yoğun veri ve çoklu kayıtta daha fazla bilgi; küçük ekran ve büyük yazı testine bağlı.

## Senaryo matrisi

Her hücre `birincil bilgi → birincil eylem` biçimindedir. A/B/C seçeneklerinin herhangi biri kullanıcıyı otomatik ödeme, banka bağlantısı veya sessiz yenilemeye yönlendirmez.

| Senaryo | A | B | C |
|---|---|---|---|
| Hiç abonelik yok | Henüz kayıt yok → ilk aboneliği ekle | Ne takip edileceği kısa açıklama → ilk aboneliği ekle | Boş kayıt listesi → ekle; CSV ikincil |
| Tek abonelik | Kalan ve tek sonraki tarih → kaydı aç | Kalan tutar + isim/tarih satırı → kaydı aç | Kompakt durum + kayıt → kaydı aç |
| Birden fazla | Seçili para biriminde kalan + yakın tarih → listeyi aç | Kalan + en önemli tarih/karar → ilgili kaydı aç | Kalan + işlem sırası → öncelikli kaydı aç |
| Tüm ödemeler tamam | Kalan sıfır, ödenen/toplam ve tamam etiketi → yaklaşan kayıtlara bak | Kalan sıfır ve sade onay metni → sonraki tarihi incele | Kompakt sıfır ve tamam etiketi → listeye geç |
| Gecikmiş | Gecikme sayısı ve tutar ayrı → ilgili kaydı incele | Gecikme satırı (ad/tarih/tutar) → incele; ödendi ayrı onay | Gecikmiş işler sıralı → incele; ödendi onay |
| Deneme bitişi | Deneme bitiş tarihi → kaydı aç | Deneme satırı + tarih → denemeyi değerlendir | Deneme işi + tarih → kaydı aç |
| Çok para birimi | Her birim ayrı, seçili birim açık → birim değiştir | Birincil birim ve diğer birimler ayrı satır → birim seç / kayıtları gör | Açık birim seçici, ayrı değerler → birim seç |
| Ödeme geçmişi yüklenemiyor | Ödenen/toplam bilinmiyor → yeniden dene | Eksik veri açıklaması; bilinen kayıtlar ayrı → yeniden dene | Kompakt hata ve erişilebilir eylem → yeniden dene |
| Offline | Önbellekte doğrulanmış son veriler ve offline işareti → kayıtları incele | Offline işareti + eldeki veri; eksik alan bilinmiyor → kayıtları incele | Offline şerit + mevcut işler → kayıtları incele |

**Tasarım bağımlılıkları:** Birden çok para biriminde varsayılan seçim kararı açıktır. Ödeme sorgusunu doğrudan yeniden deneme şu an mevcut ana ekran `refetch` davranışıyla doğrulanmış değildir; bu satır öneridir. Önbellek zamanı yalnız uygulamada güvenilir şekilde mevcutsa gösterilir. Boş durumda yalnız etkin olmayan kayıt varsa “ilk kayıt” metni koşulsuz kullanılmamalı. Ödenen durumu kullanıcı onayıyla işlenir ve yeni veri sözleşmesi çıkarılmaz.

**Kabul:** üç yön aynı anonim fixture ile küçük/büyük telefon ve light/dark'ta karşılaştırılır; 3 saniyede kalan, sonraki tarih ve eylem anlama oranı ölçülür. Kategori tek öğeyken dekoratif %100 bar gösterme zorunluluğu yok; gerçek ödenen oranı verisi varsa erişilebilir metinle sunulabilir. Daha fazla kategori/para birimi gizlenirse bunun fark edilmesi test edilir. [Kanıt matrisi](07-visual-evidence-and-acceptance.md).
