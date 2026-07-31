# SubscriptTrack Sprint Planı

## Plan varsayımları

- Sprint süresi: 2 hafta
- Ürün: iOS ve Android mobil uygulaması
- Web sitesi: tanıtım, yardım, iptal rehberleri ve yasal sayfalar
- Geliştirme yöntemi: contract-first, dikey dilimler
- Her sprint sonunda Android ve iOS üzerinde doğrulanabilir çıktı alınır.
- Backend, mobil ve test işleri aynı feature kapsamında planlanır.

## Ortak Definition of Done

Bir iş aşağıdaki şartlar sağlanmadan tamamlanmış sayılmaz:

- Kabul kriterleri karşılanır.
- Loading, error, empty ve uygun yerlerde offline durumları ele alınır.
- Unit/component testleri yazılır.
- API değişikliği varsa sözleşme ve ilgili doküman güncellenir.
- Android ve iOS build üzerinde temel akış test edilir.
- Güvenlik, erişilebilirlik ve analytics etkisi değerlendirilir.
- Code review tamamlanır.

---

## Sprint 0 — Proje temeli ve teknik kararlar

### Hedef

Çalışan Flutter proje kabuğunu, geliştirme ortamlarını ve kesin teknik kararları oluşturmak.

### Kullanıcı/ekip çıktısı

Ekip uygulamayı lokal olarak çalıştırabilir ve aynı API sözleşmesi üzerinden geliştirmeye başlayabilir.

### Görevler

- [ ] Flutter projesini `mobile/` altında oluştur.
- [ ] `pubspec.yaml`, `main.dart`, lint ve format ayarlarını ekle.
- [ ] Development, staging ve production environment yapısını kur.
- [ ] Navigation, app shell ve bottom navigation temelini oluştur.
- [ ] Tema tokenlarını ve ortak UI klasörlerini bağla.
- [ ] Mobil framework kararını ADR ile kesinleştir.
- [ ] Backend hosting/framework, auth, queue, e-posta ve analytics sağlayıcılarını kararlaştır.
- [ ] API endpoint ve model isimlerini OpenAPI taslağına taşı.
- [ ] CI’da lint, test ve Android build çalıştır.
- [ ] iOS signing ve Android application ID planını dokümante et.

### Kabul kriterleri

- Uygulama Android emülatörde ve iOS simulator’da açılır.
- Bir örnek route üzerinden ekranlar arasında geçiş yapılır.
- CI lint ve boş test suite’i başarıyla çalıştırır.
- Environment secret’ları kaynak kodda bulunmaz.
- Kesinleşen teknik kararlar ADR olarak kaydedilir.

### Test ve bağımlılıklar

- Smoke build, lint, başlangıç widget testi.
- Bağımlılık: yok; tüm sonraki sprintlerin ön koşuludur.

---

## Sprint 0.5 — Mimari zemin (go_router + provider + DI)

### Hedef

Sprint 1 öncesinde mimari borçları kapatmak: navigation guard için go_router, prop drilling'i kesmek için provider, Supabase geçişine zemin hazırlamak için abstract repository interface'leri.

### Kullanıcı/ekip çıktısı

Uygulama aynı şekilde çalışır; ekip Sprint 1'den itibaren navigation guard ve dependency injection altyapısına sahip olarak geliştirir.

### Görevler

