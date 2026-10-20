import { expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { practice, questions, publicQuestion } from '@mathstudy/content';
import { gradeAnswers } from '@mathstudy/math-core';
import { calculationFrames } from '@mathstudy/animation-engine';
import { app } from '../apps/web/worker';
import { acceptLearningEvent } from '../apps/web/worker/learning-repository';
import { loadCourseContent } from '../apps/web/worker/content-repository';
import coverage from '../content/practice/coverage.json';

const full = questions.filter((q) => q.id.startsWith('full-'));
const source = (paperId: string, number: string) =>
  full.find((q) => q.sources?.some((s) => s.paperId === paperId && s.number === number))!;
it('covers the independently transcribed inventory of every section and subquestion in all 18 papers', () => {
  expect(full).toHaveLength(565);
  expect(coverage).toHaveLength(18);
  expect(new Set(full.map((q) => q.id)).size).toBe(565);
  for (const inventory of coverage) {
    const p = practice.papers.find((p) => p.id === inventory.paperId)!;
    const refs = p.questionIds.map(
      (id) => questions.find((q) => q.id === id)!.sources!.find((s) => s.paperId === p.id)!.number,
    );
    expect([...refs].sort(), p.id).toEqual([...inventory.expectedNumbers].sort());
    expect(p.questionIds.every((id) => id.startsWith('full-'))).toBe(true);
    expect(
      p.questionIds
        .filter((id) => questions.find((q) => q.id === id)?.sourceIssue)
        .map(
          (id) =>
            questions.find((q) => q.id === id)!.sources!.find((s) => s.paperId === p.id)!.number,
        ),
    ).toEqual(inventory.unavailableNumbers);
  }
});
it('keeps old answer identities available while removing selected variants from the paper rounds', () => {
  const old = JSON.parse(readFileSync('content/practice/collected-questions.json', 'utf8')) as {
    id: string;
    expected: Record<string, string>;
  }[];
  for (const q of old) expect(questions.find((v) => v.id === q.id)!.expected).toEqual(q.expected);
  expect(practice.papers.find((p) => p.id === 'P03')!.questionIds).toEqual(
    practice.papers.find((p) => p.id === 'P02')!.questionIds,
  );
  expect(practice.papers.find((p) => p.id === 'P12')!.questionIds).toEqual(
    practice.papers.find((p) => p.id === 'P09')!.questionIds,
  );
});
it('has readable figures, every diagram asset, complete derivations, and private alternative-answer rules', () => {
  for (const q of full) {
    expect(q.explanation.steps.length, q.id).toBeGreaterThanOrEqual(2);
    if (q.promptImage) {
      expect(existsSync(`apps/web/public${q.promptImage.src}`), q.id).toBe(true);
      expect(q.hasVisual, q.id).toBe(true);
    }
    for (const stage of q.explanation.visual?.stages ?? [])
      if (stage.kind === 'image') {
        expect(existsSync(`apps/web/public${stage.image}`), q.id).toBe(true);
        expect(readFileSync(`apps/web/public${stage.image}`, 'utf8')).toContain('<svg');
      }
    expect(publicQuestion(q)).not.toHaveProperty('answerRules');
    expect(publicQuestion(q)).not.toHaveProperty('expected');
  }
});
it('independently verifies every newly transcribed calculation using multiplication or the TypeScript expression engine', () => {
  for (const q of full.filter((q) => q.type === 'calculation')) {
    const column = q.stem.match(/列竖式计算并验算：(\d+)÷(\d+)/);
    const values = q.fields.map((f) => Number(q.expected[f.key]));
    if (column) {
      const [a, b] = column.slice(1).map(Number);
      expect(b * values[0] + values[1], q.id).toBe(a);
      expect(values[1], q.id).toBeGreaterThanOrEqual(0);
      expect(values[1], q.id).toBeLessThan(b);
    } else {
      const expression = q.stem.match(/^计算：(.*)。$/)?.[1];
      if (expression) {
        const root = calculationFrames(expression).at(-1)!.root;
        expect(root.kind, q.id).toBe('number');
        if (root.kind === 'number') expect(values[0], q.id).toBe(root.value);
      }
    }
  }
});
it('accepts reordered complete sets and alternative valid choices, while rejecting repetitions and incomplete sets', () => {
  const q = source('P04', '二5');
  expect(gradeAnswers(q, { a1: '6、4、5' })).toBe(true);
  expect(gradeAnswers(q, { a1: '4、5' })).toBe(false);
  expect(gradeAnswers(q, { a1: '4、4、5、6' })).toBe(false);
  const hex = source('P10', '一10');
  for (const value of ['14', '16', '18']) expect(gradeAnswers(hex, { a1: value })).toBe(true);
  expect(gradeAnswers(hex, { a1: '20' })).toBe(false);
});
it('uses the actual given five-cell L in paper 18 and accepts different connected completions', () => {
  const q = source('P18', '23（2）');
  expect(q.construction!.given).toEqual([31, 41, 42, 43, 44]);
  const code = (cells: number[]) =>
    Array.from({ length: 60 }, (_, i) => (cells.includes(i) ? '1' : '0')).join('');
  // Choose a second valid shape: 3×4 cells plus two below, retaining every given.
  const other = Array.from(
    { length: 12 },
    (_, i) => (Math.floor(i / 4) + 2) * 10 + (i % 4) + 1,
  ).concat([51, 52]);
  expect(gradeAnswers(q, { cells: code(other) })).toBe(true);
  expect(gradeAnswers(q, q.expected)).toBe(true);
  expect(gradeAnswers(q, { cells: code(other.filter((i) => i !== 31)) })).toBe(false);
});
it('keeps explicit self-review assisted in sync even if a client claims independence', async () => {
  const q = source('P15', '四（1）');
  const event = acceptLearningEvent(
    {
      id: crypto.randomUUID(),
      kind: 'attempt',
      entityId: q.id,
      answers: q.expected,
      assisted: false,
      occurredAt: new Date().toISOString(),
    },
    await loadCourseContent(),
  );
  expect(event.correct).toBe(true);
  expect(event.kind).toBe('attempt');
  if (event.kind === 'attempt') expect(event.assisted).toBe(true);
  expect(q.explanation.steps.join('')).toContain('周长38');
  expect(q.explanation.steps.join('')).toContain('周长22');
  expect(q.explanation.steps.join('')).toContain('周长18');
});
it('does not invent numbers or award correctness when the supplied image has missing data', async () => {
  const missing = full.filter((q) => q.sourceIssue);
  expect(missing).toHaveLength(3);
  for (const q of missing) {
    expect(gradeAnswers(q, q.expected)).toBe(false);
    const response = await app.request(`/api/v1/questions/${q.id}/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: q.expected }),
    });
    expect(response.status).toBe(422);
    expect(() =>
      acceptLearningEvent(
        {
          id: crypto.randomUUID(),
          kind: 'attempt',
          entityId: q.id,
          answers: q.expected,
          assisted: false,
          occurredAt: new Date().toISOString(),
        },
        {
          questions,
          lessons: [],
          textbook: {} as never,
          practice,
          siteSettings: { defaultEditionId: '' },
          source: 'fixture',
        },
      ),
    ).toThrow('INVALID_ANSWER');
    expect(practice.topics.some((t) => t.questionIds.includes(q.id))).toBe(false);
  }
});
it('checks the original units and restores exact source details instead of adapting them silently', () => {
  expect(source('P08', '6').expected).toEqual({ a1: '20' }); // Original distance is 30m, not 300m.
  expect(source('P18', '31').expected).toEqual({ a1: '6' }); // Source asks cartons, not small packs.
  expect(source('P15', '一2').expected).toEqual({ a1: '6', a2: '7', a3: '8' });
  expect(source('P14', '一8').expected).toEqual({ a1: '3', a2: '5' }); // Source is 4□4, not 44□.
  expect(source('P18', '27').expected).toEqual({ a1: String(2 * (38 + 25) + 25) });
  expect(source('P18', '26').expected).toEqual({ a1: String((25 * 20 - 275) / (20 + 55)) });
});
