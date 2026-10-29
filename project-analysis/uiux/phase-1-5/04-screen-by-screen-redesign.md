# Ekran bazlı dönüşüm

Bu öneriler [Faz 1 envanterine](../03-screen-inventory.md) ve gerçek Expo kaynaklarına dayanır; ekranların güncel görselleri veya tüm durumları doğrulanmadı. `K` mevcut kod; `H` tasarım hipotezi; `?` görsel/cihaz kanıtı yok. Her satır için ortak kabul: loading/error/empty/offline uygunluğu, iki tema, 48 px hedef, büyük yazı ve TalkBack/VoiceOver; ayrıntılar [kanıt matrisi](07-visual-evidence-and-acceptance.md). “Kaldır” ifadeleri mevcut öğenin gereksizliği kanıtlandı anlamına gelmez; prototipte kaldırma/değerlendirme adayıdır.

## Öncelikli altı akış

### Ana sayfa — [DashboardScreen](../../../expo/src/features/dashboard/ui/DashboardScreen.tsx)

- **Görev:** bu ay ne kaldı ve hangi karar gerekli? K: abonelik/ödeme sorguları, attention, 14 günlük timeline, kategori, boş CTA mevcut. H: tamamlandı metni tutarı bastırıyor; tek kategoride çubuk yararsız olabilir.
- **Koruma:** `Money`, bağımsız para birimi, eksik veri, onaylı ödeme ve `AsyncStateView`. **Kaldırma adayı:** tek kategoride %100 bar; tekrar eden büyük yüzeyler.
- **Kompozisyon:** B yönünde düz zeminde ay/tutar/durum, gecikme veya deneme varsa bağımsız karar satırı, tarih gruplu yaklaşan kayıt, kompakt kayıt özeti + ekleme. Sıfır/tek/çok varyant [03](03-dashboard-redesign-options.md).
- **Ortak:** `AsyncStateView`, `EmptyState`, `ProgressBar`, `BottomNavigation`, `TextLink`. **Yeni aday:** `FinancialSummary`, `DecisionRow`, `CurrencySummary` — sözleşmeleri [05](05-component-and-interaction-strategy.md), mevcut parçaların evrimi olarak değerlendirilmeli.
- **A11y/kabul:** tutar kırpılmadan ve ölçeklendirmede okunur; durum renk dışı metinli; gizli para birimleri fark edilir; bilinmeyen veri sıfır değildir. Mevcut [Dashboard testleri](../../../expo/src/features/dashboard/ui/DashboardScreen.test.tsx) yenileme senaryolarıyla tamamlanmalı.

### Abonelik listesi — [SubscriptionListScreen](../../../expo/src/features/subscriptions/ui/SubscriptionListScreen.tsx)

- **Görev:** kayıt bulmak, eklemek ve güvenle seçmek. K: FlatList, arama, filtre, sekmeler, genel/filtre boşluğu ve çoklu seçim. H: araçlar ile liste arasındaki yoğunluk ve seçim/silme terimi gözden geçirilmeli.
- **Koruma:** sanallaştırılmış liste, boş ve sonuç yok ayrımı, sayımlı sekme ve erişilebilir seçim. **Kaldırma adayı:** aynı görev için yinelenen açıklama veya dekoratif satır kabı; mevcut ekran görüntüsü olmadan spesifik öğe kaldırma kararı yok.
- **Kompozisyon:** başlık + ekle, sabit arama/filtre, okunabilir durum sekmesi, tarihe veya duruma göre satır grubu. Her satır ad, durum, sonraki tarih, doğru para biriminde tutar. Seçim modunda eylem alanı net ve işlemin türü açıklanır.
- **Ortak:** `SearchField`, `ListTabBar`, `EmptyState`, `ActionSheet`, `FlatList`. **Yeni aday:** `SubscriptionIdentityRow` (mevcut `SubscriptionTile` değerlendirilir), seçim araç çubuğu varyantı.
- **A11y/kabul:** arama temizleme, filtre sayısı, seçili durum ve her satırın adı/eylemi duyurulur; 0/1/1000 kayıt ve küçük ekranda ölçülür. Silme semantiği sözleşme kararıdır.

### Detay — [SubscriptionDetailScreen](../../../expo/src/features/subscriptions/ui/SubscriptionDetailScreen.tsx)

