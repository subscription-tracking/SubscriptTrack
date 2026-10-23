# Mimari — Expo Uygulaması

> Bu belge `expo/` uygulamasının klasör yapısını, katman kurallarını ve veri akışını tanımlar. Backend ve iş kuralları değişmez; buradaki kararlar yalnızca istemci içindir. Sistem bütünü için [ARCHITECTURE.md](../architecture/ARCHITECTURE.md), Flutter karşılığı için [MOBILE.md](../architecture/MOBILE.md) geçerlidir.

## Durum

**Durum: Kısmi — kod kapsamı geniş, geçiş kabulü açık (2026-10-10).** Auth, abonelik yaşam döngüsü, offline kuyruk/cache, analitik, bildirim, ayarlar, gizlilik ve CSV akışlarının Expo karşılığı vardır. Typecheck, birim testleri, lint, Expo Doctor, Android/iOS JS export ve Android AVD ana akış/CSV denemesi için mevcut kanıtlar [geçiş denetiminde](../quality/expo-migration-audit.md) ve [cihaz kabulünde](../operations/DEVICE_ACCEPTANCE.md) kayıtlıdır. Canlı çapraz hesap RLS, iki oturumlu Realtime, offline cihaz davranışı, PIN/secure-storage yükseltmesi, fiziksel Android ve iOS kabulü ile release doğrulaması açık kalır. Aşamalar ve gerçek kapılar [ROADMAP](ROADMAP.md) ile [REMAINING_SPRINTS](REMAINING_SPRINTS.md) içindedir; bu belgenin geri kalanı Expo istemci mimarisini anlatır.

### Oturum yönlendirmesi

[AuthGate](../../expo/app/_layout.tsx) oturum durumu belirlenene kadar yükleniyor gösterir, sonra [resolveRedirect](../../expo/src/features/auth/domain/sessionState.ts) kurallarını uygular:

| Durum | Hedef |
|---|---|
| Oturum yok, uygulama ekranı | `/login` |
| Oturum açık, auth ekranı veya callback | `/` (ana sayfa) |
| Şifre sıfırlama kurtarma modu | `/reset-password` |

E-posta bağlantıları (doğrulama, şifre sıfırlama) `subscripttrack://auth-callback?code=…` adresine gelir; [auth-callback](../../expo/app/auth-callback.tsx) rotası PKCE kodunu `exchangeCodeForSession` ile oturuma çevirir.

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
│   │   ├── storage/          # güvenli oturum deposu (SecureStore, parçalı)
│   │   ├── supabase/         # tek Supabase istemcisi
│   │   ├── domain/           # Money ve diğer değer nesneleri
│   │   └── time/             # takvim günü, fatura döngüsü, saat dilimi
│   ├── features/
│   │   └── auth/             # AuthProvider, data/ (Supabase çağrıları), domain/ (saf kurallar), ui/
│   └── shared/
│       ├── design/           # tasarım tokenları (renk, boşluk, köşe, boyut)
│       └── widgets/          # yeniden kullanılabilir UI (AsyncStateView, OfflineBanner, TextField, PrimaryButton)
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

Bu kurallar `expo/src/architecture.test.ts` ile otomatik korunur: sunum katmanı Supabase import etmez, domain SDK/veri/UI import etmez, veri katmanı UI import etmez, core/shared feature veri ve UI katmanlarını import etmez. TypeScript AST ve proje modül çözümlemesi static import/export, literal require ve dynamic import hedeflerini çözer; tüm kaynak dosyaları (provider/core/shared dahil) döngü kontrolüne girer. Domain sunum modellerinin saf `core/format/money`, `core/format/date`, `shared/design/palette` ve `shared/design/servicePalette` bağımlılıkları açık istisnalardır. Hesaplanmış dinamik import yolları çözülemez. 320 satır sınırı yardımcı ölçüttür; sorumluluk ayrımı ayrıca incelenir.

### İş akışı sınırları (12 Ekim 2026)

