# Expo güncel denetim raporu — 11 Ekim 2026

## Sonuç

| Ölçü | Güncel sonuç | Düzeltme öncesi | Karar |
|---|---:|---:|---|
| Kod kalitesi | **80/100** | 69/100 | Veri katmanı testleri ve 036 işlemi izole PostgreSQL'de doğrulandı; canlı/cihaz kanıtı hâlâ eksik. |
| Yayın hazırlığı | **27/100** | 27/100 | Migration 036 canlıda kapalı; fiziksel Android, iOS ve imzalı sürüm kabul edilmedi. **Yayına hazır değil.** |

Bu puanlar tek bir "uygulama puanı" değildir. Kod kalitesi kaynak, iş kuralı ve otomatik davranış kanıtına; yayın hazırlığı çalışan servis, cihaz ve dağıtım kanıtına dayanır. Test adedi puan değildir.

## Kapsam ve yöntem

`expo/` altında `node_modules`, `.expo`, `dist`, `coverage`, `coverage-repository`, üretilmiş `android` ve `ios` hariç **354 dosya** var: **35 rota, 90 test, 4 script, 8 ikili varlık** ve diğer kaynak/yapılandırmalar. İlk denetimde 350 dosyanın statik envanteri hazırlanmıştı; sonradan eklenen dört davranış testi okunup [dosya matrisine](expo-end-to-end-inventory.csv) işlendi. Böylece matriste **354 satır** var. 345 metin dosyası statik içerik kapsamındadır; sekiz ikili varlık için önceki özet/özellik incelemesi geçerlidir. Yerel `.env` dosyasının **içeriği okunmadı**. [Rota matrisi](expo-route-flow-matrix.csv) 35/35 rotayı içerir; kayıt ve abonelik detayı satırlarına yeni test/RPC bağları işlendi.

Bu, her dosyanın her çalışma zamanı dalının elle veya cihazda yürütüldüğü anlamına gelmez. Önceki statik envanter ve bu turdaki kaynak/test okumaları birlikte kullanıldı. Graphify grafiği mevcut olsa da `graphify query` çıktısız kod 1 ile döndü; grafikten ilişki iddiası çıkarılmadı. Ürün kıstası [PRODUCT](../product/PRODUCT.md), [DOMAIN](../product/DOMAIN.md), [API](../reference/API.md), [DATA_MODEL](../reference/DATA_MODEL.md), [NOTIFICATIONS](../architecture/NOTIFICATIONS.md), [PARITY](../expo/PARITY.md) ve [cihaz kabul kaydı](../operations/DEVICE_ACCEPTANCE.md) oldu. Çalışma ağacında çok sayıda önceden mevcut, henüz commit edilmemiş değişiklik var; bu rapor **mevcut çalışma ağacını** değerlendirir, uzak varsayılan dalı değil.

## Kod kalitesi: 80/100

