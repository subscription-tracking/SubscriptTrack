# Yol Haritası — Expo Uygulaması

> Bu belge Expo sürümünün aşamalarını, her aşamanın çıkış kriterini ve ilerlemesini tutar. Ekran bazlı takip [PARITY.md](PARITY.md) dosyasındadır; burada yalnızca aşamalar ve kapılar vardır.

## Genel kurallar

- Aşamalar sırayla ilerler. Bir aşamanın çıkış kriteri karşılanmadan sonraki aşamaya geçilmez.
- Ürün hedefi iOS ve Android'dir. Bu geçişte Android AVD açılışı kanıtlandı; iOS kullanıcı yönlendirmesiyle ertelendi ve platform kabulü tamamlanmış sayılmaz.
- Her aşamanın testleri Flutter'daki karşılık gelen testlerden türetilir ([PARITY.md](PARITY.md)).
- Ürün kararı gerektiren her madde, uygulamadan önce kullanıcıya sorulur ([AGENTS.md](../../AGENTS.md)).
- Her aşama kapanırken ilgili belgeler (ARCHITECTURE, LIBRARIES, PARITY) aynı değişiklikte güncellenir.
- Sayfa bazlı sprint planı [SPRINTS.md](SPRINTS.md) dosyasındadır; aşamalar ve kapılar burada, sprint sırası orada tutulur.
- Kod sonrası düzeltme, canlı entegrasyon ve cihaz kabulü [S12–S18 sprint planında](REMAINING_SPRINTS.md) izlenir.

## Aşama özeti

| # | Aşama | Kapsam | Durum |
|---|---|---|---|
| 0 | Temel | Tema, ortak bileşenler, Supabase client, env, Money ve tarih modülleri, test altyapısı | Kod ve yerel kalite kapıları geçti; cihaz/platform kabulü açık |
| 1 | Kimlik doğrulama | Giriş, kayıt, şifre sıfırlama, e-posta doğrulama, oturum, route guard | Kod var; Android AVD'de oturumlu ana akış açıldı; e-posta ve çapraz hesap kabulü açık |
| 2 | Abonelik çekirdeği | Liste, detay, form, durum yaşam döngüsü, arşiv, realtime, servis kataloğu | Kod ve tek test hesabında temel RPC yazımları var; RLS ve iki oturumlu Realtime açık |
| 3 | Offline | Cache, mutation kuyruğu, senkron koordinatörü, offline davranışı | Kod ve domain testleri var; uçak modu/cihaz kabulü açık |
| 4 | Analitik | Dashboard, takvim, istatistik, ödeme geçmişi, tasarruf | Kod ve hesaplama testleri var; görsel/erişilebilirlik paritesi açık |
| 5 | Bildirim | Yerel bildirim planlama, kurallar, bildirim merkezi, tercihler, deep link | Kod ve canlı okundu/tercih yazımı var; OS teslimi ve çoklu cihaz kabulü açık |
| 6 | Ayarlar ve gizlilik | Profil, uygulama kilidi, CSV, export, hesap silme, ödeme yöntemleri, destek, onboarding, yasal sayfalar | Kod var; cihaz CSV AVD ve bulut API kanıtı var; PIN taşıma, hesap silme ve yasal onay açık |
| 7 | Parite ve cihaz kabulü | Tüm PARITY satırlarını kapatma, cihaz senaryoları, yerel/release build | Kısmi: Android AVD ana ekran ve CSV kabulü; fiziksel Android açık, iOS erteli, yayın build'i kullanıcı kararıyla erteli |
| 8 | Karar | Flutter ile karşılaştırma ve ADR ile nihai karar | Bekliyor: karşılaştırma kanıtı ve ürün sahibi kararı gerekiyor |

## Aşama 0 — Temel

**Kapsam**

