# Backend ve Expo kapanış sprintleri

22 Ekim 2026 kullanıcı planı uygulanır. Sprintler süre bağımsızdır; imzalama ve mağaza yayını kapsam dışıdır. Flutter korunur. iOS native erişimi olmadığından bu kabul açık kalır. Önceki S12–S18 tarihçesi [REMAINING_SPRINTS](REMAINING_SPRINTS.md) içindedir.

| Sprint | Uygulama ve açık kapı |
|---|---|
| K1 — Ortam/sözleşme | Verisiz public şema tabanı ve ileri migration temiz PostgreSQL'de kuruluyor; yerel Auth shim'i gerçek Auth/Storage servis kabulü değildir. Canlı envanter ve fixture hesapları hazırlandı. |
| K2 — Export/hesap silme | Function korumaları ve aktif sahip Storage politikaları canlıda. CSV formülü, silinmiş kayıt filtresi, yabancı hesap reddi, nested Storage ve hesap temizliği kabul edildi. 305 saniyelik eski oturum hesap silemez; silinen hesabın kalan JWT'si Storage'a yazamaz. |
| K3 — İşlem bütünlüğü | Gerçek PostgreSQL'de rollback, yenileme/silme/kota ve ertelenmiş ödeme paralel tekrarları geçti. Onaylı ileri migration canlıda; ödeme geçmişi cursor kullanıyor. |
| K4 — Backend güvenliği | A/B tablo/RPC/Storage ve Realtime kabulü var. Cron son koşuları başarılı. Parola koruması, gerçek e-posta/kurtarma, restore ve kalan dependency riskleri açık. |
| K5 — Expo entegrasyonu | Canlı kabulden sonra yerel dört anahtar açıldı. Release ayarı veya tüm UI akışlarının kabulü değildir. |
| K6 — Dayanıklılık | Kuyruk/hesap/storage hata testleri mevcut; gerçek Realtime oturum kabulü var. Yeni native build ile force-stop/offline/kilit turu açık. |
| K7 — Mobil kabul | Android development build ve platform JS kontrolleri doğrulanır; fiziksel Android, biyometri, performans ve iOS native kapıları açık. |
| K8 — Kalite/kapanış | Bildirim testinde polling kaldırıldı; lint uyarısı giderildi. CI'a SQL ve temiz public şema kontrolleri eklendi. Ayrı çalışma kopyasına aktarım otomatik onay denetimince engellendiği için uzak koşu alınamadı. |

Kesin sonuçlar [uygulama kanıt raporunda](../quality/backend-expo-closure-2026-10-22.md) tutulur. Kısmi sprintler tamamlandı sayılmaz.

22 Ekim ek fiziksel Samsung turunda çevrimdışı liste okuma, izin açma, yerel test bildiriminin teslimi/dokunması ve son kodun tam otomatik kontrolleri doğrulandı. Offline şerit ve snackbar safe-area çakışmaları giderildi. [Cihaz turu ve kabul sınırları](../quality/android-physical-acceptance-2026-10-22.md). K6/K7 tam kabulü henüz değildir.

## Tekrarlanabilir doğrulama

Backend'de `npm test`, `npm run test:postgres`, `npm run test:schema`. Geçici cluster yalnız loopback dinler, sonunda durdurulur/kaldırılır. Windows varsayılanı kurulu PostgreSQL bin klasörüdür; başka ortamda `LOCAL_PG_BIN` verilir. CI konumu `pg_config --bindir` ile belirler.

Boş Supabase projesinde `backend/schema/public-baseline.sql` public şema başlangıcıdır, ardından `supabase/migrations` uygulanır. Tarihsel `backend/migrations` zinciri yeniden oynatılmaz. Auth/Storage servisleri, extensions, özel exports bucket politikaları, subscriptions Realtime yayını ve cron platform ön koşullarıdır; public şema testi bunları provision etmez. Baseline mevcut canlı tablolara uygulanmaz.

038/039 nesneleri tabanda mevcut; geçmiş eksik diye yeniden uygulanmaz. Yeni ileri migration dosya sürümü canlıda kaydedilen sürümle eşleşir. Eski Flutter RPC imzaları korunur.

## Bayraklar ve geri dönüş

Yerel `EXPO_PUBLIC_ATOMIC_RENEWAL_ENABLED`, `EXPO_PUBLIC_IDEMPOTENT_DEFERRED_ENABLED`, `EXPO_PUBLIC_SOFT_DELETION_ENABLED`, `EXPO_PUBLIC_TIMEZONE_MODE_ENABLED` canlı kabul sonrası açılır. Git dışı `.env` başka build'leri değiştirmez. Metro yeniden başlatılmalı; native paket değiştiyse development build yenilenmelidir.

Geri dönüşte bayraklar kapatılıp bundle yeniden üretilir; eski ödeme yollarının atomik olmadığı dikkate alınır. Finansal geçmiş/kolonlar silinmez, mantıksal silmeler geri açılmaz. Eski Function kaynakları Git dışı yerel rollback klasöründedir; güvenlik korumalarını kaldıran geri dönüş otomatik uygulanmaz.

## Canlı test güvenliği

`closure-live-acceptance.mjs` açık doğrulama değişkeni ve `closure-…@example.invalid` fixture hesapları ister; normal S31 hesabını kullanmaz. Yönetim kanalında e-posta göndermeden oluşturulan test hesapları gerçek kayıt/e-posta kabulü değildir. Kimlik bilgileri `.local` altında kalır; rapora token/parola/URL yazılmaz. Hesaplar Function ile silinir; DB/Storage kalıntısı yönetim kanalında ayrıca sayılır.

`python tools/docs/check_docs.py --working-tree` yeni dosyaları stage etmeden denetler. CI strict tracked-only modu korur; kullanıcı değişiklikleri otomatik stage/commit edilmez.

Windows Android geliştirme paketi multipart indirme hatası için Metro yalnız `.bundle?platform=android` isteğinde multipart yerine JavaScript yanıtı kullanır. Uygulama API'sini veya diğer platform isteklerini değiştirmez. Native kabul bu geliştirme taşıma düzeltmesinden ayrı izlenir.
