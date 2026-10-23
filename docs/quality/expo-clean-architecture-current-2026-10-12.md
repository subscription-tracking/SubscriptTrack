# Expo — refactor sonrası mimari ve temiz kod puanlaması

> Bu puanlama ilk refactor anının kaydıdır. Kalan kod maddelerinin sonraki uygulanma sonucu: [mimari kapanış raporu](expo-architecture-completion-2026-10-12.md). Aşağıdaki kalan bulgular artık o tarihteki durum olarak okunmalıdır.

Tarih: 12 Ekim 2026. Bu rapor önceki aynı tarihli mimari incelemesinin refactor sonrası değerlendirmesidir. Uygulama kodu bu değerlendirmede değiştirilmedi.

## Kapsam ve kanıt

243 test dışı `expo/app` ve `expo/src` TypeScript/TSX dosyası AST üzerinden dosya uzunluğu, import deklarasyonları ve fonksiyon uzunluğu açısından yeniden tarandı. Genişletilmiş mimari testi yeniden çalıştı: 6/6 geçti; kontrolün çözebildiği bağımlılıklarda döngü veya katman ihlali bulunmadı. Literal import/export/require/dynamic import ve TypeScript modül çözümü kapsam içindedir; hesaplanmış dinamik yollar ve runtime çağrı ilişkileri değildir. Pure domain'in dört saf biçimlendirme/palette istisnası açık ve bağımlılıkları denetim altındadır.

Oluşturma, eşitleme adaptörleri, PIN servisi/sağlayıcısı, yerel decoder, takvim ve iptal ekranının ilgili sorumlulukları yeniden okundu. Her dosyanın tüm satırlarının semantik yeniden denetimi iddia edilmez. Graphify mevcut grafikte sorgu çıktı üretmedi; grafikten ilişki kanıtı çıkarılmadı.

Önceki uygulama turunun son kanıtı: 94 suite / 580 test, tip kontrolü, önbelleksiz Expo lint ve Android/iOS JS export başarılı. Bu değerlendirme turunda yalnız mimari test tekrar çalıştırıldı; kapsam yüzdesi ve native kabul yeniden ölçülmedi.

## Güncel puan

Puanlar proje içi uzman değerlendirmesidir; standart veya otomatik araç puanı değildir. Önceki üç başlığın ağırlığı korunmuştur: mimari %40, temiz kod %35, sorumluluk ayrımı %25. Ayrıntılı alt ölçütler bu raporda açıklaştırılmıştır; eski puanın aynı ayrıntılı alt ölçütlerle hesaplandığı iddia edilmez.

| Başlık | Önce | Güncel |
|---|---:|---:|
| Clean Architecture | 80 | **86/100** |
| Clean Code | 76 | **82/100** |
| God file / sorumluluk ayrımı | 70 | **80/100** |
| Ağırlıklı toplam | 76 | **83/100** |

Hesap: 86 × 0,40 + 82 × 0,35 + 80 × 0,25 = 83,1; tam sayıya yuvarlandı. God file başlığında yüksek puan daha iyi sorumluluk ayrımı anlamına gelir. Bu puan genel ürün kod kalitesi veya yayın hazırlığı puanının yerine geçmez.

### Clean Architecture — 86/100

| Ölçüt | Puan | Kanıt ve kesinti |
|---|---:|---|
| Domain bağımsızlığı | 23/25 | Money/tarih/geçiş/FIFO saf; domain sunum modellerinde dört açık format/palette istisnası (-2) |
| Katman ve iş akışı sınırları | 22/25 | Oluşturma, PIN, renewal, CSV ayrıldı; use-case'ler hâlâ data altında ve UI mesajları koordinatörde (-3) |
| Bağımlılık tersine çevirme | 17/25 | Oluşturma bağımlılıkları verilebilir, FIFO handlers dışarıdan; sync/PIN concrete modül importlarına bağlı (-8) |
| Mimari koruma | 24/25 | AST/proje çözümü ve tüm dosyalarda döngü kontrolü; hesaplanmış dinamik yollar çözülemez (-1) |

### Clean Code — 82/100

| Ölçüt | Puan | Kanıt ve kesinti |
|---|---:|---|
| İsimlendirme ve okunabilirlik | 18/20 | Açık iş isimleri; yoğun inline koşullar/uzun nesne satırları (-2) |
| Fonksiyonlar ve tekrar | 16/20 | Form/ödeme sadeleşti; takvim, CSV, form bölümü uzun fonksiyonlar içeriyor (-4) |
| Hata ve sonuç sözleşmesi | 17/20 | Kısmi başarı ve fail-closed PIN var; storage hatası locked_out, bazı adaptör fallback'leri hata türünü kaybediyor (-3) |
| Veri sınırı doğrulaması | 16/20 | Sürüm/sahip/aşama/alan tipi doğrulaması var; Money/date/enum değer doğrulaması bütünlüklü değil (-4) |
| Test edilebilirlik | 15/20 | Yeni gerçek hata dalları ve concurrency testi var; bazı servisler global mock gerektiriyor, kapsama tekrar ölçülmedi (-5) |

### God file / sorumluluk ayrımı — 80/100

| Ölçüt | Puan | Kanıt ve kesinti |
|---|---:|---|
| Modül uyumu | 23/30 | Depo/runtime/RPC/PIN sınırları açık; bildirim servisinde çoklu native sorumluluk sürüyor (-7) |
| Koordinatör sorumlulukları | 23/30 | Oluşturma UI dışına çıktı; sync çok aşama ve concrete I/O bağlarını hâlâ yönetiyor (-7) |
| Ekranların sadeliği | 20/25 | Form ve ödeme sadeleşti; CSV/takvim/iptal/settings fonksiyonları yoğun (-5) |
| Otomatik koruma ve izlenebilirlik | 14/15 | AST/cycle/320 satır koruması var; otomatik sorumluluk ölçümü yok (-1) |

