# Katkı ve Geliştirme Kuralları

## 1. Genel yaklaşım

- Küçük, anlaşılır pull request
- Dikey özellik dilimleri
- Test ve dokümantasyon aynı değişiklikte
- Ana branch doğrudan değiştirilmez
- Önemli kararlar ADR ile kaydedilir

## 2. Branch isimleri

```text
feature/add-subscription
feature/trial-reminders
fix/duplicate-notification
refactor/subscription-repository
docs/update-domain-rules
```

## 3. Commit mesajları

Conventional Commits önerilir:

```text
feat: add trial subscription flow
fix: prevent duplicate renewal push
refactor: extract money value object
docs: update notification retry policy
test: add month-end renewal cases
```

## 4. Pull request içeriği

- Değişiklik özeti
- Neden gerekli?
- Etkilenen ekran/API/domain
- Test kanıtı
- Ekran görüntüsü/video gerekiyorsa
- Migration etkisi
- Güvenlik/gizlilik etkisi
- İlgili doküman/ADR

## 5. Review kontrolü

- Domain kuralıyla uyumlu mu?
- API sözleşmesini bozuyor mu?
- Yetki backend'de kontrol ediliyor mu?
- Loading/error/empty/offline durumları var mı?
- Design token kullanılıyor mu?
- Analytics hassas veri gönderiyor mu?
- Testler önemli edge case'leri kapsıyor mu?

## 6. Kod standardı

- Otomatik formatter zorunlu
- Lint hataları CI'ı düşürür
- Anlamsız kısaltmadan kaçınılır
- Fonksiyonlar tek sorumluluk taşır
- UI içinde doğrudan network çağrısı yapılmaz
- Magic number/string yerine token veya sabit

## 7. API değişiklikleri

- OpenAPI güncellenir.
- Mobil uyumluluk değerlendirilir.
- Breaking değişiklik yeni API sürümü veya geçiş süreci gerektirir.
- Para ve tarih formatı değiştirilmez.

## 8. Veritabanı migration

- Migration dosyası değiştirilemez; yeni migration eklenir.
- Destructive operasyonlar aşamalıdır.
- Index ve lock etkisi değerlendirilir.
- Staging'de gerçekçi veri hacmiyle denenir.

## 9. Design system değişiklikleri

- Yeni ham stil eklemek yerine token/bileşen ihtiyacı değerlendirilir.
- Component API breaking değişikliği dokümante edilir.
- Light/dark ve accessibility kontrol edilir.

## 10. Definition of Done

Bir iş tamamlanmış sayılırsa:

- Kabul kriterleri karşılanır.
- Testler eklenmiş ve geçmiştir.
- Loading/error/empty durumları vardır.
- Analytics/gizlilik değerlendirilmiştir.
- Dokümanlar güncellenmiştir.
- Kod review tamamlanmıştır.
- Staging doğrulaması yapılmıştır.
