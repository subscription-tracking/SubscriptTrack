# Expo güncel denetim raporu — 12 Ekim 2026

## Sonuç

| Ölçü | Sonuç | Önceki rapor | Karar |
|---|---:|---:|---|
| Kod kalitesi | **80/100** | 80/100 | Depo testleri ve kapsam ölçümü iyileşti; varsayılan ödeme yolları ve iki yeni veri güvenilirliği bulgusu açık. |
| Yayın hazırlığı | **29/100** | 27/100 | 036/037 canlı migration listesinde var; uygulama bayrakları kapalı, cihaz ve imzalı yayın kabulü eksik. **Yayına hazır değil.** |

Puanlar mevcut çalışma ağacını değerlendirir. Başlangıç commit'i `474c62f`; çok sayıda değişiklik ve yeni dosya henüz commit edilmemiştir. Kod kalitesi puanı test adedinden veya kapsam yüzdesinden otomatik türetilmez.

## Kapsam ve kanıt sınırı

- Önceki [dosya matrisi](expo-end-to-end-inventory.csv) **354 dosya**, [rota matrisi](expo-route-flow-matrix.csv) **35 rota** içeriyor: 90 test, 4 script, 8 ikili varlık ve diğer kaynak/yapılandırmalar. Üretilmiş bağımlılık, native build, export ve coverage klasörleri kapsam dışıdır.
- Önceki statik incelemenin 345 metin dosyası kapsamı devralındı. Bu tur kritik ödeme/kayıt/yenileme kaynakları, yeni 037 migration'ı, SQL assertion'ları, ilgili test ve yapılandırmalar yeniden okundu. **354 dosyanın tamamı bu tur baştan satır satır okunmadı.** Sekiz ikili varlık yeniden görsel incelenmedi; `.env` içeriği okunmadı.
- Ölçütler ürün/domain/API, mimari/parite belgeleri ve cihaz kabul kaydıdır. Statik çağıranlar ve mock testler, cihaz veya canlı hesap davranışının kanıtı sayılmadı.
- Graphify grafiği mevcut; kökten sorgu çıktısız kod 1 ile döndü. İlişki iddiaları doğrudan kaynaklara dayanır.
- Bu oturumda Supabase MCP aracı yok. CLI'nin salt okunur migration listesi yeni sürümleri doğruladı; katalog/RLS içeriği için 12 Ekim tarihli [canlı durum kaydı](../reference/SUPABASE_LIVE_STATUS.md) kullanıldı. Bu kayıt bu tur bağımsız SQL sorgularıyla yeniden doğrulanmadı. Canlı veri yazımı, migration uygulama veya cihaz testi yapılmadı.

## Önceki rapordan değişenler

1. Canlı listede `20261011221006` ve `20261011221011` migration sürümleri görünüyor. Canlı durum belgesi bunları 036 atomik yenileme ve 037 ertelenmiş ödeme ile eşliyor; authenticated/anon izinlerini ve sahiplik/kota tetikleyicilerini kaydediyor. Önceki “036 uygulanmadı” sonucu artık güncel değil.
2. `EXPO_PUBLIC_ATOMIC_RENEWAL_ENABLED` ve `EXPO_PUBLIC_IDEMPOTENT_DEFERRED_ENABLED` varsayılanları kapalı; canlı durum belgesinde mevcut build için de kapalı kaydedilmiş. Bu tur gizli ortam dosyası okunmadığından gerçek build değeri bağımsız teyit edilmedi. Sunucuda RPC bulunması istemcinin kullandığını kanıtlamaz.
3. Ödeme geçmişi 500 kayıtta kesilmiyor; 500'lük sayfalarla okunuyor ve aynı tarih için `id` ikincil sıralaması var. Durağan veri için 502 kayıt testi mevcut; eşzamanlı veri değişimi testi yok.
4. Hesap silme yalnız `success:true` yanıtını başarı kabul ediyor; ödeme update/delete sıfır etkilenen satırı hata sayıyor. İki modülün tüm kaynak koşusundaki satır kapsamı %100. Önceki rapordaki kapsam çelişkisi yeni koşuda tekrarlanmadı; eski yüzdeler güncel değerlendirmede kullanılmadı.