| Alan | Puan | Doğrulanmış kanıt | Kesinti ve açık kalan |
|---|---:|---|---|
| İş kuralları | **21/25** | Expo/Flutter `CANCELLED → ACTIVE`, kullanıcı onayı ve geçerli detay eylemleri; geçmiş tasarruf korunuyor. `Money`, IANA tarih ve golden testleri geçiyor. | CSV/para sınırı ve tam Flutter paritesi önceki denetimdeki açıkları koruyor; cihaz davranışı doğrulanmadı. **−4** |
| Veri ve işlem güvenilirliği | **19/25** | Bildirim eşitlemesi ve FIFO/idempotency testleri var. 036 izole PostgreSQL 17'de sahiplik, tarih, aynı/farklı anahtar, iki eşzamanlı çağrı ve dört hata noktasında rollback testini geçti. Ödeme güncelleme/silme sıfır etkilenen satırı hata sayıyor. | Varsayılan yenileme hâlâ iki ayrı yazım; 036 canlıya uygulanmadı. Gerçek offline FIFO ve OS yeniden planlama kabulü yok. **−6** |
| Güvenlik ve gizlilik | **17/20** | Kayıtta boş `identities` ve açık duplicate hatası aynı genel sonuca dönüyor. PIN hash, SecureStore ve RLS sözleşmesi var. | İki ayrı hesaplı RLS, PIN taşıma ve canlı kayıt gizliliği senaryosu doğrulanmadı. **−3** |
| Mimari ve bakım | **13/15** | Expo Router/feature katmanları, ortak bileşenler, API ve domain belgeleri güncel; mimari testi ve tip/lint geçiyor. | Belge denetimi 39 izlenmeyen bağlantı bildiriyor; Expo CI dosyası çalışma ağacında izlenmiyor, uzak dal çalışması kanıtlanmadı. **−2** |
| Testlerin davranış kapsamı | **10/15** | Bildirim/auth/yenileme testlerine hesap silme ve ödeme deposu başarı/hata/oturum/RLS sıfır satır testleri eklendi; 90/90 suite geçti. İki depoya odaklı Jest koşusunda satır kapsamı **%100**, dal **%91,17**; SQL işlem testleri gerçek PostgreSQL'de geçti. | Birleşik kaynak raporu satır **%63,42**, dal **%57,01**; bu rapor yeni depolar için %0 gösterirken hedefli koşu %100 gösterdiği için kapsam birleştirme tutarsızlığı araştırılmalı. Cihaz OS davranışı açık. **−5** |

Önceki 69 puandan artış; iş kuralı çelişkisi, kayıt ifşası ve bildirim eşitleme kusurunun kod/test düzeyinde giderilmesine dayanır. Atomik yenileme canlıya alınmadığı için veri güvenilirliği tam puan almaz.

## Yayın hazırlığı: 27/100

| Alan | Puan | Var olan kanıt | Kabul açığı |
|---|---:|---|---|
| Android kabulü | **12/25** | Android 36 emülatörde development client ana akışları ve yerel test bildirimi; Expo Go onboarding/giriş ekranı açıldı. | Fiziksel Android, tüm güncel rotalar, TalkBack ve değişen planlı bildirimin OS sonucu yok; bir AVD turunda başlangıç ANR kaydı var. **−13** |
| iOS kabulü | **0/25** | iOS JS bundle üretildi. | Native build, simülatör/fiziksel cihaz ve bildirim/PIN kabulü yok. **−25** |
| Canlı backend ve çoklu hesap | **8/20** | Tek test hesabında eski RPC, Realtime ve bazı API smoke sonuçları kayıtlı. | 036 uygulanmadı; iki ayrı hesaplı RLS, hesap silme sonrası kalıntı ve migration içerik uzlaştırması yok. **−12** |
| Kritik offline/bildirim/PIN | **5/20** | Mock/domain testleri ve Android emülatörde tek test bildirimi. | Ağ kesme/FIFO, plan değişimi, erteleme/cold-start, biyometri ve Flutter PIN taşıma cihazda açık. **−15** |
| İmzalı paket ve CI | **2/10** | Web/Android/iOS JS export ve yerel workflow dosyası var. | İmzalı AAB/iOS arşivi ile uzak Expo CI koşusu yok. **−8** |

## Bulgular ve durumları

