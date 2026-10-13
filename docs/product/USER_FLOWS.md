# Kullanıcı Akışları

> Akışlar uygulanan ekranlarla eşleşir. Push ifadeleri bugün **yerel bildirim** anlamındadır (uzak push yok). Cihazda doğrulama durumu: [DEVICE_ACCEPTANCE.md](../operations/DEVICE_ACCEPTANCE.md).

## 1. İlk açılış ve giriş

```text
Splash
→ Oturum kontrolü
→ İlk kullanım ise onboarding
→ Giriş/kayıt
→ Ana Sayfa
```

Alternatifler:

- Oturum geçerliyse onboarding/auth atlanır.
- Ağ yok ve geçerli local session varsa cache içerik açılır.
- Oturum süresi dolmuşsa kullanıcı auth ekranına yönlendirilir.

## 2. Onboarding

Amaç: Ürünün değerini üç kısa mesajla anlatmak.

1. Aboneliklerini tek yerde gör
2. Yenilemeden önce haber al
3. İptal ettiklerinin tasarrufunu gör

Bildirim izni onboarding'in ilk saniyesinde istenmez. Önce bildirim değerini gösteren açıklayıcı ekran kullanılır.

## 3. İlk aboneliği ekleme

```text
Ana Sayfa boş durumu
→ “İlk aboneliğini ekle”
→ Servis ara/seç veya özel servis
→ Fiyat + para birimi
→ Döngü + yenileme tarihi
→ Kategori
→ Kaydet
→ Dashboard özeti
```

Başarısız kayıtta:

- Form içeriği korunur.
- Alan hatası ilgili alan altında gösterilir.
- Sunucu hatasında tekrar deneme sunulur.

## 4. Ücretsiz deneme ekleme

```text
Abonelik ekle
→ “Ücretsiz deneme” seç
→ Trial bitiş tarihi
→ Ücretliye dönüşecek fiyat
→ Bildirim planı
→ Kaydet
```

Trial kartı normal aktif abonelikten belirgin biçimde ayrılır.

## 5. Abonelik listesini kullanma

```text
Abonelikler
→ Arama veya filtre
→ Kart seç
→ Detay
```

Filtreler:

- Durum
- Kategori
- Para birimi
- Yaklaşan tarih

## 6. Abonelik düzenleme

```text
Detay
→ Düzenle
→ Alan değiştir
→ Kaydet
→ Detay ve cache güncellenir
```

Fiyat değişikliğinde event kaydı oluşturulur ve kullanıcıya yıllık etkisi gösterilebilir.

## 7. Bildirimden aboneliğe gitme

```text
Bildirime dokun (yerel bildirim)
→ Uygulama açılır
→ Oturum doğrulanır
→ Deep link çözülür
→ Abonelik detayı
```

Kaynak bulunamazsa:

- “Bu abonelik artık mevcut değil” mesajı
- Ana abonelik listesine dönüş

## 8. Aboneliği durdurma

```text
Abonelik detayı
→ Durdur
→ Açıklama/onay
→ Durum PAUSED
→ Gelecek normal bildirimler kapanır
→ Dashboard güncellenir
```

## 9. Aboneliği iptal etme

```text
Detay
→ İptal seçenekleri
→ Sağlayıcı iptal sayfasını aç veya “İptal ettim”
→ İptal tarihi ve erişim bitişi
→ Durum CANCELLED
→ Tasarruf özeti
```

Kullanıcıdan iptal sebebi opsiyonel alınabilir; analytics'e kişisel not gönderilmez.

## 10. Aboneliği arşivleme

```text
Detay
→ Arşivle
→ Onay
→ ARCHIVED
→ Ana listeden kalkar
→ Arşiv filtresinden erişilebilir
```

## 11. Takvim akışı

```text
Takvim
→ Ay değiştir
→ Ödeme olan gün
→ Gün detay sheet
→ Abonelik seç
→ Detay
```

## 12. Bildirim merkezi

```text
Ana Sayfa zil
→ Bildirim listesi
→ Okunmamış filtre
→ Bildirim seç
→ İlgili abonelik/aksiyon
```

## 13. Bildirim izni reddi

```text
Pre-permission açıklaması
→ Sistem izin penceresi
→ Kullanıcı reddeder
→ Uygulama çalışmaya devam eder
→ Ayarlarda açma yönergesi gösterilir
```

Uygulama kullanıcıyı her açılışta rahatsız etmez.

## 14. Offline kullanım

```text
Uygulama açılır
→ Ağ yok
→ Son cache gösterilir
→ Offline banner
```

