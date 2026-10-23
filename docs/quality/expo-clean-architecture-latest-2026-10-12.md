# Expo güncel Clean Architecture / Clean Code / god file değerlendirmesi

Tarih: 12 Ekim 2026; kalan mimari refactor sonrasındaki çalışma ağacı. Önceki 83/100 değerlendirmesinin yerini bu odaklı değerlendirme alır. Genel ürün kod kalitesi veya yayın hazırlığı puanıyla aynı ölçek değildir.

## Sonuç

| Alan | Önceki | Güncel |
|---|---:|---:|
| Clean Architecture | 86 | **90/100** |
| Clean Code | 82 | **86/100** |
| God file / sorumluluk ayrımı | 80 | **88/100** |
| Eşit ağırlıklı ortalama | 83 | **88/100** |

Puanlar mühendislik değerlendirmesidir; otomatik bir standart sertifikası değildir. İyileşme nedeni port/composition ayrımı, semantik veri doğrulaması, açık sonuç kodları ve anlamlı sorumluluk ayrımıdır. Yeni dosya sayısı tek başına puan kazandırmaz.

## Kapsam ve kanıt

- `expo/app` ve `expo/src` içinde 268 test dışı TypeScript kaynak dosyası ve 99 test dosyası sayıldı. Tüm kaynaklarda AST ile import/fonksiyon/satır ölçümü, mimari katman ve döngü testleri yapıldı. Bu sayı, 268 dosyanın her davranışının elle uçtan uca incelendiği anlamına gelmez.
- Doğrudan okuma odağı: sync/mutation/create/PIN koordinatörleri ve composition, yerel decoder, mimari koruma, bildirim runtime/response/sync, liste/dashboard/PIN ayarları ve yakın tarihli refactor kanıtları. Backend/Flutter bu puanın kapsamı değildir.
- TypeScript ve cache kullanılmadan Expo lint geçti. Mimari testin 7 kontrolü geçti. Tüm Jest testleri kapsama açık yeniden çalıştırıldı: **99 paket / 613 test geçti**.
- Jest mevcut yapılandırmada yalnız çalıştırılan modülleri ölçer; `collectCoverageFrom` yoktur. 184 ölçülen dosyada statement **%78,49** (2689/3426), branch **%72,90** (1870/2565), function **%74,09** (792/1069). Bunlar bütün 268 kaynak dosyanın kapsam oranı değildir; `app` rotaları test kökü dışında kalır.
- Graphify mevcut graph üzerinde sorgu exit 1 ile açıklamasız başarısız oldu. Graph yeniden oluşturulmadı; ilişki kanıtı AST ve kaynak okumalarından geldi.
- Önceki kapanıştaki Android/iOS JS export kanıtı mevcut; bu turda yeniden export veya cihaz kabulü yapılmadı. Uygulama kodu bu değerlendirmede değiştirilmedi.

## Puanların gerekçesi

### Clean Architecture — 90/100

| Ölçüt | Puan | Kanıt ve kesinti |
|---|---:|---|
| Domain bağımsızlığı | 23/25 | SDK/I/O sınırı korunuyor; dört format/palette istisnası ve domain sunum bilgisi (-2) |
| Katman ve iş akışı sınırı | 23/25 | UI dışı koordinatörler mevcut; application görevleri data klasöründe ve mutation hata mesajları Türkçe (-2) |
| Bağımlılık tersine çevirme | 21/25 | Sync/mutation/create/PIN değişken I/O ve saat bağımlılıkları veriliyor; bütün ayar/bildirim akışlarına yayılmamış (-4) |
| Mimari koruma | 23/25 | AST, modül çözümü, katman/cycle/koordinatör kontrolü; import type düğümleri ve hesaplanmış yollar kapsanmıyor (-2) |

### Clean Code — 86/100

| Ölçüt | Puan | Kanıt ve kesinti |
|---|---:|---|
| İsimlendirme/okunabilirlik | 18/20 | Açık adlar; yoğun koşullar, inline nesneler ve karışık sunum/domain metinleri (-2) |
| Fonksiyon/tekrar | 18/20 | Takvim/CSV/form/iptal ayrıldı; kalan uzun ekran fonksiyonları (-2) |
| Hata/sonuç sözleşmesi | 17/20 | storage_error, unknown, create sonuç kodları var; bazı asenkron native sonuçlar yakalanmıyor (-3) |
| Veri sınırı doğrulaması | 18/20 | Yerel Money/tarih/enum doğrulaması güçlü; sunucu satır cast'i ve notification_rules sınırı geniş (-2) |
| Davranış testi | 15/20 | Gerçek hata/concurrency/legacy testleri; response ve kritik coordinator/provider dalları açık, ölçüm tüm kaynakları içermiyor (-5) |

### God file / sorumluluk ayrımı — 88/100

| Ölçüt | Puan | Kanıt ve kesinti |
|---|---:|---|
| Modül uyumu | 27/30 | Native izin/tap/plan ve yerel depo/runtime ayrıldı; bazı ekranlar query/mutation/sunum birlikte (-3) |
| Koordinatör sorumluluğu | 26/30 | Portlar ve küçük iç işlemler; sync okuma/fallback/gönderme/drain tek factory içinde (-4) |
| Ekran ayrımı | 17/20 | Takvim/CSV/form ayrıldı; liste, PIN ayarları ve dashboard hâlâ yoğun (-3) |
| Koruma/test edilebilirlik | 18/20 | Boyut, import, cycle ve dependency guard; 320 satır sınırı tek başına sorumluluk yoğunluğunu yakalamaz (-2) |

