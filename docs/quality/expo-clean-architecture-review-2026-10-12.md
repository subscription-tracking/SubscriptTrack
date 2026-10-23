# Expo — Clean Architecture, Clean Code ve god file analizi

Tarih: 12 Ekim 2026. Kapsam: Expo; Flutter yeniden denetlenmedi. Uygulama kodu değiştirilmedi.

## Yöntem ve sınır

`app/` ve `src/` içindeki test dışı 234 TypeScript/TSX dosyası TypeScript AST ile tarandı. Import/export ve literal require/dynamic import üzerinden çözülebilen 929 yerel bağımlılık kenarı incelendi; tip importları da dahildir. Bu statik grafikte dosya döngüsü bulunmadı. Domain dosyalarında dış paket import'u görülmedi. Dinamik hesaplanan modül yolları, çalışma zamanı çağrı grafiği ve native davranış bu ölçümün dışında kalır.

Sorumluluk incelemesi form, ödeme geçmişi, CSV, eşitleme, yenileme, PIN sağlayıcısı, bildirim zamanlayıcısı ve mimari koruma testlerinde derinleştirildi. Diğer dosyaların bağımlılık ve boyut taraması yapıldı; 234 dosyanın her satırının semantik olarak yeniden denetlendiği iddia edilmez. Graphify grafiği mevcut; sorgu çıktı üretmedi. Sonuçlar Graphify tarafından doğrulanmış ilişki gibi sunulmaz.

Yeni kontroller: mimari testi 6/6 geçti; tip kontrolü ve lint geçti. Önceki genel kalite puanı bu sınırlı incelemede yeniden hesaplanmadı.

## Genel değerlendirme

Uygulama, saf domain kuralları ve feature bazlı data/ui ayrımı olan düzenli bir katmanlı mimariye sahiptir. Tam Clean Architecture açısından uygulama/use-case sınırı ve bağımlılıkların tersine çevrilmesi eksiktir: çok adımlı işlemler bazen ekranlarda, bazen doğrudan SDK kullanan data koordinatörlerinde kalır. Mevcut belgeler UI → data kullanımına izin verir; dolayısıyla bu durum mevcut klasör sözleşmesinin ihlali olarak sunulmaz.

Para, tarih, durum geçişleri ve FIFO algoritmasının saf modüllere alınması güçlü taraflardır. `mutationQueue.ts` işleyicileri dışarıdan alarak I/O'dan ayrılır. Ortak tasarım tokenları ve form/detail alt bileşenleri de tekrar kullanım sağlar.

## Bulgular ve çözümler

### A1 — Yüksek öncelik: abonelik oluşturma işlemi ekran içinde parçalanmış

Konum: `expo/src/features/subscriptions/ui/SubscriptionFormScreen.tsx:87`, `:95`, `:111`, `:127`, `:153`.

Ekran form durumu, oluşturma/düzenleme, hatırlatma güncellemesi, ilk ödeme, ertelenmiş ödeme, cache yenileme ve navigasyonu birlikte yönetir. Sonraki yazımlar `onSuccess` içinde yapılır; alt adımlar hatalarını yakalayıp mesaj gösterir ve ana akış geri döner. Çevrimdışı oluşturmanın ilk ödeme/özel hatırlatma davranışı da ekranın içinde kararlaştırılır. Bu kısmi başarı mevcut kodda açıkça bildirilir; işlem atomik değildir.

İnceleme yolu: yeni abonelikte farklı hatırlatma ve ilk ödeme seç; oluşturma başarılı, takip yazımı başarısız olduğunda `onSuccess` zincirini izle. Bu turda native hata enjeksiyonu yapılmadı; sonuç koddan doğrulandı.

Çözüm: oluşturma sonrası işleri tek uygulama iş akışına taşı. Sonucu `subscriptionSaved`, `remindersSaved`, `paymentSaved`, `queued` gibi açık alanlarla temsil et; UI yalnız sonucu kullanıcıya göstersin. Uzak yazımların atomiklik/yeniden deneme politikası ayrıca korunmalı. Sadece fonksiyonları başka dosyaya taşımak sorumluluk ayrımı sağlamaz.

### A2 — Orta öncelik: eşitleme koordinatörü fazla altyapı sorumluluğu taşıyor

Konum: `expo/src/features/subscriptions/data/subscriptionSync.ts:47`, `:67`, `:87`, `:142`, `:184`, `:207`, `:225`.

