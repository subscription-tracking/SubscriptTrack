# Expo tasarım incelemesi — ekranlar, tasarım sistemi, erişilebilirlik, metinler (13 Ekim 2026)

Kapsam: `expo/` uygulamasının tüm kullanıcı ekranları, `src/shared/design` tokenları ve ekranlardaki metinler. Amaç: hakkaniyetli bir eleştiri ve gerektiğinde yeniden tasarım yönü. Expo, Flutter'ın kopyası olmak zorunda değildir; iyi olanlar korunur.

## Yöntem ve sınırlar

- **Kanıt:** Android 36 emülatöründe (SDK 57 development client) 24 rotanın koyu ve açık tema ekran görüntüleri; tokenların kodu; kontrast oranları betikle hesaplandı (WCAG 2.x); ekranlardaki metinler tarandı.
- **Dev client artefaktı:** Her ekranın sağ üstündeki dişli/yuvarlak düğme, yükleme halkaları ve "Tools" düğmesi development client'a aittir, uygulamanın parçası değildir. Bu yüzden başlığın sağ tarafındaki gerçek kontroller (bildirim zili) bu görüntülerde kısmen kapalıdır; o bölgeyi değerlendirmedim.
- **Eksikler:** Tanıtım (onboarding) ve giriş/kayıt ekranları için 11 Ekim tarihli arşiv görüntülerini kullandım. Boş, hata ve yükleme durumlarını büyük ölçüde görmedim (ödeme yöntemleri boş durumu hariç). TalkBack ile gerçek kullanım denemedim. TalkBack, dokunma alanı ve gerçek cihaz yazı boyutu yargıları kod ve oranlara dayanır.
- **Doğrulanmamış bir çıkarım:** Başlıkların Hanken Grotesk yerine sistem fontuyla (Roboto benzeri) çizildiğini görüntülerden çıkardım (bkz. S3); aynı yazıyı iki fontla çizen bir kontrol yapmadım.

## Özet

Uygulama bugün **tutarlı, temiz ve çalışan** bir ürün; asıl zayıflıklar şunlar: (1) tasarım sistemi Flutter'dan ham taşınmış ve gereğinden karmaşık, (2) koyu temada kenarlıklar neredeyse görünmez, (3) bazı ekranlar çok fazla eylemi aynı ağırlıkta sunuyor, (4) metinlerde belirsiz ve iç sistem diliyle yazılmış ifadeler var. Yeniden tasarım "baştan çizmek" değil, sistemi sadeleştirip birkaç ekranın bilgi mimarisini düzeltmek olmalı.

## Korunması gerekenler

- **Net bilgi hiyerarşisi:** Ana sayfada tek büyük tutar, altında yenileme listesi; detayda marka renkli hero ve sonraki ödeme kartı.
- **Tema altyapısı:** Açık/koyu/sistem aynı tokenlardan çözülüyor, iki tema da okunabilir.
- **Metin kontrastı:** Tüm gövde ve ikincil metinler her iki temada 5,6:1'in üstünde (koyu: 8,0–17,0; açık: 5,8–15,5).
- **Güvenli yıkıcı akışlar:** Hesap silmede şifre + "sil" yazma + onay kutusu; yanlış kayıt silmede açık diyalog.
- **Durum bilgisi:** Çevrimdışı şerit ve bekleyen değişiklik sayacı, gecikmiş vadeye karşı "tahmini sonraki döngü" gösterimi.
- **Markalı servis simgeleri** ve takvimin sade yapısı.

## Tasarım sistemi

