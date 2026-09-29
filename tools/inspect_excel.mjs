import fs from 'node:fs/promises';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const path = process.argv[2];
const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(path));
console.log((await wb.inspect({kind:'workbook,sheet,table',maxChars:12000,tableMaxRows:8,tableMaxCols:12})).ndjson);
const sheets = wb.worksheets.items;
for (const s of sheets) {
  const used = s.getUsedRange();
  console.log(`SHEET ${s.name} ${used?.address ?? ''}`);
  console.log((await wb.inspect({kind:'table',sheetId:s.name,range:used?.address ?? 'A1:L20',include:'values,formulas',tableMaxRows:12,tableMaxCols:12,maxChars:12000})).ndjson);
  const img=await wb.render({sheetName:s.name,autoCrop:'all',scale:1,format:'png'});
  await fs.writeFile(`D:/SubscriptTrack/outputs/${s.name.replace(/[^a-z0-9]/gi,'_')}.png`, new Uint8Array(await img.arrayBuffer()));
}
