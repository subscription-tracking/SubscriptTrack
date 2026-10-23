"""Regenerate traceability documentation from the untouched workbook extraction."""
from pathlib import Path
import json
import csv

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'outputs/01a12c47-112e-7290-abf3-9e26a8f7450b/requirements/source.json'
rows = json.loads(SOURCE.read_text(encoding='utf-8'))['Test Senaryoları'][1:]
OUT = ROOT / 'docs/quality/expo-59'
OUT.mkdir(parents=True, exist_ok=True)

groups = [
    (range(1, 18), 'expo/src/features/subscriptions/ui/SubscriptionFormScreen.tsx',
     ['expo/src/features/subscriptions/domain/formSchedule.test.ts', 'expo/src/features/subscriptions/domain/subscriptionForm.test.ts', 'expo/src/features/subscriptions/ui/SubscriptionFormScreen.test.tsx'],
     'Form doğrulaması, otomatik/manüel tarih, kaydetme ve çift dokunma yolları'),
    (range(18, 22), 'expo/src/features/subscriptions/ui/useDeletionAction.ts',
     ['expo/src/features/subscriptions/ui/useDeletionAction.test.tsx', 'expo/src/features/subscriptions/data/subscriptionSyncCoordinator.test.ts', 'backend/scripts/isolated-postgres-acceptance.mjs'],
     'Onay/vazgeçme, toplu silme, FIFO ve PostgreSQL işlem garantileri'),
    (range(22, 30), 'expo/src/features/subscriptions/ui/SubscriptionListScreen.tsx',
     ['expo/src/features/subscriptions/domain/subscriptionFilter.test.ts', 'expo/src/features/dashboard/domain/dashboardSummary.test.ts', 'expo/src/features/subscriptions/ui/SubscriptionListScreen.test.tsx'],
     'Liste, birleşik filtreler, para birimi ve kararlı sıralama'),
    (range(30, 42), 'expo/src/features/notifications/data/notificationScheduler.ts',
     ['expo/src/features/notifications/domain/reminderPlanner.test.ts', 'expo/src/features/notifications/data/notificationScheduler.sync.test.ts', 'expo/src/features/notifications/data/notificationNativeErrors.test.ts'],
     'Plan üretimi/değişimi, hata/kapasite/silme ve bildirim yanıtı; OS teslimi mock ile kanıtlanmaz'),
    (range(42, 47), 'expo/src/core/time/calendar.ts',
     ['expo/src/core/time/calendar.test.ts', 'expo/src/features/subscriptions/domain/formSchedule.test.ts', 'expo/src/features/subscriptions/domain/renewalOverdue.test.ts'],
     'Ay sonu, artık yıl, UTC/IANA ve gerçek vade korunması'),
    (range(47, 49), 'expo/src/features/subscriptions/data/subscriptionSyncCoordinator.ts',
     ['expo/src/features/subscriptions/data/subscriptionSyncCoordinator.test.ts', 'expo/src/features/subscriptions/domain/storedSubscriptions.test.ts'],
     'Kalıcı FIFO, offline görünüm, hesap ayrımı ve hata yolları'),
    (range(49, 52), 'expo/src/shared/design/ThemeProvider.tsx',
     ['expo/src/shared/design/ThemeProvider.test.tsx', 'expo/src/shared/design/themeRuntime.test.tsx', 'expo/src/features/subscriptions/ui/SubscriptionFormScreen.test.tsx'],
     'Tema kalıcılığı/token değişimi ve form; gerçek yerleşim/klavye ölçümü açık'),
    (range(52, 56), 'expo/src/features/subscriptions/data/subscriptionSyncCoordinator.ts',
     ['expo/src/features/subscriptions/data/subscriptionSyncCoordinator.test.ts', 'expo/src/features/subscriptions/domain/storedSubscriptions.test.ts', 'expo/src/core/storage/secureSessionStorage.test.ts'],
     'Yerel kalıcılık/eski biçimler; OS reboot, iki cihaz ve imzalı yükseltme açık'),
    (range(56, 57), 'backend/migrations/038_subscription_soft_delete.sql',
     ['backend/scripts/isolated-postgres-acceptance.mjs'],
     '1.000 kota/1.001 reddi ve eşzamanlı sınır; native süre/FPS ölçümü açık'),
    (range(57, 58), 'expo/src/features/notifications/domain/reminderPlanner.ts',
     ['expo/src/features/notifications/data/notificationScheduler.sync.test.ts', 'expo/src/features/notifications/data/notificationNativeErrors.test.ts'],
     'En yakın 60 plan, snooze/test kapasite paylaşımı; OS teslimi açık'),
    (range(58, 60), 'expo/src/features/settings/ui/AppLockProvider.tsx',
     ['expo/src/core/security/pinRecord.test.ts', 'expo/src/features/settings/data/appLockStore.test.ts', 'expo/src/features/settings/ui/AppLockProvider.test.tsx', 'expo/src/features/settings/data/biometrics.test.ts'],
     'PIN hash/lockout/depolama hatası/hesap değişimi; native biyometri/backup açık'),
]
overrides = {
 5: 'Geçmiş başlangıçta bugünden sonraki ilk döngü; bugün/ge gelecek başlangıç ilk vadedir.',
 6: 'Henüz başlamadı etiketi; başlangıç öncesi aktif toplamdan hariç, takvimde görünür.',
 7: 'Aynı isim ayrı UUID ile serbest; aynı istek anahtarının tekrarı ayrı kayıt oluşturmaz.',
 11: 'Not 2.000 karakter; 2.001 açık hata ile reddedilir, sessiz kesilmez.',
 13: 'Güncel abonelik fiyatı değişir. Önceki ödeme tutarı değişmez; kaynak metin bu kararla yorumlandı.',
 18: 'Mantıksal silme; normal listeler/export hariç, finansal geçmiş korunur; deploy kapısı açık.',
 20: '40 ile aynı silme/bildirim gereksinimi: normal ve ertelenmiş bağlı planlar iptal edilir.',
 22: 'Tüm para birimleri varsayılan; TRY/USD/EUR ayrı toplam blokları, FX yok.',
 24: 'Vade, ad, UUID ile kararlı sıralama; vadesiz kayıtlar sonda.',
 28: 'Tek para biriminde aylık eşdeğer; Tümü görünümünde tarih/ad, anlam UI üzerinde yazılı.',
 30: 'Varsayılan 3 gün önce 09:00; içerikte ad, tutar/para birimi, açık tarih.',
 31: '0/1/3/7 gün çoklu seçimi; saat genel ayardır. Özel kurallar offline oluşturma işlemiyle kalıcı kuyruğa alınır.',
 33: 'Bugünkü saat geçmişse geçmiş zamana plan yok; uygulama vade uyarısı gösterir.',
 34: 'Gecikmiş vade korunur; Sonraki döngü tahmini ayrıca gösterilir. Otomatik ödeme/tarih yazılmaz.',
 36: '30 dakika ertele. Kapalı uygulamada işlem için uygulama öne açılır; detay rotasına gitmez.',
 40: '20 ile aynı gereksinim; kaynak iki ID ayrı izlenir.',
 41: 'Yeni profil device, mevcut fixed. Device her cihazın IANA bölgesini izler; deploy kapısı açık.',
 45: 'Sonraki döngü tahmini gösterilir. Gerçek vade yalnız Ödendi ve yenilendi onayıyla ilerler.',
 49: 'Yeni kurulum sistem; eski kullanıcının koyu tercihi korunur. Açık/koyu/sistem kalıcı.',
 56: '500 ve 1.000 veri; 1.001 quota reddi. Native liste ≤2 s, arama ≤300 ms ölçülmeli.',
 57: 'En yakın 60 plan; erteleme aynı kapasite içinde. Açılış/resume ile doldurulur, sınırsız teslim vaadi yok.',
 58: 'SecureStore ve fail-closed; log, backup, export, ekran görüntüsü native denetlenmeli.',
}
matrix = []
def link(path):
    assert (ROOT / path).is_file(), path
    return f'[{Path(path).name}](../../../{path})'
