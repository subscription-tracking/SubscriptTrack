# Kütüphaneler — Expo Uygulaması

> Bu belge `expo/` içinde kullanılan paketleri ve seçim gerekçelerini listeler. Sürüm numaraları `expo/package.json` ve `expo/package-lock.json` içindedir; burada kopyalanmaz. Her Expo paketi `npx expo install` ile SDK uyumlu sürümde kurulur ([expo/AGENTS.md](../../expo/AGENTS.md)).

## Kurulu (Aşama 0)

**2026-10-10 güncellemesi:** `eslint` ve `eslint-config-expo` SDK 57 lint kapısı için geliştirici bağımlılığına; `expo-system-ui` koyu native görünüm için uygulama bağımlılığına eklendi. Güncel kurulumun tek sürüm kaynağı `expo/package.json` dosyasıdır. Aşağıdaki aşama başlığı tarihsel kurulum anını anlatır.

SDK 57 kilitli bağımlılık ağacı `react-native-reanimated@4.5.1` ve `react-native-worklets@0.10.1` eşleşmesini Expo Router/Expo çekirdeği üzerinden getirir; `npx expo install --check` geçer. Uygulama kaynak kodu Reanimated API'sini doğrudan kullanmıyor; animasyonlar React Native `Animated` ile yazılmış. `@react-native/jest-preset`, uygulama çalışma zamanı paketi olmadığı için `devDependencies` altında tutulur. Bağımlılık ağacından tamamen çıkarma ve güvenli yükseltme SDK uyumluluk denetimi gerektirir.

`expo-dev-client` fiziksel cihaz development build'i için, `@noble/hashes` Flutter ile uyumlu PBKDF2 PIN özetleri için eklendi. PIN hesabı 30.000 turda cihaz üzerinde süre ölçümü bekler; Node ölçümü cihaz performansı kanıtı değildir.

| Paket | Amaç | Neden bu seçim | Flutter karşılığı |
|---|---|---|---|
| `expo`, `react-native` | Çalışma zamanı | Expo SDK 57 | Flutter SDK |
| `expo-router` | Dosya tabanlı routing | Expo'nun resmi router'ı; deep link ve tip güvenli rotalar | `go_router` |
| `expo-status-bar` | Durum çubuğu | Standart Expo bileşeni | — |
| `expo-linking` | Deep link ve `subscripttrack://` scheme | Expo Router ile birlikte gelir; e-posta dönüşü ve bildirim açılışı için gerekir | `go_router` deep link |
| `expo-constants` | Uygulama bilgisi | Expo Router bağımlılığı | — |
| `react-native-safe-area-context`, `react-native-screens` | Güvenli alan ve native ekran | Expo Router bağımlılığı | `SafeArea` |
| `@supabase/supabase-js` | Supabase istemcisi (Auth, PostgREST, RPC, Realtime) | Backend'in resmi istemcisi; Flutter SDK'nın karşılığı | `supabase_flutter` |
| `expo-font`, `expo-asset` | Hanken Grotesk yazı tipinin pakete gömülü yüklenmesi (F-19) | Flutter `assets/fonts` ve `pubspec` fontları | `google_fonts` yerine yerel font |
| `@expo/vector-icons` | Material ikon seti (`MaterialIcons`) | Flutter `Icons.*` karşılığı; "rounded" varyantları yoktur, düz Material simgeleri kullanılır | `Icons` |
| `react-native-svg` | Ambient arka plan radyal gradyanları | Flutter `RadialGradient` ve blur lekeleri için | `CustomPaint` / `ImageFiltered` |
| `expo-local-authentication` | 6 | Biyometri ile uygulama kilidi | `local_auth` | Cihazda doğrulanır; iOS için Face ID açıklaması `app.json` plugin ayarında |
| `expo-secure-store` | Supabase oturumu ve PKCE verifier deposu | Android Keystore / iOS Keychain; Flutter'daki `SecureSupabaseStorage` ve `SecurePkceStorage` (F-16) ile aynı seviye | `flutter_secure_storage` |
| `jest`, `jest-expo`, `@react-native/jest-preset` | Birim testleri | Expo'nun resmi test preset'i | `flutter_test` |
| `@testing-library/react-native` (13.x) | Bileşen testleri | Kullanıcı odaklı sorgular | `flutter_test` widget testleri |
| `react-test-renderer` (19.2.x) | RNTL'nin renderer'ı | React 19 ile uyumlu sürüm | — |
| `typescript` | Tip denetimi | `strict` modu | Dart analizcisi |