## Kod kalitesi — 80/100

| Alan | Puan | Doğrulanmış kanıt | Açık eksik / kesinti |
|---|---:|---|---|
| İş kuralları | **21/25** | Onaylı CANCELLED → ACTIVE, geçmiş tasarrufun korunması, para/tarih/durum golden'ları; form/CSV abonelik üst sınırı testleri. | Genel Money uç değerinde Dart/JS farkı; Flutter'ın silme ve sessiz yenileme çelişkileri; tam ürün paritesi açık. **−4** |
| Veri ve işlem güvenilirliği | **18/25** | 036 için önceki gerçek PostgreSQL rollback/eşzamanlılık kanıtı; ödeme sayfalama, sıfır satır kontrolü ve hesap silme yanıt doğrulaması. | Varsayılan yenileme atomik değil; ertelenmiş eski yol idempotent değil; 037 eşzamanlı tekrar ve offset sayfalama riskleri; gerçek FIFO/OS kabulü eksik. **−7** |
| Güvenlik ve gizlilik | **17/20** | Genel kayıt sonucu, PIN/SecureStore testleri; canlı kayıtta 036/037 authenticated izni ve anon reddi. | İki hesap RLS, gerçek PIN taşıma ve kayıt gizliliği kabulü yok; dependency uyarıları ve leaked password protection açık. **−3** |
| Mimari ve bakım | **13/15** | Katman/mimari testleri, tip kontrolü ve lint geçiyor; API ve canlı durum belgeleri var. | 39 izlenmeyen belge hedefi; uzak Expo CI yok; CURRENT_STATUS ve bazı API geçiş notları canlı durumla geride kalmış. **−2** |
| Testlerin davranış kapsamı | **11/15** | 90 paket/559 test; tüm kaynakta satır %64,29, dal %58,22. Hesap deposu %100 satır/dal, ödeme deposu %100 satır/%93,75 dal. | Auth, bildirim ve eşitleme dalları kısmi; 037 eşzamanlılık/rollback ve hareketli sayfalama testleri yok; cihaz sonucu mock ile kanıtlanmaz. **−4** |

Yeni kapsam kanıtı test alt puanını artırdı. Yeni tespit edilen veri riskleri nedeniyle toplam kod puanı önceki raporla aynı kaldı.

## Yayın hazırlığı — 29/100

| Alan | Puan | Kanıt | Açık eksik / kesinti |
|---|---:|---|---|
| Android kabulü | **12/25** | Önceki emülatör rota/oturum ve test bildirimi kanıtları. | Fiziksel Android, güncel tüm rotalar, TalkBack ve planlı bildirim kabulü yok; son açılış/splash sorunu açık. **−13** |
| iOS kabulü | **0/25** | JS export; native kabul yok. | Native build, cihaz/simülatör ve kritik akışlar ertelenmiş. **−25** |
| Canlı backend ve çoklu hesap | **10/20** | Önceki aynı hesap smoke'ları; yeni migration sürümleri CLI ile, katalog bulguları canlı durum belgesiyle kayıtlı. | Yeni RPC'lerin canlı davranış testi, iki hesap RLS ve silme sonrası kalıntı kontrolü yok; uygulama eski yolları kullanıyor. **−10** |
| Offline/bildirim/PIN | **5/20** | Domain/mock ve önceki Android test bildirimi. | Gerçek FIFO, erteleme/cold-start, profil timezone değişimi, biyometri ve Flutter PIN taşıması açık. **−15** |
| İmzalı paket ve CI | **2/10** | Yerel otomatik kontroller, JS export ve workflow dosyası. | Uzak Expo workflow listesinde kayıt bulunmadı; imzalı AAB/iOS arşivi ve yükseltme kabulü yok. **−8** |

## Açık bulgular

