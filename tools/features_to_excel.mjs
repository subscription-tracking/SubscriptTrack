import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const input = process.argv[2];
const output = process.argv[3];
const text = await fs.readFile(input, 'utf8');
const lines = text.split(/\r?\n/);
const featureRows = [];
const mismatchRows = [];
let section = '';
for (const raw of lines) {
  const line = raw.trimEnd();
  if (!line.trim()) continue;
  if (/^1\. Aktif/.test(line)) { section = 'Aktif ve çalışan'; continue; }
  if (/^2\. Var ve/.test(line)) { section = 'Kısmi / doğrulama bekliyor'; continue; }
  if (/^3\. Ekranda/.test(line)) { section = 'Eksik / çalışmıyor / yok'; continue; }
  if (/^4\. Doküman/.test(line)) { section = 'Doküman-kod uyumsuzluğu'; continue; }
  if (line.startsWith('Özellik\t') || line === 'Konu\tSorun') continue;
  const parts = line.split('\t').map((v) => v.trim());
  if (section === 'Doküman-kod uyumsuzluğu') {
    if (parts.length >= 2) mismatchRows.push([parts[0], parts.slice(1).join('\t')]);
  } else if (parts.length >= 3) {
    featureRows.push([section, parts[0], parts[1], parts.slice(2).join('\t')]);
  }
}

// Apply the latest implementation changes after parsing the earlier audit text.
const overrides = new Map([
  ['Abonelik pagination / load more', ['✅ Aktif', '50 kayıtlık istemci sayfalaması ve loadMore akışı eklendi; analyzer temiz.']],
  ['Gerçek servis kataloğu', ['◐ Kısmi', 'Popüler servis seçimleri (Netflix, Spotify, ChatGPT vb.) mevcut; merkezi/uzaktan güncellenen katalog ve arama altyapısı hâlâ yok.']],
  ['Tam ödeme geçmişi yönetim ekranı', ['◐ Kısmi', 'Manuel ödeme kaydı ekleme ve silme ekranı eklendi; kapsamlı düzenleme ve ödeme sağlayıcısı entegrasyonu yok.']],
  ['İstatistik dönem seçici', ['✅ Aktif', '3/6/12 ay seçimi eklendi; trend grafiği seçilen döneme göre yeniden hesaplanıyor.']],
  ['Payment methods API', ['◐ Kısmi', 'Backend API mevcut; karttan para çekme yapılmıyor. Kullanıcı arayüzündeki kart/ödeme yöntemi yönetimi kaldırıldı; API yalnızca geriye dönük veri uyumluluğu için tutuluyor.']],
]);
for (const row of featureRows) {
  const override = overrides.get(row[1]);
  if (override) { row[2] = override[0]; row[3] = override[1]; }
}
featureRows.push(['Ödeme takibi', 'Kullanılan ödeme etiketi', '✅ Aktif', 'Kullanıcı yalnızca “Garanti Bonus” veya “Papara” gibi bir etiket seçebilir. Kart numarası, CVV ve otomatik tahsilat yoktur; etiket veritabanındaki payment_method alanında saklanır.']);

const wb = Workbook.create();
const sheet = wb.worksheets.add('Özellik Envanteri');
sheet.showGridLines = false;
sheet.getRange(`A1:E${featureRows.length + 2}`).values = [
  ['SubscriptTrack Özellik Envanteri', null, null, null, null],
  ['Kategori', 'Özellik', 'Durum', 'İnceleme sonucu / eksik taraf', 'Değerlendirme tarihi'],
  ...featureRows.map((r) => [...r, new Date()]),
];
sheet.mergeCells('A1:E1');
sheet.getRange('A1:E1').format = {fill:'#1F4E78',font:{bold:true,color:'#FFFFFF',size:15}};
sheet.getRange('A2:E2').format = {fill:'#305496',font:{bold:true,color:'#FFFFFF'}};
sheet.getRange(`A1:E${featureRows.length + 2}`).format.wrapText = true;
sheet.getRange(`A1:E${featureRows.length + 2}`).format.verticalAlignment = 'center';
sheet.getRange(`E3:E${featureRows.length + 2}`).format.numberFormat = 'yyyy-mm-dd';
sheet.getRange(`A1:E${featureRows.length + 2}`).format.autofitRows();
sheet.getRange('A:A').format.columnWidth = 28;
sheet.getRange('B:B').format.columnWidth = 34;
sheet.getRange('C:C').format.columnWidth = 24;
sheet.getRange('D:D').format.columnWidth = 74;
sheet.getRange('E:E').format.columnWidth = 16;
sheet.freezePanes.freezeRows(2);
sheet.getRange(`C3:C${featureRows.length + 2}`).conditionalFormats.add('containsText',{text:'✅ Aktif',format:{fill:'#D9EAD3',font:{color:'#274E13',bold:true}}});
sheet.getRange(`C3:C${featureRows.length + 2}`).conditionalFormats.add('containsText',{text:'◐ Kısmi',format:{fill:'#FFF2CC',font:{color:'#7F6000',bold:true}}});
sheet.getRange(`C3:C${featureRows.length + 2}`).conditionalFormats.add('containsText',{text:'⏳ Doğrulanmadı',format:{fill:'#D9EAF7',font:{color:'#1F4E79',bold:true}}});
sheet.getRange(`C3:C${featureRows.length + 2}`).conditionalFormats.add('containsText',{text:'⚠️',format:{fill:'#FCE4D6',font:{color:'#9C0006',bold:true}}});

