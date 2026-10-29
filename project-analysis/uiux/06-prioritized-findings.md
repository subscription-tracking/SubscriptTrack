# Öncelikli bulgular ve bağımlılıklar

P0 = veri güveni/geri alınamaz işlem veya kabul engeli; P1 = temel görev ve doğruluk; P2 = doğrulanması gereken kalite/optimizasyon. Sıralama uygulama yetkisi değil, denetim önerisidir.

| Öncelik | Bulgu | Kanıt / statü | Bağımlılık ve kabul sorusu |
|---|---|---|---|
| P0 | Genel kalıcı silmenin kapsamı belirsiz | `docs/subscripttrack-uiux-plan/02-DECISIONS-AND-GUARDRAILS.md`; `docs/product/DOMAIN.md:79-86`; `SubscriptionArchivedScreen.tsx:167`. Yeni karar mevcut kuralı genişletmek istiyor; sözleşme tamam değil. | Ödeme/tasarruf/bildirim geçmişi, offline ve eski Flutter/RLS uyumu kararı olmadan uygulama yok. |
| P0 | Finansal doğruluk ve kullanıcı onayı korunmalı | `dashboard/ui/HeroCard.tsx:34-44`; `docs/product/DOMAIN.md` yenileme kuralları. | Eksik ödeme verisi, farklı para birimleri, tarihi sessiz ilerletmeme ve offline kuyruk testleri görsel değişikliklerin ön koşulu. |
| P0 | İki platformda kabul açığı | `docs/quality/android-physical-acceptance-2026-10-22.md` tarihli sınırlı Android kanıtı; iOS kabulü açık. | Test verisi, küçük/büyük ekran, iki tema, font, TalkBack/VoiceOver, keyboard, offline ve reduce motion kanıtı. |
| P1 | Hero tutarının durum metniyle yer değiştirmesi | `HeroCard.tsx:50-69`; kod kanıtı. | Önce 0/1/çok ödeme ve çok para birimi örnekleri; sonra kullanıcı görev testi. |
| P1 | Ana sayfa ödeme verisi yeniden deneme beklentisi | `DashboardScreen.tsx:56,61`; yalnız abonelik refetch açıkça çağrılır. | Sorgu davranışının diğer tetiklerle gerçekten nasıl çalıştığını doğrula; eksik veri halinde retry akışını tasarla. |
| P1 | Kategori para birimi ve renk kimliği | `dashboardHero.ts:43-65`, `CategoryBarCard.tsx:20-35`; ilk para birimi, sıralama ve indeks rengi. | Tercih edilen para birimi kararı, 1/çok kategori ve renk sabitliği testleri. |
| P1 | Sıfır/aktif olmayan kayıtların ana sayfa mesajı | `DashboardScreen.tsx:90-120`; boş durum aktifler ve özet üzerinden türetilir. | Yalnız arşiv/iptal kayıtları için fixture ve kullanıcı akışı. |
| P1 | Liste çoklu silme etiketi | `SubscriptionListScreen.tsx:122-125`; eylem `Sil` olarak adlandırılmış. | `useDeletionAction` ve feature flag/backend semantiği doğrulanmadan kalıcı silme iddiası kurulmaz; onay metni veri yaşam döngüsü kararına bağlanır. |
| P1 | Görsel kabul öncesi kullanıcı değişiklikleri | `SubscriptionDetailScreen.tsx`, `detail/`, `GroupedList.tsx` çalışma ağacında değiştirilmiş. | Kullanıcı çalışması korunarak güncel baz görüntüleri ve testler alınmalı. |
| P2 | Tek kategorili grafik ve yinelenen yüzey ritmi | `CategoryBarCard.tsx`, `HeroCard.tsx`; özgünlük değerlendirmesi öznel. | Ekran görüntüleri ve görev testi; sırf dekoratif farklılık başarı sayılmaz. |
| P2 | 1000 kayıt performansı | `SubscriptionListScreen.tsx:223` FlatList mevcut; cihaz performansı ölçülmedi. | Ölçümden sonra FlashList değerlendirmesi; önce/sonra iOS/Android. |
| P2 | Animasyon ve erişilebilirlik kapsamı | `shared/widgets/useGrowIn.ts:19` bir hook için reduce motion; tüm animasyonlar doğrulanmadı. | Motion envanteri, ekran okuyucu, büyük font ve odak yönetimi. |
| P2 | Tarihli belgeler | `docs/CURRENT_STATUS.md:3,68` ve `docs/architecture/ARCHITECTURE.md:41`; farklı tarihteki ifadeler birlikte duruyor. | Sonraki yetkili belge aşamasında uzlaştır; bu denetimde mevcut belgeleri değiştirme. |

## Önerilen sıra

1. Ürün/veri sözleşmelerindeki açık silme ve para birimi kararlarını çöz; mevcut kullanıcı değişiklikleri için baz oluştur.
2. Gerçek cihaz ve test verileriyle temel durum/erişilebilirlik kanıtını topla; finansal ve offline davranışları koruyan regresyon senaryolarını belirle.
3. Mevcut tema, tipografi, kabuk ve ortak durumlar üzerine ana sayfa bilgi hiyerarşisini tasarla; 0/1/çok veriyle değerlendir.
4. Abonelik listesi, form ve detay; ardından takvim, istatistik ve bildirimleri görev bazında ele al.
5. Auth, ayarlar, gizlilik ve destek akışlarını aynı sistemle gözden geçir; performans veya etkileşim araçlarını yalnız ölçülen ihtiyaçta değerlendir.
6. Android/iOS cihaz, tema, erişilebilirlik, offline ve veri doğruluğu kabulü tamamlanmadan yayın hazırlığı iddiası kurma.

Bu sıranın hiçbir adımı bu raporla uygulanmış değildir. Testler ve canlı backend incelenmedi; Faz 2 veya sprint uygulaması kullanıcı onayı gerektirir.
