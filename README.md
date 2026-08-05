# SubscriptTrack

Dijital aboneliklerinizi tek bir yerden yönetin. Netflix, Spotify, Adobe, ChatGPT — kaç aboneliğiniz olursa olsun, SubscriptTrack yenileme tarihlerini takip eder, yaklaşan ödemeleri bildirir ve iptal ettiğinizde ne kadar tasarruf ettiğinizi gösterir.

---

## Nedir?

Çoğu insan kaç aboneliğe sahip olduğunu bilmez. Ücretsiz denemeler ücretliye dönüşür, kullanılmayan servisler aylarca fatura keser. SubscriptTrack bu sorunu çözer:

- Tüm aboneliklerinizi görün, yenileme tarihlerini kaçırmayın
- Trial bitiş tarihleri için özel bildirim alın
- İptal ettiğinizde aylık ve yıllık tasarrufunuzu görün
- Banka hesabı veya kart bağlantısı gerektirmez

---

## Özellikler

**Abonelik Yönetimi**
- İsim, fiyat, para birimi, fatura döngüsü ve yenileme tarihi ile abonelik ekle
- Haftalık, aylık, 3 aylık, 6 aylık, yıllık ve özel döngü desteği
- TRY, USD, EUR, GBP ve diğer ISO 4217 para birimleri
- `TRIAL → ACTIVE → PAUSED → CANCELLED → ARCHIVED` durum akışı
- Silme yerine arşivleme; geçmiş veriler korunur

**Dashboard**
- Para birimi bazında aylık ve yıllık tahmini toplam
- Önümüzdeki 7 gündeki yenilemeler
- Aktif deneme sayısı ve iptallerden doğan tasarruf

**Takvim**
- Aylık takvim görünümü
- Gün bazında yenileme listesi; normal ödeme, trial bitişi ve yüksek tutarlı yıllık ödeme ayrımı

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
| Mobil | Flutter (Dart) — iOS & Android |
| Yerel depolama | `shared_preferences`, `flutter_secure_storage` |
| Mimari | Feature-first, vertical slice |
| Durum yönetimi | Controller tabanlı |
| Routing | `app_router` (go_router uyumlu) |

---

## Proje Yapısı

```
SubscriptTrack/
├── mobile/                          # Flutter uygulaması
│   ├── lib/
│   │   ├── app/                     # Uygulama başlangıcı, router, shell, tema
│   │   ├── core/                    # Ortak altyapı (storage, errors, utils)
│   │   └── features/                # Feature-first modüller
│   │       ├── auth/                # Giriş & kayıt
│   │       ├── subscriptions/       # Abonelik CRUD
│   │       ├── dashboard/           # Ana ekran
│   │       ├── calendar/            # Takvim görünümü
│   │       ├── savings/             # Tasarruf takibi
│   │       ├── stats/               # İstatistikler
│   │       ├── settings/            # Kullanıcı ayarları
│   │       └── onboarding/          # İlk kullanım akışı
│   └── android/                     # Android platform dosyaları
├── SubscriptTrack-Documentation/    # Ürün ve mimari dokümanlar
└── scripts/                         # Yardımcı scriptler
```

---

## Kurulum

**Gereksinimler**
- Flutter SDK ≥ 3.3.0
- Dart SDK ≥ 3.3.0
- Android Studio veya Xcode (platform hedefine göre)

**Başlatma**

```bash
cd mobile
flutter pub get
flutter run
```

**Web'de Çalıştırma (Tarayıcı)**

```bash
cd mobile
flutter pub get
flutter run -d chrome
```

Uygulama Chrome'da açılır. Chrome yoksa `flutter devices` ile mevcut hedeflere bakılabilir.

---

## Dokümantasyon

Proje içi dokümanlar `SubscriptTrack-Documentation/` klasöründe:

| Dosya | İçerik |
|---|---|
| [PRODUCT.md](SubscriptTrack-Documentation/PRODUCT.md) | Vizyon, MVP kapsamı, kullanıcı hikayeleri |
| [ARCHITECTURE.md](SubscriptTrack-Documentation/ARCHITECTURE.md) | Sistem mimarisi ve bileşenler |
| [DATA_MODEL.md](SubscriptTrack-Documentation/DATA_MODEL.md) | Veri modeli ve alan tanımları |
| [API.md](SubscriptTrack-Documentation/API.md) | REST API sözleşmesi |
| [DESIGN_SYSTEM.md](SubscriptTrack-Documentation/DESIGN_SYSTEM.md) | Tasarım tokenleri ve bileşenler |
| [MOBILE_ARCHITECTURE.md](SubscriptTrack-Documentation/MOBILE_ARCHITECTURE.md) | Flutter uygulama mimarisi |
| [NOTIFICATIONS.md](SubscriptTrack-Documentation/NOTIFICATIONS.md) | Bildirim sistemi |
| [SECURITY.md](SubscriptTrack-Documentation/SECURITY.md) | Güvenlik kararları |
| [CONTRIBUTING.md](SubscriptTrack-Documentation/CONTRIBUTING.md) | Katkı rehberi |

---

## Yol Haritası

- [ ] Backend API (Supabase / Node.js)
- [ ] Push bildirim entegrasyonu (FCM / APNs)
- [ ] Google & Apple ile giriş
- [ ] Çoklu para birimi desteği ve kur gösterimi
- [ ] Veri dışa aktarma (CSV/JSON)
- [ ] iOS sürümü yayını

---

## Lisans

Bu proje şu an özel geliştirme aşamasındadır.
