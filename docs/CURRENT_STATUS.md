# Güncel Proje Durumu

Son güncelleme: 30 Eylül 2026

Bu dosya **özellik durumunun ve dağıtım bilgisinin tek kaynağıdır**. Başka belgeler özellik tablosunu kopyalamaz, buraya bağlanır. Test sayısı, kapsama ve kalite puanı elle yazılmaz; [kalite raporunda](quality/index.html) üretilir.

## Genel durum

SubscriptTrack; Flutter mobil istemci, Supabase (Auth, PostgreSQL + RLS, RPC, Realtime, Edge Functions) ve GitHub Pages web önizlemesinden oluşur ([ARCHITECTURE.md](architecture/ARCHITECTURE.md)). Özelliklerin çoğu kodda ve testlerde tamamdır. **Yayına hazır değildir:** imzalı release üretimi, gerçek cihaz doğrulaması ve iOS build tamamlanmadı (CI yeşil, bkz. aşağıda).

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
| Realtime çoklu cihaz | Kısmi | Kod ve yayın var; iki oturumlu canlı test yok |
| CSV dışa/içe aktarma | Uygulandı | 11 alanlı kanonik şema; CSV enjeksiyonu etkisizleştirilir |
| Hesap silme | Uygulandı | `delete-account` (yakın giriş şartı ve Storage temizliği repoda, canlıya alınmadı); silme sonrası kalıntı veri kontrolü yok |
| Destek bileti | Uygulandı | `support_tickets` + ekran + `support-catalog` POST |
| Uygulama kilidi (PIN, biyometri) | Kısmi | Salt'lı PBKDF2, üstel bekleme, saat geri alma koruması, kilit açıkken ekran gizliliği (kod ve testler); cihaz testi yok |
| Açık tema | Planlı | Yalnızca koyu tema |
| Analitik / crash raporlama | Planlı | Altyapı yok ([ANALYTICS.md](product/ANALYTICS.md)) |
| iOS build ve dağıtım | Planlı | Hiç derlenmedi |
| Expo sürümü (paralel, [ADR 0010](decisions/0010-expo-parallel-app.md)) | Kısmi | Aşama 0 ve Aşama 1 kodu tamam: Supabase istemcisi, Money/takvim modülleri, tokenlar, auth akışı, testler; Android bundle üretiliyor; cihaz ve iOS doğrulaması yok ([docs/expo](expo/README.md)) |

## Canlı backend

Ayrıntılı, tarihli anlık görüntü: [SUPABASE_LIVE_STATUS.md](reference/SUPABASE_LIVE_STATUS.md). Özet: 15 tablo (hepsinde RLS), 4 Edge Function, `subscriptions` Realtime'da, advisor 0 hata; Leaked Password Protection kapalı; canlıda migration geçmişi boş.

## Güvenlik düzeltmeleri (repoda; canlıya alınmayı bekliyor)

Güvenlik denetimi bulgularının büyük bölümü kodda, testlerde ve migration dosyalarında (032–035) giderildi; **canlı veritabanı 2026-10-10 itibarıyla güncellendi**: migration 019, 032–035 uygulandı ve doğrulandı, `process-export` v2 dağıtıldı. Hesap ayarları (sızdırılmış parola koruması, özel SMTP) hâlâ açık sayılır. Ayrıntı: [SECURITY.md](architecture/SECURITY.md#3-açık-güvenlik-işleri).

## Dağıtım ve CI

- Git dalı: `main` (güncel commit için `git log`).
- GitHub Pages web önizleme: https://subscription-tracking.github.io/SubscriptTrack/ (workflow: Deploy web preview).
- **CI "Mobile quality gate" (2026-09-30, `28f2106`):** `analyze-and-test`, `backend-test` ve `android-release-candidate` (imzasız release AAB derlemesi, 6 dk 20 sn) **başarılı**. AAB hatası (`Java heap space`) Gradle bellek sınırı 1,5 GB → 4 GB ile giderildi. Üretilen AAB imzasızdır; Play'e yüklenebilir imzalı sürüm için upload keystore gerekir ([RELEASE.md](operations/RELEASE.md#7-android-imzalama-planlı)).
- Release APK/AAB dosyaları git'te tutulmaz; yerel, git dışı çıktı klasöründedir ve depoda yayınlanmış bir "son sürüm" yoktur.
- Supabase proje ref: `tdbljrojcmyjwchawfif`.

## Doğrulama

Otomatik: `flutter analyze` ve `flutter test` (CI'da yeşil), backend testleri (CI'da yeşil). Güncel sayılar ve kalite puanı: [kalite raporu](quality/index.html).
Açık doğrulamalar (gerçek hesap/cihaz gerektirir): e-posta teslimi ve yönlendirme, hesap silme sonrası veri kontrolü, export indirme, iki oturumlu Realtime, bildirim/biyometri/secure-storage taşıma, release imzalama, iOS ([DEVICE_ACCEPTANCE.md](operations/DEVICE_ACCEPTANCE.md), [RELEASE.md](operations/RELEASE.md)).

## Ürün kuralı ile kod arasında karar bekleyen çelişkiler

| Konu | Ürün kuralı | Bugünkü uygulama |
|---|---|---|
| Fiziksel silme | Normal akışta yok; iptal/arşiv (AGENTS.md, [DOMAIN](product/DOMAIN.md), [ADR 0006](decisions/0006-archive-over-delete.md)) | Detay ve liste ekranında herhangi bir abonelik için "Kalıcı olarak sil" |
| Yenileme tarihi | Sessizce ilerletilmez (DOMAIN §7) | Yükleme sırasında gecikmiş aktif abonelik otomatik ilerletilir (Excel Test 45) |

Ayrıntı: [MOBILE.md §6](architecture/MOBILE.md). Hangisinin geçerli olduğu ürün sahibinin kararıdır.
