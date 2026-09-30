# Excel Test Senaryosu İzlenebilirliği

Son güncelleme: 30 Eylül 2026 (tablo 19 Eylül 2026 S39 durumunu yansıtır; sonraki eklemeler bu tabloya işlenmedi)

Bu tablo, test senaryoları Excel çalışma kitabı (yerel `outputs/` altında, git'te değildir; en güncel: `Abonelik_Takip_Test_Senaryolari_EN_GUNCEL_YENI.xlsx`) içindeki her satırı kaynak
testine bağlar. `Kod` yalnız otomatik testin bulunduğunu gösterir; işletim
sistemi teslimi, fiziksel cihaz, mağaza veya canlı backend gerektiren satırlar
`Cihaz/canlı` olarak ayrıca kabul edilmelidir.

| No | Senaryo özeti | Otomatik kanıt | Kanıt türü |
|---:|---|---|---|
| 1 | Geçerli abonelik ekleme | `test/evidence/excel_scenarios_1_2_9_10_test.dart` | Kod |
| 2 | Zorunlu alan doğrulama | `test/evidence/excel_scenarios_1_2_9_10_test.dart` | Widget |
| 3 | Negatif fiyat | `test/evidence/evidence_paket2_crud_test.dart` | Widget |
| 4 | Sayısal olmayan fiyat | `test/evidence/evidence_paket2_crud_test.dart` | Widget |
| 5 | Geçmiş başlangıç tarihi | `test/evidence/evidence_paket1_date_calc_test.dart` | Domain |
| 6 | Gelecek başlangıç tarihi | `test/evidence/evidence_paket1_date_calc_test.dart` | Domain |
| 7 | Aynı isimli abonelik | `test/evidence/evidence_paket2_crud_test.dart` | Widget/controller |
| 8 | Farklı yenileme döngüleri | `test/evidence/evidence_paket1_date_calc_test.dart` | Domain |
| 9 | TRY/USD/EUR kaydı | `test/evidence/excel_scenarios_1_2_9_10_test.dart` | Controller |
| 10 | Kategori kalıcılığı | `test/evidence/excel_scenarios_1_2_9_10_test.dart` | Controller |
| 11 | Uzun not | `test/evidence/evidence_paket2_crud_test.dart` | Widget |
| 12 | Hızlı ardışık ekleme | `test/evidence/evidence_paket2_crud_test.dart` | Controller |
| 13 | Fiyat güncelleme | `test/evidence/evidence_paket2_crud_test.dart` | Controller/widget |
| 14 | Döngü güncelleme | `test/evidence/evidence_paket2_crud_test.dart` | Widget |
| 15 | Tarih güncelleme | `test/evidence/evidence_paket2_crud_test.dart` | Widget |
| 16 | Düzenlemede zorunlu alan | `test/evidence/evidence_paket2_crud_test.dart` | Widget |
| 17 | Kaydetmeden iptal | `test/evidence/evidence_paket2_crud_test.dart` | Widget |
| 18 | Yanlış kaydı fiziksel silme | `test/evidence/evidence_paket3_delete_test.dart` | Widget/controller |
| 19 | Yanlış kayıt silmesini iptal etme | `test/evidence/evidence_paket3_delete_test.dart` | Widget |
| 20 | Yanlış kaydın bildirimi | `test/evidence/evidence_paket3_delete_test.dart` | Controller |
| 21 | Toplu arşivleme | `test/evidence/evidence_paket3_delete_test.dart` | Widget/controller |
| 22 | Liste ve toplam maliyet | `test/evidence/evidence_paket4_list_test.dart` | Widget/controller |
| 23 | Boş liste | `test/evidence/evidence_paket4_list_test.dart` | Widget |
| 24 | Yenileme sırası | `test/evidence/evidence_paket4_list_test.dart` | Widget |
| 25 | Pasif kayıt ayrımı | `test/evidence/evidence_paket4_list_test.dart` | Widget |
| 26 | Ada göre arama | `test/evidence/evidence_paket4_list_test.dart` | Widget |
| 27 | Kategori filtresi | `test/evidence/evidence_paket4_list_test.dart` | Widget |
| 28 | Tutara göre sıralama | `test/evidence/evidence_paket4_list_test.dart` | Widget |
| 29 | Sonuçsuz arama | `test/evidence/evidence_paket4_list_test.dart` | Widget |
| 30 | Varsayılan hatırlatma günü | `test/evidence/evidence_paket5_notification_test.dart` | Saf zamanlama |
| 31 | Özel hatırlatma günü | `test/evidence/evidence_paket5_notification_test.dart` | Saf zamanlama |
| 32 | Birden çok hatırlatma | `test/evidence/evidence_paket5_notification_test.dart` | Kural |
| 33 | Bugün yenilenen kayıt | `test/evidence/evidence_paket5_notification_test.dart` | Saf zamanlama |
| 34 | Gecikmiş yenileme | `test/evidence/evidence_paket6_notif_interaction_test.dart` | Controller |
| 35 | Bildirim dokunuşu | `test/evidence/evidence_paket6_fix_test.dart` | Callback dispatch; cihaz kabulü ayrıca |
| 36 | Snooze | `test/evidence/evidence_paket6_fix_test.dart` | Servis guard; cihaz kabulü ayrıca |
| 37 | Bildirim izni reddi | `test/evidence/evidence_paket6_fix_test.dart` | UI/servis guard; cihaz kabulü ayrıca |
| 38 | Arka plan bildirimi | `test/evidence/evidence_paket6_notif_interaction_test.dart` | Yapılandırma; cihaz kabulü ayrıca |
| 39 | Aynı gün çok abonelik | `test/evidence/evidence_paket5_notification_test.dart` | Kimlik/zamanlama |
| 40 | Arşivleme sonrası bildirim iptali | `test/evidence/evidence_paket3_delete_test.dart` | Controller |
| 41 | Timezone değişimi | `test/evidence/evidence_paket5_notification_test.dart` | Timezone mock; cihaz kabulü ayrıca |
| 42 | 31 Ocak/kısa ay | `test/evidence/evidence_paket1_date_calc_test.dart` | Domain |
| 43 | 29 Şubat/yıllık | `test/evidence/evidence_paket1_date_calc_test.dart` | Domain |
| 44 | Yıl/ay sınırı | `test/evidence/evidence_paket1_date_calc_test.dart` | Domain |
| 45 | Kullanıcı onaylı yenileme ilerletme | `test/evidence/evidence_paket1_date_calc_test.dart` | Domain |
| 46 | Tarih seçicide geçersiz seçim engeli | `test/evidence/evidence_paket7_negative_test.dart` | CSV parser/date picker |
| 47 | Force-kill sonrası veri | `test/evidence/evidence_paket7_negative_test.dart` | Cache; cihaz kabulü ayrıca |
| 48 | Offline kullanım | `test/evidence/evidence_paket7_negative_test.dart` | Queue/controller |
| 49 | Açık/koyu tema | `test/evidence/evidence_paket8_ui_test.dart` | Widget |
| 50 | Ekran boyutları | `test/evidence/evidence_paket8_ui_test.dart` | Widget |
| 51 | Sayısal klavye | `test/evidence/evidence_paket8_ui_test.dart` | Widget |
| 52 | Yeniden açılışta veri | `test/evidence/evidence_paket9_sync_test.dart` | Cache/controller |
| 53 | Reboot sonrası bildirim | `test/evidence/evidence_paket6_notif_interaction_test.dart` | Android manifest; cihaz kabulü ayrıca |
| 54 | Çoklu cihaz senkronu | `test/evidence/evidence_paket9_sync_test.dart` | Realtime merge; canlı kabulü ayrıca |
| 55 | Güncelleme sonrası bütünlük | `test/evidence/evidence_paket9_sync_test.dart` | JSON/migration uyumu |
| 56 | 500 kayıt performansı | `test/evidence/evidence_paket10_perf_security_test.dart` | Widget |
| 57 | Bildirim üst sınırı | `test/evidence/evidence_paket10_perf_security_test.dart` | Saf limit mantığı |
| 58 | Yerel veri güvenliği | `test/evidence/evidence_paket10_perf_security_test.dart` | Secure storage |
| 59 | PIN/biyometrik kilit | `test/core/app_lock_service_test.dart` | PIN; biyometri cihaz kabulü ayrıca |

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
