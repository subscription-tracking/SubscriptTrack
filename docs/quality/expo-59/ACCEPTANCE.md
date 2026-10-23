# Expo 59 — native ve canlı kabul paketi

Durum: **Çalıştırılmadı / açık**. Bu belge test adımıdır; başarılı cihaz sonucu değildir. [59 ID matrisi](MATRIX.md) tüm kaynak beklentilerini bağlar.

## Her sonuç için zorunlu kayıt

| Alan | Doldurulacak değer |
|---|---|
| Senaryo ID / adım | Matrix ID, kaynak adım ve onaylanan sözleşme |
| Cihaz / OS | Model, OS sürümü, fiziksel veya emülatör |
| Build | Commit, version/build, native release/dev, özellik anahtarları |
| Ortam / hesap | Ayrı silinebilir hesap etiketi; parola/token/e-posta kaydetme |
| Gerçek sonuç | Geçti / başarısız / çalıştırılamadı |
| Kanıt | Tarihli ekran kaydı, süre/FPS ölçümü veya hassas bilgi içermeyen servis çıktısı |
| Temizlik | Test kayıtları/hesapları temizlendi; üretim verisi etkilenmedi |

## Dağıtım kapısı

1. Salt okunur canlı şema ve migration geçmişini incele; 035/036/037/038/039 bağımlılıklarını, mevcut overload/grant/RLS ve worker sürümünü kaydet.
2. İzole işlem testi: yerel PostgreSQL 17 üzerinde `backend` kökünden `npm run test:postgres:local`. Runner yalnız 127.0.0.1 kullanır, geçici test veritabanlarını sonunda kaldırır. Full Supabase ve canlı şema yerine minimal fixture kullanır.
3. Canlı migration için mevcut ayrı kullanıcı onayını al. 038 ve normal export worker birlikte uyumlu dağıtılır. 039 ardından profil ve timezone RPC doğrulanır. Eski create/update/payment/036 sözleşmeleriyle regresyon çalıştırılır.
4. Silme, timezone ve atomik yenileme anahtarları canlı kanıt olmadan açılmaz. Hazır değil sonucu görünür olmalıdır; fiziksel silme fallback yasaktır.
5. Ayrı A/B hesaplarında yabancı kayıt okuma/silme/yenileme reddi, aynı anahtar/farklı içerik, tarih uyuşmazlığı, kayıt gizliliği ve hesap silme kalıntı testi. İçerik/anahtar/token hassas loglara konmaz.

## Android ve iOS test turu

- Matrix 1–29 ve 42–46: tüm form/list/detail/calendar/stats/history/archive yolları; kaydetmeden geri çıkış, silmeden vazgeçme, çoklu seçim, aynı isim, çok hızlı ekleme, geçmiş/gelecek/today/manual tarih, 31 Ocak zinciri ve artık yıl. Güncel fiyat sonrası eski ödemenin tutarı değişmemeli.
- 30–41/53/57: izin ilk isteme/reddetme/ayarlar üzerinden yeniden verme; 3 gün/09:00 ve çoklu 0/1/3/7 gün; saat/IANA/ad/tutar değişiminde eski planın değiştirilmesi; aynı planın tekrar üretilmemesi. Uygulama açık, arka plan, kapalı ve OS yeniden başlatılmış durumda normal tap ve 30 dk ertele. Ertele uygulamayı işlem için öne getirir, detay rotasını açmaz. Oturumsuz tap önce giriş bekler; silinmiş kayıt detayını açmaz. 60 planın içinde test/snooze ve silinen kaydın snooze iptali doğrulanır. Teslim süresi OS tasarruf ayarlarıyla ayrıca kaydedilir.
- 47/48/52/54: uçak modu, force-kill, yeniden açma; FIFO ekle/düzenle/sil. Gönderilmemiş ekleme silinirse hiç backend kaydı oluşmamalı; mevcut kayıt önceki işlemler tamamlandıktan sonra silinmeli. Kalıcı yetki reddi görünür, geçici ağ hatası kuyrukta kalır. A hesabının kuyruğu B hesabında gönderilmez. İki native cihazda aynı hesabın online değişimi görünür.
- 49–51: tüm Expo rotaları açık/koyu/sistem; dar/geniş ekran, yatay/dikey, OS büyük yazı; klavye açıkken alan/uyarı/kaydet erişilebilir. Yeni kurulum sistem, mevcut kullanıcı koyu görünümü; yeniden başlatmada tercih korunur. Test yalnız stillerin değişmesine bakmaz, gerçek taşma/kontrast ve erişilebilirlik sonucu kaydeder.
- 55/58/59: eski cache/queue/PIN ile imzalı sürüm yükseltme; Flutter PIN taşıması; yanlış PIN kalıcı lockout; hash yükseltme ve depolama reddinde kilidin kapalı kalması; biyometri iptali/kullanılamama/hata. OS backup/cihaz dosyası/log/export incelemesi; hassas verinin uygun koruması ve başka hesapta görünmemesi.

## Performans veri ve ölçüm yöntemi

`testdata/expo59/performance-1-500.csv` ve `performance-2-500.csv` iki geçerli 500 kayıt grubudur. Import sınırı 500 olduğu için ayrı yüklenir; 1.000 kayıt üç para birimine dağılır. Tarihler sabit 2026-11-12'dir; test günü güncel tarihle senaryo ayrıca tekrarlanmalıdır. CSV start_date sütunu parser tarafından kullanılmaz; import sözleşmesinin mevcut başlangıç türetimi geçerlidir.

| Ölçüm | Eşik | Yöntem / şu anki durum |
|---|---|---|
| Yerel liste 1.000 | ≤2 saniye | Release build; ekran açılışı → görünür liste; 10 tekrar p50/p95 ve en kötü; ölçülmedi |
| Arama güncellemesi | ≤300 ms | Son tuş → sonuç çizimi; az/çok/boş eşleşme; 10 tekrar; ölçülmedi |
| İki cihaz online | ≤5 saniye | Başarılı A yazımı → B ekranı; her iki cihaz saati eşitlenir; silme dahil; ölçülmedi |
| Kaydırma | Donma olmamalı | Release FPS/jank ve video; 500/1.000, büyük yazı ve tema; ölçülmedi |
| 1.001 kayıt | Açık kota hatası | DB işlem testi geçti; canlı/UI senaryosu açık |

CSV export/import turu ayrı silinebilir hesapta yapılır: sayılar, para birimleri, tarih, kategori, not ve formül koruması karşılaştırılır. Test verileri ve hesaplar temizlenir.

## Kapanış koşulu

34/45 iki tarih yorumunun dış kabul sorumlusu tarafından kabulü ayrıca kaydedilir. Bu dosyada bütün gerekli Android/iOS/canlı sonuçlar kanıtlanmadan 59/59 ürün kabulü yazılmaz. İmzalı paket, temiz kurulum, yükseltme ve uzak CI/EAS kapıları açık kalır; Flutter korunur.