- Expo Router iskeleti (kurulu: `expo/` içinde Expo Router ve boş `app/_layout.tsx`).
- TypeScript strict modu (kurulu).
- Tema tokenları: Flutter'daki `app_tokens.dart` ve `app_colors.dart` karşılığı. Yalnızca koyu tema ile başlanır ([CURRENT_STATUS](../CURRENT_STATUS.md)).
- Ortak bileşenler: loading, error, empty, offline banner ve buton/kart/sheet temel parçaları.
- Supabase client; `EXPO_PUBLIC_SUPABASE_URL` ve `EXPO_PUBLIC_SUPABASE_ANON_KEY` ile yapılandırma. Anahtar repoya girmez.
- `Money` modülü: minör birim veya decimal. Floating point kullanılmaz.
- Tarih modülü: UTC saklama, kullanıcının IANA zaman dilimine göre gösterim.
- Test altyapısı (birim ve bileşen testleri) ve lint.
- SETUP.md, ARCHITECTURE.md ve LIBRARIES.md bu aşamada yazılır ([README.md](README.md) belge haritasında "Planlı" olarak işaretli).

**Çıkış kriteri**

- `npx tsc --noEmit` ve lint hatasız geçer.
- Money ve tarih modüllerinin testleri, Flutter'daki `mobile/test/core/` altındaki para, gün sayısı ve zaman dilimi testlerinin kurallarını kapsar.
- Uygulama Android ve iOS'ta açılır, boş durum ekranı gösterir.

**Kararlar**

- Durum yönetimi (sunucu verisi ve yerel durum) seçilir ve LIBRARIES.md'ye yazılır.
- Hata modeli tanımlanır.

## Aşama 1 — Kimlik doğrulama

**Kapsam**

- Giriş, kayıt, şifre sıfırlama, e-posta doğrulama.
- Oturum saklama (güvenli depolama) ve yenileme.
- Route guard: oturum yoksa `(auth)` grubu, varsa `(app)` grubu.
- Google ve Apple girişi: Flutter'da **Kısmi**dir; Expo'da da aynı kapsamla ele alınır ve canlıda sağlayıcılar kapalı olduğu için doğrulama dışında bırakılır.

**Çıkış kriteri**

- Kullanıcı kayıt olabilir, giriş ve çıkış yapabilir.
- Oturum süresi dolunca kullanıcı giriş ekranına yönlendirilir.
- Bir kullanıcı başka kullanıcının verisine erişemez (sunucu tarafında RLS, istemcide doğrulama).
- Auth akışlarının testleri Flutter'daki [auth testleri](../../mobile/test/features/auth/) ile eşleşir.

**Açık nokta:** Canlı Supabase e-posta gönderimi ve yönlendirme adresleri [SUPABASE_LIVE_STATUS.md](../reference/SUPABASE_LIVE_STATUS.md) ve [SECURITY.md](../architecture/SECURITY.md) kapsamındadır. Bu aşama bunları değiştirmez.

## Aşama 2 — Abonelik çekirdeği

**Kapsam**

- Abonelik listesi: arama, filtre (durum, kategori, para birimi, yaklaşan tarih), 7 gün kala vurgusu.
- Ekleme, detay, düzenleme formu ve validasyon.
- Durum yaşam döngüsü: trial, active, paused, cancelled, expired, archived. Silme yerine iptal, sona erme ve arşiv.
- Arşivlenmiş abonelikler ekranı.
- Realtime: çoklu cihazda abonelik güncellemesi.
- Servis kataloğu: `support-catalog` ve mobil yedek liste.

**Çıkış kriteri**

- İlk abonelik üç dakikadan kısa sürede eklenebilir ([PRODUCT §5](../product/PRODUCT.md)).
- Form hataları ilgili alanın altında gösterilir; sunucu hatasında form içeriği korunur.
- Durum değişikliği geçmiş kaydını silmez.
- Abonelik testleri Flutter'daki [subscriptions testleri](../../mobile/test/features/subscriptions/) ile eşleşir.

