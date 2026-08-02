import './config/env.js';
import app from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('Database connection OK');

    const server = app.listen(env.port, () => {
      console.log(`SubscriptTrack API running on port ${env.port} [${env.nodeEnv}]`);
    });

    let shuttingDown = false;
    const shutdown = async (signal) => {
      if (shuttingDown) return;
      shuttingDown = true;
      console.log(JSON.stringify({ level: 'info', event: 'shutdown_started', signal }));
      server.close(async () => {
        await pool.end();
        console.log(JSON.stringify({ level: 'info', event: 'shutdown_completed', signal }));
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000).unref();
    };

    process.once('SIGTERM', () => { void shutdown('SIGTERM'); });
    process.once('SIGINT', () => { void shutdown('SIGINT'); });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
