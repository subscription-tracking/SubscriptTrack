# Güncel Proje Durumu

Son güncelleme: 13 Ekim 2026 (Expo senaryo kapatmaları; Flutter durum satırları önceki doğrulama düzeyindedir)

**13 Ekim Expo senaryo kapatmaları:** Excel senaryolarının cihaz gerektirmeyen bölümü kodla kapatıldı: atomik SecureStore yazımı ve kuyruk karantinası, geçici hata sınıflaması ve zaman aşımı, kilitte modal/erişilebilirlik gizleme, çıkışta yerel veri temizliği ve kullanıcıya bağlı PIN, düzenlemede gizli hata ve deneme durumu, aynı isim uyarısı, yıllık toplam ve para birimi gruplu fiyat sıralaması, expired çipi, bugün/gecikmiş yedek bildirim ve izin uyarısı. Bunlar kod ve otomatik test düzeyindedir; Android/iOS cihaz kabulü, canlı 038/039 ve bayraklar açık kalır. Ayrıntı: [senaryo incelemesi](quality/expo-scenario-review-2026-10-13.md).

**12 Ekim mimari iyileştirme:** Abonelik oluşturma koordinasyonu, eşitleme depo/oturum sınırları, PIN seri doğrulama ve güvenli hata ekranı, yenileme RPC adaptörü, ödeme hook'u ve CSV adaptör/domain ayrımı uygulandı. Mimari kontroller AST ve tüm dosyalarda döngü denetimine genişletildi. Uygulama ve kanıt kaydı `docs/quality/expo-architecture-remediation-2026-10-12.md` içindedir. Native kabul ve canlı özellik anahtarları bu çalışmada değişmedi.

**12 Ekim denetimi:** En güncel rapor `docs/quality/expo-current-audit-2026-10-12.md` içindedir. 036/037 sürümleri canlı migration listesinde doğrulandı; canlı katalog bulguları SUPABASE_LIVE_STATUS belgesinde kayıtlıdır. İstemci bayrakları hâlâ kapalı kaydedildiği için varsayılan yenileme ve ertelenmiş ödeme eski yolları kullanır. Fiziksel cihaz, iki hesap ve imzalı yayın kabulü açıktır. Aşağıdaki 11 Ekim notu tarihsel durumdur; bazı eski dağıtım satırları ayrıca uzlaştırılmayı bekler.

**11 Ekim kod düzeltmesi:** Expo bildirim planı saat/IANA bölge/içerik değişiminde yenilenir; kayıt sonucu hesap varlığını ifşa etmez. Expo ve Flutter iptalden yeniden etkinleştirmeyi onayla sunar ve geçersiz detay eylemlerini gizler. Migration 036 atomik yenileme RPC'sini depoya ekler; **canlıya uygulanmadı** ve Expo özellik anahtarı varsayılan kapalıdır. Bu yüzden varsayılan “Ödendi ve yenilendi” akışı hâlâ iki ayrı yazımın atomiklik riskini taşır. Güncel puan ve açık kanıtlar `docs/quality/expo-current-audit-2026-10-11.md` içinde, kod düzeltmeleri `docs/quality/expo-code-quality-remediation-2026-10-11.md` içinde izlenir. Fiziksel Android, iOS ve canlı 036 kabulü açık olduğundan yayın hazırlığı tamamlanmadı.

Bu dosya **özellik durumunun ve dağıtım bilgisinin tek kaynağıdır**. Başka belgeler özellik tablosunu kopyalamaz, buraya bağlanır. Test sayısı, kapsama ve kalite puanı elle yazılmaz; [kalite raporunda](quality/index.html) üretilir.

## Genel durum

