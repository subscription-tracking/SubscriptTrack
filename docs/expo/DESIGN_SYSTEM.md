# Tasarım Sistemi — Expo Uygulaması

> **Durum: Onaylı, uygulandı.** Dört karar 2026-10-09 tarihinde onaylandı ve kodda uygulandı; §10 ihlalleri kapatıldı. Kural seti `expo/src/design-system.test.ts` ile zorlanır. Bu belge `expo/` uygulamasının tasarım kurallarını tanımlar. Görsel hedef Flutter sürümüyle aynıdır ([docs/product/DESIGN_SYSTEM.md](../product/DESIGN_SYSTEM.md)); ürün ilkeleri ve semantic renk isimleri orada tanımlıdır. Bu belge yalnızca Expo'da **nasıl uygulanacağını** ve Flutter'dan sapma varsa neyin geçerli olacağını söyler.
>
> Kodda bugün uygulanan tokenlar: [expo/src/shared/design/tokens.ts](../../expo/src/shared/design/tokens.ts) ve [typography.ts](../../expo/src/shared/design/typography.ts). Bu belgedeki kurallar, kodla çeliştiği yerlerde **uygulanacak** kurallardır; mevcut ihlaller §10'da listelenmiştir.

## 1. Amaç

Her ekran aynı boşluk, yazı, köşe, renk ve dokunma ölçülerinden üretilsin. Bir değer değişince tek yerden değişsin; yeni ekran kendi sayısını uydurmasın.

## 2. Temel ilke

Ekranlar değer yazmaz, **token seçer**. Stil dosyasında `padding: 13` ya da `fontSize: 15` gibi bir sayı görülürse bu bir hatadır; doğru token'a taşınır veya kural değiştirilir.

## 3. Boşluk (spacing)

Ölçek 4 pikselin katlarıdır:

| Token | Değer | Kullanım |
|---|---|---|
| `xxs` | 4 | Metin ile yardımcı etiket arası |
| `xs` | 8 | Simge ile metin, çip arası |
| `sm` | 12 | Kart içi satır arası |
| `md` | 16 | Form alanları arası |
| `lg` | 20 | Ekran kenar boşluğu |
| `xl` | 24 | Bölüm arası |
| `xxl` | 32 | Ekran başı ve büyük boşluklar |
| `xxxl` | 40 | Karşılama ekranlarında |
| `huge` | 48 | Nadir, yalnızca boş durum blokları |

**Kural:** Yalnızca bu tokenlar. `Spacer` bileşeni de yalnızca token alır (sayı kabul etmez). 2, 6, 14, 15, 28 gibi değerler kullanılmaz.

## 4. Yerleşim ve kenar boşluğu

- Tek bir `ScreenContainer` bileşeni vardır. Güvenli alanı (üst ve alt), yatay kenar boşluğunu ve üst başlık boşluğunu bu bileşen uygular. Ekranlar `paddingTop` ya da güvenli alan hesabını kendileri yazmaz.
- Yatay kenar boşluğu **`lg` (20)**: auth ve uygulama ekranlarında aynı. *(Öneri; §11 karar 1.)*
- Alt tab çubuğu içerik alanı: tab çubuğu yüksekliği + güvenli alt boşluk, sabit `96` yazılmaz; tab çubuğu yüksekliği token'dan okunur.
- Ekran başlığı üst boşluğu: `xxl` (32), tüm tam ekran rotalarda.

## 5. Yazı (typography)

Yazı yalnızca **roller** üzerinden kullanılır. Rol, boyut ve kalınlığın tek kaynağıdır; ekran `fontSize` ya da `fontWeight` yazmaz.

| Rol | Boyut | Kalınlık | Kullanım |
|---|---|---|---|
| `display` | 36 | 700 | Karşılama ekranı (nadir) |
| `headline` | 28 | 700 | Ekran başlığı |
| `title` | 22 | 700 | Üst çubuk, bölüm başlığı |
| `titleSmall` | 16 | 600 | Kart başlığı, liste başlığı |
| `body` | 16 | 400 | Metin, form alanı |
| `bodySmall` | 14 | 400 | Yardımcı açıklama |
| `label` | 14 | 600 | Düğme, çip, sekme |
| `caption` | 12 | 500 | Etiket, durum, hata metni |

**Kurallar:**
- Yalnızca bu tablodaki boyutlar kullanılır (12, 14, 16, 22, 28, 36). Tabloda olmayan her boyut hatadır.
- Kalınlık yalnızca 400, 500, 600, 700 olur. **800 kullanılmaz.** *(Öneri; §11 karar 2.)*
- Hata ve yardımcı metin en az `caption` (12) boyutunda.

