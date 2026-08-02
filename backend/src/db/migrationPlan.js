import { createHash } from 'crypto';

export function migrationId(fileName) {
  return fileName.replace(/\.sql$/i, '');
}

export function checksum(sql) {
  return createHash('sha256').update(sql, 'utf8').digest('hex');
}

export function isCanonicalMigration(fileName) {
  return /^\d+_.+\.sql$/.test(fileName) && fileName !== '002_mobile_ready.sql';
}
