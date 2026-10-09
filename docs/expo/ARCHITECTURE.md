# Mimari — Expo Uygulaması

> Bu belge `expo/` uygulamasının klasör yapısını, katman kurallarını ve veri akışını tanımlar. Backend ve iş kuralları değişmez; buradaki kararlar yalnızca istemci içindir. Sistem bütünü için [ARCHITECTURE.md](../architecture/ARCHITECTURE.md), Flutter karşılığı için [MOBILE.md](../architecture/MOBILE.md) geçerlidir.

## Durum

**Uygulandı (Aşama 0):** klasör yapısı, Supabase istemcisi, para ve takvim modülleri, tema tokenları, durum görünümü ve offline şeridi. Feature katmanları (auth, subscriptions vb.) henüz yoktur.

## Değişmeyen backend

- Tek Supabase projesi. Ayrı staging yoktur ([MOBILE.md §154](../architecture/MOBILE.md)).
- İstemci doğrudan veritabanına bağlanmaz. Yalnızca Supabase yüzeyleri kullanılır: Auth, PostgREST, RPC, Realtime ve Edge Function'lar ([API.md](../reference/API.md)).
- Yetkilendirme JWT ve RLS ile yapılır. İstemcideki kullanıcı kimliğine güvenilmez.
- Para sunucuda `numeric` olarak, wire üzerinde ondalık string olarak taşınır.

## Klasör yapısı

```text
expo/
├── app/                      # Expo Router rotaları (yalnızca ekran dosyaları)
│   ├── _layout.tsx           # kök layout: tema ve Stack
│   └── index.tsx             # karşılama (Aşama 1'de oturum yönlendirmesi gelir)
├── src/
│   ├── core/                 # Uygulama genelinde, UI'dan bağımsız kod
│   │   ├── config/           # env okuma (EXPO_PUBLIC_*)
│   │   ├── supabase/         # tek Supabase istemcisi
│   │   ├── domain/           # Money ve diğer değer nesneleri
│   │   └── time/             # takvim günü, fatura döngüsü, saat dilimi
│   └── shared/
│       ├── design/           # tasarım tokenları (renk, boşluk, köşe, boyut)
│       └── widgets/          # yeniden kullanılabilir UI (AsyncStateView, OfflineBanner)
├── jest.config.js
├── app.json
└── tsconfig.json
```

Kurallar:

- `app/` yalnızca rota dosyalarını içerir. İş mantığı ve veri erişimi rotaların içinde yazılmaz; `src/` altındaki modüllerden çağrılır.
- `src/core/` UI bileşeni içermez. React Native'e bağımlılığı olmayan modüller (`money.ts`, `calendar.ts`) saf TypeScript'tir ve doğrudan test edilir.
- `src/shared/` ortak UI'dır. AGENTS.md gereği yeniden kullanılabilir parçalar burada tutulur (Flutter'daki `shared/widgets` ve `app/shell` karşılığı).
- Feature'lar Aşama 1'den itibaren `src/features/<ad>/` altında olacak: `data/` (Supabase çağrıları), `domain/` (saf kurallar), `ui/` (ekran bileşenleri). Bu yapı Flutter'daki feature katmanlarıyla eşlenir.

## Katman kuralları

| Katman | Görebilir | Görmez |
|---|---|---|
| `app/` (rotalar) | `src/features`, `src/shared` | Supabase istemcisini doğrudan çağırmaz |
| `features/*/ui` | `domain`, `shared`, veri hook'ları | Supabase'i doğrudan çağırmaz (veri katmanı üzerinden) |
| `features/*/data` | `core/supabase`, `domain` | UI bileşenleri |
| `core/domain`, `core/time` | Yalnızca kendi içleri | React Native, Supabase, UI |
| `shared/design` | Yalnızca sabitler | Her şey |

Bu kurallar Flutter'daki `architecture_test.dart` benzeri bir test ile zorlanacaktır (Aşama 1'de eklenecek).

## Para ve tarih

