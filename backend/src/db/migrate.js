import 'dotenv/config';
import { readdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { pool } from '../config/db.js';
import { checksum, isCanonicalMigration, migrationId } from './migrationPlan.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const migrationsDir = path.join(__dirname, '../../migrations');
  const migrationFiles = readdirSync(migrationsDir)
    .filter(isCanonicalMigration)
    .sort();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(7312026)');
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        checksum TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    );

    for (const file of migrationFiles) {
      const id = migrationId(file);
      const sql = readFileSync(path.join(migrationsDir, file), 'utf8');
      const hash = checksum(sql);
      const { rows } = await client.query(
        'SELECT checksum FROM schema_migrations WHERE id = $1', [id],
      );
      if (rows[0]) {
        if (rows[0].checksum !== hash) {
          throw new Error(`Migration checksum mismatch: ${file}`);
        }
        console.log(`Migration already applied: ${file}`);
        continue;
      }
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (id, checksum) VALUES ($1, $2)',
        [id, hash],
      );
      console.log(`Migration completed: ${file}`);
    }
    await client.query('COMMIT');
    console.log('Migrations completed.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});