- **Görev:** tek aboneliğin durumunu ve sonraki ödeme kararını anlamak. K: `detail/DetailHero`, `PaymentCard`, `DetailSummary`, `DetailHistory` ve ayrı ödeme yükleme/hata akışı. Çalışma ağacındaki kullanıcı değişiklikleri korunmalı.
- **Koruma:** onaylı yenileme, ödeme geçmişinin bağımsız hatası, yaşam döngüsü kısıtları. **Kaldırma adayı:** aynı tutar/tarih bilgisinin birden fazla yüzeyde gereksiz tekrarı; gerçek görsel test gerekir.
- **Kompozisyon:** servis kimliği/ad/durum → tek bir sonraki ödeme ve açık karar → bölümlenmiş ayrıntı satırları → son geçmiş → eylem menüsü. `cancel` rehberi hizmeti otomatik iptal ediyormuş gibi sunulmaz.
- **Ortak:** `GroupedList`, `ActionSheet`, `ScreenTopBar`, `AsyncStateView`. **Yeni aday:** paylaşılan `SubscriptionIdentityRow` ve tek `PaymentDecision` varyantı; önce mevcut bileşenler genişletilir.
- **A11y/kabul:** uzun ad/para tutarı ve büyük font kesilmez; yıkıcı eylem diğerlerinden ayrılır; ödeme geçmişi yüklenmiyorsa yanlış boş liste denmez; Android/iOS ve mevcut 23 Ekim değişiklikleriyle karşılaştırma yapılır.

### Ekleme / düzenleme — [SubscriptionFormScreen](../../../expo/src/features/subscriptions/ui/SubscriptionFormScreen.tsx), [SubscriptionEditScreen](../../../expo/src/features/subscriptions/ui/SubscriptionEditScreen.tsx)

- **Görev:** ad, ücret, para birimi ve tarihleri doğru girip kaydetmek. K: ortak form, kaydetme beklemesi ve düzenleme loading/error. H: alan yoğunluğu ve klavye altında hiyerarşi cihazda incelenmeli.
- **Koruma:** tarih hesapları, minor-unit Money, form doğrulama, değişiklik ve kaydetme davranışları. **Kaldırma adayı:** bilgi tekrarları ve ilk görev için gereksiz açık ileri alanlar; alanları kaldırma ürün kapsamı değiştirmemeli.
- **Kompozisyon:** kimlik → ücret/birim → sıklık ve ilk tarih → isteğe bağlı ayrıntılar → açık maliyet/sonraki tarih özeti → kaydet. İleri alanlar görünür etiketli açılır grupta; hata varsa grup açılır ve hataya odaklanılır.
- **Ortak:** `TextField`, `DateField`, `SegmentedControl`, `KeyboardScreen`, `PrimaryButton`. **Yeni aday:** `MoneyInputRow` ve `FormSection` yalnız mevcut alanlar yetersizse.
- **A11y/kabul:** hata alanla ilişkilendirilir, klavye kaydetmeyi örtmez, küçük/büyük fontta para birimi kesilmez; geçmiş başlangıç ve ay sonu domain davranışı değişmez.

### İstatistikler — [StatsScreen](../../../expo/src/features/stats/ui/StatsScreen.tsx), [PaymentHistoryScreen](../../../expo/src/features/stats/ui/PaymentHistoryScreen.tsx)

- **Görev:** gerçekleşen ödeme ve öngörülen maliyeti ayrı anlamak. K: iki sorgunun yükleme/hatası, boş durumlar ve geçmiş listesi. H: grafik yoğunluğu ve terimlerin gerçek kullanıcı yorumuna etkisi bilinmiyor.
- **Koruma:** farklı para birimleri ve gerçek ödeme olayları. **Kaldırma adayı:** karşılaştırma taşımayan tek kategorili grafik ve tekrarlı toplam kartı.
- **Kompozisyon:** dönem/birim seçimi → açıklamalı ana değer → gerçekleşen ve tahmini ayrı bölümler → kategori sıralı metin; yeterli veri varsa erişilebilir grafik → ödeme geçmişi.
- **Ortak:** `AsyncStateView`, `EmptyState`, `DonutChart`, `ProgressBar`, `FlatList`. **Yeni aday:** `MetricDefinition` ve metin/grafik eşleniği; ham değeri uydurmaz.
- **A11y/kabul:** grafik özeti isim, birim ve payı açıklar; eksik veride oran üretilmez; 0/1/çok ödeme ve çok para birimiyle kıyaslanır.

### Takvim — [CalendarScreen](../../../expo/src/features/calendar/ui/CalendarScreen.tsx)

