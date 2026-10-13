# Parite Listesi — Flutter → Expo

> Bu belge, Flutter sürümündeki her ekran, akış ve kuralın Expo sürümündeki karşılığını izler. "Bitti" tanımı buradan çıkar: bir satır ancak Expo'da uygulandığında, test edildiğinde ve [DEVICE_ACCEPTANCE.md](../operations/DEVICE_ACCEPTANCE.md) senaryosunda iOS ve Android'de doğrulandığında **Tamam** olur.

## Durum etiketleri

| Etiket | Anlam |
|---|---|
| **Planlı** | Expo'da henüz başlanmadı |
| **Devam ediyor** | Kodu yazılıyor |
| **Kod tamam** | Expo'da yazıldı, testleri geçiyor, cihaz doğrulaması yok |
| **Tamam** | Kod, test ve cihaz doğrulaması tamam |
| **Karar bekliyor** | Flutter ile ürün kuralı çelişiyor, sahibinden karar gerekiyor |

Flutter tarafındaki özellik durumu ([CURRENT_STATUS.md](../CURRENT_STATUS.md)) bu tabloya kopyalanmaz. Expo satırı, Flutter'da "Kısmi" olan bir özelliği de **Kısmi** olarak taşır; Expo'da yeniden yazmak doğrulamayı otomatik olarak tamamlamaz.

Aşama numaraları [ROADMAP.md](ROADMAP.md) ile eşleşir.

## 1. Ekranlar

Flutter dosyaları `mobile/lib/` altındadır. Rotalar [app_routes.dart](../../mobile/lib/core/navigation/app_routes.dart) dosyasından alınır. Expo rotası, önerilen Expo Router yoludur ve Aşama 0'da kesinleşir.

### 1.1 Başlangıç ve kimlik doğrulama

| Ekran | Flutter dosyası | Flutter rotası | Önerilen Expo rotası | Aşama | Durum |
|---|---|---|---|---|---|
| Splash / oturum kontrolü | `app/splash_screen.dart` | `/splash` | `app/index.tsx` (oturum yönlendirmesi) | 1 | Kod tamam |
| Giriş | `features/auth/presentation/screens/login_screen.dart` | `/login` | `app/(auth)/login.tsx` | 1 | Kod tamam |
| Kayıt | `features/auth/presentation/screens/register_screen.dart` | `/register` | `app/(auth)/register.tsx` | 1 | Kod tamam |
| Şifremi unuttum | `features/auth/presentation/screens/forgot_password_screen.dart` | `/forgot-password` | `app/(auth)/forgot-password.tsx` | 1 | Kod tamam |
| Şifre sıfırlama | `features/auth/presentation/screens/reset_password_screen.dart` | `/reset-password` | `app/(auth)/reset-password.tsx` | 1 | Kod tamam |

Not: E-posta doğrulama, Google ve Apple girişi Flutter'da **Kısmi**dir ([CURRENT_STATUS.md](../CURRENT_STATUS.md)). Expo'da da aynı kapsamla başlanır.

### 1.2 Onboarding ve yasal sayfalar

| Ekran | Flutter dosyası | Flutter rotası | Önerilen Expo rotası | Aşama | Durum |
|---|---|---|---|---|---|
| Onboarding (3 sayfa, Flutter ile aynı) | `features/onboarding/presentation/screens/onboarding_screen.dart` | `/onboarding` | `app/(auth)/onboarding.tsx` | 6 | Kod tamam (tamamlama bayrağı cihaz başına; oturum öncesi kapı) |
| Gizlilik politikası | `features/settings/presentation/screens/privacy_policy_screen.dart` | `/legal/privacy` | `app/legal/privacy.tsx` | 6 | Kod tamam (Flutter metni taslak; yayın öncesi onay gerekir) |
| Kullanım koşulları | `features/settings/presentation/screens/terms_of_service_screen.dart` | `/legal/terms` | `app/legal/terms.tsx` | 6 | Kod tamam (Flutter metni taslak; yayın öncesi onay gerekir) |

Onboarding'de bildirim izni ilk saniyede istenmez; önce açıklayıcı ekran gösterilir ([USER_FLOWS.md §2, §13](../product/USER_FLOWS.md)).

### 1.3 Ana sekmeler

