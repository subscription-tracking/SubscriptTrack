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

**Durum (2026-10-09): Kod tamam.** Düzenleme, durum aksiyonları, arşiv ve arşiv listesi yazıldı; testler ve tip kontrolü geçiyor. Cihaz ve canlı veri doğrulaması yapılmadı. Migration gerekmedi: RPC ve `subscription_events` RLS politikası mevcut. Olay yazımı istemcide ve atomik değil (bkz. [API.md §4](../reference/API.md)).

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

**Durum (2026-10-09): Kod tamam.** Filtre sayfası, gecikmiş yenileme onayı, realtime senkron ve servis önerileri yazıldı; testler ve tip kontrolü geçiyor. Cihazda ve canlı ortamda (realtime, `support-catalog` çağrısı) doğrulama yapılmadı. Migration gerekmedi.

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

**Durum (2026-10-09): Kod tamam.** Cache, FIFO kuyruk, senkron ve çevrimdışı şerit yazıldı; testler ve tip kontrolü geçiyor. Kararlar: depolama için mevcut şifreli (Keychain/Keystore) chunk'lı depo, ağ durumu için `expo-network`; `expo-sqlite` gerekmedi. Uçak modu senaryosu cihazda henüz denenmedi.

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

**Durum (2026-10-09): Kod tamam.** Ana sayfa (toplamlar, çipler, denemeler, sıradaki ödeme, hızlı eylemler) ve takvim (aylık ızgara, gün detayı, ay toplamları) yazıldı; testler ve tip kontrolü geçiyor. Ertelenenler: kategori donut, aylık değişim ve ödeme bağlı sayılar (S5), bildirim rozeti (S6). Yüksek tutarlı yıllık eşiği için ürün kararı bekleniyor.

**Hedef:** Ana sayfa ve takvim, Flutter'daki hesaplarla aynı sonuçları verir.

**Kapsam**

- Dashboard (`app/(tabs)/index.tsx`): aylık ve yıllık tahmini toplam, para birimi bazında. Yedi gün içindeki yenilemeler, ücretsiz denemeler, aktif sayı, tasarruf özeti, okunmamış bildirim rozeti (rozet S6'da bağlanır; S4'te yer tutucu).
- Takvim (`app/(tabs)/calendar.tsx`): aylık görünüm, gün detayı, deneme ve yüksek tutarlı yıllık ödeme ayrımı.
- Hesaplar `calendar.ts` ve `money.ts` üzerinden; yeni hesap fonksiyonu yalnızca [PRODUCT §6.3](../product/PRODUCT.md) formülünü uygular.

**Bağımlılık:** S3 (offline cache) dashboard'un son veriyi göstermesi için.

**Test planı:** aylık toplam (haftalık ×52/12, çeyreklik ÷3, yıllık ÷12), para birimlerinin ayrı toplanması, takvimde ay sınırı ve 29 Şubat, yenileme günü ayın 31'i.

**Bitti tanımı:** Ortak bitti tanımı + Flutter [stats](../../mobile/test/features/stats/) ve [calendar](../../mobile/test/features/calendar/) testlerinin karşılıkları geçer.

## S5 — İstatistik, ödeme geçmişi, tasarruf ve iptal akışı (Aşama 4)

**Durum (2026-10-09): Kod tamam.** İstatistik (para birimi seçimi, aylık/yıllık, 6 ay trend, kategoriler, 7 gün, en yüksek), ödeme geçmişi (ekleme, silme), tasarruf (toplam, fırsatlar, geçmiş) ve duraklatma/iptalde tasarruf kaydı yazıldı; testler ve tip kontrolü geçiyor. Üç seçenekli iptal ekranı sonradan eklendi (sağlayıcı sayfası, İptal ettim, Durdurdum, Kullanmaya devam et). İptal sebebi alınmıyor. Ödeme düzenleme de eklendi (tutar ve tarih; para birimi sabit). Tasarruf kaydı kuyrukta ayrı bir aşamadır (olay tekrarı olmaz).

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

**Durum (2026-10-09): Kod tamam.** `expo-notifications` ile yerel planlama (kural, varsayılan gün, deneme 7/3/1, 09:00, 60 sınır, farka dayalı eşitleme), izin açıklaması ve ayar yönlendirmesi, dokunmada deep link, bildirim merkezi (okunur), tercihler ve ana sayfa rozeti yazıldı; testler ve tip kontrolü geçiyor. Kararlar: tercihler yerel depoda (sunucu `profiles` yazımı canlı veri onayı gerektirdiği için yok); saat dilimi cihazdan; ertele aksiyonu ve okundu yazımı yok. Cihazda doğrulama yapılmadı.

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