| # | Bulgu | Kanıt | Önem |
|---|---|---|---|
| S1 | Tip ölçeği Flutter widget adlarından türetilmiş ve şişkin: ~55 rol, **17 farklı boyut** (9, 9,5, 10, 11, 12, 13, 14, 15, 16, 18, 19, 20, 22, 24, 28, 32, 36) ve beş ağırlık | `typography.ts` | Yüksek |
| S2 | Rol adları semantik değil ("Flutter labelSmall", `donutTotal`, `caption10Strong`); DESIGN_SYSTEM.md "semantic token" ister | `typography.ts`, `DESIGN_SYSTEM.md §3` | Orta |
| S3 | Tek bir `HankenGrotesk.ttf` gömülü; 600/700/800 ağırlıklı başlıklar Android'de sistem fontuna düşüyor gibi görünüyor (başlıklar ile gövde farklı harf formu). Tek ailenin iki fontla çizilmesi, ekranların "iki el yazısı" olmasının sebebi | `fonts.ts`, ekran görüntüleri | Yüksek (doğrulanmalı) |
| S4 | 11 farklı köşe yarıçapı (4, 8, 12, 14, 16, 18, 20, 22, 24, 28, 100) ve çok sayıda tek kullanımlık boşluk (`heroLabel: 6`, `pillX: 14`, `trialCard: 10`) | `tokens.ts` | Orta |
| S5 | Koyu temada kenarlık (`border` #2B303B) arka plana **1,42:1**, `outline` **2,2–2,4:1**. Çerçeveli düğmeler (Dışa aktar ekranı, "Destek kaydı oluştur") ve giriş alanları yüzeyden zor ayrılıyor; WCAG 1.4.11 (bileşen sınırı ≥3:1) sağlanmıyor | kontrast hesabı, `set-export` görüntüsü | Yüksek |
| S6 | Açık temada grafik renkleri beyaz yüzeye karşı **2,0–2,8:1** (limon 2,0, amber 2,1, camgöbeği 2,4, zümrüt 2,5, gri-mavi 2,6, turuncu 2,8) | kontrast hesabı | Orta |
| S7 | `status.muted` koyu yüzeyde **4,05:1**; metin için kullanılırsa AA'nın altında (zaten ayrı `mutedText` token'ı var, kullanım disiplini yok) | kontrast hesabı | Düşük |
| S8 | Devre dışı durum koyu temada "açık ama soluk" görünüyor: yıkıcı "Hesabı kalıcı olarak sil" düğmesi pasifken etkin düğmeyle karışıyor | `set-delete` görüntüsü | Orta |
| S9 | İki görsel dil: giriş/kayıt/tanıtım ekranları ışıldayan ambiyans ve sekizgen logo kullanıyor, uygulama içi ekranlar düz kart yapısında | arşiv görüntüleri | Orta |
| S10 | Bileşen ailesi tutarsız: dolu düğme, çerçeveli düğme ve düz metin bağlantısı aynı önemdeki eylemlerde karışık kullanılıyor ("Aboneliği sil", "Çoklu seçim", "Otomatik hesapla" bağlantıdır; "Duraklat/Arşivle" çerçeveli) | `detail2`, `subs` | Orta |
| S11 | `docs/product/DESIGN_SYSTEM.md` "yalnızca koyu tema" ve Flutter dosyalarını anlatıyor; Expo'nun gerçek tokenlarını yansıtmıyor | belge | Orta |

## Ekran eleştirileri

