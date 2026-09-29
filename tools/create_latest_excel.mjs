import fs from 'node:fs/promises';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const sourcePath = process.argv[2];
const statusPath = process.argv[3];
const outputPath = process.argv[4];
const sourceWb = await SpreadsheetFile.importXlsx(await FileBlob.load(sourcePath));
const statusWb = await SpreadsheetFile.importXlsx(await FileBlob.load(statusPath));
const sourceSheet = sourceWb.worksheets.getItem('Test Senaryoları');
const statusSheet = statusWb.worksheets.getItem('Test Senaryoları');

// Build a new workbook from the untouched attached source: copy original A:H
// plus the latest evidence/status columns from the prior analysis artifact.
const wb = SpreadsheetFile.create ? SpreadsheetFile.create() : null;
// artifact-tool exposes Workbook through the imported source; clearing and
// rebuilding the copied sheet is avoided by exporting a fresh imported copy.
const sheet = sourceSheet;
sheet.getRange('I1:M60').values = statusSheet.getRange('I1:M60').values;
sheet.getRange('A61:M66').values = [
  [60,'İstatistikler','İstatistik dönemini 3/6/12 ay olarak değiştirme','En az bir aktif abonelik ve ödeme kaydı mevcut','1) İstatistik ekranını aç 2) 3 ay, 6 ay ve 12 ay seçeneklerini sırayla seç','Grafik ve dönem başlığı seçilen ay sayısına göre yeniden hesaplanır','Yüksek','Fonksiyonel','stats_screen.dart + Flutter analyze','Cihaz testi önerilir','Tamamlandı (kod doğrulaması)','Dönem seçici ve dinamik trend hesaplama eklendi; analyzer temiz.', 'Cihazda görsel doğrulama önerilir'],
  [61,'Abonelik Listeleme','50 kayıttan sonra aşağı kaydırınca sonraki aboneliklerin yüklenmesi','En az 51 abonelik mevcut','1) Abonelik listesini aç 2) Listenin sonuna kaydır','İlk sayfa sonrası yükleme göstergesi görünür ve sonraki kayıtlar listelenir','Orta','Performans','subscription_controller.dart + subscription_list_screen.dart','Cihaz testi önerilir','Tamamlandı (kod doğrulaması)','Sayfa boyutu ve loadMore akışı eklendi; analyzer temiz.', '51+ kayıtla cihaz testi önerilir'],
  [62,'Servis Kataloğu','Popüler servis kataloğundan abonelik seçme','Yeni abonelik formu açık','1) Popüler servisler bölümünü aç 2) Netflix/Spotify/ChatGPT gibi bir servis seç','Servis adı ve kategorisi forma aktarılır; kullanıcı manuel isim girmek zorunda kalmaz','Orta','Fonksiyonel','subscription_form.dart','Cihaz testi önerilir','Tamamlandı (kod doğrulaması)','Popüler servis seçimleri mevcut ve ServiceIdentity ile gösteriliyor.', 'Cihazda seçim akışı doğrulanabilir'],
  [63,'Ödeme Geçmişi','Manuel ödeme kaydı ekleme','En az bir abonelik mevcut','1) İstatistik ekranında ödeme geçmişini yönet seç 2) Kayıt ekle 3) Abonelik ve tutar gir','Kullanıcının manuel girdiği ödeme kaydı geçmişte görünür; herhangi bir karttan para çekilmez','Yüksek','Fonksiyonel','payment_history_screen.dart + PaymentEventsRepository','Cihaz testi önerilir','Tamamlandı (kod doğrulaması)','Manuel ödeme geçmişi ekranı ve kayıt akışı eklendi.', 'Manuel kayıtla cihaz testi önerilir'],
  [64,'Ödeme Geçmişi','Manuel ödeme kaydı silme','En az bir ödeme kaydı mevcut','1) Ödeme geçmişini aç 2) Bir kaydın silme ikonuna dokun','Seçilen manuel kayıt kaldırılır; banka/kart tahsilatı yapılmaz','Yüksek','Fonksiyonel','payment_history_screen.dart + PaymentEventsRepository','Cihaz testi önerilir','Tamamlandı (kod doğrulaması)','Local ve Supabase silme akışı eklendi.', 'Silme akışı cihazda doğrulanabilir'],
  [65,'Kapsam Dışı','Karttan/bankadan otomatik para çekimi','Uygulama kurulu','1) Ayarlar ve abonelik formunu incele 2) Ödeme sağlayıcısı bağlantısı arama','Kart ekleme ve otomatik tahsilat akışı bulunmamalı','Yüksek','Güvenlik/Gizlilik','settings_screen.dart + subscription_form.dart','Gerekmez','Kapsam dışı / kaldırıldı','Ürün yalnızca takip uygulamasıdır; karttan para çekme veya ödeme sağlayıcısı entegrasyonu yoktur.', 'Takip ürünü olarak kalır; tahsilat eklenmez']
];
sheet.getRange('A1:M66').format.wrapText = true;
sheet.getRange('A1:M66').format.verticalAlignment = 'center';
sheet.getRange('A1:M66').format.autofitRows();
sheet.getRange('A:A').format.columnWidth = 10;
sheet.getRange('B:B').format.columnWidth = 22;
sheet.getRange('C:C').format.columnWidth = 34;
sheet.getRange('D:D').format.columnWidth = 28;
sheet.getRange('E:F').format.columnWidth = 45;
sheet.getRange('G:H').format.columnWidth = 16;
sheet.getRange('I:I').format.columnWidth = 32;
sheet.getRange('J:J').format.columnWidth = 18;
sheet.getRange('K:K').format.columnWidth = 24;
sheet.getRange('L:M').format.columnWidth = 48;
const summary = sourceWb.worksheets.getItem('Özet');
summary.getRange('A1:B22').clear({applyTo:'contents'});
summary.getRange('A1:B19').values = [
  ['Abonelik Takip Uygulaması - Güncel Test Özeti',null],
  ['Kaynak','Ekli orijinal Excel kopyası üzerine güncel durum listesi'],
  ['Güncelleme tarihi',new Date()],
  ['Toplam test senaryosu',65],
  ['Tamamlanan',null],
  ['Cihaz/canlı doğrulaması bekleyen',null],
  ['Kapsam dışı veya kaldırılan',null],
  [null,null],
  ['Güncel eklenen senaryolar','Durum'],
  ['İstatistik dönem seçici','Tamamlandı (kod doğrulaması)'],
  ['Abonelik pagination / load more','Tamamlandı (kod doğrulaması)'],
  ['Popüler servis kataloğu','Tamamlandı (kod doğrulaması)'],
  ['Manuel ödeme geçmişi ekleme/silme','Tamamlandı (kod doğrulaması)'],
  ['Karttan otomatik para çekimi','Kapsam dışı / kaldırıldı'],
  [null,null],
  ['Durum açıklaması',null],
  ['Tamamlandı (otomatik)','Test dosyası geçti'],
  ['Tamamlandı (kod doğrulaması)','Kod ve analyzer doğrulandı; gerçek cihaz testi ayrıca önerilir'],
  ['Kapsam dışı / kaldırıldı','Ürün kapsamına dahil değil veya kullanıcı isteğiyle kaldırıldı'],
];
summary.getRange('B5').formulas = [["=COUNTIF('Test Senaryoları'!K2:K66,\"Tamamlandı*\")"]];
summary.getRange('B6').formulas = [["=COUNTIF('Test Senaryoları'!J2:J66,\"*Evet*\")"]];
summary.getRange('B7').formulas = [["=COUNTIF('Test Senaryoları'!K2:K66,\"Kapsam dışı*\")"]];
summary.getRange('A1:B19').format.wrapText = true;
summary.getRange('A1:B1').format = {fill:'#1F4E78',font:{bold:true,color:'#FFFFFF',size:14}};
summary.getRange('A9:B9').format = {fill:'#1F4E78',font:{bold:true,color:'#FFFFFF'}};
summary.getRange('A16:B16').format = {fill:'#1F4E78',font:{bold:true,color:'#FFFFFF'}};
summary.getRange('A:A').format.columnWidth = 38;
summary.getRange('B:B').format.columnWidth = 42;
summary.getRange('A1:B19').format.autofitRows();
await fs.mkdir('D:/SubscriptTrack/outputs/test-scenario-analysis', {recursive:true});
const out = await SpreadsheetFile.exportXlsx(sourceWb);
await out.save(outputPath);
const check = await sourceWb.inspect({kind:'table',sheetId:'Test Senaryoları',range:'A58:M66',include:'values,formulas',tableMaxRows:12,tableMaxCols:13,maxChars:16000});
console.log(check.ndjson);
const errors = await sourceWb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:100},summary:'formula errors'});
console.log(errors.ndjson);
const img = await sourceWb.render({sheetName:'Özet',range:'A1:B19',scale:1,format:'png'});
await fs.writeFile('D:/SubscriptTrack/outputs/test-scenario-analysis/guncel_liste_ozet.png',new Uint8Array(await img.arrayBuffer()));