for row in rows:
    number, category, title, pre, steps, expected, priority, kind = row
    group = next(g for g in groups if number in g[0])
    code, tests, proof = group[1:]
    gate = 'Android/iOS native son kullanıcı akışı'
    if number in [18,19,20,21,40,41,54,55,58]:
        gate += '; onaylı canlı migration/test hesapları veya imzalı yükseltme'
    if number in [34,45]: gate += '; dış kabul sorumlusunun iki tarih yorumunu kabulü'
    matrix.append(dict(id=number, category=category, title=title, source_expected=expected,
                       expected=overrides.get(number, expected), source_steps=steps, source_precondition=pre,
                       priority=priority, type=kind, implementation=code, tests=tests,
                       code_status='Uygulandı; yerel kanıt aşağıdaki kapsamla sınırlı', evidence=proof,
                       acceptance='Açık — cihaz/canlı kanıtı bu çalışmada üretilmedi', gate=gate))
assert len(matrix) == 59 and {r['id'] for r in matrix} == set(range(1,60))
(OUT/'matrix.json').write_text(json.dumps(matrix,ensure_ascii=False,indent=2),encoding='utf-8')
lines=['# Expo 59 zorunlu senaryo — izlenebilirlik matrisi','',
       'Tarih: 12 Ekim 2026. Kaynak Excel değiştirilmedi. 59/59 ID sözleşmeye bağlandı; **59/59 ürün kabulü ilan edilmedi**.', '',
       'Test bağlantıları ilgili davranış ailesinin kanıtıdır; ekran/OS/canlı sözleşmenin tamamını kanıtlamaz. Tam kaynak beklenti ve adımlar [matrix.json](matrix.json) içinde korunur.', '',
       '20/40 aynı gereksinimi izler. 34/45 iki tarih gösterimi dış kabul sorumlusuna sunulacaktır. 13 güncel abonelik fiyatı olarak yorumlandı; geçmiş ödeme tutarı korunur.', '',
       '| ID | Kaynak senaryo | Kesin beklenti | Uygulama / otomatik kanıt | Kod durumu | Ürün kabulü / kalan kapı |',
       '|---|---|---|---|---|---|']
