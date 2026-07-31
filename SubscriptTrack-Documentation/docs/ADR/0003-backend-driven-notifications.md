# ADR 0003 — Backend Kaynaklı Bildirim Planlama

## Durum

Accepted

## Bağlam

Yalnızca cihaz üzerinde planlanan bildirimler cihaz değişimi, uygulama silme ve çoklu cihaz durumunda güvenilir değildir.

## Karar

Yenileme/trial bildirimleri backend tarafından occurrence ve delivery kayıtları üzerinden planlanır. Mobil push için FCM/APNs kullanılır. Yerel bildirim yalnızca yardımcı kullanım için değerlendirilebilir.

## Sonuçlar

- Device token yönetimi gerekir.
- Duplicate delivery unique constraint ile engellenir.
- Worker ve retry mekanizması gerekir.
- Bildirim operasyonları gözlemlenebilir olur.
