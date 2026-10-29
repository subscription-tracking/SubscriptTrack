# Expo ekran ve rota envanteri

2026-10-28 çalışma ağacı. K = rota/kod kanıtı; B = tarihli belge; ? = durum veya cihaz testi incelenmedi. Ekran bazlı öneriler uygulama kararı değildir. Tek tek rota dosyaları `expo/app/` altında; gruplandırılmış yollar gerçek dosyaları gösterir. `app/index.tsx` mevcut değil; kök `app/_layout.tsx` ve grup içi `(tabs)/index.tsx` incelenmelidir.

| Rota | Ekran / bileşen kaynağı | Kodda görülen / eksik kanıt | Değişim ihtiyacı veya inceleme |
|---|---|---|---|
| `(auth)/onboarding` | `features/onboarding/ui/OnboardingScreen.tsx`, `CurrencyPage.tsx` | K: sayfa, başlık, hata; ? font ölçeği/motion | Karşılama anlatısı, para birimi seçimi ve reduce motion. |
| `(auth)/login` | `app/(auth)/login.tsx`, `features/auth/ui/AuthScaffold.tsx` | K: alanlar ve diğer auth rotaları; ? ağ/klavye cihaz durumları | Hata odağı, erişilebilir alan etiketleri. |
| `(auth)/register` | `app/(auth)/register.tsx`, `AuthScaffold.tsx` | K: kayıt ve yasal bağlantılar; ? gerçek e-posta kabulü | Form yoğunluğu ve yasal bağlantıların ekran okuyucu erişimi. |
| `(auth)/forgot-password` | `app/(auth)/forgot-password.tsx` | K: gönderim ve girişe dönüş; ? gerçek e-posta | Geri bildirim ve başarısız bağlantı akışı. |
| `(auth)/reset-password` | `app/(auth)/reset-password.tsx` | K: rota var; ? deep link/klavye | Geçersiz/süresi dolmuş link ve parola doğrulama. |
| `auth-callback` | `app/auth-callback.tsx` | K: rota var; ? hata/soğuk başlatma | Yönlendirme, bekleme ve başarısızlık. |
| `(tabs)/index` | `features/dashboard/ui/DashboardScreen.tsx`, `HeroCard.tsx`, `UpcomingTimeline.tsx`, `AttentionSection.tsx`, `CategoryBarCard.tsx` | K: loading/error, boş, yaklaşanlar ve eksik ödeme; ? iOS/çok veri | Parasal hiyerarşi, ekleme, 0/1/çok veri, para birimi. |
| `(tabs)/subscriptions/index` | `features/subscriptions/ui/SubscriptionListScreen.tsx`, `ListTabBar.tsx` | K: loading/error, boş, arama, filtre, FlatList, çoklu seçim; ? offline yazma/1000 kayıt | Liste yoğunluğu, seçim/silme anlamı, filtre geri dönüşü. |
| `subscriptions/add` | `features/subscriptions/ui/SubscriptionFormScreen.tsx` | K: form ve bekleyen kaydetme; ? tüm doğrulama/klavye | Alan sırası, tarih/para semantiği, hata odağı. |
| `subscriptions/[id]/edit` | `features/subscriptions/ui/SubscriptionEditScreen.tsx`, `SubscriptionFormScreen.tsx` | K: loading/error ve mevcut kayıt; ? offline çatışma | Değişmeyen vade, kaydetme ve form geri dönüşü. |
| `subscriptions/[id]` | `features/subscriptions/ui/SubscriptionDetailScreen.tsx`, `detail/DetailHero.tsx`, `PaymentCard.tsx`, `DetailSummary.tsx`, `DetailHistory.tsx` | K: ana kayıt ve ödemede ayrı durumlar; B: 23 Ekim Samsung turu; ? iOS | Devam eden kullanıcı değişikliklerini koruyarak ödeme, geçmiş ve menü hiyerarşisi. |
| `subscriptions/[id]/cancel` | `SubscriptionCancelScreen.tsx` | K: sorgu ve işlem durumları; ? dış servis yolu | Rehber ile uygulamadaki durum değişimini ayır. |
| `subscriptions/archived` | `SubscriptionArchivedScreen.tsx` | K: FlatList, geri alma ve yanlış kayıt silme; ? platform/çok veri | Silme, arşiv ve geri getirmeyi açık ayırt et. |
| `subscriptions/import` | `CsvImportScreen.tsx`, `CsvImportPreview.tsx`, `useCsvImportController.ts` | K: seçim, örnek, önizleme, online/busy; ? büyük dosya ve cihaz seçicisi | Satır hata, yinelenen kayıt ve çevrimdışı sonuçları. |
| `(tabs)/stats` | `features/stats/ui/StatsScreen.tsx` | K: iki sorgu, loading/error ve boş durum; ? grafik a11y | Gerçek/hesaplanan değer ayrımı, az verili grafik. |
| `stats/payments` | `features/stats/ui/PaymentHistoryScreen.tsx` | K: loading/error, FlatList, erişilebilir ekle/düzenle/sil; ? çok veri | Ödeme geçmişi ve beklenen ödeme farkı, düzeltme güvenliği. |
| `calendar` | `features/calendar/ui/CalendarScreen.tsx`, `CalendarMonth.tsx` | K: sorgu ve para birimi filtresi; ? yoğun gün ve VoiceOver | Gecikme, deneme ve tarihleri renkten bağımsız anlat. |
| `notifications` | `features/notifications/ui/NotificationCenterScreen.tsx` | K: sorgu/yerel hazırlık; ? cihaz bildirim akışları | Okunmamış, grup, izin ve onaylı eylem hiyerarşisi. |
| `savings` | `features/savings/ui/SavingsScreen.tsx` | K: iki sorgu loading/error; ? fırsat hesaplarının kullanıcı algısı | Tahmini tasarrufu gerçekleşen değer gibi sunma. |
| `(tabs)/settings/index` | `features/settings/ui/SettingsHome.tsx`, `SettingsParts.tsx` | K: ayar rotalarına bağlantı; ? bulunabilirlik | Tema ve bölgenin ortak ekrana gidişini test et. |
| `settings/profile` | `ProfileScreen.tsx` | K: profil ve parola; ? hata/klavye | Form ve hassas işlemlerin ayrılması. |
| `settings/appearance` | `AppearanceScreen.tsx` | K: tema ve bölge radio seçimleri; ? platformlar | Tema, para birimi, bölge yoğunluğu. |
| `settings/notifications` | `NotificationPreferencesScreen.tsx` | K: loading/error ve iOS/Android saat seçici farkı; ? gerçek teslim | İzin ve yerel bildirim davranışını açık göster. |
| `settings/payment-methods` | `PaymentMethodsScreen.tsx`, `PaymentMethodDialog.tsx` | K: loading/error, ekle/düzenle/sil; ? modal cihaz | Bunların banka entegrasyonu olmadığını anlaşılır tut. |
| `settings/app-lock` | `AppLockSettingsScreen.tsx` | K: PIN/biyometri ve bekleme; ? gerçek cihaz | Etkinleştirme, hata, biyometri iptali. |
| Kilit görünümü (ayrı rota değil) | `LockScreen.tsx`, `AppLockProvider.tsx` | K: kilit ve çıkış eylemi; ? donanım/TalkBack | Hassas içerik gizleme ve hata durumları. |
| `settings/privacy` | `PrivacyCenterScreen.tsx` | K: yasal, export ve hesap silme bağlantıları | Veri işlemlerinin sonuçlarını ayır. |
| `settings/export` | `ExportScreen.tsx` | K: loading/error ve paylaşım yolları; ? platform paylaşımı | Hazırlanıyor/hata/başarı ve offline. |
| `settings/delete-account` | `DeleteAccountScreen.tsx` | K: onay alanları ve bekleme; ? gerçek silme kabulü | Hesap silme ile abonelik silmeyi net ayır. |
| `settings/feedback` | `FeedbackScreen.tsx` | K: tür, mesaj, gönderim ve paylaşım; ? hata/başarı cihaz | Destek talebi ile paylaşım eylemini ayır. |
| `legal/privacy`, `legal/terms` | `app/legal/privacy.tsx`, `terms.tsx`, `shared/widgets/LegalDocumentView.tsx` | K: rotalar ve ortak görüntüleyici; ? hukuk ve büyük yazı | Uzun metin/bağlantı okunabilirliği ve içerik onayı. |

Ortak kabuklar: `app/_layout.tsx`, `app/(auth)/_layout.tsx`, `app/(app)/_layout.tsx`, `app/(app)/(tabs)/_layout.tsx`; bunlar içerik ekranı değildir. Durum matrisi boş/hata/offline/test alanlarında `?` bırakılan yerler için eksik kanıt anlamına gelir; destek yokluğu sonucu değildir. Her ekran için 0/1/çok veri, loading/error/offline, iOS/Android, test eşlemesi henüz eksiksiz doğrulanmamıştır.
