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
| Splash / oturum kontrolü | `app/splash_screen.dart` | `/splash` | `app/index.tsx` (oturum yönlendirmesi) | 1 | Planlı |
| Giriş | `features/auth/presentation/screens/login_screen.dart` | `/login` | `app/(auth)/login.tsx` | 1 | Planlı |
| Kayıt | `features/auth/presentation/screens/register_screen.dart` | `/register` | `app/(auth)/register.tsx` | 1 | Planlı |
| Şifremi unuttum | `features/auth/presentation/screens/forgot_password_screen.dart` | `/forgot-password` | `app/(auth)/forgot-password.tsx` | 1 | Planlı |
| Şifre sıfırlama | `features/auth/presentation/screens/reset_password_screen.dart` | `/reset-password` | `app/(auth)/reset-password.tsx` | 1 | Planlı |

Not: E-posta doğrulama, Google ve Apple girişi Flutter'da **Kısmi**dir ([CURRENT_STATUS.md](../CURRENT_STATUS.md)). Expo'da da aynı kapsamla başlanır.

### 1.2 Onboarding ve yasal sayfalar

| Ekran | Flutter dosyası | Flutter rotası | Önerilen Expo rotası | Aşama | Durum |
|---|---|---|---|---|---|
| Onboarding (4 sayfa) | `features/onboarding/presentation/screens/onboarding_screen.dart` | `/onboarding` | `app/(auth)/onboarding.tsx` | 6 | Planlı |
| Gizlilik politikası | `features/settings/presentation/screens/privacy_policy_screen.dart` | `/legal/privacy` | `app/legal/privacy.tsx` | 6 | Planlı |
| Kullanım koşulları | `features/settings/presentation/screens/terms_of_service_screen.dart` | `/legal/terms` | `app/legal/terms.tsx` | 6 | Planlı |

Onboarding'de bildirim izni ilk saniyede istenmez; önce açıklayıcı ekran gösterilir ([USER_FLOWS.md §2, §13](../product/USER_FLOWS.md)).

### 1.3 Ana sekmeler

| Ekran | Flutter dosyası | Flutter rotası | Önerilen Expo rotası | Aşama | Durum |
|---|---|---|---|---|---|
| Ana sayfa (dashboard) | `features/dashboard/presentation/screens/dashboard_screen.dart` | `/home` | `app/(tabs)/index.tsx` | 4 | Planlı |
| Abonelik listesi | `features/subscriptions/presentation/screens/subscription_list_screen.dart` | sekme | `app/(tabs)/subscriptions/index.tsx` | 2 | Planlı |
| Takvim | `features/calendar/presentation/screens/calendar_screen.dart` | `/calendar` | `app/(tabs)/calendar.tsx` | 4 | Planlı |
| İstatistikler | `features/stats/presentation/screens/stats_screen.dart` | `/stats` | `app/(tabs)/stats.tsx` | 4 | Planlı |
| Ayarlar | `features/settings/presentation/screens/settings_screen.dart` | sekme | `app/(tabs)/settings/index.tsx` | 6 | Planlı |

### 1.4 Abonelik ekranları

| Ekran | Flutter dosyası | Flutter rotası | Önerilen Expo rotası | Aşama | Durum |
|---|---|---|---|---|---|
| Abonelik ekleme | `features/subscriptions/presentation/screens/add_subscription_screen.dart` | `/subscriptions/add` | `app/subscriptions/add.tsx` | 2 | Planlı |
| Abonelik detayı | `features/subscriptions/presentation/screens/subscription_detail_screen.dart` | `/subscriptions/:id` | `app/subscriptions/[id]/index.tsx` | 2 | Planlı |
| Abonelik düzenleme | `features/subscriptions/presentation/screens/edit_subscription_screen.dart` | `/subscriptions/:id/edit` | `app/subscriptions/[id]/edit.tsx` | 2 | Planlı |
| Arşivlenmiş abonelikler | `features/subscriptions/presentation/screens/archived_subscriptions_screen.dart` | `/subscriptions/archived` | `app/subscriptions/archived.tsx` | 2 | Planlı |
| CSV içe aktarma | `features/subscriptions/presentation/screens/csv_import_screen.dart` | `/subscriptions/import` | `app/subscriptions/import.tsx` | 6 | Planlı |

### 1.5 Bildirimler, istatistik ve tasarruf

| Ekran | Flutter dosyası | Flutter rotası | Önerilen Expo rotası | Aşama | Durum |
|---|---|---|---|---|---|
| Bildirim merkezi | `features/notifications/presentation/screens/notification_center_screen.dart` | `/notifications` | `app/notifications.tsx` | 5 | Planlı |
| Ödeme geçmişi | `features/stats/presentation/screens/payment_history_screen.dart` | `/stats/payments` | `app/stats/payments.tsx` | 4 | Planlı |
| Tasarruf | `features/savings/presentation/screens/savings_screen.dart` | `/savings` | `app/savings.tsx` | 4 | Planlı |

### 1.6 Ayarlar alt ekranları

