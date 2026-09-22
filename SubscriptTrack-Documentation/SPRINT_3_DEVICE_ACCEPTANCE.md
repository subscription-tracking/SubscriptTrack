# Sprint 3 — cihaz kabul kontrolü

Bu kontrol listesi otomatik widget/unit testlerin kapsamadığı işletim sistemi
davranışları içindir. Her satır Android ve iOS'ta ayrı ayrı gerçek cihazda
uygulanmalıdır; emülatör sonucu fiziksel cihaz sonucu yerine geçmez.

| Senaryo | Android | iOS | Beklenen kanıt |
|---|---|---|---|
| Bildirim izni reddetme | Açık | Açık | Test bildirimi başarı demeden izin uyarısı gösterir. |
| Zamanlanmış bildirime dokunma | Açık | Açık | Uygulama ilgili abonelik detayını açar; cold-start da çalışır. |
| Ertele aksiyonu | Açık | Açık | 30 dakika sonraya yeni tek seferlik bildirim planlanır. |
| Saat dilimi değiştirme | Açık | Açık | Uygulama öne dönünce plan yeni IANA saat dilimine göre yenilenir. |
| Uygulama kilidi | Açık | Açık | PIN, arka plan süresi ve desteklenen cihazda biyometri beklenen şekilde çalışır. |
| Realtime senkron | Açık | Açık | Aynı Supabase hesabının iki oturumunda ekleme/düzenleme/durum değişikliği görünür. |
| Bulut CSV export | Açık | Açık | Signed URL açılır, indirilen dosya CSV içe aktarıcıya geri alınabilir. |

## Kayıt formatı

Her test için cihaz modeli, işletim sistemi sürümü, uygulama build numarası,
test tarihi, ekran kaydı veya ekran görüntüsü ve sonuç (geçti/kaldı) kaydedilir.
Başarısızlıkta abonelik kimliği veya kullanıcı e-postası gibi hassas veriler
rapora yazılmaz.