Yazma girişiminde:

- Form korunur.
- Bağlantı gerektiği açıklanır.
- Tekrar deneme sunulur.

## 15. Ayarlar bilgi mimarisi

Alt gezinmedeki **Ayarlar** sekmesi; Hesap bilgileri, Tercihler, Uygulama,
Veri ve gizlilik ile Destek bölümlerinden oluşur. Hesap bilgileri profil ve
şifre işlemlerine gider; hassas export ve hesap silme aksiyonları yalnızca
**Gizlilik ve veri merkezi** altında bulunur.

Geri bildirim ekranında kullanıcı kategori ve mesajı girer; Supabase
yapılandırılmışsa **destek kaydı** oluşturulur (`support-catalog` POST →
`support_tickets`), ayrıca cihazın paylaşım ekranı da açılabilir. Yerel modda
(Supabase yok) yalnızca paylaşım vardır. Yasal belgeler, belge
sürümü ile son güncelleme tarihini ve önce kısa özeti gösterir.

## 16. Veri dışa aktarma

```text
Ayarlar
→ Hesap ve Gizlilik
→ Verileri dışa aktar
→ Format seç
→ Export hazırlanıyor
→ Hazır olduğunda güvenli indirme/paylaşım
```

CSV, kullanıcının trial, active, paused, cancelled, expired ve archived durumlarındaki tüm abonelik kayıtlarını içerir. Bu kapsam 10 Ekim 2026 ürün kararıdır; Flutter'ın mevcut cihaz CSV'si geçiş süresince eski dar kapsamıyla korunur.

## 17. Hesap silme

```text
Ayarlar
→ Hesap ve Gizlilik
→ Hesabı sil
→ Etki açıklaması
→ Yeniden doğrulama
→ Son onay
→ Silme workflow'u
→ Oturum kapatma
```

Silme ekranı yanıltıcı veya zorlaştırıcı olmamalıdır.

## 18. Ana sayfa ve abonelik detayı (Expo, 13 Ekim 2026 yeniden tasarım)

**Ana sayfa** soruya yanıt verir: "Bu ay ne ödeyeceğim?"

```text
Ana Sayfa
→ Hero: Bu ay kalan ödemeler (büyük tutar), ödenen/toplam çubuğu
→ Geciken ödemeler (vadesi bugün gelmiş ya da geçmiş kayıtlar, en çok 3 satır, +N daha)
   → Satırdaki "Ödendi" → onay ("<Ad> ödendi mi? Yenileme tarihi <yeni tarih> olacak.")
      → yenileme onaylanır, tarih ilerler, liste yenilenir
   → Satıra dokun → abonelik detayı
→ Önümüzdeki 14 gün (günlere gruplu yenilemeler ve deneme bitişleri) → Takvim
→ Bu ayın dağılımı (yığılmış çubuk, ana para birimi) → İstatistikler
```

- Hero tutarı para birimi başına hesaplanır, kur dönüşümü yoktur. `kalan` = yenileme tarihi bu ayın sonuna kadar olan aktif kayıtların tutarı (gecikmiş ve bugün dahil; haftalıkta kalan her vade ayrı sayılır); `ödenen` = bu ay `PAID` ödemeler; `toplam` = ikisinin toplamı.
- Otomatik tarih ilerletme yoktur; "Ödendi" kullanıcı onayıyla çalışır (DOMAIN §7). Çevrimdışıyken eylem mevcut kuyruk davranışıyla bekler.
- Tasarruf özeti ve hızlı işlemler ana sayfadan kaldırıldı: tasarruf İstatistikler'deki karttan, ekleme ve takvim üst çubuk ve alt gezinmeden erişilir.

**Abonelik detayı**

```text
Detay
→ Hero (logo, ad, tutar · kategori, durum çipi); ⋯ menüsü
→ Ödeme kartı: sonraki tarih, geri sayım çipi
   → vadesi gelmişse birincil "Ödendi ve yenilendi"
→ Özet: Yıllık maliyet · Şimdiye kadar ödenen
→ Ayrıntılar (Sıklık, Kategori, Ödeme yöntemi, Hatırlatma; dokununca düzenle)
→ Son ödemeler (en çok 3) → Tümünü gör
→ "Nasıl iptal edilir?" → iptal akışı (§9)
⋯ menüsü (alt sayfa): Duraklat / Devam et, Arşivle, İptal ettim, Yanlış kaydı sil
```

