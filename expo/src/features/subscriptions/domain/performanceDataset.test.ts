import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseSubscriptionCsv } from './csvImportParser';
it('provides two valid 500-row batches with distinct names for native capacity acceptance', () => {
  const batches = [1, 2].map((batch) => parseSubscriptionCsv(readFileSync(resolve(__dirname, `../../../../../testdata/expo59/performance-${batch}-500.csv`), 'utf8')));
  for (const batch of batches) { expect(batch.errors).toEqual([]); expect(batch.rows).toHaveLength(500); }
  expect(new Set(batches.flatMap((batch) => batch.rows.map((row) => row.name))).size).toBe(1000);
  // Parsing is fixture validation, not native performance evidence.
});