| Ekran | Flutter dosyası | Flutter rotası | Önerilen Expo rotası | Aşama | Durum |
|---|---|---|---|---|---|
| Profil | `features/settings/presentation/screens/profile_screen.dart` | `/settings/profile` | `app/settings/profile.tsx` | 6 | Planlı |
| Bildirim tercihleri | `features/settings/presentation/screens/notification_preferences_screen.dart` | `/settings/notifications` | `app/settings/notifications.tsx` | 5 | Planlı |
| Ödeme yöntemleri | `features/settings/presentation/screens/payment_methods_screen.dart` | `/settings/payment-methods` | `app/settings/payment-methods.tsx` | 6 | Planlı |
| Görünüm | `features/settings/presentation/screens/appearance_screen.dart` | `/settings/appearance` | `app/settings/appearance.tsx` | 6 | Planlı |
| Uygulama kilidi | `features/settings/presentation/screens/app_lock_settings_screen.dart` | `/settings/app-lock` | `app/settings/app-lock.tsx` | 6 | Planlı |
| Gizlilik merkezi | `features/settings/presentation/screens/privacy_center_screen.dart` | `/settings/privacy` | `app/settings/privacy.tsx` | 6 | Planlı |
| Geri bildirim / destek | `features/settings/presentation/screens/feedback_screen.dart` | `/settings/feedback` | `app/settings/feedback.tsx` | 6 | Planlı |
| Veri dışa aktarma | `features/settings/presentation/screens/export_data_screen.dart` | `/settings/export` | `app/settings/export.tsx` | 6 | Planlı |
| Hesap silme | `features/settings/presentation/screens/delete_account_screen.dart` | `/settings/delete-account` | `app/settings/delete-account.tsx` | 6 | Planlı |

Not: Hesap silme ve dışa aktarma, Gizlilik merkezi altında bulunur ([USER_FLOWS.md §15](../product/USER_FLOWS.md)). Ayarlar ekranı bu bilgi mimarisini birebir taşır.

## 2. Akışlar ve davranışlar

| Davranış | Kaynak | Aşama | Durum |
|---|---|---|---|
| Oturum kontrolü ve yönlendirme | [USER_FLOWS §1](../product/USER_FLOWS.md) | 1 | Planlı |
| Oturum süresi dolunca auth ekranına yönlendirme | USER_FLOWS §1 | 1 | Planlı |
| Abonelik ekleme (zorunlu ve opsiyonel alanlar) | [DOMAIN](../product/DOMAIN.md), USER_FLOWS §3 | 2 | Planlı |
| Ücretsiz deneme ekleme ve ayrı kart görünümü | USER_FLOWS §4 | 2 | Planlı |
| Liste: arama, filtre (durum, kategori, para birimi, yaklaşan tarih) | USER_FLOWS §5 | 2 | Planlı |
| Düzenleme ve fiyat değişikliği event kaydı | USER_FLOWS §6 | 2 | Planlı |
| Durdurma (`PAUSED`) | USER_FLOWS §8 | 2 | Planlı |
| İptal (`CANCELLED`), iptal sağlayıcı bağlantısı, tasarruf özeti | USER_FLOWS §9 | 4 | Planlı |
| Arşivleme (`ARCHIVED`) ve arşiv filtresi | USER_FLOWS §10 | 2 | Planlı |
| Gerçek silme yalnızca yanlış kayıt ve hesap silmede | [ADR 0006](../decisions/0006-archive-over-delete.md) | 2 | Planlı |
| Realtime: çoklu cihazda abonelik güncellemesi | [API.md](../reference/API.md), [CURRENT_STATUS](../CURRENT_STATUS.md) | 2 | Planlı |
| Offline: son cache'i gösterme | USER_FLOWS §14 | 3 | Planlı |
| Offline: FIFO mutation kuyruğu ve senkron koordinatörü | CURRENT_STATUS "Offline cache ve kuyruk" | 3 | Planlı |
| Offline banner ve yazma girişiminde form koruma | USER_FLOWS §14 | 3 | Planlı |
| Yerel bildirim planlama, tekrar zamanlamayı engelleme | [NOTIFICATIONS.md](../architecture/NOTIFICATIONS.md) | 5 | Planlı |
| Bildirim izni reddi ve ayar yönergesi | USER_FLOWS §13 | 5 | Planlı |
| Bildirime dokununca abonelik detayına deep link | USER_FLOWS §7 | 5 | Planlı |
| Kaynak yoksa "artık mevcut değil" mesajı | USER_FLOWS §7 | 5 | Planlı |
| Uygulama içi bildirim merkezi ve okundu senkronu | CURRENT_STATUS "Uygulama içi bildirim merkezi" | 5 | Planlı |
| Trial bitişi için ayrı bildirim kuralı | PRODUCT §6.6 | 5 | Planlı |
| Uygulama kilidi: PIN ve biyometri | CURRENT_STATUS "Uygulama kilidi" | 6 | Planlı |
| CSV dışa aktarma (11 alanlı şema, CSV enjeksiyonu önlemi) | CURRENT_STATUS "CSV dışa/içe aktarma" | 6 | Planlı |
| CSV içe aktarma ve doğrulama | CURRENT_STATUS | 6 | Planlı |
| Servis kataloğu (`support-catalog`, yedek liste) | CURRENT_STATUS "Servis kataloğu" | 2 | Planlı |
| Destek bileti oluşturma | CURRENT_STATUS "Destek bileti" | 6 | Planlı |
| Ödeme geçmişi ekleme, düzenleme, silme | CURRENT_STATUS "Ödeme geçmişi" | 4 | Planlı |
| Dashboard, takvim, istatistik toplamları (para birimi bazlı) | PRODUCT §6.3, §6.4 | 4 | Planlı |
| Hesap silme (yakın giriş şartı, Storage temizliği) | CURRENT_STATUS "Hesap silme" | 6 | Planlı |
| Veri dışa aktarma hazırlama ve güvenli paylaşım | USER_FLOWS §16 | 6 | Planlı |

