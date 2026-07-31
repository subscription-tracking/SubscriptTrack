# SubscriptTrack

SubscriptTrack; kullanıcıların dijital aboneliklerini, ücretsiz denemelerini, yaklaşan yenilemelerini ve tahmini harcamalarını iOS ve Android üzerinden yönetmesini sağlayan mobil abonelik kontrol uygulamasıdır.

## Ürün özeti

- Banka veya kredi kartı hesabı bağlamadan çalışır.
- Abonelikler manuel olarak veya hazır servis kataloğundan eklenir.
- Mobil push, uygulama içi ve isteğe bağlı e-posta hatırlatmaları sunar.
- Harcamaları para birimi bazında ayrı gösterir.
- Kullanıcıya iptal, durdurma ve arşivleme kararlarında yardımcı olur.
- İptal edilen aboneliklerden oluşan tahmini tasarrufu görünür kılar.

## Platform kapsamı

| Platform | Rol |
|---|---|
| iOS uygulaması | Birincil ürün istemcisi |
| Android uygulaması | Birincil ürün istemcisi |
| Web sitesi | Tanıtım, SEO, yardım, iptal rehberleri ve yasal sayfalar |
| Backend | Kimlik, veri, bildirim, senkronizasyon ve iş kuralları |

## Dokümantasyon

Başlangıç noktası: [`docs/INDEX.md`](docs/INDEX.md)

Temel dokümanlar:

- [`PRODUCT.md`](PRODUCT.md): Ne yapıyoruz ve neden?
- [`ARCHITECTURE.md`](ARCHITECTURE.md): Sistem nasıl bölünüyor?
- [`DOMAIN.md`](DOMAIN.md): İş kavramları ve kuralları neler?
- [`DATA_MODEL.md`](DATA_MODEL.md): Veriler nasıl saklanıyor?
- [`API.md`](API.md): Mobil uygulama ve backend nasıl konuşuyor?
- [`MOBILE_ARCHITECTURE.md`](MOBILE_ARCHITECTURE.md): Mobil kod yapısı nasıl düzenleniyor?
- [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md): Görsel sistem nasıl tutarlı kalıyor?
- [`USER_FLOWS.md`](USER_FLOWS.md): Kullanıcı görevleri nasıl tamamlıyor?
- [`NOTIFICATIONS.md`](NOTIFICATIONS.md): Hatırlatmalar nasıl üretiliyor ve teslim ediliyor?
- [`SECURITY.md`](SECURITY.md): Kullanıcı verileri nasıl korunuyor?
- [`ANALYTICS.md`](ANALYTICS.md): Ürün başarısı nasıl ölçülüyor?
- [`TESTING.md`](TESTING.md): Doğruluk nasıl doğrulanıyor?
- [`CONTRIBUTING.md`](CONTRIBUTING.md): Ekip geliştirme kuralları neler?

## Güncel ürün kararı

Ürün iOS ve Android için geliştirilecek bir mobil uygulamadır. Web sitesi yalnızca tanıtım, SEO, yardım, iptal rehberleri ve yasal sayfalar için destekleyici yüzdür; tam abonelik dashboard'u değildir. Mobil uygulamada push bildirim, mobil deep link ve son veriyi görüntüleme amaçlı offline cache bulunur. Bu karar, bu bölümdeki önceki teknoloji alternatiflerinin önündedir.

## Referans mimari durumu

Bu paket framework bağımsız yazılmıştır. Aşağıdaki teknoloji kararları uygulama başlamadan önce ADR ile kesinleştirilmelidir:

- Mobil framework: Flutter / React Native / native platformlar
- Backend: Spring Boot / Supabase / başka bir REST backend
- Kimlik sağlayıcı: Backend tabanlı OAuth / Supabase Auth / Firebase Auth
- Push altyapısı: FCM + APNs
- Analytics ve crash reporting sağlayıcıları

Dokümanlardaki `Önerilen` ifadeleri kabul edilmiş karar değil, başlangıç önerisidir.

## Temel geliştirme yaklaşımı

1. Ürün akışları ve domain kuralları netleştirilir.
2. API sözleşmesi oluşturulur.
3. Mobil ve backend aynı sözleşme üzerinde paralel ilerler.
4. Özellikler dikey dilimler halinde uçtan uca tamamlanır.
5. Her önemli mimari karar `docs/ADR/` altında kaydedilir.