| Ekran | İyi | Sorun | Yön |
|---|---|---|---|
| Ana sayfa | Güçlü tek odak (aylık tutar), halka "1/5 ödendi" | "Geçen aya göre %94 daha az" yanıltıcı olabilir (tahmini gider ile ödenmiş tutar karşılaştırılıyor); üç çip 11 pt yazı; iki kart da kırmızı çerçeveli (2 gün kaldı ile bugün aynı alarm seviyesinde); her kartta tekrarlanan hatırlatma şeridi uzun, kesiliyor | Tutarı "bu ay ödenecek/ödenen" olarak netleştir; hatırlatma şeridini tek yere indir; aciliyet seviyelerini ayır (bugün / yarın / bu hafta) |
| Abonelik listesi | Sekmeler ve arama net | Satırda iki sütun sıkışıyor: "Sonraki döngü (tahmini): 6 Kasım 2026" iki satıra sarıyor, ad ve kategori kesiliyor; gecikmiş kayıtlar normal kayıtlarla aynı listede; "Çoklu seçim" bağlantısı başlıksız duruyor | Gecikmiş kayıtları "Geciken ödemeler" grubunda topla; satırı iki satıra sadeleştir (ad + tutar / durum) |
| İstatistikler | Kart yapısı ve ay seçimi | Çubuklarda eksen ve değer yok, "Tem" boş çubuk açıklamasız; "Eki toplamı ₺49,99" iki kez yazılıyor; açık temada çubuklar çok soluk | Etiketli eksen, seçili ayın tek göstergesi, boş ay açıklaması |
| Takvim | Sade, yoğunluk iyi | Noktalar 6 px ve yalnız renkle ayrışıyor; gecikmiş günler normal gün gibi; "3 gün içinde" kırmızı göstergesi hiç görünmüyor | Nokta yerine sayı rozeti, gecikmiş için ikon |
| Bildirimler | Tür ikonları anlaşılır | Her satır "Bugün yenileniyor"; tutar yok; aynı abonelik tekrar (Netflix 3 gün ×2); güne göre gruplama yok; satırdan eylem (Ödendi/Ertele) yok | Güne göre grupla, tutar ekle, satırda hızlı eylem |
| Tasarruf analizi | Başlık kartı güçlü | "En yüksek tutarlı 3 aboneliğini iptal edersen ₺23.034/yıl tasarruf" baskıcı ve öznel; her satırda "Olası yıllık tasarruf" tekrar; "Abonelik iptal edildi · Geçti" anlaşılmıyor | Kullanım bilgisi olmadan öneri değil, "yıllık maliyet sıralaması" olarak sun |
| Abonelik detayı | Marka hero'su ve sonraki ödeme kartı çok iyi | Alt kısımda beş eylem (Ödendi, Duraklat, Arşivle, İptal, Sil) aynı sayfada; "sil" soluk bağlantı; ödeme geçmişinde "Geçti" | Tek bağlamsal birincil eylem; diğerleri "⋯" menüsünde, sil menünün en altında |
| İptal akışı | Üç net seçenek | Başlık "Aboneliği iptal et" ama sayfa bir karar ekranı; "Sağlayıcı sayfası" kartı eylem mi bilgi mi belli değil; satırlar ikon/vurgu yok | Başlığı "Ne yapmak istiyorsun?" yap, kartları ikonla ve sağlayıcı bağlantısını gerçek düğme yap |
| Yeni abonelik / düzenle | Popüler servis çipleri, tek ekranda kısa form | Seçili hatırlatma çipi yalnız çerçeveyle işaretli (zayıf); "Otomatik tarih / Otomatik hesapla" metni belirsiz; zorunlu alan işareti yok; tutar alanında para birimi simgesi yok | Seçili çipi dolgulu yap, "Tarih otomatik hesaplanıyor (değiştir)" şeklinde tek satır, tutara önek simge |
| Arşiv | Basit | İki ikon düğmesi (geri al / kalıcı sil) etiketsiz ve yan yana; kırmızı sil ikonuna yanlış dokunma riski | Etiketli düğme ya da kaydırma eylemi; silmeyi ayır |
| Ödeme geçmişi | Aylara göre gruplu | "Kayıt ekle" yüzen düğmesi son satırın tutarını örtüyor; düzenle/sil ikonları her satırda tekrar | Alt boşluk ekle, satıra dokununca menü |
| CSV içe aktar | Doğru uyarılar | Boş ekran: tek düğme ve bağlantı, ne yapacağı anlatılmıyor | Üç adımlık açıklama ve örnek satır |
| Ayarlar (ana ve alt) | Gruplu liste temiz | Satır sağındaki özet kesiliyor; "Tanıtım turunu yeniden başlat" ayar değil; tema, "Para birimi ve saat dilimi" altında | Tema ayrı satır; tanıtımı yardım altına al |
| Profil | Bölümler net | Üç ayrı form üç ayrı pasif "Kaydet" düğmesiyle uzun sayfa | Tek "Değişiklikleri kaydet" ya da bölüm bazlı satır içi düzenleme |
| Dışa aktar | Açık açıklama | Çerçeveli iki düğme koyu temada görünmez (S5); metin "sunucuya yüklenmez" derken düğme "Bulut bağlantısı oluştur" — **çelişki** | Gizlilik metnini seçime göre değiştir, düğmeleri ayır |
| Geri bildirim | Basit | İki paralel yol ("Paylaşım ekranını aç" pasif, "Destek kaydı oluştur" her zaman etkin) hangisinin önerildiği belli değil | Tek birincil yol |
| Hesap sil | Güvenli | Onay kutusu küçük; pasif yıkıcı düğme etkin gibi (S8) | Büyük dokunma alanı, net pasif görünüm |
| Uygulama kilidi | Güçlü kurulum | Etkinleştirme düğmesi üç açıklama metninin altında; yarım ekran boş | Adım adım kurulum |
| Giriş / kayıt | Güçlü marka, açık metin | Uygulamanın geri kalanından farklı bir dil; "kullanım şartlarını" cümle başında küçük harfle | Aynı dil, düz yüzey |

