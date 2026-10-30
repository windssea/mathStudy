import { describe, expect, it } from 'vitest';
import { practice, questions } from '@mathstudy/content';
import {
  round2U56QuestionSubskills,
  round2U56SubskillStories,
} from '../packages/animation-engine/src/method-round2-u56';
import type { MethodNode } from '@mathstudy/animation-engine';

const labels = (nodes: MethodNode[]) =>
  nodes.flatMap((n) => (n.kind === 'rect' && n.label ? [n.label] : []));
const content = (nodes: MethodNode[]) =>
  nodes
    .flatMap((n) => (n.kind === 'text' ? [n.text] : n.kind === 'rect' && n.label ? [n.label] : []))
    .join('；');

describe('remaining U05–U06 mathematical families', () => {
  it('only maps real topic members and uses distinct, complete visible states', () => {
    for (const [topicId, map] of Object.entries(round2U56QuestionSubskills)) {
      const topic = practice.topics.find((t) => t.id === topicId)!;
      expect(topic).toBeDefined();
      for (const [id, key] of Object.entries(map)) {
        expect(topic.questionIds, id).toContain(id);
        expect(
          questions.some((q) => q.id === id),
          id,
        ).toBe(true);
        expect(round2U56SubskillStories[key], id).toBeDefined();
      }
    }
    for (const [key, story] of Object.entries(round2U56SubskillStories)) {
      expect(story.frames.length, key).toBeGreaterThanOrEqual(3);
      expect(new Set(story.frames.map((f) => JSON.stringify(f.nodes))).size, key).toBe(
        story.frames.length,
      );
      expect(story.transfer, key).toBeDefined();
      expect(story.mistake.nodes, key).not.toEqual(story.mistake.wrongNodes);
      expect(story.transfer!.nodes, key).not.toEqual(story.transfer!.wrongNodes);
      for (const nodes of [
        ...story.frames.map((f) => f.nodes),
        story.mistake.nodes,
        story.mistake.wrongNodes!,
        story.transfer!.nodes,
        story.transfer!.wrongNodes!,
      ]) {
        expect(
          nodes.some((n) => n.kind !== 'text'),
          key,
        ).toBe(true);
        for (const n of nodes) {
          expect(n.x, key).toBeGreaterThanOrEqual(0);
          expect(n.y, key).toBeGreaterThanOrEqual(0);
          expect(n.x, key).toBeLessThanOrEqual(400);
          expect(n.y, key).toBeLessThanOrEqual(250);
          if (n.kind === 'rect') {
            expect(n.w, key).toBeGreaterThan(0);
            expect(n.h, key).toBeGreaterThan(0);
            expect(n.x + n.w, key).toBeLessThanOrEqual(400);
            expect(n.y + n.h, key).toBeLessThanOrEqual(250);
          }
          if (n.kind === 'line') {
            expect(n.x2, key).toBeGreaterThanOrEqual(0);
            expect(n.y2, key).toBeGreaterThanOrEqual(0);
            expect(n.x2, key).toBeLessThanOrEqual(400);
            expect(n.y2, key).toBeLessThanOrEqual(250);
          }
        }
      }
    }
  });
  it('counts all original ten-thousand packs and ten subdivisions per pack', () => {
    const story = round2U56SubskillStories['u56-unit-count'];
    expect(story.frames[0].nodes.filter((n) => n.kind === 'rect')).toHaveLength(24);
    const model = story.frames[2].nodes;
    expect(model.filter((n) => n.kind === 'line' && n.tone === 'known')).toHaveLength(9);
    expect(content(model)).toContain(`${24 * 10}个千`);
    expect(content(story.transfer!.nodes)).toContain(`${3 * 10000}万`);
  });
  it('converts every card column to the same unit before adding', () => {
    const story = round2U56SubskillStories['u56-place-card-sum'];
    const converted = labels(story.frames[2].nodes).map(Number);
    expect(converted).toEqual([14 * 100, 12 * 10, 6]);
    expect(labels(story.frames[3].nodes)).toContain(`${converted.reduce((a, b) => a + b, 0)}个千`);
    expect(content(story.mistake.wrongNodes!)).toContain('32');
  });
  it('separates a digit from its represented value', () => {
    const story = round2U56SubskillStories['u56-place-value-gap'];
    const values = labels(story.frames[1].nodes).map(Number);
    expect(values.slice(0, 2)).toEqual([5, 5]);
    expect(values.slice(2)).toEqual([5 * 1000000, 5 * 100]);
    expect(content(story.mistake.nodes)).toContain(String(5 * 1000000 - 5 * 100));
    expect(labels(story.mistake.wrongNodes!)).toEqual([5, 5, 5, 5].map(String));
    expect(content(story.mistake.wrongNodes!)).toContain('5−5=0');
  });
  it('moves both swapped digits and subtracts the gain in the lower place', () => {
    const story = round2U56SubskillStories['u56-digit-swap'];
    expect(labels(story.frames[2].nodes)).toEqual(['7', '3', '3', '7']);
    const areas = story.frames[3].nodes.filter((n) => n.kind === 'rect');
    expect(areas).toHaveLength(2);
    if (areas[0].kind === 'rect' && areas[1].kind === 'rect')
      expect(areas[0].w / areas[1].w).toBe(10);
    expect(content(story.frames[3].nodes)).toContain(String(573042 - 537042));
    expect(story.transfer!.right).toBe(String(8 - 45000 / 9000));
  });
  it('highlights the first differing digit rather than a smaller trailing digit', () => {
    const story = round2U56SubskillStories['u56-number-compare'];
    const active = labels(story.frames[2].nodes.filter((n) => n.tone === 'focus'));
    expect(active).toEqual(['8', '3']);
    expect(2083000 > 2038000).toBe(true);
    expect(labels(story.mistake.wrongNodes!.filter((n) => n.tone === 'error'))).toEqual(['3', '8']);
    expect(content(story.frames[0].nodes)).not.toContain('2083000 >');
  });
  it('tests the equal candidate before forcing a larger unknown digit', () => {
    const story = round2U56SubskillStories['u56-compare-digit'];
    const valid = Array.from({ length: 10 }, (_, n) => n).filter(
      (n) => Number(`5${n}82000`) > 5470000,
    );
    expect(valid[0]).toBe(4);
    expect(content(story.frames[1].nodes)).toContain('5482000 > 5470000');
    const transfer = Array.from({ length: 10 }, (_, n) => n).filter(
      (n) => Number(`7${n}63000`) > 7250000,
    );
    expect(story.transfer!.right).toBe(String(transfer[0]));
  });
  it('selects the last hundred before the excluded rounding midpoint', () => {
    const story = round2U56SubskillStories['u56-hundred-range'];
    const valid = Array.from({ length: 101 }, (_, i) => 535000 + i * 100).filter(
      (n) => Math.round(n / 10000) === 54,
    );
    expect(valid.at(-1)).toBe(544900);
    expect(content(story.frames[2].nodes)).toContain(String(valid.at(-1)));
    expect(Math.round(545000 / 10000)).toBe(55);
    expect(Number(story.transfer!.right) % 100).toBe(0);
    expect(Math.round(Number(story.transfer!.right) / 10000)).toBe(68);
  });
  it('intersects two direct rounding intervals instead of rounding an approximation again', () => {
    const story = round2U56SubskillStories['u56-rounding-intersection'];
    const valid = Array.from({ length: 10000 }, (_, i) => 1445000 + i).filter(
      (n) => Math.round(n / 10000) === 145 && Math.round(n / 100000) === 15,
    );
    expect([valid[0], valid.at(-1)]).toEqual([1450000, 1454999]);
    expect(content(story.frames[2].nodes)).toContain(`${valid[0]} 至 ${valid.at(-1)}`);
    expect(content(story.mistake.wrongNodes!)).toContain('1445000至1454999');
    expect(content(story.mistake.wrongNodes!)).not.toContain('1450000 至 1454999');
  });
  it('undoes the carry across a zero instead of copying rounded digits', () => {
    const story = round2U56SubskillStories['u56-rounding-carry'];
    expect(labels(story.frames[0].nodes)).toEqual(['□', '□', '□', '5', '□', '□', '□']);
    expect(labels(story.frames[1].nodes).join('')).toBe('6095□□□');
    const original = Number(labels(story.frames[2].nodes).join(''));
    expect(original).toBe(6095000);
    expect(Math.round(original / 10000)).toBe(610);
    expect(Math.floor(original / 10000) % 10).toBe(9);
    expect(Math.round(Number(labels(story.mistake.wrongNodes!).join('')) / 10000)).toBe(611);
    const transfer = Number(labels(story.transfer!.nodes).join(''));
    expect(Math.round(transfer / 10000)).toBe(407);
    expect(Math.floor(transfer / 10000) % 10).toBe(Number(story.transfer!.right));
  });
  it('finds the missing factor from only the extra shares before restoring the correct product', () => {
    const story = round2U56SubskillStories['u56-factor-misread'];
    expect(
      story.frames[0].nodes.filter((n) => n.kind === 'rect' && n.tone === 'error'),
    ).toHaveLength(46 - 40);
    expect(story.frames[1].nodes.filter((n) => n.kind === 'rect')).toHaveLength(6);
    expect(story.frames[2].nodes.filter((n) => n.kind === 'rect')).toHaveLength(40);
    expect(content(story.frames[2].nodes)).toContain(String((810 / (46 - 40)) * 40));
    expect(story.transfer!.right).toBe(String((620 / (35 - 30)) * 30));
    expect(content(story.transfer!.wrongNodes!)).toContain(String(620 * 30));
  });
  it('preserves centimeters after multiplication and converts the total only once', () => {
    const story = round2U56SubskillStories['u56-distance-unit'];
    expect(labels(story.frames[1].nodes)).toContain(String(80 * 125));
    expect(labels(story.frames[2].nodes)).toEqual([`${80 * 125}厘米`, `${(80 * 125) / 100}米`]);
    expect(labels(story.mistake.wrongNodes!)).toContain(`${80 * 125}米`);
    expect(labels(story.transfer!.nodes)).toContain(`${(60 * 150) / 100}米`);
  });
  it('counts a complete desk-and-chair set for every purchase', () => {
    const story = round2U56SubskillStories['u56-set-price'];
    expect(labels(story.frames[0].nodes)).toEqual(['145', '55']);
    expect(story.frames[1].nodes.filter((n) => n.kind === 'rect')).toHaveLength(24);
    expect(content(story.frames[2].nodes)).toContain(
      `花${(145 + 55) * 24}，剩${5000 - (145 + 55) * 24}`,
    );
    expect(content(story.mistake.wrongNodes!)).toContain(`花${145 * 24}，剩${5000 - 145 * 24}`);
    expect(story.transfer!.right).toBe(`${4000 - (160 + 40) * 18}元`);
  });
  it('keeps teaching prices, labels and chosen points visible above filled grouping highlights', () => {
    const firstSet = round2U56SubskillStories['u56-set-price'].frames[0].nodes;
    expect(labels(firstSet)).toEqual(['145', '55']);
    expect(content(firstSet)).toContain('一张桌子');
    expect(content(firstSet)).toContain('一把椅子');
    for (const [key, story] of Object.entries(round2U56SubskillStories)) {
      for (const nodes of [
        ...story.frames.map((f) => f.nodes),
        story.mistake.nodes,
        story.mistake.wrongNodes!,
        story.transfer!.nodes,
        story.transfer!.wrongNodes!,
      ]) {
        nodes.forEach((node, index) => {
          if (node.kind === 'line' || (node.kind === 'rect' && !node.label)) return;
          const x = node.kind === 'rect' ? node.x + node.w / 2 : node.x;
          const y = node.kind === 'rect' ? node.y + node.h / 2 : node.y;
          const covering = nodes
            .slice(index + 1)
            .filter(
              (later) =>
                later.kind === 'rect' &&
                later.x < x &&
                later.x + later.w > x &&
                later.y < y &&
                later.y + later.h > y,
            );
          // Every rectangle has a filled CSS surface, even a dashed grouping box.
          // A later container must never paint over the price/label/point it groups.
          expect(covering, `${key}: a later fill hides ${JSON.stringify(node)}`).toEqual([]);
        });
      }
    }
  });
});
