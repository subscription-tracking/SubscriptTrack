# Expo — 59 test senaryosu kod incelemesi (13 Ekim 2026)

Kaynak: `Abonelik_Takip_Test_Senaryolari(2).xlsx`. Kapsam: yalnızca `expo/` (ana uygulama) ve onun çağırdığı `backend/` sözleşmesi. Flutter incelenmedi.

## Yöntem ve sınırlar

- Altı paralel inceleme: form/düzenleme, veri-offline-silme, bildirim-saat, liste-ekranlar, güvenlik-ayarlar-tema, backend sözleşmesi. Bulgular kod okumasından çıkarıldı.
- Doğrudan doğrulananlar: `jest` 115 suite / 695 test geçti, `tsc --noEmit` temiz; `is_archived` yalnız 038'de, `website` hiçbir migration'da yok, `process-export` `deleted_at` kullanıyor; canlıda yalnız 033/036/037 migration'ı var; istemci bayrakları (`.env.example`) kapalı.
- Çalıştırma yok: cihaz, emülatör, canlı kullanıcı akışı denenmedi. Alt incelemelerdeki bulguların çoğu tek tek ikinci kez doğrulanmadı.
- Okunmayanlar: test dosyalarının çoğu, bazı grafik/stil dosyaları, Node `backend/src`, canlı DB'nin içi (cron, yayın, politika).
- Çalışma ağacında 420 commit edilmemiş dosya var; son commit 10 Ekim.

## Özet

| Grup | Adet | Senaryolar |
|---|---|---|
| Tamamlandı | 33 | 1–6, 8–15, 17, 19, 23, 24, 26, 27, 29–32, 38, 39, 42–46, 51, 57 |
| Kısmen | 20 | 7, 16, 22, 25, 28, 33–37, 47–50, 52–54, 56, 58, 59 |
| Eksik | 6 | 18, 20, 21, 40, 41, 55 |

"Tamamlandı" = kod senaryoyu karşılıyor; cihaz kabulü hâlâ gerekli. "Eksik" = kod yok ya da bayrak/migration yüzünden bugün çalışmıyor.

## Senaryo kararları

