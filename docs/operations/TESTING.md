# Test Stratejisi

**Durum:** Aşağıdaki katmanların çoğu **Uygulandı**; contract/OpenAPI testi **Kapsam dışı**, edge function ve RLS davranış testleri **Planlı**. Güncel test sayısı, kapsama ve mutasyon skoru elle yazılmaz; [kalite raporunda](../quality/index.html) üretilir.

## 1. Hedef

Kritik para, tarih, yetkilendirme, bildirim ve mobil kullanıcı akışlarının güvenilir olduğunu kanıtlamak. Kapsama tek başına kalite ölçütü değildir; testlerin gerçek hataları yakalayıp yakalamadığı mutasyon testiyle ölçülür (kalite raporu).

## 2. Katmanlar ve durum

| Katman | Durum | Kapsam / konum |
|---|---|---|
| Birim (domain) | Uygulandı | `Money`, faturalama döngüleri, yaşam döngüsü, tarih hesapları (`test/core`, `test/features/subscriptions`) |
| Servis birim testleri | Uygulandı | Offline kuyruk, hatırlatma planlayıcı, uygulama kilidi, bildirim planlama |
| Controller / repository | Uygulandı | Sahte HTTP ve sahte Supabase istemcisiyle; repository'ler istemciyi ctor'dan alır |
| Widget / ekran | Uygulandı | Ekranlarda loading, error, empty ve offline durumları; rota testleri (`test/support/routed_app.dart`) |
| Mimari kural testi | Uygulandı | `test/architecture_test.dart`: katman kuralları, döngüsüzlük, dosya boyutu, `Navigator.push` yasağı |
| Kanıt paketleri | Uygulandı | `test/evidence/`: Excel senaryolarına bağlı kanıt testleri ([TEST_TRACEABILITY.md](TEST_TRACEABILITY.md)) |
| Güvenlik taraması | Uygulandı | `security_scan_test.dart` (kaynakta credential/URL yok) |
| Backend testleri | Kısmi | `backend/test`: CSV yardımcısı ve migration **SQL metni** üzerinde kontroller (`node --test`) |
| Edge Function testleri | Planlı | Hiçbir fonksiyonun davranış testi yok |
| RLS politikası davranış testi | Planlı | Gerçek veritabanına karşı IDOR/sahiplik testi yok |
| Entegrasyon (cihaz) | Kısmi | `mobile/integration_test/notification_reschedule_test.dart` |
| Contract / OpenAPI | Kapsam dışı | Ayrı REST API yok ([ADR 0009](../decisions/0009-supabase-only-architecture.md)) |
| Gerçek cihaz kabulü | Planlı | [DEVICE_ACCEPTANCE.md](DEVICE_ACCEPTANCE.md); sonuç kaydı yok |

## 3. Kritik hesap ve tarih senaryoları

Kanıt paketlerinde kapsanır: haftalık `amount × 52 / 12`, üç aylık `/ 3`, yıllık `/ 12`; farklı para birimlerini ayrı tutma; duraklatılmış/iptal kayıtların toplamdan çıkması; ondalık yuvarlama; sıfır fiyatlı deneme; 31 Ocak aylık yenileme, 28/29 Şubat, artık yıl; kullanıcı saat dilimi değişimi; aynı planın iki kez çalıştırılması. Europe/Istanbul dışındaki DST'li dilimler ve UTC gün sınırı için gerçek cihaz kabulü gerekir.

## 4. Bildirim testleri

Yerel planlama (gün/saat, 60 sınırı, exact alarm yedeği, saat dilimi, duplicate guard), ertelenmiş bildirim ve cold-start yönlendirmesi otomatik testlidir. Foreground/background/terminated davranışı, izin reddi ve gerçek cihaz teslimi cihaz kabulündedir. Sunucu tarafı teslimat/retry testi **Kapsam dışı** (uzak bildirim yok).

## 5. Güvenlik testleri

Uygulandı: kaynakta secret taraması; kimlik doğrulama ve sahiplik kontrolü birim/repository düzeyinde. **Planlı:** başka kullanıcının kaydına erişim (IDOR) ve süresi dolmuş token için gerçek veritabanı testi, hız sınırı testi, export erişim testi, hesap silme sonrası veri kontrolü.

## 6. Mobil kalite matrisi

Uygulama yalnızca Türkçe ve koyu temadır. Gerçek cihazda küçük/büyük ekran, yazı ölçeği, düşük ağ/offline doğrulaması [DEVICE_ACCEPTANCE.md](DEVICE_ACCEPTANCE.md) kapsamındadır (Planlı). iOS sürüm matrisi iOS build'i olmadığı için başlamadı.

## 7. Test verisi ve CI

Sahte veri fabrikaları/fixture'lar kullanılır; canlı kişisel veri test ortamına kopyalanmaz. CI (`mobile-quality.yml`): `flutter analyze`, `flutter test`, backend testleri; Android release AAB derlemesi şu an başarısızdır ([RELEASE.md](RELEASE.md#6-ci-githubworkflowsmobile-qualityyml)).

## 8. Excel kabul sözleşmesi

Excel kabul senaryoları ürün kuralını genişletemez. İzlenebilir kaynak
`TEST_TRACEABILITY.md` dosyasıdır.

- Ürün kuralı: normal abonelik yaşam döngüsünde fiziksel silme yapılmaz; kullanıcı
  kaydı iptal eder veya arşivler. **Bugünkü uygulama bundan farklıdır:** detay ve
  liste ekranlarında herhangi bir abonelik için "Kalıcı olarak sil" sunulur (S39).
  Karar bekliyor ([MOBILE.md §6](../architecture/MOBILE.md)).
- Ürün kuralı: yenileme tarihi zaman geçmesiyle sessizce ilerletilmez. **Bugünkü
  uygulama bundan farklıdır:** yükleme sırasında gecikmiş aktif aboneliğin tarihi
  otomatik ilerletilir (Test 45); **Yenilendi** eylemi ayrıca vardır. Karar bekliyor.
- Mobil form tarihleri `DatePicker` ile seçilir. Serbest metin tarih girdisi
  kabul kriteri değildir; CSV içe aktarmadaki tarih metinleri parser tarafından
  doğrulanır.
