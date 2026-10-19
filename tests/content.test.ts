import { describe, expect, it } from 'vitest';
import { textbook, lessons, questions, publicQuestion } from '@mathstudy/content';
import { lessonSchema, visualSchema } from '@mathstudy/contracts';

describe('textbook-driven content', () => {
  it('has the exact new-edition sequence and a continuous page map', () => {
    expect(textbook.catalog.map((n) => n.id)).toEqual([
      'U01',
      'U02',
      'A01',
      'U03',
      'U04',
      'A02',
      'U05',
      'A03',
      'U06',
      'A04',
      'R01',
    ]);
    expect(
      textbook.catalog.flatMap((n) =>
        Array.from(
          { length: n.printedRange[1] - n.printedRange[0] + 1 },
          (_, i) => i + n.printedRange[0],
        ),
      ),
    ).toEqual(Array.from({ length: 114 }, (_, i) => i + 1));
    expect(textbook.catalog.flatMap((n) => n.lessons)).toHaveLength(35);
    expect(textbook.catalog.flatMap((n) => n.lessons).filter((l) => l.available)).toHaveLength(27);
  });
  it('validates all open lessons and question references', () => {
    expect(lessons).toHaveLength(27);
    for (const l of lessons) {
      expect(lessonSchema.safeParse(l).success).toBe(true);
      expect(l.questionIds).toHaveLength(3);
      for (const id of l.questionIds)
        expect(questions.find((q) => q.id === id)?.unitId).toBe(
          l.unitId === 'A01' ? 'U02' : l.unitId,
        );
    }
  });
  it('covers all six units, every difficulty, fill-ins and applications', () => {
    expect(questions).toHaveLength(78);
    expect(new Set(questions.map((q) => q.id)).size).toBe(78);
    for (const unit of textbook.catalog.filter((n) => n.kind === 'unit')) {
      const group = questions.filter((q) => q.unitId === unit.id);
      expect(group.length).toBeGreaterThanOrEqual(9);
      expect(new Set(group.map((q) => q.difficulty)).size).toBe(3);
      expect(group.some((q) => q.type === 'fill')).toBe(true);
      expect(group.some((q) => q.type === 'application')).toBe(true);
    }
  });
  it('gives every challenge a validated step-by-step visualization and every question an analysis', () => {
    for (const q of questions) {
      expect(q.explanation.analysis.length).toBeGreaterThan(5);
      expect(q.explanation.steps.length).toBeGreaterThan(0);
      expect(q.sourceKind).toBe('original');
      expect(Object.keys(q.expected).sort()).toEqual(q.fields.map((f) => f.key).sort());
      if (q.difficulty === 'challenge') {
        expect(q.hasVisual).toBe(true);
        expect(visualSchema.safeParse(q.explanation.visual).success).toBe(true);
      }
      if (q.options) expect(Number(q.expected.value)).toBeLessThan(q.options.length);
      expect(publicQuestion(q)).not.toHaveProperty('expected');
      expect(publicQuestion(q)).not.toHaveProperty('explanation');
    }
  });
  it.each([
    ['u1-12', '12'],
    ['u1-14', '7'],
    ['u1-15', '3'],
    ['u2-08', '132'],
    ['u2-09', '36'],
    ['u2-17', '24'],
    ['u3-07', '80'],
    ['u3-08', '22'],
    ['u4-07', '6'],
    ['u4-08', '84'],
    ['u5-07', '355000'],
    ['u5-08', '364999'],
    ['u6-07', '389'],
    ['u6-08', '400'],
  ])('locks the reviewed challenge answer for %s', (id, answer) => {
    expect(questions.find((q) => q.id === id)?.expected.value).toBe(answer);
  });
});