SubscriptTrack; Flutter mobil istemci, paralel Expo istemcisi, Supabase (Auth, PostgreSQL + RLS, RPC, Realtime, Edge Functions) ve GitHub Pages web önizlemesinden oluşur ([ARCHITECTURE.md](architecture/ARCHITECTURE.md)). Expo kodu ve otomatik kontroller kapsamlıdır; ancak geçiş henüz kabul edilmemiştir. **Yayına hazır değildir:** fiziksel Android ve iOS kabulü ile imzalı release üretimi tamamlanmadı. Flutter Mobile quality gate CI yeşildir; Expo'ya özel workflow varsayılan GitHub dalında henüz bulunmuyor. Expo iki platformda kabul edilene kadar Flutter korunur.

## Teknoloji

Sürüm kaynakları: `mobile/pubspec.lock` ve CI iş akışı (belgelerde sürüm numarası kopyalanmaz; `tools/docs/check_docs.py` doğrular).

- Flutter / Dart (stable), Provider + ChangeNotifier, go_router
- Supabase Flutter SDK; PostgreSQL + RLS, RPC, Realtime; Deno TypeScript Edge Functions
- `flutter_local_notifications` + `timezone` (yalnızca yerel bildirim)
- `flutter_secure_storage` ve yerel cache
- `Money` / minor unit para modeli
- GitHub Actions + GitHub Pages

## Özellik durumu

Etiketler: **Uygulandı** · **Kısmi** (kod var, doğrulama eksik) · **Planlı** · **Kapsam dışı**.

| Özellik | Durum | Açıklama |
|---|---|---|
| Onboarding | Uygulandı | 4 sayfa, tamamlanma kaydı |
| E-posta kayıt ve giriş | Uygulandı | Supabase Auth; yerel mod da var |
| Şifremi unuttum | Kısmi | Kod ve ekran var; gerçek e-posta/yönlendirme testi yok; GitHub Pages adresi izinli yönlendirmelerde değil |
| E-posta doğrulama | Kısmi | Oturumsuz kayıt doğru ele alınıyor; canlı e-posta teslimi doğrulanmadı |
| Google / Apple giriş | Kısmi | Kod yolu var; canlıda sağlayıcılar kapalı, OAuth testi yok |
| Abonelik CRUD | Uygulandı | RPC + PostgREST, RLS |
| Abonelik durumları | Uygulandı | trial, active, paused, cancelled, expired, archived |
| Servis kataloğu | Uygulandı | `service_catalog` + `support-catalog` + mobil yedek liste |
| Ödeme yöntemi etiketi | Uygulandı | `payment-methods` Edge Function (GET/PUT) |
| Ödeme geçmişi | Uygulandı | Ekleme, düzenleme, silme; ödendi/yenilendi akışı |
| Dashboard / takvim / istatistik / tasarruf | Uygulandı | Para birimi bazlı toplamlar |
| Yerel bildirim | Uygulandı (cihaz doğrulaması yok) | Planlama, test, erteleme, deep link |
| Uygulama içi bildirim merkezi | Uygulandı | `notifications` + saatlik `pg_cron` üretimi |
| Uzak push (FCM/APNs) | Kapsam dışı | Kullanılmaz |
| Offline cache ve kuyruk | Uygulandı | Son veri, FIFO mutation kuyruğu |
| Realtime çoklu cihaz | Kısmi | Aynı hesapta iki bağımsız oturum INSERT olayını aldı; farklı kullanıcılar ve ayrı fiziksel cihazlarda eşitleme açık |
| CSV dışa/içe aktarma | Uygulandı | 11 alanlı kanonik şema; CSV enjeksiyonu etkisizleştirilir |
| Hesap silme | Uygulandı | `delete-account` (yakın giriş şartı ve Storage temizliği repoda, canlıya alınmadı); silme sonrası kalıntı veri kontrolü yok |
| Destek bileti | Uygulandı | `support_tickets` + ekran + `support-catalog` POST |
| Uygulama kilidi (PIN, biyometri) | Kısmi | Salt'lı PBKDF2, üstel bekleme, saat geri alma koruması, kilit açıkken ekran gizliliği (kod ve testler); cihaz testi yok |
| Açık tema | Planlı | Yalnızca koyu tema |
| Analitik / crash raporlama | Planlı | Altyapı yok ([ANALYTICS.md](product/ANALYTICS.md)) |
| iOS build ve dağıtım | Planlı | Hiç derlenmedi |
| Expo sürümü (paralel, [ADR 0010](decisions/0010-expo-parallel-app.md)) | Kısmi | Auth, abonelik, offline, analitik, bildirim ve ayarlar kodu var; otomatik kalite kapıları yeşil. Android 36 AVD'de SDK 57 development client ve Expo Go 57 açılışları daha önce doğrulandı; son S16 tekrarında uygulama açılış ekranında kaldığı için yeni rota kanıtı alınmadı. S16 kod düzeyinde sekme rolleri, erişilebilir durum duyuruları, takvim gün adları/olay ayrımı ve dokunma alanları iyileştirildi; Flutter görsel kıyası, TalkBack/büyük yazı cihaz turu ve yasal metin onayı açık. Go bildirim modülü denemesi runtime hatasına düştüğü için bu ortamda notification API kapalı tutulur; development build'de test bildirimi OS'e ulaştı. Gerçek PIN hash formatı Flutter ile uyumlu, ancak güvenli depodan cihazda taşıma kanıtlanmadı. Uzak CI, çapraz hesap RLS, fiziksel Android, S15 yerel kabulü ve iOS açık; hesaba bağlı imzalı release kullanıcı kararıyla ertelendi. Ayrıntı: [S15–S16 cihaz ve ekran kabulü](operations/DEVICE_ACCEPTANCE.md), [sprint matrisi](expo/REMAINING_SPRINTS.md) ve [denetim raporu](quality/expo-migration-audit.md). |

