# SubscriptTrack — Expo Uygulaması

> Bu klasör, Flutter sürümüne **paralel** geliştirilen Expo (React Native + TypeScript) uygulamasının belgelerini içerir. Ürün kapsamı, iş kuralları ve API sözleşmesi tek kaynaktır ve [docs/](../README.md) altında yaşar; burada kopyalanmaz, bağlanır.

## Durum

**Planlı / Başlangıç.** Kod iskeleti var: `expo/` klasöründe Expo Router, boş bir tab/stack yapısı ve iki ekran (`app/_layout.tsx`, `app/index.tsx`). Abonelik, auth, offline ve bildirim özellikleri henüz yazılmadı. Flutter sürümü ([mobile/](../../mobile/)) çalışan referanstır ve bu süreçte değiştirilmez.

Özellik durumunun tek kaynağı [CURRENT_STATUS.md](../CURRENT_STATUS.md)'dir. Burada yalnızca Expo tarafının durumu tutulur.

## Neden paralel?

Flutter kod tabanı iOS build'i hiç derlenmemiş bir durumda, Mac erişimi olmadan iOS'ta doğrulama yapılamıyor. Expo ile EAS Build üzerinden Windows'tan iOS paketi alınabilir. Karar henüz kesinleşmedi: Expo sürümü iOS ve Android'de doğrulanana kadar [ADR 0008](../decisions/0008-flutter-mobile-framework.md) yürürlüktedir. Nihai karar, paralel sürümlerin karşılaştırılmasından sonra ayrı bir ADR ile verilir.

## Kapsam ve ilkeler

- Hedef, Flutter sürümündeki özelliklerin birebir karşılığıdır. Kapsam genişletilmez ([PRODUCT.md](../product/PRODUCT.md)).
- Ürün kuralları aynıdır: [DOMAIN.md](../product/DOMAIN.md), [USER_FLOWS.md](../product/USER_FLOWS.md), [DESIGN_SYSTEM.md](../product/DESIGN_SYSTEM.md).
- Mobil istemci Supabase'e yalnızca [API.md](../reference/API.md) üzerinden bağlanır; doğrudan veritabanı bağlantısı yoktur ([ADR 0009](../decisions/0009-supabase-only-architecture.md)).
- Para: floating point yok; minör birim veya decimal ([ADR 0004](../decisions/0004-money-as-decimal.md)).
- Tarih: UTC + kullanıcının IANA zaman dilimi ([ADR 0005](../decisions/0005-utc-and-user-timezone.md)).
- Silme yerine iptal, sona erme ve arşiv ([ADR 0006](../decisions/0006-archive-over-delete.md)).
- Yerel bildirimler cihaz üzerinde zamanlanır; uzak push (FCM/APNs) kullanılmaz ([ADR 0009](../decisions/0009-supabase-only-architecture.md), [NOTIFICATIONS.md](../architecture/NOTIFICATIONS.md)).
- Her yeni ekran için loading, error, empty ve offline durumları planlanır.

## Belge haritası

| Belge | İçerik | Durum |
|---|---|---|
| [README.md](README.md) | Bu belge: amaç, durum, ilkeler | Yazıldı |
| [PARITY.md](PARITY.md) | Flutter ekranları, rotaları ve Expo karşılıkları | Yazıldı |
| [ROADMAP.md](ROADMAP.md) | Aşamalar, çıkış kriterleri, ilerleme | Yazıldı |
| SETUP.md | Geliştirme ortamı, env değişkenleri, iOS için Mac/EAS | Planlı |
| ARCHITECTURE.md | Klasör yapısı, routing, state, Supabase client, hata modeli | Planlı |
| LIBRARIES.md | Expo paketleri ve seçim gerekçeleri | Planlı |

## Çalışma kuralları

- Önce [CURRENT_STATUS.md](../CURRENT_STATUS.md), [PRODUCT.md](../product/PRODUCT.md) ve [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) okunur.
- Expo SDK davranışı için `expo/AGENTS.md` kuralı geçerlidir: sürüme özgü dokümantasyon okunmadan API kullanılmaz.
- Paket kurulumu `npx expo install` ile yapılır.
- Flutter kodu (`mobile/`) bu klasörden değiştirilmez.
- Ürün kararı değişirse önce kullanıcıdan onay alınır.
