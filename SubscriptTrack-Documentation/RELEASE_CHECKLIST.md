# Release Candidate Kontrol Listesi

## Otomatik kapı

- [ ] `flutter analyze` temiz
- [ ] `flutter test` temiz
- [ ] Android release App Bundle üretildi
- [ ] Secret scan temiz
- [ ] Dependency güncellemeleri gözden geçirildi

## Staging kapısı

- [ ] `001_initial_schema.sql` ve `003_subscription_api_contract.sql` staging'e uygulandı
- [ ] Gerçek Supabase oturumu ile CRUD, lifecycle ve offline replay smoke testi geçti
- [ ] Firebase platform dosyaları eklendi, `FIREBASE_ENABLED=true` ile token ve push smoke testi geçti
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
