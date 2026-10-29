# Ürün ve tasarım brifi

## Ürün

SubscriptTrack: manuel abonelik takip, yenileme ve deneme bitişlerini hatırlama, çoklu para birimini ayrı izleme, ödeme geçmişi, tahmini tasarruf, offline dayanıklılık. Banka/otomatik iptal/kur dönüştürme ürünü değildir.

## Hedef kullanıcı deneyimi

- Kullanıcı 3 saniyede bu ayki ödeme durumunu anlamalı: ne ödendi, ne kaldı, ne zaman yeniden ödeme var?
- Bir sonraki önemli eylem belirgin olmalı: abonelik ekle, yaklaşan ödemeye bak, ödemeyi onayla, denemeyi değerlendir.
- Tek abonelik, sıfır abonelik ve çok abonelik durumları ayrı kompozisyonlarla ele alınmalı.
- Gecikmiş vade sessizce değişmemeli; kullanıcı onayıyla güncellenmeli.
- Analitikler gerçek veriyi göstermeli, ölçülmemiş eğilim/başarı uydurmamalı.

## Görsel kimlik yönü

- Koyu ve açık temada **premium, sakin, editorial, finansal kontrol merkezi** algısı.
- Sade bir ana renk ve anlam taşıyan durum renkleri; çok renkli neon panolar yok.
- Büyük, okunur finansal rakamlar; güçlü ama ölçülü başlıklar; dikkatli negatif alan.
- Kartların işlevine göre farklı kompozisyon: her bölüm aynı yuvarlak kart + yatay çubuk kalıbı olmayacak.
- Uygun gerçek servis logoları veya saygılı harf/monogram fallback; kullanım hakları kontrolü.
- Anlamlı micro-interaction; animasyon dekoratif değil işlevsel. Reduce-motion desteklenmeli.
- Kategori, ödeme durumu, risk ve tema renkleri ayrı semantik roller taşımalı.
- Hazır UI kit demosu veya jenerik AI üretimi görünümünden kaçın.

## Mevcut ekranın gözlenen problemleri (28 Ekim kullanıcı ekranı)

1. Alt bölüm gereğinden fazla boş kalıyor; düşük veri yoğunluğunda tasarım zayıf.
2. Hero'da “Bu ay tüm ödemeler tamam” ifadesi ana parasal özetten baskın.
3. Bölümler birbirine benzeyen büyük kartlardan oluşuyor; ritim zayıf.
4. Tek kategorili dağılımda tamamen dolu çubuk bilgi açısından zayıf.
5. Abonelik ekleme ve mevcut aboneliğe geçiş ana ekranda yeterince belirgin değil.
6. Mor vurgu dışındaki ayırt edici görsel marka kimliği zayıf.

## Görsel kaliteyi ne artırır?

- Bilgi mimarisi ve hiyerarşi, kart sayısı ve yüzey yoğunluğu yeniden değerlendirilsin.
- Hero'da `kalan tutar`, `ödenen/toplam`, `gerçek durum`; veri eksikse sahte sıfır gösterme.
- Yaklaşan ödeme yoksa kompakt empty state; varsa erişilebilir servis satırları.
- Abonelik özeti ve birincil ekleme eylemi görünür; kullanıcının asıl işine hızlı erişim.
- İstatistik ve kategori görselleri ancak veri ayırt etmeye yarıyorsa kullanılmalı.
- Düzen gerçek Android/iOS ekran görüntülerinde (küçük telefon / büyük telefon / font scaling) test edilmeli.

## Başarı çerçevesi

- Anahtar eylemlere erişim adımı ve kullanıcı testi (baseline ile karşılaştır).
- Her ekran için boş, az veri, çok veri, hata, offline, loading, erişilebilirlik durumları.
- WCAG kontrast / dokunma hedefleri; minimum boyut mevcut tasarım sözleşmesine göre.
- Performans: ekran açılışı, kaydırma, animasyon, liste hacmi; ölçüm olmadan performans kazanımı iddia edilmez.