- Abonelik oluşturma ve ilk ödeme/hatırlatma takip yazımları `createSubscriptionWorkflow` tarafından yürütülür. UI açık kısmi başarı sonucunu gösterir; takip yazımlarının atomik olduğu iddia edilmez. Offline oluşturmanın mevcut ilk ödeme ve özel hatırlatma sınırları korunur.
- `subscriptionLocalStore` sürümlü `{version: 1, entries}` kayıtları yazar; eski geçerli dizileri okur. Queue/cache alanları domain decoder'larında doğrulanır; bozuk kuyruk silinmez veya gönderilmez. Kritik depo okuması eksik parça ve okuma/JSON hatalarını kayıt yokluğundan ayırır.
- Ağ/oturum adaptörleri ve seri yürütücü `subscriptionRuntime` içindedir. Eşitleme koordinatörü aşamalı FIFO akışını korur; ortak seri zincir bilinçli olarak sürdürülür.
- Atomik yenilemenin RPC ve hata çevirisi `renewalRepository` içindedir. Özellik anahtarı ve eski yol korunur.
- PIN doğrulama, upgrade ve kalıcı deneme sayacı `pinUnlockService` içinde seri yürür. Güvenli depo yüklenene kadar oturumlu içerik gösterilmez; hata durumunda tekrar deneme sunulur. Native kabul ayrıca gerekir.
- Ödeme geçmişi mutation'ları `usePaymentHistoryActions`, CSV dosya okuması `csvFile`, durum fallback hesabı `csvStatusPreview` sınırlarına ayrılmıştır.

## Para ve tarih

- **Para:** `Money` tam sayı minör birimde tutulur. `number` yalnızca tam sayı minör birimler için kullanılır; güvenli tam sayı aşılırsa hata verilir. Floating point ile toplama yapılmaz.
- **Yuvarlama:** Çarpma ve bölmede yarım durumda sıfırdan uzağa yuvarlanır (Flutter `round()` ile aynı). Yuvarlama yalnızca bu sınırda yapılır.
- **Gösterim:** `Money.amount` yalnızca görüntü içindir; kalıcı veri veya API hesabında kullanılmaz.
- **Takvim:** Tarihler `CivilDate` (yıl/ay/gün) olarak taşınır. Saat dilimi ve yaz saati bu hesaplara girmez. Kullanıcının "bugünü" `zoneToday(timeZone)` ile IANA saat diliminde çözülür.
- **Fatura döngüsü:** Ay tabanlı döngüler faturalama gününü korur (31 Ocak → 28 Şubat → 31 Mart).
- **Döngü anahtarları:** Flutter enum'u `weekly`, `monthly`, `quarterly`, `yearly` değerlerini kullanır. [PRODUCT §6.2](../product/PRODUCT.md) "altı aylık" döngüyü de listeler, ancak kodda bu döngü yoktur. Expo tarafı kodu baz alır; fark [PARITY](PARITY.md) içinde karar bekleyen konu olarak izlenecektir.

## Durum ve veri akışı

- **Sunucu verisi:** TanStack Query ile yönetilir (önbellek, yeniden deneme, geçersiz kılma). Sorgu anahtarları kullanıcı kimliğini içerir; oturum değişince önbellek ayrılır.
- **Yerel UI durumu:** React state/context ile tutulur. Sunucu verisinin sahibi TanStack Query'dir.
- **Realtime:** `subscriptions` tablosu Realtime yayınındadır. Olaylar sorgu önbelleğini geçersiz kılar; gelen satır yerel listeyle birleştirilir ([API.md §6](../reference/API.md)).
- **Bildirim merkezi yerel durumu:** Okunmuş ve kapatılmış bildirim kimlikleri güvenli depoda kullanıcı kimliğine ayrılmış anahtarlarla saklanır. Önceki ortak anahtarlar sahipliği belirlenemediği için aktarılmaz; sunucu `read_at` okunma durumunu geri sağlayabilir.
- **Sekme rozeti:** Okunmamış sayı `read_at` ile beraber oturum sahibinin yerel okunma/kapatma kimliklerini kullanır. Kullanıcı bildirimi okur veya kapatır kapatmaz rozet sunucu yanıtını beklemeden güncellenir (`notificationCenter.test.ts`).
- **Bildirim tercihleri:** Etkinlik ve gün sayısı `profiles` üzerinden, gönderim saati Auth kullanıcı meta verisi üzerinden hesap kapsamında saklanır. Eski saat değeri kullanıcıya özgü güvenli depoda yedektir. Canlı iki cihaz eşitlemesi kabul bekler.
- **Saat dilimi:** Geçerli profil IANA dilimi önceliklidir; profil tercihi yoksa uygulama cihaz IANA bölgesini ilk varsayılan olarak kullanır. Ödeme analizi ve takvim günü domain yardımcıları IANA bölgesini zorunlu parametre alır; UI etkin profili açıkça iletir, domain içinde cihaz bölgesine sessiz fallback yoktur.
- **Dağıtım hazırlığı:** `eas.json` geliştirme/önizleme/üretim profillerini, `app.json` Flutter sürümüyle aynı `com.subscripttrack.app` kimliğini tanımlar. Bu kimlik yükseltme kabulü için hedeflenmiştir; imza anahtarı devamlılığı ve mağaza hesapları doğrulanmadı. Yan yana kurulum için ayrı geliştirme kimliği henüz tanımlanmadı.
- **Yerel bildirim native ayarı:** `expo-notifications` config plugin'i ve Android `SCHEDULE_EXACT_ALARM` izni tanımlıdır. iOS izin sonucu `ios.status` üzerinden yorumlanır. Tam zamanlı alarmın mağaza beyanı ve gerçek cihaz davranışı kabul bekler.
- **Offline (Aşama 3):**
  - Okuma: önce sunucu; başarılıysa satırlar şifreli cache'e yazılır, başarısızsa cache okunur. Bekleyen yazımlar her iki durumda da üstüne bindirilir ([subscriptionSync.ts](../../expo/src/features/subscriptions/data/subscriptionSync.ts)).
  - Yazma: çevrimiçi, kuyruk boş ve işlem eklemeyse RPC yeni kayıt kimliğini döndürsün diye doğrudan gönderilebilir. Güncellemeler ve geçici hata alan eklemeler FIFO kuyruğa girer. Kuyruk her aşamada şifreli depoya yazılır; yazım, olay ve tasarruf ayrı aşamalardır ([mutationQueue.ts](../../expo/src/features/subscriptions/domain/mutationQueue.ts)).
  - Senkron: her RPC/olay/tasarruf adımından önce mevcut Supabase oturumu kuyruk sahibinin kimliğiyle eşleştirilir. Hesap değişmişse sıra korunup senkron durur; eski kullanıcının işlemi yeni oturumla gönderilmez. Geçici hatada aynı aşama tekrar denenir; kalıcı red (ör. kota, kayıt yok) atlanır ve kullanıcıya bildirilir.
  - Çakışma: son yazan kazanır (RPC alanları tümden yazılır). Kuyruktaki ekleme ve güncellemeler yalnızca sunucu tarafında onaylanınca düşer; RPC idempotency anahtarı yeniden göndermeyi güvenli kılar.
  - Düzenleme sınırı: Gönderilmemiş (geçici kimlikli) bir ekleme, bağlantı gelmeden düzenlenemez.
  - Cache ve kuyruk oturum açan kullanıcı kimliğiyle ayrılır; çıkıştan sonra kuyruk silinmez, aynı kullanıcı girince devam eder.