- [x] `go_router` ve `provider` paketlerini ekle; kullanılmayan `sqflite` ve `path`'i kaldır.
- [x] `AuthDataSource` ve `SubscriptionDataSource` abstract interface'lerini oluştur.
- [x] `AuthRepository` ve `SubscriptionRepository` bu interface'leri implement etsin; `@override` annotasyonları ekle.
- [x] `AuthController._repo` ve `SubscriptionController._repo` tiplerini concrete'ten abstract'a yükselt.
- [x] `SubscriptionController.add()` ve `edit()` finally bloğundaki `_loading = false` bug'ını `_setLoading(false)` ile düzelt.
- [x] `AuthController`'a `initialized`, `onboardingNeeded`, `onboardingDone()` ekle; init() onboarding kontrolünü de kapsasın.
- [x] `AppRouter` — `AuthController`'ı `refreshListenable` olarak kullanan go_router; `/splash`, `/onboarding`, `/login`, `/register`, `/home` rotaları; auth redirect guard.
- [x] `AuthenticatedShell` widget'ı: `SubscriptionController`'ı oluşturup `ChangeNotifierProvider` ile alt ağaca sağlar.
- [x] `app.dart` — `MultiProvider` (AuthController + SettingsController) ve `MaterialApp.router`.
- [x] `AppShell` — constructor param almaz; tab ekranları `context.watch<T>()` ile bağımsız okur.
- [x] `DashboardScreen`, `CalendarScreen`, `SubscriptionListScreen`, `ProfileTab` — constructor param kaldırıldı, `context.watch/read` ile controller alır.

### Kabul kriterleri

- `flutter analyze` sıfır hata döner.
- Login → Home → Logout akışı go_router redirect ile çalışır.
- Kimlik doğrulanmamış kullanıcı `/home`'a giremez; otomatik `/login`'e yönlendirilir.
- Authenticated kullanıcı `/login`'e giderse otomatik `/home`'a döner.
- Onboarding ilk açılışta gösterilir; tamamlandıktan sonra bir daha çıkmaz.
- `AppShell` ve tab ekranları constructor aracılığıyla controller almaz.

### Test ve bağımlılıklar

- `flutter analyze` ve mevcut smoke build.
- Bağımlılık: Sprint 0; Sprint 1'in ön koşuludur.

---

## Sprint 1 — Auth ve onboarding

### Hedef

Kullanıcının hesap oluşturup güvenli şekilde oturum açabilmesini sağlamak.

### Kullanıcı hikâyeleri

- Kullanıcı e-posta ve şifreyle kayıt olabilmeli.
- Kullanıcı Google ve iOS’ta Apple ile giriş yapabilmeli.
- Kullanıcı şifresini sıfırlayabilmeli.
- Kullanıcı oturumunu kapatabilmeli ve tekrar açtığında oturumu korunmalı.

### Görevler

- [ ] Login/register/forgot-password API contract’larını kesinleştir.
- [ ] Auth modelleri, repository ve API client katmanını oluştur.
- [ ] Access/refresh token akışını ve secure storage’ı bağla.
- [ ] Auth interceptor ve token refresh davranışını ekle.
- [ ] Login, register, forgot password ve reset password ekranlarını bağla.
- [ ] Navigation guard ile yetkisiz kullanıcıyı login’e yönlendir.
- [ ] Onboarding’de timezone, locale ve temel profil ayarlarını al.
- [ ] Logout ve token revoke akışını ekle.

### Kabul kriterleri

- Geçerli kullanıcı kayıt olabilir, giriş yapabilir ve çıkış yapabilir.
- Geçersiz bilgiler anlamlı alan hatası gösterir.
- Uygulama yeniden açıldığında geçerli oturum korunur.
- Süresi dolan access token refresh ile yenilenir.
- Başka kullanıcıya ait kaynaklar client’tan gönderilen `user_id` ile erişilemez.

### Test ve bağımlılıklar

- Auth controller unit testleri.
- Secure storage testi.
- Login/register widget testleri.
- Token expiry ve unauthorized integration testi.
- Bağımlılık: Sprint 0.

---

## Sprint 2 — Ortak UI ve abonelik ekleme

### Hedef

Kullanıcının ilk aboneliğini doğrulanmış bir form üzerinden ekleyebilmesini sağlamak.

### Kullanıcı hikâyeleri

- Kullanıcı abonelik adını, tutarını, para birimini ve döngüsünü girebilmeli.
- Kullanıcı sistem kategorilerinden seçim yapabilmeli.
- Kullanıcı bir sonraki yenileme tarihini seçebilmeli.

### Görevler

