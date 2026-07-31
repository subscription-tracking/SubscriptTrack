# Ürün Analitiği

## 1. Amaç

Kullanıcıların gerçek ürün değerine ulaşıp ulaşmadığını ölçmek; hassas abonelik verisini gereksiz yere analytics sağlayıcısına göndermemek.

## 2. Ana başarı modeli

```text
Acquisition
→ Activation
→ Reminder Engagement
→ Decision
→ Savings
→ Retention
```

## 3. North-star adayları

Önerilen ana değer metriği:

> Aylık aktif kullanıcı başına yönetilen yenileme/karar sayısı

Destekleyici:

- Takip edilen aktif abonelik sayısı
- Bildirimden sonra yapılan iptal/durdurma/devam kararı
- Tahmini tasarruf olayı

## 4. Event isimlendirme

`snake_case`, geçmiş zaman veya tamamlanmış eylem:

```text
onboarding_started
onboarding_completed
auth_completed
subscription_add_started
subscription_added
subscription_updated
subscription_paused
subscription_cancelled
subscription_archived
trial_added
notification_permission_requested
notification_permission_granted
notification_opened
calendar_opened
export_requested
account_deletion_requested
```

## 5. Event özellikleri

### `subscription_added`

Gönderilebilir:

- `source`: catalog/manual/import
- `billing_cycle`
- `currency`
- `category_code`
- `is_trial`

Gönderilmemeli:

- Abonelik adı
- Kullanıcı notu
- Website URL
- Tam ödeme yöntemi

### `notification_opened`

- `notification_type`
- `days_before`
- `channel`
- `app_state`: foreground/background/terminated

## 6. Funnel'lar

### Activation

```text
auth_completed
→ subscription_add_started
→ subscription_added
→ dashboard_value_viewed
```

### Notification value

```text
notification_delivered
→ notification_opened
→ subscription_detail_viewed
→ subscription_cancelled | subscription_paused | subscription_kept
```

### Trial prevention

```text
trial_added
→ trial_notification_opened
→ trial_cancelled_before_charge
```

## 7. KPI tanımları

- **Activation rate:** Kayıttan sonraki 24 saatte en az bir abonelik ekleyen kullanıcı oranı
- **Time to first value:** Kayıttan dashboard toplamını ilk görmeye kadar süre
- **D30 active:** Kayıttan 30. günde ± belirlenen pencere içinde anlamlı ürün aksiyonu
- **Notification open rate:** Açılan / teslim edilen
- **Decision conversion:** Bildirim açıldıktan sonra 72 saat içinde karar aksiyonu
- **Estimated savings users:** En az bir savings event'i olan kullanıcı oranı

## 8. Gizlilik

- User ID analytics'te pseudonymous olmalıdır.
- E-posta gönderilmez.
- Abonelik adı ve not gönderilmez.
- Tam fiyat gerekmiyorsa gönderilmez; gerektiğinde bucket kullanılabilir.
- Opt-out ve yasal izin gereksinimleri değerlendirilir.
- Debug eventleri production datasını kirletmemelidir.

## 9. Veri kalitesi

- Event şemaları versionlanır.
- Zorunlu property listesi bulunur.
- Duplicate event kontrolü
- Mobil ve backend eventleri aynı isim sözleşmesine uyar.
- Dashboard KPI sorguları dokümante edilir.

## 10. Deneyler

A/B testi ancak yeterli kullanıcı hacmi ve açık hipotez varsa yapılır.

Her deney:

- hipotez
- birincil metrik
- guardrail metrik
- hedef kitle
- süre
- durdurma kuralı
- sonuç

alanlarını taşımalıdır.
