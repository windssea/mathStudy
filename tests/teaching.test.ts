import { expect, it } from 'vitest';
import { practice, questions, textbook } from '@mathstudy/content';
import { topicGuideSchema, unitTeachingSchema } from '@mathstudy/contracts';
import { calculationFrames } from '@mathstudy/animation-engine';
import { gradeAnswers } from '@mathstudy/math-core';
import { app } from '../apps/web/worker';
import { testDatabase } from './helpers/d1';
import { loadCourseContent } from '../apps/web/worker/content-repository';

it('covers every unit and every active question category with a complete teaching method', () => {
  expect(practice.units.map((u) => u.unitId)).toEqual(
    textbook.catalog.filter((n) => n.kind === 'unit').map((n) => n.id),
  );
  expect(practice.topics).toHaveLength(42);
  for (const unit of practice.units) {
    expect(unitTeachingSchema.safeParse(unit).success, unit.unitId).toBe(true);
    expect(practice.topics.filter((t) => t.unitId === unit.unitId).length).toBeGreaterThanOrEqual(
      5,
    );
  }
  const all = new Set(practice.topics.map((t) => t.id));
  for (const topic of practice.topics) {
    expect(topicGuideSchema.safeParse(topic.guide).success, topic.id).toBe(true);
    expect(topic.questionIds.length, topic.id).toBeGreaterThan(0);
    for (const id of topic.questionIds)
      expect(questions.find((q) => q.id === id)?.topicIds).toContain(topic.id);
  }
  for (const q of questions)
    for (const id of q.topicIds ?? []) expect(all.has(id), `${q.id}: ${id}`).toBe(true);
});

it('independently recomputes all worked-example calculations rather than trusting the printed result', () => {
  for (const topic of practice.topics)
    for (const check of topic.guide!.example.checks) {
      const root = calculationFrames(check.expression).at(-1)!.root;
      expect(root, `${topic.id}: ${check.expression}`).toMatchObject({
        kind: 'number',
        value: check.result,
      });
    }
});

it('keeps oral, written, mixed-operation and unit-conversion questions in distinct teaching categories', () => {
  const topic = (id: string) => practice.topics.find((t) => t.id === id)!;
  expect(topic('u1-mental').questionIds).toContain('full-p04-s1-q1-1');
  expect(topic('u1-written').questionIds).toContain('full-p04-s1-q2-1');
  expect(topic('u1-order').questionIds).toContain('full-p04-s1-q1-9');
  expect(topic('u1-units').questionIds).toContain('full-p04-s2-q1');
  expect(topic('u1-mental').questionIds).not.toContain('full-p04-s1-q2-1');
  expect(practice.topics.some((t) => t.id === 'u1-calculation' || t.id === 'u6-general')).toBe(
    false,
  );
});

it('checks each new sixth-unit answer, including counterexamples and calculator verification', () => {
  const expected = [
    214 * 23,
    302 * 17,
    125 * 48,
    208 * 40,
    360 * 50,
    0,
    1,
    1,
    15 * 11,
    123 * 36,
    (48 * 30) / (24 * 15),
    0,
    304 * 21 - (304 + 304 * 2),
    125 * (42 - 24),
  ];
  expect(questions.filter((q) => q.id.startsWith('teach-u6-'))).toHaveLength(expected.length);
  for (const [index, answer] of expected.entries()) {
    const q = questions.find((q) => q.id === `teach-u6-${String(index + 1).padStart(2, '0')}`)!;
    expect(gradeAnswers(q, { value: String(answer) }), q.id).toBe(true);
    expect(gradeAnswers(q, { value: String(answer + 1) }), q.id).toBe(false);
  }
  expect(0 * 3).toBe(0 * 5);
  expect(306 * 20 + 306 * 4).toBe(7344);
  expect(498 * 21).toBe(10458);
});

it('keeps retired topic links, lesson practice and question details connected to public teaching methods', async () => {
  for (const id of ['u1-calculation', 'u3-general', 'u4-general', 'u5-general', 'u6-general']) {
    const response = await app.request(`/api/v1/practice/topics/${id}`);
    const { data } = await response.json();
    expect(response.status, id).toBe(200);
    expect(data.items.length, id).toBeGreaterThan(0);
    expect(
      data.topics.every((t: { guide?: unknown }) => !!t.guide),
      id,
    ).toBe(true);
    expect(JSON.stringify(data)).not.toContain('"expected"');
    expect(JSON.stringify(data)).not.toContain('"explanation"');
  }
  for (const path of ['/questions/u6-01', '/textbooks/sj-math-g4-upper-2026-v1/lessons/U01-L01']) {
    const { data } = await (await app.request(`/api/v1${path}`)).json();
    expect(data.topics.length, path).toBeGreaterThan(0);
  }
});

it('persists unit roadmaps and complete method cards in the same D1 content release', async () => {
  const db = testDatabase();
  try {
    const content = await loadCourseContent(db.db);
    expect(content.practice.units).toEqual(practice.units);
    expect(content.practice.topics).toEqual(practice.topics);
    expect(content.questions.find((q) => q.id === 'u6-01')?.expected).toEqual({ value: '2048' });
  } finally {
    db.close();
  }
});
