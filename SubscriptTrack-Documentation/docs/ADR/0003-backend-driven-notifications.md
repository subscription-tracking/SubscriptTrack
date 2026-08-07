# ADR 0003 — Backend Kaynaklı Bildirim Planlama

## Durum

Accepted

## Bağlam

Yalnızca cihaz üzerinde planlanan bildirimler cihaz değişimi, uygulama silme ve çoklu cihaz durumunda güvenilir değildir.

## Karar

Yenileme bildirimleri backend tarafından `renewal_occurrences` ve `notifications` tabloları üzerinden pg_cron ile planlanır. Kullanıcıya görünen bildirimler `flutter_local_notifications` ile cihaz üzerinde zamanlanır. Uzak push (FCM/APNs) kullanılmaz.

## Sonuçlar

- Backend `renewal_occurrences` tablosunu doldurur; pg_cron bu tablodan `notifications` üretir.
- Mobil uygulama `flutter_local_notifications` ile 09:00'da yerel push zamanlar.
- Duplicate guard: hash değişmezse schedule atlanır.
- Duplicate delivery unique constraint ile engellenir.
- Cihaz token yönetimi gerekmez.