**Karar bekliyor:** Fiziksel silme ve yenileme tarihi davranışı. Ayrıntı [PARITY §4](PARITY.md).

## Aşama 3 — Offline

**Kapsam**

- Son abonelik verisinin cihazda cache'lenmesi. Cache şifreli saklanır ([CURRENT_STATUS](../CURRENT_STATUS.md)).
- Yazma işlemleri için FIFO mutation kuyruğu.
- Senkron koordinatörü: ağ geri geldiğinde kuyruğu gönderir.
- Offline banner ve yazma girişiminde form koruması.

**Çıkış kriteri**

- Ağ yokken son cache gösterilir ([USER_FLOWS §14](../product/USER_FLOWS.md)).
- Kuyruk sırası korunur; yarıda kalan gönderimler tekrar denenebilir.
- Offline testleri Flutter'daki [offline testleriyle](../../mobile/test/core/offline_mutation_queue_test.dart) eşleşir.

**Doğrulama:** Uçak modu senaryosu iOS ve Android'de cihazda yapılır.

## Aşama 4 — Analitik

**Kapsam**

- Dashboard: aylık ve yıllık tahmini toplam (para birimi bazında), yedi gün içindeki yenilemeler, ücretsiz denemeler, aktif sayı, tasarruf, okunmamış bildirim rozeti.
- Takvim: aylık görünüm, gün detayı, trial ve yüksek tutarlı yıllık ödeme ayrımı.
- İstatistikler, ödeme geçmişi ve tasarruf ekranı.
- İptal ve tasarruf akışı: "İptal ettim", "Durdurdum", "Kullanmaya devam et" aksiyonları.

**Çıkış kriteri**

- Hesaplamalar PRODUCT §6.3'teki formüllerle birebir eşleşir.
- Para birimleri birbirine çevrilmez.
- Takvim ve dashboard testleri Flutter'daki [stats](../../mobile/test/features/stats/) ve [calendar](../../mobile/test/features/calendar/) testleriyle eşleşir.

## Aşama 5 — Bildirim

**Kapsam**

- Yerel bildirim planlama: kullanıcının seçtiği gün sayısı, trial bitişi kuralı, zaman dilimine göre teslimat.
- Aynı plan için tekrar zamanlamayı engelleme.
- Bildirim izni: önce açıklayıcı ekran, sonra sistem penceresi; reddedilirse ayar yönergesi.
- Bildirim merkezi ve okundu senkronu.
- Deep link: bildirimden abonelik detayına; kaynak yoksa "artık mevcut değil".
- Bildirim tercihleri ekranı.

**Çıkış kriteri**

- Bildirimler iOS ve Android'de cihazda gerçekten zamanlanır ve açılır ([DEVICE_ACCEPTANCE.md](../operations/DEVICE_ACCEPTANCE.md)).
- Uzak push kullanılmaz ([ADR 0009](../decisions/0009-supabase-only-architecture.md)).
- Bildirim testleri Flutter'daki [notification testleriyle](../../mobile/test/core/local_notification_schedule_test.dart) eşleşir.

**Paket kararı alındı:** Expo sürümünde `expo-notifications` kullanılıyor; iOS/Android cihaz davranışı henüz kabul edilmedi ([ADR 0010](../decisions/0010-expo-parallel-app.md)).

## Aşama 6 — Ayarlar ve gizlilik

**Kapsam**

- Onboarding (4 sayfa) ve yasal sayfalar.
- Profil ve şifre işlemleri.
- Uygulama kilidi: PIN ve biyometri. Cihaz üzerinde doğrulanması gerekir.
- Gizlilik merkezi: veri dışa aktarma ve hesap silme yalnızca burada.
- CSV içe ve dışa aktarma. Enjeksiyon önlemi ve 11 alanlı şema korunur.
- Hesap silme: yakın giriş şartı, Storage temizliği.
- Ödeme yöntemleri ve destek bileti.

**Çıkış kriteri**

