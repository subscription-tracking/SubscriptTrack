# Expo ve backend güncel değerlendirmesi — 22 Ekim 2026

## Aynı gün ek kanıt — Supabase bağlantısı sonrası

Bu ek, aşağıdaki ilk değerlendirmede "bugün admin üzerinden incelenemedi" denilen alanları günceller. İlk bölüm tarihli değerlendirme olarak korunur. **Backend puanı 58/100, Expo kod hazırlığı 80/100 korunuyor:** erişimin açılması bir düzeltme değildir; bazı belirsizlikler olumlu kanıtla kapanırken canlı Function eksikleri de kesinleşti. Canlı yazım, migration veya deployment yapılmadı.

- Yönetim bağlantısı proje kimliği ve ACTIVE_HEALTHY durumunu doğruladı. Migration geçmişinde 033/036/037 var; 038/039 işlevleri katalogda mevcut fakat geçmiş kaydı yok.
- 15 public tabloda RLS; sahiplik politikaları, 8 idempotent RPC için anon ret/authenticated EXECUTE, silme koruma trigger'ları ve advisory kilitli 1.000 kota katalogda doğrulandı. Bunlar A/B hesap davranış testinin yerine geçmez.
- Canlı `process-export` v2 kaynak kodunda deleted_at süzgeci, formül koruması ve rate limit yok; ham hata metni dönüyor. Önceki 4. bulgu artık canlı kaynak üzerinden doğrulandı; yeni CSV üretilmedi.
- Canlı `delete-account` v2 kaynak kodunda yakın giriş kontrolü ve Storage temizliği yok; doğrudan Auth deleteUser çağrısı var. Hesap silme/kalıntı testi yapılmadı.
- Diğer iki Function da repodaki rate-limit ortak yardımcısını çağırmıyor. Rate-limit veritabanı altyapısının mevcut olması Function'ların kullandığını kanıtlamıyor.
- Canlı 037 gövdesi eşzamanlı anahtar okuma/insert bulgusunu destekliyor; gerçek paralel istek hâlâ denenmedi.
- Cron saatlik aktif, Realtime yalnız subscriptions, exports bucket özel. Leaked Password Protection kapalı. Performans advisor'ında 12 foreign key indeks INFO kaydı var; ölçülmüş performans hatası değil.
- Öncelik sırası netleşti: **canlı export ve hesap silme Function farkları → migration/temiz kurulum uzlaştırması → gerçek işlem ve A/B hesap kabulü → kontrollü bayrak açılışı**. Bayraklar bu incelemede değiştirilmedi.

Güncel ayrıntılar ve advisor açıklama bağlantıları: [canlı durum kaydı](../reference/SUPABASE_LIVE_STATUS.md).

Bu rapor mevcut çalışma ağacını değerlendirir; yalnız HEAD commit'ini değerlendirmez. Başlangıç commit'i `98b4a37`; çok sayıda mevcut değiştirilmiş/izlenmeyen dosya vardır. Uygulama kodu, özellik anahtarları ve canlı iş verileri değiştirilmedi. Canlı kontroller test hesabıyla oturum alma ve okuma ile sınırlıdır. Tam güvenlik denetimi veya yayın kabulü değildir.

## Puanlama yöntemi

Puanlar mühendislik değerlendirmesidir; tamamlanan iş yüzdesi veya istatistiksel güvenilirlik oranı değildir. Her başlıkta uygulama, otomatik davranış kanıtı, canlı uyum ve tekrar üretilebilirlik birlikte değerlendirilir. Doğrulanmamış özellik, hatalı olduğu varsayılarak değil kapanış kanıtı eksik olduğu için tam puan alamaz. Backend puanı iOS cihaz kabulü yüzünden düşürülmez. Bir puan güvenlik veya veri bütünlüğü engelini geçersiz kılamaz.

