# Sprint 00 — baz ve kanıt durumu

29 Ekim 2026. Başlangıç HEAD `bdb7a1e`; çalışma ağacı başlangıçta temiz, çalışma dalı `codex/dashboard-v2`. Değişiklikler commit edilmedi; geri dönüş mevcut HEAD ile `git diff` incelenerek, kullanıcının sonraki değişiklikleri korunarak yapılmalı.

## Yerel ortam

- Node v24.7.0; `npm ls --depth=0` başarılı; Expo SDK 57, RN 0.86.3.
- `npx expo install --check`: bağımlılıklar güncel.
- `npx --no-install expo-doctor`: 21/21 kontrol başarılı.
- Android `adb devices -l`: bağlı cihaz yok; iOS cihaz/simülatör doğrulanmadı. Kullanıcı tarafından daha önce sağlanan fiziksel ekran görüntüsü kişisel veri içerebileceği için bu rapora kopyalanmadı.
- Gri dişli katmanları: cihazda incelenemedi, kaynak bilinmiyor.
- Gorhom 5 + Reanimated 4 için native ve gesture uyumluluğu henüz kanıtlanmadı. Üretim UI kullanımına alınmadı; mevcut ActionSheet korunuyor.
- Expo tüneli CI modunda; çalışan oturum yeni değişiklikleri otomatik izlemiyor. Kullanıcıya önceden bildirilmeden yeniden başlatılmadı.

## Fikstür ve görüntü matrisi

Aşağıdaki ID'ler planlanan sentetik durumlardır; henüz cihazda kurulmuş, çalıştırılmış veya ekran görüntüsü alınmış değildir. Referans gün: 2026-10-29, Europe/Istanbul; tutarlar minor unit.

| ID | Sentetik durum | Kritik kontrol |
|---|---|---|
| D00 | 0 abonelik / geçmiş yok | ilk ekleme, sahte yüzde yok |
| D01 | 1 abonelik, 15+ gün | sonraki ayrı |
| D02 | çok abonelik, 14. ve 15. gün | iki pencere ayrımı |
| D03 | tüm ödemeler tamam | %100, kalan sıfır |
| D04 | bugün ve gecikme | onay olmadan tarih ilerlemez |
| D05 | deneme bitişi | açık deneme etiketi |
| D06 | TRY/USD/EUR | ayrı toplamlar, dönüşüm yok |
| D07 | geçmiş hata / yükleniyor | bilinmeyen sıfır gösterilmez |
| D08 | çevrimdışı / önbellek | veri ve durum açık |
| D09 | sabit bölge cihazdan farklı | başlık ve çizelgede aynı gün |

Gerekli görüntüler: Android ve iOS, açık/koyu, 360/390/430 dp, D00/D01/D02 ve kritik durumlar, büyük yazı ve ekran okuyucu. Önce/sonra aynı fixture ve cihaz gerekir. Hiçbiri bu turda üretilmedi; iOS, ekran okuyucu ve overlay kabulü açık.

## Lisans ve bağımlılık kararları

SVG MIT, Reanimated MIT, Worklets MIT, Gesture Handler MIT, Gorhom Bottom Sheet MIT, Lucide ISC, Hanken Grotesk SIL OFL-1.1 olarak mevcut plan envanterinde listelenmiştir; release için dağıtımın NOTICE/lisans ve gerçek marka varlıkları ayrıca doğrulanmalı. Yeni paket kurulmadı. Görsel ve native uyumluluk `expo-doctor` sonucundan çıkarılamaz.

## Belge ve kod farkları

`docs/CURRENT_STATUS.md` içinde açık tema ve bazı Expo bildirim durumlarına dair tarihsel, birbiriyle tutarsız bölümler var; Expo için `docs/quality/expo-59/CONTRACT.md` light/dark/system ve yerel bildirim kararını belirtir. `docs/expo/DESIGN_SYSTEM.md` tek HeaderShell ve token kurallarını tanımlar; önceki dashboard değişikliği ayrıca başlık çizerek bu kurala aykırıydı. Sprint 01 ortak kabukta tek başlık oluşturur. Dashboard görselinin tamamı bu sprintin kapsamı değildir.

## Sprint 01 uygulama ve doğrulama

- `TabScaffold` ana sayfada marka varyantını `TopBar` üzerinden çiziyor; `DashboardScreen` içindeki tekrar başlık kaldırıldı. Tek `HeaderShell`, tek bildirim düğmesi, gerçek okunmamış sayısı ve diğer sekmelerin eski başlık/takvim davranışı korunuyor.
- Başlık tarihi `useCivilToday` ile seçili IANA bölgesinden gelen `CivilDate` ile biçimleniyor. UTC ve İstanbul gün sınırı testi eklendi. Alt gezinme bileşeni değiştirilmedi; mevcut seçili durum ve safe-area testleri koşuda geçti.
- İlk tam Jest koşusu: 149 paketten 147 geçti; 914 test geçti, 3 başarısız. Bir bildirim testi 5 saniyelik zaman aşımına uğradı; tasarım sistemi iki ham token değerini yakaladı. İki değer düzeltildi. Başarısız paketler ile yeni başlık/saat dilimi testleri ayrı tekrar koşusunda 4/4 paket, 29/29 test geçti. Düzeltme sonrasında tam Jest koşusu tekrarlanmadı.
- Son değişikliklerden sonra `npm run typecheck` ve `npm run lint` başarılı. Gerçek cihaz/screen reader, fiziksel notch ve iOS Dynamic Island kanıtı yok; Sprint 00/01 native kabulü tamamlanmış değildir.
- Geliştirme sunucusu yeniden başlatılmadı; mevcut CI oturumu bu yeni kodu otomatik göstermeyebilir.