| Ekran | Flutter dosyası | Flutter rotası | Önerilen Expo rotası | Aşama | Durum |
|---|---|---|---|---|---|
| Ana sayfa (dashboard) | `features/dashboard/presentation/screens/dashboard_screen.dart` | `/home` | `app/(app)/(tabs)/index.tsx` | 4 | Kod var (kategori donut ve aylık değişim var; “Takvimde gör”/“Takvimi aç” rotası `DashboardScreen.test.tsx` ile doğrulandı; canlı, cihaz ve görsel kabul açık) |
| Abonelik listesi | `features/subscriptions/presentation/screens/subscription_list_screen.dart` | sekme | `app/(tabs)/subscriptions/index.tsx` | 2 | Kod tamam |
| Takvim | `features/calendar/presentation/screens/calendar_screen.dart` | `/calendar` | `app/(tabs)/calendar.tsx` | 4 | Kod tamam (yüksek tutarlı yıllık ayrımı eşik kararına bağlı) |
| İstatistikler | `features/stats/presentation/screens/stats_screen.dart` | `/stats` | `app/(tabs)/stats.tsx` | 4 | Kod tamam |
| Ayarlar | `features/settings/presentation/screens/settings_screen.dart` | sekme | `app/(tabs)/settings/index.tsx` | 6 | Kod tamam |

### 1.4 Abonelik ekranları

| Ekran | Flutter dosyası | Flutter rotası | Önerilen Expo rotası | Aşama | Durum |
|---|---|---|---|---|---|
| Abonelik ekleme | `features/subscriptions/presentation/screens/add_subscription_screen.dart` | `/subscriptions/add` | `app/subscriptions/add.tsx` | 2 | Kod tamam |
| Abonelik detayı | `features/subscriptions/presentation/screens/subscription_detail_screen.dart` | `/subscriptions/:id` | `app/subscriptions/[id]/index.tsx` | 2 | Kod tamam |
| Abonelik düzenleme | `features/subscriptions/presentation/screens/edit_subscription_screen.dart` | `/subscriptions/:id/edit` | `app/subscriptions/[id]/edit.tsx` | 2 | Kod tamam |
| Arşivlenmiş abonelikler | `features/subscriptions/presentation/screens/archived_subscriptions_screen.dart` | `/subscriptions/archived` | `app/subscriptions/archived.tsx` | 2 | Kod tamam |
| CSV içe aktarma | `features/subscriptions/presentation/screens/csv_import_screen.dart` | `/subscriptions/import` | `app/(app)/subscriptions/import.tsx` | 6 | Kod var (çevrimiçi; satır bazlı hata; tırnaklı çok satırlı CSV kaydı; uygulanamayan durum geçişi önizleme/sonuç uyarısı; ekran/cihaz kabulü açık) |

### 1.5 Bildirimler, istatistik ve tasarruf

| Ekran | Flutter dosyası | Flutter rotası | Önerilen Expo rotası | Aşama | Durum |
|---|---|---|---|---|---|
| Bildirim merkezi | `features/notifications/presentation/screens/notification_center_screen.dart` | `/notifications` | `app/(app)/notifications.tsx` | 5 | Kod var (yerel okunma ve en iyi çabayla `read_at` yazımı; satır adı okundu durumu/tarih/tür duyurur, kapatma ekran okuyucu eylemi var, tarih profil IANA bölgesinde biçimlenir; `NotificationRow.test.tsx`; canlı/cihaz doğrulaması yok) |
| Ödeme geçmişi | `features/stats/presentation/screens/payment_history_screen.dart` | `/stats/payments` | `app/stats/payments.tsx` | 4 | Kod tamam |
| Tasarruf | `features/savings/presentation/screens/savings_screen.dart` | `/savings` | `app/savings.tsx` | 4 | Kod tamam |

### 1.6 Ayarlar alt ekranları

