# Test Stratejisi

## 1. Hedef

Kritik para, tarih, yetkilendirme, bildirim ve mobil kullanıcı akışlarının güvenilir olduğunu kanıtlamak.

## 2. Test katmanları

### Unit

- Aylık/yıllık maliyet hesaplama
- Billing cycle hesapları
- Para value object
- Durum geçişleri
- Yenileme tarihi ilerletme
- Tasarruf hesaplama

### Integration

- Repository + DB
- Authorization/sahiplik
- Unique notification delivery
- Transaction sınırları
- API validation

### Contract

- OpenAPI ile backend yanıtlarının uyumu
- Mobil DTO mapping
- Breaking değişiklik tespiti

### Component/UI

- Design system varyantları
- Empty/loading/error/offline durumları
- Dynamic type
- Dark/light tema

### End-to-end

- Kayıt → abonelik ekle → dashboard
- Push deep link → abonelik detayı
- Trial ekle → bildirim → iptal
- Hesap silme

## 3. Kritik hesap testleri

- Weekly `amount × 52 / 12`
- Quarterly `amount / 3`
- Yearly `amount / 12`
- Farklı para birimlerini ayrı tutma
- Paused/cancelled kayıtları toplamdan çıkarma
- Decimal rounding
- Sıfır fiyatlı trial

## 4. Tarih testleri

- 31 Ocak aylık yenileme
- 28/29 Şubat
- Leap year
- Europe/Istanbul
- DST kullanan timezone'lar
- UTC gün sınırı
- Kullanıcı timezone değiştirdiğinde plan
- Aynı cron iki kez

## 5. Bildirim testleri

- Doğru gün ve saat
- Kanal kapalı
- Duplicate unique constraint
- Geçersiz push token
- Worker retry
- Birden fazla cihaz
- Uygulama foreground/background/terminated
- Deep link auth sonrası devam

## 6. Güvenlik testleri

- Başka kullanıcının subscription ID'si
- Enumeration/IDOR
- Expired token
- Logout sonrası refresh token
- Rate limit
- Export erişimi
- Account delete authorization

## 7. Mobil kalite matrisi

- Son iki ana iOS sürümü
- Desteklenen Android API aralığı
- Küçük ve büyük ekran
- Dark/light
- Türkçe ve İngilizce uzun metinler
- Font scaling
- Düşük ağ / timeout / offline

## 8. Test verisi

Factory/fixture kullanılır:

- Monthly TRY subscription
- Yearly USD subscription
- Trial ending tomorrow
- Cancelled with access end
- Archived
- Month-end renewal
- Multi-currency user

Production kişisel verisi test ortamına kopyalanmaz.

## 9. CI kalite kapıları

- Lint/format
- Unit test
- Integration test
- Contract test
- Dependency/secret scan
- Build iOS/Android doğrulaması

Coverage tek kalite ölçütü değildir; domain ve güvenlik kritik yollarında yüksek kapsama hedeflenir.

## 10. Release doğrulama

- Smoke test
- Migration dry run
- Push provider staging testi
- Deep link testi
- Analytics event kontrolü
- Crash-free beta
- Rollback planı