## Kalan bulgular

Konumlar mevcut kaynakta bir tabanlıdır. Statik çıkarım ile çalışan test kanıtı ayrıdır; aşağıdaki örnekler bu turda native cihazda yeniden üretilmedi.

| Önem | Kesin konum | Kanıt / yeniden üretme | Öneri |
|---|---|---|---|
| Orta | `expo/src/features/notifications/data/notificationRuntime.ts:54`, `:66`; `notificationResponses.ts:29` | Kanal/kategori/erteleme Promise'leri void ile bırakılıyor, catch yok. Adaptörün bu çağrılarını reddeden mock hata yolunu gösterebilir. Response branch kapsamı 0/12, runtime 6/23. | Native sonuçları hata sözleşmesine bağla, retry ve kullanıcı geri bildirimini test et. Plan eşitleme hatasının yakalanması bu farklı işlemleri kapsamaz. |
| Orta | `expo/src/features/subscriptions/ui/SubscriptionListScreen.tsx:50`; `expo/src/features/dashboard/ui/DashboardScreen.tsx:41` | today yalnız timezone değişiminde yeniden hesaplanıyor. Aynı timezone ile gece yarısından sonra ekran mount kalırsa tarih eski kalabilir; kaynak çıkarımı, testle doğrulanmadı. NotificationSync kendi resume tick'ini kullanıyor. | Ortak etkin gün hook'u; resume ve gün sınırı davranış testi. |
| Orta | `expo/src/features/subscriptions/data/subscriptionRepository.ts:27`; `expo/src/features/subscriptions/domain/storedSubscriptions.ts:43`; `expo/src/features/subscriptions/domain/reminderRules.ts:15` | Sunucu verisi cast; yerel reminder içeriği yalnız array; daysBefore yalnız number. Negatif/kesirli değerler extractor'dan geçer. Yerel amount='abc' açığı önceki refactor ile kapandı. | Sunucu/yerel reminder için ortak doğrulama; uyumsuz kaydı koru. Yeni sınırlar ürün/API sözleşmesiyle kararlaştırılmalı. |
| Düşük | `expo/src/features/subscriptions/data/subscriptionMutationCoordinator.ts:42`, `:79` | Create notices UI'ya taşındı; diğer mutation hata mesajları hâlâ use-case içinde Türkçe. | Tipli hata kodlarını UI eşlemesine taşı; mevcut mesajları koru. |
| Düşük | `expo/src/architecture.test.ts:41`, `:144` | ImportDeclaration/export/literal call taranıyor; ImportTypeNode yok. Boyut kontrolü 320 satırdan kısa çok sorumluluklu dosyayı geçirebilir. | Import type desteği ve sorumluluk odaklı review ölçütleri; salt satır eşiğiyle hüküm verme. |
| Orta | `expo/src/features/settings/ui/AppLockSettingsScreen.tsx:31` | 108 satırlık fonksiyonda PIN doğrulama, kalıcı yazımlar, mutation ve çizim bir arada; timeout/biometric mutation'larında onError yok. Başarı ekran testleri var, tüm hata yolları kanıtlı değil. | Ayar action hook/koordinatörü; sayaç/ayar yazım hatası ve kısmi başarısızlık testleri. |

### God file adaylarının durumu

| Dosya | Satır / en uzun fonksiyon | Karar |
|---|---|---|
| SubscriptionListScreen.tsx | 204 / 140 | Orta yoğunluk; query, filtre, pager ve render ayrılabilir |
| AppLockSettingsScreen.tsx | 243 / 108 | Orta yoğunluk; kalıcı yazım ve sunum birlikte |
| DashboardScreen.tsx | 203 / 118 | Düşük–orta; uzun sunum fonksiyonu, domain hesapları zaten ayrı |
| subscriptionSyncCoordinator.ts | 177 / 150 | İzlenecek cohesive koordinatör; 150 satır iç fonksiyonları da kapsar, tek dev algoritma değildir |
| PaymentHistoryScreen.tsx | 225 / 61 | Önceki risk azaldı; action hook ayrı |
| tokens.ts | 320 / 7 | God file değil: tasarım verisi, sıfır import |
| DetailSections.tsx | 276 / 26 | God file değil: küçük sunum parçaları |

Kesin bir yeni kritik god file saptanmadı; yukarıdakiler bakım yoğunluğu adaylarıdır. Dosya sayısının artması veya hiçbir dosyanın 320 satırı aşmaması tek başına kusursuz mimariyi kanıtlamaz.

## Öncelik ve sınır

Önce asenkron bildirim hata yolları ve gün değişimi; ardından sunucu/reminder sınırı, PIN ayar akışı ve açık test dalları; sonrasında sunum metni/yoğun ekran sadeleştirmesi önerilir. Sync branch 26/49, mutation 13/20, create 11/16, PIN 12/14, AppLockProvider 25/45 ve yerel decoder 100/106 ölçüldü. Yüzdeyi artırmak yerine açık davranışı doğrulayan testler gerekir.

88/100 yayın onayı değildir. Fiziksel cihaz, canlı çoklu hesap, imzalı yayın, downgrade ve varsayılan eski yenileme yolunun atomiklik riski önceki kapanışın açık sınırları olarak sürer. Bu yeni incelemenin bulguları, önceki refactor kapsamındaki maddelerin uygulanmış olmasını geçersiz kılmaz; değerlendirme bütün depoda kusur kalmadığını hiçbir aşamada kanıtlamadı.