## Hata modeli

### 12 Ekim mimari kapanışı

- `subscriptionSync`, `subscriptionMutations`, `createSubscriptionWorkflow` ve `pinUnlockService` somut adaptörleri bağlayan composition dosyalarıdır. Ayrı `*Coordinator` modülleri depo, oturum, saat, ağ ve RPC sınırlarını bağımlılık olarak alır; SDK import etmez. Mimari testi bu sınırı denetler.
- Seri yürütme aynı ortak FIFO politikasını korur. Hesap değişince eski kuyruğun gönderilmediği ve paralel eklemelerin kaybolmadığı bağımlılık verilerek sınanır.
- Ağ sonucu `online/offline/unknown` olarak taşınır. Algılama hatası `unknown` olur; mevcut gönderme denemesi politikası korunur.
- Oluşturma koordinatörü sonuç kodları döndürür; Türkçe mesaj ve ton `ui/createNotice.ts` içindedir. PIN depo hatası gerçek deneme kilidinden ayrı `storage_error` sonucudur.
- Takvim hesap/controller/sunum, CSV controller/önizleme/örnek ve formun deneme/ilk ödeme alanları ayrıdır. İptal yazımları `useCancellationAction` hook'undadır.
- Bildirim native yükleme ve izinleri `notificationRuntime`, dokunma/erteleme `notificationResponses`, plan farkı ve değiştirme `notificationScheduler` tarafından yönetilir. Eski public import yolu korunur.

- Supabase hataları ilgili repository'nin hata tipine çevrilir (örneğin `DataWriteError`, auth ve hesap silme hata tipleri). Yeniden denenebilirlik veri yazma hata tipinde taşınır; tüm hataların tek AppError tipine dönüştüğü iddia edilmez.
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

## Expo 59 senaryo sözleşmesi — 12 Ekim 2026

**Expo için güncel kullanıcı kararı:** [Gereksinim, API/veri modeli ve dağıtım sözleşmesi](../quality/expo-59/CONTRACT.md). Önceki Expo anlatımıyla çelişen tarih, mantıksal silme, 1.000 kota, 2.000 not, tüm para birimleri, device/fixed bölge ve açık/koyu/sistem tema kurallarında bu sözleşme geçerlidir. Flutter mevcut uygulaması korunur. Kod hazırlığı canlı/native kabul anlamına gelmez.