- Ayarlar bilgi mimarisi [USER_FLOWS §15](../product/USER_FLOWS.md) ile eşleşir.
- Hesap silme ekranı yanıltıcı ya da zorlayıcı değildir ([USER_FLOWS §17](../product/USER_FLOWS.md)).
- CSV dışa aktarma ve içe aktarma testleri Flutter karşılığıyla eşleşir.

## Aşama 7 — Parite ve cihaz kabulü

**Kapsam**

- [PARITY.md](PARITY.md) içindeki her satır "Tamam" durumuna getirilir ya da kullanıcı onayıyla kapsam dışı bırakılır.
- [DEVICE_ACCEPTANCE.md](../operations/DEVICE_ACCEPTANCE.md) senaryoları Expo için iOS ve Android'de çalıştırılır.
- EAS Build ile iOS ve Android paketleri alınır.

**Çıkış kriteri**

- Parite tablosunda açık satır kalmaz.
- Cihaz kabul senaryolarının tamamı iki platformda kanıtla kayıtlıdır.

## Aşama 8 — Karar

- Expo ve Flutter sürümleri aynı kapsamda karşılaştırılır: hız, kod kalitesi, test kapsamı, cihaz davranışı, bakım maliyeti.
- Kullanıcı kararını verir.
- Karar ADR ile kaydedilir. Seçilmeyen sürüm silinmez; [ADR 0008](../decisions/0008-flutter-mobile-framework.md) "geçersiz" olarak işaretlenir ([docs/README.md](../README.md) kuralı).

## İlerleme günlüğü

