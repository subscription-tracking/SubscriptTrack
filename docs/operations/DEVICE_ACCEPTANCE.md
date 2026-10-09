# Cihaz Kabul Kontrolü

**Durum: Planlı — hiçbir senaryo henüz gerçek cihazda çalıştırılmadı.**

## Expo sürümü: kod durumu (2026-10-09)

Bu bölüm yalnızca kodun hazır olup olmadığını söyler; cihaz sonucu yerine geçmez.

| Senaryo | Kod | Engel |
|---|---|---|
| Bildirim izni reddetme | Hazır | Cihaz doğrulaması yok |
| Zamanlanmış bildirime dokunma | Hazır (soğuk başlangıç dahil) | Cihaz doğrulaması yok |
| Ertele aksiyonu | Hazır (30 dk, bildirim düğmesi) | Cihaz doğrulaması yok; düğme görünürlüğü platforma göre değişebilir |
| Saat dilimi değiştirme | Hazır (uygulama öne gelince karşılaştırma) | Cihaz doğrulaması yok |
| Uygulama kilidi | Hazır (PIN, arka plan süresi, biyometri) | Cihaz doğrulaması yok; PIN tur sayısı ölçülmedi |
| Realtime senkron | Hazır | İki oturumlu canlı test yok |
| Bulut CSV export | Yok | Canlıda `request_export_idempotent` RPC'si yok; cihaz içi CSV var (bkz. [API.md §4](../reference/API.md)) |

Derleme kontrolü: Android ve iOS paketleri `expo export` ile hatasız üretildi; `expo-doctor` 21/21 geçti.

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

## Sonuç kaydı

Her çalıştırma bu tabloya satır olarak eklenir (cihaz modeli, işletim sistemi, build, tarih, sonuç, kanıt).

| Tarih | Senaryo | Platform | Cihaz / OS | Build | Sonuç | Kanıt |
|---|---|---|---|---|---|---|
| — | — | — | — | — | — | Henüz kayıt yok |