| Backend kapanış ölçütü | Puan | Gerekçe |
|---|---:|---|
| API ve şema sözleşmesi | 15/20 | Canlı okumalar ve seçili yeni kolonlar başarılı; temiz kurulum zinciri ve canlı RPC/grant envanteri eksik |
| Finansal bütünlük ve tekrar denemeler | 13/20 | Atomik RPC kodları ve testleri var; dört istemci anahtarı kapalı, 037 eşzamanlılık ve hareketli ödeme sayfalaması riski açık |
| Yetkilendirme ve güvenlik | 10/20 | Anonim profil ayrımı başarılı; iki farklı hesapla RLS/Storage/RPC kabulü ve bağımlılık risk analizi eksik |
| Canlı dağıtım ve sürüm uyumu | 9/15 | Yeni kolonlar mevcut; güncel migration geçmişi, Function sürümleri ve rollback uyumu bugün admin üzerinden okunamadı |
| Silme, export ve veri yaşam döngüsü | 7/15 | Yerel korumalar mevcut; hesap silme kalıntıları ve silinmiş kayıtların canlı export dışında kalması doğrulanmadı |
| İşletim, CI ve tekrar üretilebilirlik | 4/10 | Backend Node testleri başarılı; PostgreSQL servisi çalışmıyor, workflow izlenmiyor, doküman kontrolü başarısız; geri yükleme kabulü yok |
| **Backend toplamı** | **58/100** | **Kapanış için yeterli kanıt yok** |

| Expo kod hazırlığı ölçütü | Puan | Gerekçe |
|---|---:|---|
| Domain ve ürün davranışları | 21/25 | Para/tarih/durum/kuyruk için geniş testler; bazı yeni yollar bayrakla kapalı |
| Mimari ve ortak bileşenler | 17/20 | Katman ve ortak tasarım kontrolleri mevcut; mimari testi bu tur geçti |
| Otomatik test ve statik kalite | 17/20 | TypeScript geçti; lint 0 hata/1 uyarı; tam pakette bir timeout, tek dosya tekrarı başarılı |
| Backend entegrasyonu ve eşitleme | 13/20 | Güncel canlı okuma başarılı; atomik yeni yollar kapalı, çok hesap/cihaz ve veri değişirken sayfalama açık |
| Ekran durumları ve native kanıt | 12/15 | Ekran testleri ve önceki Android AVD kanıtı var; bu tur açılış kullanıcı tarafından doğrulandı; fiziksel Android/iOS kabulü açık |
| **Expo kod hazırlığı toplamı** | **80/100** | **Kod kapsamı güçlü; tam ürün/yayın kabulü değil** |

## Bu tur çalıştırılan kontroller

| Kontrol | Gerçek sonuç | Sınır |
|---|---|---|
| `backend: npm test` | 49/49 geçti | Bir bölümü SQL metni/sözleşmesi kontrolüdür; veritabanı işlemi yürütmez |
| `expo: npm test -- --runInBand --silent` | 141 suite: 140 geçti, 1 başarısız; 879 test: 878 geçti, 1 timeout | Tam paket ilk koşuda yeşil değil |
| Bildirim merkezi dosyası ayrı tekrar | 15/15 geçti | Tam koşudaki timeout'un kesin nedeni bulunmadı; test kararsızlığı/ortam etkisi şüphesi |
| `expo: npm run typecheck` | Geçti | Native kabul değil |
| `expo: npm run lint` | 0 hata, 1 uyarı | `ThemeProvider.test.tsx:36`, require importu |
| `backend: npm run test:postgres:local` | Çalıştırılamadı: 127.0.0.1:55459 bağlantı reddi | SQL assertion başarısızlığı değil; servis hazır olmadığı için güncel işlem kanıtı üretilemedi |
| Kimlik doğrulanmış canlı okuma smoke'u | Oturum, profil, anonim profil ayrımı, abonelik, bildirim, export, ödeme, katalog geçti | Başka hesap izolasyonu, yazım, cron veya export dosyası içeriğini kanıtlamaz |
| Canlı seçili şema alanları | `subscriptions(id,website,is_archived,deleted_at)` ve `profiles(timezone,timezone_mode)` limit=0 HTTP 200 | Alan varlığına kanıt; trigger/RLS/RPC/worker uyumuna değil |
| Kimlik doğrulanmış OpenAPI | HTTP 401 | Bu yolla RPC envanteri alınamadı; RPC yokluğu anlamına gelmez |
| Yerel bayraklar | ATOMIC_RENEWAL, IDEMPOTENT_DEFERRED, SOFT_DELETION, TIMEZONE_MODE: dördü false | `.env` yüklenmiş Node ortamında okundu; önceden kurulmuş APK'nin gömülü yapılandırmasını kanıtlamaz |
| `npm audit --omit=dev --json` | 57 etkilenen paket kaydı: 46 high, 11 moderate, 0 critical | Bağımlılık zinciri aynı advisory'yi birden fazla pakete taşır; 57 bağımsız/erişilebilir saldırı yolu değildir. Araç zinciri paketleri de listede. Kullanılabilirlik analizi yapılmadı |
| `tools/docs/check_docs.py` | 54 sorun | Kayıp veya Git tarafından izlenmeyen hedef referansları; hepsi diskte kayıp demek değil. İlk çıktı encoding hatası sonrası UTF-8 ile tekrarlandı |

