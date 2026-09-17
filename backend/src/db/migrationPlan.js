import { createHash } from 'node:crypto';

const retiredMigrations = new Set(['002_mobile_ready.sql']);

export function isCanonicalMigration(fileName) {
  return fileName.endsWith('.sql') && !retiredMigrations.has(fileName);
}

export function migrationId(fileName) {
  return fileName.endsWith('.sql') ? fileName.slice(0, -4) : fileName;
}

export function checksum(sql) {
  return createHash('sha256').update(sql, 'utf8').digest('hex');
}
