# Dashboard: referans ile mevcut ekran farkları ve uygulama planı

Tarih: 29 Ekim 2026. Kaynaklar: kullanıcının referans görseli (863×1822), fiziksel Android ekran görüntüsü (540×1594) ve aşağıdaki Expo kaynakları. Görseller farklı veri ve oranlara sahiptir; birebir piksel karşılaştırması veya başarı ölçümü değildir. Hedefteki değerler örnektir; canlı kayda uygulanmaz.

## 1. Kesin bulgular

1. **İki başlık:** `expo/app/(app)/(tabs)/index.tsx` ekranı `TabScaffold` ile sarar. `expo/src/features/shell/ui/TabScaffold.tsx`, `TopBar` çizer; `DashboardScreen.tsx` ayrıca marka ve bildirim başlığı çizer. Son eklenen başlık, ekran görüntüsündeki tekrarın doğrudan sebebidir. `TopBar` ayrıca gerçek okunmamış sayısını ve takvim eylemini taşır. İkinci başlığı silmek tek başına referanstaki marka başlığını sağlamaz.
2. **Yerleşim sahipliği:** `HeaderShell.tsx` üst güvenli alanı yönetir; `DashboardScreen.tsx` kaydırılabilir alan ve alt boşluğu yönetir; `BottomNavigation.tsx` alt güvenli alanı yönetir. Başlığın tek sahibi ve sabit/kaydırılan davranışı tasarlanmalı; iki kez safe-area eklenmemeli.
3. **Özet yüzeyi:** `HeroCard.tsx` hâlen kenarlıklı, 20 radius, `surfaceHigh` dolguya sahip kart. Referansta kenardan kenara daha geniş, alt köşeleri yumuşak, koyu katmanlı bir yüzey ve dalgalı arka plan var. Hedefe benzemeyen ana yapısal farklardan biridir.
4. **Özet hiyerarşisi:** Mevcut `display` rolü 36, halka `sizes.ringSize` 64; referansta tutar ve halka çok daha baskın. Etiket, tutar, para birimi, halka, ayraç ve iki alt değer aynı hizalama sistemiyle yeniden tasarlanmalı. Resim pikselleri cihaz dp ölçüsü değildir; sabit görsel boyutlarını doğrudan kopyalama.
5. **Halka semantiği:** `fractionPaid` = ödenen / toplam; sıfır toplamda halka çizilmez. Referanstaki 229,80 / 449,70 ≈ %51 ile tutarlıdır. Yüzde ödenen oranı olarak erişilebilir ad taşımalı, dövizler karıştırılmamalı. `ProgressRing.tsx` SVG ile zaten mevcut; yeni grafik motoru gerekmiyor.
6. **Tamamlandı durumu:** Kullanıcının ekranında 0 kalan, 300 ödenen ve %100 var; referanstaki rakamlarla farklılığı gerçek veri durumundan kaynaklanabilir. Yeşil tamamlandı ifadesi referansta yok ama yararlı bir durum bilgisidir; kompozisyona uygun ikincil satır olarak korunmalı.
7. **Özet kenarları ve boşluk:** Başlık yüzeyinin altındaki boşluk, kartın iç marjları, sol sınır ve satırların düzeni referanstan farklı; `gaps`, `spacing` ve ekran gutter ilişkisi dashboard özelinde yeniden tanımlanmalı. Uzun tutar ve büyük yazıda sığdırma davranışı test edilmeli.
8. **Bölüm başlığı:** `UpcomingTimeline.tsx` başlığı solda, `Takvim` bağlantısını sağda ve `14 gün içinde` metnini altta gösteriyor. Referans başlık ve pencere etiketini tek satırda sunuyor; takvim eylemi alt hızlı işlemlerde. Tek satır daralırsa doğal sarma planlanmalı.
9. **Çizelge:** 14 gün içi satırlar gün gruplu; çizgi her grup içinde tekrar başlıyor, nokta sabit `top: 24`; referansta tarih, sürekli çizgi ve nokta, ikon, ad/açıklama, tutar ve chevron aynı geometrik sistemde. Birden fazla kayıt aynı günde, uzun isim, büyük yazı, RTL varsayımı yapılmadan düzen korunmalı.
10. **Daha sonra:** mevcut bölüm ayrı bir `laterRow`, avatar, nokta, hat, göreli tarih ve chevron yok. İlk iki gün grubunu gösteriyor; iki gruptaki çok sayıda kayıt gösterim sınırını aşabilir. Ortak satırla aynı tasarım diline taşınmalı; sınır kayıt sayısına uygulanmalı ve tümüne erişim korunmalı.
11. **Servis kimliği:** geçerli kod `name.slice(0,1)` kullanıyor; `SubscriptionRowCard.tsx` ve `subscriptions/domain/serviceIdentity.ts` mevcut servis kimliği altyapısını kullanıyor. Bilinen servisler için mevcut güvenli logo/renk eşlemesi, bilinmeyenlerde harf yedeği kullanılmalı; örnek marka logoları gerçek varlık sanılmamalı.
12. **Boş pencere:** kullanıcıda 14 günde ödeme yok; referans iki ödeme gösteriyor. Bu veri farkıdır. Boş mesajı gösterilmeye devam etmeli, 14 gün dışındaki kayıtlar ayrı kalmalı; boş mesajı ve sonraki satırı görsel boşluk ritmine göre yerleştirilmeli.
13. **Dikkat gerektirenler:** `AttentionSection.tsx` bugün/gecikmiş kayıtlara erişim ve onaylı `Ödendi` sunar. Referans bunu kapsamıyor. Bu işlev korunmalı; gerçek gecikme varsa hero ile çizelge arasında öncelikli ve kompakt gösterilmeli; onaysız tarih ilerletilmemeli.
14. **Tahmini dağılım:** `DashboardScreen.tsx` `CategoryBarCard` çiziyor; referansta yok ve kullanıcı ekranında ayrı büyük kart oluşturuyor. Ana sayfadan kaldırıp mevcut istatistik ekranında erişilebilir tutma önerisi; hesaplama veya veriyi silme yok.
15. **Hızlı işlemler:** mevcut `TonalButton` ve bağımsız ortalanmış takvim satırı referanstaki iki satırlı tek yüzeyle eşleşmiyor. Tek yüzeyde artı simgesi, ayırıcı, takvim simgesi ve chevron; iki ayrı erişilebilir buton/48 dp alan; boş durumda da ilk ekleme eylemi korunmalı.
16. **Alt navigasyon:** `BottomNavigation.tsx` üst aktif çizgi, 22 ikon, 64 yüksekliği kullanıyor. Referansta çizgi yok, dolu mor aktif ikon ve metin var; abonelik simgesi grid yerine liste. `app/(app)/(tabs)/_layout.tsx` ikon eşlemesi ve ortak navigasyon stili birlikte ele alınmalı. Bu ortak bileşenin dört sekmeye etkisi ayrıca değerlendirilmeli.
17. **Renk/tema:** `themePalette.ts` ve `themeRuntime.ts` açık/koyu paletleri, `tokens.ts` mevcut rolleri sağlıyor. Referans koyu zemin ve mora yakın vurgu gösteriyor. Hex değerleri görselden kalibre edilmeli; otomatik fotoğraf/sıkıştırma nedeniyle yaklaşık değerlerdir. Açık tema için eşdeğer roller ve kontrast kontrolü gerekir.
18. **Üst sağdaki iki yarı saydam dişli:** fiziksel görüntüde iki kayan simge var; kaynakta bunların kökeni bu incelemede doğrulanmadı. OS/Expo Go/geliştirici aracı veya uygulama katmanı olabilir. Ekran görüntüsü tek başına neden atamaya yetmez; cihazda dokunma/overlay incelemesi gerekir.
19. **Mevcut boş durum:** `showEmptyState`, aktif kayıt ve ödeme özeti yokken farklı yerleşim kullanır; başlık ve ilk abonelik eylemi tek olmalı, scroll ve safe area korunmalı. Yükleme, hata/tekrar dene, offline ve kısmi geçmiş durumları tasarlanmalı.
20. **Veri kapsamı ve tarihler:** `homeSummary.ts` yaklaşanı yarından itibaren 1–14 gün seçer; bugün ve gecikmeler `attentionItems` içindedir. `Money` minor-unit ve IANA timezone kuralları korunmalı. Trial sonrası tutar ve olay türü açık kalmalı; gün sınırları, 14/15. gün ve birden fazla para birimi test edilmeli.
21. **Bildirim rozeti:** ortak scaffold gerçek okunmamış sayısını hesaplar; yeni dashboard başlığı bunu kullanmaz. Birleştirilmiş başlık aynı sayıyı ve erişilebilir etiketi kullanmalı; dekoratif sahte nokta eklenmemeli.
22. **Mevcut görsel risk:** uygulama ekranı gerçek hesap verisi içeriyor; doğrulama sentetik fixture ile yapılmalı. Referansta örnek içerik ve gerçek uygulama görüntüsündeki farklı veri aynıymış gibi kıyaslanmamalı.

