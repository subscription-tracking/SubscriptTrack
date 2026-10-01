# Güvenlik ve Gizlilik

**Durum etiketleri:** Uygulandı · Kısmi · Planlı · Kapsam dışı. Kanıt kaynakları: kaynak kod, migration'lar, canlı Supabase dashboard'u (2026-09-30, [SUPABASE_LIVE_STATUS.md](../reference/SUPABASE_LIVE_STATUS.md)) ve [kalite raporu](../quality/index.html).

## 1. Hedefler

- Kullanıcı yalnızca kendi verisine erişir.
- Token ve secret'lar istemci kaynak kodunda bulunmaz.
- Finansal veri gereksiz sistemlere aktarılmaz; banka/kart bağlantısı yoktur ([ADR 0007](../decisions/0007-no-bank-integration.md)).
- Export bağlantıları tahmin edilemez ve süreli olur; hesap silme ve veri dışa aktarma uygulanabilir olur.

## 2. Kontrol durumu

| Kontrol | Durum | Kanıt / not |
|---|---|---|
| RLS tüm tablolarda, `auth.uid()` sahiplik politikası | Uygulandı | 15/15 tabloda açık; advisor 0 hata |
| `SECURITY DEFINER` RPC'lerde `auth.uid()` ve sahiplik kontrolü | Uygulandı | Migration 017–027; `anon` erişimi kaldırıldı (027); ödeme kaydı abonelik sahipliğini doğrular (026) |
| Edge Function'lar JWT doğrular, service-role sorguları `user.id` ile kısıtlı | Uygulandı | 4/4 fonksiyon `auth.getUser()` kullanır |
| Service-role anahtarı istemcide yok | Uygulandı | İstemcide yalnızca `SUPABASE_ANON_KEY` (publishable); çalışma ağacında gizli değer yok (gitleaks) |
| Oturum belirteçleri güvenli depoda | Uygulandı | `flutter_secure_storage`; eski depodan taşıma cihazda **doğrulanmadı** |
| Uygulama kilidi (PIN, arka plan süresi, biyometri) | Kısmi | Salt'lı PBKDF2 özet, üstel bekleme ve saat geri alma koruması repoda uygulandı ve testli; kilit açıkken ekran görüntüsü/son uygulamalar önizlemesi engellenir; gerçek cihaz/biyometri doğrulaması yok |
| CSV formül enjeksiyonu (dışa aktarma) etkisizleştirme | Uygulandı | `process-export` ve uygulama içi export |
| Export dosyası özel bucket'ta, 1 saatlik imzalı bağlantı | Uygulandı | Bucket `exports` özel |
| Hesap silme uygulama içinden | Uygulandı | `delete-account`; silme sonrası kalıntı veri kontrolü **doğrulanmadı** |
| E-posta doğrulama | Uygulandı | "Confirm email" açık |
| Leaked Password Protection | **Açık** | Canlıda kapalı; aksiyon gerekli |
| Uygulama düzeyinde hız sınırı (auth hariç Supabase platform sınırları) | **Kısmi** | Kod ve migration 032 repoda hazır, testli (`_shared/ratelimit.js`, 4/4 fonksiyonda çağrı); **canlıda migration uygulanmadı ve fonksiyonlar yeniden deploy edilmedi, yani bugün etkin değil** |
| Sertifika sabitleme, root/jailbreak tespiti | Kapsam dışı | Risk/operasyon maliyeti nedeniyle |
| Bağımlılık zafiyet taraması (osv/SAST) | Planlı | Yalnızca `flutter pub outdated`: 0/11 doğrudan paket ana sürüm geride |
| RLS politikalarının gerçek veritabanına karşı davranış testi | Planlı | Yalnızca SQL metni üzerinde testler var |
| Sızma testi | Planlı | Yok |

## 3. Açık güvenlik işleri

Ayrıntılı bulgu listesi ve puanlama **gizli** tutulur (açık zafiyet ayrıntısı kamuya açık depoda yayımlanmaz); bildirim kanalı için kök `SECURITY.md` dosyası. Genel durum:

