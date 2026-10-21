import { expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { practice, questions } from '@mathstudy/content';
import { questionSchema, visualSchema } from '@mathstudy/contracts';
import { gradeAnswers } from '@mathstudy/math-core';
import { app } from '../apps/web/worker';
import { acceptLearningEvent } from '../apps/web/worker/learning-repository';
import { loadCourseContent } from '../apps/web/worker/content-repository';

it('keeps source provenance private without deploying the 70 original captures', () => {
  expect(practice.papers).toHaveLength(18);
  const files = practice.papers.flatMap((p) => p.pages.map((page) => page.sourceFile));
  expect(files).toHaveLength(70);
  expect(new Set(files).size).toBe(70);
  expect(files).toEqual([...files].sort());
  expect(practice.papers.map((p) => p.capturedAt)).toEqual(
    practice.papers.map((p) => p.capturedAt).sort(),
  );
  for (const p of practice.papers) {
    expect(p.questionIds.length).toBeGreaterThan(0);
    for (const page of p.pages) expect(existsSync(`apps/web/public${page.image}`)).toBe(false);
    if (p.duplicateOf)
      expect(p.questionIds).toEqual(
        practice.papers.find((s) => s.id === p.duplicateOf)!.questionIds,
      );
  }
});
it('validates every imported question and keeps each source within its original set', () => {
  const imported = questions.filter((q) => q.sources?.length);
  expect(imported).toHaveLength(701);
  for (const q of imported) {
    expect(questionSchema.safeParse(q).success, q.id).toBe(true);
    expect(
      q.topicIds!.every((id) => practice.topics.some((t) => t.id === id && t.unitId === q.unitId)),
      q.id,
    ).toBe(true);
    for (const source of q.sources!)
      expect(
        practice.papers.find((p) => p.id === source.paperId)!.pages.length,
      ).toBeGreaterThanOrEqual(source.page);
    if (q.hasVisual) expect(visualSchema.safeParse(q.explanation.visual).success, q.id).toBe(true);
  }
  expect(new Set(imported.map((q) => q.type))).toEqual(
    new Set(['fill', 'calculation', 'application', 'choice', 'judgement', 'drawing']),
  );
});
it('orders original section and question numbers rather than Chinese dictionary order', () => {
  const paper = practice.papers.find((p) => p.id === 'P01')!;
  const refs = paper.questionIds.map(
    (id) => questions.find((q) => q.id === id)!.sources!.find((s) => s.paperId === 'P01')!,
  );
  expect(refs.slice(0, 5).map((s) => s.number)).toEqual([
    '一1',
    '一2',
    '一3',
    '一4（1）',
    '一4（2）',
  ]);
  expect(refs.findIndex((s) => s.number === '五1')).toBeGreaterThan(
    refs.findIndex((s) => s.number === '二4'),
  );
});
it('accepts different correct rectangles and rejects wrong shape, area, disconnected cells, and erased givens', () => {
  const encode = (cells: number[]) =>
    Array.from({ length: 60 }, (_, i) => (cells.includes(i) ? '1' : '0')).join('');
  const q = questions.find((q) => q.id === 'p15-draw')!;
  const rectangle = Array.from({ length: 18 }, (_, i) => 10 * (Math.floor(i / 9) + 1) + (i % 9));
  expect(gradeAnswers(q, { cells: encode(rectangle) })).toBe(true);
  expect(gradeAnswers(q, { cells: encode(Array.from({ length: 18 }, (_, i) => i)) })).toBe(false);
  expect(gradeAnswers(q, { cells: encode(rectangle.slice(1)) })).toBe(false);
  expect(gradeAnswers(q, { cells: '<script>' })).toBe(false);
  const free = questions.find((q) => q.id === 'p18-draw')!;
  expect(gradeAnswers(free, free.expected)).toBe(true);
  expect(gradeAnswers(free, { cells: encode(Array.from({ length: 14 }, (_, i) => i + 20)) })).toBe(
    false,
  );
});
it('uses the same flexible drawing grader in the live check API and D1 sync acceptance', async () => {
  const cells = Array.from({ length: 60 }, (_, i) =>
    Math.floor(i / 10) >= 2 && Math.floor(i / 10) < 4 && i % 10 < 9 ? '1' : '0',
  ).join('');
  const response = await app.request('/api/v1/questions/p15-draw/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers: { cells } }),
  });
  expect((await response.json()).data.correct).toBe(true);
  const event = acceptLearningEvent(
    {
      id: crypto.randomUUID(),
      kind: 'attempt',
      entityId: 'p15-draw',
      answers: { cells },
      assisted: false,
      occurredAt: new Date().toISOString(),
    },
    await loadCourseContent(),
  );
  expect(event.correct).toBe(true);
  expect(event.verified).toBe(true);
});
it('serves classified topics without source papers or private answer data', async () => {
  const catalog = await (await app.request('/api/v1/practice')).json();
  expect(catalog.data.papers).toEqual([]);
  expect((await app.request('/api/v1/practice/papers/P18')).status).toBe(404);
  for (const path of ['/practice/topics/u1-restore', '/practice/topics/u2-cut']) {
    const r = await app.request(`/api/v1${path}`);
    const { data } = await r.json();
    expect(r.status).toBe(200);
    expect(data.items.length).toBeGreaterThan(0);
    expect(data.items.map((q: { id: string }) => q.id)).toEqual(data.set.questionIds);
    expect(JSON.stringify(data)).not.toContain('"expected"');
    expect(JSON.stringify(data)).not.toContain('"explanation"');
    expect(JSON.stringify(data)).not.toContain('"sources"');
  }
  expect((await app.request('/api/v1/practice/unknown/P18')).status).toBe(404);
});
it('checks the collected packing, shared-work and compensation problems independently', () => {
  const q = (title: string) => questions.find((q) => q.title === title)!;
  expect(Number(q('损坏一件，少收入多少').expected.value)).toBe((25 * 20 - 275) / (20 + 55));
  expect(Number(q('剪手帕，可以转方向').expected.value)).toBe(Math.floor((23 * 9) / (5 * 3)));
  expect(4 * 3 + 1).toBe(13); // 20×9 region plus one rotated 3×5 rectangle.
  expect(Number(q('人数改变，任务量不变').expected.value)).toBe((70 * 9) / (70 + 20));
  expect(q('重量相等，袋数不相等').expected).toEqual({ 面粉袋数: '18', 大米袋数: '12' });
  expect(18 * 20).toBe(12 * 30);
  expect(18 - 12).toBe(6);
});