Bu oturumun önceki bölümünde Android Metro paketi 2.071 modülle başarıyla üretildi ve kullanıcı uygulamanın açıldığını doğruladı. Bu değerlendirmede fiziksel Android, iOS, gerçek ödeme/abonelik yazımı, yeni kullanıcı veya hesap silme işlemi yapılmadı.

## Öncelikli bulgular ve kapanış koşulları

1. **Yüksek — yeni güvenli yollar yerel istemcide etkin değil.** `expo/src/core/config/env.ts` dört bayrağı yalnız `true` değerinde açar. `paymentRepository.ts` eski ertelenmiş ödeme yolunda anahtarı kullanmadan INSERT yapar. `subscriptionMutationCoordinator.ts` atomik yenileme kapalıyken ödeme ve güncellemeyi ayrı yürütür. Yeni RPC'lerin canlı davranışı kanıtlanıp uyumlu build'de etkinleştirilmelidir; doğrudan bayrak açmak çözüm değildir.
2. **Yüksek — tam şema temiz kurulum kanıtı eksik.** Canonical migration planı `002_mobile_ready.sql` dosyasını dışlar. İstemci `website` ve `is_archived` seçer; taranan migration'larda `website_url` vardır, `website` tanımı bulunmadı ve 038 `is_archived` alanını eklemeden kullanır. Canlıda bu alanlar bugün mevcuttur; risk canlı okuma değil repodan aynı ortamın yeniden kurulabilmesidir. Tam Supabase şemasına temiz kurulum testi ve additive uzlaştırma gerekir. Bu tur temiz kurulumla yeniden üretilmedi; statik bulgudur.
3. **Yüksek — hesaplar arası izolasyon ve veri temizliği kabulü açık.** Bugünkü anonim profil ayrımı iki hesap RLS testi değildir. A/B hesaplarıyla tablo/RPC/Storage/Realtime ve export sınırı; ayrı silinebilir hesapla Auth, ilişkili DB satırları ve Storage temizliği kanıtlanmalıdır.
4. **Yüksek — canlı export worker uyumu belirsiz.** 13 Ekim canlı durum kaydı eski worker'ın `deleted_at` süzgeci ve diğer korumaları içermediğini bildirir. Repodaki worker süzgeç ve hız sınırı içerir. Bugün Function kaynak/sürümü incelenemedi; eski bulgu bugün yeniden üretildi denemez. Silinmiş kaydın normal export'a girmediği ve CSV koruması güncel dağıtımla sınanmalıdır.
5. **Orta — 037 eşzamanlı aynı anahtar davranışı.** RPC anahtarı okuduktan sonra ödeme ve anahtar ekler; açık seri kilit/çatışma sonrası kayıtlı sonucu döndürme yolu yoktur. Aynı anahtarlı iki paralel çağrının ikincisi unique ihlali alabilir; rollback çift ödeme riskini sınırlasa da her iki çağrıya aynı sonuç garantisi kanıtlanmış değildir. Güncel PostgreSQL concurrency testi gerekir. Bu statik bulgudur, bu tur yeniden üretilmedi.
6. **Orta — ödeme geçmişinde hareketli offset sayfalama.** `paymentRepository.ts` 500 kayıtlık `.range(...)` sayfaları kullanır. İstekler arasında ekleme/silmede sayfa sınırı kayabilir; ikinci sıralama tek başına bunu çözmez. Araya yazım testi ve tutarlı cursor/snapshot yaklaşımı değerlendirilmelidir. Bu tur statik bulgudur.
7. **Orta — kalite kontrolleri tekrar üretilebilir değil.** Bir tam paket timeout'u, çalışmayan yerel SQL servisi ve 54 doküman kontrol sorunu vardır. Yerel Expo workflow ve 038/039 dosyaları bu tur `git ls-files` çıktısında görünmedi; bu dosyaların temiz checkout ve uzak CI'da bulunduğu kabul edilemez. Kullanıcı değişiklikleri commit/stage edilmedi.
8. **Orta — bağımlılık riskleri sınıflandırılmalı.** Audit sayıları günceldir; exploit kanıtı değildir. node-forge sahte/geçerli imza koruma testi bu tur geçti; bu, paketin tüm advisory'lerini kapatmaz. Audit bazı düzeltmelerde Expo 44 gibi geriye sürüm önerir; otomatik force fix uygulanmadı.