- [ ] App shell, top bar ve bottom navigation’ı tamamla.
- [ ] Button, text field, card, badge, dialog ve bottom sheet bileşenlerini oluştur.
- [ ] Theme, spacing, typography ve renk tokenlarını bağla.
- [ ] `Money`, currency, billing cycle ve category modellerini oluştur.
- [ ] Subscription create request/response contract’ını bağla.
- [ ] Add subscription ekranını ve form validation’ını oluştur.
- [ ] Tarih, para ve kategori seçim bileşenlerini ekle.
- [ ] Başarılı kayıttan sonra liste/dashboard yönlendirmesini ekle.

### Kabul kriterleri

- Zorunlu alanlar boşken kayıt yapılamaz.
- Tutar floating point kaybı olmadan API’ye gönderilir.
- Desteklenen currency ve billing cycle değerleri dışında seçim yapılamaz.
- Başarılı kayıt sonrası yeni abonelik görünür.
- API hatası formu bozmadan kullanıcıya gösterilir.

### Test ve bağımlılıklar

- Money ve form validation unit testleri.
- Subscription form widget testleri.
- Create subscription contract testi.
- Bağımlılık: Sprint 1 auth.

---

## Sprint 3 — Abonelik yaşam döngüsü

### Hedef

Aboneliklerin listelenmesi, detayının görülmesi ve domain durumlarının yönetilmesi.

### Kullanıcı hikâyeleri

- Kullanıcı aboneliklerini yenileme tarihine göre görebilmeli.
- Kullanıcı aboneliği düzenleyebilmeli.
- Kullanıcı pause, resume, cancel, archive ve restore işlemlerini yapabilmeli.

### Görevler

- [ ] Subscription list/detail/update API bağlantılarını ekle.
- [ ] Liste, detay ve düzenleme ekranlarını bağla.
- [ ] Subscription card, status badge ve category badge’i tamamla.
- [ ] Pause/resume/cancel/archive/restore action sheet’lerini ekle.
- [ ] Domain state geçiş hatalarını UI’da göster.
- [ ] Archive kayıtlarını varsayılan listeden çıkar.
- [ ] Local cache ile son başarılı listeyi sakla.
- [ ] Offline read-only görünümü ve offline banner ekle.

### Kabul kriterleri

- Liste en yakın yenileme tarihine göre sıralanır.
- Durum değişikliğinde geçmiş kaydı silinmez.
- Archived kayıtlar varsayılan aktif listede görünmez.
- Offline durumda son liste açılır; desteklenmeyen yazma işlemi açıkça belirtilir.
- Yetkisiz veya geçersiz durum geçişleri engellenir.

### Test ve bağımlılıklar

- State transition unit testleri.
- Liste/detail widget testleri.
- Offline cache testi.
- Authorization ve contract testleri.
- Bağımlılık: Sprint 2.

---

## Sprint 4 — Dashboard ve finansal hesaplamalar

### Hedef

Kullanıcıya para birimi bazında güvenilir aylık/yıllık harcama özeti sunmak.

### Kullanıcı hikâyeleri

- Kullanıcı bu ay ve bu yıl tahmini harcamasını görebilmeli.
- Kullanıcı aktif abonelik sayısını ve yaklaşan yenilemeleri görebilmeli.
- Kullanıcı farklı para birimlerini ayrı toplamlar halinde görmeli.

### Görevler

- [ ] Dashboard summary/upcoming API contract’ını bağla.
- [ ] Dashboard controller ve state modelini oluştur.
- [ ] Summary card, monthly summary ve upcoming renewal widget’larını tamamla.
- [ ] `Money` ve billing cycle hesaplama servislerini oluştur.
- [ ] Aktif, paused, cancelled ve archived filtrelerini uygula.
- [ ] Dashboard cache ve refresh davranışını ekle.
- [ ] Boş dashboard ve API error ekranlarını ekle.

### Kabul kriterleri