Tek modül cache/kuyruk depolama, ağ algılama, zaman aşımı, seri yürütme, oturum doğrulama, abonelik yazımı, olay ve tasarruf yazımını birleştirir. Modül düzeyindeki tek `chain` tüm kullanıcıların işleri için paylaşılır. Bu tasarım veri karıştığını kanıtlamaz; hesaplar arası bekleme ve bağımsız test kurma maliyeti yaratır. Pure FIFO algoritmasının ayrı olması olumlu.

İnceleme yolu: depolama, ağ veya oturum davranışını ayrı sınamak için modülün global importlarını ve ortak seri zincirini değiştirmek gerektiğini izle.

Çözüm: önce queue/cache deposunu ve oturum/ağ adaptörlerini ayır; koordinatöre küçük bağımlılık nesnesi ver. Kullanıcı başına yürütme tercih edilirse aynı hesabın FIFO garantisi korunmalı ve hesap değişimi testleri geçmeli. Her repository için gereksiz yeni arayüz katmanı eklenmemeli.

### A3 — Orta öncelik: depodan okunan veri yalnız array kontrolüyle güvenilir sayılıyor

Konum: `expo/src/features/subscriptions/data/subscriptionSync.ts:47`, `:56`; `expo/src/core/storage/secureJsonStore.ts:8`.

JSON girdisi `unknown` olarak okunuyor ancak yalnız `Array.isArray` sonrası QueueEntry/SubscriptionRow dizisine cast ediliyor. JSON olarak geçerli fakat yanlış biçimli kayıtlar domain işlemlerine ulaşabilir. Depo okuma hatası ile kayıt bulunmaması da aynı `null` sonucuna indirgeniyor; kuyrukta hata teşhisi zorlaşır.

Yeniden üretme girdisi: depo okuyucusunu `[{}]` döndürecek şekilde mock'la; loadQueue bu girdiyi geçerli giriş gibi döndürür. Bu davranış cast kodundan doğrulanmıştır; bu turda yeni test eklenmedi.

Çözüm: sürümlü kayıt biçimi, alan/discriminant doğrulaması ve bozuk veriyi ayrı sonuçla raporlama ekle. Geçersiz kuyruğu sessizce silmek yerine kurtarma politikası tanımla. Eski kayıt göçü ve bozuk giriş testleri gerekir.

### A4 — Orta öncelik: yenileme use-case'i SDK ve sunucu hata kodlarına bağlı

Konum: `expo/src/features/subscriptions/data/subscriptionMutations.ts:20`, `:95`, `:103`, `:114`.

İş akışı özellik anahtarı, Supabase RPC, PostgreSQL hata kodları, ödeme ve offline abonelik güncellemesini aynı fonksiyonda yönetir. İş akışı testi SDK mock'una bağlanır; backend sözleşmesi değişince koordinatör de değişir. Mevcut data katmanı kurallarına uygundur fakat tam bağımlılık tersine çevirme sağlamaz.

Çözüm: atomik yenileme çağrısı ve hata çevirisini repository adaptörüne al; use-case typed sonuç üzerinden karar versin. Geçiş bayrağını composition/config sınırında seç. Eski iki yazımlı yolun atomiklik riski ayrıca mevcut genel denetimde açık kalır; bu analiz canlı anahtarı açma yetkisi vermez.

### A5 — Orta öncelik: mimari koruma testleri iddia edilen kapsamdan dar

Konum: `expo/src/architecture.test.ts:25`, `:42`, `:93`, `:102`, `:127`.

Import çözümü regex tabanlıdır; require/dynamic import ve alias hedeflerini kapsamaz. SDK kontrolü Supabase ve react-native ile sınırlıdır; domain'e Expo/React/TanStack import edilmesini genel olarak engellemez. Döngü grafiği aynı feature/katman içindeki kenarları atlar; core/shared ve feature kökündeki AuthProvider gibi dosyalar grafiğe girmez. 320 satır testi sorumluluk/karmaşıklık ölçmez.

İnceleme yolu: testin filtrelerini ve `to !== from` koşulunu oku. Bu turdaki daha geniş dosya grafiğinde döngü bulunmadı; test boşluğu mevcut döngü iddiası değildir.

Çözüm: TypeScript çözümleyicisi ile tüm kaynak dosyalarını kapsayan grafiğe geç; pure domain için izinli import listesi kur. Bilinçli composition/provider istisnalarını açık kaydet. Boyut sınırını yardımcı gösterge tut; sorumluluk incelemesinin yerine kullanma.

### A6 — Orta öncelik: PIN güvenliği React sağlayıcısına bağlı

Konum: `expo/src/features/settings/ui/AppLockProvider.tsx:29`, `:47`, `:53`, `:76`, `:101`.

