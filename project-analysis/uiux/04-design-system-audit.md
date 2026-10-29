# Tasarım sistemi denetimi

Kaynak temelli ön değerlendirme; görsel cihaz doğrulaması yapılmadı. Sözleşme: `docs/expo/DESIGN_SYSTEM.md`; uygulama: `expo/src/shared/design/`, `expo/src/shared/widgets/`.

| Alan | Mevcut kanıt | Korunacak / incelenecek |
|---|---|---|
| Renk | `tokens.ts`, `themePalette.ts`, `chartTheme.ts`; açık/koyu/system seçimi `features/settings/ui/AppearanceScreen.tsx:65-95`. | Semantik tema ve durum renkleri korunmalı; gerçek kontrast ve her yüzey kombinasyonu cihazda doğrulanmalı. Kategori kartı sıralama indeksine bağlı renk seçiyor (`dashboard/ui/CategoryBarCard.tsx:20`); `DESIGN_SYSTEM.md` sabit kategori rengi anlatımıyla karşılaştırılmalı. |
| Tipografi | `typography.ts` Hanken Grotesk statik ağırlıkları, 12 rol, sayısal rollerde tabular rakam. | Rol sistemi korunmalı; `HeroCard.tsx:66` 0,6'ya kadar küçülme uzun sayı/büyük font için değerlendirilir. Font lisansı ve dağıtım bildirimi ayrıca doğrulanmalı. |
| Boşluk ve ölçü | `tokens.ts`, `docs/expo/DESIGN_SYSTEM.md` token ölçeği ve 48 px hedefini tanımlar. | Tokenları koru; dokunma hedeflerinin tüm ekranlarda gerçekten sağlandığına dair güncel cihaz kanıtı yok. |
| Yüzey | `HeroCard.tsx`, `CategoryBarCard.tsx`, `GroupedList.tsx` yüzey ve sınır kullanıyor. | İşlevsel hiyerarşiye göre ritim değerlendir; koddan tek başına bütün ekranların aynı göründüğü sonucunu çıkarma. |
| İkon | `@expo/vector-icons` ve Material kullanımı, `package.json`; icon boyutları belgede. | İkon eşlemesi, anlamı ve hit target tutarlılığını ekran bazında ölç. Yeni set gerekçesi henüz kanıtlanmadı. |
| Navigasyon | `app/(app)/(tabs)/_layout.tsx`, `shared/widgets/BottomNavigation.tsx`, `HeaderShell.tsx`, `ScreenTopBar.tsx`. | Alt sekme rolleri, safe area, geri davranışı ve büyük font iki platformda doğrulanmalı. |
| Eylem ve form | `PrimaryButton.tsx`, `TonalButton.tsx`, `TextLink.tsx`, `TextField.tsx`, `SegmentedControl.tsx`, `DateField.tsx`. | Birincil/ikincil/yıkıcı hiyerarşiyi koru; form hatalarını ve klavye odağını ölç. |
| Veri durumları | `AsyncStateView.tsx`, `EmptyState.tsx`, `OfflineBanner.tsx`, `AppSnackbar.tsx`. | Ortak loading/error/empty/offline dilini koru; 0/1/çok veri kompozisyonlarını görevle ilişkilendir. |
| Overlay ve güvenlik | `ActionSheet.tsx`, `LockAwareModal.tsx`, `GroupedList.tsx`. | Kilitte kapanma/gizleme, modal odak sırası ve yıkıcı eylemleri koru. `GroupedList.tsx` kullanıcı değişikliği içerir. |
| Hareket | `useGrowIn.ts:19` reduce-motion sorgusu; `EntranceFade.tsx`, onboarding hareketleri mevcut. | Tüm animasyonların hareket azaltmaya uyumu henüz doğrulanmadı; sadece kullanıcının dikkatini yöneten hareketlere ihtiyaç testi yapılmalı. |

**Güçlü parçalar:** merkezi rol/token yaklaşımı, kullanıcı tema tercihi, ayrı loading/error durumu, güvenli modal ve finansal sayılarda tabular tipografi. **Sınır:** test dosyalarının varlığı testlerin bu oturumda geçtiğini veya VoiceOver/TalkBack kabulünü göstermez.