- Para birimleri birbirine çevrilmeden ayrı gösterilir.
- Yıllık, aylık, haftalık, üç aylık ve altı aylık hesaplar doğru yapılır.
- Paused/cancelled/archived kayıtlar aktif toplamdan çıkarılır.
- Rounding yalnızca gösterimde yapılır.
- Pull-to-refresh son veriyi getirir.

### Test ve bağımlılıklar

- Her billing cycle için hesaplama testleri.
- Decimal rounding testleri.
- Dashboard widget testleri.
- Farklı currency integration testi.
- Bağımlılık: Sprint 3.

---

## Sprint 5 — Takvim ve uygulama içi bildirimler

### Hedef

Yenileme ve trial olaylarını takvimde ve bildirim merkezinde görünür hale getirmek.

### Görevler

- [ ] Calendar API ve renewal occurrence modellerini bağla.
- [ ] Aylık takvim, gün hücresi ve event item widget’larını oluştur.
- [ ] Yenileme, trial bitişi ve yüksek tutarlı ödeme ayrımını göster.
- [ ] Notification list API ve read/read-all işlemlerini bağla.
- [ ] Bildirim badge’i ve unread state’i ekle.
- [ ] Deep link route çözümleyicisini oluştur.
- [ ] Bildirimden ilgili abonelik detayına yönlendir.

### Kabul kriterleri

- Kullanıcı aylık takvimde olayları görebilir.
- Takvim öğesine dokununca doğru abonelik açılır.
- Okuma durumu kalıcıdır.
- Aynı bildirim tekrar açıldığında duplicate UI kaydı oluşmaz.
- Geçersiz deep link güvenli fallback ekranına gider.

### Test ve bağımlılıklar

- Timezone ve month-boundary testleri.
- Notification read state testleri.
- Deep link integration testi.
- Bağımlılık: Sprint 4 ve occurrence API.

---

## Sprint 6 — Push, e-posta ve bildirim tercihleri

### Hedef

Backend kaynaklı bildirimlerin doğru zamanda ve seçili kanallarda teslim edilmesi.

### Görevler

- [ ] FCM/APNs entegrasyonunu ekle.
- [ ] Push permission education ve platform izin akışını oluştur.
- [ ] Device token register/revoke API bağlantısını ekle.
- [ ] Notification preferences ekranını bağla.
- [ ] User timezone ve `days_before` değerini backend planlamasına bağla.
- [ ] Occurrence + channel + notification type duplicate engelini uygula.
- [ ] Retry, invalid token ve DEAD durumlarını izlenebilir yap.
- [ ] E-posta template ve delivery durumlarını bağla.

### Kabul kriterleri

- Push token backend’e güvenli şekilde kaydedilir.
- Kullanıcı kapattığı kanaldan bildirim almaz.
- Bildirim kullanıcının timezone’ına göre planlanır.
- Aynı occurrence/channel/type ikinci kez gönderilmez.
- Push’a dokununca doğru abonelik açılır.

### Test ve bağımlılıklar

- Staging push testleri: Android ve iOS.
- Permission denied, invalid token ve retry testleri.
- Duplicate delivery integration testi.
- Bağımlılık: Sprint 5, backend worker ve provider credentials.

---

## Sprint 7 — Ayarlar, export ve hesap silme

### Hedef

Kullanıcının profil, gizlilik ve veri haklarını mobil uygulamadan yönetebilmesi.

### Görevler

- [ ] Profile/settings API bağlantısını ekle.
- [ ] Profil, görünüm ve timezone ayarlarını bağla.
- [ ] Export request/status ekranlarını oluştur.
- [ ] Süreli ve sahip doğrulamalı export indirme akışını bağla.
- [ ] Account deletion confirmation ve re-auth akışını oluştur.
- [ ] Hesap silme job status ve token revoke davranışını bağla.
- [ ] Device token ve local cache temizliğini ekle.

### Kabul kriterleri

- Profil ve tercih değişiklikleri kalıcıdır.
- Export yalnızca hesabın sahibine ait veriyi içerir.
- Süresi geçen export linki kullanılamaz.
- Hesap silme açık onay ve gerektiğinde yeniden doğrulama ister.
- Logout/account delete sonrası hassas local veriler temizlenir.

