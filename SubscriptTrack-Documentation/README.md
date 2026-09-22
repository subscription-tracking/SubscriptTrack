# SubscriptTrack Dokümantasyonu

Bu klasör, SubscriptTrack mobil uygulamasının ürün kararlarını, teknik mimarisini, veri sözleşmelerini ve güncel çalışma durumunu içerir.

## Nereden başlanır

1. [CURRENT_STATUS.md](CURRENT_STATUS.md) — bugün çalışan ve kısmi olan özellikler
2. [PRODUCT.md](PRODUCT.md) — ürün kapsamı ve bilinçli sınırlar
3. [ARCHITECTURE.md](ARCHITECTURE.md) — sistem bileşenleri ve veri akışları
4. [MOBILE_ARCHITECTURE.md](MOBILE_ARCHITECTURE.md) — Flutter kod yapısı
5. [API.md](API.md) — Supabase ve API sözleşmesi
6. [DATA_MODEL.md](DATA_MODEL.md) — veritabanı varlıkları ve alanları
7. [TESTING.md](TESTING.md) — test yaklaşımı
8. [DEPLOYMENT.md](DEPLOYMENT.md) — build ve yayınlama

## Doküman haritası

| Konu | Belge |
|---|---|
| Güncel durum | [CURRENT_STATUS.md](CURRENT_STATUS.md) |
| Ürün ve özellik kapsamı | [PRODUCT.md](PRODUCT.md) |
| Kullanıcı akışları | [USER_FLOWS.md](USER_FLOWS.md) |
| Sistem mimarisi | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Flutter mobil mimarisi | [MOBILE_ARCHITECTURE.md](MOBILE_ARCHITECTURE.md) |
| İş kuralları | [DOMAIN.md](DOMAIN.md) |
| Veri modeli | [DATA_MODEL.md](DATA_MODEL.md) |
| API ve Edge Function sözleşmesi | [API.md](API.md) |
| Bildirim davranışı | [NOTIFICATIONS.md](NOTIFICATIONS.md) |
| Güvenlik ve gizlilik | [SECURITY.md](SECURITY.md) |
| Tasarım sistemi | [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) |
| Test ve izlenebilirlik | [TESTING.md](TESTING.md), [TEST_TRACEABILITY.md](TEST_TRACEABILITY.md) |
| Deployment | [DEPLOYMENT.md](DEPLOYMENT.md), [GITHUB_PAGES_SUPABASE.md](GITHUB_PAGES_SUPABASE.md) |
| Takım katkı kuralları | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Release kontrolü | [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) |

## Güncel teknik rapor

[Teknoloji ve Özellik Envanteri Markdown](../outputs/reports/SubscriptTrack_Teknik_Yapi_ve_Ozellik_Envanteri.md) · [Word sürümü](../outputs/reports/SubscriptTrack_Teknik_Yapi_ve_Ozellik_Envanteri.docx)

Bu rapor teknoloji yığınını, kod klasörlerini, veri akışlarını ve özelliklerin Aktif/Kısmi/Yok durumlarını tek belgede özetler.

## Arşiv

Tarihli sprint planları, eski release kanıtları ve tarihli Supabase envanterleri [archive/](archive) altında tutulur. Arşiv belgeleri geçmiş kanıt niteliğindedir; yeni geliştirme kararlarında güncel belgeler esas alınır.

## Doküman güncelleme kuralı

- Ürün kapsamı değişirse PRODUCT.md ve CURRENT_STATUS.md güncellenir.
- API veya Supabase davranışı değişirse API.md, DATA_MODEL.md ve ilgili migration aynı değişiklikte güncellenir.
- Mobil katman değişirse MOBILE_ARCHITECTURE.md ve gerekiyorsa USER_FLOWS.md güncellenir.
- Bildirim davranışı değişirse NOTIFICATIONS.md güncellenir.
- Önemli bir teknik karar alınırsa docs/ADR/ altında karar kaydı açılır.
