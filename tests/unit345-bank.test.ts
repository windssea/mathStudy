import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { questions, practice, publicQuestion, lessons } from '@mathstudy/content';
import { gradeAnswers, readChineseNumber } from '@mathstudy/math-core';
import { app } from '../apps/web/worker';
import mapping from '../content/practice/unit345-legacy-topics.json';

const added = questions.filter((q) => q.id.startsWith('bank-u'));
const question = (topic: string, n: number) =>
  questions.find((q) => q.id === 'bank-' + topic + '-' + String(n).padStart(2, '0'))!;
const values = (topic: string, n: number) => Object.values(question(topic, n).expected).map(Number);
function permutations(chars: string) {
  const result = new Set<number>();
  function visit(prefix: string, rest: string) {
    if (!rest) {
      if (prefix[0] !== '0') result.add(Number(prefix));
      return;
    }
    for (let i = 0; i < rest.length; i++)
      visit(prefix + rest[i], rest.slice(0, i) + rest.slice(i + 1));
  }
  visit('', chars);
  return [...result];
}
it('offers 17 scoped topics with all existing identities and 73 new original questions', () => {
  expect(added).toHaveLength(73);
  for (const [unit, count, topicCount] of [
    ['U03', 24, 6],
    ['U04', 25, 5],
    ['U05', 24, 6],
  ] as const) {
    expect(added.filter((q) => q.unitId === unit)).toHaveLength(count);
    const topics = practice.topics.filter((t) => t.unitId === unit);
    expect(topics).toHaveLength(topicCount);
    expect(topics.some((t) => t.id.endsWith('-general'))).toBe(false);
    for (const t of topics) {
      const items = t.questionIds.map((id) => questions.find((q) => q.id === id)!);
      expect(items.length).toBeGreaterThanOrEqual(4);
      expect(new Set(items.map((q) => q.difficulty)).size).toBe(3);
    }
  }
  for (const [id, topic] of Object.entries(mapping)) {
    const q = questions.find((q) => q.id === id)!;
    expect(q.topicIds).toEqual([topic]);
    expect(practice.topics.find((t) => t.id === topic)!.questionIds).toContain(id);
  }
  for (const q of added) {
    const range = { U03: [45, 56], U04: [58, 63], U05: [68, 88] }[q.unitId]!;
    expect(q.pages[0]).toBeGreaterThanOrEqual(range[0]);
    expect(q.pages[1]).toBeLessThanOrEqual(range[1]);
    expect(lessons.find((l) => l.id === q.lessonId)!.unitId).toBe(q.unitId);
    expect(q.sourceKind).toBe('original');
    expect(q.sources).toBeUndefined();
    expect(q.explanation.steps.length).toBeGreaterThanOrEqual(2);
    expect(gradeAnswers(q, q.expected), q.id).toBe(true);
  }
});
it('independently checks all third-unit quantities and enumerates the cheapest purchase', () => {
  expect(values('u3-inverse', 1)).toEqual([432 / 24, 432 / 18]);
  expect(values('u3-inverse', 2)).toEqual([(12 * 18) / 9 - 18]);
  expect(question('u3-inverse', 3).expected.value).toBe('1');
  expect(72 / 3 - 72 / 6).toBe(12);
  expect(values('u3-inverse', 4)).toEqual([(12 * 24 - 72) / 18]);
  expect(values('u3-shopping', 1)).toEqual([9 * 7, 3 * 4]);
  expect(values('u3-shopping', 2)).toEqual([(180 - 28 * 3) / 8]);
  expect(values('u3-shopping', 3)).toEqual([(100 - 20 - 14) / 6]);
  expect(values('u3-shopping', 4)).toEqual([(300 - 84) / 18 - 2, 84 + 18 * 2]);
  expect(values('u3-compare', 1)).toEqual([36 / 4, 48 / 6]);
  expect(values('u3-compare', 2)).toEqual([240 / (240 / 20 - 2) - 20]);
  expect(values('u3-compare', 3)).toEqual([8 * 12 - (30 * 2 + 2 * 12)]);
  const plans = Array.from({ length: 6 }, (_, pack) =>
    Array.from({ length: 9 }, (_, single) => ({
      pack,
      single,
      count: pack * 3 + single,
      cost: pack * 30 + single * 12,
    })),
  )
    .flat()
    .filter((p) => p.count >= 8);
  const cheapest = plans.filter((p) => p.cost === Math.min(...plans.map((p) => p.cost)));
  expect(cheapest).toEqual([{ pack: 2, single: 2, count: 8, cost: 84 }]);
  expect(values('u3-compare', 4)).toEqual([cheapest[0].cost, cheapest[0].pack, cheapest[0].single]);
  expect(values('u3-speed', 1)).toEqual([650 / 10, (650 / 10) * 14]);
  expect(question('u3-speed', 2).expected.value).toBe('0');
  expect(840 / 12 - 900 / 15).toBe(10);
  expect(values('u3-speed', 3)).toEqual([Math.abs(250 * 20 - (60000 / 60) * 5)]);
  expect(values('u3-speed', 4)).toEqual([16 - 2 - (75 * 16) / 100]);
  expect(values('u3-journey', 1)).toEqual([(60 * 3) / 2]);
  expect(values('u3-journey', 2)).toEqual([60 * 2 + 45 * 2]);
  expect(values('u3-journey', 3)).toEqual([900 / 60 + 8 + 900 / 75]);
  expect(values('u3-journey', 4)).toEqual([(1500 - 60 * 10) / (30 - 10 - 5)]);
  expect(values('u3-conditions', 1)).toEqual([(8 / 2) * 15]);
  expect(values('u3-conditions', 2)).toEqual([(28 / 4) * 6]);
  expect(values('u3-conditions', 3)).toEqual([40 - (9 * 40) / 12]);
  expect(values('u3-conditions', 4)).toEqual([6 + (84 - 24) / (24 / 6 + 2)]);
});
it('checks all fourth-unit calculations, inverse chains and constrained vehicle plans', () => {
  expect(values('u4-order', 1)).toEqual([(96 / 4) * 3 - 18]);
  expect(question('u4-order', 2).expected.value).toBe('1');
  expect(values('u4-order', 3)).toEqual([24 + 24 * 3 - 8]);
  expect(values('u4-order', 4)).toEqual([360 - (180 / 6) * 3, 350 - (360 - (180 / 6) * 3)]);
  expect(values('u4-order', 5)).toEqual([48 * 3 - 40 * 2]);
  expect(values('u4-brackets', 1)).toEqual([840 / ((52 - 32) * 3)]);
  expect(values('u4-brackets', 2)).toEqual([(600 / (25 - 5)) * 2, 600 / ((25 - 5) * 2)]);
  expect(values('u4-brackets', 3)).toEqual([720 / (18 * 4 + 8)]);
  expect(question('u4-brackets', 4).expected.value).toBe('1');
  expect([(240 / 12 - 4) * 3, (240 / (12 - 4)) * 3, 240 / (12 - 4 * 3), 240 / 12 - 4 * 3]).toEqual([
    48,
    90,
    Infinity,
    8,
  ]);
  expect(values('u4-brackets', 5)).toEqual([960 / 8 / 4 + 16]);
  expect(question('u4-model', 1).expected.value).toBe('2');
  expect((600 - 84 * 4) / 24).toBe(11);
  expect(values('u4-model', 2)).toEqual([(18 * 6 - 36) / 8]);
  expect(question('u4-model', 3).expected.value).toBe('1');
  expect(values('u4-model', 4)).toEqual([(45 * 8 - 40 * 3 - 12 * 10) / 24]);
  expect(values('u4-model', 5)).toEqual([(32 * 3 + 36 * 2) / 8]);
  expect(values('u4-steps', 1)).toEqual([8 * 5 + 17]);
  expect(values('u4-steps', 2)).toEqual([Math.ceil((320 - 28 * 5) / 25), (320 - 28 * 5) % 25]);
  expect(values('u4-steps', 3)).toEqual([12 * 6 + 32]);
  expect(values('u4-steps', 4)).toEqual([(60 * 9 - 60 * 4) / (9 - 1 - 4)]);
  expect(values('u4-steps', 5)).toEqual([Math.max(0, 15 * 8 - (12 * 8 + 24))]);
  expect(values('u4-budget', 1)).toEqual([200 - 24 * 5 - 18 * 3]);
  expect(values('u4-budget', 2)).toEqual([Math.floor((500 - 68 * 4) / 35), (500 - 68 * 4) % 35]);
  expect(values('u4-budget', 3)).toEqual([(12 * 2 + 8 * 3) * 8 + 36]);
  const sets = Math.min(Math.floor((24 * 4) / 3), Math.floor((30 * 3) / 5));
  expect(values('u4-budget', 4)).toEqual([sets, 24 * 4 - sets * 3]);
  const plans = Array.from({ length: 4 }, (_, large) =>
    Array.from({ length: 4 }, (_, small) => ({
      large,
      small,
      seats: large * 32 + small * 18,
      cost: large * 300 + small * 180,
    })),
  )
    .flat()
    .filter((p) => p.large + p.small <= 3 && p.seats >= 70)
    .sort((a, b) => a.cost - b.cost);
  expect(plans[0]).toEqual({ large: 2, small: 1, seats: 82, cost: 780 });
  expect(values('u4-budget', 5)).toEqual([plans[0].cost, plans[0].large, plans[0].small]);
});
it('checks fifth-unit place values, exact rewrites and Chinese readings independently', () => {
  expect(values('u5-place', 1)).toEqual([(100 * 1000) / 10000, (10 * 10000000) / 100000000]);
  expect(values('u5-place', 2)).toEqual([(23 * 100000 + 15 * 10000 + 8 * 1000) / 1000]);
  expect(values('u5-place', 3)).toEqual([6000000 - 600]);
  const swap = Array.from({ length: 10 }, (_, n) => n).filter(
    (n) => Number('87' + n + '056') - Number('8' + n + '7056') === 27000,
  );
  expect(values('u5-place', 4)).toEqual(swap);
  const reading = question('u5-reading', 1);
  expect(Number(reading.expected.value)).toBe(
    reading.options!.indexOf(readChineseNumber(40060008)),
  );
  expect(values('u5-reading', 2)).toEqual([6e8 + 3e6 + 90]);
  expect(question('u5-reading', 3).expected).toEqual({
    a1: String(4e8 + 6e5 + 8),
    a2: readChineseNumber(4e8 + 6e5 + 8),
  });
  const twoZeros = permutations('00002358').filter(
    (n) => (readChineseNumber(n).match(/零/g) ?? []).length === 2,
  );
  expect(values('u5-reading', 4)).toEqual([Math.min(...twoZeros)]);
  expect(readChineseNumber(Number(question('u5-reading', 4).expected.a1))).toBe(
    '二千零三万零五十八',
  );
  const compare = question('u5-compare', 1);
  expect(Number(compare.expected.value)).toBe(
    compare.options!.map(Number).indexOf(Math.max(...compare.options!.map(Number))),
  );
  const digits = Array.from({ length: 10 }, (_, n) => n).filter(
    (n) => Number('6' + n + '90500') > 6480000,
  );
  expect(values('u5-compare', 2)).toEqual([Math.min(...digits), Math.max(...digits)]);
  expect(values('u5-compare', 3)).toEqual([[2008000, 2080000, 2000800].sort((a, b) => a - b)[1]]);
  const candidates = permutations('003468').filter(
    (n) => n > 830000 && Math.round(n / 10000) === 83,
  );
  expect(values('u5-compare', 4)).toEqual([Math.max(...candidates)]);
  expect(values('u5-rewrite', 1)).toEqual([4050000 / 10000, 1200000000 / 100000000]);
  expect(question('u5-rewrite', 2).expected.value).toBe('0');
  expect(question('u5-rewrite', 3).expected).toEqual({
    a1: String(2e8 / 1e4),
    a2: 2e8 > 19000 * 10000 ? '甲' : '乙',
  });
  expect(3e8 + 40 * 1e4).toBe(30040 * 1e4);
  expect(300040000).not.toBe(30040 * 1e4);
  expect(question('u5-rewrite', 4).expected).toEqual({ a1: '丙', a2: String(3e8 + 40 * 1e4) });
});
it('enumerates rounding intersections and enforces exact code structure in the shared grader', () => {
  expect(values('u5-rounding', 1)).toEqual([Math.round(486500 / 10000)]);
  const missing = Array.from({ length: 10 }, (_, n) => n).filter(
    (n) => Math.round(Number('39' + n + '8500') / 10000) === 400,
  );
  expect(values('u5-rounding', 2)).toEqual(missing);
  const hundreds = Array.from({ length: 200 }, (_, i) => 710000 + i * 100).filter(
    (n) => Math.round(n / 10000) === 72,
  );
  expect(values('u5-rounding', 3)).toEqual([Math.min(...hundreds), Math.max(...hundreds)]);
  const intersection = Array.from({ length: 20001 }, (_, i) => 1940000 + i).filter(
    (n) => Math.round(n / 10000) === 195 && Math.round(n / 100000) === 20,
  );
  expect(values('u5-rounding', 4)).toEqual([Math.min(...intersection), Math.max(...intersection)]);
  expect(values('u5-codes', 1)).toEqual([2027, 3, 42]);
  expect(question('u5-codes', 2).expected.a1).toBe('2027' + '06' + '008');
  expect(values('u5-codes', 3)).toEqual([999 - 248]);
  const group = Math.ceil(128 / 30),
    first = (group - 1) * 30 + 1;
  expect(question('u5-codes', 4).expected).toEqual({
    a1: '128',
    a2: String(group * 30),
    a3: '2027' + '05' + String(first).padStart(3, '0'),
  });
  const code = question('u5-codes', 2);
  expect(gradeAnswers(code, { a1: '202706008' })).toBe(true);
  expect(gradeAnswers(code, { a1: '２０２７０６００８' })).toBe(true);
  for (const a1 of ['0202706008', '202768', '20270608', '2027|06|008'])
    expect(gradeAnswers(code, { a1 }), a1).toBe(false);
});
it('keeps every challenge diagram local, complete and free of source bitmaps', () => {
  const challenges = added.filter((q) => q.difficulty === 'challenge');
  expect(challenges).toHaveLength(20);
  for (const q of challenges) {
    const stages = q.explanation.visual!.stages!;
    expect(stages).toHaveLength(q.explanation.steps.length);
    expect(stages.length).toBeGreaterThanOrEqual(3);
    for (const stage of stages) {
      expect(stage.kind).toBe('image');
      const svg = readFileSync('apps/web/public' + stage.image, 'utf8');
      expect(svg).toContain('viewBox="0 0 720 340"');
      expect(svg).not.toMatch(/<image|data:image|<script/);
    }
    expect(publicQuestion(q)).not.toHaveProperty('answerRules');
  }
});
it('keeps old topic deep links and filter counts valid without publishing general categories', async () => {
  for (const [id, count] of [
    ['u3-general', 42],
    ['u4-general', 37],
    ['u5-general', 45],
  ] as const) {
    const response = await app.request('/api/v1/practice/topics/' + id);
    expect(response.status).toBe(200);
    expect((await response.json()).data.items).toHaveLength(count);
  }
  const path = '/api/v1/practice/topics/u4-budget?difficulty=challenge&type=application';
  const { data } = await (await app.request(path)).json();
  expect(data.items.length).toBeGreaterThanOrEqual(2);
  expect(
    data.items.every(
      (q: { unitId: string; difficulty: string; type: string }) =>
        q.unitId === 'U04' && q.difficulty === 'challenge' && q.type === 'application',
    ),
  ).toBe(true);
  expect(JSON.stringify(data)).not.toContain('"expected"');
  expect(JSON.stringify(data)).not.toContain('"answerRules"');
});