- **Görev:** hangi tarihte ne olacağını bulmak. K: sorgu loading/error, para birimi filtresi ve ay bileşeni. ? yoğun gün, ekran okuyucu, ay sonu ve cihaz görseli.
- **Koruma:** IANA bölgesi/sivil gün ve gerçek vade. **Kaldırma adayı:** tek başına renkli noktanın olay açıklaması yerine geçmesi.
- **Kompozisyon:** ay başlığı/gezinme → gün ızgarası → seçilen gün için ad/tarih/tutar/durum satırları; olay yoksa kısa açıklama. Gecikme ve trial metinsel ayrım.
- **Ortak:** `ScreenTopBar`, `AsyncStateView`, `SubscriptionIdentityRow` adayı. **Yeni aday:** `AccessibleDayCell` mevcut `CalendarMonth` içinde iyileştirilebilir.
- **A11y/kabul:** her gün tarih, seçili durum ve olay sayısı duyurulur; metin büyüyünce hedefler çakışmaz; iOS/Android ay geçişi ve DST test edilir.

## Diğer tüm ekranlar

Ortak sütunlar: **görev; koru; kaldır/yeniden kur; ortak + yeni aday; özel kabul**. Kaynaklar `expo/` altına göredir. Her satırda görsel sorun H/?; kaynakta bulunmayan bir öğe kaldırılmış varsayılmaz.