## Backend kapanış sırası

1. Repo–canlı envanterini ve temiz kurulum zincirini uzlaştır; migration'ları körlemesine yeniden uygulama. Bugün 038/039 kolonları mevcuttur; 039'daki idempotent olmayan adımlar için mevcut nesneleri incele.
2. Tekrarlanabilir yerel SQL ortamını kur/başlat; 036/037/038/039 sahiplik, rollback ve eşzamanlılık testlerini çalıştır; minimal fixture yanında tam şema kabulünü ekle.
3. Canlı export/hesap silme/limit Function sürümlerini ve Auth ayarlarını doğrula. Yetkili dağıtım sonrasında ayrı test hesaplarıyla kabul et.
4. A/B hesap izolasyonu, eski istemci uyumu, silme sonrası geçmiş ve kalıntı kontrollerini tamamla.
5. Dört anahtarı bağımlılıkları doğrulandıktan sonra uyumlu build'de kontrollü aç; gerçek Expo ödeme/yenileme/silme/bölge akışını ve hata sonrası tekrarı kabul et.
6. Dokümanları ve izlenmeyen gerekli dosyaları uzlaştır; CI, hata izleme ve geri yükleme kanıtını tamamla.

Bir sonraki kapı için öneri: en az 85/100 ve açık kritik/yüksek veri bütünlüğü veya erişim engeli olmaması. Bu ekip için önerilen ölçüttür; önceden onaylanmış ürün standardı değildir. iOS ve fiziksel Android yayın kapısı ayrıca açık kalır.

## Kanıt kaynakları

- `docs/reference/SUPABASE_LIVE_STATUS.md`: 13 Ekim tarihli admin envanteri; bugünkü Function veya migration listesi değildir.
- `docs/quality/expo-59/CONTRACT.md`, `REPORT.md`, `ACCEPTANCE.md`: ürün sözleşmesi, önceki yerel işlem kanıtı ve açık native/canlı kapılar.
- `docs/quality/expo-scenario-review-2026-10-13.md`: aynı gün eklenen düzeltmeler ve emülatör sonuçları önceki bulgu satırlarıyla birlikte okunmuştur.
- Mevcut Graphify grafı önceki tur Python modülüyle sorgulandı; yeniden oluşturulmadı. Eski graf güncel değiştirilmiş/izlenmeyen dosyaların kanıtı yerine kullanılmadı.

Bu rapor önceki puanlarla birebir ilerleme karşılaştırması değildir: ölçütler ve kanıt kapsamı farklıdır. Yeni test sayıları bu tarihli değerlendirmede tutulur; önceki sonuçlar yeniden çalıştırılmış gibi sunulmaz.
