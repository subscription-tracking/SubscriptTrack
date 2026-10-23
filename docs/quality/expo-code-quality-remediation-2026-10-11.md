# Expo kod kalitesi düzeltme planı ve uygulama kaydı — 11 Ekim 2026

## Plan

1. Yerel bildirim eşitlemesinde kimliğin yanında plan içeriği ve UTC zamanı/IANA bölgesini karşılaştır; değişenleri yenile, aynı olanlara ve erteleme/test kayıtlarına dokunma. Hata görünür ve yeniden açılışta tekrar denenebilir olsun.
2. Yenileme ödemesi, tarih ve olay için sahiplik/tarih kontrolü ile satır kilidi ve idempotency kullanan tek PostgreSQL RPC hazırla. Expo çağrısını varsayılan kapalı özellik anahtarına bağla; eski akış ve eski RPC'ler dağıtım bitene kadar çalışsın.
3. Kayıtlı e-posta için boş kimlik veya açık duplicate hatasını gerçek doğrulama bekleyen kayıtla aynı sonuca eşle. Başka hataları koru.
4. Expo ve Flutter'da iptalden yeniden etkinleştirmeyi onayla aç; detay eylemlerini geçiş tablosundan türet. Geçmiş tasarrufu koru, yeniden etkinleştirmede yeni tasarruf yazma.
5. Kod, davranış testleri, API/veri modeli/domain/bildirim/mobil/parite belgelerini birlikte güncelle; tip/lint/test/Doctor/export kontrollerini çalıştır. Canlı migration ve fiziksel cihaz kabulünü ayrı tut.

## Uygulananlar ve sınırlar

- Expo planlı yerel bildirim parmak izi UTC teslim anı, IANA bölgesi, başlık, gövde ve abonelik kimliğinden oluşur. Eski sürümün parmak izsiz kaydı ilk eşitlemede yenilenir. `st:z|` ve `st:test|` kayıtları kapsam dışıdır. Planlama hatası `NotificationSync` snackbar'ında görünür; AppState `active` geçişi planı yeniden çalıştırır.
- Migration `036_confirm_subscription_renewal_idempotent.sql` yeni RPC'yi tanımlar. Kilit altındaki abonelik sahipliği, beklenen eski tarih, etkin durum, IANA günü ve anahtarın istek özeti kontrol edilir. Ödeme, tarih, olay ve idempotency cevabı aynı işlev çağrısında yazılır. İşlev çağrısı hata verirse PostgreSQL işlemi geri alınır. Eski RPC tanımları değiştirilmedi. **036 canlıya uygulanmadı.** `EXPO_PUBLIC_ATOMIC_RENEWAL_ENABLED=false` varsayılandır; eski iki çağrılı yolun atomiklik riski devam eder.
- Kayıt ekranı aynı genel doğrulama mesajını kullanır. Expo/Flutter geçiş tablosu `CANCELLED → ACTIVE` içerir; onay penceresi geçmiş tasarrufun korunacağını belirtir. Durum eylemi yeni tasarruf olayı oluşturmaz. Geçersiz detay düğmeleri gizlendi.
- Kullanılmayan `dotColor` kaldırıldı. Expo Go belgesi cihaz kaydıyla eşitlendi.

## Doğrulama

| Kontrol | Sonuç |
|---|---|
| Expo Jest + tüm kaynak kapsamı | 88/88 suite, 542/542 test geçti; satır %63,42, dal %57,01, fonksiyon %57,28. Mock testleri cihaz/Supabase kanıtı değildir. |
| Expo tip kontrolü ve lint | Geçti; lint uyarısı yok. |
| Expo Doctor | 21/21 kontrol geçti. |
| Expo export | Web, Android ve iOS JS paketleri üretildi; native imza/cihaz testi değildir. |
| Backend | 45/45 test geçti; 036 testi statik sözleşme kontrolüdür. |
| Flutter | Tam paket 858 test geçti; yeniden etkinleştirme ekranı için hedefli 15 test geçti. `flutter analyze` temiz. |
| Belge denetimi | Önceden var olan izlenmeyen belge/kanıt bağlantıları nedeniyle yeşil değil; `tools/docs/check_docs.py` 39 bağlantı hatası bildirir. |
| Graphify | Mevcut grafik var; `graphify . --update` bu ortamda çıktısız kod 1 ile döndü. Üretilmiş grafik dosyaları elle değiştirilmedi. |