- **Para:** `Money` tam sayı minör birimde tutulur. `number` yalnızca tam sayı minör birimler için kullanılır; güvenli tam sayı aşılırsa hata verilir. Floating point ile toplama yapılmaz.
- **Yuvarlama:** Çarpma ve bölmede yarım durumda sıfırdan uzağa yuvarlanır (Flutter `round()` ile aynı). Yuvarlama yalnızca bu sınırda yapılır.
- **Gösterim:** `Money.amount` yalnızca görüntü içindir; kalıcı veri veya API hesabında kullanılmaz.
- **Takvim:** Tarihler `CivilDate` (yıl/ay/gün) olarak taşınır. Saat dilimi ve yaz saati bu hesaplara girmez. Kullanıcının "bugünü" `zoneToday(timeZone)` ile IANA saat diliminde çözülür.
- **Fatura döngüsü:** Ay tabanlı döngüler faturalama gününü korur (31 Ocak → 28 Şubat → 31 Mart).
- **Döngü anahtarları:** Flutter enum'u `weekly`, `monthly`, `quarterly`, `yearly` değerlerini kullanır. [PRODUCT §6.2](../product/PRODUCT.md) "altı aylık" döngüyü de listeler, ancak kodda bu döngü yoktur. Expo tarafı kodu baz alır; fark [PARITY](PARITY.md) içinde karar bekleyen konu olarak izlenecektir.

## Durum ve veri akışı

- **Sunucu verisi:** TanStack Query ile yönetilir (önbellek, yeniden deneme, geçersiz kılma). Sorgu anahtarları kullanıcı kimliğini içerir; oturum değişince önbellek ayrılır.
- **Yerel UI durumu:** Küçük bir store (Zustand) ile tutulur. Sunucu verisini bu store'a kopyalanmaz.
- **Realtime:** `subscriptions` tablosu Realtime yayınındadır. Olaylar sorgu önbelleğini geçersiz kılar; gelen satır yerel listeyle birleştirilir ([API.md §6](../reference/API.md)).
- **Offline (Aşama 3):** Son veri cache'i ve yazma kuyruğu eklenecektir. Finansal cache güvenli depolamada tutulur ([LIBRARIES.md](LIBRARIES.md)).

## Hata modeli

- Supabase hataları tek bir `AppError` biçimine çevrilir: kod, kullanıcıya gösterilecek Türkçe mesaj ve yeniden denenebilirlik bilgisi.
- Ham sunucu metni kullanıcıya gösterilmez (Flutter'daki `error_messages.dart` karşılığı).
- Her veri ekranı [AsyncStateView](../../expo/src/shared/widgets/AsyncStateView.tsx) ile loading, error, empty ve ready durumlarını gösterir. Offline durumu [OfflineBanner](../../expo/src/shared/widgets/OfflineBanner.tsx) ile ayrıca belirtilir.

## Tasarım tokenları

- [tokens.ts](../../expo/src/shared/design/tokens.ts) Flutter `app_colors.dart` ve `app_tokens.dart` değerlerini birebir taşır.
- Yalnızca koyu tema vardır. Açık tema planlıdır ([CURRENT_STATUS](../CURRENT_STATUS.md)).
- Ekranlar renk, boşluk ve köşe değerlerini doğrudan yazmaz; tokenlardan okur.

## Test stratejisi

- **Birim:** `core/` altındaki saf modüller (`money.test.ts`, `calendar.test.ts`). Flutter testlerinden türetilmiştir.
- **Bileşen:** `shared/` altındaki UI (`AsyncStateView.test.tsx`), React Native Testing Library ile.
- **Derleme:** `npm run typecheck` ve `npx expo export --platform android`.
- **Cihaz:** Yerel bildirim, biyometri, secure storage ve Realtime gibi davranışlar yalnızca cihazda doğrulanır ([DEVICE_ACCEPTANCE.md](../operations/DEVICE_ACCEPTANCE.md)).

## Bilinçli olarak yapılmayanlar

- Web uygulaması: Abonelik dashboard'u web'de yapılmaz ([AGENTS.md](../../AGENTS.md)). Expo web hedefi kurulmadı.
- Uzak push (FCM/APNs): kullanılmaz ([ADR 0009](../decisions/0009-supabase-only-architecture.md)).
- Ayrı staging backend: Mevcut proje ile devam edilir.