const summary = wb.worksheets.add('Özet');
summary.showGridLines = false;
const statusCounts = {};
for (const [, , status] of featureRows) statusCounts[status] = (statusCounts[status] ?? 0) + 1;
const summaryRows = [['SubscriptTrack Özellik Durum Özeti', null], ['Toplam özellik', featureRows.length], ['Aktif ve çalışan', statusCounts['✅ Aktif'] ?? 0], ['Kısmi / koşullu', statusCounts['◐ Kısmi'] ?? 0], ['Doğrulanmadı', statusCounts['⏳ Doğrulanmadı'] ?? 0], ['Eksik / yok / çalışmıyor', featureRows.filter((r) => r[2].startsWith('⚠️')).length], ['Uyumsuz', featureRows.filter((r) => r[2].startsWith('🧾')).length], [null, null], ['Kategori', 'Özellik sayısı'], ['Aktif ve çalışan', featureRows.filter((r) => r[0] === 'Aktif ve çalışan').length], ['Kısmi / doğrulama bekliyor', featureRows.filter((r) => r[0] === 'Kısmi / doğrulama bekliyor').length], ['Eksik / çalışmıyor / yok', featureRows.filter((r) => r[0] === 'Eksik / çalışmıyor / yok').length], [null, null], ['Not', 'Bu çalışma test senaryosu listesi değildir; mevcut ürün özelliklerinin durum envanteridir.']];
summary.getRange(`A1:B${summaryRows.length}`).values = summaryRows;
summary.mergeCells('A1:B1');
summary.getRange('A1:B1').format = {fill:'#1F4E78',font:{bold:true,color:'#FFFFFF',size:15}};
summary.getRange('A9:B9').format = {fill:'#305496',font:{bold:true,color:'#FFFFFF'}};
summary.getRange(`A1:B${summaryRows.length}`).format.wrapText = true;
summary.getRange('A:A').format.columnWidth = 32;
summary.getRange('B:B').format.columnWidth = 72;
summary.getRange(`A1:B${summaryRows.length}`).format.autofitRows();

const mismatch = wb.worksheets.add('Doküman Uyumsuzlukları');
mismatch.showGridLines = false;
mismatch.getRange(`A1:B${mismatchRows.length + 2}`).values = [['Konu', 'Sorun'], ...mismatchRows];
mismatch.getRange('A1:B1').format = {fill:'#1F4E78',font:{bold:true,color:'#FFFFFF'}};
mismatch.getRange(`A1:B${mismatchRows.length + 1}`).format.wrapText = true;
mismatch.getRange('A:A').format.columnWidth = 30;
mismatch.getRange('B:B').format.columnWidth = 100;
mismatch.getRange(`A1:B${mismatchRows.length + 1}`).format.autofitRows();
mismatch.freezePanes.freezeRows(1);

await fs.mkdir('D:/SubscriptTrack/outputs/feature-inventory', {recursive:true});
const out = await SpreadsheetFile.exportXlsx(wb);
await out.save(output);
console.log(JSON.stringify({features:featureRows.length,mismatches:mismatchRows.length,output}));
const err = await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:100},summary:'formula error scan'});
console.log(err.ndjson);
const preview = await wb.render({sheetName:'Özellik Envanteri',range:'A1:E18',scale:1,format:'png'});
await fs.writeFile('D:/SubscriptTrack/outputs/feature-inventory/ozellik_envanteri_onizleme.png', new Uint8Array(await preview.arrayBuffer()));
