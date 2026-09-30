# SubscriptTrack Dokümantasyonu

Bu klasör, SubscriptTrack'in ürün kararlarını, mimarisini, veri ve API referansını, operasyon süreçlerini ve karar kayıtlarını içerir. **Tek doküman kökü burasıdır.** Depo kökündeki `README.md` yalnızca kısa tanıtımdır.

## Nereden başlanır

1. [CURRENT_STATUS.md](CURRENT_STATUS.md) — bugün ne çalışıyor, ne kısmi, ne planlı
2. [product/PRODUCT.md](product/PRODUCT.md) — ürün kapsamı ve bilinçli sınırlar
3. [architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md) — sistem (Supabase-only)
4. [architecture/MOBILE.md](architecture/MOBILE.md) — Flutter kod yapısı
5. [reference/API.md](reference/API.md) ve [reference/DATA_MODEL.md](reference/DATA_MODEL.md)

## Harita

| Klasör | Belge | Konu |
|---|---|---|
| kök | [CURRENT_STATUS](CURRENT_STATUS.md) | Özellik durumu, sürümler, dağıtım ve CI (tek kaynak) |
| product | [PRODUCT](product/PRODUCT.md) · [USER_FLOWS](product/USER_FLOWS.md) · [DOMAIN](product/DOMAIN.md) · [DESIGN_SYSTEM](product/DESIGN_SYSTEM.md) · [ANALYTICS](product/ANALYTICS.md) | Ürün, akışlar, iş kuralları, tasarım, ölçüm planı |
| architecture | [ARCHITECTURE](architecture/ARCHITECTURE.md) · [MOBILE](architecture/MOBILE.md) · [NOTIFICATIONS](architecture/NOTIFICATIONS.md) · [SECURITY](architecture/SECURITY.md) | Sistem, mobil yapı, bildirim, güvenlik |
| reference | [DATA_MODEL](reference/DATA_MODEL.md) · [API](reference/API.md) · [SUPABASE_LIVE_STATUS](reference/SUPABASE_LIVE_STATUS.md) | Şema, arayüz sözleşmesi, canlı ortam |
| operations | [TESTING](operations/TESTING.md) · [TEST_TRACEABILITY](operations/TEST_TRACEABILITY.md) · [RELEASE](operations/RELEASE.md) · [DEVICE_ACCEPTANCE](operations/DEVICE_ACCEPTANCE.md) · [CONTRIBUTING](operations/CONTRIBUTING.md) | Test, yayın, cihaz kabulü, katkı |
| decisions | [ADR 0001–0009](decisions/) | Mimari kararlar |
| quality | [Kalite raporu](quality/index.html) · [Ekran incelemesi](quality/screen-review.md) · [Doküman incelemesi](quality/docs-review.md) | **Üretilen** ölçümler; elle düzenlenmez |
| archive | [archive/](archive/) | Tarihsel kanıt; değiştirilmez |

## Durum etiketleri

Her belge veya bölüm, anlattığı şeyin durumunu belirtir:

| Etiket | Anlam |
|---|---|
| **Uygulandı** | Kodda ve/veya canlı ortamda vardır |
| **Kısmi** | Kod var, doğrulama (cihaz, canlı hesap) eksik |
| **Planlı** | Hedeflenen, henüz yok |
| **Kapsam dışı** | Bilinçli olarak yapılmıyor |

## Her bilginin tek sahibi

| Bilgi | Tek kaynak |
|---|---|
| Özellik durumu, dağıtım, CI | [CURRENT_STATUS.md](CURRENT_STATUS.md) |
| Flutter/Dart/paket sürümleri | `mobile/pubspec.lock` (belgelerde kopyalanmaz) |
| Test sayısı, kapsama, kalite puanı | [quality/](quality/index.html) (belgelerde elle yazılmaz) |
| Canlı Supabase durumu | [SUPABASE_LIVE_STATUS.md](reference/SUPABASE_LIVE_STATUS.md) |
| Şema ve arayüz | [DATA_MODEL.md](reference/DATA_MODEL.md), [API.md](reference/API.md) |
| Kararlar | [decisions/](decisions/) (yeni karar = yeni ADR; eski ADR silinmez, "geçersiz" işaretlenir) |
| Cihaz test sonuçları | [DEVICE_ACCEPTANCE.md](operations/DEVICE_ACCEPTANCE.md) |

## Güncelleme kuralları

- Ürün kapsamı değişirse PRODUCT ve CURRENT_STATUS güncellenir.
- Şema, RPC veya Edge Function değişirse DATA_MODEL, API ve migration aynı değişiklikte güncellenir; canlı ortam değiştiyse SUPABASE_LIVE_STATUS yeniden alınır.
- Mobil katman değişirse MOBILE (ve gerekiyorsa USER_FLOWS) güncellenir.
- Bildirim davranışı değişirse NOTIFICATIONS güncellenir.
- Önemli teknik karar ADR ile kaydedilir.
- Belgeler yalnızca git'te izlenen dosyalara bağlanır; yerel, git dışı çıktı klasörü bağlanmaz.
- `python tools/docs/check_docs.py` bağlantıları, sürüm ve sayı tutarlılığını denetler (CI'da çalışır).