- Yaşam döngüsü eylemleri yalnızca ⋯ menüsündedir; sayfa sonunda eylem yığını yoktur. Yıkıcı eylem ("Yanlış kaydı sil") menünün en altında, hata renginde ve mevcut kalıcı silme/arşiv kurallarına (ADR 0006) bağlıdır; silme kullanılamıyorsa kullanıcıya "Silme şu an kullanılamıyor" mesajı gösterilir.

## 19. Abonelik formu ve bildirim merkezi (Expo, 13 Ekim 2026 yeniden tasarım)

**Form (ekleme ve düzenleme)** tek ekranda, yukarıdan aşağıya:

```text
Hızlı seç (yalnız ekleme) → Servis adı
→ Para birimi çipi + büyük Tutar alanı
→ Ne sıklıkla yenileniyor? (Haftalık / Aylık / 3 aylık / Yıllık segmenti)
→ Yenileme kartı: Sonraki ödeme tarihi (otomatik ya da elle), Hatırlat çipleri
→ Ek alanlar: Kategori, Ödeme yöntemi, Ücretsiz deneme anahtarı (açılınca bitiş tarihi ve deneme sonrası fiyat)
→ Daha fazla seçenek: Başlangıç tarihi, İlk ödeme (yalnız ekleme), Notlar
→ Alt çubuk: "₺761,12 / ay · Yılda ₺9.133,44" özeti + Kaydet
```

- Değerler, doğrulama ve kayıt akışı değişmez; yalnız sunum yeniden düzenlendi. Doğrulama hatası ilk hatalı bölüme kaydırır; kapalı "Daha fazla seçenek" içindeki hata bölümü açar.
- Maliyet özeti yalnız geçerli tutarda görünür; yıllık ve aylık eşdeğer ortak tam sayı hesabıyla (`annualAmount`/`monthlyAmount`) üretilir, kur dönüşümü yoktur.

**Bildirim merkezi**

```text
Bildirimler
→ Üst çubuk: Tümünü okundu say, Bildirim ayarları
→ Filtre: Tümü / Okunmamış (N)
→ Gün grupları (Bugün, Dün, Bu hafta, Daha eski); tekrar eden bildirimler "×N" ile tek satır
   → Satır: servis logosu, ad, kısa metin · tutar
   → Vadesi gelmiş abonelikte: "Ödendi" (onaylı) ve "Aboneliği aç"
→ Bildirim izni kapalıysa: uyarı bandı + Ayarları aç
```

- "Ödendi" ana sayfadaki "Geciken ödemeler" ile aynı onaylı yenileme akışını kullanır (§18). Vadesi gelmemiş ya da silinmiş aboneliklerde eylem satırı çıkmaz.
- Okundu ve kapatma eylemleri grubun tüm bildirimlerine uygulanır. Kaydırarak kapatma erişilebilirlik eylemleriyle ("Kapat", "Okundu say") de yapılabilir.

## 20. İstatistik ve takvim (Expo, 13 Ekim 2026 yeniden tasarım)

**İstatistik:** Hero (tahmini aylık ve yıllık gider, geçen aya göre değişim) → **Ödeme geçmişi** kartı: `SegmentedControl` ile 3/6/12 ay, seçili ay toplamı, sütun grafiği (üstte en yüksek değer çizgisi, altta ay etiketleri) ve aylık ortalama → Öne çıkanlar → Kategori dağılımı → gruplu iki satır: Tasarruf analizi, Ödeme geçmişi.

**Takvim:** Ay çubuğu (önceki/sonraki ay, "Bugüne git") ve ay toplamı → ay ızgarası → **Gecikmiş** bölümü (seçili günden bağımsız; kırmızı çerçeveli satır, "N gün gecikti", onaylı **Ödendi**) → seçili günün yenileme ve deneme bitişleri.

- **Tekrarlayan yenileme projeksiyonu (yalnız gösterim):** aktif aboneliğin `nextRenewalDate` değeri bugünden sonraki aylara döngü döngü (haftalık +7 gün; aylık, 3 aylık, yıllık ay ekleme, fatura günü korunur, ay sonu kırpılır) yansıtılır. Ay toplamı bu yansıtmaları içerir, para birimi başına tam sayı minör birimle toplanır. Geçmiş aylar için projeksiyon yoktur; geçmişi ödeme kayıtları anlatır. Kayıt, bildirim ve `nextRenewalDate` değişmez.
- Vadesi geçmiş kayıt yalnız kendi tarihinde ve "Gecikmiş" bölümünde görünür; "Ödendi" onaylanınca tarih bugünden sonraki ilk döngüye ilerler (§18) ve sonraki döngüler yeniden projekte edilir.
