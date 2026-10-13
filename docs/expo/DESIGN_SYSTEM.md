# Tasarım Sistemi — Expo Uygulaması

> Güncelleme 13 Ekim 2026: yazı ölçeği, köşe kademeleri, kontrast kuralları ve düğme hiyerarşisi bu sayfadaki hâliyle uygulanmıştır (bkz. [tasarım incelemesi](../quality/expo-design-review-2026-10-13.md)). Flutter'ın token adları burada geçerli değildir.

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

Yazı yalnızca **roller** üzerinden kullanılır (`textStyle(role)`). Rol; boyut, ağırlık ve rengin tek kaynağıdır; ekran `fontSize`, `fontWeight` ya da `fontFamily` yazmaz. Yazı tipi **Hanken Grotesk** statik ağırlıklarıdır (`@expo-google-fonts/hanken-grotesk`, SIL OFL 1.1, pakete gömülü; çalışma zamanında indirilmez). Her ağırlık ayrı aile adıyla yüklenir (400, 500, 600, 700); Android'de değişken font ağırlıkları uygulanmadığı için `fontWeight` kullanılmaz.

| Rol | Boyut | Ağırlık | Kullanım |
|---|---|---|---|
| `display` | 36 | 700 | Ana tutar (tabular rakam) |
| `headline` | 28 | 700 | Karşılama ve kimlik ekranı başlığı |
| `title` | 22 | 700 | Ekran ve bölüm başlığı |
| `heading` | 18 | 600 | Üst çubuk, kart ve bölüm alt başlığı |
| `body` | 16 | 400 | Metin, form alanı |
| `bodyStrong` | 16 | 600 | Düğme, liste satırı başlığı |
| `bodySmall` | 14 | 400 | Yardımcı açıklama |
| `label` | 14 | 600 | Çip, sekme, satır etiketi |
| `caption` | 12 | 500 | Alt metin, durum, hata |
| `captionStrong` | 12 | 700 | Rozet, vurgulu alt metin |
| `overline` | 12 | 700 | Büyük harfli bölüm etiketi |
| `numeric` | 16 | 700 | Liste tutarları (tabular rakam) |

**Kurallar:**
- Yalnızca 12, 14, 16, 18, 22, 28 ve 36 kullanılır; **en küçük boyut 12**. 9–11 pt yazı yoktur.
- Rol adı anlam taşır (ör. `caption`); Flutter widget adı ya da ekran adı taşımaz.
- Hata ve yardımcı metin en az `caption` (12) boyutunda.
- Metin renkleri rolün varsayılanıdır; farklı renk gerekirse `textStyle(role, { color })` ile semantik token verilir.

## 6. Köşe yarıçapı (radius)

| Token | Değer | Kullanım |
|---|---|---|
| `xs` | 4 | Onay kutusu, küçük işaret |
| `sm` | 8 | Küçük çip, seçim kutusu |
| `md` | 12 | Giriş alanı, düğme, satır kartı |
| `lg` | 20 | Kart, alt sayfa |
| `pill` | 100 | Hap sekme, çip |

Beş kademe dışında değer yazılmaz. `small`, `medium`, `tile`, `sheet` gibi eski adlar geçiş takma adıdır ve yukarıdaki kademelere eşlenir; yeni kodda kullanılmaz.

## 7. Renk, kontrast ve durumlar

- Hex değeri ve `rgba(...)` yalnızca `src/shared/design` içinde tanımlanır. Ekranlar token kullanır.
- **Metin kontrastı ≥4,5:1** (`onSurface`, `onSurfaceVariant`, `primary`, `error`, durum renkleri; iki temada, `background`, `surface` ve `surfaceHigh` üzerinde).
- **Bileşen sınırı ≥3:1** (WCAG 1.4.11): giriş alanı, çerçeveli düğme, çip ve onay kutusu `controlBorder` kullanır (koyu `#6B7385`, açık `#7A849A`). Kart ve ayırıcılar `border`/`outlineHalf` kullanır; bunlar bilgi taşımaz.
- **Grafik ve kategori renkleri ≥3:1** (iki tema): `chartColors` ve `categoryPalette()` etkin temaya göre çözülür (`shared/design/chartTheme.ts`); ham değerler saf `palette.ts` içindedir.
- Anlam yalnızca renkle taşınmaz: durum için ikon, şekil ya da metin eklenir (ör. takvimde gecikmiş vade ünlem işaretidir).
- **Pasif durum** opaklıkla değil, `disabledSurface` ve `disabledText` ile gösterilir.
- Durum renkleri (başarı, uyarı, deneme, pasif) yalnızca durum bildirir. Metinde `statusColors.muted` yerine `mutedText` kullanılır.
- Bu kurallar `src/shared/design/contrast.test.ts` ile iki temada otomatik doğrulanır.