| # | Karar | Sebep / kanıt |
|---|---|---|
| 1–4, 8–15 | Tamamlandı | `subscriptionForm.ts`, `formSchedule.ts`, `money.ts`; `-50`/`abc`/`12$%` reddi, periyot/para birimi/kategori, çift dokunma koruması ve sabit idempotency anahtarı |
| 5, 6 | Tamamlandı | Geçmiş başlangıçta bugünden sonraki ilk döngü; gelecekte başlangıç = ilk vade; "Henüz başlamadı" etiketi |
| 7 | Kısmen | Aynı isim sessizce kaydediliyor; ne uyarı ne kural var |
| 11 | Tamamlandı | 2.000 karakter kayıtta engelleniyor (DB'de de var); alanda `maxLength` yok |
| 16 | Kısmen | Düzenlemede doğrulama hatası kapalı "Ayrıntılar" bölümündeyse kullanıcı görmüyor, kayıt sessizce olmuyor |
| 17 | Tamamlandı | Kaydetmeden çıkınca veri değişmiyor (uyarı penceresi yok) |
| 19 | Tamamlandı | Onay penceresinde vazgeç yazım yapmıyor |
| 22 | Kısmen | Normalize doğru ama yıllık = yuvarlanmış aylık ×12 (100,00 yıllık → 99,96); yıllık çip yalnız ilk para birimi |
| 23, 24, 26, 27, 29 | Tamamlandı | Boş durum, tarih sıralaması, arama, kategori filtresi, sonuç yok mesajı |
| 25 | Kısmen | İptal/duraklatma ayrışıyor; `expired` için çip ve "Süresi doldu" etiketi yok |
| 28 | Kısmen | Fiyat sıralaması yalnız para birimi seçilince; yoksa tarihe düşüyor |
| 30, 31, 32 | Tamamlandı | Ad/tutar/tarih içerikli bildirim; saat kullanıcı seçimi; 0/1/3/7 çoklu kural |
| 33 | Kısmen | Teslim saati geçmişse aday atılıyor, yedek bildirim yok |
| 34 | Kısmen | "Gecikmiş vade" UI'da var; gecikmiş kayıt için bildirim yok |
| 35 | Kısmen | Dokunma ve cold-start var; silinmiş kayıt/oturumsuz/kilitli uçtan uca doğrulanmadı |
| 36 | Kısmen | Kategori/aksiyon var, 30 dk sabit; cihazda doğrulanmadı |
| 37 | Kısmen | Reddedince snackbar var; ayarlara yönlendirme ve kalıcı uyarı yok; izin sonradan kapanırsa sessiz |
| 38, 39 | Tamamlandı | Yerel planlı DATE tetikleyici; kimlik abonelik+gün+tarih içeriyor |
| 18, 20, 21, 40 | Eksik | `SOFT_DELETION_ENABLED` kapalı ve 038 canlıda yok; silme "sunucu güncellemesini bekliyor" hatası veriyor |
| 41 | Eksik | `TIMEZONE_MODE_ENABLED` kapalı, 039 canlıda yok; saat dilimi profile sabit |
| 42, 43, 44, 46 | Tamamlandı | Ay sonu kırpma + fatura gününü koruma, artık yıl, yıl geçişi; tarih seçici geçersiz biçim üretmiyor |
| 45 | Tamamlandı | Gecikmiş vade korunuyor, sonraki dönem ayrı hesaplanıyor, yenileme onaylı; 34/45 yorumu ürün onayı bekliyor |
| 47, 48, 52 | Kısmen | Kuyruk ve cache kalıcı ama parçalı yazım atomik değil; yarım yazma listeyi açılmaz kılabilir |
| 49 | Kısmen | Tema altyapısı tam (hex yalnız design katmanında); seçili tema işaretsiz, açık temada koyu splash/ilk kare |
| 50 | Kısmen | Takvim sabit yükseklik ve kaydırmasız; hero tutarı büyük sayıda taşabilir; döndürmede pager ofseti |
| 51 | Tamamlandı | `decimal-pad` |
| 53 | Kısmen | Yerel planlı, exact alarm izni için çalışma anı kontrolü ve yönlendirme yok; reboot cihazda denenmedi |
| 54 | Kısmen | Kanal bağlı; yayın 030 canlıda doğrulanmadı, DELETE olayı için REPLICA IDENTITY yok, yeniden bağlanma kodu yok |
| 55 | Eksik | Cache/kuyruk yalnız sürüm 1–2 okuyor; bilinmeyen sürümde fırlatıyor, göç/onarım yolu yok |
| 56 | Kısmen | Liste `FlatList` ama memo/getItemLayout yok; SecureStore yazımı 500 satırda ~190, 1.000'de ~370 sıralı çağrı; hiç ölçülmedi |
| 57 | Tamamlandı | 60 sınırı (iOS 64 altında); deneme bildirimleri aynı havuzu yiyor |
| 58 | Kısmen | Cache SecureStore'da, `console.*` yok; çıkış/hesap silmede yerel veri silinmiyor, CSV cache'te kalıyor, idempotency tablosu içerik tutuyor |
| 59 | Kısmen | PIN/biyometri/bekleme/saat geri alma sağlam; açık `Modal` kilit ekranının üstünde kalıyor, içerik monte, kilitte çıkış yolu yok |

## Önceliklendirilmiş bulgular

**Yüksek**
1. **Parçalı SecureStore yazımı atomik değil** (`core/storage/secureSessionStorage.ts`). Eski parçalar silinip yenisi yazılırken kill/hata olursa başlık kalır, parça yok; `loadQueue` fırlatır ve liste açılmaz. Okuma/yazma serial dışında yarışabilir. 
2. **Geçici hatalar çevrimdışı düzenlemeyi siliyor** (`subscriptionWriteRepository.ts:31`). Yalnız kodsuz ve `42501` yeniden denenir; `57014/40001/40P01/PGRST000` kalıcı red sayılıp kuyruktan atılır. Silme deposu bu kodları doğru sınıflıyor.
3. **Açık `Modal` kilit ekranını aşıyor** (`SubscriptionFilterSheet`, `SelectField`, `PaymentDialogs`, `DetailHero`, `DetailHistory`, `CsvExampleDialog`, `PaymentMethodDialog`); kilitliyken çocuk ağaç monte (TalkBack okuyabilir).
4. **Şema repodan kurulamıyor.** `subscriptions.is_archived` yalnız 038'de, `website` hiçbir migration'da; istemci seçimi (`subscriptionRepository.ts`) sıfır kurulumda 42703 verir. Canlı şema 002 zincirinden geliyor olabilir; doğrulanmadı.
5. **`process-export` deploy sırası.** Commit edilmemiş değişiklik `deleted_at` filtreliyor; 038'den önce deploy edilirse dışa aktarma tamamen kırılır.

**Orta**
6. Silme ve saat dilimi modu: bayraklar kapalı + 038/039 canlıda yok → senaryo 18/20/21/40/41.
7. Kota: 034 sınırı 500 (canlıda belirsiz), 1.000 yalnız 038'de; canlıda büyük olasılıkla kota yok; liste sayfalamasız (PostgREST 1.000 satırda keser); tombstone birikimi kotayı dolaştırır.
8. Düzenleme: gizli doğrulama hatası (R1); aktif aboneliğe deneme eklenince/kaldırılınca durum güncellenmiyor (R3).
9. Çıkış/hesap silmede `subscriptions.cache.*` ve kuyruk silinmiyor; PIN/biyometri kayıtları kullanıcıya bağlı değil (sabit anahtar); kilit ekranında "PIN'imi unuttum/çıkış" yok; PIN kurulumunda tekrar alanı yok.
10. Bildirim: izin sonradan kapanırsa uyarı yok; `defaultDays` kural dolu kayıtlarda etkisiz; sunucu cron'u UTC günü kullanıyor, saat/kural/`push_enabled` yok sayıyor, `trial_*` üretmiyor; silinen kimlik listesi sınırsız büyüyor ve kullanıcıdan bağımsız.
11. Eski (bayrak kapalı, şu an canlı) yenileme yolu iki ayrı yazım: yeniden denemede `paid_at` hash'i değiştiği için 23505 ya da ikinci PAID kaydı riski. Ertelenmiş ödeme bayrak kapalıyken anahtarsız insert.
12. Çok cihazda son yazan kazanır: güncelleme RPC'si tüm alanları önbellekten yazıyor, sürüm kontrolü yok.
13. Zaman aşımı yok (create/update); askıdaki istek serial'i tıkar. CSV içe aktarma satır başına tam liste çekip cache yazıyor (O(n²)).
14. Stats: aktif para birimi dışında kayıtlar varsa ekran `return null` ile boş; dashboard kategori toplamı para birimlerini karıştırıyor; `dueSoon` para birimine göre süzülmüyor.
15. Deneme kaydı "gecikmiş" görünür ama "yenilendi" düğmesi yok; sunucu da `trial` yenilemesini reddediyor (036/039).
16. `parseStartParam` geçersiz tarihi kabul ediyor (deep link); `confirm_..._in_timezone_idempotent` ile atomik yenileme bayrakları karıştırılırsa idempotency hash çakışır.

**Düşük**
17. Takvim yalnız `nextRenewalDate` gösteriyor (sonraki aylarda tekrar yok). Tema seçimi "Para birimi ve saat dilimi" başlığı altında. Dışa aktarma butonlarında `busy` yok; CSV `cache`te ve panoda kalıyor. `percentShares`, savings `limit(100)` ve `ItemSeparatorComponent` satır içi gibi küçük konular.

## Kapanış için önerilen sıra

1. Kuyruk/cache yazımını atomikleştir (yeni anahtara yaz, sonra işaretçiyi çevir) ve geçici hata sınıflamasını düzelt (1, 2).
2. Modal'ları kilit durumunda kapat ya da kilidi `Modal` içinde de çiz; çocuk ağacı kilitliyken bağlama (3).
3. Migration zincirini canlı şemayla eşitle (`is_archived`, `website`); 034/038 kota sırasını netleştir; sonra 038 → `process-export` → 039, ardından bayrakları aç (4–7).
4. Düzenleme formundaki gizli hata ve deneme-durum güncellemesini düzelt (8).
5. Çıkış/hesap silmede yerel veri temizliği, kullanıcıya özel PIN anahtarı, bildirim izin uyarısı (9, 10).
6. Fiziksel Android turu ve 56 için ölçüm; sonra iOS.

## Güncelleme — kod kapatmaları (13 Ekim 2026, aynı gün)

Plan 1. grubu (cihaz gerektirmeyen işler) uygulandı. Kanıt: `npx jest` tüm suite'ler yeşil, `tsc --noEmit` temiz, lint hatasız (yalnız bir `require()` uyarısı). Bunlar kod ve otomatik test düzeyindedir; cihaz kabulü, canlı migration ve bayraklar açık.

| Grup | Adet | Senaryolar |
|---|---|---|
| Tamamlandı (kod+test) | 43 | önceki 33 + 7, 16, 22, 25, 28, 33, 34, 37, 49, 55 |
| Kısmen (cihaz/ölçüm bekliyor) | 11 | 35, 36, 47, 48, 50, 52, 53, 54, 56, 58, 59 |
| Eksik (canlı 038/039 + bayrak) | 5 | 18, 20, 21, 40, 41 |

Kısmen kalanların sebebi: 35/36/53 bildirim teslimi, dokunma, erteleme ve yeniden başlatma cihazda denenmedi; 47/48/52 force-kill ve uçak modu emülatör turu bekliyor; 50 ekran boyutu/yazı boyutu görsel kanıtı; 54 çok cihaz Realtime (yayın 030 canlıda doğrulanmadı); 56 ölçüm yok; 58/59 cihazda dosya, yedek, biyometri ve Modal denemesi.

Uygulanan değişikliklerin özeti: atomik SecureStore yazımı (nesilli parça + son başlık), kuyruk karantinası ve kullanıcı bildirimi, geçici hata sınıflaması ve 20 sn zaman aşımı, `LockAwareModal` ve erişilebilirlik gizleme, kilit ekranında çıkış, PIN tekrar alanı, kullanıcıya bağlı PIN anahtarları ve `sessionCleanup`, CSV dosyasını silme, Ayrıntılar bölümünü otomatik açma, deneme↔aktif durum türetme, aynı isim uyarısı, tam sayı yıllık eşdeğer, para birimi gruplu fiyat sıralaması, expired çipi, bugün/gecikmiş yedek bildirim ve kalıcı izin uyarısı.

Bilinen açık noktalar: yedek bildirim planlandıktan sonra iptal edilmez (60 sn pencere); gecikmiş bildirim geceye denk gelebilir; dashboard kategori halkası yalnız ilk para birimini gösterir; splash açık varyantı cihazda doğrulanmadı; `OutlinedButton` `disabled` almıyor; planlı bildirim temizliği çıkışta `NotificationSync` hesap değişimine dayanıyor.

## Emülatör turu (13 Ekim 2026)

Ortam: `SubscriptTrack_Expo_Test` (Android 36, x86_64 AVD), SDK 57 development client + Metro (`adb reverse`), mevcut test hesabı oturumu. Fiziksel cihaz ve iOS değil; gerçek zamanlı bekleme gerektiren, biyometri donanımı gerektiren ve performans eşiği ölçen senaryolar dışarıda bırakıldı. Test sırasında yalnız `ZZ-Test-Offline` adlı bir kayıt eklendi ve arşivden kalıcı silindi; mevcut kayıtlara dokunulmadı.

| # | Sonuç | Kanıt |
|---|---|---|
| 33, 34 | Geçti | Bugün vadeli Netflix için "Bugün yenileniyor", gecikmiş üç kayıt için "Vadesi geçti" bildirimi 60 sn içinde teslim edildi |
| 35 | Geçti | Yeni kaydın bildirimine dokununca ilgili abonelik detayı açıldı. Gruplanmış özet satırına dokunmak detaya gitmez, yalnız uygulamayı açar |
| 36 | Kısmen | "30 dk ertele" eylemi var, ertelenen bildirim +30 dk için alarm olarak kuruldu ve uygulama öne geldi. Teslimi beklenmedi; orijinal bildirim gölgede kalıyor |
| 37 | Geçti | İzin kapalıyken uyarı bandı çıktı, "Ayarları aç" sistem ayarlarını açtı, izin verilince band kayboldu |
| 38 | Geçti | Uygulama arka plandayken test ve yedek bildirimleri teslim edildi |
| 47, 48, 52 | Geçti | Uçak modunda eklenen kayıt "1 değişiklik bağlantı gelince gönderilecek" olarak sıraya girdi, `force-stop` sonrası korundu, bağlantı gelince eşitlendi |
| 49 | Geçti | Sistem teması gündüz/gece değişimini izliyor; açık, koyu ve sistem seçenekleri çalışıyor; seçili temada işaret var |
| 50 | Geçti | Yazı boyutu 1,5 ve 720×1280 ekranda dashboard ve takvimde taşma yok |
| 53 | Geçti | `adb reboot` sonrası iki planlı alarm uygulama açılmadan geri geldi (BOOT_COMPLETED) |
| 59 | Kısmen | PIN kurulumu (tekrar alanı), yanlış PIN mesajı ("Kalan deneme"), arka plana gidince kilit, kilitte açık `Modal`ın kapanması, "Çıkış yap" ve ekran görüntüsü engeli doğrulandı. Biyometri emülatörde yok |
| 18 | Beklendiği gibi engelli | "Aboneliği sil" → "Silme özelliği sunucu güncellemesini bekliyor." |
| 28 | Geçti (arayüz) | Filtre sheet'inde para birimi seçilmeden fiyat sıralaması seçenekleri görünüyor |
| 34/45 | Gösterim doğru | Gecikmiş kayıtta "Gecikmiş vade" ve "Sonraki döngü (tahmini)" ayrı gösteriliyor |

Denenmeyenler: 54 (iki cihaz), 56 (performans ölçümü), biyometri, ertelenen bildirimin teslimi, 20/21/40/41 (038/039 canlıda yok).

### Turda bulunan ve düzeltilen hatalar
1. **Açılışta çökme:** `expo/app/(app)/(tabs)/_layout.tsx` içinde `tabBar={AppTabBar}` bileşeni düz fonksiyon olarak çağırıyordu; içindeki `useThemeRevision()` "Invalid hook call" ile uygulamayı çökertiyordu. `tabBar={(props) => <AppTabBar {...props} />}` yapıldı. (Bu hata commit edilmemiş önceki çalışmadan geliyordu.)
2. **Filtre sheet'i kırmızı ekran:** `themedStyles` proxy'si Hermes'te `for…in` ile "trap result is configurable but target property is non-configurable" veriyordu (`[textButtonText, …]` dizisi). Proxy hedefi her çağrıda güncel stille eşlenecek biçimde düzeltildi; Jest'e `themedStyles.enumerate.test.ts` eklendi. Aynı kalıbı kullanan diğer ekranlar (`PaymentDialogs`, `EmptyDayState`, `CsvImport*`, `OnboardingScreen`) de bu hatadan etkileniyordu.
3. **Sistem teması takip etmiyordu:** Üretilmiş `expo/android` klasöründe `expo_system_ui_user_interface_style=dark` kalmıştı (`app.json` `automatic`). `android/` git'te yok; yerelde düzeltildi. Temiz `expo prebuild` / EAS derlemesi doğru değeri üretir.

### Açık gözlemler
- Android'de `SCHEDULE_EXACT_ALARM` varsayılan olarak verilmiyor; hatırlatmalar tam saatte değil esnek pencerede (yaklaşık bir dakika) teslim edilir. Uygulamada izin isteme/yönlendirme yok.
- Ertele eylemi sonrası orijinal bildirim gölgeden kalkmıyor.
- "Hemen" kilit ayarında uygulama her `inactive` olduğunda (ör. deep link, izin penceresi, paylaşım) yeniden kilitleniyor.
- PIN doğrulaması (PBKDF2, 30k tur) emülatörde 30–40 sn sürdü; fiziksel cihazda süre ölçülmeli.
- Üç gecikmiş kayıt tek seferde üç bildirim üretiyor.