## Erişilebilirlik ve kontrast

**Güçlü yanlar:** Metin kontrastı iki temada da yeterli; 62 `accessibilityLabel`, çoğu etkileşimli öğe rol alıyor; çevrimdışı durum ve kilit akışı ekran okuyucuya açık; yazı boyutu 1,5 ve küçük ekranda taşma gözlenmedi.

**Sorunlar:**
1. Bileşen sınırı kontrastı (S5): koyu temada kenarlık 1,4:1, outline 2,2–2,4:1.
2. Grafik renkleri açık temada 3:1'in altında (S6); grafikte yalnız renk anlam taşıyor, etiket yok.
3. Küçük metin: 11, 10, 9,5 ve 9 pt (alt gezinme etiketi, çipler, halka etiketi, çubuk etiketi). Büyük yazı ayarında bazıları kesiliyor, diğerleri okunmuyor.
4. Yalnız renkle ayırt edilen durumlar: takvim noktaları, kırmızı/turuncu aciliyet, "gecikmiş" ve "bugün".
5. 93 `Pressable` var; yalnızca 62 etiket ve 48 hedef-boyut düzenlemesi saptandı (grep). Arşiv ikon düğmeleri ve satır içi düzenle/sil ikonları için etiket doğrulanmalı.
6. Pasif durum sadece opaklıkla (S8); durum bilgisi `accessibilityState` ile veriliyor mu denetlenmeli.
7. TalkBack ile grup başlıkları ve gezinme sırası denenmedi (Dev client artefaktları dışında).

## Metinler (mikro metin, boş durum, hata)

| Sorun | Örnek | Öneri |
|---|---|---|
| Belirsiz durum kelimesi | Ödeme satırlarında ve kayıtta "Geçti" | "Ödendi" (ödeme için), "Geçmiş" (tarih için) |
| İç sistem dili | "Silme özelliği sunucu güncellemesini bekliyor." "Bildirim ertelenemedi. İzinleri ve kapasiteyi kontrol et." "hatırlatma temizliği yeniden açıldığında denenecek" | Kullanıcının yapabileceği eylemi söyle: "Silme şu an kullanılamıyor. Daha sonra tekrar dene." |
| Çelişkili güven mesajı | Dışa aktarma: "sunucuya yüklenmez" ve "Bulut bağlantısı oluştur" | Seçeneğe göre değişen metin |
| Tutarsız büyük/küçük harf | "Aboneliği İptal Et" (Title Case) / "Aboneliği sil"; kayıt ekranında "kullanım şartlarını …" | Cümle düzeni |
| Çift ses | "İptal ettim / Durdurdum" (birinci tekil) ile "iptal edersen" (ikinci tekil) | Tek ses: ikinci tekil |
| Tekrarlayan açıklama | Her kartta "Yenileme öncesi hatırlatmayı abonelik ayrıntılarından yönetebilirsin" | Bir kez göster ya da kaldır |
| Yanıltıcı sayı dili | "Geçen aya göre %94 daha az", "En yüksek tutarlı 3 aboneliğini iptal edersen …tasarruf" | Neyin neyle kıyaslandığını yaz; öneriyi tarafsız yaz |
| Boş durum | CSV içe aktar, Ödeme yöntemlerinde pasif "Kaydet" | Ne yapacağını ve sonucu anlat; boş ekranda pasif düğme gösterme |
| Teknik/Flutter sızıntısı | "Çoklu seçim" bağlantısı bağlamsız, "Tanıtım turunu yeniden başlat" | Eylemi ve konumu netleştir |

## Yeniden tasarım yönü (öneri)

Hedef: **"Bu ay ne ödeyeceğim?" sorusuna iki saniyede yanıt veren sakin bir finans aracı.** İki katmanda ilerlemek mantıklı:

