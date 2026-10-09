# Sprint Planı — Expo Sayfaları

> Bu belge [PARITY.md](PARITY.md) satırlarını [ROADMAP.md](ROADMAP.md) aşamalarına bağlı sprintlere böler. Sprintler sırayla ilerler; bir sprintin "Bitti tanımı" sağlanmadan sonrakine geçilmez. Sprint süreleri tarih yerine iş boyutuyla (S/M/L) verilir. Tarih sözü verilmez, çünkü cihaz doğrulaması ve Supabase tarafındaki kararlar takvimi belirler.

## Ortak Bitti tanımı (her sprint için)

Bir ekran ancak aşağıdakilerin tümü sağlandığında "Kod tamam" olur:

- Ekran loading, error, empty ve offline durumlarını gösterir ([AGENTS.md](../../AGENTS.md) kuralı).
- Domain kuralları UI'dan ayrı, saf fonksiyonlar olarak test edilir.
- `npx tsc --noEmit --noUnusedLocals --noUnusedParameters` hatasız geçer.
- `npx jest` geçer; mimari testi (`architecture.test.ts`) ve tasarım sistemi testi (`design-system.test.ts`) kırılmaz.
- Yeni dosya 320 satırı aşmaz.
- Para değerleri `Money`, tarihler `CivilDate` ile hesaplanır; floating point yok.
- Silme yok: normal akışta iptal, sona erme ve arşiv kullanılır.
- [PARITY.md](PARITY.md) satırı ve ilgili belge aynı değişiklikte güncellenir.

"Tamam" durumu için ayrıca [DEVICE_ACCEPTANCE.md](../operations/DEVICE_ACCEPTANCE.md) senaryosu iOS ve Android'de çalıştırılır. Bu, sprint sonunda toplu yapılır ve Sprint 7'de kapanır.

## Sprint özeti

| Sprint | Aşama | Odak | Ekranlar | Boyut | Engel |
|---|---|---|---|---|---|
| S1 | 2 | Abonelik yaşam döngüsü | Düzenleme, durum aksiyonları, arşiv, arşiv listesi, ekleme satırı kapanışı | M | Fiyat değişikliği event kaydı için API doğrulaması |
| S2 | 2 | Abonelik liste ve realtime | Liste filtreleri, realtime, servis kataloğu | M | `support-catalog` sözleşmesi |
| S3 | 3 | Offline | Cache, mutation kuyruğu, senkron, offline banner | L | S1 ve S2 tamam olmalı |
| S4 | 4 | Dashboard ve takvim | Ana sayfa, Takvim | L | S3 |
| S5 | 4 | İstatistik, ödeme geçmişi, tasarruf, iptal akışı | İstatistikler, Ödeme geçmişi, Tasarruf | L | Ödeme geçmişi tablosu ve RPC sözleşmesi |
| S6 | 5 | Bildirim | Bildirim merkezi, bildirim tercihleri, deep link, izin akışı | L | `expo-notifications` kurulumu, cihaz testi |
| S7 | 6 | Ayarlar ve gizlilik (1) | Ayarlar ana ekranı, Profil, Görünüm, Uygulama kilidi, Gizlilik merkezi | L | Uygulama kilidi cihaz doğrulaması |
| S8 | 6 | Ayarlar ve gizlilik (2) | Veri dışa aktarma, Hesap silme, Geri bildirim, Ödeme yöntemleri | L | Hesap silme sunucu akışı, yakın giriş şartı |
| S9 | 6 | Onboarding, yasal metin, CSV | Onboarding, Gizlilik politikası, Kullanım koşulları, CSV içe aktarma | M | Yasal metin içeriği ürün sahibinden |
| S10 | 7 | Parite ve cihaz kabulü | Tüm PARITY satırları, DEVICE_ACCEPTANCE | M | Mac veya EAS Build |
| S11 | 8 | Karar | Flutter ile karşılaştırma, ADR | S | Kullanıcı kararı |

## S1 — Abonelik yaşam döngüsü (Aşama 2)

**Durum (2026-10-09): Kod tamam.** Düzenleme, durum aksiyonları, arşiv ve arşiv listesi yazıldı; 154 test ve tip kontrolü geçiyor. Cihaz ve canlı veri doğrulaması yapılmadı. Migration gerekmedi: RPC ve `subscription_events` RLS politikası mevcut. Olay yazımı istemcide ve atomik değil (bkz. [API.md §4](../reference/API.md)).

