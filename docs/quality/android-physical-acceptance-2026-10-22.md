# Fiziksel Android kabul turu — 22 Ekim 2026

Samsung SM-S711B, Android ARM64; mevcut kullanıcı verileri silinmedi. Bu rapor tam S5–S8 kabulü değildir. Ekran görüntüleri kişisel veri içerebildiği için Git dışı `.local/android-acceptance-2026-10-22/` altında tutulur.

| Kontrol | Sonuç ve sınır |
|---|---|
| Mevcut development APK launcher açılışı | Force-stop sonrası development client menüsüne döndü; bağımsız/offline açılış kabul edilmedi. |
| USB/Metro bağlantısı | 8081 başka servis tarafından kullanılıyordu. Metro 8082 yalnız `::1` dinlediğinden USB IPv4 erişimi başarısızdı. 127.0.0.1:8099 → [::1]:8082 TCP köprüsü ve cihaz 8082 → bilgisayar 8099 reverse ile Dashboard açıldı. |
| Oturum | Development APK yeniden başlatılıp Metro üzerinden yüklenince mevcut oturum ve abonelik görünür kaldı. |
| Çevrimdışı okuma | Wi-Fi kapalı, mobil veri açık başlangıç durumunda mobil veri geçici kapatıldı. Abonelik listesi ve tutar korundu, offline uyarısı göründü; mobil veri finally adımında yeniden açıldı. Yazma/FIFO/hesap değiştirme testi değildir. |
| Offline görünüm | Uyarının durum çubuğuyla çakışması fiziksel cihazda yeniden üretildi; üst/yan SafeAreaView koruması eklendi. |
| Kısa mesaj görünümü | Test bildirimi sonucundaki snackbar Android gezinme tuşlarıyla çakıştı; alt/yan SafeAreaView koruması eklendi. |
| Bildirim izni | Başlangıçta Android tarafından engelliydi; uygulama bunu doğru gösterdi. Android uygulama ayarından izin açıldı; POST_NOTIFICATIONS granted=true doğrulandı. |
| Test bildirimi | Uygulama içinden 5 saniyelik yerel test gönderildi; Android NotificationRecord içinde com.subscripttrack.app / st:test teslimi görüldü. Tepside “Bildirimler çalışıyor.” görüldü; bildirime dokununca uygulamanın MainActivity'si öne geldi. Abonelik detay yönlendirmesi, erteleme, reboot veya cold-start kabulü değildir. |
| Backend tekrar kontrolü | Node 50/50; gerçek PostgreSQL atomik işlem, eşzamanlı tekrar, quota/RLS ve temiz public şema kontrolleri geçti. Canlı migration uygulanmadı. |
| Expo testleri | İlk tam koşuda 4 test hatası bulundu. Üç eski UI beklentisi güncellendi; Dashboard ham sıfır boşlukları spacing.none yapıldı. Son SafeAreaView değişiklikleri dahil tekrar tam koşu 141 paket / 880 test geçti (115,357 sn). Typecheck ve lint geçti; bazı testlerde act uyarıları sürüyor. |
| Büyük yazı kısmi kontrol | font_scale 1.0 → 1.3 sırasında activity yeniden kuruldu ve Dashboard açıldı. Görüntüde ana içerik ve alt sekmeler okunabildi; tüm rotalar/TalkBack kabulü değildir. Sistem ayarı finally ile 1.0'a döndürüldü. |
| Belge kontrolü | Python 3.14 ile check_docs.py --working-tree geçti (40 dosya). Varsayılan Python 3.13 çalıştırıcısı geçersiz Windows executable hatası verdi. |
| Bağımsız APK | ARM64 release variant, yerel debug anahtarıyla build başarılı (16 dk 48 sn). 43.191.514 baytlık APK mevcut uygulamanın üzerine adb install -r ile kuruldu. Tüm Metro reverse bağlantıları kaldırılarak launcher açılışı geçti. Mağaza imzası veya yayın paketi değildir. |
| Offline bağımsız cold-start | Mobil veri kapalı, Wi-Fi kapalı, reverse boşken force-stop + launcher açılışı geçti. Oturum ve abonelik cache'i korundu. Üst offline uyarısı durum çubuğunun altında, okunaklı göründü. Mobil veri yeniden açıldı. |
| Yeni finansal görünüm bulgusu | Offline cold-start sırasında ödeme geçmişi kalıcı cache'de olmadığı için hero ödenen/toplam değerini yanlışlıkla sıfır gösteriyordu. Dashboard artık ödeme verisi undefined olduğunda hesaplanan sıfırları göstermiyor; eksik veri açıklaması ve İstatistikler yönlendirmesi sunuyor. Geçerli boş ödeme geçmişi ile hiç yüklenmemiş veri ayrıldı. İlgili 20 test, typecheck ve lint geçti. Incremental APK build 2 dk 40 sn ile başarılı; yeniden kurulan APK'de Metro kapalı ve reverse boşken offline force-stop/launcher tekrarlandı: “Ödeme özeti kullanılamıyor” göründü, “Ödenen” sahte sıfır satırı yoktu. |

## Açık kalanlar

Offline yazma ve FIFO; yanıt kaybı; ayrı test hesabıyla finansal işlemler ve hesap silme; iki fiziksel istemci eşitlemesi; PIN/biyometri; tüm rotalarda büyük yazı/TalkBack; 1.000 kayıt performansı; tüm bildirim senaryoları; uzak CI ve iOS native kabulü açık kalır.

## Bağımlılık kontrolü

Yeni npm audit --omit=dev sonucu 19 etkilenen paket kaydı: 16 high, 3 moderate, critical 0. Bu sayı bağımsız saldırı yolu sayısı değildir. Metro/CLI zinciri geliştirme/derleme araçlarıdır; production dependency sınıflamasında görünmeleri tek başına mobil runtime erişilebilirliği kanıtlamaz. React Native, virtualized-lists ve datetimepicker için transit zincir ve paket çıktısı incelenmeden risksiz kararı verilmez. decode-uri-component ve node-forge mevcut yamaları korunur; audit sürüm tabanlı olduğundan bu yamalar advisory sayısını sıfırlamaz. Audit'in Expo 44/React Native 0.72 downgrade ve Router 58 major önerileri uygulanmadı. Nihai güvenlik risk kabulü kapanmış değildir.

Safe area uygulaması [Expo SDK 57 belgesine](https://docs.expo.dev/versions/v57.0.0/sdk/safe-area-context/) göre yapıldı. iOS native üzerinde doğrulanmadı.