### Test ve bağımlılıklar

- Settings widget testleri.
- Export ownership/security testleri.
- Account deletion authorization testi.
- Bağımlılık: Sprint 1 auth ve backend export/delete workflow’ları.

---

## Sprint 8 — Kalite, güvenlik ve release candidate

### Hedef

MVP’nin teknik kalite ve güvenlik kapılarını tamamlamak.

### Görevler

- [ ] Unit test coverage kritik domain alanlarında tamamla.
- [ ] Widget/component testlerini tamamla.
- [ ] Auth, ownership, token ve rate limit testlerini çalıştır.
- [ ] Offline, timeout, düşük ağ ve retry testlerini çalıştır.
- [ ] DST, UTC boundary ve timezone değişimi testlerini çalıştır.
- [ ] Push deep link ve permission testlerini tamamla.
- [ ] Crash reporting ve temel analytics event’lerini bağla.
- [ ] Accessibility, text scaling ve contrast kontrolü yap.
- [ ] Staging release candidate build’leri üret.

### Kabul kriterleri

- Kritik test suite’i yeşildir.
- Kritik güvenlik açığı bulunmaz.
- Android ve iOS release candidate build’leri alınır.
- Crash-free ve push delivery izleme panelleri hazırdır.
- Release checklist ve rollback planı tamamdır.

### Test ve bağımlılıklar

- Full unit, widget, integration, contract ve device testleri.
- Bağımlılık: Sprint 1–7.

---

## Sprint 9 — Beta ve mağaza yayını

### Hedef

İlk public MVP’yi kontrollü biçimde yayınlamak.

### Görevler

- [ ] TestFlight beta dağıtımı yap.
- [ ] Google Play Internal Testing dağıtımı yap.
- [ ] Gerçek cihaz ve farklı timezone senaryolarını test et.
- [ ] Beta geri bildirimlerini önceliklendir.
- [ ] Kritik bug’ları düzelt ve regression testlerini çalıştır.
- [ ] Store listing, privacy policy ve terms bağlantılarını tamamla.
- [ ] Production backend, push ve e-posta credential’larını doğrula.
- [ ] App Store ve Google Play gönderimini yap.
- [ ] İlk hafta monitoring ve destek planını başlat.

### Kabul kriterleri

- Kritik ve blocker bug kalmaz.
- Her iki mağaza için build kabul edilir.
- Production smoke testleri geçer.
- Kullanıcı kayıt, abonelik ekleme ve bildirim ana akışı çalışır.
- Rollback ve incident iletişim planı hazırdır.

### Test ve bağımlılıklar

- Beta regression, production smoke ve mağaza öncesi manuel test.
- Bağımlılık: Sprint 8.

## MVP sonrası backlog

- Canlı kur dönüşümü
- Özel kategoriler
- Gelişmiş grafikler ve analitik
- Aile/takım paylaşımı
- B2B özellikleri
- Browser extension
- Tam web dashboard
- Banka entegrasyonu
- Otomatik abonelik iptali

---

# Uygulama ve production hardening plani — Sprint 10-16

Bu plan, gercek kod incelemesinden sonra production seviyesine cikmak icin eklenmistir. Her sprint iki haftalik planlanir; sprint tamamlanmasi icin ilgili testler, dokumanlar ve Android smoke build birlikte gecmelidir.

## Kanonik uygulama sirasi

Asagidaki siralama tek gecerli uygulama siralamasi olarak kullanilacaktir. Eski Sprint 8-9 tanimlari tarihsel kapsamdir; production hardening kapsamlarinin yeni yeri bu tablodur.