**Durum (2026-10-09): Kod tamam.** Ayarlar ana ekranı, profil (ad, soyad, para birimi, şifre değişimi), görünüm (yalnız koyu), uygulama kilidi (PIN, biyometri, kilit süresi, hatalı deneme beklemesi) ve gizlilik merkezi yazıldı; testler ve tip kontrolü geçiyor. PIN özeti Flutter'daki PBKDF2 yerine yinelemeli SHA-256 ile yapılıyor; tur sayısı cihazda ölçülmeli. Cihaz doğrulaması yapılmadı. Dışa aktarma ve hesap silme S8'de.

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

**Durum (2026-10-09): Kod tamam.** CSV dışa aktarma (11 alan, formül koruması, cihazda paylaşım), hesap silme (parola, "sil" onayı, yakın giriş), geri bildirim (paylaş ve destek kaydı), ödeme yöntemleri (ekle, kaldır, kaydet) yazıldı; testler ve tip kontrolü geçiyor. Bulut dışa aktarma canlıda `request_export_idempotent` RPC'si olmadığı için kullanılmıyor. Canlı hesap silme denenmedi.

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

**Durum (2026-10-09): Kod tamam.** Onboarding (Flutter ile aynı üç sayfa; oturum öncesi, cihaz başına bayrak), yasal sayfalar (Flutter'daki metin, taslak olarak; yayın öncesi onay gerekir), CSV içe aktarma (Flutter kuralları, satır bazlı hata, formül önekinin geri alınması, çevrimiçi oluşturma) yazıldı; testler ve tip kontrolü geçiyor. Onboarding sayısı önceki belgede 4 yazılmıştı; Flutter kodunda 3'tür. Cihazda doğrulama yapılmadı.

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

## Tasarım eşitliği sprintleri (D serisi)

**Amaç:** Expo ekranlarının Flutter sürümüyle birebir görünmesi (bkz. [ROADMAP.md](ROADMAP.md) "Tasarım" satırı). S sprintleri işlevi, D sprintleri görünümü kapsar. Aynı ekran için her iki seri de "Kod tamam" olmadan ekran tamamlanmış sayılmaz.

**Kural:** Referans her zaman Flutter kaynağıdır (`mobile/lib/...`). Boşluk, yazı boyutu, renk ve ikon değerleri Flutter'dan birebir taşınır; Expo'ya özgü bir tasarım kararı alınmaz. Kullanılamayan ikon/yazı karşılığı varsa sprint notunda belirtilir ve kullanıcı onayına gider. Tokenlar yalnızca `src/shared/design/` altında tanımlanır; `design-system.test.ts` ihlalleri kırar.

**Ortak bitti tanımı (D sprintleri):** Ortak bitti tanımı (yukarıda) + ekranın Flutter ekran görüntüsüyle yan yana karşılaştırması (D10'da toplu) + iOS ve Android'de görsel doğrulama kanıtı.

| Sprint | Odak | Flutter kaynakları | Boyut | Durum |
|---|---|---|---|---|
| D1 | Kabuk ve ortak bileşenler | `app/shell/*`, `app/theme/*`, `shared/widgets/*`, `shared/design/*` | M | Kod tamam; ikon sapması kabul edildi; görsel doğrulama D10'da |
| D2a | Kimlik doğrulama ekranları | `features/auth/presentation/screens/*`, `widgets/auth_form_parts.dart` | S | Kod tamam (kod karşılaştırması); görsel doğrulama D10'da |
| D2b | Tanıtım | `features/onboarding/presentation/*` | L | Kod tamam (yaklaşımlar aşağıda); görsel doğrulama D10'da |
| D3 | Ana sayfa, abonelik listesi ve detay ince ayarı | `features/dashboard/*`, `features/subscriptions/presentation/screens/subscription_list_screen.dart`, `subscription_detail_screen.dart`, `widgets/list/*`, `widgets/detail/*` | S | Kod tamam; Flutter ile görsel fark kontrolü bekliyor |
| D4 | Abonelik formu ve alt ekranlar | `add_subscription_screen.dart`, `edit_subscription_screen.dart`, `archived_subscriptions_screen.dart`, `csv_import_screen.dart`, `widgets/form/*`, `subscription_form*.dart` | L | Kod tamam (boşluklar aşağıda); görsel doğrulama D10'da |
| D5a | Takvim ve tasarruf | `features/calendar/*`, `features/savings/*` | M | Kod tamam (görsel doğrulama D10'da) |
| D5b | İstatistikler ve ödeme geçmişi | `features/stats/*` | L | Kod tamam (görsel doğrulama D10'da) |
| D6 | Bildirim merkezi | `features/notifications/presentation/*` | M | Kod tamam (görsel doğrulama D10'da) |
| D7 | Ayarlar ana ekranı, profil, görünüm, bildirim tercihleri | `settings_screen.dart`, `profile_screen.dart`, `appearance_screen.dart`, `notification_preferences_screen.dart`, `widgets/settings_parts.dart`, `widgets/profile_parts.dart` | L | Kod tamam (boşluklar aşağıda); görsel doğrulama D10'da |
| D8 | Uygulama kilidi, gizlilik merkezi, dışa aktarma, hesap silme, geri bildirim, ödeme yöntemleri | `app_lock_settings_screen.dart`, `privacy_center_screen.dart`, `export_data_screen.dart`, `delete_account_screen.dart`, `feedback_screen.dart`, `payment_methods_screen.dart` | L | Kod tamam (cihaz doğrulaması D10) |
| D9 | Yasal sayfalar | `privacy_policy_screen.dart`, `terms_of_service_screen.dart`, `widgets/legal_document.dart` | S | Kod tamam (metin onayı S9'a bağlı; cihaz doğrulaması D10) |
| D10 | Görsel doğrulama ve kapanış | Tüm yukarıdakiler | M | Bekliyor |

### D1 — Kabuk ve ortak bileşenler

**Durum (2026-10-09): Kod tamam.** Dört sekmeli alt gezinme, 88 px üst bar (ikon kutusu, alt başlık, takvim, rozetli bildirim), `(app)/(tabs)` grubu, Flutter yazı boyutları (11, 15) ve ağırlıkları (w800 başlık), auth boşlukları (24), Flutter biçimli para (`₺1.234,56`) ve tarih ("Bugün/Yarın/Geçti"). testler geçiyor.

**Doğrulama:** `tsc` temiz, testler geçiyor, Android ve iOS `expo export` başarılı. Metro çalışıyor; `expo-notifications` Expo Go hatası giderildi.

**Kararlar:** (1) Yeni paket eklenmedi; `react-native-web` yok, görsel doğrulama cihazda D10 kapsamında yapılacak. (2) Alt gezinme ve üst bar ikonları Ionicons / Material kullanır; Flutter'ın Material Rounded glifleri yerine en yakın karşılıklar. Bu bilinçli bir sapma olarak kabul edildi ve D10'da yeniden değerlendirilecek.

**Açık:** Cihaz üzerinde Flutter ile yan yana doğrulama.

### D2a — Kimlik doğrulama ekranları

**Durum (2026-10-09): Kod tamam.** Kayıt ekranında hukuki bağlantılar Flutter ile eşlendi (16, w700, altı çizili). Şifremi unuttum ve şifre sıfırlama ekranlarında yan boşluk 24, başlık 24 px (`headlineSmall`) yapıldı. Giriş ekranı D1 sırasında hizalandı. `tsc` temiz, testler geçiyor. Görsel doğrulama D10'da.

### D2b — Tanıtım

**Kapsam (Flutter farkları):**

- Expo: 3 düz sayfa, illüstrasyon yok, para birimi sayfası yok, sayfa renkleri yok, üstte marka satırı ve "Atla" yok, noktalar tek renk.
- Flutter: 3 bilgi sayfası (her biri kendi vurgu ve arka plan rengi, `subscriptions/calendar/analytics` illüstrasyonları) + para birimi sayfası; üstte marka satırı ve "Atla"; animasyonlu pill noktalar; gölgeli vurgu renkli "İleri/Başla" düğmesi.
- Para birimi seçimi Flutter'da `SettingsController`'a yazılır; Expo'da karşılığı yok. Kalıcı kayıt yeri bu sprintte kararlaştırılacak.

**Durum (2026-10-10): Kod tamam.** 4 sayfa (3 bilgi + para birimi), sayfa başına vurgu ve arka plan rengi, üst marka satırı ve "Atla", üç illüstrasyon (`SubscriptionsIllustration`, `CalendarIllustration`, `AnalyticsIllustration`), para birimi çipleri ve seçim listesi, gölgeli "İleri/Başla" düğmesi. `tsc` temiz, testler geçiyor, Android export başarılı.

**Bilinen yaklaşımlar (D10'da cihazda doğrulanacak):** (1) Sayfa noktaları genişlik geçişini animasyonsuz yapar (Flutter 300 ms animasyon). (2) Sallanma (bob) fazı, başlangıç gecikmesi olarak uygulanır; sinüs yerine beş noktalı doğrusal yaklaşım kullanılır. (3) Takvim ızgarası yüzde genişlikli kare hücrelerle çizilir; Flutter `GridView` ile piksel düzeyinde aynı olmayabilir. (4) Analiz halkası `strokeDasharray` ile, ilerleme JS tarafında dinlenerek çizilir.

**Karar (2026-10-09):** Para birimi yalnızca cihazda, yerel güvenli depoda saklanır; Flutter'daki `SettingsController` (yerel tercih) ile aynı davranış. Profil tablosuna yazılmaz, böylece sunucu şeması ve onay gerektiren değişiklik yoktur. Ayarlar ekranındaki para birimi seçimi D7'de bu depoyu okur.

**Kapsam (kalan işler):** 4 sayfa (3 bilgi + para birimi), her bilgi sayfasının kendi vurgu ve arka plan rengi, animasyonlu illüstrasyon dosyaları (`subscriptions`, `calendar`, `analytics`), üstte marka satırı ve "Atla", animasyonlu pill noktalar, gölgeli "İleri/Başla" düğmesi.

### D2 — Kimlik doğrulama ve tanıtım (özet)

**Kapsam:** Giriş, kayıt, şifremi unuttum, şifre sıfırlama ekranlarının boşluk ve başlık değerleri Flutter ile tek tek karşılaştırılır. Tanıtım (`onboarding`) üç sayfa, görseller (`illustrations/*`) ve giriş hareketi (`onboarding_motion.dart`) Flutter'dan taşınır. `auth-callback` ekranı görsel olarak kontrol edilir.

**Test planı:** Ekran başına Flutter ile yan yana ekran görüntüsü; metin ve düğme sırası; klavye açıkken kaydırma.

### D3 — Ana sayfa, abonelik listesi ve detay ince ayarı

**Kapsam:** D1 sırasında yazılan ekranların Flutter ile piksel düzeyinde farkları giderilir: ana sayfa kart iç boşlukları, liste kartı yükseklikleri, detay hero gradyanı ve menü konumu. Ayrıca yenileme onayı ve durum mutasyonlarının D1 sonrası davranışı doğrulanır.

### D4 — Abonelik formu ve alt ekranlar

**Durum (2026-10-10):** Kod tamam, boşluklar aşağıda. Form (servis, yenileme, ayrıntılar), arşiv ve CSV içe aktarma (dosya seç, örnek format diyaloğu, satır listesi, içe aktarma ve geri dönüş) Flutter yapısına göre yazıldı. `tsc` temiz, testler geçiyor, Android export başarılı.

**Yapılanlar:** Form Flutter iskeletine göre yeniden kuruldu: popüler servis çipleri (yalnızca ekleme), marka ikonlu ad alanı, para birimi açılır listesi ve tutar yan yana, yenileme sıklığı açılır listesi, "Yenileme" bölümü, katlanabilir "Diğer ayrıntılar" (deneme, kategori, ödeme yöntemi, başlangıç tarihi, not 3 satır/500 karakter). Arşiv, Flutter gibi kart satırları ve yerinde "aktif yap" düğmesi ile geri alır. Kaydetme ve doğrulama kuralları değişmedi.

**Boşluklar (veri sözleşmesi ve davranış):**
1. Hatırlatma çipleri (0/1/3/7 gün): form modelinde `notificationRules` yok; eklemek kaydetme sözleşmesini değiştirir. Karar gerekir.
2. İlk ödeme durumu (ödendi/ödenmedi/ertelendi) ve ilgili tarihler: Expo formunda yok; kayıtta ödeme olayı üretir. Karar gerekir.
3. Ödeme yöntemi: Flutter açılır listedir (ayarlardaki yöntemler + "yeni ekle"); Expo'da serbest metin. Ayarlar ödeme yöntemleri ekranı (D8) ile birlikte kapanır.
4. İptal ekranı (`SubscriptionCancelScreen`): Flutter'da ayrı bir iptal ekranı yok; Flutter iptali doğrudan onayla yapar. Expo'daki üç seçenekli iptal akışı S5'in bir eklemesi. Sapma olarak tutulsun mu, yoksa Flutter gibi sadeleştirilsin mi? Karar gerekir.
5. Popüler servis çipleri: Flutter yalnızca ekleme modunda gösterir; Expo da aynı. Uzak katalog (`support-catalog`) Flutter'da da var; Expo'da yerel varsayılanlar ve uzak katalog birlikte kullanılıyor.

6. CSV örnek diyaloğunda "Panoya kopyala": Flutter kopyalar; Expo'da `expo-clipboard` kurulu değil ve bağımlılık eklenmesi onay gerektirir. Şimdilik örnek metin seçilebilir (uzun basıp kopyalanır).

**Test planı (kalan):** Yan yana ekran görüntüsü (D10).



**Kapsam:** Ekleme ve düzenleme formu Flutter'daki bölümlerle (hizmet, detaylar, yenileme, tarih seçici, ödeme yöntemi) yeniden kurulur. Form doğrulama mesajları ve sunucu hatasında içerik koruması S1 ile uyumlu kalır. Arşiv listesi, CSV içe aktarma ekranı ve iptal ekranı aynı sprintte kapanır.

**Engel:** Form bölümleri için Flutter'daki tarih seçici ve ödeme yöntemi ekle dialogu, Expo karşılıklarıyla eşlenmeli.

### D5a — Takvim ve tasarruf

**Durum (2026-10-10): Kod tamam.** Takvim Flutter yapısına göre yeniden yazıldı: ay başlığı ve ay toplamları ("X bu ay"), Pt-Sa-Ça-Pe-Cu-Ct-Pz hafta sırası, yuvarlak hücreler, önceki ve sonraki ay günleri (soluk, tıklanamaz), bugün halkası, seçili gün dolgusu, yenileme noktası (3 gün içinde hata rengi), ay değişiminde seçimin sıfırlanması, boş gün durumu ve "Bu tarihte başlayan abonelik ekle" (ekleme formu `start` parametresiyle o tarihi alır). Tasarruf: en yüksek tutarlı üç aboneliğin kartları (para birimi başına), aktif aboneliklerin olası yıllık tasarrufu, duraklatma ve iptal geçmişi.

**Boşluklar:** Takvimdeki ayrı "deneme" noktası Flutter'da yok; Flutter tek nokta kullanır, Expo da tek nokta gösterir. Deneme bitişi etkinlik satırında ayrıca yazılır.

### D5b — İstatistikler ve ödeme geçmişi

**Durum (2026-10-10): Kod tamam.** İstatistik ekranı Flutter kartlarıyla yeniden yazıldı: para birimi seçici, hero harcama kartı (değişim rozeti dahil), 3/6/12 ay trend kartı (sütunlar, geçerli ay primary), öne çıkanlar ve 7 gün içinde yenilenecekler uyarısı, kategori dağılımı (sırayla renk, yüzde ve ilerleme), tasarruf ve ödeme geçmişi kısayolları. Ödeme geçmişi düz kart listesi, uzatılmış "Kayıt ekle" düğmesi, ekleme ve düzenleme iletişim kutuları; silme Flutter gibi onay istemez. Eski `PaymentEditSheet` kaldırıldı. `tsc` temiz, testler geçiyor, Android export başarılı.

**Boşluklar:** (1) Flutter hero tutarı w900 kullanır; Expo tipografisinde en yüksek ağırlık w800 (fark görsel olarak küçük, D10'da kontrol edilecek). (2) Trend ve kategori hesapları Expo domain'inde (`statsSummary`, `paymentEvents`) yapılır; Flutter `payment_analytics.dart` ile birebir test eşlemesi henüz yazılmadı. (3) Sayfalama ve yıllık tasarruf kartı Flutter'daki gibi tek para birimi seçili gösterilir; birden çok para birimi için davranış aynıdır.

**Engel:** Trend ve kategori hesaplarının Flutter `payment_analytics.dart` ile birebir domain testleri; grafiklerin react-native-svg ile çizimi.

### D5 — Takvim, istatistikler, ödeme geçmişi ve tasarruf (özet)

**Kapsam:** En büyük sprint. Takvim (gün hücreleri, olay listesi, boş gün), istatistik kartları (hero harcama, kategori dağılımı, trend çubukları, içgörüler, eylem kartları, para birimi seçici), ödeme geçmişi ekranı ve tasarruf ekranı. Grafikler react-native-svg ile çizilir.

**Engel:** Trend çubukları ve kategori dağılımının Flutter'daki hesap kuralları (`payment_analytics.dart`) domain testleriyle doğrulanmalı.

**Bölme önerisi:** Takvim ve tasarruf D5a, istatistikler ve ödeme geçmişi D5b olarak ayrılabilir. Karar D5 başlamadan verilir.

### D6 — Bildirim merkezi

**Durum (2026-10-10): Kod tamam.** Bildirim merkezi Flutter davranışına göre yeniden yazıldı: üst barda "Tümünü okundu say" (okunmamış varken), tür emojili avatar (okunmamışsa tür rengi zemini), okunmamış nokta, dokununca okundu işareti ve abonelik ayrıntısı, sola kaydırarak kapatma (Flutter `Dismissible`). Okundu ve kapatılmış kimlikler cihazda tutulur (Flutter ile aynı, asıl kaynak); okundu işareti sunucuya en iyi çabayla yazılır (`notifications.read_at`). Boş durum metinleri Flutter ile aynı.

**Boşluklar:** (1) Kaydırma, `react-native-gesture-handler` yerine `PanResponder` ile yazıldı; eşik 120 px. Cihazda hissi D10'da kontrol edilecek. (2) Sunucu yazımı Expo'da önceden ertelenmişti; bu sprintte Flutter ile aynı şekilde etkinleştirildi. Yazım yalnızca kullanıcının kendi bildirim satırlarında ve yalnızca okunmamışlar için yapılır. (3) Sürüm kararı: RLS politikası bu yazımı kullanıcı sahipliğiyle sınırlamalı; politika doğrulaması canlı şemada yapılmadı.

**Kapsam:** Bildirim listesi, okundu durumu, boş ve hata durumları. Bildirim tercihleri D7'de; yalnızca merkez burada.

### D7 — Ayarlar ana ekranı, profil, görünüm, bildirim tercihleri

**Durum (2026-10-10): Kod tamam.** Dört ekran Flutter yapısına göre yazıldı: ayarlar ana ekranı (hesap özeti, tercihler, uygulama, veri ve gizlilik, destek, çıkış, sürüm), profil (üyelik tarihi, görünen ad, e-posta değişikliği, şifre değişikliği), görünüm (para birimi onay işaretiyle, cihazda saklanır) ve bildirim tercihleri (anahtar ve izin, gün seçimi 1/3/7, hatırlatma saati, test bildirimi). Ortak parçalar `SettingsParts.tsx` içinde. Görünen ad ve e-posta güncellemesi auth katmanına eklendi (`updateDisplayName`, `updateEmail`). Tanıtımı yeniden başlatma bayrağı sıfırlanır (`resetOnboardingDone`). `tsc` temiz, testler geçiyor (mimari testler dahil), Android export başarılı.

**Boşluklar:** (1) Saat dilimi seçimi yok: Flutter kullanıcının saat dilimini elle seçtirir; Expo tüm tarih hesaplarında cihaz saat dilimini kullanır ve ekranda bunu gösterir. Elle seçim, tarih hesaplarının tümüne bağlanmasını gerektirir. (2) Tanıtım yeniden başlatıldığında Flutter tanıtımı hemen açar; Expo oturum açıkken yönlendirme kuralıyla tanıtımı bir sonraki açılışta gösterir ve bildirim verir. (3) Profilde Flutter'daki ad/soyad ayrımı yok; Expo'nun eski ad-soyad profil tablosu bu ekranda kullanılmıyor. (4) Test bildirimi 5 saniye sonra planlanır; Flutter anlık gönderir.

**Boşluklar:** (1) Flutter tanıtım sıfırlamasında tanıtım hemen açılır; Expo'da oturum açıkken yönlendirme kuralı tanıtımı hemen göstermez, bir sonraki açılışta gösterilir (bildirimle belirtilir). (2) Expo ayarlarındaki "Yasal" bölümü kaldırıldı; yasal sayfalara Gizlilik ve veri merkezinden (D8) erişilir, Flutter'daki gibi. (3) Profil, görünüm ve bildirim tercihleri ekranları D7'nin devamında Flutter ile karşılaştırılacak.

**Kapsam:** Ayarlar ana ekranı Flutter'daki bölüm ve satır düzeniyle yeniden kurulur (şu an eski liste). Profil (ad, e-posta, şifre değişikliği), görünüm ve bildirim tercihleri ekranları Flutter'dan taşınır.

### D8 — Uygulama kilidi, gizlilik, dışa aktarma, hesap silme, geri bildirim, ödeme yöntemleri

**Kapsam:** Altı ekranın tamamı Flutter düzenine taşınır. Hesap silme akışında yeniden giriş ve onay kutusu ekranda Flutter ile aynı sırada olur. Dışa aktarma ekranı yalnızca cihaz içi CSV'yi gösterir; bulut dışa aktarma eksikliği (S8) ekranda belirtilmeye devam eder.

**Engel:** Uygulama kilidi cihaz doğrulaması (S7 ile aynı) ve hesap silme sunucu akışı.

**Durum:** Kod tamam; cihaz doğrulaması D10'a bırakıldı. `tsc`, `jest` ve Android export geçti.

**Sapmalar:**
1. Uygulama kilidinde PIN kapatma ve değiştirme mevcut PIN ister (Flutter'dan daha sıkı).
2. Dışa aktarmada bulut ve pano düğmeleri devre dışı; ekranda nedeni yazılır (S8, pano bağımlılığı onayı bekliyor).
3. Hesap silmede Flutter'daki şifre ve "sil" alanlarına ek olarak "Silinecek verileri anladım" onay kutusu var.
4. Ödeme yöntemleri Flutter'da anında kaydedilir; Expo'da değişiklikler "Kaydet" ile sunucuya yazılır (çevrimdışı yerel değişiklik koruması için).
5. Geri bildirim mesaj alanı çok satırlı olur ama Flutter'daki gibi sabit 6 satır yüksekliğinde değil; `TextField` `style` prop'u kabul etmediği için yükseklik ayarlanamadı.

**Açık maddeler:** Flutter'daki `SupportCatalogApi.canCreateTicket` koşulunun Expo karşılığı yok; destek kaydı düğmesi her zaman gösterilir. Bu koşulun ne zaman sağlandığı D10'da kararlaştırılacak.

### D9 — Yasal sayfalar

**Kapsam:** Gizlilik politikası ve kullanım koşulları ekranlarının başlık, metin stili ve boşlukları Flutter ile eşlenir. Metin içeriği S9'daki onaya bağlıdır; onay gelene kadar "taslak" etiketi kalır.

**Durum:** Kod tamam. Başlık AppBar karşılığı üst bar ile, sürüm satırı, "Kısa özet" kartı ve bölümler Flutter `LegalDocumentScreen` düzenine göre yazıldı. Metin seçilebilir kalır. `tsc`, `jest` ve Android export geçti.

**Sapmalar:**
1. Menü ve metin etiketleri (Gizlilik ve veri merkezi, Verilerimi dışa aktar, Hesabımı ve verilerimi sil, Geri bildirim gönder) Flutter ile birebir eşitlendi.
2. Sayfa altındaki "taslak" uyarısı Flutter'da yoktur; yayın onayı gelene kadar Expo'da kalır.

### D10 — Görsel doğrulama ve kapanış

**Kapsam:** Her D sprintinin ekranları için Flutter ve Expo ekran görüntüleri yan yana alınır (iOS ve Android). Fark listesi kalmazsa D sprintleri kapanır; kalanlar açık madde olarak [PARITY.md](PARITY.md) satırlarına işlenir. Görüntüler ve sonuçlar [DEVICE_ACCEPTANCE.md](../operations/DEVICE_ACCEPTANCE.md) altına eklenir.

**Açık kararlar (D serisi):**

1. Alt gezinme ve üst bar ikonları için Material Rounded yerine kabul edilebilir bir yakın karşılık (Ionicons) onaylanır mı, yoksa Material Symbols Rounded paketi eklenmeli mi?
2. D5 tek sprint mi kalsın, yoksa D5a (takvim ve tasarruf) ve D5b (istatistik ve ödeme geçmişi) olarak mı bölünsün?
3. Detay ekranına "Sil" eklensin mi? Flutter'da var, ADR 0006 normal akışta fiziksel silmeyi yasaklıyor.
4. "Takvimi aç" düğmesi Flutter'daki gibi Abonelikler sekmesine mi gitsin, yoksa takvime mi?

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
