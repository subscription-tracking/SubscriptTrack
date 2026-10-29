# Görsel tasarım stratejisi

Tarih: 28 Ekim 2026 · Çalışma ağacı: `main`, `dda0b6c` ve kullanıcı değişiklikleri. Bu belge tasarım önerisidir; görsel kabul, performans veya kullanıcı testi sonucu değildir. Dayanaklar: [ürün brifi](../../../docs/subscripttrack-uiux-plan/01-PRODUCT-AND-DESIGN-BRIEF.md), [kararlar](../../../docs/subscripttrack-uiux-plan/02-DECISIONS-AND-GUARDRAILS.md), [Faz 1](../01-current-ui-audit.md), [Expo tasarım sistemi](../../../docs/expo/DESIGN_SYSTEM.md).

## Ürün fikri: sakin kontrol

SubscriptTrack, banka veya otomatik iptal hizmeti değil; kullanıcının elle yönettiği abonelikleri ve kararları görünür kılan bir mobil araçtır. Görsel kimlik **tutar + tarih + karar** üçlüsünü tek bakışta okumaya dayanır. Öneri: finansal veriyi editorial bir düzen içinde, eylemi ise doğrudan ve açık sunmak. Bir aboneliği temsil eden servis adı, monogramı, sonraki tarihi ve tutarı kimlik taşıyan tekrar edilebilir görsel öğelerdir; süs amaçlı illüstrasyon veya sahte grafik değildir.

## Tasarım ilkeleri

1. **Gerçeği göster:** ödeme geçmişi yüklenmediyse bilinmiyor de; tahmini aylık eşdeğeri gerçekleşmiş harcama gibi gösterme. Para birimleri ayrı; `Money` ve sivil tarih kuralları korunur. Kaynak: [DashboardScreen](../../../expo/src/features/dashboard/ui/DashboardScreen.tsx), [dashboardHero](../../../expo/src/features/dashboard/domain/dashboardHero.ts).
2. **Bir ekran, bir ana görev:** ana sayfa durumu anlama, liste kayıt bulma, detay tek kaydı yönetme, form doğru veri girme içindir. İkincil eylemler aynı vurgu seviyesinde yarışmaz.
3. **Ritim farklı, dil ortak:** toplam rakamı düz zemin üzerinde; yaklaşan olayları tarihli satırlarda; ayarları gruplu listede; tehlikeli eylemleri ayrılmış alanda göster. Her bölümü aynı kart içine koyma.
4. **Boşluk işlev taşır:** başlık, tutar ve kontrol arasındaki boşluk hiyerarşiyi gösterir; az veride ekranı dev boş kartlarla doldurmak yerine yararlı sonraki eylem sunulur.
5. **Durum renk ve metinle:** gecikmiş, deneme, tamamlandı ve offline durumlarında metin/ikonla birlikte semantik renk kullan; kategori renkleri durum renklerinden ayrı düşünülür.
6. **Hareket sonucu açıklar:** seçim, açılma veya işlem sonucunu destekleyen kısa hareket; sistem reduce-motion tercihine uyum. Sürekli parıltı ve dekoratif dönüş yok.

## Önerilen görsel sözlük

- **Tipografi:** mevcut [Hanken Grotesk rolleri](../../../expo/src/shared/design/typography.ts) başlangıç noktası. Finansal tutarda tabular rakam, kısa etiket ve yeterli satır yüksekliği; çok uzun tutarda küçültme yerine sarılma/alternatif yerleşim prototipi.
- **Renk:** mevcut semantik [palette ve tokenlar](../../../expo/src/shared/design/tokens.ts) ile prototiple; yeni marka rengi yalnız her iki temada metin ≥4,5:1 ve kontrol sınırı ≥3:1 doğrulandıktan sonra seçilir. Tonlar bu aşamada onaylanmış değildir.
- **Yüzey:** zemin üzerine metin ve ayırıcı varsayılan; sınırlandırılmış yüzey yalnız işlem grubu, modal veya kritik özet için. Gölge/gradient kalite göstergesi değildir.
- **İkon/servis kimliği:** mevcut Material setinden tutarlı sınırlı sözlük; ticari marka hakları doğrulanmış logo varsa kullan, yoksa erişilebilir ad içeren monogram. Logonun adı tek başına ekran okuyucuya bırakılmaz.
- **Grafik:** tek kategoride sayı + kategori; iki veya daha çok kategoride erişilebilir metin özetiyle oran grafiği. Birden çok para birimi aynı toplamda birleştirilmez. Trend ancak kaynağı ve aralığı gerçekse sunulur.
- **Android/iOS:** ortak bilgi mimarisi, platformun klavye, tarih seçici, güvenli alan ve geri davranışına uyum. Native his görsel benzerlik iddiasıyla ölçülmez.

## Bilgi ve durum sözleşmesi

`bilinmiyor` ≠ `0` ≠ `yok`; gecikme, deneme bitişi ve ödenmiş durum birbirinden ayrı etiketlerdir. İstek işleniyorsa tek eylem için bekleme/engelleme, başarısızsa anlaşılır hata ve tekrar dene; offline ise önbellek zamanı/varlığı doğrulanabiliyorsa açık göster, doğrulanamıyorsa zaman uydurma. Silme, arşiv, iptal, hesap silme ayrı dil ve onay gerektirir; kalıcı silme kapsamı açık karardır ([DOMAIN](../../../docs/product/DOMAIN.md), [guardrails](../../../docs/subscripttrack-uiux-plan/02-DECISIONS-AND-GUARDRAILS.md)).

## Tasarım değerlendirme kapısı

Her öneri için aynı sentetik verilerle 0/1/çok kayıt, hata/offline, iki tema, küçük/büyük ekran, büyük font, ekran okuyucu ve reduce motion karşılaştırılır. Ana göreve erişim adımı ve ilk anlama süresi mevcut sürümle ölçülür; 3 saniye hedefi test hipotezidir, gerçekleşmiş sonuç değildir. Ayrıntı: [kanıt matrisi](07-visual-evidence-and-acceptance.md). Üç yön: [02](02-three-design-directions.md); öneri: [08](08-design-recommendation.md).
