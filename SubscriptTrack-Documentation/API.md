# API Sözleşmesi

## 1. İlkeler

- Base path: `/api/v1`
- HTTPS zorunludur.
- Kimlik: `Authorization: Bearer <token>`
- Content type: `application/json`
- Tarih-zaman: ISO 8601 UTC, ör. `2026-08-12T21:00:00Z`
- Para: string + ISO 4217 kodu
- İstemci tarafından gönderilen kullanıcı kimliğine güvenilmez; token'dan çıkarılır.

## 2. Standart hata formatı

```json
{
  "error": {
    "code": "SUBSCRIPTION_NOT_FOUND",
    "message": "Abonelik bulunamadı.",
    "fieldErrors": [],
    "requestId": "req_01J..."
  }
}
```

Önerilen HTTP durumları:

- `400` doğrulama
- `401` kimlik yok/geçersiz
- `403` yetkisiz işlem
- `404` kaynak yok veya kullanıcıya ait değil
- `409` çakışma/idempotency
- `422` domain kuralı ihlali
- `429` rate limit
- `500` beklenmeyen hata

## 3. Sayfalama

Cursor tabanlı yaklaşım:

```json
{
  "items": [],
  "nextCursor": "opaque-token",
  "hasMore": false
}
```

## 4. Kimlik ve profil

### `GET /me`

```json
{
  "id": "usr_...",
  "email": "user@example.com",
  "profile": {
    "firstName": "Muhsin",
    "lastName": "Turan",
    "preferredCurrency": "TRY",
    "timezone": "Europe/Istanbul",
    "locale": "tr-TR",
    "theme": "SYSTEM"
  }
}
```

### `PATCH /me/profile`

```json
{
  "firstName": "Muhsin",
  "timezone": "Europe/Istanbul",
  "preferredCurrency": "TRY",
  "theme": "DARK"
}
```

### `DELETE /me`

Hesap silme işini başlatır. Güvenlik politikasına göre yakın zamanda yeniden doğrulama isteyebilir.

## 5. Katalog

### `GET /services?query=netflix&category=ENTERTAINMENT`

```json
{
  "items": [
    {
      "id": "svc_...",
      "slug": "netflix",
      "name": "Netflix",
      "logoUrl": "https://...",
      "categoryCode": "ENTERTAINMENT",
      "accountUrl": "https://...",
      "cancellationUrl": "https://...",
      "lastVerifiedAt": "2026-07-01T00:00:00Z"
    }
  ],
  "nextCursor": null,
  "hasMore": false
}
```

### `GET /categories`

Sistem kategorilerini sıralı döndürür.

## 6. Abonelikler

### `POST /subscriptions`

Canlı Supabase uyarlamasında bu işlem, oturumdaki kullanıcının yetkisiyle
`create_subscription_idempotent` RPC'si üzerinden yürütülür; istek gövdesi
buradaki abonelik alanlarını, idempotency anahtarı ise tekrar denemelerde aynı
kaydın döndürülmesini sağlar.

```json
{
  "serviceId": "svc_optional",
  "name": "Netflix",
  "categoryCode": "ENTERTAINMENT",
  "amount": "279.99",
  "currency": "TRY",
  "billingCycle": "MONTHLY",
  "startDate": "2026-07-12T21:00:00Z",
  "nextRenewalAt": "2026-08-12T21:00:00Z",
  "timezone": "Europe/Istanbul",
  "status": "ACTIVE",
  "notifyDays": 3,
  "note": null
}
```

Yanıt: `201 Created` ve `SubscriptionResponse`.

### `GET /subscriptions`

Query parametreleri:

- `status`
- `category`
- `currency`
- `query`
- `sort=renewalAt,asc`
- `cursor`

### `GET /subscriptions/{id}`

### `PATCH /subscriptions/{id}`

