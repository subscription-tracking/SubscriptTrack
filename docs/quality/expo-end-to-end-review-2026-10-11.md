# Expo kod denetimi ve puanlama — 11 Ekim 2026

> Bu belgedeki 69/100 kod kalitesi ve 27/100 yayın hazırlığı puanları **düzeltme öncesi** denetime aittir. Güncel **80/100 ve 27/100** değerlendirmesi [yeni raporda](expo-current-audit-2026-10-11.md), yapılan değişiklikler [düzeltme kaydında](expo-code-quality-remediation-2026-10-11.md) yer alır. Migration 036 canlıya uygulanmadı.

## Yöntem ve dürüst kapsam

Bu çalışma önceki 74/100 tahminini kullanmaz. `expo/` altındaki üretilmiş `node_modules`, `.expo`, `dist`, `coverage`, `android`, `ios` dışındaki **350 dosyanın** tamamı envantere alındı: 35 rota, 86 test, 4 script, 8 ikili varlık ve diğer kaynak/yapılandırma dosyaları. **341 metin dosyasının içeriği** statik olarak okundu; 8 ikili varlığın özeti alındı. Yerel `.env` dosyasının içeriği gizlilik nedeniyle okunmadı. Bu sayım, tüm dosyaların elle satır satır davranışsal olarak doğrulandığı iddiası değildir. Her dosyanın amaç, statik çağıran, bağımlılık, girdi/çıktı, hata sinyali ve doğrudan test bağı [dosya matrisinde](expo-end-to-end-inventory.csv); 35 rotanın UI→domain→veri→Supabase statik zinciri ve durum izleri [rota matrisinde](expo-route-flow-matrix.csv) yer alır. Bu alanlar statik çıkarımdır; “iz var” davranışın çalıştığını, “iz yok” davranışın uygulamada bulunmadığını kanıtlamaz. Özellikle çevrimdışı şerit üst layout'ta ortak kullanılır.

Ürün kıstası: [PRODUCT](../product/PRODUCT.md), [DOMAIN](../product/DOMAIN.md), [API](../reference/API.md), [PARITY](../expo/PARITY.md), [NOTIFICATIONS](../architecture/NOTIFICATIONS.md), [SECURITY](../architecture/SECURITY.md). Cihaz ve canlı ortam sonucu için [DEVICE_ACCEPTANCE](../operations/DEVICE_ACCEPTANCE.md) ve [CURRENT_STATUS](../CURRENT_STATUS.md) kullanıldı. Graphify grafiği mevcut, ancak `graphify query` bu oturumda çıkış kodu 1 ve boş yanıt verdi; ilişki çıkarımı doğrudan kaynak dosyalarından yapıldı.

## Yeniden çalıştırılan kontroller

| Kontrol | Bu tur sonucu | Kanıt sınırı |
|---|---|---|
| `npm test -- --runInBand --silent` | 86/86 suite, 527/527 test geçti | Jest mock'ları gerçek OS/Supabase akışı değildir |
| Jest kapsamı, tüm `src/**/*.{ts,tsx}` | Satır %62,08; dal %56,40; fonksiyon %56,33. 199 ölçülen dosyanın 56'sında yürütülen satır yok | Kapsam davranış kalitesini tek başına ölçmez; test dosyaları hariçtir |
| `npm run typecheck` | Geçti | Çalışma zamanı sonucu değildir |
| `npm run lint` | 0 hata, 1 uyarı | `CalendarDayCell.tsx:36` kullanılmayan `dotColor` |
| `npx expo-doctor` | 21/21 geçti | Bağımlılık/yapılandırma denetimi |
| `npx expo export --platform all` | Web, Android ve iOS JS paketleri üretildi | Native paket, imza veya cihaz kabulü değildir |
| Backend `npm test` | 44/44 geçti | Canlı iki hesaplı RLS kanıtı değildir |

Yeni rapordaki 14 göreli bağlantının hedefi mevcut. Depodaki standart `tools/docs/check_docs.py` bu çalışma ağacında **39 hata** verdi: denetim yalnız git tarafından izlenen dosyaları kabul ediyor; mevcut durum belgelerinin bağlandığı `docs/expo/REMAINING_SPRINTS.md`, `docs/quality/expo-migration-audit.md` ve cihaz kanıtları henüz izlenmeyen dosyalar. Bu hatalar yeni rapor bağlantılarından gelmiyor. Kontrol yeşil olarak raporlanmadı.

