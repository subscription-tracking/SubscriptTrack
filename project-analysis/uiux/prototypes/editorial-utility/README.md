# Editorial Utility dashboard prototipi

Bu bağımsız HTML/CSS/JS prototipi yalnız sentetik veri kullanır; Expo, Supabase veya gerçek kullanıcı verisine bağlanmaz. 28 Ekim 2026 sabit referans günüdür. 14 günlük pencere bugün dahil 0–13 gün: 12 Kasım kaydı bu pencerede gösterilmez. Para tutarları tamsayı minor unit olarak saklanır; para birimleri dönüştürülmez. Hiçbir eylem ödeme veya yenileme tarihi değiştirmez.

## Çalıştırma

Bu dizinde `python -m http.server 8000` çalıştırın ve `http://localhost:8000/` adresini açın. Alternatif olarak `index.html` doğrudan açılabilir. Üstteki prototip araçları tema ve senaryo değiştirir; URL örneği `?scenario=overdue&theme=light`. Üst çubuk gerçek ürün ekranının parçası değil, denetim kontrolüdür. Kaydırma ve sabit alt navigasyon çalışır; diğer ekranlar yerine prototip açıklaması açılır.

Senaryolar: boş, tek, çok, tamamlanan ödemeler, gecikmiş, deneme bitişi, çoklu para birimi, ödeme geçmişi hatası ve çevrimdışı. Offline örneğinde abonelikler sentetik cache olarak gösterilir, ödeme özeti bilinmiyor olarak sunulur. Deneme ücreti sonraki ücret olarak etiketlenir. Referans veri: NovaPlay 219,90 TRY (30 Ekim), Soundline 79,90 TRY (3 Kasım), CloudNest 149,90 TRY (12 Kasım); Ekim ödenen 229,80, kalan 219,90, toplam 449,70 TRY.

## Expo aktarımına adaylar

Mevcut `DashboardScreen`, `HeroCard`, `UpcomingTimeline`, `AttentionSection`, `EmptyState`, `AsyncStateView`, `BottomNavigation`, `PrimaryButton` ve tema tokenları yeniden kullanılabilir veya geliştirilebilir. Tarih sütunlu olay satırı ve bağımsız para birimi seçicisi ortak bileşen adayıdır; yeni katman veya paket zorunluluğu kanıtlanmış değildir.

## Sapmalar ve sınırlar

Hanken Grotesk mevcut Expo paketinden yerel kopyalanmıştır (font lisansı `fonts/LICENSE_FONT`). Büyük finansal tutar 52 CSS px'e kadar çıkar: mevcut Expo `display` 36 kuralından tasarım önerisi olarak sapar. Kontrol çubuğu ve tarayıcı SVG ikonları native UI değildir. `dialog` yerel React Native modal davranışının yerine geçmez. Kontrast, VoiceOver/TalkBack, reduce motion, ekran klavyesi ve Android/iOS cihaz kabulü bu prototiple kanıtlanmaz. Tarayıcı fotoğrafları yalnız bir görsel bazdır; ödeme geçmişi hatası için gerçek yeniden deneme eylemi uygulanmaz. Çoklu birim değerleri seçili sentetik özetten gösterilir; uygulama ürün kararı sayılmaz.
