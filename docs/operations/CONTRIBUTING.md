# Katkı ve Geliştirme Kuralları

## 1. Genel yaklaşım

- Küçük, anlaşılır pull request
- Dikey özellik dilimleri
- Test ve dokümantasyon aynı değişiklikte ([docs/README.md](../README.md) güncelleme kuralları)
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
fix: prevent duplicate renewal reminder
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
- Kişisel/hassas veri log veya dış servise gidiyor mu?
- Testler önemli edge case'leri kapsıyor mu?

## 6. Kod standardı

- Otomatik formatter zorunlu
- Lint hataları CI'ı düşürür
- Anlamsız kısaltmadan kaçınılır
- Fonksiyonlar tek sorumluluk taşır
- UI içinde doğrudan network çağrısı yapılmaz
- Magic number/string yerine token veya sabit

## 7. API / Supabase değişiklikleri

- [API.md](../reference/API.md) ve [DATA_MODEL.md](../reference/DATA_MODEL.md) aynı değişiklikte güncellenir (RPC imzası, Edge Function sözleşmesi, tablo).
- Mobil uyumluluk değerlendirilir.
- Breaking değişiklik yeni API sürümü veya geçiş süreci gerektirir.
- Para ve tarih formatı değiştirilmez.

## 8. Veritabanı migration

- Migration dosyası değiştirilemez; yeni migration eklenir.
- Destructive operasyonlar aşamalıdır.
- Index ve lock etkisi değerlendirilir.
- Canlıya elle DDL yapılmaz; migration ile uygulanır ([RELEASE.md](RELEASE.md#9-veritabanı-migration-ve-canlı-şema)). Ayrı staging projesi yoktur; riskli değişiklik önce yerelde/kopya projede denenir.

## 9. Design system değişiklikleri

- Yeni ham stil eklemek yerine token/bileşen ihtiyacı değerlendirilir.
- Component API breaking değişikliği dokümante edilir.
- Koyu tema (tek tema) ve erişilebilirlik kontrol edilir.

## 10. Definition of Done

Bir iş tamamlanmış sayılırsa:

- Kabul kriterleri karşılanır.
- Testler eklenmiş ve geçmiştir.
- Loading/error/empty durumları vardır.
- Gizlilik etkisi değerlendirilmiştir.
- Dokümanlar güncellenmiştir.
- Kod review tamamlanmıştır.
- Ekran değişikliğinde gerekirse gerçek cihaz/tarayıcı doğrulaması yapılmıştır.