### Düğme hiyerarşisi
- **Birincil:** `PrimaryButton` (dolu; yıkıcı için `tone="danger"`).
- **İkincil:** `TonalButton` (yüzey dolgusu + `controlBorder`; yıkıcı için `tone="danger"`).
- **Üçüncül:** `TextLink` (düz metin; yıkıcı için `tone="danger"`, kırmızı ve altı çizili).
- Tüm düğmelerin dokunma alanı ≥48 px; seçili çip dolgulu olur (yalnız çerçeve değil).

### Ortak bileşenler (ana sayfa ve detay yeniden tasarımı)
- `ActionSheet` (`shared/widgets`): alt sayfa eylem menüsü; satır = ikon + başlık + isteğe bağlı açıklama; yıkıcı satır `error` renginde ve en altta; `LockAwareModal` üzerinde, kilitte kapanır; her satır ≥48 px.
- `GroupedList` / `ListRow`: etiket solda, değer sağda; dokunulabilir satırda sağ ok ve `accessibilityHint`.
- `ProgressBar` ve `StackedBar`: ince çubuklar; `ProgressBar` yüzdeyi `accessibilityValue` ile bildirir, `StackedBar` dilimleri `categoryPalette()` renkleriyle çizer.
- `useRenewAction`: "Ödendi ve yenilendi" eylemi; detay ve ana sayfadaki satır içi "Ödendi" aynı kancayı kullanır.
- `SegmentedControl` (`shared/widgets`): 2–4 seçenekli tek seçim; `radiogroup`/`radio`; seçili dilim dolgulu, sınır `controlBorder`, ≥48 px. Formda yenileme sıklığı ve ilk ödeme durumu için kullanılır.
- `PermissionBanner` (`notifications/ui`): bildirim izni kapalıyken uyarı bandı ve "Ayarları aç"; tercih ekranı ve bildirim merkezi ortak kullanır.
- `useConfirmedRenew`: onaylı "Ödendi" eylemi (ana sayfa ve bildirim merkezi).

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
4a. **Üst barlar:** Tüm üst barlar tek kabuk olan `HeaderShell` üzerine kurulur (üst güvenli alan, `screenGutter` sol-sağ boşluk, minimum yükseklik, arka plan). Kök barı `TopBar` (tab'lar), geri düğmeli alt ekran barı `ScreenTopBar` kullanır; başlık rolü ikisinde de `topBarTitle`'dır. Ekran köküne sabit `paddingTop` yazılmaz. Alt ekranların sonunda sabit `bottomNavHeight` yerine `ScreenBottomInset` kullanılır. Form içeren ekran kökü `KeyboardScreen` ile sarılır. Üst bar ve alt boşluk `minHeight` ile tanımlanır; büyük yazı boyutunda kesilmez.
4c. **Telefon boyutu düzeltmeleri (2026-10-10):** Bildirim satırlarında ikon (`MaterialIcons`, tür başına) ve metin (başlık abonelik adı, gövde kalan süre) Flutter'dan sapmadır; metinler artık başlık ve gövdede aynı bilgiyi tekrarlamaz. Tasarruf listesi üst kartla aynı üç kaydı "Tasarruf fırsatları" altında, geri kalanı "Diğer fırsatlar" altında gösterir. Takvim noktaları 6 px ve lejantlıdır. Ödeme geçmişi ay başlıklarıyla gruplanır ve her satır tarih gösterir. Halka merkez tutarı 12 px'tir (iç çapa sığması için).
4b. **Grafikler:** Kategori renkleri `categoryPalette` ile kategori başına sabittir (sıralamaya bağlı değil). Yüzdeler `percentShares` ile en büyük kalan yöntemiyle yuvarlanır (toplam %100). Her grafiğin ekran okuyucu özeti `chartSummary` ile üretilir. Sütunlar ve çubuklar ilk girişte `useGrowIn` ile büyür; hareket azaltma açıksa hiç oynamaz. Sapma: ana sayfa halkası Flutter'daki kategori grubu renklerini korur (`groupColor`); stats ekranı kategori renklerini kullanır.
4. **Flutter ile çakışma politikası:** Kural ile Flutter çakışırsa **kural geçerlidir**; sapma bu belgede kayıt altına alınır. Bilinen sapmalar: kenar boşluğu (Flutter auth 24), başlık kalınlığı (Flutter 800), alan etiketi animasyonu ve snackbar köşesi, metin için açık pasif ton (`statusColors.mutedText` #8A92A3; Flutter `muted` #737B8C küçük metinde 4.41:1 kalıyordu, bu yüzden yalnızca metin kullanımında değişti; ikon ve dekoratif kullanım `muted` olarak kaldı), form alanı odaksız kenarlığı (`colors.outline`, Flutter outline token'ı; önceki `colors.border` ≈1.16:1 kalıyordu).

## 12. Uygulama

- Kurallar bir test ile zorlanacak: ham hex, token dışı boşluk ve yazı boyutu bulunursa test kırılır. (Mimari testin tasarım karşılığı; [ARCHITECTURE.md](ARCHITECTURE.md) testleriyle aynı dosyada.)
- Yeni ekran eklenirken: rol ve token seçilir, ham değer yazılmaz.
- Bu belge değişince `tokens.ts` ve `typography.ts` aynı değişiklikte güncellenir.
