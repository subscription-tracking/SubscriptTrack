# Bileşen ve etkileşim stratejisi

Başlangıç: [shared/widgets](../../../expo/src/shared/widgets), [design](../../../expo/src/shared/design), [Faz 1 denetimi](../04-design-system-audit.md). İsimler öneridir; uygulama veya yeni katman oluşturulmadı. Önce mevcut bileşen genişletme sınanır.

| İhtiyaç / önerilen sözleşme | Mevcut kaynak | Varyant ve etkileşim | Erişilebilirlik / risk |
|---|---|---|---|
| `FinancialSummary`: birim, kalan, ödenen/toplam, availability, eylem | `dashboard/ui/HeroCard.tsx`, `ProgressBar.tsx` | ready/complete/unavailable; birim değerleri ayrı; tutar ve açıklama ayrı satır | Bilinmeyen sıfır değil; büyük fontta tutar kırpılmaz; tüm kart tıklanabilirliğine ek olarak eylem adı duyulur. |
| `DecisionRow`: kayıt kimliği, durum, tarih, tutar, detay ve isteğe bağlı onay | `AttentionSection.tsx`, `SubscriptionRowCard.tsx`, `useConfirmedRenew` | gecikmiş/bugün/trial; bekleme/hata; yalnız geçerli eylem | İç içe Pressable çakışması yok; onay vazgeçme yazım yapmaz; durum renk dışında söylenir. |
| `SubscriptionIdentityRow`: ad, monogram/logo, alt bilgi, tutar, eylem | `SubscriptionTile`, `SubscriptionRowCard`, `GroupedList.tsx` | liste/timeline/kompakt; logo yoksa monogram | İkon dekoratif, isim erişilebilir; marka hakları; uzun ad ve RTL gelecekte ayrıca doğrulanır. |
| `CurrencySummary`: birim kimliği + bağımsız değerler | `dashboardHero.ts`, mevcut formatlayıcı | tek/çok birim; seçili birim açık | Kur dönüşümü yok; kullanıcıya gösterilen ilk birim kararı açık. |
| `FormSection` / `MoneyInputRow` | `TextField`, `SegmentedControl`, `DateField`, `SubscriptionFormScreen.tsx` | zorunlu/isteğe bağlı, validasyon/busy | Alan etiket/hata ilişkisi, klavye ve büyük font; decimal hesap değişmez. |
| `ResultNotice` | `AsyncStateView`, `AppSnackbar`, `EmptyState` | loading/error/empty/offline/success | Hata ve canlı durum duyurulur; otomatik kaybolan snackbar tek bilgi kaynağı olmaz. |
| `AccessibleDayCell` | `calendar/ui/CalendarMonth.tsx` | gün seçili/bugün/olaylı/gecikmiş | Tarih, durum, olay sayısı okunur; renk tek araç değil; 48 px hedef cihaz ölçümü. |
| `DestructiveConfirmation` | `ActionSheet`, `LockAwareModal`, mevcut ekran onayları | arşiv, yanlış kayıt, hesap silme ayrı metinler | Kapandıktan sonra odak geri döner; genel kalıcı silme henüz karar değil. |

## Etkileşim kuralları

1. Basılabilir nesne görünür metin, erişilebilir ad ve en az 48 px hedef taşır; ekran okuyucu sırası görsel sıraya uyar. Odak ve geri dönüş modal açılış/kapanışında iki platformda test edilir.
2. Bir ağ işlemi devam ederken aynı eylemin tekrarını engelle, ilgili satırın bekleme durumunu göster; hata, tekrar deneme ve offline/queue sonucu açık olsun. Kapsam dışındaki satırları gereksiz kilitleme.
3. Ödendi/yenileme, arşiv ve hesap silme eylemleri birbirinden farklıdır. Onay ekranı gerçek sonucu ve geri alınabilirliği söyler; kullanıcı onayı olmadan tarih ilerlemez.
4. Animasyon yalnız durum geçişini ve yönünü açıklar; sistem hareket azaltmada anlık eşdeğer gerekir. [useGrowIn](../../../expo/src/shared/widgets/useGrowIn.ts) bir örnektir; tüm hareketlerin uyumu doğrulanmadı.
5. Android geri eylemi, iOS swipe/back, saat/tarih seçici ve klavye davranışı platforma uygun kalır. `KeyboardScreen`, safe area ve `LockAwareModal` kullanımı görsel değişimde korunur.
6. Yüksek hacimli liste için mevcut `FlatList` önce ölçülür; yeni grafik/kütüphane yalnız erişilebilir metinsel eşleniği ve gereksinimiyle değerlendirilir.

## Token disiplini

Mevcut `colors`, `statusColors`, `spacing`, `radius`, `textStyle` ve tema revizyonu kullanılmalı. Yeni değer ancak iki temada kontrast, büyük font ve bileşen sınırı doğrulandıktan sonra tasarım sözleşmesiyle uyumlu kararla eklenir. Yeni bileşen adları uygulama onayı veya API sözleşmesi değildir.
