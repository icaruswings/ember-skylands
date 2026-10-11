import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
for (const path of readdirSync('dist', { recursive: true }).filter(
  (path) => path.endsWith('.js') && !path.startsWith('assets/'),
)) {
  const result = spawnSync(process.execPath, ['--check', `dist/${path}`], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(1);
}
console.log('All application JavaScript syntax checks passed.');