| ID / önem | Konum ve yeniden üretme | Sonuç ve yapılması gereken |
|---|---|---|
| **Q1 — Yüksek** | [subscriptionMutations.ts:95](../../expo/src/features/subscriptions/data/subscriptionMutations.ts#L95), [ödeme:114](../../expo/src/features/subscriptions/data/subscriptionMutations.ts#L114), [güncelleme:125](../../expo/src/features/subscriptions/data/subscriptionMutations.ts#L125). Bayrak kapalıyken ödeme başarılı olsun, sonraki güncelleme başarısız kalsın. | Ödeme kalır, yenileme tarihi ilerlemez. 036'nın canlı davranışı doğrulanıp yeni build'de atomik yol açılmalı. |
| **Q2 — Orta** | [paymentRepository.ts:103](../../expo/src/features/stats/data/paymentRepository.ts#L103). Ertelenmiş ilk ödeme yazılsın; yanıt kaybolduktan sonra aynı kullanıcı eylemi yeniden gönderilsin. | Bayrak kapalı eski insert yolu anahtarı kullanmıyor; çift DEFERRED kaydı riski var. 037 kabulü sonrasında yeni build'de RPC yolu açılmalı. |
| **Q3 — Orta** | [037:35](../../backend/migrations/037_record_deferred_payment_idempotent.sql#L35), [anahtar insert:49](../../backend/migrations/037_record_deferred_payment_idempotent.sql#L49). İki oturum aynı anahtarla aynı girdiyi eşzamanlı göndersin; her ikisi ilk anahtar okumasında kayıt bulamasın. | Statik akışta kilit/çatışma sonrası mevcut sonucu döndürme yolu yok. Unique constraint ikinci işlemi geri alıp 23505 üretebilir; sıralı tekrar testinin geçmesi eşzamanlı aynı sonucu garanti etmez. Gerçek SQL concurrency testi ve sonucu geri döndüren seri işlem gerekli. **Bu tur yeniden üretilmedi; kaynak akışından tespit.** |
| **Q4 — Orta** | [paymentRepository.ts:35](../../expo/src/features/stats/data/paymentRepository.ts#L35). İlk 500 kayıt okunduktan sonra başa yeni ödeme eklensin veya ilk sayfadan kayıt silinsin; ikinci sayfa offset 500 ile okunsun. | Offset kayınca kayıt tekrar edebilir veya atlanabilir; istatistik toplamı yanlış çıkabilir. İkincil sıralama eşit tarihler sorununu çözer, sayfalar arası veri değişimini çözmez. Cursor/snapshot yaklaşımı ve araya yazım testleri gerekli. **Bu tur statik değerlendirme.** |
| **Q5 — Orta** | [authRepository.ts:64](../../expo/src/features/auth/data/authRepository.ts#L64), [notificationScheduler.ts:157](../../expo/src/features/notifications/data/notificationScheduler.ts#L157), subscriptionSync ve cihaz kabul matrisi. | Kayıt gizliliği, bildirim değişimi, yeniden etkinleştirme ve PIN kod/test düzeyinde var; canlı/OS kabulü açık. Mock başarıları yayın kabulü olarak kullanılmamalı. |
| **Q6 — Orta** | `npm audit --omit=dev`; [canlı güvenlik kaydı](../reference/SUPABASE_LIVE_STATUS.md). | 16 yüksek + 12 orta olmak üzere 28 dependency kaydı; bu sayılar 28 ayrı kullanılabilir saldırı yolu demek değildir. Mevcut decode-uri/node-forge yamaları korunuyor. SDK uyumlu çözüm ve açık leaked password protection ayarı ayrıca ele alınmalı. |
| **Q7 — Düşük** | [CURRENT_STATUS](../CURRENT_STATUS.md), [API](../reference/API.md), belge kontrolü ve uzak workflow listesi. | CURRENT_STATUS hâlâ 036 için “uygulanmadı” diyor; API'de 037 eski yol notu dağıtım öncesi ifadeyi koruyor. Belgeler yeni canlı kayda göre uzlaştırılmalı; izlenmeyen kanıtlar depoya alınmalı ve CI çalıştırılmalı. |

Kodda giderilenler: değişen planlı bildirimlerin eşitlenmesi, kayıt mesajı gizliliği, onaylı yeniden etkinleştirme ve geçersiz düğmeler, hesap silmede yanlış başarı, ödeme düzenleme/silmede sıfır satırın yanlış başarı sayılması ve 500 kayıt kesintisi. Bunların tümü canlı/cihaz kabulünün tamamlandığı anlamına gelmez.

## Kontroller ve tarihler

| Kontrol | Tarih / sonuç | Kanıt sınırı |
|---|---|---|
| Expo tüm kaynak Jest kapsamı | **12 Ekim: 90/90 paket, 559/559 test**; satır %64,29, dal %58,22, fonksiyon %57,95, statement %62,25 | Mock/domain davranışı. Önceki test sayısı 555 ve kapsam sayıları artık güncel değil. |
| Expo TypeScript / lint | **12 Ekim: geçti**, lint uyarısız | Cihaz sonucu değil. |
| Expo Doctor | **12 Ekim: 21/21** | Bağımlılık/yapılandırma kontrolü. |
| Expo export | **12 Ekim: web, Android ve iOS geçti** | JS paketleri; native build/imza/cihaz kabulü değil. |
| Backend Node testleri | **12 Ekim: 46/46** | 036/037 Node testleri statik sözleşme kontrolüdür. |
| PostgreSQL 036 | **11 Ekim önceki başarılı koşu**: sahiplik/tarih/tekrar/çatışma/dört rollback noktası ve iki eşzamanlı istemci | Asgari fixture, tam canlı şema değil; 12 Ekim yeniden çalıştırılmadı. |
| PostgreSQL 037 | Fixture/assertion dosyaları mevcut; **bu rapor turunda çalıştırılmadı** | Sıralı SQL dosyası varlığı test başarı kanıtı sayılmadı; concurrency/rollback eksik. |
| Flutter | **11 Ekim önceki koşu: 858/858**, analiz temiz | 12 Ekim yeniden çalıştırılmadı; yeni raporda tarihli önceki kanıt olarak kullanıldı. |
| Doküman kontrolü | **12 Ekim: 39 hedef yok/izlenmiyor uyarısı** | Önceki geçici indeks denetimi temizdi; gerçek Git indeksinde açık. |
| Dependency audit | **12 Ekim: 28 kayıt**, kritik 0 | Kullanılabilirlik analizi ve yamalar sayıdan ayrı değerlendirilir. |
| Migration listesi | **12 Ekim**: 20261010162939, 20261011221006, 20261011221011 | Sürüm listesi DDL ve uygulama davranışını tek başına doğrulamaz. |
| Fiziksel Android/iOS, çift hesap, silme, imzalı yayın | **Yeni kanıt yok** | Geçti olarak işaretlenmedi. |

## Kapanış sırası

1. 037 eşzamanlılık/rollback ve ödeme sayfalama sırasında değişim senaryolarını sınayıp Q3/Q4'ü gider.
2. 036/037 canlı davranış kabulünü yetkili test hesaplarıyla tamamla; ardından özellik bayraklarını kontrollü bir build'de aç ve eski istemci uyumluluğunu doğrula.
3. İki hesap RLS, hesap silme sonrası DB/Storage temizliği, kayıt e-postası ve çoklu cihaz/offline senaryolarını kanıtla.
4. Fiziksel Android ve ertelenmiş iOS kabulü, yerinde Flutter PIN taşıması, bildirim/erişilebilirlik ve açılış sorunlarını kapat.
5. Belgeleri uzlaştır, dependency bulgularını SDK uyumlu çöz, uzak CI ve imzalı yayın kabulünü tamamla. Kanıtlar geldikten sonra puanları yeniden hesapla.

Bu rapor değerlendirme çalışmasıdır; uygulama kodu ve canlı veritabanı bu tur değiştirilmedi. iOS/EAS/imzalı yayın erteleme kararı korunur; Expo iki platformda kabul edilene kadar Flutter korunur.
