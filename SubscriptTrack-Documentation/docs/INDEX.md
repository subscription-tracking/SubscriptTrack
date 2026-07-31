# Dokümantasyon İndeksi

- [`../SPRINT_PLAN.md`](../SPRINT_PLAN.md) — Uygulama geliştirme sprintleri, görevler ve kabul kriterleri

## Ürün

- [`../PRODUCT.md`](../PRODUCT.md) — Ürün vizyonu, hedef kullanıcı, MVP ve metrikler
- [`../USER_FLOWS.md`](../USER_FLOWS.md) — Ana kullanıcı akışları ve hata durumları
- [`../ANALYTICS.md`](../ANALYTICS.md) — Ölçüm modeli ve event sözleşmesi

## Mimari

- [`../ARCHITECTURE.md`](../ARCHITECTURE.md) — Üst düzey sistem mimarisi
- [`../MOBILE_ARCHITECTURE.md`](../MOBILE_ARCHITECTURE.md) — Mobil uygulama yapısı
- [`../DOMAIN.md`](../DOMAIN.md) — İş kuralları ve kavramlar
- [`../DATA_MODEL.md`](../DATA_MODEL.md) — Veri tabloları ve ilişkiler
- [`../API.md`](../API.md) — REST API sözleşmesi
- [`../NOTIFICATIONS.md`](../NOTIFICATIONS.md) — Bildirim üretimi ve teslimatı

## Tasarım ve kalite

- [`../DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md) — Token, component ve template sistemi
- [`../SECURITY.md`](../SECURITY.md) — Güvenlik ve gizlilik
- [`../TESTING.md`](../TESTING.md) — Test stratejisi
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — Ekip geliştirme kuralları

## Mimari karar kayıtları

- [`ADR/0001-mobile-first-product.md`](ADR/0001-mobile-first-product.md)
- [`ADR/0002-contract-first-vertical-slices.md`](ADR/0002-contract-first-vertical-slices.md)
- [`ADR/0003-backend-driven-notifications.md`](ADR/0003-backend-driven-notifications.md)
- [`ADR/0004-money-as-decimal.md`](ADR/0004-money-as-decimal.md)
- [`ADR/0005-utc-and-user-timezone.md`](ADR/0005-utc-and-user-timezone.md)
- [`ADR/0006-archive-over-delete.md`](ADR/0006-archive-over-delete.md)
- [`ADR/0007-no-bank-integration.md`](ADR/0007-no-bank-integration.md)

## Bakım kuralı

Bir davranış değiştiğinde önce tek doğru kaynak belirlenir:

- Ürün kapsamı: PRODUCT
- İş kuralı: DOMAIN
- Veri şekli: DATA_MODEL
- HTTP sözleşmesi: API
- Bildirim davranışı: NOTIFICATIONS
- Görsel kural: DESIGN_SYSTEM
- Teknik karar gerekçesi: ADR