| ID | Önem | Durum | Kanıt, yeniden üretme ve konum |
|---|---|---|---|
| F1 | Yüksek | **Kodda giderildi; OS kabulü açık** | [Planlayıcı](../../expo/src/features/notifications/data/notificationScheduler.ts) parmak izini karşılaştırıp değişeni iptal/yeniden planlıyor (satır 111–147); [test](../../expo/src/features/notifications/data/notificationScheduler.sync.test.ts) aynı/değişen plan, eski kayıt, hata ve erteleme senaryolarını çalıştırır. Gerçek cihazda saat/dilim/tutarı değiştirip OS kayıt/teslimini doğrulama adımı açık. |
| F2 | Yüksek | **Varsayılan akışta açık; SQL yerelde doğrulandı** | [Yenileme kodunda](../../expo/src/features/subscriptions/data/subscriptionMutations.ts) özellik anahtarı kapalıyken ödeme satır 114'te, tarih/olay satır 125'te ayrı çağrılır. Yeniden üretme: ödeme RPC'si başarılı, abonelik güncellemesi başarısız olsun; ödeme kalır, tarih eski kalır. [036 RPC](../../backend/migrations/036_confirm_subscription_renewal_idempotent.sql) izole PostgreSQL 17'de [fixture](../../backend/test/renewal036.fixture.sql) ve [assertion](../../backend/test/renewal036.assert.sql) ile doğrulandı; iki eşzamanlı çağrı 1 ödeme/1 olay/1 anahtar üretti. Canlı uygulanmadı ve tam canlı şemayla uzlaştırılmadı. |
| F3 | Orta | **Kodda giderildi; canlı Auth kabulü açık** | [Kayıt deposu](../../expo/src/features/auth/data/authRepository.ts) satır 56–66 boş kimlik ve açık duplicate yanıtını aynı `requiresEmailConfirmation` sonucuna çevirir; [test](../../expo/src/features/auth/data/authRepository.signup.test.ts) her iki yolu ve diğer hata yolunu sınar. Canlı Auth ayarlarında gerçek/yinelenen adresle mesaj eşitliği ayrıca kabul edilmeli. |
| F4 | Orta | **Kodda giderildi; cihaz kabulü açık** | [Expo geçiş tablosu](../../expo/src/features/subscriptions/domain/statusTransitions.ts) satır 12/83 ve [Flutter karşılığı](../../mobile/lib/features/subscriptions/domain/subscription_enums.dart) `CANCELLED → ACTIVE` içerir; [Expo onayı](../../expo/src/features/subscriptions/ui/SubscriptionDetailScreen.tsx) satır 81–90 ve Flutter ekran testi vardır. İptalden yeniden etkinleştir; onaysız değişim ve geçersiz düğmeler reddedilir, geçmiş tasarruf kalır. İki platform gerçek cihaz sonucu yok. |
| F5 | Orta | **Kısmen giderildi** | Tüm kaynak raporunda `notificationScheduler.ts` satır **%40,96**, `authRepository.ts` **%36,11**, `subscriptionMutations.ts` **%67,56**. Yeni [hesap](../../expo/src/features/settings/data/accountRepository.test.ts) ve [ödeme](../../expo/src/features/stats/data/paymentRepository.test.ts) depo testlerinin hedefli satır kapsamı **%100**; birleşik rapor bu iki dosyayı hâlâ %0 gösterdiğinden ölçüm çelişkisi ayrıca incelenmeli. Canlı hesap silme ve RLS açık. |
| F6 | Düşük | **Giderildi** | Kullanılmayan `dotColor` kaldırıldı; lint uyarısız. [Expo Go özeti](../expo/README.md) [cihaz kaydıyla](../operations/DEVICE_ACCEPTANCE.md) eşitlendi. |
| F7 | Orta | **Kodda giderildi; canlı kabul açık** | [Hesap deposu](../../expo/src/features/settings/data/accountRepository.ts) yalnız `{success:true}` yanıtını başarı sayar. Önceki durumda boş/`false` yanıt ekranı silindi diye kapatabilirdi. [Test](../../expo/src/features/settings/data/accountRepository.test.ts) bu yanıtları ve 403 ayrımını sınar. Canlı hesap silme ayrı silinebilir hesapla yapılmadı. |
| F8 | Orta | **Kodda giderildi; canlı RLS kabul açık** | [Ödeme deposu](../../expo/src/features/stats/data/paymentRepository.ts) update/delete sonrasında etkilenen satır kimliğini ister; sıfır satırda başarı yerine bulunamadı hatası verir. [Test](../../expo/src/features/stats/data/paymentRepository.test.ts) oturum ve RLS/sıfır satır yollarını sınar. Canlı iki hesaplı deneme yapılmadı. |