## 3. Kurallar ve altyapı

| Kural | Kaynak | Expo'da nasıl uygulanacak | Aşama | Durum |
|---|---|---|---|---|
| Para: floating point yok | [ADR 0004](../decisions/0004-money-as-decimal.md), AGENTS.md | Minör birim veya decimal; `Money` modülü | 0 | Planlı |
| Para birimleri çevrilmez, ayrı toplam | PRODUCT §5, §6.3 | Toplamlar para birimi bazında | 4 | Planlı |
| Tarih: UTC + kullanıcının IANA zaman dilimi | [ADR 0005](../decisions/0005-utc-and-user-timezone.md) | Zaman dilimi modülü | 0 | Planlı |
| Yenilemeye 7 gün kala vurgu | PRODUCT §6.2 | Liste ve dashboard | 2 | Planlı |
| Kullanıcı verisi izolasyonu (RLS) | PRODUCT §5, §6.1 | Sunucu tarafı; istemci yalnızca API kullanır | 1 | Planlı |
| İstemci: doğrudan veritabanı bağlantısı yok | ADR 0009 | Yalnızca Supabase API sözleşmesi | 0 | Planlı |
| Her ekranda loading, error, empty, offline | AGENTS.md | Ortak bileşenlerde standart durumlar | 0 | Planlı |
| Ortak UI bileşenleri `expo/src/shared/` altında | AGENTS.md | Klasör yapısı | 0 | Planlı |
| Credential'lar env ile verilir, repoda yok | [MOBILE.md](../architecture/MOBILE.md) | `EXPO_PUBLIC_*` değişkenleri | 0 | Planlı |

## 4. Karar bekleyen çelişkiler

Flutter kodu ile ürün kuralı arasında [CURRENT_STATUS.md](../CURRENT_STATUS.md) ("Ürün kuralı ile kod arasında karar bekleyen çelişkiler" bölümünde) belirtilen iki çelişki var. Expo sürümü için aşağıdaki kararlar alınmıştır. Flutter sürümü bu süreçte değiştirilmez, dolayısıyla iki sürüm arasında bu konularda bilinçli bir fark oluşur ve Aşama 8 karşılaştırmasında izlenir.

| Konu | Ürün kuralı | Flutter'daki durum | Expo kararı | Durum |
|---|---|---|---|---|
| Fiziksel silme | Normal akışta yok; iptal/arşiv ([DOMAIN](../product/DOMAIN.md), ADR 0006) | Detay ve listede "Kalıcı olarak sil" var | Normal akışta kalıcı silme yok; fiziksel silme yalnızca hesap silme akışında kullanılır (AGENTS.md "Fiziksel silme" kuralı) | Karar verildi (Aşama 2'de uygulanır) |
| Yenileme tarihi | Sessizce ilerletilmez ([DOMAIN §7](../product/DOMAIN.md)) | Yükleme sırasında gecikmiş aktif abonelik otomatik ilerletilir | Otomatik ilerletme yok; gecikmiş yenileme kullanıcıya "yenileme tarihi geçti" olarak gösterilir ve kullanıcı onaylar | Karar verildi (Aşama 2'de uygulanır) |
| Bildirim paketi | AGENTS.md `flutter_local_notifications` der | Flutter paketi kullanılıyor | `expo-notifications`; AGENTS.md bildirim satırı bu sürüme göre güncellendi | Karar verildi (Aşama 5'te uygulanır) |

Not: Bu üç karar kullanıcı tarafından Expo sürümü için yetki verilerek alındı. Ürün kuralı sahibi farklı bir karar verirse ADR 0010 ve bu tablo güncellenir.

## 5. Güncelleme kuralı

- Flutter tarafında yeni bir ekran ya da davranış eklendiğinde bu belgeye satır eklenir.
- Expo'da bir satır "Tamam" olmadan önce ilgili test ve [DEVICE_ACCEPTANCE.md](../operations/DEVICE_ACCEPTANCE.md) senaryosu bağlanır.
- Bu belgedeki durum, kod değişikliğiyle aynı değişiklikte güncellenir.