| Ekran / kaynak | Görev, koruma ve önerilen kompozisyon | Ortak / yeni aday ve özel kabul |
|---|---|---|
| Onboarding `src/features/onboarding/ui/OnboardingScreen.tsx` | Başlangıç + para birimi; seçim ve hata korunur. H: dekoratif illüstrasyon yoğunluğunu azalt, bir görev/sayfa. | `PrimaryButton`, `EmptyState`; `OnboardingPage` varyantı. Reduce motion, atlama ve büyük yazı. |
| Login `app/(auth)/login.tsx` | Giriş; parola/gizlilik koru. H: başlık → alanlar → giriş → kurtarma/kayıt; tekrarlı ikon kaldırma adayı. | `AuthScaffold`, `TextField`, `PrimaryButton`; yeni şart değil. Klavye/yanlış giriş. |
| Register `app/(auth)/register.tsx` | Hesap oluştur; güvenli hata ve yasal bağlantılar korunur. H: form ve izinleri ayrıştır, süsleri azalt. | `AuthScaffold`, `PasswordField`; yeni şart değil. Linkler ve hata odak sırası. |
| Forgot `app/(auth)/forgot-password.tsx` | E-posta ile kurtarma; sonuç ve girişe dönüş koru. H: tek alan → sonuç; gereksiz kartları değerlendirme. | `AuthScaffold`, `PrimaryButton`; `ResultNotice` adayı. E-posta bulunurluğu ifşa edilmez. |
| Reset `app/(auth)/reset-password.tsx` | Yeni parola; doğrulama koru. H: talimat → alan → kaydet. | `PasswordField`; `ResultNotice` adayı. Geçersiz bağlantı/klavye. |
| Auth callback `app/auth-callback.tsx` | Bağlantıdan güvenli yönlendirme; yükleme/hata koru. H: tek durum ve sonraki eylem. | `AsyncStateView`; yeni şart değil. Cold-start ve başarısız link. |
| İptal `src/features/subscriptions/ui/SubscriptionCancelScreen.tsx` | Hizmet rehberi ve kayıt durumu; onay koru. H: servis bağlantısı → kullanıcı kararı → durum; tekrarı azalt. | `ScreenTopBar`, `PrimaryButton`; `DecisionRow` adayı. Otomatik iptal vaadi yok. |
| Arşiv `SubscriptionArchivedScreen.tsx` | Kayıtları bul/geri getir; FlatList ve yanlış kayıt silme sınırını koru. H: satır + durum, yıkıcı eylemi ayır. | `FlatList`, `ActionSheet`; identity row adayı. Sıfır/çok, yanlışlıkla silme. |
| CSV `CsvImportScreen.tsx`, `CsvImportPreview.tsx` | Dosya seç, doğrula, içe aktar; online/busy koru. H: üç adım + hata özeti; gereksiz tekrarları azalt. | `PrimaryButton`, `ScreenTopBar`; `ImportResultSummary` adayı. Büyük dosya, kısmi hata. |
| Bildirim merkezi `src/features/notifications/ui/NotificationCenterScreen.tsx` | Durumu ve yapılacak eylemi gör; filtre/izin/onay koru. H: zaman grubu + okunmamış ayrımı; tekrar eden büyük kartları değerlendir. | `AsyncStateView`, `SegmentedControl`; `NotificationRow` varyantı. İzin, offline, çok bildirim. |
| Bildirim ayarları `NotificationPreferencesScreen.tsx` | Yerel bildirim zamanını seç; platform seçicisi koru. H: izin → gün → saat → test. | `ScreenTopBar`, seçim kontrolleri; izin bandı mevcut. Android/iOS izin reddi. |
| Ödeme geçmişi `src/features/stats/ui/PaymentHistoryScreen.tsx` | Ödeme kaydını bul/düzelt; FlatList ve eylem etiketlerini koru. H: ay grubu, tutar, düzenle/sil ayrı. | `FlatList`, `ActionSheet`; `PaymentEventRow` adayı. Silme onayı ve 0/çok. |
| Tasarruf `src/features/savings/ui/SavingsScreen.tsx` | Tahmini tasarrufu değerlendir; hesaplama ve loading koru. H: açıklamalı tahmin → fırsat satırı; sahte başarı görselini kaldırma adayı. | `AsyncStateView`, `EmptyState`; `EstimateLabel` adayı. Tahmin/gerçek ayrımı. |
| Ayarlar `src/features/settings/ui/SettingsHome.tsx` | Tercihleri bul; rota bağlantıları koru. H: hesap → uygulama → veri/destek grupları; aynı işi tekrarlayan satırları gözden geçir. | `SettingsTile`, `GroupedList`; yeni şart değil. Ekran okuyucu ve bulunabilirlik. |
| Profil `ProfileScreen.tsx` | Ad/parola değiştir; doğrulama koru. H: iki bağımsız form grubu; yıkıcı olmayan açık kaydetme. | `TextField`, `PrimaryButton`; `FormSection` adayı. Klavye ve ayrı hata. |
| Görünüm/bölge `AppearanceScreen.tsx` | Tema, para birimi ve IANA bölgesi seç; radio durumu koru. H: üç açık bölüm, mevcut seçim özeti; fazla görsel paneli azalt. | Radio/`GroupedList`; `PreferenceGroup` adayı. Büyük yazı ve iki tema. |
| Ödeme yöntemleri `PaymentMethodsScreen.tsx` | Etiket yönet; ekle/düzenle/sil koru. H: basit satır listesi + tek ekle. | `ActionSheet`, `PrimaryButton`; identity row kullanılabilir. Banka bağlantısı iması yok. |
| Uygulama kilidi `AppLockSettingsScreen.tsx` | PIN/biyometri ayarla; güvenlik mantığı koru. H: durum → PIN → biyometri; dekoratif öğe azalt. | `TextField`, `PrimaryButton`; `SecurityStatus` adayı. İptal, hata, gizli içerik. |
| Kilit `LockScreen.tsx` | Güvenli açılma; deneme/kilit/çıkış koru. H: sade PIN alanı ve açık hata. | Mevcut PIN kontrolü; yeni şart değil. Ekran okuyucu, lockout, biyometri. |
| Gizlilik `PrivacyCenterScreen.tsx` | Yasal belge, export, hesap silmeyi bul; ayrım koru. H: sıradan veri eylemleri ve yıkıcı hesabı ayrı gruplar. | `GroupedList`, `TextLink`; yeni şart değil. Geri alınamazlık okunur. |
| Export `ExportScreen.tsx` | Veriyi dışa aktar; loading/başarısızlık koru. H: kapsam → biçim → paylaşım; tekrar açıklamayı azalt. | `AsyncStateView`, `PrimaryButton`; `ResultNotice` adayı. Offline ve paylaşım iptali. |
| Hesap silme `DeleteAccountScreen.tsx` | Hesabı sil; kimlik doğrulama/onay koru. H: sonuç → doğrulama → yıkıcı eylem; görsel teşvik azalt. | `TextField`, danger button; `DestructiveConfirmation` adayı. Geri dönüş ve ağ hatası. |
| Geri bildirim `FeedbackScreen.tsx` | Destek isteği gönder; tür ve mesaj koru. H: kategori → mesaj → gönder, paylaşımı ikincil ayır. | `SelectField`, `TextField`; `ResultNotice` adayı. Başarı/hata/klavye. |
| Yasal `app/legal/privacy.tsx`, `terms.tsx` | Metni oku; içerik ve bağlantılar koru. H: okunabilir satır boyu, başlıklar; gereksiz yüzeyleri azalt. | `LegalDocumentView`, `ScreenTopBar`; yeni şart değil. Büyük font ve bağlantı odağı. |

`app/_layout.tsx`, grup `_layout.tsx` dosyaları ekran değil, kabuk ve yönlendirme sınırıdır; ortak başlık, offline şeridi ve kilit yönetimi bunlarda ayrıca doğrulanır.
