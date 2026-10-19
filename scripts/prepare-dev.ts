import { existsSync, readFileSync, appendFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const path = 'apps/web/.dev.vars';
if (!existsSync(path) || !/^AUTH_SECRET\s*=/m.test(readFileSync(path, 'utf8'))) {
  appendFileSync(path, `\nAUTH_SECRET="${randomBytes(48).toString('base64url')}"\n`, {
    mode: 0o600,
  });
  console.log('Created local authentication secret in ignored apps/web/.dev.vars.');
}
