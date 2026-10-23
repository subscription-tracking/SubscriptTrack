# Expo mimari iyileştirme planı ve uygulama kaydı

## Plan

1. Kuyruk/cache okumalarını doğrulayan sürümlü depo sınırı kur; eski geçerli dizileri okumayı sürdür, bozuk kuyruğu silmeden hata bildir.
2. PIN doğrulama/upgrade ve deneme yönetimini servis sınırına al; storage hatasında korunan hata ve tekrar deneme ekranı sun.
3. Abonelik oluşturma ve takip yazımlarını tek koordinatörde topla; kısmi başarı ve offline uyarılarını koru.
4. Eşitlemenin depo, ağ, oturum ve seri yürütme sorumluluklarını ayır; FIFO ve oturum değişimi davranışını koru.
5. Atomik yenilemenin RPC/hata adaptörünü ayır; özellik anahtarının mevcut değerini koru.
6. Ödeme mutation'larını hook'a, CSV dosya okumasını adaptöre ve durum önizlemesini domain'e taşı.
7. Mimari testleri TypeScript AST/modül çözümlemesi, pure domain izin listesi ve tüm dosyalarda döngü kontrolüyle genişlet.
8. Davranış testleri, tüm Expo testleri, tip kontrolü, lint ve iki platform JS export'u ile doğrula; mimari dokümanı güncelle.

## Sınırlar

Canlı migration, özellik anahtarı açma ve native yayın bu çalışmaya dahil değildir. Flutter ve mevcut kullanıcı değişiklikleri korunur. Cihaz kanıtı bu refactor ile tamamlanmış sayılmaz.

## Sonuç

Planın kod değişiklikleri uygulandı:

- A1: `createSubscriptionWorkflow` oluşturma, hatırlatma ve ilk ödeme sonuçlarını ayrı döndürür; form veri koordinasyonundan ayrıldı. Oluşturma hatası yayılır, takip yazımı hatası kısmi başarı olarak kalır. Başarılı ilk ödeme cache'i UI tarafından yenilenir.
- A2: `subscriptionLocalStore` depo sınırı, `subscriptionRuntime` ağ/oturum adaptörleri ve bağımsız kurulabilir seri yürütücüyü taşır. Aynı ortak FIFO zinciri korunur; koordinatörün tüm repository bağımlılıkları henüz port arayüzlerine çevrilmedi.
- A3: Sürümlü yerel kayıt decoder'ları eklenmiştir. Alan tipleri, aşama, işlem türü, işlem anahtarı ve kuyruk sahibi doğrulanır. Eski geçerli diziler okunur. Bozuk/verisi okunamayan kuyruk gönderilmez ve üzerine yazılmaz. Native eksik parça kritik okumada hata verir; normal Supabase oturum okuyucusunun null davranışı korunur.
- A4: Atomik yenileme RPC'si ve hata çevirisi `renewalRepository` adaptörüne taşındı; özellik anahtarı değiştirilmedi.
- A5: Mimari denetim AST/proje çözümleyicisi kullanır; aynı katman, provider, core ve shared dosyaları döngü denetimine dahil edildi. Domain saf import izin listesi ve dört mevcut saf sunum modeli istisnası açık tanımlandı; istisna dosyalarının bağımlılıkları da denetlenir.
- A6: PIN doğrulama/upgrade/deneme sayacı `pinUnlockService` içinde seri yürütülür. Kilit kaydı alanları doğrulanır. Oturumlu içerik ilk yükleme ve depo hatasında gösterilmez; tekrar deneme sunulur. Doğru PIN sonrası kalıcı sayaç yazımı reddedilirse içerik açılmaz.
- Ödeme mutation'ları hook'a; CSV dosya seçimi/okuması data adaptörüne ve durum fallback hesabı domain'e alındı. Mimari belgesindeki Zustand ve tek AppError iddiaları mevcut kodla uzlaştırıldı.

| Sorumluluğu azaltılan dosya | Önce → sonra satır |
|---|---:|
| SubscriptionFormScreen.tsx | 243 → 171 |
| subscriptionSync.ts | 240 → 186 |
| PaymentHistoryScreen.tsx | 276 → 225 |
| AppLockProvider.tsx | 131 → 129 |
| CsvImportScreen.tsx | 263 → 247 |

Satır azalması tek başına başarı kanıtı değildir; PIN dosyasında amaç veri işlemini ayırmak ve hata halinde içeriği korumaktır.

## Doğrulama

- Tüm Expo testleri: **94 suite, 580 test geçti**. Yeni davranışlar: eski/sürümlü kuyruk, bozuk/yanlış hesap kuyruğu, okuma hatası, kısmi oluşturma, queued oluşturma, deferred ödeme, PIN depo retry, kalıcı sayaç yazım hatası, eşzamanlı yanlış PIN ve eksik secure-storage parçası.
- Genişletilmiş mimari testleri geçti; kaynak dosyalarında döngü ve boyut sınırı ihlali bulunmadı.
- Android ve iOS JS export'u son uygulama koduyla geçti. Bu sonuç native cihaz kabulü değildir.
- Tip kontrolü geçti. Lint eski import hata önbelleği nedeniyle yeniden önbelleksiz çalıştırıldı; `expo lint --no-cache` son koşuda hata ve uyarı vermeden geçti.
- `git diff --check` geçti. Graphify artımlı güncelleme denemesi çıktı üretmeden exit 1 verdi; grafiğin güncel olduğu iddia edilmez.
- Genel `eslint .` çağrısı Expo'nun normal lint kapsamı dışındaki mevcut smoke/script dosyalarında hatalar verdi. Bu dosyalar değiştirilmedi; Expo src/app kontrolünden ayrı tutuldu.

## Kalan sınırlar

Bu refactor tam Clean Architecture dönüşümü veya tüm god file adaylarının kapandığı anlamına gelmez. Koordinatörlerin bazı concrete repository bağımlılıkları, takvim/bildirim servisinin sorumluluk incelemesi ve native PIN/bildirim/offline kabulü açık kalır. Oluşturma sonrası takip yazımları hâlâ atomik değildir; mevcut kısmi başarı davranışı korunmuştur.

Yeni sürüm eski dizileri okuyabilir; önceki uygulama sürümü yeni sürümlü queue/cache zarfını okuyamaz. Bekleyen kuyruğu olan native cihazlarda sürüm düşürme öncesi veri koruma/göç kabulü gerekir. Bu çalışma imzalı dağıtım yapmamıştır. Genel kalite ve yayın puanları yeniden hesaplanmadı; önceki kapsam ölçümleri bu test koşusunda yeniden üretilmedi.