| Ekran | Flutter dosyası | Flutter rotası | Önerilen Expo rotası | Aşama | Durum |
|---|---|---|---|---|---|
| Profil | `features/settings/presentation/screens/profile_screen.dart` | `/settings/profile` | `app/(app)/settings/profile.tsx` | 6 | Kod tamam (profil ve şifre; canlı `profiles` yazımı yalnız kullanıcı kaydettiğinde) |
| Bildirim tercihleri | `features/settings/presentation/screens/notification_preferences_screen.dart` | `/settings/notifications` | `app/(app)/settings/notifications.tsx` | 5 | Kod var (profil ve Auth meta verisiyle hesap tercihleri; canlı ve iki cihaz kabulü açık) |
| Ödeme yöntemleri | `features/settings/presentation/screens/payment_methods_screen.dart` | `/settings/payment-methods` | `app/(app)/settings/payment-methods.tsx` | 6 | Kod tamam (yöntem adları; kart numarası alınmaz) |
| Görünüm | `features/settings/presentation/screens/appearance_screen.dart` | `/settings/appearance` | `app/(app)/settings/appearance.tsx` | 6 | Kod tamam (yalnız koyu tema, Flutter'daki açık/sistem seçenekleri yok) |
| Uygulama kilidi | `features/settings/presentation/screens/app_lock_settings_screen.dart` | `/settings/app-lock` | `app/(app)/settings/app-lock.tsx` | 6 | Kod tamam (PIN, biyometri, kilit süresi; cihazda doğrulanmadı) |
| Gizlilik merkezi | `features/settings/presentation/screens/privacy_center_screen.dart` | `/settings/privacy` | `app/(app)/settings/privacy.tsx` | 6 | Kod var (dışa aktarma ve hesap silme bağlı; canlı/cihaz kabulü açık) |
| Geri bildirim / destek | `features/settings/presentation/screens/feedback_screen.dart` | `/settings/feedback` | `app/(app)/settings/feedback.tsx` | 6 | Kod tamam (paylaş ve destek kaydı) |
| Veri dışa aktarma | `features/settings/presentation/screens/export_data_screen.dart` | `/settings/export` | `app/(app)/settings/export.tsx` | 6 | Kısmi (canlı bulut indirme ve Android AVD'de tüm durumlarla cihaz paylaşım/CSV içe aktarma geçti; fiziksel cihaz açık) |
| Hesap silme | `features/settings/presentation/screens/delete_account_screen.dart` | `/settings/delete-account` | `app/(app)/settings/delete-account.tsx` | 6 | Kod tamam (yakın giriş, onay; canlı silme denenmedi) |

Not: Hesap silme ve dışa aktarma, Gizlilik merkezi altında bulunur ([USER_FLOWS.md §15](../product/USER_FLOWS.md)). Ayarlar ekranı bu bilgi mimarisini birebir taşır.

## 2. Akışlar ve davranışlar

| Davranış | Kaynak | Aşama | Durum |
|---|---|---|---|
| Oturum kontrolü ve yönlendirme | [USER_FLOWS §1](../product/USER_FLOWS.md) | 1 | Kod tamam |
| Oturum süresi dolunca auth ekranına yönlendirme | USER_FLOWS §1 | 1 | Kod tamam |
| Abonelik ekleme (zorunlu ve opsiyonel alanlar) | [DOMAIN](../product/DOMAIN.md), USER_FLOWS §3 | 2 | Kod tamam |
| Ücretsiz deneme ekleme ve ayrı kart görünümü | USER_FLOWS §4 | 2 | Kod tamam |
| Liste: arama, filtre (durum, kategori, para birimi, yaklaşan tarih) | USER_FLOWS §5 | 2 | Kod tamam |
| Düzenleme ve fiyat değişikliği event kaydı | USER_FLOWS §6 | 2 | Kod tamam |
| Durdurma (`PAUSED`) | USER_FLOWS §8 | 2 | Kod tamam |
| İptal (`CANCELLED`): sağlayıcı sayfası, "İptal ettim" (iptal ve erişim bitiş tarihi), "Durdurdum", "Kullanmaya devam et"; tasarruf özeti | USER_FLOWS §9 | 4 | Kod tamam (iptal sebebi alınmıyor: saklanacak yer yok ve kişisel not analitiğe gitmemeli) |
| Arşivleme (`ARCHIVED`) ve arşiv filtresi | USER_FLOWS §10 | 2 | Kod tamam |
| Gerçek silme yalnızca yanlış kayıt ve hesap silmede | [ADR 0006](../decisions/0006-archive-over-delete.md) | 2 | Kod var (arşivde yanlış kayıt beyanı gerekir; RLS/cascade canlı kabulü açık) |
| Realtime: çoklu cihazda abonelik güncellemesi | [API.md](../reference/API.md), [CURRENT_STATUS](../CURRENT_STATUS.md) | 2 | Kod var; aynı hesapta iki bağımsız oturum INSERT aldı; iki cihazda düzenleme/durum değişikliği ve çapraz hesap RLS kabulü açık (`expo/scripts/realtime-smoke.mjs`) |
| Offline: son cache'i gösterme | USER_FLOWS §14 | 3 | Kod tamam |
| Offline: FIFO mutation kuyruğu ve senkron koordinatörü | CURRENT_STATUS "Offline cache ve kuyruk" | 3 | Kod tamam |
| Offline banner ve yazma girişiminde form koruma | USER_FLOWS §14 | 3 | Kod tamam |
| Yerel bildirim planlama, tekrar zamanlamayı engelleme | [NOTIFICATIONS.md](../architecture/NOTIFICATIONS.md) | 5 | Kod tamam (farka dayalı eşitleme; cihazda doğrulanmadı) |
| Bildirim izni reddi ve ayar yönergesi | USER_FLOWS §13 | 5 | Kod tamam (açıklama ekranı, sistem izni, ayarlara yönlendirme) |
| Bildirime dokununca abonelik detayına deep link | USER_FLOWS §7 | 5 | Kod tamam (soğuk başlangıç dahil; cihazda doğrulanmadı) |
| Kaynak yoksa "artık mevcut değil" mesajı | USER_FLOWS §7 | 5 | Kod tamam (detay ekranı) |
| Sekme bildirim rozeti: sunucu okunması + kullanıcıya özgü yerel okunma/kapatma | CURRENT_STATUS "Uygulama içi bildirim merkezi" | 5 | Kod/test var (`notificationCenter.test.ts`); rozet sunucu yanıtını beklemeden düşer; cihaz ve çevrimdışı eşitleme kabulü açık |
| Uygulama içi bildirim merkezi ve okundu senkronu | CURRENT_STATUS "Uygulama içi bildirim merkezi" | 5 | Kısmi (yerel okunma ve sunucu `read_at` yazımı; erişilebilir satır adı ve IANA tarih testi var; canlı/cihaz doğrulaması yok) |
| Trial bitişi için ayrı bildirim kuralı | PRODUCT §6.6 | 5 | Kod tamam (7, 3, 1 gün önce) |
| Uygulama kilidi: PIN ve biyometri | CURRENT_STATUS "Uygulama kilidi" | 6 | Kod var (Flutter ile aynı PBKDF2 v2 serileştirmesi padding dahil ortak fixture ile doğrulanır; Expo v1 ve Flutter eski özeti yükseltilebilir; Flutter güvenli depo okuması ve cihaz kabulü açık) |
| CSV dışa aktarma (11 alanlı şema, CSV enjeksiyonu önlemi) | CURRENT_STATUS "CSV dışa/içe aktarma" | 6 | Kod var (tüm durumlar; formül metni etkisizleştirilir; Expo dışa/içe aktarma tırnaklı çok satırlı alanı korur; cihaz paylaşımı açık) |
| CSV içe aktarma ve doğrulama | CURRENT_STATUS | 6 | Kod var (11 sütun, altı durum, formül önekleri ve tırnaklı çok satırlı alanlar Expo içinde gidiş-dönüş testli; Flutter'ın satır tabanlı ayrıştırıcısı çok satırlı alanı desteklemiyor; cihaz kabulü açık) |
| Servis kataloğu (`support-catalog`, yedek liste) | CURRENT_STATUS "Servis kataloğu" | 2 | Kod tamam |
| Destek bileti oluşturma | CURRENT_STATUS "Destek bileti" | 6 | Kod tamam |
| Ödeme geçmişi ekleme, düzenleme, silme | CURRENT_STATUS "Ödeme geçmişi" | 4 | Kod tamam (ekleme, düzenleme ve silme çevrimiçi; kuyruğa alınmaz) |
| Dashboard ve takvim toplamları (para birimi bazlı) | PRODUCT §6.3, §6.4 | 4 | Kod tamam |
| Dashboard: kategori donut, aylık değişim, "tamamlandı" sayısı (ödeme kaydına bağlı) | Flutter `dashboard_screen.dart` | 4 | Kod var (`DashboardScreen` ve `OverviewCards`; görsel/cihaz paritesi doğrulanmadı) |
| Takvim: yüksek tutarlı yıllık ödeme ayrımı | PRODUCT §6.4, [NOTIFICATIONS](../architecture/NOTIFICATIONS.md) `ANNUAL_HIGH_VALUE` | 4 | Karar bekliyor (eşik yok) |
| Hesap silme (yakın giriş şartı, Storage temizliği) | CURRENT_STATUS "Hesap silme" | 6 | Kod tamam (sunucu işlemi canlıda denenmedi) |
| Veri dışa aktarma hazırlama ve güvenli paylaşım | USER_FLOWS §16 | 6 | Kısmi (canlı bulut indirme ve Android AVD'de altı durumlu cihaz export/import turu geçti; fiziksel cihaz doğrulaması açık) |

## 3. Kurallar ve altyapı

| Kural | Kaynak | Expo'da nasıl uygulanacak | Aşama | Durum |
|---|---|---|---|---|
| Para: floating point yok | [ADR 0004](../decisions/0004-money-as-decimal.md), AGENTS.md | Minör birim veya decimal; `Money` modülü | 0 | Kod tamam |
| Para birimleri çevrilmez, ayrı toplam | PRODUCT §5, §6.3 | Toplamlar para birimi bazında | 4 | Kod tamam |
| Tarih: UTC + kullanıcının IANA zaman dilimi | [ADR 0005](../decisions/0005-utc-and-user-timezone.md) | Profil IANA dilimi hesap ve bildirim akışlarında kullanılır; ayarlardan seçilebilir; tercih yoksa cihaz IANA bölgesi başlangıç varsayılanıdır. Ödeme analizi domain API'leri timezone'u zorunlu alır. | 0 | Kod var (canlı ve iki cihaz kabulü açık) |
| Yenilemeye 7 gün kala vurgu | PRODUCT §6.2 | Liste ve dashboard | 2 | Kod tamam (dashboard S4) |
| Kullanıcı verisi izolasyonu (RLS) | PRODUCT §5, §6.1 | Sunucu tarafı; istemci yalnızca API kullanır | 1 | Kod tamam |
| İstemci: doğrudan veritabanı bağlantısı yok | ADR 0009 | Yalnızca Supabase API sözleşmesi | 0 | Kod tamam |
| Her ekranda loading, error, empty, offline | AGENTS.md | Ortak bileşenlerde standart durumlar | 0 | Kod tamam (çoğu ekran; offline şeridi listede ve ana sayfada) |
| Ortak UI bileşenleri `expo/src/shared/` altında | AGENTS.md | Klasör yapısı | 0 | Kod tamam |
| Credential'lar env ile verilir, repoda yok | [MOBILE.md](../architecture/MOBILE.md) | `EXPO_PUBLIC_*` değişkenleri | 0 | Kod tamam |

## 4. Karar bekleyen çelişkiler

Flutter kodu ile ürün kuralı arasında [CURRENT_STATUS.md](../CURRENT_STATUS.md) ("Ürün kuralı ile kod arasında karar bekleyen çelişkiler" bölümünde) belirtilen iki çelişki var. Expo sürümü için aşağıdaki kararlar alınmıştır. Flutter sürümü bu süreçte değiştirilmez, dolayısıyla iki sürüm arasında bu konularda bilinçli bir fark oluşur ve Aşama 8 karşılaştırmasında izlenir.

| Konu | Ürün kuralı | Flutter'daki durum | Expo kararı | Durum |
|---|---|---|---|---|
| Fiziksel silme | Normal akışta yok; iptal/arşiv ([DOMAIN](../product/DOMAIN.md), ADR 0006) | Detay ve listede "Kalıcı olarak sil" var | Arşivde yalnız yanlış kayıt beyanıyla fiziksel silme; hesap silme ayrı akış | Kod var; canlı doğrulama açık |
| Yüksek tutarlı yıllık ödeme | PRODUCT §6.4 (tanım var, eşik yok) | Flutter'da eşik ve ayrım yok; yalnızca hedef bildirim türü `ANNUAL_HIGH_VALUE` tanımlı | Eşik kararı gelene kadar yüksek tutar için ayrı vurgu yok; normal yıllık yenileme etiketi kalır | Geçici karar verildi |
| Yenileme tarihi | Sessizce ilerletilmez ([DOMAIN §7](../product/DOMAIN.md)) | Yükleme sırasında gecikmiş aktif abonelik otomatik ilerletilir; "Ödendi ve yenilendi" ödeme geçmişine kayıt ekler | Otomatik ilerletme yok; vadesi bugün veya geçmiş aktif abonelikte kullanıcı "Ödendi ve yenilendi" eylemini onaylar; ödeme kaydı eklenir, sonraki tarih bugünden sonraki ilk döngüdür | Kod ve sınır testleri tamam; canlı/cihaz kabulü açık |
| Bildirim paketi | AGENTS.md `flutter_local_notifications` der | Flutter paketi kullanılıyor | `expo-notifications`; AGENTS.md bildirim satırı bu sürüme göre güncellendi | Karar verildi (Aşama 5'te uygulanır) |

Not: Bu Expo kararları kullanıcı tarafından verildi. Ürün kuralı sahibi farklı bir karar verirse ADR 0010 ve bu tablo güncellenir.

## 5. Güncelleme kuralı

2026-10-11 kod düzeltmesi: Expo ve Flutter `CANCELLED → ACTIVE` geçişini onayla sunar ve geçersiz detay eylemlerini gizler. Expo kayıt mesajı mevcut e-postayı ifşa etmez; bildirim eşitlemesi saat/dilim/içerik değişimini yeniler. Expo yenileme için 036 RPC yolunu içerir fakat varsayılan kapalıdır; Flutter ve varsayılan Expo hâlâ iki yazımlı eski akışı kullanır. Cihaz ve canlı işlem paritesi doğrulanmadı.

- Flutter tarafında yeni bir ekran ya da davranış eklendiğinde bu belgeye satır eklenir.
- Expo'da bir satır "Tamam" olmadan önce ilgili test ve [DEVICE_ACCEPTANCE.md](../operations/DEVICE_ACCEPTANCE.md) senaryosu bağlanır.
- Bu belgedeki durum, kod değişikliğiyle aynı değişiklikte güncellenir.

## Expo 59 senaryo sözleşmesi — 12 Ekim 2026

Ek (13 Ekim 2026, form ve bildirim merkezi): Expo formu yenileme sıklığını dörtlü segmentle seçtirir, tutar ve para birimini tek satırda toplar, ek alanları gruplu satırlarda sunar ve alt çubukta maliyet özeti gösterir. Bildirim merkezi tekrarları gruplar, Tümü/Okunmamış filtresi sunar ve vadesi gelmiş kayıtlarda onaylı "Ödendi" eylemi içerir; bunlar Flutter'da yoktur.

Ek (13 Ekim 2026, ana sayfa ve detay): Expo ana sayfası Flutter'dan bilinçli ayrışır. Hero "Bu ay kalan ödemeler" gösterir, gecikmiş/bugün vadeli kayıtlar ana sayfada satır içi "Ödendi" eylemiyle çözülür, hızlı işlemler ve tasarruf kartı kalkmıştır. Detayda yaşam döngüsü eylemleri yalnız ⋯ alt sayfasındadır; sayfa sonunda yalnız "Nasıl iptal edilir?" bulunur.

Ek (13 Ekim 2026, tasarım): Expo tasarım sistemi bilinçli olarak Flutter'dan ayrışır: statik Hanken Grotesk ağırlıkları, 12 rollük yazı ölçeği (en küçük 12, Flutter'daki 9–11 pt yok), beş köşe kademesi, kontrastlı bileşen sınırı (controlBorder) ile ≥3:1 bileşen sınırı ve açık tema için koyulaştırılmış grafik paleti. Düğme hiyerarşisi Primary/Tonal/Text olarak tekleştirildi.

Ek (13 Ekim 2026): Kilit ekranı ve PIN kaydı kullanıcıya bağlıdır; çıkışta yerel abonelik verisi temizlenir. Bu davranış Flutter'de yoktur ve Expo'ya özgüdür; parite için Flutter karşılığı ayrıca kararlaştırılmalıdır.

**Expo için güncel kullanıcı kararı:** [Gereksinim, API/veri modeli ve dağıtım sözleşmesi](../quality/expo-59/CONTRACT.md). Önceki Expo anlatımıyla çelişen tarih, mantıksal silme, 1.000 kota, 2.000 not, tüm para birimleri, device/fixed bölge ve açık/koyu/sistem tema kurallarında bu sözleşme geçerlidir. Flutter mevcut uygulaması korunur. Kod hazırlığı canlı/native kabul anlamına gelmez.