| Sprint | Baslik | Onceki kapsamdan tasinanlar |
|---|---|---|
| S10 | API mimarisi ve veri temeli | Yeni API akisi, Money/decimal, RLS, secret guvenligi |
| S11 | Auth ve abonelik API entegrasyonu | Auth, CRUD, status lifecycle, pagination |
| S12 | Ana urun ekranlari | Dashboard, liste, detay, takvim, stats |
| S13 | Kalite, test ve guvenlik | Eski S8'in test, security ve contract kapsami |
| S14 | Push bildirim ve offline | Eski S6 backlog'u, FCM/APNs, cache ve sync |
| S15 | Temizlik ve release candidate | UTF-8, placeholder, dokuman, staging release |
| S16 | Beta ve magaza yayini | Eski S9'un beta, store ve production kapsami |

## Ortak kabul kapisi

- `flutter analyze` hatasiz calisir.
- Etkilenen Flutter ve backend testleri yesildir.
- Loading, error, empty ve uygun yerlerde offline durumlari uygulanmistir.
- API veya domain degisikligi ilgili dokumana islenmistir.
- Android build ve en az bir emulator smoke testi gecmistir.
- Secret, service-role key veya hassas veri commit edilmemistir.
- Degisiklikler geri alinabilir commitlere bolunmustur.
- Graphify kontrolu guncellenmis veya sorgulanmistir.

## Sprint 10 — Mimari kararlar ve veri temeli

**Hedef:** Mobil, backend ve veritabani veri akisinin REST API uzerinden standartlastirilmasi.

**Gorevler:**

- [ ] Mobil ana subscription akisinin REST API olacagini kesinlestir.
- [ ] ApiClient: base URL, Bearer token, timeout, request ID, retry ve ortak hata modeli.
- [ ] ApiSubscriptionRepository ve auth API katmanini ekle.
- [ ] Flutter request/response modellerini backend ile eslestir.
- [ ] Mobildeki `double` para alanlarini Money/decimal yaklasimina tasi.
- [ ] Billing cycle normalize hesaplarini tek domain servisinde birlestir.
- [ ] RLS user-owned policy tanimlarini ekle veya direct client erisimini kaldir.
- [ ] CORS'u production origin listesiyle sinirla.
- [ ] Secret scan ve gerekli Supabase key rotation islemlerini yap.
- [ ] API, architecture ve environment dokumanlarini guncelle.

**Kabul kriterleri:** Mobil subscription verisi REST API'den gelir; para hesaplari floating point hatasi uretmez; ownership guvenligi testle kanitlanir; secret scan temizdir.

## Sprint 11 — Auth ve abonelik API entegrasyonu

**Hedef:** Oturumdan subscription CRUD ve lifecycle akisina kadar uctan uca backend entegrasyonu.

**Gorevler:**

- [ ] Session restore, token refresh ve 401 redirect akisini tamamla.
- [ ] Login, register, reset password ve logout akisini standartlastir.
- [ ] List/create/detail/update endpointlerini Flutter'a bagla.
- [ ] Pause, resume, cancel, archive ve restore endpointlerini bagla.
- [ ] Cursor pagination ve filtreleri uygula.
- [ ] Backend status transition kurallarini UI ile aynilastir.
- [ ] Re-auth, account deletion ve local data temizligini tamamla.
- [ ] Idempotency ve duplicate request davranisini kontrol et.

**Kabul kriterleri:** Gecmis oturum korunur; CRUD backend event uretir; gecersiz status gecisi reddedilir; 401 guvenli login yonlendirmesi yapar.

## Sprint 12 — Ana urun ekranlari

**Hedef:** Dashboard, liste, detay, takvim ve stats ekranlarini gercek API verisiyle tamamlamak.

**Gorevler:**

- [ ] Dashboard summary ve upcoming verisini API'den al.
- [ ] Aylik/yillik toplam ve currency ayrimini tamamla.
- [ ] Bos callback'leri ve `Tumunu gor` navigation'ini tamamla.
- [ ] Liste arama, filtre ve siralamayi API/cache ile uyumla.
- [ ] Detay ve edit ekranini response modeliyle eslestir.
- [ ] Takvim timezone ve ay siniri hesaplarini dogrula.
- [ ] Stats ve savings ekranlarini endpointlere bagla.
- [ ] Tum ana ekranlara loading/error/empty/offline state ekle.
- [ ] Text scaling, contrast ve erisilebilirlik kontrolu yap.

