<div align="center">

<img src="mobile/assets/images/app_icon.png" alt="SubscriptTrack" width="96" height="96" />

# SubscriptTrack

**Tüm aboneliklerini tek yerden yönet.**

Netflix, Spotify, Adobe, ChatGPT — kaç aboneliğin olursa olsun,  
SubscriptTrack yenileme tarihlerini takip eder, yaklaşan ödemeleri bildirir  
ve iptal ettiğinde ne kadar tasarruf ettiğini gösterir.

<br/>

[![Flutter](https://img.shields.io/badge/Flutter-3.3%2B-02569B?style=flat-square&logo=flutter)](https://flutter.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20Web-lightgrey?style=flat-square)](https://flutter.dev)
[![License](https://img.shields.io/badge/License-Private-red?style=flat-square)](#)

</div>

---

## Neden SubscriptTrack?

Çoğu insan kaç aboneliğe sahip olduğunu bilmez. Ücretsiz denemeler ücretliye dönüşür, kullanılmayan servisler aylarca fatura keser.

| Sorun | SubscriptTrack ile |
|---|---|
| Hangi aboneliğim var bilmiyorum | Tümünü listele, fatura döngüsüyle birlikte gör |
| Trial ne zaman bitiyor hatırlamıyorum | Bitiş günü için özel bildirim al |
| Ne kadar harcıyorum bilmiyorum | Para birimi bazında aylık/yıllık toplam |
| İptal ettim ama tasarruf ettim mi? | Anlık tasarruf hesabı, geçmiş kayıtlar |

Banka hesabı veya kart bağlantısı **gerektirmez**.

---

## Özellikler

**Abonelik Yönetimi**
- İsim, fiyat, para birimi, fatura döngüsü ve yenileme tarihi ile abonelik ekle
- Haftalık · Aylık · 3 Aylık · 6 Aylık · Yıllık · Özel döngü desteği
- TRY, USD, EUR, GBP ve diğer ISO 4217 para birimleri
- `TRIAL → ACTIVE → PAUSED → CANCELLED → ARCHIVED` durum akışı
- Silme yerine arşivleme — geçmiş veriler korunur

**Dashboard**
- Para birimi bazında aylık ve yıllık tahmini toplam
- Önümüzdeki 7 gündeki yenilemeler
- Aktif deneme sayısı ve iptallerden doğan tasarruf özeti

**Takvim**
- Aylık takvim görünümü
- Gün bazında yenileme listesi — normal ödeme, trial bitişi ve yüksek tutarlı yıllık ödeme ayrımı

**Bildirimler**
- Yenileme ve trial bitişi öncesi push bildirim
- Kullanıcı kaç gün önce uyarılacağını seçer
- Bildirime dokunulunca ilgili aboneliğe doğrudan geçiş

**Tasarruf Takibi**
- "İptal ettim" veya "Durdurdum" aksiyonuyla anlık tasarruf hesabı
- Geçmiş iptal kayıtları saklanır

---

## Teknik Yığın

| Katman | Teknoloji |
|---|---|
| Mobil & Web | Flutter (Dart) — tek kod tabanı |
| Backend | Supabase (PostgreSQL + Auth) |
| Yerel Depolama | `shared_preferences` — Supabase kapalıyken tam fallback |
| Güvenli Depolama | `flutter_secure_storage` |
| Bildirimler | `flutter_local_notifications` (web'de otomatik devre dışı) |
| Routing | `go_router` — shell-based, deep link uyumlu |
| Durum Yönetimi | Provider + ChangeNotifier |
| Mimari | Feature-first vertical slice |

---

## Kurulum

### Gereksinimler

- [Flutter SDK](https://flutter.dev/get-started) **≥ 3.3.0**
- Android Studio (Android build için) veya Xcode (iOS/macOS için)
- [Supabase](https://supabase.com) hesabı (ücretsiz plan yeterli)

---

### 1 — Repoyu klonla

```bash
git clone https://github.com/Krayirhan/SubscriptTrack.git
cd SubscriptTrack
```

---

### 2 — Kurulum scriptini çalıştır

Repo kökünde platforma göre tek komut:

**Mac / Linux:**
```bash
chmod +x setup.sh && ./setup.sh
```

**Windows:**
```
setup.bat
```

Script şunları otomatik yapar:
- Flutter kurulu mu kontrol eder
- `mobile/.env` dosyasını oluşturur (`.env.example`'dan kopyalar)
- Supabase anahtarlarını girmen gerekiyorsa seni uyarır
- `flutter pub get` ile bağımlılıkları indirir

> İlk çalıştırmada script `.env`'i oluşturup durur — anahtarları gir, sonra tekrar çalıştır.

---

### 3 — Supabase anahtarlarını ayarla

`.env` dosyası `mobile/` klasörünün **içinde** olmalıdır. Farklı bir konumda olursa uygulama Supabase'e bağlanamaz.

```bash
cd mobile
cp .env.example .env
```

`.env` dosyasını aç ve değerleri gir:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
```

**Değerleri nereden alırsın:**
[Supabase Dashboard](https://supabase.com/dashboard) → Projen → **Project Settings** → **API**
- `SUPABASE_URL` → "Project URL"
- `SUPABASE_ANON_KEY` → "anon public" key

> **Not:** `.env` dosyası `.gitignore`'dadır — Git'e yüklenmez. Her geliştirici kendi `.env`'ini oluşturmalıdır.

---

### 4 — Çalıştır

```bash
make web        # Tarayıcıda aç
make install    # APK derle + USB'li telefona kur
```

---

## Komutlar

| Komut | Ne yapar |
|---|---|
| `make setup` | `.env` kontrolü + `flutter pub get` |
| `make web` | Chrome'da açar (Supabase bağlantılı) |
| `make android` | Release APK derler |
| `make install` | APK derler + USB'li telefona kurar |
| `make clean` | Build çıktılarını temizler |

**`make` olmadan (Windows):**

```bash
# Web
flutter run -d chrome --dart-define-from-file=.env

# APK derle
flutter build apk --release --dart-define-from-file=.env

# Telefona kur (USB bağlı)
adb install -r build/app/outputs/flutter-apk/app-release.apk
```

---

## Proje Yapısı

```
SubscriptTrack/
├── mobile/                          # Flutter uygulaması
│   ├── lib/
│   │   ├── app/                     # Router, shell, tema
│   │   ├── core/                    # Ortak altyapı
│   │   │   ├── config/              # EnvironmentConfig
│   │   │   ├── services/            # Bildirim, token, sync
│   │   │   └── storage/             # LocalStorage wrapper
│   │   └── features/                # Feature-first modüller
│   │       ├── auth/
│   │       ├── subscriptions/
│   │       ├── dashboard/
│   │       ├── calendar/
│   │       ├── savings/
│   │       ├── notifications/
│   │       └── settings/
│   ├── android/
│   ├── web/
│   ├── .env                         # Gitignore'da — sen oluşturursun
│   ├── .env.example                 # Şablon
│   └── Makefile
├── SubscriptTrack-Documentation/    # Ürün ve mimari dokümanlar
└── README.md
```

---

## Dokümantasyon

| Dosya | İçerik |
|---|---|
| [PRODUCT.md](SubscriptTrack-Documentation/PRODUCT.md) | Vizyon, MVP kapsamı, kullanıcı hikayeleri |
| [ARCHITECTURE.md](SubscriptTrack-Documentation/ARCHITECTURE.md) | Sistem mimarisi ve bileşenler |
| [DATA_MODEL.md](SubscriptTrack-Documentation/DATA_MODEL.md) | Veri modeli ve alan tanımları |
| [MOBILE_ARCHITECTURE.md](SubscriptTrack-Documentation/MOBILE_ARCHITECTURE.md) | Flutter uygulama mimarisi |
| [NOTIFICATIONS.md](SubscriptTrack-Documentation/NOTIFICATIONS.md) | Bildirim sistemi |
| [SECURITY.md](SubscriptTrack-Documentation/SECURITY.md) | Güvenlik kararları |
| [CONTRIBUTING.md](SubscriptTrack-Documentation/CONTRIBUTING.md) | Katkı rehberi |

---

## Supabase olmadan çalışır mı?

Evet. `.env` dosyası yoksa veya boşsa uygulama **yerel modda** açılır:

- Kimlik doğrulama → SHA-256 + SharedPreferences
- Abonelikler → JSON → SharedPreferences
- Bildirimler → yerel push (FCM yok)

Veriler yalnızca cihazda kalır. Supabase bağlamak için `.env` dosyasını doldurup uygulamayı yeniden derlemek yeterli.

---

## Yol Haritası

- [ ] iOS sürümü
- [ ] Google & Apple ile giriş
- [ ] Çoklu para birimi kur gösterimi
- [ ] Widget (Ana ekran abonelik özeti)
- [ ] Veri dışa aktarma (CSV / JSON)
- [ ] Push bildirim — FCM / APNs tam entegrasyon

---

<div align="center">

Özel geliştirme aşamasında — © 2026 SubscriptTrack

</div>
