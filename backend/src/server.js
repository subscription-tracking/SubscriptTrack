import './config/env.js';
import app from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('Database connection OK');

    app.listen(env.port, () => {
      console.log(`SubscriptTrack API running on port ${env.port} [${env.nodeEnv}]`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