**Katman 1 — Sistem sadeleştirme (düşük risk, yüksek getiri)**
1. Tip ölçeğini ~9 semantik role indir: display, title, heading, body, bodyStrong, label, caption, overline, numeric (tabular rakam). En küçük boyut 12.
2. Font: değişken font gömüp tüm ağırlıkları gerçekten kullanmak ya da ağırlık sayısını 2'ye (400/600) indirmek.
3. Köşe yarıçapı 4 kademe (4, 8, 12, 20) + pill; boşluk 4 tabanlı 8 kademe.
4. Kenarlık/outline tokenlarını ≥3:1'e çek (koyu için ~#6B7385, açık için ~#6F7688 zaten 4,3); grafik paletini açık tema için koyulaştır veya doğrudan değer etiketi ekle.
5. Tek düğme hiyerarşisi: dolu (birincil), tonlu (ikincil), metin (üçüncül), yıkıcı ayrı stil; yıkıcı eylemler asla bağlantı olarak durmaz.
6. Giriş/kayıt/tanıtım ekranlarını aynı yüzey diline getir (ambiyansı tanıtımla sınırla).

**Katman 2 — Bilgi mimarisi (orta risk)**
1. **Ana sayfa:** "Bu ay": ödenen / kalan tutar, altında tarihe göre sıralı "Sıradaki ödemeler" zaman çizelgesi; analizler ikinci ekrana.
2. **Liste:** "Geciken ödemeler" (gecikmiş, bugün) en üstte, sonra normal liste; satır iki satır.
3. **Detay:** tek bağlamsal birincil eylem ("Ödendi" ya da "Yenile"); Duraklat/Arşivle/İptal/Sil bir "⋯" menüsünde, silme en altta ve yıkıcı renkte.
4. **Form:** zorunlu alanlar (ad, tutar, sıklık) ilk ekranda, tarih akıllı varsayılan, gerisi "Daha fazla" altında; seçili çipler dolgulu.
5. **Bildirim merkezi:** güne göre grup, tutar ve satırda "Ödendi / Ertele" eylemleri.
6. **İstatistik:** etiketli eksen, seçili ay vurgusu, boş ay açıklaması; tasarruf ekranı yargılayıcı öneri yerine "yıllık maliyet sıralaması".

**Önerilen sıra:** (1) sistem sadeleştirme + kontrast + font düzeltmesi, (2) metin düzeltmeleri, (3) detay ve ana sayfa yeniden tasarımı, (4) form ve bildirim merkezi. Her adım kendi PR'ında, açık/koyu ekran görüntüsü karşılaştırmasıyla.

## Açık sorular

1. Başlık fontu gerçekten sistem fontuna mı düşüyor? (`fontFamily` + `fontWeight` kombinasyonunu cihazda ve `Text` üzerinde doğrula.)
2. Boş, hata ve yükleme durumları ekranlar için ayrıca gözden geçirilmeli (bu tur yalnız veri yüklü durumdu).
3. Tanıtım ekranları ve giriş akışı güncel görüntüyle yeniden incelenmeli (oturumu kapatmadan alınamadı).

## Uygulanan düzeltmeler (aynı gün)

Plan kapsamı: sistem sadeleştirme ve hızlı ekran düzeltmeleri; ekran yeniden tasarımı yok. Önce/sonra görüntüleri: `docs/operations/evidence/design-2026-10-13/` (`before`: koyu|açık, `after`: önce-koyu|sonra-koyu|sonra-açık).

**Sistem**
- Yazı tipi: Hanken Grotesk statik ağırlıklar (`@expo-google-fonts/hanken-grotesk`, 400/500/600/700), `fontWeight` kullanılmıyor. Emülatörde başlıklar artık gövdeyle aynı yazı tipinde (S3 doğrulandı: önceki başlıklar sistem fontuyla çiziliyordu).
- Tip ölçeği 12 çekirdek role indi (display, headline, title, heading, body, bodyStrong, bodySmall, label, caption, captionStrong, overline, numeric); en küçük boyut 12; eski rol adı çağrısı kalmadı.
- Köşe yarıçapı beş kademe (xs, sm, md, lg, pill); eski adlar geçiş takma adı olarak duruyor.
- Kontrast: `controlBorder` (koyu 3,6–3,9:1; açık 3,3–3,8:1), `disabledSurface`/`disabledText`, açık tema grafik paleti ≥3,8:1; grafik teması `chartTheme.ts`'e ayrıldı (saf `palette.ts` domain tarafından import edilebiliyor). `contrast.test.ts` iki temada oranları korur.
- Bileşenler: `TonalButton` (yeni), `PrimaryButton`/`TextLink` `tone="danger"`, dolgulu seçili çip, 48 dp onay kutusu, kontrastlı alan sınırları. `OutlinedButton` artık `TonalButton`'a yönlendiren ince bir sarmalayıcıdır.