- Güvenlik denetimi bulgularının büyük bölümü **repoda düzeltildi ve testlidir**; veritabanı migration'ları (032–034) ve Edge Function güncellemeleri **canlıya alınana kadar canlı sistem düzeltilmiş sayılmaz** (bkz. [SUPABASE_LIVE_STATUS.md](../reference/SUPABASE_LIVE_STATUS.md)).
- Hesap/hizmet yapılandırması işleri (parola kuralı, özel SMTP, depo koruma ayarları) panel üzerinden yapılır ve canlıda doğrulanana kadar açık sayılır.
- Bilinçli olarak ertelenenler: CAPTCHA, sızdırılmış parola koruması (Pro plan gerektirir), bağımsız sızma testi, gerçek cihaz/iOS doğrulaması.
- Git geçmişindeki anon JWT'nin rolü `anon`'dur (publishable; istemcide açık olması tasarım gereğidir).

## 4. Tehdit modeli özeti

Korunacak varlıklar: kimlik ve e-posta; abonelik adları, tutarları ve notları; bildirim tercihleri; export dosyaları; service-role anahtarı. Temel tehditler: başka kullanıcının kaydına erişim (IDOR), çalınmış token, mobil binary'den secret çıkarma, loglarda hassas veri, kötü amaçlı deep link, hız sınırsız kötüye kullanım, eksik hesap silme.

## 5. Kimlik ve yetkilendirme

- Kimlik doğrulama Supabase Auth ile yapılır (e-posta + şifre; sosyal giriş kapalı).
- Kullanıcı kimliği her zaman JWT'den çıkarılır; istemciden gelen `user_id`'ye güvenilmez.
- Sahiplik sorguları `id + kimliği doğrulanmış user_id` ile yapılır; başkasına ait kayıt için bilgi sızdırmayan yanıt verilir.

## 6. Mobil güvenlik

- Token secure storage/keychain/keystore'da (Uygulandı).
- API secret uygulamaya gömülmez (Uygulandı).
- Clipboard'a hassas veri otomatik kopyalanmaz; dışa aktarmada panoya kopyalama kullanıcı onayı ister.
- Ham hata ayrıntısı yalnızca debug derlemede günlüğe yazılır; release derlemede Android yedekleme kapalıdır.

## 7. Veri güvenliği

- Aktarım: TLS (Supabase). Beklemede: platform/DB şifrelemesi (Supabase).
- Not alanı uzunluk/içerik doğrulaması: yerel form doğrulaması var; sunucu tarafı kısıtı sınırlı.
- Loglarda token, kullanıcı notu ve export içeriği bulunmamalıdır; Edge Function'ların hata cevabındaki ham hata metni bilinen bulgudur.

## 8. Secret yönetimi

Secret'lar ortam/secret manager üzerinden gelir; repoya `.env` veya gerçek anahtar eklenmez. Edge Function secret'ları Supabase panelindedir. Anahtar rotasyonu prosedürü **yazılı değildir** (Planlı).

## 9. Deep link ve dış bağlantı

Yalnızca tanımlı route ve parametreler kabul edilir; deep link sahiplik kontrolünü atlamaz. İptal linkleri kullanıcıya açıkça gösterilir.

## 10. Hesap silme ve veri dışa aktarma

- Hesap silme uygulama içinden ulaşılır, etkisi anlatılır ve `delete-account` ile Auth kaydı silinir. Kalıntı veri kontrolü açık iştir.
- Export yalnızca sahibi tarafından başlatılır; dosya özel bucket'ta durur, bağlantı 1 saat geçerlidir.

## 11. Gizlilik ilkeleri

- Banka/kart bağlantısı yoktur; ödeme yöntemi yalnızca kullanıcının yazdığı etikettir.
- Analytics'e abonelik adı, not veya tam fiyat gönderilmez (analitik altyapısı zaten yoktur).
- Kullanıcı verisi reklam için satılmaz; veri minimizasyonu uygulanır.
- Mağaza gizlilik formları gerçek davranışla eşleşmelidir (yayın öncesi açık iş, [RELEASE.md](../operations/RELEASE.md)).

## 12. Güvenlik olayı prosedürü (Planlı)

1. Olayı doğrula 2. Etkilenen sistemi izole et 3. Anahtar/token revoke et 4. Etkiyi belirle 5. Yasal bildirim gereksinimini değerlendir 6. Kullanıcı iletişimi 7. Kök neden ve önleyici aksiyon.