for r in matrix:
    proof=link(r['implementation'])+'; '+'; '.join(link(t) for t in r['tests'])+'<br>'+r['evidence']
    cells=[str(r['id']),r['title'],r['expected'],proof,r['code_status'],'**Açık** — '+r['gate']]
    lines.append('| '+' | '.join(c.replace('\n','<br>').replace('|','&#124;') for c in cells)+' |')
(OUT/'MATRIX.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')

contract='''# Expo 59 senaryo — güncel gereksinim sözleşmesi

Durum: Expo kodu ve ileri migration hazırlığı; canlı/native kabul açık. 12 Ekim 2026 kullanıcı kararı önceki çelişen Expo kurallarını günceller. Flutter bu değişiklikte korunur; tam parite iddiası yoktur.

## Tarih, form, para

Geçmiş başlangıçta bugünden sonraki ilk döngü; bugün/gelecek başlangıçta başlangıç günü ilk vade. Düzenlemede kayıtlı vade korunur; başlangıç/periyot değişimi otomatik hesaplar. Manuel tarih seçimi ve Otomatik hesapla kontrolü vardır. Haftalık +7, aylık +1, üç aylık +3, yıllık +12 ay; ay sonu kırpılırken özgün faturalama günü korunur. Trial bağımsızdır. Henüz başlamadı kalıcı enum değildir; aktif harcamaya girmez, takvimde görünür. Gerçek gecikmiş vade korunur, tahmini sonraki döngü ayrı gösterilir; ödeme/tarih yazımı onay gerektirir. Ortak sivil gün saati gece yarısı, resume ve bölge değişiminde yenilenir.

TRY/USD/EUR ayrı toplamlar, kur dönüşümü yok. Ana liste tüm para birimleri; fiyat sırası tek para biriminde aylık eşdeğer, Tümü görünümünde tarih/ad. Tarih-ad-ID kararlı sıralama; vadesiz sonda. Fiyat değişimi geçmiş ödeme tutarını değiştirmez. Not sınırı 2.000; aşım açık hata.

## Silme ve FIFO

038 deleted_at ekler. Mantıksal silme normal liste/arama/takvim/toplam/arşiv/export görünümünden çıkarır; ödeme/tasarruf geçmişi korunur. Durum cancelled/is_archived true eski istemcilerin otomatik işlerini durdurur. Silme geçmiş tasarruf olayını yeniden üretmez. Fiziksel hesap temizliği ve yanlış kayıt düzeltmesi ayrı davranışlardır. Kaydı yeniden etkinleştirmek deleted_at değerini geri alamaz.

soft_delete_subscriptions_idempotent(p_idempotency_key text, p_subscription_ids uuid[]) sahiplik, canonical ID listesi, aynı anahtar tekrar sonucu, farklı içerikte 23505, kullanıcı advisory kilidi ve satır kilitleriyle tek işlem yürütür. 1..1.000 ID. Silinmiş satırın güncellenmesi/ödeme/olay eklemesi reddedilir. Finansal geçmiş RLS sahibi kullanıcıya görünmeye devam eder. Kota silinmemiş 1.000; eşzamanlı INSERT aynı kullanıcı kilidiyle sınırı aşamaz.

FIFO sürüm 2 silme ve oluşturma deneme/kimlik metadata'sı içerir; eski dizi/sürüm 1 okunur. Offline görünümden hemen çıkar; kuyruk kalıcıdır. Çevrimiçi hızlı ekleme de istek gönderilmeden diske yazılır. Gönderilmediği kesin ekleme güvenle kuyruktan kaldırılır; yanıtı kaybolmuş veya eski biçimde durumu belirsiz ekleme aynı anahtarla çözümlenir, gerçek kimlik kalıcı tutulur ve ardından mantıksal silinir. Silme isteği ve özel 0/1/3/7 bildirim günleri kaybolmaz; özel günler oluşturma işleminin takip yazımı olarak aynı sabit anahtarla FIFO'da yeniden denenir. Gönderilmiş kaydın önceki işleri sıralı tamamlanır. Kalıcı ret görünür; ağ/serialization hatasında işlem korunur. Silme onayından vazgeçme yazım/iptal yapmaz. Native iptal hatası kalıcı intent ve resume eşitlemesiyle yeniden denenir. Eski istemciye geri sürüm düşürme garantisi verilmez; eski veri biçimleri yeni istemcide okunur.

## Bildirim ve bölge

Ad, tutar/para birimi, açık vade; varsayılan 3 gün/09:00, 0/1/3/7 çoklu gün, genel saat. Aynı plan dokunulmaz; içerik/saat/IANA değişirse değiştirilir. Geçmiş saate plan yok. En yakın 60 kapasitesi snooze/test kayıtlarıyla paylaşılır. Normal plan yenilemesi ertelenmiş/test kayıtlarını korur; silme tüm bağlı normal/snooze planlarını kaldırır. Erteleme 30 dakika; cold-start işlemi için uygulama öne gelir ve detay yönlendirmesi yapmaz. Bu OS davranışı native kabulde ölçülmelidir. Açılış/resume/veri/izin/bölge değişiminde yeniden doldurulur; uzun süre açılmayan uygulamada sınırsız ileri teslim garantisi yoktur. Expo Go yerel native kabul kanıtı değildir.

039 profiles.timezone_mode = device|fixed: mevcut kullanıcı fixed, yeni default device. Device her cihazın kendi IANA bölgesini izler. confirm_subscription_renewal_in_timezone_idempotent önceki 036 sözleşmesine p_timezone text ekler; fixed profilde profil bölgesi, device modunda doğrulanan IANA bölgesi bugün hesabında kullanılır. Eski RPC korunur.

## Tema, güvenlik, mimari

Tema cihaz tercihi: light/dark/system. Yeni kurulum system; mevcut koyu görünüm korunur. Semantik palette, ortak tema store ve tema duyarlı stiller kullanılır. Tüm rotaların ekran/büyük yazı/klavye kabulü açık. Eski cache/queue/PIN biçimleri okunur; okunamayan veri üzerine yazılmaz, kilit açılmaz. Hesap değişiminde önceki içerik yükleme tamamlanmadan gösterilmez. Kalıcı PIN lockout/hash yükseltme/storage hata/biometri iptali otomatik testlidir; SecureStore donanım/backup/export/log incelemesi native kapıdır.

## Dağıtım ön koşulları

Yeni silme yolu EXPO_PUBLIC_SOFT_DELETION_ENABLED=false; yeni profil/RPC yolu EXPO_PUBLIC_TIMEZONE_MODE_ENABLED=false. Atomik yenileme mevcut ayrı anahtarı canlı 036 doğrulanana kadar kapalı kalır. Canlı şema ve bekleyen migration zinciri salt okunur gözden geçirilmeli; 038/039 ile process-export worker uyumlu dağıtılmalıdır. Live migration ayrı kullanıcı onayı ister. Eski RPC'ler korunur; desteklenmeyen backend'de açık hazır değil hatası, fiziksel silme fallback yok. 038 restrictive RLS silinen satırın realtime UPDATE olayını gizleyebilir: Expo foreground 4 saniye yenileme kullanır; iki cihaz ≤5 s kabulü ölçülmemiştir.

## Kanıt bağlantıları

[59 ID matrisi](MATRIX.md) · [Yerel sonuç raporu](REPORT.md) · [Native/canlı kabul paketi](ACCEPTANCE.md). PostgreSQL runner minimal izole fixture kullanır; üretim Supabase şemasının tamamı veya canlı dağıtım kanıtı değildir.
'''
(OUT/'CONTRACT.md').write_text(contract,encoding='utf-8')