## 6. Köşe yarıçapı (radius)

| Token | Değer | Kullanım |
|---|---|---|
| `xs` | 4 | Snackbar, küçük işaret |
| `sm` | 14 | Giriş alanı, düğme |
| `md` | 20 | Kart |
| `pill` | 100 | Çip, sekme |
| `circle` | yarı genişlik | Avatar, dairesel simge |

Ham sayı yok. 2, 21, 36 gibi değerler kullanılmaz; daire için `circle` kullanılır.

## 7. Renk

- Hex değeri ve `rgba(...)` yalnızca `tokens.ts` içinde tanımlanır. Ekran dosyaları bunları yazmaz.
- Metin opaklığı için token + opaklık fonksiyonu kullanılır (ör. `withAlpha(colors.onBackground, 0.55)`). Bu fonksiyon `tokens.ts` içinde olur.
- Durum renkleri (başarı, uyarı, deneme, pasif) yalnızca durum bildirir. Marka rengi durum için kullanılmaz.
- Devre dışı öğeler: metin `onSurface` %38, arka plan `onSurface` %12 (Flutter ile aynı).

## 8. Dokunma alanı

- Her etkileşimli öğenin dokunma alanı en az **48 px**.
- Görsel boyutu 48'den küçük öğelerde (çip, sekme) görsel yükseklik serbesttir, ancak dokunma alanı `hitSlop` ile 48'e tamamlanır. *(Öneri; §11 karar 3.)*
- Ekran kenarındaki ikon düğmeleri 48×48 alan içinde çizilir.

## 9. İkon boyutları

| Token | Boyut | Kullanım |
|---|---|---|
| `icon.sm` | 16 | Satır içi ipucu |
| `icon.md` | 24 | Düğme, alan, sekme |
| `icon.lg` | 48 | Boş durum |
| `icon.xl` | 64 | Akış ekranları (şifre, mail) |

Bunun dışında boyut kullanılmaz. Glifler Material seti ile sınırlı; "rounded" varyantı Expo'da yok, düz glif kullanılır ([LIBRARIES](LIBRARIES.md)).

## 10. İlk denetimdeki ihlaller (kapatıldı)

Bu liste ilk denetimde ölçüldü. Her madde, kural uygulandığında kaldırılacak.

| Alan | İhlal | Kural |
|---|---|---|
| Yazı boyutları | 11, 12, 13, 14, 15, 16, 17, 22, 24, 28, 32, 36 — 12 farklı değer | §5 |
| Yazı kalınlıkları | 800 başlıklarda kullanılıyor | §5 |
| Boşluk | ~30 `Spacer` çağrısı sayı alıyor; 2, 6, 14, 15, 28, 96 gibi değerler | §3, §4 |
| Köşe | 2, 21, 36 değerleri | §6 |
| Renk | `#101217`, `#F2F4F7` gibi hex değerleri bileşenlerde; ad hoc `rgba` opaklıklar | §7 |
| Kenar boşluğu | Auth 24, uygulama 20 | §4 |
| Çip yüksekliği | 36 px, dokunma alanı 48'in altında | §8 |
| Alt boşluk | Sabit 96 | §4 |

## 11. Kararlar (onaylandı)

Dört karar onaylandı ve uygulandı:

1. **Kenar boşluğu:** `lg` (20), tek değer. Auth ve uygulama ekranlarında aynı.
2. **Başlık kalınlığı:** 700. 800 kullanılmıyor.
3. **Çip yüksekliği:** Görsel 36, dokunma alanı `hitSlop` ile 52'ye tamamlanır (48 kuralı sağlanır).
4. **Flutter ile çakışma politikası:** Kural ile Flutter çakışırsa **kural geçerlidir**; sapma bu belgede kayıt altına alınır. Bilinen sapmalar: kenar boşluğu (Flutter auth 24), başlık kalınlığı (Flutter 800), alan etiketi animasyonu ve snackbar köşesi.

## 12. Uygulama

- Kurallar bir test ile zorlanacak: ham hex, token dışı boşluk ve yazı boyutu bulunursa test kırılır. (Mimari testin tasarım karşılığı; [ARCHITECTURE.md](ARCHITECTURE.md) testleriyle aynı dosyada.)
- Yeni ekran eklenirken: rol ve token seçilir, ham değer yazılmaz.
- Bu belge değişince `tokens.ts` ve `typography.ts` aynı değişiklikte güncellenir.
