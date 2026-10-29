const path = require('node:path');
const { spawn } = require('node:child_process');

// Account-backed Expo tunnel; this still requires this computer to stay online.
// Restarting may allocate a new public URL. Do not promise a permanent hostname.
const cli = path.join(path.dirname(require.resolve('expo/package.json')), 'bin', 'cli');
const child = spawn(process.execPath, [cli, 'start', '--go', '--tunnel', '--port', '8082', '--max-workers', '2'], {
  cwd: path.resolve(__dirname, '..'),
  // Keep Metro in development mode so edits are watched and Expo Go can reload them.
  env: { ...process.env, EXPO_UNSTABLE_TUNNEL_V2: '1' },
  stdio: 'inherit',
});
child.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
child.on('exit', (code) => { process.exitCode = code ?? 1; });
