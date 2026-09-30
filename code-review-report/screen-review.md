# Ekran incelemesi (2026-09-30)

Yöntem: uygulamanın `flutter build web --release` çıktısı yerel modda (Supabase yok, yerel hesap) tarayıcıda 404×745 telefon görünümünde açıldı; ekranlar tek tek gezildi, ekran görüntüleri alındı, formlar dolduruldu (yeni hesap, iki abonelik, ödeme kaydı, arşivleme). Konsolda hata çıkmadı.

**Sınırlar:** gerçek cihaz değil (bildirim, biyometri, paylaşım, dosya seçici denenmedi); yalnızca koyu tema; çevrimdışı/hata durumları yerel modda tetiklenemedi; ekran okuyucu ve yazı ölçeği denenmedi.

## Gezilen ekranlar (27 ekran gezildi, 4 ekran denenmedi)

| Ekran | Durum | Not |
|---|---|---|
| Tanıtım (4 sayfa) | ✔ | Slayt 3'teki "%18 tasarruf" sabit pazarlama görseli |
| Giriş | ✔ | Doğrulama iletileri çalışıyor; sosyal giriş yokken "veya" ayracı yalnız kalıyor |
| Kayıt | ✔ | Onay kutusu işaretlenmeden düğme pasif; şartlar metni alta kırılıyor |
| Şifremi unuttum | ✔ | Yerelde "kullanılamıyor" durumu; arka plan diğer auth ekranlarından farklı (düz siyah) |
| Ana sayfa | ✔ | Boş ve dolu durum; boş durumda iki ayrı "ekle" çağrısı |
| Abonelikler + filtre sayfası | ✔ | |
| Yeni abonelik / Düzenle | ✔ | Düzenlemede "Popüler servisler" çipleri de görünüyor |
| Abonelik detayı + menü | ✔ | |
| İstatistikler | ✔ | |
| Tasarruf analizi | ✔ | "3 abonelik" ifadesi 2 abonelikte de sabit |
| Ödeme geçmişi | ✔ | |
| Takvim | ✔ | |
| Bildirim merkezi | ✔ | |
| Ayarlar sekmesi | ✔ | Sağdaki değer metinleri kesiliyor |
| Profil, Bildirim tercihleri, Ödeme yöntemleri, Görünüm, Uygulama kilidi | ✔ | |
| Gizlilik merkezi, Gizlilik politikası, Kullanım şartları | ✔ | |
| Verileri dışa aktar, Hesabı sil, Geri bildirim | ✔ | |
| CSV içe aktar (+ örnek biçim penceresi) | ✔ | |
| Arşiv | ✔ | |
| **Denenmedi** | – | Açılış (splash), Yeni şifre, PIN kilit katmanı, "abonelik bulunamadı" ekranı |

## Bulgular

### Hata / yanıltıcı içerik
1. **Tasarruf analizi:** "En yüksek tutarlı 3 aboneliğini iptal edersen" metni abonelik sayısı 3'ten azken de aynı (2 abonelikle görüldü). Sayıyı gerçek adede bağla.
2. **İstatistikler, hero kart:** önceki ayda kayıt yokken "₺209,98 artış" gösteriliyor; karşılaştırma tahmini tutarı boş bir aya oranlıyor. Önceki ay verisi yoksa değişim gösterilmemeli.
3. **Düzenle ekranı:** "Popüler servisler" çipleri açık; bir çipe dokunmak mevcut aboneliğin adını ve kategorisini değiştirir. Yalnızca ekleme ekranında gösterilmeli.
4. **Arşivleme:** onay veya "geri al" bildirimi yok; abonelik anında listeden kalkıyor.
5. **Kategori:** "Spotify" adı elle yazılınca marka simgesi tanınıyor ama kategori "Diğer" kalıyor (çipten seçince kategori atanıyor).

### Tutarsızlık / küçük UX
6. Ana sayfa boş durumunda iki çağrı: "Hemen başla" ve "İlk aboneliğini ekle".
7. "Bugün · 0 gün kaldı" (ana sayfa) ve detayda "Bugün" + "0 GÜN KALDI": aynı bilgi iki kez.
8. Tarih biçimi: formlarda ve profilde "30/9/2026", ana sayfada "30 Eylül".
9. Ödeme yöntemleri ekranında iki "ekle" denetimi (üst çubuk "+" ve yüzen düğme).
10. Metin kesilmeleri: ayarlar satırlarının değerleri ("Onboarding ekranlarını t…"), profildeki e-posta yardım metni, hızlı işlemlerde "Kategorileri inc…".
11. Uygulama kilidi ve Görünüm ekranları diğer ayar ekranlarından daha sade/soluk; PIN kapalıyken biyometri anahtarı neden pasif olduğunu söylemiyor.
12. Kaydet düğmesi: ekleme ekranında sabit alt çubuk, düzenlemede listenin sonunda.
13. Ödeme geçmişinde tutar küçük ve düşük vurgulu.
14. Giriş: sosyal düğmeler yokken "veya" ayracı anlamsız kalıyor.

### Yalnızca web'de görülenler (mobilde geçerli değil)
- Bildirim listesinde emoji simgesi ilk karede boş kutu olarak çıkıyor (yazı tipi geç yükleniyor).
- Adres çubuğundaki `#/…` bağlantısı sayfa içinden değiştirilince yönlendirme yapmıyor.

## Sonuç
Ekran içerikleri tutarlı ve işlevsel; kritik bir çökme veya taşma görülmedi. Öncelikli düzeltmeler 1–4 (yanıltıcı içerik ve geri alınamaz eylem). Kalan maddeler görsel tutarlılık.
