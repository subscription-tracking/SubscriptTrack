# ADR 0009 — Yalnızca Supabase mimarisi ve yerel bildirim

## Durum

Accepted (2026-09-30). ADR 0001'in push maddesini, ADR 0002'nin API/OpenAPI maddelerini ve ADR 0003'ün başlığını **kısmen geçersiz kılar**.

## Bağlam

İlk taslaklar ayrı bir REST backend (`/api/v1`, OpenAPI, iş kuyruğu) ve uzak push (FCM/APNs) varsayıyordu. Uygulama bu yolla geliştirilmedi: tek backend Supabase'dir (Auth, PostgreSQL + RLS, PostgREST, RPC, Realtime, Edge Functions); Firebase ve başka servisler kullanılmaz.

## Karar

- Mobil istemci yalnızca Supabase yüzeylerini kullanır; ayrı API sunucusu ve OpenAPI üretimi yoktur. Sözleşme [API.md](../reference/API.md)'dedir.
- Yenileme hatırlatmaları `flutter_local_notifications` ile cihazda planlanır; uzak push ve cihaz token kaydı yoktur. Uygulama içi bildirim merkezi `notifications` tablosunu okur; `pg_cron` işi (`notification-producer`, saatlik) bu tabloyu üretir.
- Kimlik doğrulama ve sahiplik JWT + RLS ile, tutarlı yazmalar idempotent RPC'lerle sağlanır.

## Sonuçlar

- Sunucu tarafında uygulama hız sınırı yoktur (Planlı, bkz. [SECURITY.md](../architecture/SECURITY.md)).
- `device_tokens` tablosu şemada durur ama kullanılmaz.
- Şemanın doğru kaynağı repo migration'ları olmalıdır; bugün canlıyla sapma vardır ([SUPABASE_LIVE_STATUS.md](../reference/SUPABASE_LIVE_STATUS.md)).