Kritik ölçülen dosyalarda satır kapsamı: `money.ts` %96,96, `pinRecord.ts` %100, `subscriptionSync.ts` %58,53, `notificationScheduler.ts` %11,53; `authRepository.ts`, `accountRepository.ts` ve `paymentRepository.ts` %0. Sıfır kapsam, bu dosyalara ait canlı smoke kaydını geçersiz kılmaz; Jest davranış kanıtının eksikliğini gösterir.

## Kod kalitesi: **69/100 — C+**

| Alan | Puan | Doğrulanmış güçlü taraf | Kesinti gerekçesi |
|---|---:|---|---|
| İş kuralları | **18/25** | `Money` minör birimle hesaplar; IANA/takvim ve PIN çapraz istemci golden testleri var | `CANCELLED → ACTIVE` belge/kod çelişkisi; CSV geçiş uyarıları ve genel `Money` sınır farkı açık |
| Veri ve işlem güvenilirliği | **15/25** | Hesap bazlı şifreli cache, FIFO/idempotency ve oturum değişiminde kuyruk durdurma kodu/testi var | F1 bildirim güncelleme kusuru; F2 ödeme+tarih atomik değil; gerçek offline cihaz akışı yok |
| Güvenlik ve gizlilik | **15/20** | Publishable Supabase anahtarı, SecureStore, PIN hash ve hesap ayrımı uygulanmış | F3 kayıtlı e-posta ifşası; PIN taşıma ve iki hesaplı RLS cihaz/canlı kanıtı yok |
| Mimari ve bakım | **13/15** | Expo Router, feature katmanları, ortak widget'lar; mimari testi geçti | Bazı belge/kod durumları güncel değil; `SettingsHome` ve uygulama layout'u doğrudan UI testine bağlı değil |
| Testlerin davranış kapsamı | **8/15** | 527 test geçti; domain ve çok sayıda UI akışı sınanıyor | Ölçülen satırların %37,92'si ve dalların %43,60'ı çalıştırılmıyor; kritik SDK/veri modülleri Jest'te %0–11,53 |

Puanlar kanıt düzeyine göre verildi; test sayısı tek başına artı puan üretmedi. Bu puan yalnız kod ve otomatik doğrulamayı değerlendirir, yayın onayı değildir.

## Yayın hazırlığı: **27/100 — D**

| Alan | Puan | Doğrulanmış kanıt | Açık kalan |
|---|---:|---|---|
| Android kabulü | **12/25** | SDK 57 development client ve Expo Go emülatörde temel ekranlara ulaştı; önceki yerel test bildirimi OS'e teslim edildi | Son S16 bundle açılış ekranında kaldı; fiziksel telefon, tam rota ve TalkBack kabulü yok |
| iOS kabulü | **0/25** | iOS JS export geçti | iOS native build ve cihaz/simülatör kabulü kullanıcı kararıyla ertelendi |
| Canlı backend ve çoklu hesap | **8/20** | Tek hesapta yenileme smoke'u ve salt okunur API kontrolleri kaydedilmiş | İki hesaplı RLS, hesap silme kalıntı kontrolü, iki cihaz Realtime ve canlı migration karşılaştırması yok |
| Kritik offline/bildirim/PIN | **5/20** | Domain/Jest testleri ve önceki Android test bildirimi kanıtı var | Ağ kesme/FIFO, zamanlanmış bildirim/erteleme/cold-start, biyometri ve Flutter PIN taşıma cihazda açık |
| İmzalı paket ve CI | **2/10** | Yerel JS export ve workflow YAML kontrolü var | İmzalı Expo release yok; Expo workflow'u uzak varsayılan dalda çalışmamış |

## Öncelikli bulgular

### F1 — Yüksek: Bildirim saati veya içeriği değişince cihazdaki kayıt yenilenmeyebilir

**Konum:** `expo/src/features/notifications/domain/reminderPlanner.ts:61,83,99`; `expo/src/features/notifications/data/notificationScheduler.ts:113-145`; `expo/src/features/notifications/ui/NotificationSync.tsx:89-99`.

