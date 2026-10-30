import { describe, expect, it } from 'vitest';
import { unit34Stories } from '../packages/animation-engine/src/methods-u34';
import type { MethodNode } from '@mathstudy/animation-engine';

const rectangles = (nodes: MethodNode[]) => nodes.filter((n) => n.kind === 'rect');
const dots = (nodes: MethodNode[]) => nodes.filter((n) => n.kind === 'dot');
const texts = (nodes: MethodNode[]) =>
  nodes
    .filter((n) => n.kind === 'text')
    .map((n) => n.text)
    .join('；');
const topics = [
  'u3-inverse',
  'u3-shopping',
  'u3-compare',
  'u3-speed',
  'u3-journey',
  'u3-conditions',
  'u4-order',
  'u4-brackets',
  'u4-model',
  'u4-steps',
  'u4-budget',
];

describe('quantity and operation teaching depth', () => {
  it('covers all eleven topics with separate causal error and transfer models in bounds', () => {
    expect(Object.keys(unit34Stories).sort()).toEqual([...topics].sort());
    for (const topic of topics) {
      const story = unit34Stories[topic];
      expect(story.frames.length).toBeGreaterThanOrEqual(3);
      expect(story.frames.length).toBeLessThanOrEqual(6);
      for (const step of story.frames) {
        expect(step.why.split(/[。！？]/).filter(Boolean).length).toBeLessThanOrEqual(2);
        expect(step.why.length).toBeLessThanOrEqual(90);
      }
      for (const check of [story.mistake, story.transfer!]) {
        expect(check).toBeDefined();
        expect(check.right).not.toBe(check.wrong);
        expect(check.why.length).toBeGreaterThan(15);
        expect(check.wrongNodes).toBeDefined();
        expect(check.wrongNodes).not.toEqual(check.nodes);
        expect(check.wrongNodes!.some((n) => n.tone === 'error')).toBe(true);
        expect(check.wrongNodes!.some((n) => n.kind !== 'text' && n.tone === 'error')).toBe(true);
      }
      for (const nodes of [
        ...story.frames.map((f) => f.nodes),
        story.mistake.nodes,
        story.mistake.wrongNodes!,
        story.transfer!.nodes,
        story.transfer!.wrongNodes!,
      ]) {
        for (const node of nodes) {
          expect(node.x).toBeGreaterThanOrEqual(0);
          expect(node.x).toBeLessThanOrEqual(400);
          expect(node.y).toBeGreaterThanOrEqual(0);
          expect(node.y).toBeLessThanOrEqual(250);
          if (node.kind === 'rect') {
            expect(node.w).toBeGreaterThan(0);
            expect(node.h).toBeGreaterThan(0);
            expect(node.x + node.w).toBeLessThanOrEqual(400);
            expect(node.y + node.h).toBeLessThanOrEqual(250);
          }
          if (node.kind === 'line') {
            expect(node.x2).toBeGreaterThanOrEqual(0);
            expect(node.x2).toBeLessThanOrEqual(400);
            expect(node.y2).toBeGreaterThanOrEqual(0);
            expect(node.y2).toBeLessThanOrEqual(250);
          }
        }
      }
    }
  });

  it('preserves the total across two regroupings and exposes the extra people in the wrong model', () => {
    const story = unit34Stories['u3-inverse'];
    const before = rectangles(story.frames[0].nodes),
      after = rectangles(story.frames[1].nodes);
    expect(before).toHaveLength(12);
    expect(after).toHaveLength(18);
    expect(before.reduce((sum, n) => sum + Number(n.label), 0)).toBe(360);
    expect(after.reduce((sum, n) => sum + Number(n.label), 0)).toBe(360);
    expect(rectangles(story.mistake.wrongNodes!).filter((n) => n.tone === 'error')).toHaveLength(6);
    expect(texts(story.mistake.wrongNodes!)).toContain('多 180人');
    expect(texts(story.transfer!.nodes)).toContain('192人 = 192人');
  });

  it('calculates each price group before combining it and subtracting from payment', () => {
    const story = unit34Stories['u3-shopping'];
    const books = rectangles(story.frames[0].nodes),
      pens = rectangles(story.frames[1].nodes);
    const bookCost = books.reduce((sum, n) => sum + Number(n.label), 0);
    const penCost = pens.reduce((sum, n) => sum + Number(n.label), 0);
    expect(books).toHaveLength(4);
    expect(pens).toHaveLength(3);
    expect(bookCost).toBe(48);
    expect(penCost).toBe(15);
    expect(story.frames[3].equation).toContain(String(100 - bookCost - penCost));
    expect(rectangles(story.mistake.wrongNodes!).filter((n) => n.tone === 'error')).toHaveLength(3);
    expect(story.transfer!.right).toContain(String(50 - 2 * 9 - 4 * 3));
    expect(texts(story.transfer!.wrongNodes!)).toContain('32');
  });

  it('restricts discounts to complete packs and compares the cost of every feasible split', () => {
    const story = unit34Stories['u3-compare'];
    const packages = rectangles(story.frames[1].nodes).filter(
      (n) => n.dashed && n.tone === 'focus',
    );
    const loose = rectangles(story.frames[1].nodes).find((n) => n.dashed && n.tone === 'warm');
    expect(packages).toHaveLength(2);
    expect(loose).toBeDefined();
    const costs = [0, 1, 2].map((packs) => packs * 30 + (8 - packs * 3) * 11);
    expect(costs).toEqual([88, 85, 82]);
    for (const cost of costs) expect(texts(story.frames[2].nodes)).toContain(`${cost}元`);
    expect(story.frames[3].equation).toContain(String(costs[0] - Math.min(...costs)));
    expect(
      rectangles(story.mistake.wrongNodes!).filter((n) => !n.dashed && n.tone === 'error'),
    ).toHaveLength(2);
    expect(story.transfer!.right).toContain(String(2 * 36 + 2 * 10));
  });

  it('keeps speed attached to each equal unit of time instead of adding unlike units', () => {
    const story = unit34Stories['u3-speed'];
    expect(rectangles(story.frames[0].nodes)).toHaveLength(12);
    expect(rectangles(story.frames[1].nodes)).toHaveLength(21);
    expect(texts(story.frames[0].nodes)).toContain(`${840 / 12} 米`);
    expect(JSON.stringify(story.frames[0].nodes)).not.toContain('1470');
    expect(texts(story.frames[1].nodes)).toContain(String((840 / 12) * 21));
    expect(texts(story.mistake.wrongNodes!)).toContain('整段');
    expect(story.transfer!.right).toContain(String(45 * 5));
    expect(texts(story.transfer!.wrongNodes!)).toContain(String(45 + 5));
  });

  it('models the same road and distinguishes moving time from total elapsed time', () => {
    const story = unit34Stories['u3-journey'];
    expect(rectangles(story.frames[0].nodes).reduce((n, r) => n + Number(r.label), 0)).toBe(180);
    const returnParts = rectangles(story.frames[1].nodes).filter((r) => r.tone === 'focus');
    expect(returnParts).toHaveLength(2);
    expect(returnParts.reduce((n, r) => n + Number(r.label), 0)).toBe(180);
    expect(rectangles(story.frames[2].nodes)).toHaveLength(3 + 2);
    expect(rectangles(story.frames[3].nodes)).toHaveLength(3 + 2 + 1);
    expect(
      rectangles(story.mistake.wrongNodes!).filter((r) => r.tone === 'error' && r.dashed),
    ).toHaveLength(1);
    const outward = 600 / 60,
      returning = 600 / 75,
      rest = 2;
    expect(rectangles(story.transfer!.nodes)).toHaveLength(outward + returning + rest);
    expect(rectangles(story.transfer!.nodes).filter((n) => n.tone === 'warm')).toHaveLength(rest);
    expect(
      rectangles(story.transfer!.wrongNodes!).filter((n) => n.tone === 'error' && n.dashed),
    ).toHaveLength(rest);
    expect(story.transfer!.right).toContain(`${outward + returning + rest}分`);
    expect(story.transfer!.wrong).toContain(`${outward + returning}分`);
    expect(JSON.stringify(story)).not.toMatch(/追及|相向|每秒/);
  });

  it('changes the container count while conserving mass and compares counts in the same unit', () => {
    const story = unit34Stories['u3-conditions'];
    const old = rectangles(story.frames[0].nodes).length,
      current = rectangles(story.frames[1].nodes).length;
    expect(old).toBe(40);
    expect(current).toBe(30);
    expect(old * 9).toBe(current * 12);
    expect(story.frames[2].equation).toContain(String(old - current));
    expect(texts(story.mistake.wrongNodes!)).toContain('千克');
    expect(texts(story.mistake.wrongNodes!)).toContain('3 箱');
    expect(story.transfer!.right).toContain(String(240 / 8 - 240 / 12));
  });

  it('reveals only available dependency values and contrasts the wrong branch', () => {
    const story = unit34Stories['u4-order'];
    expect(JSON.stringify(story.frames[0].nodes)).not.toContain('72');
    expect(JSON.stringify(story.frames[1].nodes)).not.toContain('54');
    expect(story.frames[2].equation).toContain(String((96 / 4) * 3 - 18));
    expect(rectangles(story.mistake.wrongNodes!).some((n) => n.label?.includes('除以 12'))).toBe(
      true,
    );
    expect(story.transfer!.right).toContain(String(72 / 3));
    expect(texts(story.transfer!.wrongNodes!)).toContain('除数 6');
  });

  it('combines all bracket parts before using the whole as a divisor', () => {
    const story = unit34Stories['u4-brackets'];
    const parts = rectangles(story.frames[1].nodes).filter((r) => r.label === '20');
    expect(parts).toHaveLength(3);
    expect(parts.reduce((n, r) => n + Number(r.label), 0)).toBe((68 - 48) * 3);
    expect(rectangles(story.frames[2].nodes).length * 60).toBe(840);
    expect(
      rectangles(story.mistake.wrongNodes!).filter((r) => r.label === '20' && r.tone === 'quiet'),
    ).toHaveLength(2);
    expect(texts(story.transfer!.nodes)).toContain(String(480 / ((35 - 15) * 2)));
  });

  it('divides the remaining money rather than the original payment or already spent part', () => {
    const story = unit34Stories['u4-model'];
    expect(JSON.stringify(story.frames[0].nodes)).not.toContain('360');
    expect(texts(story.frames[1].nodes)).not.toContain('30 本');
    expect(rectangles(story.frames[2].nodes).length * 12).toBe(500 - 35 * 4);
    expect(rectangles(story.mistake.wrongNodes!).find((r) => r.tone === 'error')?.label).toContain(
      '140',
    );
    expect(rectangles(story.transfer!.nodes).length * 15).toBe(360 - 20 * 6);
    expect(texts(story.transfer!.wrongNodes!)).toContain('多算8本');
  });

  it('reconstructs the rope by joining parts and shows why their difference answers another question', () => {
    const story = unit34Stories['u4-steps'];
    const used = rectangles(story.frames[0].nodes).reduce((sum, n) => sum + Number(n.label), 0);
    expect(used).toBe(6 * 9);
    expect(story.frames[1].equation).toContain(String(used + 17));
    expect(story.frames[2].equation).toContain(String(used + 17 - used));
    expect(rectangles(story.mistake.wrongNodes!).find((n) => n.tone === 'error')?.label).toBe(
      `差${used - 17}`,
    );
    expect(story.transfer!.right).toContain(String(4 * 8 + 19));
    expect(rectangles(story.transfer!.wrongNodes!).find((n) => n.tone === 'error')?.label).toBe(
      `差${4 * 8 - 19}`,
    );
  });

  it('enumerates every three-vehicle allocation and rejects a cheaper but infeasible fleet', () => {
    const story = unit34Stories['u4-budget'];
    const rows = rectangles(story.frames[1].nodes);
    const seatTotals = [0, 1, 2, 3].map((row) =>
      rows.filter((n) => n.y === 37 + row * 48).reduce((sum, n) => sum + Number(n.label), 0),
    );
    expect(seatTotals).toEqual([72, 64, 56, 48]);
    expect(JSON.stringify(story.frames[1].nodes)).not.toContain('540');
    const valid = [0, 1, 2, 3]
      .map((large) => ({
        seats: large * 24 + (3 - large) * 16,
        fee: large * 180 + (3 - large) * 140,
      }))
      .filter((p) => p.seats >= 63);
    expect(Math.min(...valid.map((p) => p.fee))).toBe(500);
    expect(dots(story.frames[3].nodes)).toHaveLength(63);
    expect(dots(story.mistake.wrongNodes!).filter((n) => n.tone === 'error')).toHaveLength(
      63 - 3 * 16,
    );
    expect(dots(story.transfer!.wrongNodes!).filter((n) => n.tone === 'error')).toHaveLength(
      50 - 20 - 2 * 12,
    );
    expect(story.transfer!.right).toContain(String(110 * 2 + 80));
  });
});
