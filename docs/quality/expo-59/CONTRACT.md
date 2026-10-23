# Expo 59 senaryo — güncel gereksinim sözleşmesi

Durum: Expo kodu ve ileri migration hazırlığı; canlı/native kabul açık. 12 Ekim 2026 kullanıcı kararı önceki çelişen Expo kurallarını günceller. Flutter bu değişiklikte korunur; tam parite iddiası yoktur.

## Tarih, form, para

Geçmiş başlangıçta bugünden sonraki ilk döngü; bugün/gelecek başlangıçta başlangıç günü ilk vade. Düzenlemede kayıtlı vade korunur; başlangıç/periyot değişimi otomatik hesaplar. Manuel tarih seçimi ve Otomatik hesapla kontrolü vardır. Haftalık +7, aylık +1, üç aylık +3, yıllık +12 ay; ay sonu kırpılırken özgün faturalama günü korunur. Trial bağımsızdır. Henüz başlamadı kalıcı enum değildir; aktif harcamaya girmez, takvimde görünür. Gerçek gecikmiş vade korunur, tahmini sonraki döngü ayrı gösterilir; ödeme/tarih yazımı onay gerektirir. Ortak sivil gün saati gece yarısı, resume ve bölge değişiminde yenilenir.

TRY/USD/EUR ayrı toplamlar, kur dönüşümü yok. Ana liste tüm para birimleri; fiyat sırası tek para biriminde aylık eşdeğer, Tümü görünümünde tarih/ad. Tarih-ad-ID kararlı sıralama; vadesiz sonda. Fiyat değişimi geçmiş ödeme tutarını değiştirmez. Not sınırı 2.000; aşım açık hata.

## Silme ve FIFO

038 deleted_at ekler. Mantıksal silme normal liste/arama/takvim/toplam/arşiv/export görünümünden çıkarır; ödeme/tasarruf geçmişi korunur. Durum cancelled/is_archived true eski istemcilerin otomatik işlerini durdurur. Silme geçmiş tasarruf olayını yeniden üretmez. Fiziksel hesap temizliği ve yanlış kayıt düzeltmesi ayrı davranışlardır. Kaydı yeniden etkinleştirmek deleted_at değerini geri alamaz.

soft_delete_subscriptions_idempotent(p_idempotency_key text, p_subscription_ids uuid[]) sahiplik, canonical ID listesi, aynı anahtar tekrar sonucu, farklı içerikte 23505, kullanıcı advisory kilidi ve satır kilitleriyle tek işlem yürütür. 1..1.000 ID. Silinmiş satırın güncellenmesi/ödeme/olay eklemesi reddedilir. Finansal geçmiş RLS sahibi kullanıcıya görünmeye devam eder. Kota silinmemiş 1.000; eşzamanlı INSERT aynı kullanıcı kilidiyle sınırı aşamaz.

FIFO sürüm 2 silme ve oluşturma deneme/kimlik metadata'sı içerir; eski dizi/sürüm 1 okunur. Offline görünümden hemen çıkar; kuyruk kalıcıdır. Çevrimiçi hızlı ekleme de istek gönderilmeden diske yazılır. Gönderilmediği kesin ekleme güvenle kuyruktan kaldırılır; yanıtı kaybolmuş veya eski biçimde durumu belirsiz ekleme aynı anahtarla çözümlenir, gerçek kimlik kalıcı tutulur ve ardından mantıksal silinir. Silme isteği ve özel 0/1/3/7 bildirim günleri kaybolmaz; özel günler oluşturma işleminin takip yazımı olarak aynı sabit anahtarla FIFO'da yeniden denenir. Gönderilmiş kaydın önceki işleri sıralı tamamlanır. Kalıcı ret görünür; ağ/serialization hatasında işlem korunur. Silme onayından vazgeçme yazım/iptal yapmaz. Native iptal hatası kalıcı intent ve resume eşitlemesiyle yeniden denenir. Eski istemciye geri sürüm düşürme garantisi verilmez; eski veri biçimleri yeni istemcide okunur.

## Bildirim ve bölge

Ad, tutar/para birimi, açık vade; varsayılan 3 gün/09:00, 0/1/3/7 çoklu gün, genel saat. Aynı plan dokunulmaz; içerik/saat/IANA değişirse değiştirilir. Geçmiş saate plan yok. En yakın 60 kapasitesi snooze/test kayıtlarıyla paylaşılır. Normal plan yenilemesi ertelenmiş/test kayıtlarını korur; silme tüm bağlı normal/snooze planlarını kaldırır. Erteleme 30 dakika; cold-start işlemi için uygulama öne gelir ve detay yönlendirmesi yapmaz. Bu OS davranışı native kabulde ölçülmelidir. Açılış/resume/veri/izin/bölge değişiminde yeniden doldurulur; uzun süre açılmayan uygulamada sınırsız ileri teslim garantisi yoktur. Expo Go yerel native kabul kanıtı değildir.

039 profiles.timezone_mode = device|fixed: mevcut kullanıcı fixed, yeni default device. Device her cihazın kendi IANA bölgesini izler. confirm_subscription_renewal_in_timezone_idempotent önceki 036 sözleşmesine p_timezone text ekler; fixed profilde profil bölgesi, device modunda doğrulanan IANA bölgesi bugün hesabında kullanılır. Eski RPC korunur.

## Tema, güvenlik, mimari

Tema cihaz tercihi: light/dark/system. Yeni kurulum system; mevcut koyu görünüm korunur. Semantik palette, ortak tema store ve tema duyarlı stiller kullanılır. Tüm rotaların ekran/büyük yazı/klavye kabulü açık. Eski cache/queue/PIN biçimleri okunur; okunamayan veri üzerine yazılmaz, kilit açılmaz. Hesap değişiminde önceki içerik yükleme tamamlanmadan gösterilmez. Kalıcı PIN lockout/hash yükseltme/storage hata/biometri iptali otomatik testlidir; SecureStore donanım/backup/export/log incelemesi native kapıdır.

## Dağıtım ön koşulları

Yeni silme yolu EXPO_PUBLIC_SOFT_DELETION_ENABLED=false; yeni profil/RPC yolu EXPO_PUBLIC_TIMEZONE_MODE_ENABLED=false. Atomik yenileme mevcut ayrı anahtarı canlı 036 doğrulanana kadar kapalı kalır. Canlı şema ve bekleyen migration zinciri salt okunur gözden geçirilmeli; 038/039 ile process-export worker uyumlu dağıtılmalıdır. Live migration ayrı kullanıcı onayı ister. Eski RPC'ler korunur; desteklenmeyen backend'de açık hazır değil hatası, fiziksel silme fallback yok. 038 restrictive RLS silinen satırın realtime UPDATE olayını gizleyebilir: Expo foreground 4 saniye yenileme kullanır; iki cihaz ≤5 s kabulü ölçülmemiştir.

## Kanıt bağlantıları

[59 ID matrisi](MATRIX.md) · [Yerel sonuç raporu](REPORT.md) · [Native/canlı kabul paketi](ACCEPTANCE.md). PostgreSQL runner minimal izole fixture kullanır; üretim Supabase şemasının tamamı veya canlı dağıtım kanıtı değildir.
