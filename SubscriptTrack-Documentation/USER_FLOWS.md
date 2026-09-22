# Kullanıcı Akışları

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

Push izni onboarding'in ilk saniyesinde istenmez. Önce bildirim değerini gösteren açıklayıcı ekran kullanılır.

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
Push bildirime dokun
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

Geri bildirim, uygulama içi destek kaydı oluşturmaz; kullanıcı kategori ve
mesajı girdikten sonra cihazın paylaşım ekranını açar. Yasal belgeler, belge
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