**Hedef:** Bir abonelik eklenip düzenlenebilir, durdurulabilir, iptal edilebilir ve arşivlenebilir. Silme yok.

**Kapsam**

- `app/subscriptions/[id]/edit.tsx`: mevcut form bileşeni düzenleme modunda çalışır. Alanlar eklemedeki gibi doğrulanır. Sunucu hatasında form içeriği korunur.
- Fiyat değişikliği: tutar değiştiğinde eski ve yeni tutar, tarih ve neden kaydedilir ([USER_FLOWS §6](../product/USER_FLOWS.md)).
- Durum aksiyonları (detay ekranında): durdur (`PAUSED`), devam ettir, iptal (`CANCELLED`), sona erdi işaretle (`EXPIRED`), arşivle (`ARCHIVED`). Her aksiyon onay ister; iptal aksiyonu sağlayıcı iptal bağlantısını gösterir.
- Arşivlenmiş abonelikler ekranı (`app/subscriptions/archived.tsx`): arşivden geri alma.
- PARITY'de "Abonelik ekleme" satırı "Kod tamam" olarak güncellenir (ekran zaten yazıldı; yalnızca belge geride kaldı).

**Bağımlılık ve açık sorular**

- Fiyat değişikliği kaydı için tablo ve RPC var mı? [API.md](../reference/API.md) ve Supabase şeması doğrulanacak. Yoksa yeni migration gerekir; migration canlı projeye uygulanmadan önce kullanıcı onayı alınır.
- Sona erme aksiyonu kullanıcı tarafından mı, yoksa tarih geçince mi tetiklenir? Ürün kuralı [DOMAIN §7](../product/DOMAIN.md) ile birlikte netleştirilecek.

**Test planı**

- Domain: durum geçiş tablosu (izinli ve izinsiz geçişler), fiyat değişikliği kaydı oluşturma, düzenleme formunun değişen alanlarını bulma.
- Repository: RPC parametre eşlemesi ve hata sınıflandırması (23514, 42501).
- UI: düzenleme formunda sunucu hatasında değerlerin korunması; iptal onayı.

**Bitti tanımı:** Ortak bitti tanımı + durum geçişleri ve arşiv geri alma testlerle kapsanır.

## S2 — Liste filtreleri, realtime ve servis kataloğu (Aşama 2)

**Durum (2026-10-09): Kod tamam.** Filtre sayfası, gecikmiş yenileme onayı, realtime senkron ve servis önerileri yazıldı; 183 test ve tip kontrolü geçiyor. Cihazda ve canlı ortamda (realtime, `support-catalog` çağrısı) doğrulama yapılmadı. Migration gerekmedi.

**Hedef:** Liste, kullanıcının aradığı aboneliği hızlı bulmasını sağlar; çoklu cihazda güncel kalır.

**Kapsam**

- Filtreler: durum, kategori, para birimi, yaklaşan tarih. Filtreler [ListTabBar](../../expo/src/features/subscriptions/ui/ListTabBar.tsx) ile tutarlı pill yapısında olur.
- 7 gün içinde yenilenecekler vurgusu liste ve dashboard için aynı kuralla çalışır.
- Realtime: abonelik tablosundaki değişiklik listeyi ve detayı yeniler (Supabase Realtime, yalnızca RLS izinli satırlar).
- Servis kataloğu: `support-catalog` Edge Function ve yedek liste. Ekleme formunda servis adı önerisi.
- Gecikmiş yenileme: otomatik ilerletme yok; kullanıcıya "yenileme tarihi geçti" gösterilir ve onaylatılır ([PARITY §4](PARITY.md)).

**Bağımlılık:** `support-catalog` yanıt sözleşmesi; yoksa yedek liste ile başlanır.

**Test planı:** filtre birleşimleri (durum × kategori × para birimi), gecikmiş yenileme durum hesabı, katalog arama normalizasyonu.

**Bitti tanımı:** Ortak bitti tanımı + filtre kombinasyonları ve gecikmiş yenileme kuralı testli.

## S3 — Offline (Aşama 3)