131 satırlık sağlayıcı depodan yükleme, yaşam döngüsü kilidi, PIN doğrulama/upgrade, deneme sayısı, kalıcı lockout ve biyometriyi yönetiyor. `void refresh()` için hata yolu tanımlanmamış; storage reddinde ready durumunun nasıl toparlanacağı açık değildir. Bu bir güvenlik bypass'ı kanıtı değildir.

İnceleme yolu: readAppLock'u reject eden mock ile mount davranışını kontrol et; kodda refresh reddini ele alan catch veya error state yoktur. Native yeniden üretim bu turda yapılmadı.

Çözüm: kilit kararlarını saf reducer/servise, storage ve biyometriyi adaptörlere taşı; provider state ve yaşam döngüsü bağlantısını kursun. Storage hatasında kilidi güvenli tutan hata/tekrar deneme durumu tanımla. PIN upgrade, eşzamanlı deneme ve oturum değişimi davranışları korunmalı.

## God file adayları

Satır sayısı sondaki boş satırı içerir. Import sayısı deklarasyon sayısıdır. Hook sayısı AST'de `useX` adını taşıyan çağrıların tüm dosyadaki toplamıdır; çalışma zamanı/render maliyeti değildir. Uzun fonksiyon JSX ve iç fonksiyonları içerir, tek başına karmaşıklık puanı değildir.

| Dosya | Satır / import | Karar ve gerekçe |
|---|---:|---|
| SubscriptionFormScreen.tsx | 243 / 30 | En güçlü aday: UI ve çok adımlı veri işlemi; ana fonksiyon 165 satır |
| subscriptionSync.ts | 240 / 11 | Güçlü aday: çok sayıda altyapı sorumluluğu; A2 |
| PaymentHistoryScreen.tsx | 276 / 25 | Aday: sorgu birleşimi, üç mutation, diyalog ve kart; History 107 satır |
| AppLockProvider.tsx | 131 / 11 | Aday: küçük dosyada güvenlik ve yaşam döngüsü; A6 |
| CsvImportScreen.tsx | 263 / 22 | Aday: dosya I/O, parse, durum önizlemesi, import, modal; ana fonksiyon 133 satır |
| notificationScheduler.ts | 255 / 4 | Orta risk: native yükleme, izin, diff/restore, erteleme ve tap; cohesive servis, hemen parçalamak şart değil |
| CalendarScreen.tsx | 294 / 20 | İzlenecek: Month 120 satır; boyutu tek başına god file kanıtı değil |
| shared/design/tokens.ts | 320 / 0 | God file sayılmadı: merkezi tasarım verisi; yalnız boyuta göre bölünmemeli |
| DetailSections.tsx | 276 / 8 | God file sayılmadı: küçük sunum bölümleri, en uzun fonksiyon 26 satır |

Ödeme geçmişinde `PaymentHistoryScreen.tsx:88`, `:107`, `:119` mutation'ları bir usePaymentHistoryActions hook'unda birleştirilebilir; kart ayrı sunum bileşeni olabilir. CSV'de `CsvImportScreen.tsx:30` durum fallback hesabı domain'e, `:57` dosya okuma adaptöre, `:71` import koordinasyonu uygulama iş akışına taşınabilir. Bunlar davranış kusuru kanıtı değil, bakım iyileştirmeleridir.

## Uygulama sırası ve kabul

1. Depo veri doğrulaması ve PIN storage hata yolunu davranış testleriyle güvenceye al.
2. Oluşturma iş akışını UI dışına çıkar; kısmi başarı ve offline davranışını açık sonuç sözleşmesiyle koru.
3. Eşitlemenin I/O bağımlılıklarını ayır; FIFO, oturum değişimi ve aşamalı retry regresyonlarını çalıştır.
4. Yenileme RPC adaptörünü ayır; özellik anahtarı ve mevcut fallback davranışını koru.
5. Ödeme/CSV ekranlarını sorumluluklarına göre sadeleştir; sadece satır azaltmak için bölme.
6. Mimari testleri AST çözümü ve dosya düzeyinde döngü kontrolüyle genişlet.

Her adımda ilgili davranış testleri, tip kontrolü ve lint geçmeli. Mimari belge mevcut uygulamayı anlatacak şekilde aynı değişiklikte güncellenmeli; örneğin `docs/expo/ARCHITECTURE.md:101` tek AppError iddiası mevcut ayrı hata tipleriyle uzlaştırılmalı. Yeni genel kalite/yayın puanı için daha geniş denetim gerekir. Native PIN/bildirim ve cihaz kabulü bu statik raporla kapanmaz.
