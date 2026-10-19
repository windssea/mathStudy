import assert from 'node:assert/strict';
import { buildContentSeed } from './lib/d1-seed';
import { editionId, releaseId } from '@mathstudy/contracts';

const originIndex = process.argv.indexOf('--origin');
const origin = new URL(
  originIndex >= 0 ? process.argv[originIndex + 1] : 'https://mathstudy.windssea526.workers.dev',
);
if (
  !['https:', 'http:'].includes(origin.protocol) ||
  origin.username ||
  origin.password ||
  origin.search ||
  origin.hash
)
  throw new Error('Use a plain HTTP(S) origin without credentials');
async function api(path: string, init?: RequestInit) {
  const response = await fetch(new URL(`/api/v1${path}`, origin), {
    ...init,
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(response.status, 200, `${path}: expected 200, received ${response.status}`);
  return ((await response.json()) as { data: Record<string, unknown> }).data;
}
const health = await api('/health');
assert.equal(health.status, 'ok');
assert.equal(health.storage, 'd1');
assert.equal(health.releaseId, releaseId);
assert.equal(health.sourceHash, buildContentSeed().sourceHash);
assert.equal(health.accountSync, true);
const account = await api('/account');
assert.equal(account.available, true);
assert.equal(account.user, null);
const privateRecords = await fetch(new URL('/api/v1/me/progress', origin), {
  signal: AbortSignal.timeout(15000),
});
assert.equal(privateRecords.status, 401);
const home = await api('/home');
assert.equal(home.availableLessons, 17);
assert.equal(home.questionCount, 69);
const lesson = await api(`/textbooks/${editionId}/lessons/U02-L05`);
assert.equal((lesson.lesson as { id: string }).id, 'U02-L05');
assert.equal((lesson.questions as unknown[]).length, 3);
assert.ok(!JSON.stringify(lesson).includes('"expected"'));
for (const id of ['U03-L01', 'U03-L02', 'U03-L03', 'U03-L04']) {
  const third = await api(`/textbooks/${editionId}/lessons/${id}`);
  assert.equal((third.lesson as { id: string }).id, id);
  assert.equal((third.questions as unknown[]).length, 3);
  assert.ok(!JSON.stringify(third).includes('"expected"'));
}
const thirdBank = await api('/questions?unit=U03');
assert.equal(thirdBank.total, 9);
const thirdGrade = await api('/questions/u3-07/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: origin.origin },
  body: JSON.stringify({ answers: { value: '80' } }),
});
assert.equal(thirdGrade.correct, true);
const registration = await fetch(new URL('/api/auth/sign-up/email', origin), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: origin.origin },
  body: '{}',
  signal: AbortSignal.timeout(15000),
});
assert.equal(registration.status, 403);
const bank = await api('/questions?unit=U02');
assert.equal(bank.total, 18);
const grade = await api('/questions/u2-08/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: origin.origin },
  body: JSON.stringify({ answers: { value: '132' } }),
});
assert.equal(grade.correct, true);
const deepLink = await fetch(new URL(`/books/${editionId}/lessons/U02-L05`, origin), {
  signal: AbortSignal.timeout(15000),
});
assert.equal(deepLink.status, 200);
assert.ok(deepLink.headers.get('content-type')?.includes('text/html'));
assert.ok((await deepLink.text()).includes('id="root"'));
console.log(
  `Smoke checks passed: ${origin.origin} (D1, current content hash, units two/three, bank grading, registration closed, SPA deep link)`,
);
