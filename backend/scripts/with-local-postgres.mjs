import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';

// Disposable loopback-only cluster. Never connects to a supplied remote database.
const root = mkdtempSync(join(tmpdir(), 'subscripttrack-pg-'));
const data = join(root, 'data');
const bin = process.env.LOCAL_PG_BIN ?? (process.platform === 'win32' ? 'C:/Program Files/PostgreSQL/17/bin' : '');
const executable = (name) => bin ? join(bin, name + (process.platform === 'win32' ? '.exe' : '')) : name;
const run = (name, args, options = {}) => {
  const result = spawnSync(executable(name), args, { encoding: 'utf8', windowsHide: true, ...options });
  if (result.status !== 0) throw new Error(`${name}: ${result.error?.message ?? result.stderr ?? result.stdout}`);
  return result;
};
const port = await new Promise((accept, reject) => {
  const server = createServer();
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close(() => accept(port)); });
});
let started = false;
try {
  mkdirSync(data);
  run('initdb', ['-D', data, '-U', 'expo_audit', '--auth-local=trust', '--auth-host=trust', '--encoding=UTF8', '--locale=C']);
  run('pg_ctl', ['-D', data, '-l', join(root, 'server.log'), '-o', `-h 127.0.0.1 -p ${port} -k "${root.replaceAll('\\', '/')}"`, '-w', 'start'], { stdio: 'ignore' });
  started = true;
  console.log('PASS disposable PostgreSQL started on loopback');
  const script = process.argv[2] ?? 'isolated-postgres-acceptance.mjs';
  if (!['isolated-postgres-acceptance.mjs', 'clean-schema-acceptance.mjs'].includes(script)) throw new Error('Unknown local acceptance script');
  const child = spawnSync(process.execPath, [fileURLToPath(new URL(script, import.meta.url))], {
    stdio: 'inherit', windowsHide: true,
    env: { ...process.env, LOCAL_PSQL: executable('psql'), LOCAL_PG_PORT: String(port), LOCAL_PG_USER: 'expo_audit', PGPASSWORD: '', PGCONNECT_TIMEOUT: '5' },
  });
  if (child.error) throw child.error;
  process.exitCode = child.status ?? 1;
} finally {
  let stopped = !started;
  if (started) {
    const result = spawnSync(executable('pg_ctl'), ['-D', data, '-m', 'fast', '-w', 'stop'], { encoding: 'utf8', windowsHide: true });
    stopped = result.status === 0;
    if (!stopped) { console.error('PostgreSQL stop failed; preserved temporary cluster for inspection'); process.exitCode = 1; }
  }
  if (stopped && dirname(resolve(root)) === resolve(tmpdir()) && basename(root).startsWith('subscripttrack-pg-')) rmSync(root, { recursive: true, force: true });
}
