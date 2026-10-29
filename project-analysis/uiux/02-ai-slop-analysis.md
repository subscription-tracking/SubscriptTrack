# Özgünlük ve AI slop incelemesi

Bu belge görsel kabul değil, kaynak kodu ve `docs/subscripttrack-uiux-plan/01-PRODUCT-AND-DESIGN-BRIEF.md` üzerinden hipotezlerdir. **K** kod kanıtı, **Ç** tasarım çıkarımı, **?** görsel inceleme eksikliği.

| Gözlem | Kanıt | Yorum ve doğrulama |
|---|---|---|
| Ana tutarın tamamlandı mesajıyla yer değiştirmesi | K: `expo/src/features/dashboard/ui/HeroCard.tsx:50-69` | Ç: kullanıcının bakiyeyi hızlı taramasını zayıflatabilir. Tamamlanmış ve kısmi ödeme senaryolarında karşılaştırmalı test yapılmalı. |
| Benzer kart yüzeyleri | K: `HeroCard.tsx` ve `CategoryBarCard.tsx` yüzey, sınır ve köşe kullanır. | Ç: ardışık bölümlerde monotonluk riski var; tüm kartların tek tip olduğu cihaz kanıtlanmadı. Görev önemine göre yüzey ritmi araştırılmalı. |
| Tek kategorili tam çubuk | K: `CategoryBarCard.tsx:17-35` pozitif tek giriş için de `StackedBar` üretir. | Ç: karşılaştırma sunmadığı durumda görsel ağırlığı faydasını aşabilir. Metin özeti ile karşılaştırılmalı. |
| İlk para birimi ve dört lejant | K: `dashboard/domain/dashboardHero.ts:60-65`, `CategoryBarCard.tsx:35` | Ç: kullanıcı gösterilmeyen para birimleri veya kategorileri anlamayabilir. Grafik gerçek verilidir; sahte olduğu iddia edilmez. |
| Ekleme eylemi | K: `DashboardScreen.tsx:97-120` içeriğinde boş durum eklemeye yönlendirir. | ?: diğer kabuk eylemleri ve kullanıcı testinde ana sayfadan erişim adımı incelenmeli. |
| Sahte ödenen tutar | K: `HeroCard.tsx:34-44` mevcut değilken eksik veri mesajı gösterir. | Güçlü parça: gösteriş uğruna bilinmeyeni sıfıra çevirmeme. |
| Dekoratif glow/sparkle | `expo/src/shared/widgets/GlowOrb.tsx`, `AmbientBackground.tsx`, `EntranceFade.tsx` mevcut. | K: dosyaların varlığı. ?: hangi ekranlarda ne yoğunlukta kullanıldıkları ve görsel etkisi bu incelemede ölçülmedi; sırf adlarından kusur çıkarılamaz. |
| Özgün marka | K: `shared/design/typography.ts` Hanken Grotesk rolleri; mevcut Material ikonları. | Ç: tipografi ve ikon tek başına özgünlük sağlamaz. Kullanıcı bağlamı ve ekranlar arası kompozisyonla markalaşma araştırılmalı. |

## Yön ve sınırlar

- Gerçek kullanıcı verisi bulunmadığında tahmini başarı, trend, yüzde ya da dekoratif çizgi üretilmemeli.
- Sıfır, tek ve çok kayıt aynı boş kart şablonuyla ele alınmamalı; her durumda sıradaki görev belirlenmeli.
- Kategori, durum ve tema renkleri anlamsal olarak ayrılmalı; tek renk teması bir amaç değil okunabilirlik ve ayırt edilebilirlik için araçtır.
- Animasyonun amacı ve reduce-motion karşılığı belirlenmeli. `shared/widgets/useGrowIn.ts:19` yalnız bu hook için hareket azaltma sorgusu kanıtıdır.
- Ürün “premium” algısına dair puan verilmedi: güncel Android/iOS ekran görüntüleri, karşılaştırma ve kullanıcı testi yoktur.
