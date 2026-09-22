# SubscriptTrack Teknoloji ve Özellik Envanteri

_Güncelleme: 22 Eylül 2026_

Bu rapor, SubscriptTrack’in teknoloji yığınını, kod yapısını, veri akışlarını ve mevcut özellik durumunu özetler.

## Ürün özeti

SubscriptTrack, dijital abonelikleri iOS ve Android üzerinde takip eden mobil uygulamadır. Kullanıcı yenileme tarihlerini, ücretsiz denemeleri, para birimi bazlı tahmini harcamaları, ödeme geçmişini ve tasarruflarını yönetir.

Banka veya kredi kartı bağlanmaz. Karttan para çekilmez. Ödeme yöntemi alanı yalnızca kullanıcının yazdığı etikettir.

## Teknoloji yığını

| Katman | Teknoloji | Kullanım |
|---|---|---|
| Mobil | Flutter 3.44.8, Dart 3.12.2 | iOS, Android ve web build |
| UI ve state | Material UI, Provider, ChangeNotifier | Ekran ve durum yönetimi |
| Navigasyon | go_router | Auth guard ve deep-link |
| Kimlik | Supabase Auth | Kayıt, giriş, doğrulama, şifre akışları |
| Veri | PostgreSQL, PostgREST, RPC | Abonelik ve kullanıcı verileri |
| Güvenlik | JWT, Row Level Security | Kullanıcı veri izolasyonu |
| Canlı senkron | Supabase Realtime | Abonelik değişiklikleri |
| Sunucu | Deno TypeScript Edge Functions | Export, silme, payment, destek |
| Bildirim | flutter_local_notifications, timezone | Cihaz yerel bildirimleri |
| Yerel depolama | flutter_secure_storage, cache | Hassas veri ve offline kullanım |
| Para | Money / minor unit | Güvenli tutar hesaplama |
| CI/CD | GitHub Actions, GitHub Pages | Web deploy ve kalite kontrolleri |

## Kod yapısı

```text
mobile/lib/
├── app/                    Router, shell ve tema
├── core/                   Domain, network, storage ve servisler
└── features/
    ├── auth/               Kayıt, giriş, şifre ve e-posta
    ├── subscriptions/      Abonelik domain, repository ve ekranlar
    ├── dashboard/          Toplamlar ve yaklaşan yenilemeler
    ├── calendar/           Aylık takvim
    ├── notifications/      Uygulama içi bildirimler
    ├── stats/              İstatistik ve ödeme geçmişi
    ├── savings/            Tasarruf olayları
    └── settings/           Profil, export, ödeme etiketleri, destek

backend/
├── migrations/              PostgreSQL ve RLS migration’ları
├── supabase/functions/      Hesap, export, payment ve support/catalog
└── scripts/                 Canlı inventory ve smoke testleri
```

## Temel veri akışı

```text
Flutter ekranı
  → Controller
  → Repository veya Supabase Function
  → Auth, PostgREST, RPC veya Realtime
  → PostgreSQL
  → Cache ve arayüz güncellemesi
```

## Özellik durumu

| Özellik | Durum | Açıklama |
|---|---|---|
| Onboarding | Aktif | İlk açılış akışı |
| E-posta kayıt ve giriş | Aktif | Supabase Auth ve local fallback |
| Şifremi unuttum | Kısmi | Kod ve reset ekranı var; gerçek mail testi gerekli |
| E-posta doğrulama | Kısmi | Oturumsuz sign-up doğru ele alınıyor; SMTP testi gerekli |
| Google / Apple giriş | Kısmi | Kod yolu var; sağlayıcı ayarı gerekli |
| Abonelik CRUD | Aktif | Supabase RPC/PostgREST ve RLS |
| Abonelik durumları | Aktif | Active, paused, cancelled, expired, archived |
| Servis kataloğu | Aktif | service_catalog ve mobil fallback |
| Payment label | Aktif | payment-methods Function GET/PUT |
| Ödeme geçmişi | Aktif | Ekleme, düzenleme, silme |
| Ödendi ve yenilendi | Aktif | Payment event ve tarih ilerletme |
| Dashboard / takvim | Aktif | Toplamlar, yaklaşan yenilemeler |
| Yerel bildirim | Aktif | Yenileme, trial, test ve erteleme |
| Uzak push | Yok | FCM/APNs kullanılmıyor |
| Offline cache/kuyruk | Aktif | Son veri ve FIFO mutation queue |
| Realtime çoklu cihaz | Kısmi | Kod ve publication hazır; iki oturum testi gerekli |
| CSV export/import | Aktif | Canonical 11 alanlı şema |
| Hesap silme | Aktif | delete-account v2; canlı test gerekli |
| Destek ticket | Aktif | Tablo, ekran ve Edge Function |
| Biyometrik kilit | Kısmi | Kod ve 5 dakika timeout; cihaz testi gerekli |

## Supabase backend

| Bileşen | Durum | İşlev |
|---|---|---|
| delete-account v2 | ACTIVE | Auth hesabı ve ilişkili verileri silme |
| process-export v2 | ACTIVE | CSV export |
| payment-methods v1 | ACTIVE | Ödeme etiketi GET/PUT |
| support-catalog v1 | ACTIVE | Servis kataloğu ve destek ticket |
| 028 migration | Uygulandı | Payment methods API/RLS |
| 029 migration | Uygulandı | Support tickets ve service catalog |
| 030 migration | Uygulandı | Realtime publication |

## Bildirim sistemi

Bildirimler FCM/APNs ile sunucudan gönderilmez. Uygulama, yenileme ve trial tarihlerini okuyarak bildirimleri cihaz üzerinde planlar.

- Varsayılan saat: 09:00
- Yenileme seçenekleri: 1, 3 veya 7 gün önce
- Trial seçenekleri: 7, 3 ve 1 gün önce
- Erteleme: 30 dakika
- Maksimum bekleyen bildirim: 60
- Bildirime dokununca ilgili abonelik açılır

## Kimlik ve şifre akışı

```text
Forgot password
  → Supabase resetPasswordForEmail
  → e-posta bağlantısı
  → Pages URL veya subscripttrack://auth-callback
  → passwordRecovery
  → ResetPasswordScreen
  → updateUser(password)
```

Gerçek e-posta teslimi Supabase Auth mail ayarlarına, web dönüşü ise Pages adresinin Auth URL Configuration’a eklenmesine bağlıdır.

## Dağıtım

| Dağıtım | Güncel değer |
|---|---|
| Branch | main |
| GitHub Pages | https://subscription-tracking.github.io/SubscriptTrack/ |
| Release APK | outputs/apk/SubscriptTrack-latest-release.apk |
| Teknik rapor DOCX | SubscriptTrack_Teknik_Yapi_ve_Ozellik_Envanteri.docx |
| Supabase project ref | tdbljrojcmyjwchawfif |

## Doğrulama

- flutter analyze: başarılı
- Mobil controller/UI testleri: başarılı
- Release APK build: başarılı
- GitHub Pages workflow: başarılı
- Supabase Functions: dört fonksiyon ACTIVE
- Live inventory: Auth, Storage ve ana tablolar erişilebilir

Gerçek hesap ve cihaz gerektiren e-posta, deep-link, hesap silme, export indirme ve iki oturumlu Realtime testleri ayrıca doğrulanmalıdır.