Partial update. `startDate` ve `nextRenewalAt` birlikte güncellenebilir; istemci
başlangıç gününü koruyarak sonraki yenilemeyi yeniden hesaplar. Domain geçişleri
için genel `status` güncellemesi yerine aksiyon endpoint'leri tercih edilir.

### `POST /subscriptions/{id}/pause`

```json
{
  "effectiveAt": "2026-08-01T00:00:00Z"
}
```

### `POST /subscriptions/{id}/resume`

### `POST /subscriptions/{id}/cancel`

```json
{
  "cancelledAt": "2026-07-30T17:00:00Z",
  "accessEndsAt": "2026-08-12T20:59:59Z",
  "reason": "NOT_USED"
}
```

### `POST /subscriptions/{id}/archive`

`ARCHIVED` kaydını geri almak için ayrı bir endpoint yoktur; aynı kaynağa
`POST /subscriptions/{id}/resume` gönderilir. Backend bu geçişe izin verir.

### `DELETE /subscriptions/{id}`

Yalnızca yanlış oluşturulan kayıt için ve güvenli politika ile; normal iptal yerine kullanılmaz.

## 7. Dashboard

### `GET /dashboard/summary`

```json
{
  "monthlyTotals": [
    {"currency": "TRY", "amount": "2840.45"},
    {"currency": "USD", "amount": "37.00"}
  ],
  "annualTotals": [
    {"currency": "TRY", "amount": "34085.40"},
    {"currency": "USD", "amount": "444.00"}
  ],
  "activeSubscriptionCount": 11,
  "upcomingCount": 3,
  "trialCount": 1,
  "estimatedSavings": [
    {"currency": "TRY", "annualAmount": "6480.00"}
  ]
}
```

### `GET /dashboard/upcoming?days=7`

## 8. Takvim

### `GET /calendar?from=2026-08-01&to=2026-08-31`

Dönüş öğeleri occurrence tabanlıdır.

```json
{
  "items": [
    {
      "occurrenceId": "occ_...",
      "subscriptionId": "sub_...",
      "name": "Netflix",
      "type": "RENEWAL",
      "scheduledAt": "2026-08-12T21:00:00Z",
      "amount": "279.99",
      "currency": "TRY",
      "status": "PLANNED"
    }
  ]
}
```

## 9. Bildirimler

### `GET /notifications?unreadOnly=true`

### `POST /notifications/{id}/read`

### `POST /notifications/read-all`

### `GET /notification-preferences`

### `PUT /notification-preferences`

```json
{
  "defaultNotifyDays": 3,
  "localDeliveryTime": "09:00",
  "pushEnabled": true,
  "inAppEnabled": true,
  "emailEnabled": false
}
```

### `POST /notifications/read-batch`

Bildirim merkezi okundu durumunu API ile toplu senkronlar:

```json
{
  "notification_ids": ["notification-id-1", "notification-id-2"]
}
```

Yanıt: `{ "updatedCount": 2 }`.

### `POST /notifications/devices`

Push token kaydı:

```json
{
  "platform": "ANDROID",
  "token": "provider-device-token",
  "appVersion": "1.0.0"
}
```

### `DELETE /notifications/devices/{id}`

## 10. Tasarruf

### `GET /savings/summary`

### `GET /savings/events`

## 11. Veri dışa aktarma

### `POST /exports`

Asenkron export oluşturur.

### `GET /exports/{id}`

Durum: `PENDING`, `READY`, `EXPIRED`, `FAILED`.

## 12. Idempotency

Mobil ağ tekrarlarında duplicate kayıt oluşmaması için yazma endpoint'leri `Idempotency-Key` desteklemelidir.

Örnek:

```http
Idempotency-Key: 98d8b03e-...
```

Aynı kullanıcı + endpoint + key için aynı sonucu döndürür.

## 13. OpenAPI

API implementasyonu OpenAPI 3.x tanımı üretmelidir. Mobil model üretimi veya contract testleri bu tanımdan yapılabilir. Bu dosya endpoint niyeti ve ortak kuralların insan tarafından okunabilir özetidir.
