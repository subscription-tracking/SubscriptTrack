# Kütüphaneler — Expo Uygulaması

> Bu belge `expo/` içinde kullanılan paketleri ve seçim gerekçelerini listeler. Sürüm numaraları `expo/package.json` ve `expo/package-lock.json` içindedir; burada kopyalanmaz. Her Expo paketi `npx expo install` ile SDK uyumlu sürümde kurulur ([expo/AGENTS.md](../../expo/AGENTS.md)).

## Kurulu (Aşama 0)

| Paket | Amaç | Neden bu seçim | Flutter karşılığı |
|---|---|---|---|
| `expo`, `react-native` | Çalışma zamanı | Expo SDK 57 | Flutter SDK |
| `expo-router` | Dosya tabanlı routing | Expo'nun resmi router'ı; deep link ve tip güvenli rotalar | `go_router` |
| `expo-status-bar` | Durum çubuğu | Standart Expo bileşeni | — |
| `expo-linking` | Deep link ve `subscripttrack://` scheme | Expo Router ile birlikte gelir; e-posta dönüşü ve bildirim açılışı için gerekir | `go_router` deep link |
| `expo-constants` | Uygulama bilgisi | Expo Router bağımlılığı | — |
| `react-native-safe-area-context`, `react-native-screens` | Güvenli alan ve native ekran | Expo Router bağımlılığı | `SafeArea` |
| `@supabase/supabase-js` | Supabase istemcisi (Auth, PostgREST, RPC, Realtime) | Backend'in resmi istemcisi; Flutter SDK'nın karşılığı | `supabase_flutter` |
| `@react-native-async-storage/async-storage` | Supabase oturum saklama | Supabase'in RN için önerdiği depolama | `flutter_secure_storage` (oturum) |
| `jest`, `jest-expo`, `@react-native/jest-preset` | Birim testleri | Expo'nun resmi test preset'i | `flutter_test` |
| `@testing-library/react-native` (13.x) | Bileşen testleri | Kullanıcı odaklı sorgular | `flutter_test` widget testleri |
| `react-test-renderer` (19.2.x) | RNTL'nin renderer'ı | React 19 ile uyumlu sürüm | — |
| `typescript` | Tip denetimi | `strict` modu | Dart analizcisi |

### Notlar

- **Oturum saklama:** Supabase oturumu AsyncStorage'da tutulur. Bu, Supabase'in önerdiği varsayılandır. Finansal veri cache'i ise (Aşama 3) güvenli depolamaya taşınır; oturum belirteci ile veri aynı katmanda tutulmaz.
- **RNTL 13:** RNTL 14 ek bir `test-renderer` peer'i ister ve bu kurulumda `screen` nesnesi doldurulmadığı için testler çalışmadı. 13.x sürümü React 19 ile test edildi.
- **`--legacy-peer-deps`:** Expo Router'ın isteğe bağlı `react-dom` peer'i yüzünden gereklidir ([SETUP.md](SETUP.md)).

## Planlanan (ilgili aşamada eklenecek)

| Paket | Aşama | Amaç | Flutter karşılığı | Not |
|---|---|---|---|---|
| `@tanstack/react-query` | 2 | Sunucu verisi, önbellek, yeniden deneme | Provider + ChangeNotifier | Sorgu anahtarları kullanıcı kimliğini içerir |
| `zustand` | 1 | Küçük yerel UI durumu | Provider | Sunucu verisi buraya kopyalanmaz |
| `expo-secure-store` | 3 | Finansal cache ve kuyruk verisi | `flutter_secure_storage` | Değer başına boyut sınırı var; büyük veri parçalanarak yazılır |
| `@react-native-community/netinfo` | 3 | Ağ durumu (offline şeridi) | `connectivity` | Offline şeridinin kaynağı |
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