**Durum (2026-10-09): Kod tamam.** Cache, FIFO kuyruk, senkron ve çevrimdışı şerit yazıldı; 203 test ve tip kontrolü geçiyor. Kararlar: depolama için mevcut şifreli (Keychain/Keystore) chunk'lı depo, ağ durumu için `expo-network`; `expo-sqlite` gerekmedi. Uçak modu senaryosu cihazda henüz denenmedi.

**Hedef:** Ağ yokken son veri gösterilir; yazma işlemleri kaybolmaz.

**Kapsam**

- Son abonelik verisinin cache'i; cache şifreli saklanır ([CURRENT_STATUS](../CURRENT_STATUS.md)). `expo-secure-store` anahtar, veri için boyut sınırına dikkat edilir; gerekirse `expo-sqlite` ile şifreli değer saklanır (karar LIBRARIES.md'ye yazılır).
- FIFO mutation kuyruğu: ekleme, düzenleme, durum aksiyonları kuyruğa girer. Yarıda kalan gönderimler tekrar denenir.
- Senkron koordinatörü: ağ geri geldiğinde kuyruk boşaltılır; çakışmada sunucu kazanır ve kullanıcıya bildirilir.
- Ağ durumu (`@react-native-community/netinfo` kararı LIBRARIES.md'de), [OfflineBanner](../../expo/src/shared/widgets/OfflineBanner.tsx) bağlanır.
- Yazma girişiminde form korunur, kullanıcıya "kaydedilemedi, bağlantı gelince gönderilecek" bilgisi verilir.

**Test planı:** kuyruk sırası, yeniden deneme, yarıda kalma, çift gönderim engelleme (idempotency anahtarı); cache okuma/yazma; senkron çakışması. Flutter'daki [offline_mutation_queue_test](../../mobile/test/core/offline_mutation_queue_test.dart) senaryoları port edilir.

**Doğrulama:** Uçak modu senaryosu iOS ve Android'de cihazda.

**Bitti tanımı:** Ortak bitti tanımı + kuyruk testleri geçer + uçak modu senaryosu cihazda kanıtlanır.

## S4 — Dashboard ve takvim (Aşama 4)

**Durum (2026-10-09): Kod tamam.** Ana sayfa (toplamlar, çipler, denemeler, sıradaki ödeme, hızlı eylemler) ve takvim (aylık ızgara, gün detayı, ay toplamları) yazıldı; 219 test ve tip kontrolü geçiyor. Ertelenenler: kategori donut, aylık değişim ve ödeme bağlı sayılar (S5), bildirim rozeti (S6). Yüksek tutarlı yıllık eşiği için ürün kararı bekleniyor.

**Hedef:** Ana sayfa ve takvim, Flutter'daki hesaplarla aynı sonuçları verir.

**Kapsam**

- Dashboard (`app/(tabs)/index.tsx`): aylık ve yıllık tahmini toplam, para birimi bazında. Yedi gün içindeki yenilemeler, ücretsiz denemeler, aktif sayı, tasarruf özeti, okunmamış bildirim rozeti (rozet S6'da bağlanır; S4'te yer tutucu).
- Takvim (`app/(tabs)/calendar.tsx`): aylık görünüm, gün detayı, deneme ve yüksek tutarlı yıllık ödeme ayrımı.
- Hesaplar `calendar.ts` ve `money.ts` üzerinden; yeni hesap fonksiyonu yalnızca [PRODUCT §6.3](../product/PRODUCT.md) formülünü uygular.

**Bağımlılık:** S3 (offline cache) dashboard'un son veriyi göstermesi için.

**Test planı:** aylık toplam (haftalık ×52/12, çeyreklik ÷3, yıllık ÷12), para birimlerinin ayrı toplanması, takvimde ay sınırı ve 29 Şubat, yenileme günü ayın 31'i.

**Bitti tanımı:** Ortak bitti tanımı + Flutter [stats](../../mobile/test/features/stats/) ve [calendar](../../mobile/test/features/calendar/) testlerinin karşılıkları geçer.

## S5 — İstatistik, ödeme geçmişi, tasarruf ve iptal akışı (Aşama 4)

**Durum (2026-10-09): Kod tamam.** İstatistik (para birimi seçimi, aylık/yıllık, 6 ay trend, kategoriler, 7 gün, en yüksek), ödeme geçmişi (ekleme, silme), tasarruf (toplam, fırsatlar, geçmiş) ve duraklatma/iptalde tasarruf kaydı yazıldı; 234 test ve tip kontrolü geçiyor. Üç seçenekli iptal ekranı sonradan eklendi (sağlayıcı sayfası, İptal ettim, Durdurdum, Kullanmaya devam et). İptal sebebi alınmıyor. Ödeme düzenleme de eklendi (tutar ve tarih; para birimi sabit). Tasarruf kaydı kuyrukta ayrı bir aşamadır (olay tekrarı olmaz).

**Hedef:** Kullanıcı harcamasını ve iptal ettiği aboneliklerden kazandığı tasarrufu görür.

**Kapsam**

- İstatistikler (`app/(tabs)/stats.tsx`): kategori ve dönem kırılımı, para birimi bazında.
- Ödeme geçmişi (`app/stats/payments.tsx`): ekleme, düzenleme, silme. Ödeme kaydı silinebilir (abonelik silinmez; kural: yalnızca yanlış kayıt).
- Tasarruf (`app/savings.tsx`): iptal edilen aboneliklerin aylık eşdeğeri toplamı.
- İptal akışı: "İptal ettim", "Durdurdum", "Kullanmaya devam et" aksiyonları.

**Bağımlılık:** S1 durum aksiyonları. Ödeme geçmişi tablosu ve RPC sözleşmesi doğrulanacak.

**Test planı:** tasarruf hesabı yalnızca iptal ve sona ermiş aboneliklerde, para birimi ayrımı; ödeme kaydı doğrulama.

**Bitti tanımı:** Ortak bitti tanımı + tasarruf ve kategori kırılımı formüllerle birebir test edilir.

## S6 — Bildirimler (Aşama 5)

**Durum (2026-10-09): Kod tamam.** `expo-notifications` ile yerel planlama (kural, varsayılan gün, deneme 7/3/1, 09:00, 60 sınır, farka dayalı eşitleme), izin açıklaması ve ayar yönlendirmesi, dokunmada deep link, bildirim merkezi (okunur), tercihler ve ana sayfa rozeti yazıldı; 263 test ve tip kontrolü geçiyor. Kararlar: tercihler yerel depoda (sunucu `profiles` yazımı canlı veri onayı gerektirdiği için yok); saat dilimi cihazdan; ertele aksiyonu ve okundu yazımı yok. Cihazda doğrulama yapılmadı.

**Hedef:** Yerel bildirimler iOS ve Android'de zamanlanır, açılır ve tekrar zamanlanmaz.

**Kapsam**

- `expo-notifications` ile yerel bildirim planlama. Uzak push (FCM) yok ([ADR 0009](../decisions/0009-supabase-only-architecture.md)).
- Bildirim izni: önce açıklayıcı ekran, sonra sistem penceresi; reddedilirse ayar yönergesi ([USER_FLOWS §13](../product/USER_FLOWS.md)).
- Planlama kuralları: kullanıcının seçtiği gün sayısı, deneme bitişi, zaman dilimine göre teslimat. Aynı plan iki kez zamanlanmaz.
- Bildirim merkezi (`app/notifications.tsx`): okundu senkronu.
- Bildirim tercihleri (`app/settings/notifications.tsx`).
- Deep link: bildirim dokununca abonelik detayı; kaynak yoksa "artık mevcut değil".

**Test planı:** planlama fonksiyonu saf olarak test edilir (Flutter [local_notification_schedule_test](../../mobile/test/core/local_notification_schedule_test.dart) karşılığı); tekrar zamanlama engeli; deep link çözümleme.

**Doğrulama:** Bildirimin cihazda zamanlanması ve açılması iOS ve Android'de.

**Bitti tanımı:** Ortak bitti tanımı + cihazda iki platformda bildirim kanıtı.

## S7 — Ayarlar ve gizlilik (1) (Aşama 6)

**Durum (2026-10-09): Kod tamam.** Ayarlar ana ekranı, profil (ad, soyad, para birimi, şifre değişimi), görünüm (yalnız koyu), uygulama kilidi (PIN, biyometri, kilit süresi, hatalı deneme beklemesi) ve gizlilik merkezi yazıldı; 275 test ve tip kontrolü geçiyor. PIN özeti Flutter'daki PBKDF2 yerine yinelemeli SHA-256 ile yapılıyor; tur sayısı cihazda ölçülmeli. Cihaz doğrulaması yapılmadı. Dışa aktarma ve hesap silme S8'de.

**Hedef:** Ayarlar bilgi mimarisi [USER_FLOWS §15](../product/USER_FLOWS.md) ile birebir eşleşir.

**Kapsam**

- Ayarlar ana ekranı (`app/(tabs)/settings/index.tsx`): bölümler ve mevcut çıkış düğmesi.
- Profil (`app/settings/profile.tsx`): ad ve şifre değiştirme; şifre değişiminde mevcut şifre doğrulanır.
- Görünüm (`app/settings/appearance.tsx`): yalnızca koyu tema ([CURRENT_STATUS](../CURRENT_STATUS.md)) — ekran bunu açıkça gösterir.
- Uygulama kilidi (`app/settings/app-lock.tsx`): PIN ve biyometri. PIN saklama `expo-secure-store` ile.
- Gizlilik merkezi (`app/settings/privacy.tsx`): dışa aktarma ve hesap silme yalnızca burada bağlanır.

**Test planı:** PIN doğrulama ve kilit süresi, şifre değişimi doğrulamaları, ayar varsayılanları.

**Doğrulama:** Biyometri ve PIN kilidi cihazda iki platformda.

**Bitti tanımı:** Ortak bitti tanımı + kilit cihaz doğrulaması.

## S8 — Ayarlar ve gizlilik (2) (Aşama 6)

**Durum (2026-10-09): Kod tamam.** CSV dışa aktarma (11 alan, formül koruması, cihazda paylaşım), hesap silme (parola, "sil" onayı, yakın giriş), geri bildirim (paylaş ve destek kaydı), ödeme yöntemleri (ekle, kaldır, kaydet) yazıldı; 292 test ve tip kontrolü geçiyor. Bulut dışa aktarma canlıda `request_export_idempotent` RPC'si olmadığı için kullanılmıyor. Canlı hesap silme denenmedi.

**Hedef:** Veri dışa aktarma, hesap silme ve destek akışları güvenli ve yanıltıcı olmadan çalışır.

**Kapsam**

- Veri dışa aktarma (`app/settings/export.tsx`): 11 alanlı CSV şeması, CSV enjeksiyonu önlemi ([CURRENT_STATUS](../CURRENT_STATUS.md)); dosya paylaşımı `expo-sharing` ile.
- Hesap silme (`app/settings/delete-account.tsx`): yakın giriş şartı, Storage temizliği, onay metni. Ekran yanıltıcı ya da zorlayıcı olmaz ([USER_FLOWS §17](../product/USER_FLOWS.md)).
- Geri bildirim ve destek (`app/settings/feedback.tsx`): destek bileti oluşturma.
- Ödeme yöntemleri (`app/settings/payment-methods.tsx`): yalnızca etiket olarak; kart numarası alınmaz ([AGENTS.md](../../AGENTS.md) ödeme kuralı).

**Bağımlılık:** Hesap silme için sunucu tarafı akış ([CURRENT_STATUS](../CURRENT_STATUS.md) "Hesap silme"). Canlı hesap silme test edilmez; yalnızca yerel test hesabında, kullanıcı onayıyla.

**Test planı:** CSV alan sırası ve enjeksiyon önlemi (`=`, `+`, `-`, `@` ile başlayan değerler), export dosya adı, silme onay akışı.

**Bitti tanımı:** Ortak bitti tanımı + CSV şeması Flutter karşılığıyla test edilir.

## S9 — Onboarding, yasal metin ve CSV içe aktarma (Aşama 6)

**Durum (2026-10-09): Kod tamam.** Onboarding (Flutter ile aynı üç sayfa; oturum öncesi, cihaz başına bayrak), yasal sayfalar (Flutter'daki metin, taslak olarak; yayın öncesi onay gerekir), CSV içe aktarma (Flutter kuralları, satır bazlı hata, formül önekinin geri alınması, çevrimiçi oluşturma) yazıldı; 307 test ve tip kontrolü geçiyor. Onboarding sayısı önceki belgede 4 yazılmıştı; Flutter kodunda 3'tür. Cihazda doğrulama yapılmadı.

**Hedef:** İlk kullanım deneyimi ve içe aktarma tamamlanır.

**Kapsam**

- Onboarding (`app/(auth)/onboarding.tsx`): 4 sayfa. Bildirim izni bu ekranda istenmez; yalnızca açıklanır ([USER_FLOWS §2, §13](../product/USER_FLOWS.md)).
- Gizlilik politikası ve kullanım koşulları: yer tutucu metin gerçek metinle değişir. **Metin ürün sahibinden alınmadan yayınlanmaz.** Mevcut metin kaynağı `docs/` içinde aranacak; bulunamazsa sprint bu kalemde kullanıcıdan metin ister.
- CSV içe aktarma (`app/subscriptions/import.tsx`): doğrulama, satır bazlı hata raporu, içe aktarma öncesi önizleme.

**Test planı:** CSV ayrıştırma, satır hatası raporu, onboarding sayfa sırası ve atlama.

**Bitti tanımı:** Ortak bitti tanımı + yasal metin onayı alınmış.

## S10 — Parite ve cihaz kabulü (Aşama 7)

**Durum (2026-10-09): Kısmen tamam.** Yapılanlar: parite tablosunun eski "Planlı" satırları gerçek durumuna çekildi; ertele aksiyonu ve saat dilimi kontrolü eklendi; Android ve iOS paketleri hatasız derlendi; `expo-doctor` 21/21. Açık kalanlar: cihaz kabulü (hiçbiri cihazda çalıştırılmadı), bulut CSV dışa aktarma (canlıda RPC yok), kapsam dışı kararları, yüksek tutarlı yıllık eşiği, yasal metin onayı. EAS build için Expo hesabı oturumu gerekir.

**Hedef:** PARITY tablosunda açık satır kalmaz.

**Kapsam**

- Her PARITY satırı "Tamam" ya da kullanıcı onaylı "kapsam dışı" olur.
- [DEVICE_ACCEPTANCE.md](../operations/DEVICE_ACCEPTANCE.md) senaryoları iOS ve Android'de çalıştırılır.
- EAS Build ile iOS ve Android paketleri.

**Engel:** iOS için Mac veya EAS Build gerekir. Lint kurulumu (ESLint) bu sprintte tamamlanır; şu an yok.

## S11 — Karar (Aşama 8)

- Flutter ve Expo karşılaştırması: hız, kod kalitesi, test kapsamı, cihaz davranışı, bakım maliyeti.
- Kullanıcı kararı, ADR ile kaydedilir. Seçilmeyen sürüm silinmez ([ADR 0008](../decisions/0008-flutter-mobile-framework.md) kuralı).

## Riskler

| Risk | Etki | Önlem |
|---|---|---|
| Canlı Supabase şeması sprint kapsamı için eksik | S1, S5 gecikir | S1 başında şema ve RPC doğrulaması; eksikse migration önerisi kullanıcı onayına gider |
| Yasal metin kaynağı yok | S9 kapanmaz | Metin kullanıcıdan istenir; yer tutucu ile yayın yapılmaz |
| Cihaz doğrulaması yapılmadan "Tamam" yazılır | Parite yanıltıcı olur | Ortak bitti tanımı: "Tamam" yalnızca cihaz kanıtıyla |
| Tasarım sisteminde 800 kalınlığı veya ham renk kaçağı | Tutarsızlık | `design-system.test.ts` her sprintte çalışır |
| Testlerin Flutter karşılığı eksik | Parite kanıtlanamaz | Her sprint başında Flutter test dosyası eşlemesi yazılır |

## Açık kararlar (kullanıcı onayı)

1. S1: Fiyat değişikliği kaydı için migration gerekiyorsa uygulanabilir mi? (Canlı veri değişikliği, onay gerekir.)
2. S5: Ödeme geçmişi düzenleme ve silme akışı, Flutter ile aynı mı kalsın?
3. S9: Yasal metin kaynağı ve onayı.
4. Sprint sırası: Plan offline'ı (S3) dashboard'dan (S4) önce koyar, çünkü dashboard son cache'i gösterir. Bu sıraya onay verilmesi gerekir; aksi halde S4 önce yapılabilir ama offline davranışı sonradan eklenir.