targets=['docs/CURRENT_STATUS.md','docs/product/PRODUCT.md','docs/product/DOMAIN.md','docs/product/DESIGN_SYSTEM.md','docs/reference/API.md','docs/reference/DATA_MODEL.md','docs/architecture/NOTIFICATIONS.md','docs/architecture/SECURITY.md','docs/architecture/MOBILE.md','docs/expo/ARCHITECTURE.md','docs/expo/PARITY.md','docs/operations/DEVICE_ACCEPTANCE.md','docs/decisions/0006-archive-over-delete.md','docs/README.md']
for path in targets:
    file=ROOT/path
    text=file.read_text(encoding='utf-8')
    marker='## Expo 59 senaryo sözleşmesi — 12 Ekim 2026'
    if marker not in text:
        import os
        rel=os.path.relpath(OUT/'CONTRACT.md',file.parent).replace('\\','/')
        text+='\n'+marker+'\n\n**Expo için güncel kullanıcı kararı:** ['+'Gereksinim, API/veri modeli ve dağıtım sözleşmesi]('+rel+'). Önceki Expo anlatımıyla çelişen tarih, mantıksal silme, 1.000 kota, 2.000 not, tüm para birimleri, device/fixed bölge ve açık/koyu/sistem tema kurallarında bu sözleşme geçerlidir. Flutter mevcut uygulaması korunur. Kod hazırlığı canlı/native kabul anlamına gelmez.\n'
        file.write_text(text,encoding='utf-8')

fixtures=ROOT/'testdata/expo59'
fixtures.mkdir(parents=True,exist_ok=True)
for batch in range(2):
    with (fixtures/f'performance-{batch+1}-500.csv').open('w',encoding='utf-8',newline='') as f:
        writer=csv.writer(f)
        writer.writerow(['name','amount','currency','billing_cycle','start_date','next_renewal_date','category','notes'])
        for index in range(batch*500,(batch+1)*500):
            writer.writerow([f'Kabul {index+1:04}',f'{(index%997)+1}.99',['TRY','USD','EUR'][index%3],'monthly','2026-10-12','2026-11-12','software',f'Performans verisi {index+1}'])
print('59/59 mapped; documentation and two 500-record datasets generated')
