import { expect, it } from 'vitest';
import { questions } from '@mathstudy/content';
import { readChineseNumber } from '@mathstudy/math-core';
import { visualSchema } from '@mathstudy/contracts';
const answer = (id: string) => Number(questions.find((q) => q.id === id)!.expected.value);

it('adds three original reasoning exercises to each unit without changing existing answer IDs', () => {
  for (let unit = 1; unit <= 6; unit++) {
    const group = questions.filter(
      (q) =>
        /^u[1-6]-\d{2}$/.test(q.id) &&
        q.unitId === `U0${unit}` &&
        q.sourceKind === 'original' &&
        q.explanation.visual?.kind === 'reasoning',
    );
    expect(group).toHaveLength(3);
    expect(group.filter((q) => q.difficulty === 'challenge')).toHaveLength(2);
    for (const q of group)
      expect(visualSchema.parse(q.explanation.visual).stages).toHaveLength(
        q.explanation.steps.length,
      );
  }
});
it('checks division boundary, wrong-divisor restoration, and every possible missing digit', () => {
  const max = answer('u1-16');
  expect(Math.floor(max / 24)).toBe(18);
  expect(Math.floor((max + 1) / 24)).toBe(19);
  expect(answer('u1-17')).toBe((40 * 18 + 17) % 46);
  const candidates = Array.from({ length: 10 }, (_, d) => ({ d, remainder: (706 + d * 10) % 32 }));
  expect(candidates.find((c) => c.d === answer('u1-18'))!.remainder).toBe(
    Math.max(...candidates.map((c) => c.remainder)),
  );
});
it('enumerates distinct rectangle possibilities and checks shared-edge subtraction', () => {
  expect(answer('u2-19')).toBe(2 * (8 * 2 + 5));
  expect(answer('u2-19')).toBe(2 * 2 * (8 + 5) - 2 * 5);
  expect(answer('u2-20')).toBe(Math.max(2 * (12 + 3), 2 * (6 + 6)));
  const rectangles = Array.from({ length: 7 }, (_, i) => i + 1).filter((w) => w * (15 - w) >= 50);
  expect(answer('u2-21')).toBe(rectangles.length);
});
it('keeps unit prices and moving time separate from total price and elapsed time', () => {
  expect(answer('u3-10')).toBe(120 / (120 / 8 - 3) - 8);
  expect(answer('u3-11')).toBe((60 * 12) / 80 + 3);
  expect(answer('u3-12')).toBe((36 / 3 - 55 / 5) * 8);
  expect(answer('u4-10')).toBe((720 / (48 - 18)) * 3 - 720 / ((48 - 18) * 3));
  expect(answer('u4-11')).toBe((720 - 36 * 4) / 8);
  expect(answer('u4-12')).toBe(Math.min(Math.floor((30 * 4) / 8), Math.floor((20 * 3) / 5)));
});
it('exhaustively checks zero-reading digit arrangements and constrained rounding boundaries', () => {
  const permutations = new Set<number>();
  function arrange(prefix: string, remaining: string) {
    if (!remaining) {
      if (prefix[0] !== '0') permutations.add(Number(prefix));
      return;
    }
    for (let i = 0; i < remaining.length; i++)
      arrange(prefix + remaining[i], remaining.slice(0, i) + remaining.slice(i + 1));
  }
  arrange('', '002255');
  const valid = [...permutations].filter(
    (n) => (readChineseNumber(n).match(/零/g) ?? []).length === 2,
  );
  expect(answer('u5-20')).toBe(Math.min(...valid));
  const hundreds = Array.from({ length: 200 }, (_, i) => 390000 + i * 100).filter(
    (n) => Math.round(n / 10000) === 40,
  );
  expect(answer('u5-21')).toBe(Math.max(...hundreds));
  expect(Math.round(4045000 / 10000)).toBe(405);
  expect(answer('u5-19')).toBe(Math.floor(4045000 / 10000) % 10);
});
it('checks partial product place value and proves the minimum paid quantity under the gift rule', () => {
  expect(answer('u6-10')).toBe((984 / (68 - 60)) * 60);
  expect(answer('u6-11')).toBe(206 * 34 - (206 * 4 + 206 * 3));
  const feasible = Array.from({ length: 47 }, (_, n) => n).filter(
    (n) => n + Math.floor(n / 10) >= 46,
  );
  expect(answer('u6-12')).toBe(Math.min(...feasible) * 203);
});
it('rejects an explanation with a missing diagram stage', () => {
  const visual = questions.find((q) => q.id === 'u6-12')!.explanation.visual!;
  expect(visualSchema.safeParse({ ...visual, stages: visual.stages!.slice(1) }).success).toBe(
    false,
  );
});
