# Backend ve Expo kapanış uygulaması — 22 Ekim 2026

Bu tur gerçek kod, test ve canlı dağıtım çalışmasıdır. Sekiz sprintin tümü kapandı iddiası yoktur. Flutter kaynakları bu tur değiştirilmedi; başlangıçtaki kullanıcı değişiklikleri korundu. İmzalama/mağaza yayını yapılmadı; üretilen APK development/debug paketidir.

## Değişiklikler

- Verisiz canlı `public` şema tabanı (`backend/schema/public-baseline.sql`) eklendi. Tarihsel zincirin şema farklarını temiz kurulumda ortadan kaldırır. Auth/Storage servisleri, cron ve Realtime provision edilmez; yerel test Auth/uid ve Storage nesne/politika shim'leri kullanır. Bu Supabase platformunun tam yerel kopyası değildir.
- `npm run test:postgres` ve `npm run test:schema` her koşuya ait loopback PostgreSQL cluster'ı oluşturur, çalıştırır, durdurur ve temizler. Kalıcı kullanıcı servisine veya uzak DB URL'sine bağlanmaz.
- Canlıdaki 033/036/037 migration kayıtlarının SQL'i gerçek sürüm adlarıyla `supabase/migrations` altına alındı. 038/039 nesneleri baseline'da mevcut; history eksik diye yeniden uygulanmadı.
- Ertelenmiş ödeme için additive, aynı imzalı seri işlem migration'ı hazırlandı. Kullanıcının ayrı onayıyla canlıya uygulandı; dosya adı canlı sürümüyle eşleşir: `20261022142258_deferred_payment_serialization.sql`. Mevcut kayıt dönüştürülmedi/silinmedi.
- Storage temizliği tüm sayfaları ve alt klasörleri önce listeler, sonra batch siler; temizlik hatası Auth silmesini durdurur.
- Export READY tekrarı tam indirme alanlarını döndürür; süresi geçmiş iş yeniden üretilir. Silinmiş abonelik ve CSV formül korumaları canlıya alındı. Kullanıcı başına latest yolu korunur; eski imzalı latest linkleri TTL boyunca güncel dosyayı gösterebilir.
- Ödeme geçmişi offset yerine `(paid_at,id)` cursor kullanır. Araya ekleme/silme testi var; eşzamanlı ödeme tarihi düzenlemesinde tam snapshot garantisi verilmez.
- Bildirim merkezi testindeki effect polling'i açık `act` ile değiştirildi; tema testindeki require lint uyarısı giderildi.
- Windows/Android native turunda büyük multipart geliştirme paketinde `ProtocolException ... 0xd` yeniden üretildi. [Expo #49111](https://github.com/expo/expo/issues/49111) kaydındaki JavaScript yanıtı yaklaşımıyla dar Metro middleware'i eklendi; yalnız Windows Android bundle isteğinde çalışır. API/üretim iş kurallarını değiştirmez.
- Expo'nun önerdiği SDK 57 patch paketleri yüklendi; major SDK geçişi/force downgrade uygulanmadı. Non-breaking npm audit fix denendi; kalan advisory'ler kapanmış sayılmadı. Mevcut decode-uri/node-forge yamaları ve sahte/geçerli imza kontrolü korundu.
- Canlı kabulden sonra yerel dört `EXPO_PUBLIC_*` davranış bayrağı açıldı. Git dışı `.env` başka build'lerin yapılandırmasını değiştirmez.
- Expo CI işine gerçek PostgreSQL işlem ve public şema kurulum kontrolleri eklendi. Yerel belge kontrolü `--working-tree` ile untracked dosyaları stage etmeden denetleyebilir; strict CI modu korunur.

## Canlı dağıtım ve kabul

| Bileşen | Sonuç |
|---|---|
| process-export | v4 ACTIVE, verify_jwt=true |
| delete-account | v3 ACTIVE, verify_jwt=true |
| payment-methods | v2 ACTIVE, verify_jwt=true |
| support-catalog | v2 ACTIVE, verify_jwt=true |
| deferred_payment_serialization | Kullanıcı onayıyla uygulandı; katalogda advisory lock var, anon EXECUTE yok |
| export_storage_active_owner | Ayrı kullanıcı onayıyla uygulandı: `20261022150926_export_storage_active_owner.sql`; exports SELECT/INSERT aktif sahip profili gerektirir |

Dağıtım öncesi eski Function kaynakları Git dışı `.local/backend-closure-2026-10-22` altında rollback için saklandı. Güvenlik korumalarını kaldıran otomatik rollback yapılmadı.

Canlı testler yalnız ayrı `closure-…@example.invalid` fixture hesaplarında yürütüldü. Kullanıcılar yönetim kanalında e-posta göndermeden oluşturuldu; bu normal kayıt/doğrulama e-postası kabulü değildir. Token, parola ve imzalı URL rapora yazılmadı. Son test sonucu [canlı sonuç JSON'u](backend-closure-live-results-2026-10-22.json) içinde:

- Ayrı Auth oturumları; yabancı abonelik okuma/düzenleme/silme ve sahiplik değiştirme reddi.
- Yabancı ödeme/yenileme/mantıksal silme RPC reddi; yabancı export işi ve Storage liste/yazma reddi.
- Timezone-aware yenileme tekrarı tek ödeme; eski yenileme RPC imzası çalışıyor.
- On paralel canlı deferred isteği aynı ödeme kimliğini döndürüyor.
- Formül metni etkisiz; silinmiş abonelik normal CSV'de yok; geçmiş ödeme korunuyor; yeni ödeme reddediliyor.
- Export tekrarında indirme URL'si var; expires_at eskiltilince iş yeniden üretildi ve bağlantı HTTP 200 verdi.
- Son koşuda Realtime INSERT ikinci aynı-hesap oturumuna **582 ms** içinde ulaştı; başka hesapta beş saniyelik gözlemde teslim yok. Bu fiziksel iki cihaz ölçümü değildir.
- Nested Storage dosyası dahil hesap temizliği; üç silinen hesabın eski token'ıyla Auth user lookup ve Storage INSERT reddi, Storage listeleri boş. Yönetim kanalında Auth/public/Storage kalıntıları **0**: [temizlik sonucu](backend-closure-cleanup-2026-10-22.json).

Gerçek 305 saniye bekletilen oturumla hesap silme **403**, yeniden girişten sonra **200** döndü: [yakın giriş sonucu](backend-closure-recent-login-2026-10-22.json). İlk kabul koşusunda P0002'nin PostgREST'te HTTP 500 eşlemesi gözlendi; test yalnız bu beklenen SQLSTATE reddini kabul edecek şekilde düzeltildi. Genel bir 500 başarı sayılmaz.

## Yerel doğrulama

| Kontrol | Sonuç / sınır |
|---|---|
| Backend Node | 50/50 geçti; bir bölümü SQL metin kontrolüdür |
| PostgreSQL 036/038/039 | Sequential, rollback, sahiplik/RLS ve gerçek eşzamanlı kontroller geçti |
| PostgreSQL deferred ileri fix | On paralel tekrar aynı sonuç; sonuç yazımı hatasında ödeme rollback'i geçti |
| Temiz public şema | Boş DB'de taban/ileri SQL kurulumu; profil trigger, owner read, yabancı ödeme reddi, silme görünürlüğü ve aktif/yabancı/silinmiş Storage sahibi politikaları geçti |
| Expo Jest, son paket kümesi | 141 suite / 880 test geçti |
| TypeScript / lint | Geçti; lint hatası/uyarısı yok |
| Expo install --check / Doctor | Paketler uyumlu; Doctor 21/21 |
| Android JS/Hermes export | Geçti, 4,7 MB bundle |
| iOS JS/Hermes export | Tek worker ile geçti, 4,5 MB bundle; native iOS kabulü değil |
| Paket secret kontrolü | İki platformun toplam 72 çıktı dosyasında S31 test parolası yok |
| Android native development APK | `assembleDebug` x86_64 geçti; ilk koşu JVM native allocation hatası verdi, tek worker/1 GiB heap ile tekrar başarılı |
| Android emülatör açılışı | Yeni APK veri silmeden kuruldu; Metro düzeltmesi sonrası cold-start Dashboard'a ulaştı. Tüm rota/cihaz kabulü değildir |
| Fiziksel Android kurulumu, aynı gün | Samsung SM-S711B için ARM64 debug/development build başarılı (7 dk 38 sn), USB kurulumu başarılı. Metro 8099 USB reverse ile bağlandı; uygulamanın Şifremi unuttum formu açıldı. `subscripttrack://auth-callback` Android resolver'ı `com.subscripttrack.app/.MainActivity` döndürüyor. E-posta ve parola değişiminin uçtan uca kabulü ayrıca gerekir |
| Dependency audit, omit=dev | 19 etkilenen paket kaydı: 16 high, 3 moderate, critical 0; bağımsız kullanılabilir saldırı yolu sayısı değildir |

İlk paralel native/export koşusunda bellek yetersizliği oluştu; iOS export tek worker ile, Android build `--no-daemon --max-workers=1 -Dorg.gradle.jvmargs=-Xmx1024m -XX:MaxMetaspaceSize=384m` ile ayrı tekrarlandı. Başarısız ilk koşular başarı olarak sayılmadı. Native modül patch değişiklikleri nedeniyle eski APK'nin otomatik uyumlu olduğu varsayılmadı.

## Güncellenmiş puanlar

Önceki rapordaki aynı ağırlıklarla, tamamlanma yüzdesi olmayan mühendislik değerlendirmesi:

| Backend alanı | Önce | Şimdi |
|---|---:|---:|
| API/şema | 15/20 | 18/20 |
| Finansal bütünlük | 13/20 | 18/20 |
| Yetki/güvenlik | 10/20 | 15/20 |
| Canlı dağıtım uyumu | 9/15 | 13/15 |
| Veri yaşam döngüsü | 7/15 | 14/15 |
| İşletim/CI/tekrar üretim | 4/10 | 6/10 |
| **Toplam** | **58/100** | **84/100** |

Expo kod hazırlığı **80 → 84/100**: domain 21/25, mimari 17/20, otomatik kalite 18/20, entegrasyon 16/20, UI/native kanıt 12/15. Backend 85 hedefi ve kritik/yüksek engel olmaması kapısı henüz kapatılmadı. Cihaz, e-posta, restore ve kalan güvenlik işleri puanla geçersiz kılınmaz.

## Açık kabul kapıları

1. Leaked Password Protection kapalı. [Resmî belge](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) Pro ve üzeri plan gerektiğini belirtiyor. Ücretli plan satın alınmadı veya Auth ayarları körlemesine değiştirilmedi.
2. Normal kayıt, gerçek doğrulama/kurtarma e-postası, SMTP ve mobil dönüş akışı kabulü yapılmadı. Fixture login başarısı bu akışları kapatmaz.
3. Tam Supabase platform kurulum/restore tatbikatı yok. Public şema başlangıcı ve ileri migration testleri, Storage nesnelerinin veya Auth oturumlarının restore kanıtı değildir.
4. Cron'un son koşuları succeeded; canlı SQL hâlâ CURRENT_DATE ile gün sınıflıyor. Kullanıcı IANA/timezone-mode semantiğinin server in-app üreticiyle uzlaştırılması ayrı açık iştir; yerel notification OS teslimiyle aynı kabul değildir.
5. Kalan dependency advisory'leri için risk kabulü/uyumlu upstream çözüm gerekli. npm audit force Expo downgrade/Jest major önerileri uygulanmadı.
6. Yeni native build ile tüm rota, offline/force-stop, bildirim/erteleme/reboot, PIN ve büyük yazı turu; fiziksel Android/biyometri ve referans performans ölçümleri açık. Bu tur yalnız emülatör bağlı.
7. iOS native cihaz/simülatör erişimi yok; imzalama ve mağaza yayını kullanıcı kararıyla kapsam dışı.
8. Uzak CI alınamadı: ayrı çalışma kopyasına dosya aktarımı komutu çalıştırılmadan otomatik onay denetimince engellendi; ayrıntılı gerekçe verilmedi. Başka araçla aşma denenmedi, dal/PR/push yapılmadı. Ana çalışma alanı stage/commit edilmedi. Kullanılmayan managed worktree arşive alındı.

Graphify incremental update denendi; paket/skill sürüm farkı uyarısı ve değişen doküman/görseller için semantic extraction anahtarı bulunmaması nedeniyle başarısız oldu. Full rebuild veya graph çıktılarında elle düzenleme yapılmadı; mevcut graph güncel değişikliklerin kanıtı olarak sunulmadı.

[Sprint kapıları](../expo/CLOSURE_SPRINTS.md) · [önceki puanlama](expo-backend-assessment-2026-10-22.md) · [canlı durum](../reference/SUPABASE_LIVE_STATUS.md).