## Kalan bulgular

| Öncelik | Konum | Sonuç ve öneri |
|---|---|---|
| Orta | `expo/src/features/subscriptions/data/subscriptionSync.ts:45`, `:136`, `:147` | Seri yürütücü ayrı kurulabilir fakat sync hâlâ tek ortak instance ve concrete repository'ler kullanır. Veri karışması kanıtı yok. Koordinatöre minimal bağımlılık nesnesi ver; kullanıcıya göre zincir ayrılacaksa FIFO/session regresyonunu koru. |
| Orta | `expo/src/features/subscriptions/data/subscriptionMutations.ts:15`, `:18`, `:20` | İş akışı concrete ödeme/sync/config bağımlılıklarına bağlı. RPC adaptörü iyileşme; tam port/composition ayrımı henüz yok. Önce değişken I/O sınırlarını ayrıştır. |
| Orta | `expo/src/features/subscriptions/data/createSubscriptionWorkflow.ts:16`, `:39`, `:47` | UI tone ve Türkçe mesaj koordinatörde. Domain/application sonuç kodlarını sunum mesajlarından ayır. Bu UI geri davranışını değiştirerek yapılmamalı. |
| Orta | `expo/src/features/subscriptions/domain/storedSubscriptions.ts:7`, `:10`, `:34` | Array cast sorunu çözüldü; amount için string olmak yeterli kabul ediliyor, date alanları string/null. Örneğin geçerli satırda amount='abc' decoder'dan geçebilir. Money parse, civil date ve enum değer kontrolü ekle; eski geçerli kayıtları yanlış reddetme. Bu turda bozuk cihaz kaydı yeniden üretilmedi; predicate kodundan doğrulandı. |
| Orta | `expo/src/features/settings/ui/AppLockProvider.tsx:84` | Storage reddi locked_out sonucu döndürüyor; güvenli hata ekranı içeriği kapatır, fakat çağıran sonucu gerçek deneme kilidiyle karıştırabilir. Ayrı storage_error sonucu kullan ve hata ekranını koru. Güvenlik bypass'ı iddiası değildir. |
| Orta | `expo/src/features/subscriptions/data/subscriptionRuntime.ts:15` | Ağ algılama reddi true'ya indirgenir. Korunan mevcut politika; unknown bağlantı durumunu gözlemlenebilir sonuçla ayırmak teşhisi iyileştirir. |
| Orta | `expo/src/features/calendar/ui/CalendarScreen.tsx:86`, `expo/src/features/subscriptions/ui/CsvImportScreen.tsx:33` | Month 120, CSV ekran fonksiyonu 129 satır; UI durum/hesap/çizim bir arada. Controller hook ve anlamlı sunum parçaları düşünülebilir. Uzun JSX tek başına davranış kusuru değildir. |
| Düşük | `expo/src/features/subscriptions/ui/form/DetailsSection.tsx:29` | 146 satırlık tek sunum fonksiyonu. İlk ödeme ve hatırlatma bölümleri ayrı cohesive bileşenlere alınabilir. |
| Düşük | `expo/src/features/subscriptions/ui/SubscriptionCancelScreen.tsx:147` | Form/mutation/cache/navigasyon birlikte, 29 import. İş kuralı saf domain'de olduğundan kritik god file sayılmaz; action hook ile UI sadeleşebilir. |

## God file adaylarının güncel durumu

| Dosya | Satır | Karar |
|---|---:|---|
| subscriptionSync.ts | 186 | Riski azaldı; koordinatör bağımlılıkları nedeniyle hâlâ aday |
| SubscriptionFormScreen.tsx | 171 | Önceki güçlü aday büyük ölçüde giderildi; ekleme takip yazımları dışarıda |
| PaymentHistoryScreen.tsx | 225 | Riski azaldı; mutation hook dışında, sunum/sorgu bileşimi sürüyor |
| AppLockProvider.tsx | 129 | Riski azaldı; PIN I/O serviste, provider yaşam döngüsü/state yönetiyor |
| CsvImportScreen.tsx | 247 | Orta risk; I/O ve fallback ayrıldı, ana ekran hâlâ yoğun |
| CalendarScreen.tsx | 294 | Orta risk; Month 120 satır |
| notificationScheduler.ts | 255 | Orta risk; izin/native yükleme/diff/restore/tap/erteleme bir arada, cohesive servis yönü var |
| tokens.ts | 320 | God file sayılmadı; tasarım verisi ve sıfır import |
| DetailSections.tsx | 276 | God file sayılmadı; en uzun fonksiyon 26 satır, küçük sunum bölümleri |

## Sonuç

Önceki 76'dan 83'e artışın nedeni dosya sayısı veya satır azalması değil: takip yazımlarının UI dışına çıkması, PIN I/O ve yarış yönetiminin ayrılması, bozuk yerel kayıtların korunması ve mimari korumanın genişlemesidir. Daha yüksek puan için öncelik semantik veri doğrulaması, açık hata sonuçları, değişken I/O bağımlılıklarının verilmesi ve yoğun ekranların sorumluluğa göre sadeleştirilmesidir. Native kabul ve veri biçiminde downgrade uyumluluğu ayrı kapılar olarak kalır.
