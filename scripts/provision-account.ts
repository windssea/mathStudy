import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { builtInAccountSeed } from '../apps/web/worker/builtin-provision';

const password = process.env.MATHSTUDY_ACCOUNT_PASSWORD;
if (!password) throw new Error('Set MATHSTUDY_ACCOUNT_PASSWORD in the operator environment.');
const username = process.env.MATHSTUDY_ACCOUNT_USERNAME ?? 'admin';
const remote = process.argv.includes('--remote');
if (remote === process.argv.includes('--local'))
  throw new Error('Choose exactly one of --local and --remote.');
mkdirSync('tmp/d1', { recursive: true });
writeFileSync('tmp/d1/built-in-account.sql', await builtInAccountSeed(username, password), {
  mode: 0o600,
});
// The file contains only a salted password hash, never the password. Existing accounts are preserved.
const result = spawnSync(
  process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
  [
    '--filter',
    '@mathstudy/web',
    'exec',
    'wrangler',
    'd1',
    'execute',
    'mathstudy-prod-db',
    remote ? '--remote' : '--local',
    '--file',
    '../../tmp/d1/built-in-account.sql',
    '--yes',
  ],
  { stdio: 'inherit', shell: process.platform === 'win32' },
);
if (result.error || result.status !== 0) throw new Error('Built-in account provisioning failed.');
console.log('Built-in account configured; existing passwords and learning records were preserved.');
