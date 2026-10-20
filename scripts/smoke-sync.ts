import assert from 'node:assert/strict';
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
const username = process.env.MATHSTUDY_ACCOUNT_USERNAME ?? 'admin',
  password = process.env.MATHSTUDY_ACCOUNT_PASSWORD;
assert.ok(password, 'Set MATHSTUDY_ACCOUNT_PASSWORD in the operator environment.');
const write = process.argv.includes('--write');
const unitIndex = process.argv.indexOf('--unit');
const unit = unitIndex < 0 ? 'U03' : process.argv[unitIndex + 1];
assert.ok(
  ['U03', 'U04', 'U05', 'practice'].includes(unit),
  'Use --unit U03, U04, U05 or practice.',
);
const questionId =
  unit === 'practice' ? 'p15-draw' : unit === 'U05' ? 'u5-07' : unit === 'U04' ? 'u4-07' : 'u3-07';
const correctValue =
  unit === 'practice'
    ? Array.from({ length: 60 }, (_, i) =>
        Math.floor(i / 10) >= 2 && Math.floor(i / 10) < 4 && i % 10 < 9 ? '1' : '0',
      ).join('')
    : unit === 'U05'
      ? '355000'
      : unit === 'U04'
        ? '6'
        : '80';
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
        const [pair] = cookie.split(';'),
          split = pair.indexOf('=');
        cookies.set(pair.slice(0, split), pair.slice(split + 1));
        if (pair.slice(split + 1)) {
          assert.match(cookie, /httponly/i);
          assert.match(cookie, /samesite=lax/i);
          if (origin.protocol === 'https:') assert.match(cookie, /secure/i);
        }
      }
      return response;
    },
    async login() {
      const response = await this.call('/api/auth/sign-in/username', { username, password });
      assert.equal(response.status, 200, 'Built-in login failed');
      id = (await response.json()).user.id as string;
    },
    async sync(events: LearningEvent[] = []) {
      const response = await this.call('/api/v1/me/sync', { editionId, events });
      assert.equal(response.status, 200, 'Sync failed');
      return (await response.json()).data as SyncResult;
    },
  };
};
const a = device(),
  b = device();
assert.equal((await a.call('/api/auth/sign-up/email', {})).status, 403);
assert.equal((await a.call('/api/auth/sign-in/email', {})).status, 403);
await a.login();
await b.login();
const initial = await a.sync();
assert.deepEqual((await b.sync()).snapshot, initial.snapshot);
if (write) {
  const initialCount = initial.snapshot.answers[questionId]?.attemptCount ?? 0;
  const stamp = Date.now();
  const event = (value: string, offset: number): LearningEvent => ({
    id: crypto.randomUUID(),
    kind: 'attempt',
    entityId: questionId,
    answers: unit === 'practice' ? { cells: value } : { value },
    assisted: false,
    occurredAt: new Date(stamp + offset).toISOString(),
  });
  const wrong = event(unit === 'practice' ? '0'.repeat(60) : '0', 10),
    right = event(correctValue, 20);
  const complete = (entityId: string): LearningEvent => ({
    id: crypto.randomUUID(),
    kind: 'complete',
    entityId,
    occurredAt: new Date(stamp).toISOString(),
  });
  await a.sync(unit === 'practice' ? [wrong] : [complete(`${unit}-L02`), wrong]);
  assert.equal((await b.sync()).snapshot.answers[questionId].needsReview, true);
  await b.sync(unit === 'practice' ? [right] : [complete(`${unit}-L03`), right]);
  const result = await a.sync([wrong, right]);
  if (unit !== 'practice') {
    assert.ok(result.snapshot.completed.includes(`${unit}-L02`));
    assert.ok(result.snapshot.completed.includes(`${unit}-L03`));
  }
  assert.equal(result.snapshot.answers[questionId].attemptCount, initialCount + 2);
  assert.equal(result.snapshot.answers[questionId].needsReview, false);
}
assert.equal((await a.call('/api/auth/sign-out', {})).status, 200);
assert.equal((await a.call('/api/v1/me/progress')).status, 401);
assert.equal((await b.call('/api/v1/me/progress')).status, 200);
assert.equal((await b.call('/api/auth/sign-out', {})).status, 200);
console.log(
  `Built-in sync smoke passed: ${origin.origin} (registration closed, two sessions, ${write ? `${unit} writes/corrections/idempotency` : 'identical account snapshots'}, protected cookies, logout)`,
);