### Notlar

- **Oturum saklama:** Supabase oturumu ve PKCE verifier'ı `expo-secure-store` üzerinden tutulur. SecureStore değer başına ~2 KB sınırı koyduğu için uzun değerler parçalanır ([secureSessionStorage.ts](../../expo/src/core/storage/secureSessionStorage.ts)). Finansal veri cache'i (Aşama 3) aynı katmanda ama ayrı anahtarlarla tutulur.
- **RNTL 13:** RNTL 14 ek bir `test-renderer` peer'i ister ve bu kurulumda `screen` nesnesi doldurulmadığı için testler çalışmadı. 13.x sürümü React 19 ile test edildi.
- **`--legacy-peer-deps`:** Expo Router'ın isteğe bağlı `react-dom` peer'i yüzünden gereklidir ([SETUP.md](SETUP.md)).

## Planlanan (ilgili aşamada eklenecek)

| Paket | Aşama | Amaç | Flutter karşılığı | Not |
|---|---|---|---|---|
| `@tanstack/react-query` | 2 | Sunucu verisi, önbellek, yeniden deneme | Provider + ChangeNotifier | Sorgu anahtarları kullanıcı kimliğini içerir |
| `zustand` | 1 | Küçük yerel UI durumu | Provider | Sunucu verisi buraya kopyalanmaz |
| Finansal cache ve kuyruk (`expo-secure-store` üzerinde) | 3 | Son abonelik verisi ve offline yazma kuyruğu | `flutter_secure_storage` | Oturum deposundaki parçalama mantığı yeniden kullanılır |
| `expo-network` | 3 | Ağ durumu (offline şeridi, senkron tetikleyici) | `connectivity` | Expo modülü; `@react-native-community/netinfo` yerine seçildi (Expo'nun önerisi). Bilinmeyen durum çevrimiçi sayılır ([networkState.ts](../../expo/src/core/network/networkState.ts)) |
| `expo-notifications` | 5 | Yerel bildirim planlama ve deep link | `flutter_local_notifications` + `timezone` | Uzak push kullanılmaz; AGENTS.md bildirim satırı bu karara göre güncellenir |
| `expo-local-authentication` | 6 | Biyometri (uygulama kilidi) | `local_auth` | Cihazda doğrulanır |
| `expo-document-picker`, `expo-file-system`, `expo-sharing` | 6 | CSV içe aktarma, dışa aktarma ve paylaşım | `file_picker`, `share_plus` | CSV enjeksiyonu önlemi sunucu/istemci kuralıyla aynı |
| `decimal.js` (gerekirse) | 2 | Form girişinde ara hesaplama | — | Varsayılan olarak `Money` yeterlidir; eklenmesi için gerekçe gerekir |
| `date-fns` / `date-fns-tz` | — | Şimdilik kullanılmıyor | `intl` | `calendar.ts` ihtiyacı karşılar; yalnızca ihtiyaç doğarsa eklenir |

## Bilinçli olarak seçilmeyenler

- **Redux:** Bu ölçek için gereksiz karmaşıklık. TanStack Query + küçük store yeterlidir.
- **Moment.js:** Eskimiş ve büyük. Takvim hesapları `calendar.ts` ile yapılır.
- **Büyük UI kütüphaneleri (Tamagui, NativeBase vb.):** Tasarım tokenları ve birkaç ortak bileşen yeterlidir ([DESIGN_SYSTEM.md](../product/DESIGN_SYSTEM.md)). Flutter tarafındaki görsel dil birebir taşınacağı için dış UI kiti eklenmez.
- **Firebase:** Kullanılmaz ([ADR 0009](../decisions/0009-supabase-only-architecture.md)).
- **Uzak push servisleri (OneSignal vb.):** Kullanılmaz ([ADR 0009](../decisions/0009-supabase-only-architecture.md)).