**Yeniden üretme:** Gelecek tarihli aktif abonelik için hatırlatma planla. Profil saat dilimini veya bildirim saatini değiştir; alternatif olarak tutarı/adı değiştir. Planlayıcı aynı abonelik/gün/tarih kimliğini üretir. `syncReminders`, kimlik zaten varsa yeni `scheduled`, başlık ve gövdeyi karşılaştırmadan atlar. Böylece eski tetikleme veya metin kalabilir. Kod akışıyla doğrulandı; OS üzerinde yeniden üretim yapılmadı. `notificationScheduler.test.ts` yalnız Expo Go modül yükleme korumasını sınar.

### F2 — Yüksek: “Ödendi ve yenilendi” iki ayrı veritabanı işlemi

**Konum:** `expo/src/features/subscriptions/data/subscriptionMutations.ts:80-107`; [API sözleşmesi](../reference/API.md).

**Yeniden üretme:** Ödeme RPC'si başarılıyken abonelik güncelleme RPC'sine hata döndür. Ödeme geçmişine satır yazılır, yenileme tarihi eski kalır. Bu durum API belgesinde açıkça biliniyor; aynı idempotency anahtarı çift ödemeyi önler ancak iki yazımı atomik yapmaz. Tek hesaplı canlı smoke kısmi hatayı göstermiştir; cihazda kullanıcıya toparlama akışı kabul edilmemiştir.

### F3 — Orta: Kayıt ekranı mevcut e-posta bilgisini açığa çıkarabilir

**Konum:** `expo/src/features/auth/data/authRepository.ts:52-65`.

**Yeniden üretme:** `signUp` yanıtında `data.user.identities=[]` ve hata yokken kod `Bu e-posta zaten kayıtlı.` hatasını üretir. Aynı dosyanın yorumu, bu yanıtın hesap varlığını gizlemek için döndürüldüğünü belirtiyor. Bu, mevcut hesapları deneme yoluyla ayırt ettirebilir. Canlı Supabase yapılandırmasında davranış bu turda denenmedi; kesin etki bu koşula bağlıdır.

### F4 — Orta: Ürün durum geçişi ile istemci kuralı çelişiyor

**Konum:** [DOMAIN.md:70](../product/DOMAIN.md), `expo/src/features/subscriptions/domain/statusTransitions.ts:12`.

**Yeniden üretme:** İptal edilmiş aboneliği etkinleştirmeyi dene. Ürün tablosu `CANCELLED → ACTIVE` derken Expo `canTransition` bunu reddeder; Flutter karşılığı da reddeder. Ürün kararı alınmadan kod kuralı genişletilmemelidir.

### F5 — Orta: Kritik repository ve cihaz akışları otomatik kapsam dışında

**Konum:** `expo/src/features/notifications/data/notificationScheduler.test.ts:13`; yukarıdaki Jest kapsam komutunun çıktısı.

**Yeniden üretme:** Yukarıdaki kapsam komutunu çalıştır. Bildirim zamanlayıcısı %11,53 satır; auth, hesap silme ve ödeme repository dosyaları %0 görünür. UI testleri bu bağımlılıkları mock'ladığı için gerçek Supabase/OS yanıtlarını çalıştırmaz. Bu, çalışan kodun mutlaka hatalı olduğunu değil, otomatik kanıtın sınırlı olduğunu gösterir.

### F6 — Düşük: lint uyarısı ve güncel olmayan Expo Go özeti

`expo/src/features/calendar/ui/CalendarDayCell.tsx:36` kullanılmayan `dotColor` uyarısı veriyor. [Expo README](../expo/README.md) Expo Go açılışını doğrulanmamış derken daha yeni [cihaz kabul kaydı](../operations/DEVICE_ACCEPTANCE.md) onboarding/giriş ekranının açıldığını kaydediyor; gerçek giriş yine denenmemiş.

## Kabul sınırı ve sonraki doğrulamalar

Bu rapor dosya envanterini ve tüm 35 rotanın **statik** akışını tamamlar. Fiziksel Android/iOS, ikinci test hesabı, canlı hesap silme, yerel bildirim zaman değişimi, ağ kesintisi ve imzalı build çalıştırılmadı. Bunlar geçmedi; **kanıt yok** durumundadır. Her dosyanın elle satır satır yürütülmesi ve her dalın dinamik doğrulanması da bu çalışmanın kanıtı değildir. Bu nedenle sonuç “tam yayın kabulü” olarak yorumlanmamalıdır. Bulgular düzeltilmedi; uygulama kodu değiştirilmedi.
