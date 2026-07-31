# Design System

## 1. Amaç

Bütün ekranların tek bir görsel dil, ortak tokenlar ve tekrar kullanılabilir bileşenler üzerinden üretilmesini sağlamak.

## 2. Sistem hiyerarşisi

```text
Foundations
→ Primitives
→ Product Components
→ Patterns
→ Templates
→ Screens
```

Ekranlar bağımsız tasarımlar değildir; sistem parçalarının kombinasyonlarıdır.

## 3. İsimlendirme

Ham görsel isim yerine semantic token kullanılır.

Yanlış:

```text
blue500
white
red
```

Doğru:

```text
action.primary
surface.primary
text.danger
status.renewingSoon
```

## 4. Renk tokenları

### Temel semantic gruplar

```text
background.primary
background.secondary
surface.primary
surface.elevated
surface.selected

text.primary
text.secondary
text.disabled
text.inverse

border.subtle
border.default
border.focus

action.primary
action.primaryPressed
action.secondary
action.danger

status.success
status.warning
status.danger
status.info
```

### Kategori tokenları

```text
category.entertainment
category.music
category.software
category.cloud
category.education
category.business
category.health
category.gaming
category.other
```

Her kategori için:

```text
category.music.background
category.music.content
category.music.border
```

Kategori rengi ile durum rengi farklı anlam taşır ve ayrı token olmalıdır.

## 5. Tema

Desteklenen tema:

- System
- Light
- Dark

Bileşenler tema değerini doğrudan kontrol etmez; semantic token çözümlenir.

Örnek:

| Token | Light | Dark |
|---|---|---|
| `background.primary` | Açık nötr | Koyu nötr |
| `surface.primary` | Beyaz yüzey | Koyu yükseltilmiş yüzey |
| `text.primary` | Koyu metin | Açık metin |

Gerçek renk kodları Figma Variables ve kod token dosyasında tutulmalıdır.

## 6. Tipografi

Önerilen roller:

```text
display.large
heading.large
heading.medium
heading.small
body.large
body.medium
body.small
label.large
label.medium
caption
```

Kurallar:

- Para toplamı `display.large`
- Ekran başlığı `heading.large`
- Kart adı `heading.small`
- Fiyat ve tarih `body.medium`
- Badge `label.medium`
- Yardımcı bilgi `caption`

Font seçimi ADR/tasarım kararıdır. iOS ve Android font scaling desteklenmelidir.

## 7. Spacing

4 tabanlı ölçek önerisi:

| Token | Değer |
|---|---:|
| `space.2xs` | 4 |
| `space.xs` | 8 |
| `space.sm` | 12 |
| `space.md` | 16 |
| `space.lg` | 24 |
| `space.xl` | 32 |
| `space.2xl` | 48 |

Ham piksel kullanımı yerine token kullanılmalıdır.

## 8. Radius ve elevation

```text
radius.small
radius.medium
radius.large
radius.full

elevation.none
elevation.low
elevation.medium
elevation.high
```

Gölge dark temada tek başına yeterli olmayabilir; border/surface farkı kullanılmalıdır.

## 9. Primitive bileşenler

- Button: primary, secondary, ghost, danger, icon
- Text field
- Password field
- Search field
- Switch
- Checkbox
- Radio
- Chip
- Badge
- Divider
- Icon button
- Snackbar/banner
- Progress indicator
- Skeleton

Her bileşen:

- size varyantı
- disabled
- pressed
- focused
- loading
- error
- accessibility label

durumlarını kapsamalıdır.

## 10. Ürün bileşenleri

### Subscription Card

İçerik:

- Logo/fallback
- İsim
- Fiyat ve döngü
- Yenileme tarihi
- Kalan gün
- Kategori
- Durum
- Menü/aksiyon

Varyantlar:

- default
- compact
- renewingSoon
- trialEnding
- paused
- cancelled
- expired

### Summary Card

- monthly spending
- annual spending
- savings
- upcoming count

### Notification Item

- okunmuş/okunmamış
- renewal/trial/price-change
- aksiyonlu veya aksiyonsuz

### Setting Row

- navigation
- switch
- value
- destructive

### Empty State

- illüstrasyon/ikon
- başlık
- açıklama
- birincil aksiyon

## 11. Pattern'ler

- Add subscription form
- Subscription filter sheet
- Notification permission education
- Delete/cancel confirmation
- Offline banner
- Error recovery
- Calendar day details
- Service picker

## 12. Screen template'leri

### Standard Tab Screen

- Safe area
- App bar
- Scroll content
- Bottom navigation

### Form Screen

- App bar
- Form content
- Sticky primary action

### Detail Screen

- Summary header
- Information sections
- Sticky or bottom actions

### Modal/Bottom Sheet

- Drag handle
- Heading
- Content
- Safe area action

## 13. Erişilebilirlik

- Metin kontrastı WCAG AA hedefler.
- Minimum dokunma alanı platform standartlarını karşılar.
- Renk durumun tek taşıyıcısı değildir.
- Screen reader sırası mantıklıdır.
- Dynamic type ile layout kırılmaz.
- Animasyonlar “reduce motion” ile azaltılır.

## 14. Figma yapısı

```text
00 Foundations
01 Components
02 Patterns
03 Screens
04 Prototypes
05 Documentation
```

Figma ve kod isimleri eşleşmelidir:

```text
Figma: SubscriptionCard / RenewingSoon
Code: SubscriptionCardVariant.renewingSoon
```

## 15. Değişiklik yönetimi

- Breaking component değişiklikleri dokümante edilir.
- Token kaldırılmadan önce deprecated edilir.
- Ekran içinde tek seferlik stil eklemek yerine sistem ihtiyacı değerlendirilir.
- Tasarım ve mobil ekip ortak component review yapar.
