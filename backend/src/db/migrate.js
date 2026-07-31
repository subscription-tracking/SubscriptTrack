import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { pool } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const sql = readFileSync(
    path.join(__dirname, '../../migrations/001_initial_schema.sql'),
    'utf8',
  );

  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('Migration tamamlandı.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Migration hatası:', err.message);
  process.exit(1);
});