## Canlı backend

Ayrıntılı canlı envanter ve 10–11 Ekim 2026 tarihli istek kanıtları: [SUPABASE_LIVE_STATUS.md](reference/SUPABASE_LIVE_STATUS.md). 30 Eylül dashboard envanteri tarihli anlık görüntüdür; migration geçmişi boş olduğundan tek başına canlı migration sürümlerini göstermez. 11 Ekim smoke'ları belirli RPC/Function davranışlarını doğrular. Rate limit migration 032 canlıda etkin değil ([SECURITY.md](architecture/SECURITY.md)); 034 ve 035'in canlı durumu admin/SQL ile doğrulanmadı. Migration 033 dosya notu uygulanma tarihi bildirir, ancak bu kabul turunda canlı CHECK davranışı ayrıca denenmedi. Leaked Password Protection kapalıdır.

## Güvenlik düzeltmeleri (repoda; canlıya alınmayı bekliyor)

Güvenlik düzeltmelerinin bir bölümü kod ve testlerde hazır; migration'ların repoda bulunması canlıya alındıklarını kanıtlamaz. 032 rate limit migration'ı canlıda etkin değildir; 034/035 doğrulanmamıştır; 033'ün migration başlığındaki uygulanma notu bağımsız canlı SQL/üst-sınır isteğiyle teyit edilmemiştir. Bulut export RPC→Function→imzalı indirme akışı test hesabında çalıştı; canlı Function sürümü bu testte envanterlenmedi. Hesap ayarlarında Leaked Password Protection ve özel SMTP hâlâ açık işlerdir. Ayrıntı ve her kanıtın tarihi: [SECURITY.md](architecture/SECURITY.md#3-açık-güvenlik-işleri) ve [SUPABASE_LIVE_STATUS.md](reference/SUPABASE_LIVE_STATUS.md).

## Dağıtım ve CI