**Ekranlar ve metinler:** dışa aktarma gizlilik metni, arşiv etiketli düğmeler, ödeme yöntemlerinde boş durum, profil ve geri bildirim akışları, CSV boş durum adımları, takvim işaretleri (gecikmiş ve 3 gün), abonelik listesinde "Geciken ödemeler" grubu ve sadeleşen satır, detay ve iptal akışı metinleri, ana sayfada yanıltıcı yüzdenin kaldırılması ve tek hatırlatma şeridi, istatistik grafik etiketi, tasarruf ekranı tarafsız metinleri, bildirim merkezinde güne göre gruplama ve tutar, form çipleri ve tarih satırı. "Geçti" → "Ödendi/Geçmiş", iç sistem dili kullanıcı diline çevrildi; `src/copy.test.ts` yasaklı ifadeleri tarar.

**Güncel puan tahmini (aynı ölçüt, kendi değerlendirmem; bağımsız yeniden inceleme değil):** ekran ortalaması ≈67 → ≈73, tasarım sistemi ≈58 → ≈75. En çok kazanan: dışa aktarma (54→72), CSV içe aktarma (55→68), arşiv (57→67), bildirimler (61→72), liste (67→76).

**Yapılmayanlar ve açık noktalar**
- `ActionMenu` (⋯ menüsü) bileşeni eklenmedi; detay eylem sırası olduğu gibi (yeniden tasarım turu).
- Eski köşe takma adları (`small`, `medium`, `tile`…) ve `gaps` içindeki tek kullanımlık boşluklar duruyor; çağrı yerlerinin kademelere taşınması ayrı iş.
- Arşiv satırında ad üç satıra sarılabiliyor (yan yana iki etiketli düğme yer kaplıyor).
- Form ekranında "Diğer ayrıntılar" satırı kaydet düğmesine yakın.
- `expo-doctor` 7 paketin güncel olmadığını bildiriyor (`npx expo install --check`); bu çalışmadan bağımsız.
- Ana sayfa, detay, form ve bildirim merkezi yeniden tasarımı, iOS ve TalkBack denemesi yapılmadı.

## Ana sayfa ve detay yeniden tasarımı (aynı gün)

Taslaklar sohbette onaylandı; karar: hero "Bu ay kalan ödemeler", ana sayfada satır içi "Ödendi", detayda yaşam döngüsü eylemleri ⋯ alt sayfasında. Görüntüler: `docs/operations/evidence/design-2026-10-13/home-detail/`.

**Ana sayfa:** hero kalan tutar + ödenen/toplam çubuğu; "Geciken ödemeler" (gecikmiş ve bugün vadeli, en çok 3 satır, onaylı satır içi "Ödendi"); "Önümüzdeki 14 gün" günlere gruplu zaman çizelgesi (deneme bitişleri dahil); "Bu ayın dağılımı" yığılmış çubuk. Kalkanlar: yanıltıcı yüzde ve halka, üç özet çipi, hızlı işlemler, tasarruf kartı, donut, kart içi tekrarlanan hatırlatma şeritleri.

**Detay:** kompakt hero + ⋯ alt sayfa menüsü (Duraklat/Devam et, Arşivle, İptal ettim, Yanlış kaydı sil); ödeme kartında tek birincil eylem "Ödendi ve yenilendi" (vadesi gelmişse) ve sonuç açıklaması; yıllık maliyet ve şimdiye kadar ödenen özet kutuları; Sıklık, Kategori, Ödeme yöntemi ve Hatırlatma gruplu satırlar; son 3 ödeme; yalnız "Nasıl iptal edilir?" düğmesi. Sayfa sonundaki beş eylemlik yığın ve "Aboneliği sil" bağlantısı kalktı.

**Emülatör doğrulaması:** koyu ve açık tema, yazı 1,5; ⋯ menüsü açıldı; gerçek "Ödendi" dokunuşu yapılmadı (canlı hesaba yazar). Yazı 1,5'te gecikmiş satır alt metni kesilmesin diye iki satıra izin verildi.

**Puan tahmini (kendi değerlendirmem):** ana sayfa 79 → ≈86, detay 73 → ≈83; ekran ortalaması ≈74.

