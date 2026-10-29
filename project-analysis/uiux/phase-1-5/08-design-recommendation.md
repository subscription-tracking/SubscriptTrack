# Tasarım önerisi ve kararlar

## Öneri: B — Editorial Premium, A'nın sakinliğiyle

**B yönünü seçmeyi öneriyorum.** Kalan tutar, bir sonraki karar ve tarihli kayıtlar arasında güçlü, tekrarlanabilir bir ritim kuruyor. Bunun marka imzası olması için büyük font tek başına yeterli değil: düz zemindeki finansal özet, gerektiğinde ortaya çıkan karar satırı ve tarih gruplu servis kimliği birlikte uygulanmalı. A'nın yüzey disiplini B'nin gereksiz boşluk veya büyük tipografi riskini sınırlar. C'nin hızlı filtre ve yoğun liste yaklaşımı yalnız çok kayıtlı liste gibi ihtiyaç gösteren ekranlarda kullanılabilir.

Bu bir **tasarım hipotezi**: üç alternatif de aynı anonim fixture ve cihaz matrisiyle prototiplenip test edilmeden üstünlük kanıtlanmış değildir. Kaynak ve durum sınırları [01](01-visual-design-strategy.md), öneriler [02](02-three-design-directions.md), ekran ve senaryo çalışmaları [03](03-dashboard-redesign-options.md), [04](04-screen-by-screen-redesign.md), doğrulama [07](07-visual-evidence-and-acceptance.md).

| Ölçüt | A Minimal Financial | B Editorial Premium | C Utility First |
|---|---|---|---|
| Ana görevin açıklığı | Sade ve öngörülebilir; çok uyarıda zayıflayabilir | Tutar ve sonraki kararı ayrı hiyerarşiyle ilişkilendirir | Çok işi görünür kılar; ilk bakış yoğunlaşabilir |
| Marka özgünlüğü | Tipografik hassasiyetle mümkün, anonim görünme riski | Farklı kompozisyon ve tarih/tutar ritmiyle en yüksek potansiyel | Etkileşim düzeniyle ayırt edilebilir; araç paneli hissi riski |
| Tek ve az kayıt | Sakin; fazla boş kalma riski | Bir kayıt ve sonraki eylemle güçlü kompozisyon adayı | Boş kontrol alanları gereksiz görünebilir |
| Çok kayıt / hız | Basit, daha fazla kaydırma riski | Öncelikli kararları öne alır; fazla içerikte listeye yönlendirir | Yoğun kayıt ve çoklu eylem için güçlü aday |
| Erişilebilirlik riski | Büyük boşluk ve sade öğeler avantaj; düşük kontrast riski | Büyük başlıkların font ölçeğinde taşması ve okuma sırası test edilmeli | Küçük yazı ve birbirine yakın hedef riski; 48 px korunmalı |
| Teknik maliyet | Mevcut token ve satırlara yakın | Mevcut temelde yeni kompozisyon varyantları ve iki tema testi | Liste/filtre yoğunluğu, performans ve erişilebilirlik testi daha yoğun |
| AI slop riski | Anonim, fazla boş şablon | Büyük hero, anlamsız dekoratif çizgiler ve tek tip premium kalıbı | Çok sayıda rozet, küçük çip ve sahte kontrol paneli |

## Onay gerektiren tasarım ve ürün kararları

1. **Görsel yön:** B önerisi mi, A mı, C mi; önce üç seçeneğin aynı dashboard fixture'larıyla görselleştirilmesi isteniyor mu?
2. **Para birimi önceliği:** çoklu para biriminde kullanıcı tercihi veya diğer seçim kuralı; asla para birimlerini toplama/kur dönüşümü yok.
3. **Marka varlıkları:** servis logoları için lisanslı/kullanım hakkı doğrulanmış kaynak mı, yoksa varsayılan monogram mı? Kişiye ait veya tescilli varlıklar hak kontrolü olmadan kullanılmaz.
4. **Kalıcı silme sözleşmesi:** kullanıcının onayladığı genel hedef mevcut [DOMAIN](../../../docs/product/DOMAIN.md) sınırından geniştir. Ödeme, tasarruf, bildirim ve denetim geçmişi; offline ve eski istemci davranışı ayrıca karara bağlanmadan UI/API uygulanmaz.
5. **Test ortamı:** kişisel veri içermeyen fixture hesapları/yerel veriler ve Android+iOS cihaz erişimi nasıl sağlanacak? Üretim verisi üzerinde çalışma bu stratejinin parçası değildir.

## Sonraki kapı

Bu belgeler uygulama sprinti, yeni bağımlılık veya API değişikliği yetkisi değildir. Önce yön ve yukarıdaki kararlar gözden geçirilir; sonra uygun görülürse seçilen yönde sentetik veriyle ekran prototipleri ve ölçülebilir kabul kanıtı hazırlanır. Uygulama planı veya kod çalışması ayrıca onaylanır.
