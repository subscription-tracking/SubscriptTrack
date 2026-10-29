# Plan denetim ve kabul kriterleri

## Strateji kapısı — planın uygulanmasına izin vermeden önce

- [ ] Repo ve çalışma ağacı HEAD doğrulandı; kullanıcı dosyaları korunuyor.
- [ ] Tüm Expo rotaları ve özellik durumları envanterlendi.
- [ ] Kodun yaptığıyla belgelerin iddia ettiği şeyler ayrıldı; belirsizlikler listelendi.
- [ ] Mevcut tasarım tokenları, tipografi, theme provider, shared bileşenler envanterlendi.
- [ ] Dashboard için 0, 1, az, çok kayıt ve ödeme geçmişi eksik durumu tasarlandı.
- [ ] Kalıcı silmenin ürün ve veri saklama sözleşmesi açık karar olarak ayrıldı.
- [ ] Yenileme tarihi kullanıcı onayı olmadan ilerlemiyor; eski Flutter davranışı korunuyorsa geçiş riski kayıtlı.
- [ ] Açık kaynak paketler ihtiyaç, sürüm, lisans, bundle/native riskine göre seçildi. Gereksiz paket eklenmedi.
- [ ] Her sprintte etkilenecek gerçek dosyalar, testler, acceptance ve rollback var.
- [ ] Android/iOS, light/dark, erişilebilirlik ve reduce-motion matrisi var.
- [ ] Bağımsız pazarlama web sitesi mobil dashboard scope'una karışmıyor.
- [ ] Plan denetimi sonrası kullanıcı onayı olmadan kod değişikliğine geçilmiyor.

## Ekran bazlı Definition of Done

- [ ] Ürün amacı 3 saniyede anlaşılır; asıl aksiyon görünür.
- [ ] Para değerleri doğru ve para birimleri ayrı; sahte sıfır/grafik yok.
- [ ] Üst/alt güvenli alan, klavye ve küçük ekran taşması yok.
- [ ] Bileşenler ortak design system'e bağlı; sırf o ekran için rastgele renk/ölçü eklenmiyor.
- [ ] Loading, empty, error, offline, low-data, high-data durumları işlevsel.
- [ ] Dokunma alanları, kontrast, erişilebilir isimler, büyük font ve hareket azaltma uygun.
- [ ] Görsel kabul gerçek Android/iOS ekran görüntülerine dayanıyor; sadece emulator JS export değil.
- [ ] Mevcut domain, auth, offline, notification, RLS ve ödeme testleri regressionsız.

## “AI slop” karşıtı ölçüt

Çok fazla gradient, neon glow, sparkle/glitter, anlamsız metrikler, her kartta aynı kompozisyon, dekoratif sahte çizgiler, tutarsız ikon, zayıf tipografik ölçü, yönlendirmeyen CTA, sahte boş durum, gereksiz büyük radius/gölge ve sürekli animasyonlar **ürün niteliği sayılmıyor**.