| Tarih | Aşama | Olay |
|---|---|---|
| 2026-10-10 | Kabul | Android 36 x86_64 AVD'de ana sekmeler, ayarlar/gizlilik ve altı durumlu CSV dışa/içe aktarma kontrol edildi; emülatör sonucu fiziksel Android/iOS kabulü yerine geçmez ([DEVICE_ACCEPTANCE](../operations/DEVICE_ACCEPTANCE.md)) |
| 2026-10-09 | 0 | `expo/` iskeleti, Expo Router kurulumu ve boş iki ekran |
| 2026-10-09 | 0 | Supabase istemcisi (aynı backend), `Money` ve takvim modülleri (Flutter kurallarından port), tema tokenları, `AsyncStateView` ve `OfflineBanner`; testler geçiyor, typecheck ve Android bundle hatasız |
| 2026-10-09 | 0 | Karar verildi: fiziksel silme ve yenileme tarihi için ürün kuralı, bildirim için `expo-notifications` ([PARITY §4](PARITY.md), [ADR 0010](../decisions/0010-expo-parallel-app.md)) |
| 2026-10-09 | 1 | Düzeltmeler: auth domain Supabase SDK tiplerinden ayrıldı, abonelik repository'ye taşındı, mimari testi eklendi (6 kural), disabled düğme yazı rengi Flutter ile eşlendi, route konumu `app/` olarak AGENTS.md'ye işlendi; testler, typecheck ve Android bundle hatasız |
| 2026-10-09 | 10 | S10 kısmen: parite satırları güncellendi, ertele aksiyonu ve saat dilimi kontrolü eklendi, Android ve iOS paketleri derlendi (expo-doctor 21/21); cihaz kabulü ve bulut dışa aktarma bekliyor |
| 2026-10-09 | 9 | S9 kod tamam: onboarding (3 sayfa, oturum öncesi kapı), yasal sayfalar (Flutter metni, taslak), CSV içe aktarma (Flutter kuralları, satır bazlı hata, çevrimiçi); testler, typecheck temiz. Yasal metin onayı ve cihaz doğrulaması bekliyor |
| 2026-10-09 | 8 | S8 kod tamam: cihaz içi CSV dışa aktarma (11 alan, formül koruması), hesap silme (parola ve "sil" onayı, yakın giriş), geri bildirim ve destek kaydı, ödeme yöntemleri; testler, typecheck temiz. Bulut dışa aktarma canlıda RPC eksik; canlı hesap silme denenmedi |
| 2026-10-09 | 7 | S7 kod tamam: ayarlar ana ekranı, profil (ad, soyad, para birimi, şifre değişimi), görünüm, uygulama kilidi (PIN, biyometri, kilit süresi, hatalı deneme beklemesi; arka plandan dönüşte kilit), gizlilik merkezi; testler, typecheck temiz. Cihaz doğrulaması ve PIN tur sayısı ölçümü bekliyor |
| 2026-10-09 | 6 | S6 kod tamam: expo-notifications ile yerel hatırlatmalar (kural ve varsayılan gün, deneme 7/3/1, 09:00, farka dayalı eşitleme, 60 sınır), izin akışı, dokunmada deep link, bildirim merkezi (okunur), tercihler (yerel), ana sayfa rozeti; testler, typecheck temiz. Cihaz doğrulaması ve ertele/okundu eksik |
| 2026-10-09 | 5 | S5 kod tamam: istatistik, ödeme geçmişi (ekleme/silme, çevrimiçi), tasarruf (toplam, fırsatlar, geçmiş), duraklatma ve iptalde tasarruf kaydı (kuyrukta üçüncü aşama), ana sayfada tasarruf kartı; testler, typecheck temiz. Üç seçenekli iptal ekranı ve ödeme düzenleme (tutar ve tarih) eklendi; testler |
| 2026-10-09 | 4 | S4 kod tamam: ana sayfa (aylık/yıllık toplam para birimi bazlı, aktif/7 gün/deneme çipleri, deneme listesi, sıradaki ödeme, hızlı eylemler) ve takvim (pazartesi başlangıçlı ay ızgarası, yenileme ve deneme noktaları, gün detayı, ay toplamları); testler, typecheck temiz. Eşik kararı ve S5 öğeleri bekliyor |
| 2026-10-09 | 3 | S3 kod tamam: şifreli cache (sunucu verisi, okuma yedeği), FIFO yazma kuyruğu (yazım ve olay aşamaları, geçici/kalıcı hata ayrımı), çevrimiçi olunca senkron, çevrimdışı şerit ve bekleyen yazım sayısı; testler, typecheck temiz. Cihazda uçak modu senaryosu bekliyor |
| 2026-10-09 | 2 | S2 kod tamam: filtre sayfası (kategori, para birimi, sıralama, 7 gün), gecikmiş yenileme onayı (RENEWAL_ADVANCED), realtime senkron, servis önerileri (support-catalog + yedek liste); testler, typecheck temiz |
| 2026-10-09 | 2 | S1 (abonelik yaşam döngüsü) kod tamam: düzenleme, durdur/devam/iptal/arşivle/arşivden çıkar, arşiv listesi, fiyat ve durum olay kaydı; bildirim kuralı koruma; testler, typecheck temiz |
| 2026-10-09 | 1 | Auth kodu: PKCE + güvenli oturum deposu, AuthProvider, oturum yönlendirme kuralları (saf fonksiyon), giriş/kayıt/şifre sıfırlama/yeni şifre ekranları, `auth-callback` rotası; testler, typecheck ve Android bundle hatasız |

Aşama 0 çıkış kriterlerinden durum:

- [x] `tsc --noEmit` hatasız
- [x] Money ve tarih testleri Flutter `core/` kurallarını kapsıyor
- [x] Android bundle üretiliyor
- [x] Android debug uygulaması `SubscriptTrack_Expo_Test` AVD'sinde açıldı; ana sekmeler, gizlilik ve CSV dışa/içe aktarma akışları kontrol edildi (fiziksel cihaz testi yerine geçmez)
- [ ] iOS cihaz açılışı (kullanıcı iOS/EAS doğrulamasını erteledi)
- [x] ESLint yapılandırması ve Expo CI kalite iş akışı eklendi (GitHub CI sonucu bekliyor)