## 2. Önerilen uygulama sırası

1. **Kök kompozisyon:** Ana sayfa için `TabScaffold`/`TopBar` seviyesinde tek özel başlık; okunmamış durumunu ve güvenli alanı ortak kabuktan geçir. `DashboardScreen` içindeki ikinci başlığı kaldır. Diğer sekmelerin başlıklarını koru. Tek bildirim düğmesi ve tek safe-area testleri.
2. **Ödeme özeti:** `HeroCard` içinde hedefe uygun esnek geniş yüzey, tipografi, halka ve alt metrik ızgarası; SVG ile hafif arka plan şekli gerekiyorsa dekoratif ve erişilebilirlik ağacından gizli. Dar ekran/büyük yazı ve çoklu para birimi düzenini önceden tanımla.
3. **Tek çizelge satırı:** Yaklaşan ve sonraki kayıtlar için ortak satır; tarih, dikey hat, logo, ad, tür, gün, tutar, chevron. Eş günler ve uzun metinler için layout. 14/15 gün ayrımı domain üzerinden; saat dilimi ve parasal hesaplar değişmez.
4. **Kritik durum ve hızlı işlemler:** gecikme/bugün/deneme gösterimini koru; iki ayrı eylemi tek görsel grupta birleştir. Dağılım kartını ana sayfa kompozisyonundan çıkar ve istatistik erişimini koru.
5. **Alt navigasyon ve tema:** mevcut ortak alt navigasyonu referansla uyumlu hale getirirken dört sekme, safe-area, TalkBack/VoiceOver ve light/dark davranışlarını doğrula.
6. **Gerçek görüntüyle doğrulama:** sentetik 0/1/çok, %100, gecikme, deneme, çoklu para birimi, hata ve offline için Android/iOS ekran görüntüleri; 360/390/430 dp civarı genişlik ve büyük yazı. Her ekran görüntüsü aynı fixture ve viewport ile referansla yan yana karşılaştırılmalı. Gerçek cihaz ve iOS kanıtı elde edilmediyse açıkça belirtilmeli.
7. **Expo bağlantısı:** çalışan tüneli kontrol et; kullanıcıya önceden bildirmeden restart etme. CI modundaki Metro güncel kodu otomatik yenilemez; yeniden başlama gerekirse adres değişebileceğini haber ver, yeni URL oluşursa derhal paylaş. Sabit URL garantisi yok.

## 3. Kabul kontrol listesi

- Tek marka başlığı ve tek bildirim eylemi; gerçek okunmamış sayısı.
- Referansa uygun yüzey, ölçek, çizelge, hızlı eylemler ve alt navigasyon; dar ekranda kesilme yok.
- Ödenen/total oranı doğru; total sıfırsa sahte yüzde yok; her para birimi ayrı.
- Bugün/gecikme, 1–14 gün ve 15+ gün ayrı; deneme metni ve yenileme onayı doğru.
- Boş, yükleme, hata ve offline durumlarında açık mesaj ve çalışan eylem.
- 48 dp dokunma alanları, erişilebilir etiket ve odak sırası, açık/koyu ve büyük yazı.
- Tür kontrolü, lint, anlamlı domain/bileşen testleri, gerçek Android/iOS görsel kabul sınırları kayıtlı.

Bu belge bir inceleme ve uygulama planıdır; hedef görünümün tamamlandığına dair kanıt değildir. Kullanıcının mevcut çalışma ağacı değişiklikleri korunacaktır.