**Kabul kriterleri:** Ekranlar ayni backend verisini gosterir; currency'ler toplanmaz; inactive kayitlar aktif toplama girmez; refresh/empty/error akislari calisir.

## Sprint 13 — Bildirim ve offline altyapisi

**Hedef:** Bildirimleri kalici, timezone uyumlu, tekrarsiz ve offline dayan​​ikli hale getirmek.

**Gorevler:**

- [ ] Local notification schedule/cancel/reschedule akisini tamamla.
- [ ] Android channel ve iOS permission akisini dogrula.
- [ ] FCM/APNs device token register/revoke endpointlerini ekle.
- [ ] Backend push worker, retry ve invalid token akisini ekle.
- [ ] Timezone ve days-before tercihlerini worker'a bagla.
- [ ] Read/read-all durumunu backend'e kalici yaz.
- [ ] Duplicate occurrence/channel/type kontrolu ekle.
- [ ] Offline cache, son basarili veri ve offline banner ekle.
- [ ] Offline mutation kuyrugu ve sync stratejisini belirle.

**Kabul kriterleri:** Bildirim dogru timezone'da gelir; duplicate gonderim olmaz; kapali kanal bildirim almaz; offline veri ve okunma durumu korunur.

## Sprint 14 — Test, guvenlik ve kalite kapisi

**Hedef:** Kritik domain, API ve guvenlik akislarini otomatik testlerle korumak.

**Gorevler:**

- [ ] Money, billing cycle, tarih ve timezone unit testleri.
- [ ] AuthController, SubscriptionController ve repository testleri.
- [ ] Login, form, dashboard, liste, takvim ve notification widget testleri.
- [ ] Backend auth, validation, ownership ve status transition testleri.
- [ ] API contract, migration ve RLS authorization testleri.
- [ ] Rate limit, CORS, secret scan ve error response kontrolleri.
- [ ] Crash reporting ve temel analytics eventleri.

**Kabul kriterleri:** Kritik test suite yesildir; backend test scripti CI'da calisir; ownership ve lifecycle testle kanitlanir; kritik security finding kalmaz.

## Sprint 15 — Temizlik ve dokumantasyon

**Hedef:** Kod, metin ve proje dokumanlarini tek dogru kaynak haline getirmek.

**Gorevler:**

- [ ] Dart, JavaScript, SQL ve Markdown dosyalarini UTF-8 normalize et.
- [ ] Placeholder, kullanilmayan demo widget ve bos callbackleri temizle.
- [ ] Deprecated Flutter API'lerini guncelle.
- [ ] SPRINT_PLAN, CURRENT_STATUS, API ve architecture dokumanlarini senkronla.
- [ ] Environment, migration ve deployment rehberi yaz.
- [ ] Graphify update/query ile dosya iliskilerini kontrol et.
- [ ] Commitleri chore/feat/test/docs/fix olarak bol.

**Kabul kriterleri:** Karakter bozulmasi, kritik placeholder ve dokuman celiskisi kalmaz.

## Sprint 16 — Release ve yayin

**Hedef:** Android ve iOS icin izlenebilir staging/release ciktilari almak.

**Gorevler:**

- [ ] Android keystore, signing, versioning ve App Bundle.
- [ ] iOS bundle ID, signing, archive ve TestFlight.
- [ ] ProGuard/R8 ve release ayarlarini dogrula.
- [ ] CI/CD: analyze, test, secret scan ve build.
- [ ] Staging deploy ve production smoke test.
- [ ] Gercek Android/iOS cihaz ana akis testleri.
- [ ] Store listing, privacy policy ve terms.
- [ ] Rollback, incident ve destek plani.
- [ ] TestFlight ve Google Play Internal Testing dagitimi.

**Kabul kriterleri:** Release buildler gercek cihazda acar; kayit, abonelik ve bildirim ana akisi gecer; production credentiallari ayridir; CI yesildir.