## Yeniden çalıştırılan kontroller ve kanıt sınırı

| Kontrol | Sonuç | Sınır |
|---|---|
| Expo Jest + tüm `src/**/*.{ts,tsx}` kapsamı | **90/90 suite, 555/555 test**; birleşik rapor satır %63,42, dal %57,01, fonksiyon %57,28 | Hedefli iki depo koşusu %100 satır gösteriyor; birleşik raporda %0 göründüğü için bu metrik depo kapsamının kanıtı olarak kullanılmadı. Mock'lar canlı Supabase/OS değildir. |
| Expo TypeScript ve lint | Geçti, lint uyarısı yok | Çalışma zamanı/cihaz sonucu değildir. |
| Expo Doctor | **21/21** geçti | Bağımlılık ve yapılandırma denetimi. |
| Expo export | Web, Android, iOS JS bundle üretildi | Native imza ve açılış kanıtı değildir. |
| Backend `npm test` ve yerel PostgreSQL 17 | **45/45** geçti; 036 fixture/assertion ve eşzamanlı iki istemci testi geçti | SQL fixture asgari şemadır; canlı şema ve RLS politikalarının birebir kopyası değildir. |
| Flutter test/analiz | **858/858 test** geçti; `flutter analyze --no-pub` temiz | Yerel widget/domain sonucu, iOS/Android cihaz sonucu değildir. |
| Doküman denetimi | Gerçek indekste **39 izlenmeyen hedef**; geçici indekste ilgili dosyalar eklenince **temiz (39 dosya)** | Yerel dosyalar mevcut; uzak depoya henüz ulaşmadılar. |

Bu rapor için Flutter tam paketi ve analizi yeniden çalıştırıldı. Canlı veri yazımı veya fiziksel cihaz testi yapılmadı. `.env` içeriği, fiziksel iOS/Android davranışı, ikinci hesap izolasyonu ve canlı 036 doğrulanamayan alanlardır.

Bu turda `supabase migration list --linked` salt okunur tekrarlandı; uzak listede yalnız `20261010162939` var. İçerik/DDL eşlemesi bu sürüm numarasından çıkarılamadı. GitHub ana dalında Expo kalite workflow'u bulunmadı. `npm audit --omit=dev` 28 uyarı (16 yüksek, 12 orta) bildiriyor; önerilen doğrudan düzeltmeler SDK 57 zincirinden farklı ana sürümlere gidiyor. Mevcut yerel `decode-uri-component` ve `node-forge` yamaları ile imza regresyon testi korunuyor; uyumsuz toplu yükseltme yapılmadı. Fiziksel cihaz, ikinci test hesabı ve Supabase MCP erişimi bu turda sağlanmadı. Docker Desktop açılışı hata verdiği için yerel PostgreSQL 17 kullanıldı; küme testten sonra kapatıldı.

## Yayına geçiş için sıralı kapılar

1. Bekleyen migration'ları ve canlı şema farkını salt okunur doğrula; 036'nın geçen izole PostgreSQL denemelerini tam canlı şema kopyasında yeniden çalıştırıp ayrı dağıtım onayına sun.
2. 036 canlıya **ayrı onayla** uygulandıktan sonra tek işlemli yolu bir Expo build'inde aç ve eski istemci RPC'lerinin çalışmasını doğrula. O zamana kadar varsayılan düğmenin iki yazımlı riskini yayın notunda koru.
3. Fiziksel Android ve iOS'ta yenileme, planlı bildirim/erteleme, offline FIFO, PIN taşıma, iki hesap RLS ve hesap silme akışlarını [kabul matrisine](../operations/DEVICE_ACCEPTANCE.md) kanıtlarıyla işle.
4. İmzalı paket ve uzak Expo CI koşusunu doğrula; bundan sonra yayın hazırlığı puanını yeniden hesapla.
