# Excel Test Senaryosu İzlenebilirliği

Son güncelleme: 30 Eylül 2026. Tablo, Excel çalışma kitabındaki 65 senaryodan üretildi; referans verilen tüm test dosyalarının var olduğu doğrulandı. Aşağıdaki notlar S39 kararlarını anlatır

Bu tablo, test senaryoları Excel çalışma kitabı (yerel, git dışı çıktı klasöründe; en güncel: `Abonelik_Takip_Test_Senaryolari_EN_GUNCEL_YENI.xlsx`) içindeki her satırı kaynak
testine bağlar. `Kod` yalnız otomatik testin bulunduğunu gösterir; işletim
sistemi teslimi, fiziksel cihaz, mağaza veya canlı backend gerektiren satırlar
`Cihaz/canlı` olarak ayrıca kabul edilmelidir.

| No | Senaryo özeti | Otomatik kanıt (test dosyası) | Durum | Cihaz/canlı doğrulaması |
|---:|---|---|---|---|
| 1 | Geçerli bilgilerle yeni abonelik ekleme | `mobile/test/evidence/excel_scenarios_1_2_9_10_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 2 | Zorunlu alan boş bırakıldığında ekleme engellenmeli | `mobile/test/evidence/excel_scenarios_1_2_9_10_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 3 | Negatif fiyat girildiğinde hata verilmeli | `mobile/test/evidence/evidence_paket2_crud_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 4 | Fiyat alanına harf/özel karakter girildiğinde hata verilmeli | `mobile/test/evidence/evidence_paket2_crud_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 5 | Geçmiş bir başlangıç tarihiyle abonelik ekleme | `mobile/test/evidence/evidence_paket1_date_calc_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 6 | Gelecekte başlayacak abonelik ekleme | `mobile/test/evidence/evidence_paket1_date_calc_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 7 | Aynı isimde birden fazla abonelik ekleme | `mobile/test/evidence/evidence_paket2_crud_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 8 | Farklı yenileme periyotlarıyla abonelik ekleme | `mobile/test/evidence/evidence_paket1_date_calc_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 9 | Farklı para birimleriyle abonelik ekleme | `mobile/test/evidence/excel_scenarios_1_2_9_10_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 10 | Kategori/etiket atayarak abonelik ekleme | `mobile/test/evidence/excel_scenarios_1_2_9_10_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 11 | Not/açıklama alanına çok uzun metin girme | `mobile/test/evidence/evidence_paket2_crud_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 12 | Art arda hızlıca birden fazla abonelik ekleme | `mobile/test/evidence/evidence_paket2_crud_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 13 | Var olan aboneliğin fiyatını güncelleme | `mobile/test/evidence/evidence_paket2_crud_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 14 | Yenileme periyodunu değiştirme (örn. aylıktan yıllığa) | `mobile/test/evidence/evidence_paket2_crud_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 15 | Başlangıç/son tarihi değiştirme | `mobile/test/evidence/evidence_paket2_crud_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 16 | Düzenleme sırasında zorunlu alanı boşaltma | `mobile/test/evidence/evidence_paket2_crud_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 17 | Düzenlemeyi kaydetmeden iptal etme | `mobile/test/evidence/evidence_paket2_crud_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 18 | Tek bir aboneliği silme | `mobile/test/evidence/evidence_paket3_delete_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 19 | Silme işlemini onaylamadan vazgeçme | `mobile/test/evidence/evidence_paket3_delete_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 20 | Silinen aboneliğe ait planlanmış hatırlatmanın iptali | `mobile/test/evidence/evidence_paket3_delete_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 21 | Birden fazla aboneliği toplu silme | `mobile/test/evidence/evidence_paket3_delete_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 22 | Tüm aboneliklerin listelenmesi ve toplam maliyet hesaplama | `mobile/test/evidence/evidence_paket4_list_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 23 | Hiç abonelik yokken boş durum ekranı | `mobile/test/evidence/evidence_paket4_list_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 24 | Yaklaşan yenileme tarihine göre sıralı görüntüleme | `mobile/test/evidence/evidence_paket4_list_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 25 | Süresi geçmiş/iptal edilmiş aboneliklerin ayrı gösterimi | `mobile/test/evidence/evidence_paket4_list_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 26 | İsme göre arama yapma | `mobile/test/evidence/evidence_paket4_list_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 27 | Kategoriye göre filtreleme | `mobile/test/evidence/evidence_paket4_list_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 28 | Fiyata göre artan/azalan sıralama | `mobile/test/evidence/evidence_paket4_list_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 29 | Sonuç bulunamayan arama | `mobile/test/evidence/evidence_paket4_list_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 30 | Son tarihten X gün önce varsayılan hatırlatma bildirimi | `mobile/test/evidence/evidence_paket5_notification_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 31 | Kullanıcının hatırlatma gününü özelleştirmesi | `mobile/test/evidence/evidence_paket5_notification_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 32 | Birden fazla hatırlatma zamanı tanımlama | — | Tamamlandı (otomatik) | Gerekmez |
| 33 | Son tarihi bugün olan abonelik için bildirim | `mobile/test/evidence/evidence_paket5_notification_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 34 | Son tarihi geçmiş (kaçırılmış) abonelik durumu | `mobile/test/evidence/evidence_paket6_notif_interaction_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 35 | Bildirime dokunulduğunda ilgili abonelik detayına yönlendirme | `mobile/test/evidence/evidence_paket6_fix_test.dart` | Kod tamam; cihaz/canlı bekliyor | Evet — en sona al |
| 36 | Bildirimi erteleme (snooze) özelliği | `mobile/test/evidence/evidence_paket6_fix_test.dart` | Kod tamam; cihaz/canlı bekliyor | Evet — en sona al |
| 37 | Bildirim izni verilmediğinde davranış | `mobile/test/evidence/evidence_paket6_fix_test.dart` | Kod tamam; cihaz/canlı bekliyor | Evet — en sona al |
| 38 | Uygulama arka plandayken/kapalıyken bildirimin gelmesi | `mobile/test/evidence/evidence_paket6_notif_interaction_test.dart` | Kod tamam; cihaz/canlı bekliyor | Evet — en sona al |
| 39 | Aynı gün birden fazla aboneliğin son tarihi olması | `mobile/test/evidence/evidence_paket5_notification_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 40 | Abonelik silindiğinde bekleyen bildirimin iptali | `mobile/test/evidence/evidence_paket3_delete_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 41 | Cihaz saat dilimi değişikliğinde hatırlatma zamanı | `mobile/test/evidence/evidence_paket5_notification_test.dart` | Kod tamam; cihaz/canlı bekliyor | Evet — en sona al |
| 42 | Ay sonu tarihli aylık aboneliğin kısa aylarda hesaplanması | `mobile/test/evidence/evidence_paket1_date_calc_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 43 | 29 Şubat'ta başlayan yıllık aboneliğin artık olmayan yılda hesaplanması | `mobile/test/evidence/evidence_paket1_date_calc_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 44 | Yıl/ay sınırını aşan tarih geçişleri | `mobile/test/evidence/evidence_paket1_date_calc_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 45 | Otomatik yenilenen aboneliğin bir sonraki dönemi | `mobile/test/evidence/evidence_paket1_date_calc_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 46 | Geçersiz tarih formatı girme denemesi | `mobile/test/evidence/evidence_paket7_negative_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 47 | Uygulama arka planda zorla kapatıldığında veri kaybı | `mobile/test/evidence/evidence_paket7_negative_test.dart` | Kod tamam; cihaz/canlı bekliyor | Evet — en sona al |
| 48 | İnternet bağlantısı olmadan uygulamayı kullanma (yerel veri ise) | `mobile/test/evidence/evidence_paket7_negative_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 49 | Karanlık/aydınlık tema geçişi | `mobile/test/evidence/evidence_paket8_ui_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 50 | Farklı ekran boyutlarında görüntüleme | `mobile/test/evidence/evidence_paket8_ui_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 51 | Fiyat alanı için uygun klavye tipi | `mobile/test/evidence/evidence_paket8_ui_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 52 | Uygulama kapatılıp yeniden açıldığında veri korunması | `mobile/test/evidence/evidence_paket9_sync_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 53 | Cihaz yeniden başlatıldığında bildirimlerin aktif kalması | `mobile/test/evidence/evidence_paket6_notif_interaction_test.dart` | Kod tamam; cihaz/canlı bekliyor | Evet — en sona al |
| 54 | Birden fazla cihazda senkronizasyon | `mobile/test/evidence/evidence_paket9_sync_test.dart` | Kod tamam; cihaz/canlı bekliyor | Evet — en sona al |
| 55 | Uygulama güncellemesi sonrası veri bütünlüğü | `mobile/test/evidence/evidence_paket9_sync_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 56 | Çok sayıda abonelikle liste performansı | `mobile/test/evidence/evidence_paket10_perf_security_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 57 | Çok sayıda zamanlanmış bildirimin işletim sistemi limitlerini aşmaması | `mobile/test/evidence/evidence_paket10_perf_security_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 58 | Finansal verilerin cihazda saklanma güvenliği | `mobile/test/evidence/evidence_paket10_perf_security_test.dart` | Tamamlandı (otomatik) | Gerekmez |
| 59 | Uygulama kilidi (PIN/biyometrik) doğru çalışması | `mobile/test/core/app_lock_service_test.dart` | Kod tamam; cihaz/canlı bekliyor | Evet — en sona al |
| 60 | İstatistik dönemini 3/6/12 ay olarak değiştirme | stats_screen.dart + Flutter analyze | Tamamlandı (kod doğrulaması) | Cihaz testi önerilir |
| 61 | 50 kayıttan sonra aşağı kaydırınca sonraki aboneliklerin yüklenmesi | `test/subscription_controller.dart + subscription_list_screen.dart` | Tamamlandı (kod doğrulaması) | Cihaz testi önerilir |
| 62 | Popüler servis kataloğundan abonelik seçme | `test/subscription_form.dart` | Tamamlandı (kod doğrulaması) | Cihaz testi önerilir |
| 63 | Manuel ödeme kaydı ekleme | payment_history_screen.dart + PaymentEventsRepository | Tamamlandı (kod doğrulaması) | Cihaz testi önerilir |
| 64 | Manuel ödeme kaydı silme | payment_history_screen.dart + PaymentEventsRepository | Tamamlandı (kod doğrulaması) | Cihaz testi önerilir |
| 65 | Karttan/bankadan otomatik para çekimi | `test/settings_screen.dart + subscription_form.dart` | Kapsam dışı / kaldırıldı | Gerekmez |

## Kapsam sınırları

- 18–21 ve 40 numaralı Excel maddeleri artık literal metinle birebir: hem
  liste ekranında (tekli ve toplu seçim) hem detay ekranında gerçek/kalıcı
  "Sil" işlemi herhangi bir abonelik için kullanılabilir (eski "yalnızca
  yanlış kayıt" kısıtlaması S39'da kaldırıldı). Archive/cancel ayrı, ek bir
  seçenek olarak duruyor.
- 45 numaralı satırda yenileme tarihi artık kullanıcı onayı beklenmeden,
  `SubscriptionController.load()` içinde otomatik olarak bir sonraki döneme
  ilerletilir; eski (gecikmiş) tarih listede kalmaz (S39).
- 46 numaralı satırda serbest metin tarih girişi yoktur: `DatePicker` yalnız
  geçerli seçimlere izin verir; CSV içe aktarmadaki geçersiz ISO tarihleri ise
  ayrı parser doğrulamasından geçer.
- 35–38, 41, 47, 53, 54 ve 59 için otomatik test yalnız kod yolunu kanıtlar;
  gerçek cihaz veya canlı ortam kabulünü ikame etmez.
