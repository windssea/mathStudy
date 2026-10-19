import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { editionId, type LearningEvent, type SyncResult } from '@mathstudy/contracts';

const index = process.argv.indexOf('--origin');
const origin = new URL(index < 0 ? 'http://127.0.0.1:5188' : process.argv[index + 1]);
assert.ok(
  [
    'http://127.0.0.1:5188',
    'http://127.0.0.1:4173',
    'https://mathstudy.windssea526.workers.dev',
  ].includes(origin.origin),
);
const email = `sync-qa-${Date.now()}-${randomBytes(3).toString('hex')}@example.invalid`;
const password = randomBytes(24).toString('base64url');
const stamp = Date.now();
const device = () => {
  const cookies = new Map<string, string>();
  let id = '';
  return {
    async call(path: string, body?: unknown) {
      const headers = new Headers({
        Origin: origin.origin,
        'Content-Type': 'application/json',
        Cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join('; '),
      });
      if (id) headers.set('X-MathStudy-Account', id);
      const response = await fetch(new URL(path, origin), {
        method: body === undefined ? 'GET' : 'POST',
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
      });
      for (const cookie of response.headers.getSetCookie()) {
        const [pair] = cookie.split(';');
        const split = pair.indexOf('=');
        cookies.set(pair.slice(0, split), pair.slice(split + 1));
        if (pair.slice(split + 1)) {
          assert.match(cookie, /httponly/i);
          assert.match(cookie, /samesite=lax/i);
          if (origin.protocol === 'https:') assert.match(cookie, /secure/i);
        }
      }
      return response;
    },
    async login(register = false) {
      const response = await this.call(`/api/auth/${register ? 'sign-up' : 'sign-in'}/email`, {
        email,
        password,
        ...(register ? { name: '同步验收' } : {}),
      });
      assert.equal(response.status, 200, 'Authentication failed');
      id = (await response.json()).user.id as string;
    },
    async sync(events: LearningEvent[] = []) {
      const response = await this.call('/api/v1/me/sync', { editionId, events });
      assert.equal(response.status, 200, 'Sync failed');
      return (await response.json()).data as SyncResult;
    },
  };
};
function completion(id: string, offset: number): LearningEvent {
  return {
    id: crypto.randomUUID(),
    kind: 'complete',
    entityId: id,
    occurredAt: new Date(stamp + offset).toISOString(),
  };
}
function attempt(value: string, offset: number): LearningEvent {
  return {
    id: crypto.randomUUID(),
    kind: 'attempt',
    entityId: 'u2-08',
    answers: { value },
    assisted: false,
    occurredAt: new Date(stamp + offset).toISOString(),
  };
}
const a = device(),
  b = device();
await a.login(true);
await b.login();
const wrong = attempt('0', 10),
  right = attempt('132', 20);
await a.sync([completion('U02-L02', 1), wrong]);
let result = await b.sync();
assert.ok(result.snapshot.completed.includes('U02-L02'));
assert.equal(result.snapshot.answers['u2-08'].needsReview, true);
await b.sync([completion('U02-L05', 2), right]);
result = await a.sync([wrong, right]);
assert.deepEqual(new Set(result.snapshot.completed), new Set(['U02-L02', 'U02-L05']));
assert.equal(result.snapshot.answers['u2-08'].attemptCount, 2);
assert.equal(result.snapshot.answers['u2-08'].needsReview, false);
assert.equal(result.snapshot.answers['u2-08'].everWrong, true);
assert.equal(result.snapshot.history[0].source, 'verified');
assert.equal((await a.call('/api/auth/sign-out', {})).status, 200);
assert.equal((await a.call('/api/v1/me/progress')).status, 401);
assert.equal((await b.call('/api/v1/me/progress')).status, 200);
assert.equal((await b.call('/api/auth/sign-out', {})).status, 200);
if (process.argv.includes('--save-fixture')) {
  mkdirSync('tmp', { recursive: true });
  writeFileSync('tmp/qa-sync.json', JSON.stringify({ origin: origin.origin, email, password }), {
    mode: 0o600,
  });
  console.log('Browser QA fixture saved in ignored tmp/qa-sync.json; credentials are not logged.');
}
console.log(
  `Account sync smoke passed: ${origin.origin} (real D1, two sessions, completions, wrong answers, corrections, idempotency, logout)`,
);
