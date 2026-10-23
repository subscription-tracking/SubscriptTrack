# ADR 0006 — Normal Akışta Silme Yerine Arşivleme

## Durum

Accepted. **Expo uygulama kararı (2026-10-10):** arşivdeki fiziksel silme yalnızca kullanıcı kaydın yanlış oluşturulduğunu açıkça doğrularsa sunulur. Flutter'ın genel silme seçenekleri bu kuralla hâlâ çelişir ([MOBILE.md §6](../architecture/MOBILE.md)).

## Bağlam

Kullanıcı iptal ettiği aboneliğin geçmişini ve tasarrufunu görmek ister. Fiziksel silme geçmişi yok eder.

## Karar

Normal yaşam döngüsünde cancel, expire ve archive durumları kullanılır. Fiziksel silme yanlış kayıt veya hesap/veri silme workflow'u içindir.

Expo'da yanlış kayıt düzeltmesi arşiv ekranından yapılır; işlem öncesi yanlış kayıt beyanı ve geri alınamaz ödeme geçmişi uyarısı gerekir. Sunucuda yanlış kayıt nedenini ayırt eden alan yoktur, dolayısıyla bu beyan istemci düzeyinde kalır.

## Sonuçlar

- Audit ve tasarruf geçmişi korunur.
- Liste sorguları archived kayıtları varsayılan dışlar.
- Gizlilik kapsamında gerçek silme yine desteklenir.

## Expo 59 senaryo sözleşmesi — 12 Ekim 2026

**Expo için güncel kullanıcı kararı:** [Gereksinim, API/veri modeli ve dağıtım sözleşmesi](../quality/expo-59/CONTRACT.md). Önceki Expo anlatımıyla çelişen tarih, mantıksal silme, 1.000 kota, 2.000 not, tüm para birimleri, device/fixed bölge ve açık/koyu/sistem tema kurallarında bu sözleşme geçerlidir. Flutter mevcut uygulaması korunur. Kod hazırlığı canlı/native kabul anlamına gelmez.