**Açık noktalar**
- Gerçek "Ödendi" onayı ve yenileme akışı emülatörde denenmedi (yalnız birim testi ve mock).
- Ödeme geçmişi sayfası (`/stats/payments`) tüm abonelikleri listeler; detaydaki "Tümünü gör" aboneliğe filtre uygulamaz.
- Hero'nun üst bandında iki tonlu arka plan (dairesel parıltı + alt bant) cihazda gözle değerlendirilmeli.
- Detayda duraklatılmış, iptal, arşiv ve süresi dolmuş kayıt durum açıklamaları yeni yazıldı; ürün onayı bekler.
- Gecikmiş vadede "Sonraki döngü (tahmini)" ve "…sonraki tarih … olur" aynı tarihi iki kez gösterir.

## Abonelik formu ve bildirim merkezi yeniden tasarımı (aynı gün)

Taslaklar sohbette onaylandı; kararlar: yenileme sıklığı dörtlü segment, ek alanlar gruplu satırlar ve deneme anahtarı, bildirim merkezinde satır içi onaylı "Ödendi", ×N tekrar gruplama, Tümü/Okunmamış filtresi ve izin bandı. Görüntüler: `docs/operations/evidence/design-2026-10-13/form-notifications/`.

**Form:** tutar satırı (para birimi çipi + büyük tutar), `SegmentedControl` ile yenileme sıklığı, tek yenileme kartı (tarih, otomatik/elle açıklaması, hatırlat çipleri), kategori/ödeme yöntemi/deneme için gruplu satırlar, "Daha fazla seçenek" (başlangıç, ilk ödeme, not), alt çubukta maliyet özeti ("₺761,12 / ay · Yılda ₺9.133,44"). Değerler, doğrulama ve kayıt akışı değişmedi.

**Bildirim merkezi:** servis logolu satırlar, tutar, ×N tekrar gruplama, filtre, üst çubukta okundu/ayarlar ikonları, vadesi gelmiş kayıtta onaylı "Ödendi" ve "Aboneliği aç", erişilebilirlik eylemleri (Kapat, Okundu say), izin kapalı bandı, iki boş durum. `notificationLocalState.dismiss` artık tek kimlik ya da kimlik listesi alır (grup kapatma için).

**Emülatör doğrulaması:** koyu ve açık tema, yazı 1,5, maliyet özeti, filtre ve gruplama. Gerçek "Kaydet" ve "Ödendi" dokunuşları canlı hesaba yazacağı için denenmedi.

**Puan tahmini (kendi değerlendirmem):** form 75 → ≈85, bildirim merkezi ≈72 → ≈84; ekran ortalaması ≈76.

**Açık noktalar**
- "Okunmamış (N)" okunmamış grup sayısıdır; ana sayfadaki zil rozeti kayıt sayar, iki sayı farklı çıkabilir.
- Satırdaki tarih etiketi kalktı, gün bilgisi yalnız bölüm başlığından gelir.
- Hataya kaydırma gerçek cihazda ayrıca doğrulanmalı; hata mesajı "Ayrıntılarda düzeltilecek alan var" bölüm adı değiştiği için gözden geçirilmeli.
- Ödeme yöntemi alanı hata varken kendiliğinden açılır ve kullanıcı kapatamaz.

## İstatistik ve takvim yeniden tasarımı (13 Ekim 2026)

- **Takvim:** tekrarlayan yenilemeler aylara yansıtılır (`calendar/domain/projectedRenewals.ts`, birim testli), ay toplamı yansıtmaları içerir; seçili günden bağımsız "Gecikmiş" bölümü ve satır içi onaylı "Ödendi" (`OverdueSection`); "Bugüne git" kısayolu.
- **İstatistik:** dönem seçici `SegmentedControl` oldu, grafikte en yüksek değer çizgisi ve aylık ortalama, kısayol kartları gruplu satırlara indi.
- **Doğrulama:** jest 141 paket / 879 test, tsc ve lint temiz. Emülatörde (Android, koyu tema, yazı 1,0 ve 1,5) takvim ve istatistik görsel olarak doğrulandı: kanıt `docs/operations/evidence/design-2026-10-13/stats-calendar/`. Açık tema da doğrulandı (kanıt: `*-light.png`); gerçek "Ödendi" yazması denenmedi.
- **Açık:** "Kalan" toplamı eklenmedi: ödenen yenilemeler tarih ilerlediği için veriden ayırt edilemez, ay toplamı zaten kalan tutardır. Kategori yığın çubuğu ve öne çıkanlar kartı mevcut haliyle kaldı.
