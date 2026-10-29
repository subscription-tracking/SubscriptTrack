# Mevcut UI/UX denetimi

Tarih: 2026-10-28 · Kapsam: Expo çalışma ağacı, `main` / `dda0b6c` ve commit edilmemiş kullanıcı değişiklikleri. Bu rapor görsel veya cihaz kabulü değildir. Kaynaklar repo köküne göredir. **K** = kodda görüldü, **B** = belgede bildiriliyor, **Ç** = yorum, **?** = doğrulanmadı. Ekranların tamamı envanterlenmiş, tamamı aynı derinlikte incelenmemiştir.

## Puanlama yöntemi

0–5 ölçeği: 0 kanıtlanan ciddi engel, 1 önemli eksik, 2 belirgin geliştirme, 3 işlevsel temel, 4 güçlü temel, 5 cihaz ve kullanıcı kanıtıyla doğrulanmış üstün deneyim. Aşağıdaki puanlar **yalnız kaynak koduna dayalı, öznel ön değerlendirmedir**; görsel kalite, kullanılabilirlik başarısı ve erişilebilirlik sertifikası ölçümü değildir. Kanıtı yetersiz ekranlara puan verilmez. Testler çalıştırılmadı.

| Alan | Ön puan | Gerekçe ve sınır |
|---|---:|---|
| Ana sayfa bilgi hiyerarşisi | 2/5 | K: `expo/src/features/dashboard/ui/HeroCard.tsx:50` tamamlanan durumda tutarı durum metniyle değiştiriyor; `DashboardScreen.tsx:97` ekleme eylemi boş duruma bağlı. Ç: temel göreve göre hiyerarşi yeniden değerlendirilmeli. |
| Ana sayfa veri güveni | 3/5 | K: `DashboardScreen.tsx:56` ve `HeroCard.tsx:34` yüklenmeyen ödeme verisini ayırıyor. Ödeme verisinin yeniden denenmesi ile abonelik yenilemesi bağlantısı test edilmeli. |
| Abonelik listesi | 3/5 | K: `SubscriptionListScreen.tsx:90,169,223` loading/error, genel boş durum, arama sonucu ve `FlatList` içeriyor; cihaz, 1000 kayıt ve ekran okuyucu performansı ?. |
| Ortak tasarım temeli | 3/5 | K: `expo/src/shared/design/typography.ts`, `tokens.ts`, `ThemeProvider.tsx` ve `shared/widgets/` yeniden kullanılır. Kontrast testlerinin güncel koşusu ve tüm ekranlara yayılımı ?. |
| Diğer ekranlar | Puan yok | Rota ve kaynak varlığı incelendi; görsel durumlar ve görev başarısı yeterince ölçülmedi. Bkz. `03-screen-inventory.md`. |

## Ayrıntılı bulgular

1. **K — Veri yok ve veri yüklenemedi ayrı:** `DashboardScreen.tsx:40-64` abonelik loading/error/ready durumunu ve `payments.data === undefined` kontrolünü kullanır; `HeroCard.tsx:34-44` ödeme verisi yoksa bilgi gösterir. **Ç:** finansal güven açısından korunmalı. **?:** sorgu önbelleği eskiyken ya da yenileme hatasında davranış cihazda ölçülmedi.
2. **K — Yenileme kapsamı:** `DashboardScreen.tsx:61` aşağı çekme ile abonelik `refetch` çağırır, ödeme sorgusu açıkça çağrılmaz. **Ç:** kullanıcının ödeme özetini yenileme beklentisi ile uyuşmayabilir; React Query'nin diğer yenileme tetiklerini incelemeden kesin hata denemez.
3. **K — Boş durum:** `DashboardScreen.tsx:99-120` aktif kayıt ve özet yoksa ilk abonelik eklemeyi gösterir. **?:** yalnız arşivlenmiş/iptal edilmiş kayıtları olan kullanıcının mesajı görev açısından ayrıca değerlendirilmeli.
4. **K — Hero:** `HeroCard.tsx:50-75` kalan sıfır ve ödenen pozitifse büyük tutarın yerine tamamlandı mesajını koyar; büyük rakam tek satırda 0,6 ölçeğine kadar küçülebilir. **Ç:** tutar ile durumun hiyerarşisi ve büyük font okunabilirliği iyileştirme adayıdır.
5. **K — Kategori:** `dashboard/domain/dashboardHero.ts:43-65` farklı para birimlerini ayrı toplar, ilk grubun para birimini seçer ve tutara göre sıralar. `CategoryBarCard.tsx:20-35` sıralı indeksle renk ve ilk dört lejantı kullanır. **Ç:** para birimi seçimi kullanıcı için belirsiz olabilir; sıralama değiştiğinde kategori renkleri değişebilir.
6. **K — Zaman çizelgesi:** `UpcomingTimeline.tsx:15-66` 14 gün içinden en fazla altı gün grubu ve gerektiğinde tümüne bağlantı gösterir. **?:** çok yoğun gün ve büyük yazıda satırların taranabilirliği.
7. **K — Liste:** `SubscriptionListScreen.tsx:122-145,169-244` seçim, arama/filtre, ayrı boş sonuç ve sanallaştırılmış satırlar içerir. **Ç:** çoklu silme etiketinin mantıksal/fiziksel anlamı açıklaştırılmalı; arka uç semantiği özellik anahtarına göre ayrıca incelenmelidir.
8. **K — Detay:** `SubscriptionDetailScreen.tsx:36-63,113-122` abonelik ve ödeme geçmişi için ayrı yükleme/hata yolları barındırır. Bu dosya ve `detail/` altındaki birçok dosya kullanıcı tarafından değiştirilmiştir. B: `docs/quality/subscription-detail-redesign-2026-10-23.md` sınırlı Samsung incelemesi bildirir; mevcut görsel kabul değildir.
9. **K — Analitik ve takvim:** `stats/ui/StatsScreen.tsx:43-98`, `PaymentHistoryScreen.tsx:43-111`, `calendar/ui/CalendarScreen.tsx:24-37` sorgu durumlarını ele alır. **?:** düşük veri, ekran okuyucu grafik özeti, yoğun takvim ve platform görselleri henüz kabul edilmedi.
10. **K — Bildirimler:** `notifications/ui/NotificationCenterScreen.tsx:83-129` ve `NotificationPreferencesScreen.tsx:30-39,162` sorgu durumları ve platform saat seçici ayrımı içerir. **?:** izin reddi, erteleme, cold-start ve iOS gerçek cihaz sonucu.

## Öncelikli değişim yönü

Önce parasal özetin ve bir sonraki eylemin hiyerarşisini, ardından 0/1/çok kayıt kompozisyonlarını değerlendir. Mevcut `Money`, saat dilimi, onaylı yenileme, offline ve hesap izolasyonu davranışları tasarım çalışmasında korunmalıdır. Detaylar ve diğer ekranlar için `03-screen-inventory.md`; öncelikler için `06-prioritized-findings.md`.

## Doğrulama sınırları

22 Ekim fiziksel Android raporu (`docs/quality/android-physical-acceptance-2026-10-22.md`) tarihsel ve kısmi kanıttır. Bu çalışmada test, cihaz senaryosu, ekran görüntüsü karşılaştırması, kullanıcı testi, performans ve ekran okuyucu ölçümü yapılmadı. Graphify kod ağırlıklı güncellenmişti; belgeler/görseller ve 24 SQL dosyası son güncellemede tam işlenmedi. Kod veya canlı servis durumu hakkındaki belirsizlikler giderilmeden kesin başarı iddiası kurulmaz.