- Git dalı: `main` (güncel commit için `git log`).
- GitHub Pages web önizleme: https://subscription-tracking.github.io/SubscriptTrack/ (workflow: Deploy web preview).
- **CI "Mobile quality gate" (2026-09-30, `28f2106`):** `analyze-and-test`, `backend-test` ve `android-release-candidate` (imzasız release AAB derlemesi, 6 dk 20 sn) **başarılı**. AAB hatası (`Java heap space`) Gradle bellek sınırı 1,5 GB → 4 GB ile giderildi. Üretilen AAB imzasızdır; Play'e yüklenebilir imzalı sürüm için upload keystore gerekir ([RELEASE.md](operations/RELEASE.md#7-android-imzalama-planlı)).
- Release APK/AAB dosyaları git'te tutulmaz; yerel, git dışı çıktı klasöründedir ve depoda yayınlanmış bir "son sürüm" yoktur.
- Supabase proje ref: `tdbljrojcmyjwchawfif`.

## Doğrulama

Otomatik: `flutter analyze` ve `flutter test` (CI'da yeşil), backend testleri (CI'da yeşil). Güncel sayılar ve kalite puanı: [kalite raporu](quality/index.html).
Açık doğrulamalar: Expo için fiziksel Android kabulü; zamanlanmış yenileme/trial bildirimi, erteleme ve cold-start; IANA timezone değişimi; PIN/biyometri ve secure-storage taşıması; çapraz hesap RLS, ayrı cihazlarda Realtime ve offline FIFO. Expo Go Android AVD'de onboarding/girişe kadar açıldı; Go bildirim desteği uygulamada kapalıdır, çünkü modu açan SDK 57 testinde runtime hata verdi. iOS cihaz kabulü ve EAS imzalı release kullanıcı isteğiyle ertelendi. Flutter için release imzalama ve iOS build'i de ayrı doğrulanmadı ([DEVICE_ACCEPTANCE.md](operations/DEVICE_ACCEPTANCE.md), [RELEASE.md](operations/RELEASE.md)).

## Ürün kuralı ile kod arasında karar bekleyen çelişkiler

| Konu | Ürün kuralı | Bugünkü uygulama |
|---|---|---|
| Fiziksel silme | Normal akışta yok; iptal/arşiv. Yanlış kayıt istisnası yalnız yanlış oluşturulmuş arşiv içindir ([DOMAIN](product/DOMAIN.md), [ADR 0006](decisions/0006-archive-over-delete.md)) | Flutter detay ve çoklu seçim ekranı herhangi bir aboneliği silebilir; Expo yalnız yanlış kayıt olduğu doğrulanan arşiv kaydını siler. Flutter farkı açık ve Expo'ya taşınmadı. |
| Yenileme tarihi | Kullanıcı onayı olmadan sessiz ilerletme yapılmaz ([DOMAIN §7](product/DOMAIN.md)) | Flutter yüklemede gecikmiş aktif aboneliği otomatik ilerletir (Excel Test 45); Expo gecikmeyi gösterir ve yenilemeyi kullanıcı onayına bağlar. Flutter farkı açık ve Expo'ya taşınmadı. |

Ayrıntı: [MOBILE.md §6](architecture/MOBILE.md). Hangisinin geçerli olduğu ürün sahibinin kararıdır.
# 12 Ekim 2026 — kalan Expo mimari maddeleri

Clean Architecture / Clean Code raporundaki semantik yerel doğrulama, bağımlılık verilen koordinatörler, sonuç kodlarının sunumdan ayrılması, PIN depo sonucu, ağın bilinmeyen durumu ve yoğun takvim/CSV/form/iptal/bildirim sorumlulukları uygulandı. Kapanış kanıtı: [mimari tamamlanma raporu](quality/expo-architecture-completion-2026-10-12.md). Bu çalışma native yayın kabulünü kapatmaz.

## Expo 59 senaryo sözleşmesi — 12 Ekim 2026

**Expo için güncel kullanıcı kararı:** [Gereksinim, API/veri modeli ve dağıtım sözleşmesi](quality/expo-59/CONTRACT.md). Önceki Expo anlatımıyla çelişen tarih, mantıksal silme, 1.000 kota, 2.000 not, tüm para birimleri, device/fixed bölge ve açık/koyu/sistem tema kurallarında bu sözleşme geçerlidir. Flutter mevcut uygulaması korunur. Kod hazırlığı canlı/native kabul anlamına gelmez.
