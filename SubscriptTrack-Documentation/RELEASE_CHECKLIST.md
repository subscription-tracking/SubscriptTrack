# Release Candidate Kontrol Listesi

## Otomatik kapı

- [x] `flutter analyze` temiz — 0 issue, 19 Eylül 2026
- [x] `flutter test` temiz — 306/306, 19 Eylül 2026
- [x] Android release App Bundle üretildi — debug-keystore fallback ile, 18 Eylül 2026
- [x] Secret scan temiz — 4/4 test geçti; kaynak yollarında credential-benzeri literal bulunmadı, 19 Eylül 2026
- [x] Dependency güncellemeleri gözden geçirildi — 24 kilitli güncelleme ve iki transitif kullanım dışı uyarısı ayrı yükseltme çalışmasına alındı, 18 Eylül 2026

## Staging kapısı

- [ ] `001_initial_schema.sql` ve `003_subscription_api_contract.sql` staging'e uygulandı
- [ ] Gerçek Supabase oturumu ile CRUD, lifecycle ve offline replay smoke testi geçti
- [ ] Android gerçek cihazda login, abonelik ekleme, bildirim izni ve export kontrol edildi
- [ ] iOS gerçek cihazda login, abonelik ekleme ve APNs izni kontrol edildi

## Dağıtım kapısı

- [ ] Upload keystore yalnız CI secret store'da; `key.properties` repoda yok
- [ ] Android AAB release keystore ile imzalandı ve Play Internal Testing'e yüklendi
- [ ] iOS signing, archive ve TestFlight dağıtımı tamamlandı
- [ ] Privacy policy, terms, store listing ve support contact yayınlandı
- [ ] Rollback owner, incident iletişim kanalı ve sürüm geri alma adımı teyit edildi

Bu liste teknik hazırlığın yerini tutmaz: mağaza hesapları, imza sertifikaları,
staging credential'ları ve hukuki metinlerin yayını yetkili hesap sahipleri tarafından yapılmalıdır.
