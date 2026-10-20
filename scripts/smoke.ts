import assert from 'node:assert/strict';
import { buildContentSeed } from './lib/d1-seed';
import { questions, practice } from '@mathstudy/content';
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
await privateRecords.arrayBuffer();
const home = await api('/home');
assert.equal(home.availableLessons, 27);
assert.equal(home.questionCount, questions.length);
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
assert.equal(thirdBank.total, 12);
for (const id of ['U04-L01', 'U04-L02', 'U04-L03']) {
  const fourth = await api(`/textbooks/${editionId}/lessons/${id}`);
  assert.equal((fourth.lesson as { id: string }).id, id);
  assert.equal((fourth.questions as unknown[]).length, 3);
  assert.ok(!JSON.stringify(fourth).includes('"expected"'));
}
assert.equal((await api('/questions?unit=U04')).total, 12);
for (const [questionId, value] of [
  ['u4-03', '7'],
  ['u4-07', '6'],
]) {
  const result = await api(`/questions/${questionId}/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin.origin },
    body: JSON.stringify({ answers: { value } }),
  });
  assert.equal(result.correct, true);
}
const thirdGrade = await api('/questions/u3-07/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: origin.origin },
  body: JSON.stringify({ answers: { value: '80' } }),
});
assert.equal(thirdGrade.correct, true);
for (let index = 1; index <= 7; index++) {
  const id = `U05-L0${index}`,
    fifth = await api(`/textbooks/${editionId}/lessons/${id}`);
  assert.equal((fifth.lesson as { id: string }).id, id);
  assert.equal((fifth.questions as unknown[]).length, 3);
  assert.ok(!JSON.stringify(fifth).includes('"expected"'));
}
assert.equal((await api('/questions?unit=U05')).total, 21);
for (const [questionId, value] of [
  ['u5-07', '355000'],
  ['u5-08', '364999'],
  ['u5-13', '20022000'],
  ['u5-16', '30'],
]) {
  assert.equal(
    (
      await api(`/questions/${questionId}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: origin.origin },
        body: JSON.stringify({ answers: { value } }),
      })
    ).correct,
    true,
  );
}
const registration = await fetch(new URL('/api/auth/sign-up/email', origin), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: origin.origin },
  body: '{}',
  signal: AbortSignal.timeout(15000),
});
assert.equal(registration.status, 403);
await registration.arrayBuffer();
const bank = await api('/questions?unit=U02');
assert.equal(bank.total, 67);
const grade = await api('/questions/u2-08/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: origin.origin },
  body: JSON.stringify({ answers: { value: '132' } }),
});
assert.equal(grade.correct, true);
const catalog = await api('/practice');
assert.equal((catalog.papers as unknown[]).length, 18);
assert.equal((catalog.topics as unknown[]).length, 20);
for (const id of ['P01', 'P07', 'P18']) {
  const pack = await api(`/practice/papers/${id}`);
  assert.equal(
    (pack.items as unknown[]).length,
    practice.papers.find((p) => p.id === id)!.questionIds.length,
  );
  assert.ok(!JSON.stringify(pack).includes('"expected"'));
  assert.ok(!JSON.stringify(pack).includes('"explanation"'));
}
const pageImage = await fetch(new URL('/papers/P01/1.webp', origin), {
  signal: AbortSignal.timeout(15000),
});
assert.equal(pageImage.status, 200);
assert.match(pageImage.headers.get('content-type') ?? '', /image\/webp/);
await pageImage.arrayBuffer();
const deepLink = await fetch(new URL(`/books/${editionId}/lessons/U05-L05`, origin), {
  signal: AbortSignal.timeout(15000),
});
assert.equal(deepLink.status, 200);
assert.ok(deepLink.headers.get('content-type')?.includes('text/html'));
assert.ok((await deepLink.text()).includes('id="root"'));
console.log(
  `Smoke checks passed: ${origin.origin} (D1, current content hash, units two to five, 27 lessons, 232 questions, bank grading, registration closed, SPA deep link)`,
);
