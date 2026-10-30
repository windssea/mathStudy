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
  assert.equal((third.questions as unknown[]).length, id === 'U03-L04' ? 3 : 5);
  assert.ok(!JSON.stringify(third).includes('"expected"'));
}
const thirdBank = await api('/questions?unit=U03');
assert.equal(thirdBank.total, 42);
for (const id of ['U04-L01', 'U04-L02', 'U04-L03']) {
  const fourth = await api(`/textbooks/${editionId}/lessons/${id}`);
  assert.equal((fourth.lesson as { id: string }).id, id);
  assert.equal((fourth.questions as unknown[]).length, 3);
  assert.ok(!JSON.stringify(fourth).includes('"expected"'));
}
assert.equal((await api('/questions?unit=U04')).total, 37);
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
for (const [id, answers] of [
  ['equal-addends', { value: '1' }],
  ['two-divisions', { people: '4', groups: '3' }],
  ['price-reading', { value: '2' }],
  ['price-inverse', { price: '8', count: '3' }],
  ['speed-reading', { value: '0' }],
  ['speed-inverse', { speed: '70', time: '8' }],
] as const) {
  const result = await api(`/questions/concept-u3-${id}/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin.origin },
    body: JSON.stringify({ answers }),
  });
  assert.equal(result.correct, true, `concept-u3-${id}`);
}
for (let index = 1; index <= 7; index++) {
  const id = `U05-L0${index}`,
    fifth = await api(`/textbooks/${editionId}/lessons/${id}`);
  assert.equal((fifth.lesson as { id: string }).id, id);
  assert.equal((fifth.questions as unknown[]).length, 3);
  assert.ok(!JSON.stringify(fifth).includes('"expected"'));
}
assert.equal((await api('/questions?unit=U05')).total, 45);
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
for (const route of ['sign-up/email', 'sign-in/email']) {
  const closedAuth = await fetch(new URL(`/api/auth/${route}`, origin), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin.origin },
    body: '{}',
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(closedAuth.status, 403, route);
  assert.equal(((await closedAuth.json()) as { code: string }).code, 'REGISTRATION_CLOSED');
  // Rejections must leave the connection usable for the next ordinary request.
  assert.equal((await api('/health')).status, 'ok');
}
const bank = await api('/questions?unit=U02');
assert.equal(bank.total, 209);
const grade = await api('/questions/u2-08/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: origin.origin },
  body: JSON.stringify({ answers: { value: '132' } }),
});
assert.equal(grade.correct, true);
const catalog = await api('/practice');
assert.equal((catalog.papers as unknown[]).length, 0);
assert.equal((catalog.topics as unknown[]).length, 42);
for (const id of [
  'u1-mental',
  'u1-restore',
  'u2-grid',
  'u2-cut',
  'u3-compare',
  'u4-brackets',
  'u5-rounding',
]) {
  const pack = await api(`/practice/topics/${id}`);
  assert.equal(
    (pack.items as unknown[]).length,
    practice.topics.find((p) => p.id === id)!.questionIds.length,
  );
  assert.ok(!JSON.stringify(pack).includes('"expected"'));
  assert.ok(!JSON.stringify(pack).includes('"explanation"'));
  assert.ok(!JSON.stringify(pack).includes('"sources"'));
}
for (const [id, answers] of [
  ['bank-u3-compare-04', { a1: '84', a2: '2', a3: '2' }],
  ['bank-u4-budget-05', { a1: '780', a2: '2', a3: '1' }],
  ['bank-u5-rounding-04', { a1: '1950000', a2: '1954999' }],
] as const) {
  const result = await api(`/questions/${id}/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin.origin },
    body: JSON.stringify({ answers }),
  });
  assert.equal(result.correct, true, id);
  const image = await fetch(new URL(`/figures/${id}-step1.svg`, origin), {
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(image.status, 200);
  assert.match(image.headers.get('content-type') ?? '', /image\/svg\+xml/);
  assert.doesNotMatch(await image.text(), /<image|data:image|<script/);
}
for (const [value, correct] of [
  ['0202706008', false],
  ['202706008', true],
] as const) {
  const result = await api('/questions/bank-u5-codes-02/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin.origin },
    body: JSON.stringify({ answers: { a1: value } }),
  });
  assert.equal(result.correct, correct, 'Fixed-length library code');
}
const pageImage = await fetch(new URL('/papers/P01/1.webp', origin), {
  signal: AbortSignal.timeout(15000),
});
assert.equal(pageImage.status, 404);
await pageImage.arrayBuffer();
const retiredPaper = await fetch(new URL('/api/v1/practice/papers/P15', origin), {
  signal: AbortSignal.timeout(15000),
});
assert.equal(retiredPaper.status, 404);
await retiredPaper.arrayBuffer();
const redrawn = await api('/questions/full-p15-s1-q2');
const redrawnQuestion = (redrawn.items as { promptImage: { src: string }; sources?: unknown }[])[0];
assert.equal(redrawnQuestion.sources, undefined);
assert.equal(redrawnQuestion.promptImage.src, '/figures/full-p15-s1-q2.svg');
const vector = await fetch(new URL(redrawnQuestion.promptImage.src, origin), {
  signal: AbortSignal.timeout(15000),
});
assert.equal(vector.status, 200);
assert.match(vector.headers.get('content-type') ?? '', /image\/svg\+xml/);
assert.doesNotMatch(await vector.text(), /<image|data:image|<script/);
const history = await api('/questions?scope=history');
assert.equal(history.total, 890);
assert.ok((history.items as { id: string }[]).some((q) => q.id === 'p15-draw'));
const deepLink = await fetch(new URL(`/books/${editionId}/lessons/U05-L05`, origin), {
  signal: AbortSignal.timeout(15000),
});
assert.equal(deepLink.status, 200);
assert.ok(deepLink.headers.get('content-type')?.includes('text/html'));
assert.ok((await deepLink.text()).includes('id="root"'));
console.log(
  `Smoke checks passed: ${origin.origin} (D1, current content hash, 42 topics, classified question bank, original scans unavailable, grading, registration closed, SPA deep link)`,
);
