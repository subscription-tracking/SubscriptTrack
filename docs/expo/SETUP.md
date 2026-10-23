# Geliştirme Ortamı — Expo Uygulaması

> Bu belge `expo/` klasörünü yerel olarak çalıştırmak için gereken adımları anlatır. Mimari kararlar [ARCHITECTURE.md](ARCHITECTURE.md), kullanılan paketler [LIBRARIES.md](LIBRARIES.md) belgesindedir.

## Gereksinimler

- Node.js (LTS). Bu makinede Node 24 ile doğrulandı.
- npm (paket yöneticisi olarak npm kullanılır; `expo/package-lock.json` tek kilit dosyasıdır).
- Android: Android Studio ya da bir Android cihaz. Bu makinede Android bundle'ı doğrulandı.
- iOS: Simulator için macOS ve Xcode gerekir. Windows'ta iOS'u yerel olarak çalıştırmak mümkün değildir. iOS paketi için EAS Build kullanılacaktır (Aşama 7).

## İlk kurulum

```bash
cd expo
npm install --legacy-peer-deps
```

`--legacy-peer-deps` zorunludur. Expo Router, web için isteğe bağlı bir `react-dom` peer'i ister. Web hedeflenmediği için bu peer kurulmaz ve npm'in katı peer çözümü bu yüzden hata verir. Bu bayrak yalnızca kurulumda gereklidir; `npx expo install` ile eklenen paketler yine SDK uyumlu sürümleri seçer.

## Ortam değişkenleri

Supabase bağlantısı için iki değişken gerekir. Değerler Flutter sürümüyle aynı Supabase projesine aittir ve `mobile/.env` dosyasındaki değerlerle aynıdır.

```bash
cp .env.example .env
```

`.env` dosyasına şu iki değişkeni girin:

| Değişken | İçerik |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase proje URL'i |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Publishable (anon) anahtar |
| `EXPO_PUBLIC_IDEMPOTENT_DEFERRED_ENABLED` | Varsayılan `false`. Yalnız migration 037 canlıya uygulandıktan sonra `true` yapılır; aksi halde ertelenmiş ilk ödeme eski doğrudan yazımla kaydedilir. |
| `EXPO_PUBLIC_ATOMIC_RENEWAL_ENABLED` | Varsayılan `false`. Yalnız migration 036 canlıya uygulanıp işlem senaryoları doğrulandıktan sonra ayrı bir build'de `true` yapılır; eski yenileme düğmesi bu sırada çalışır. |

`.env.example` içindeki `S31_TEST_EMAIL` ve `S31_TEST_PASSWORD` yalnız isteğe bağlı backend smoke testleri içindir; Expo ekranında otomatik giriş sağlamaz. Bu değerleri ekleyen geliştirici test hesabıyla normal giriş ekranını kullanır.

Kurallar:

- `.env` dosyası git'e girmez ([expo/.gitignore](../../expo/.gitignore)). Yalnızca `.env.example` izlenir.
- `service_role` anahtarı istemciye **asla** konmaz ([API.md §1](../reference/API.md)).
- `EXPO_PUBLIC_` önekli değişkenler uygulama paketine gömülür. Gizli olmayan değerler için kullanılır.
- Test hesabı şifresi dahil hiçbir parola `EXPO_PUBLIC_` önekiyle verilmez. Geliştirme girişindeki otomatik test hesabı düğmesi kaldırıldı; normal giriş formu kullanılır.
- Değişken eksikse uygulama, hangi değişkenin eksik olduğunu söyleyen bir hata ile durur ([env.ts](../../expo/src/core/config/env.ts)).

Değişken değiştiğinde Expo'yu cache temizleyerek yeniden başlatın:

```bash
npx expo start --clear
```

## Çalıştırma

```bash
npm start            # geliştirme sunucusu (Expo Go veya development build)
npm run android      # Android emulator/cihaz
npm run ios          # iOS simulator (yalnızca macOS)
npx expo start --go   # telefondaki Expo Go için QR (hesap/EAS projesi gerekmez)
```

Android emülatöründe hesaba bağlanmadan yerel development build üretmek için `npx expo run:android` kullanılır. Android'in yerel debug anahtarıyla kurulan bu paket yayın paketi değildir. Bu Windows makinesinde AVD'yi Expo CLI'nin tanıması için SDK değişkenlerini aynı PowerShell oturumunda ayarlayın:

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:Path"
npx expo start --dev-client --host lan
```

Metro hazır olunca terminalde `a` tuşuna basın; CLI emülatörü development build bağlantısıyla açar. SDK yolu verilmezse Expo CLI bağlı AVD'yi bulamayabilir; geliştirme uygulamasını elle açınca beyaz bekleme ekranı oluşabilir. 10 Ekim 2026'da `SubscriptTrack_Expo_Test` Android 36 x86_64 AVD'sinde bu bağlantı yöntemiyle dashboard, dört sekme, gizlilik/export, CSV paylaşımı ve altı durumlu CSV içe aktarma doğrulandı; ayrıntı [cihaz kabulinde](../operations/DEVICE_ACCEPTANCE.md). Gerçek cihazda Expo Go ile QR kodu denenebilir; yerel bildirim, biyometri ve güvenli depolama gibi modüllerin tam kabulü için development build gerekir ([LIBRARIES.md](LIBRARIES.md)). EAS hesabı bağlanmamıştır ve iOS cihaz kabulü ertelenmiştir.

## Kalite komutları

```bash
npm test             # Jest (birim ve bileşen testleri)
npm run typecheck    # tsc --noEmit (strict)
npx expo-doctor      # Expo bağımlılık ve yapılandırma denetimi
```

Bu makinede doğrulanan durum: `npm test` testler geçiyor, `npm run typecheck` hatasız, `npx expo-doctor` 21/21 kontrol geçiyor, Android bundle `npx expo export --platform android` ile üretiliyor.

Lint `npm run lint` ile çalışır; GitHub Actions'taki `expo-quality.yml`, Expo kodu değişince typecheck, test, Doctor, lint ve Android/iOS JS export kapılarını çalıştırır. Yerel kontroller geçti; CI'da en az bir başarılı çalıştırma ayrıca kaydedilmelidir.

## E-posta bağlantıları ve Expo Go

Doğrulama ve şifre sıfırlama e-postalarındaki bağlantılar, uygulamanın çalıştığı ortama göre döner (`AUTH_REDIRECT_URL`, [authRepository.ts](../../expo/src/features/auth/data/authRepository.ts)):

- Expo Go: `exp://<bilgisayar-ip>:8081/--/auth-callback`
- Development build / release: `subscripttrack://auth-callback`

Supabase bu adreslere yalnızca **Authentication → URL Configuration → Redirect URLs** listesindeki adreslere dönüş yapar. Adres listede yoksa bağlantı Site URL'ye (GitHub Pages ya da localhost) düşer ve uygulama açılmaz. Gerekli girişler:

- `subscripttrack://auth-callback`
- `exp://**` (Expo Go; IP değiştiği için joker kullanılır)

Site URL alanı da bu uygulamaya ait bir adres olmalıdır. Bu ayarlar canlı projede panelden değiştirilir; kod tarafında ek değişiklik gerektirmez.

## Bilinen sınırlar

- Peer çakışması nedeniyle `npm install` her zaman `--legacy-peer-deps` ile çalıştırılmalıdır.
- `npm audit` bazı uyarılar veriyor. Düzeltmeler `npm audit fix --force` gerektirdiği için (kırıcı değişiklik riski) henüz uygulanmadı.
- iOS'ta çalışma doğrulaması yoktur; Windows'tan yalnızca Android doğrulandı.
