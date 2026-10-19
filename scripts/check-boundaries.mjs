import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : /\.[cm]?[jt]sx?$/.test(path) ? [path] : [];
  });
}
const errors = [];
for (const path of files('apps/web/src')) {
  if (
    /from\s+['"][^'"]*(?:@mathstudy\/(?:content|database)|\/worker\/)/.test(
      readFileSync(path, 'utf8'),
    )
  )
    errors.push(`Server-only import in ${path}`);
}
for (const path of files('packages/math-core/src')) {
  if (/from\s+['"](?:react|hono|@cloudflare)/.test(readFileSync(path, 'utf8')))
    errors.push(`Infrastructure dependency in ${path}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else console.log('Package boundaries verified.');