Kod testleri cihaz veya veritabanı işlemi yerine geçmez. Migration için statik sözleşme testi sahiplik kilidi, eski tarih denetimi, istek özeti ve dört yazımın tek işlevdeki sırasını kontrol eder. Yerel PostgreSQL/Docker hizmeti erişilemediği için sahiplik, eski tarih uyuşmazlığı, aynı anahtarın eşzamanlı tekrarı, farklı içerik ve yazım hatasında tam rollback **çalışan veritabanında sınanmadı**. Canlıya geçişten önce bu senaryolar izole test veritabanında koşulmalı; bekleyen migration listesi incelenmeli ve ayrı dağıtım onayı alınmalıdır.

Fiziksel Android ve iOS kabulü, gerçek OS bildirim yeniden planlama ve çoklu hesap canlı RLS denemesi açık. Bu çalışma yayın hazırlığını tamamlanmış saymaz. Önceki [uçtan uca denetim](expo-end-to-end-review-2026-10-11.md) puanları düzeltme öncesine aittir; [güncel denetim](expo-current-audit-2026-10-11.md) kod kalitesini 80/100, yayın hazırlığını 27/100 olarak değerlendirir. (Bu belgedeki önceki 77/100 yazımı hatalıydı ve düzeltildi.)

## Ek uygulama — 12 Ekim 2026

Kod kalitesi denetimindeki sekiz madde kodda ele alındı. 12 Ekim'de 036 ve 037 canlı veritabanına uygulandı (katalog kontrolüyle doğrulandı); uygulama bayrakları hâlâ kapalı.

| Madde | Yapılan | Canlı durum |
|---|---|---|
| Bildirim yeniden planlama | Yeni kayıt kurulamazsa eski kayıt, içerik ve tarih tetikleyicisiyle geri yüklenir; test eklendi | Cihaz kabulü açık |
| Ertelenmiş ödeme idempotency | Migration `037_record_deferred_payment_idempotent.sql` eklendi; istemci `EXPO_PUBLIC_IDEMPOTENT_DEFERRED_ENABLED` (varsayılan `false`) arkasında | Canlıda uygulandı (12 Ekim); bayrak kapalı, eski yol çalışır |
| Ödeme geçmişi 500 sınırı | Sayfalı çekme (`range`, `id` ikincil sıralama); 500+ kayıt testi | İstemci değişikliği |
| Hesap silme 403 tespiti | `FunctionsHttpError` örnek kontrolü; `context` cast'i kaldırıldı | İstemci değişikliği |
| Ödeme `status` tipi | `PaymentRow.status` eklendi | İstemci değişikliği |
| `eslint-disable` yorumları | Altısı da `--report-unused-disable-directives` ile gerekli çıktı; kaldırılmadı | Değişiklik yok |
| 036 atomik yenileme | Yerel izole PostgreSQL 17'de yeniden koşuldu; tüm assertion'lar geçti | Canlıda uygulandı (12 Ekim); bayrak `false` |

Doğrulama: Expo `tsc` ve `expo lint` temiz; Jest 90/90 suite, 559/559 test (önceki 555); `expo-doctor` 21/21. Backend `npm test` 46/46 (037 için bir sözleşme testi eklendi). 036 ve 037 SQL testleri yerel PostgreSQL 17 üzerinde geçti. Expo export bu turda yeniden çalıştırılmadı. Fiziksel cihaz kabulü kapsam dışıdır ve açık kalır.
