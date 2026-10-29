# Codex — Faz 1: Salt okunur proje ve UI/UX denetimi

Sen SubscriptTrack'in kıdemli React Native/Expo mühendisi, mobil ürün tasarımcısı ve QA mimarısın. Görevin **uygulama kodunu değiştirmeden** kapsamlı, kanıta dayalı bir UI/UX dönüşüm denetimi hazırlamaktır.

ÖNCE ŞUNLARI OKU:
- `AGENTS.md`, `expo/AGENTS.md`
- `docs/README.md`, `docs/CURRENT_STATUS.md`
- `docs/product/PRODUCT.md`, `docs/product/DOMAIN.md`, `docs/product/USER_FLOWS.md`
- `docs/architecture/ARCHITECTURE.md`, `docs/architecture/MOBILE.md`, `docs/reference/API.md`
- `docs/expo/DESIGN_SYSTEM.md`, `docs/expo/PARITY.md`, `docs/quality/expo-59/CONTRACT.md`
- `docs/quality/android-physical-acceptance-2026-10-22.md` ve daha yeni ilgili rapor varsa onları
- Bu paketteki `01-PRODUCT-AND-DESIGN-BRIEF.md`, `02-DECISIONS-AND-GUARDRAILS.md`

İŞLEMLER:
1. `git status`, mevcut dal, HEAD, güncel değişiklikleri salt okunur tespit et. Kullanıcı değişikliklerine dokunma.
2. `expo/app` altındaki **tüm rotaları** ve `expo/src/features` içindeki ekranları envanterle: auth/onboarding/dashboard/subscriptions/add/edit/detail/calendar/notifications/stats/payments/savings/settings/privacy/feedback/export/delete-account vb. Sadece gerçekten bulunanları raporla.
3. Ortak UI, tema, ikon, font, spacing, motion, loading, empty state, offline, erişilebilirlik ve navigasyon mekanizmasını analiz et.
4. Ana sayfa için `DashboardScreen`, `HeroCard`, `CategoryBarCard`, `UpcomingTimeline`, `AttentionSection`, alt sekmeler ve mevcut testlerini oku. Veri kaynağı, ekran durumu ve görsel sorunu **ayrı ayrı** belirt.
5. Her ekran/akış için: kullanıcı görevi, mevcut UI bileşenleri, 0/1/çok veri, loading/error/offline, risk, iOS/Android farkı, mevcut test, önerilen UI dönüşümü, etkilenecek dosyalar.
6. Mevcut paketler ve kilit dosyası üzerinden kütüphane envanteri çıkar. Reanimated, Gesture Handler, Expo Haptics, Lucide, Bottom Sheet, FlashList, Skia, SVG ve var olan alternatifleri kontrol et. Eklenmiş olanı tekrar önermeden önce neden gerekli olduğunu açıkla.
7. Yeni bağımlılık adayları için **güncel** Expo SDK sürüm eşleşmesi, lisans türü, resmî kaynak bağlantısı, native build gerekçesi, bakım/performans maliyeti, yerine mevcut bileşen kullanma seçeneği sun. Lisansı doğrulanamayanı aday listesine al ama “onay yok” de.
8. `graphify-out` varsa sadece oku; yoksa veya bayatsa açıkça belirt. Plan için zorunlu ön koşul yapma; generated dosyaları elle değiştirme.
9. Kod-belge çelişkilerini öncelik, kanıt, karar ihtiyacı ve olası etkiyle yaz.
10. Gerekli olduğunda test komutlarını **listele**, çalıştırma; hiçbir dosyaya yazma ve hiçbir dış servise mutation yapma.

ÇIKTIYI CHAT İÇİNDE ÜRET, DOSYA OLUŞTURMA:
A. 1 sayfalık yönetici özeti
B. Rota/ekran/durum matrisi
C. Ana sayfa detaylı AI-slop ve bilgi hiyerarşisi analizi (puan varsa gerekçeli, öznel olduğu belirtilmiş)
D. Teknik tasarım sistemi envanteri ve tekrar kullanım alanları
E. Açık kaynak araç lisans/uyumluluk kararı: ADOPT / EVALUATE / AVOID
F. Belge–kod farkları, belirsizlikler ve kanıtlı riskler
G. Plan hazırlanmadan önce karar bekleyen en fazla 10 soru (mevcut kararları yeniden sorma)
H. Kod değişikliği YAPILMADI beyanı ve doğrulama sınırları

HER ÖNEMLİ BULGU İÇİN `path:line` veya dosya bağlantısı ver; “kanıtlandı / belgede yazıyor / çıkarım” ayrımını koru. Tahminlerini kesin bilgi gibi sunma.
