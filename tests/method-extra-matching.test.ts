import { describe, expect, it } from 'vitest';
import { practice, questions } from '@mathstudy/content';
import {
  extraQuestionSubskills,
  extraSubskillStories,
} from '../packages/animation-engine/src/method-extra-subskills';
import type { MethodNode } from '@mathstudy/animation-engine';

function modelText(nodes: MethodNode[]) {
  return nodes
    .flatMap((node) =>
      node.kind === 'text' ? [node.text] : node.kind === 'rect' && node.label ? [node.label] : [],
    )
    .join('；');
}
describe('explicitly matched remaining algorithm families', () => {
  it('maps only existing topic members to complete deterministic stories', () => {
    for (const [topicId, map] of Object.entries(extraQuestionSubskills)) {
      const topic = practice.topics.find((t) => t.id === topicId)!;
      expect(topic).toBeDefined();
      for (const [id, key] of Object.entries(map)) {
        expect(topic.questionIds, id).toContain(id);
        expect(
          questions.some((q) => q.id === id),
          id,
        ).toBe(true);
        expect(extraSubskillStories[key], id).toBeDefined();
      }
    }
    for (const [key, story] of Object.entries(extraSubskillStories)) {
      expect(story.frames.length, key).toBeGreaterThanOrEqual(3);
      expect(new Set(story.frames.map((f) => JSON.stringify(f.nodes))).size, key).toBe(
        story.frames.length,
      );
      expect(story.transfer, key).toBeDefined();
      expect(story.mistake.nodes, key).not.toEqual(story.mistake.wrongNodes);
      expect(story.transfer!.nodes, key).not.toEqual(story.transfer!.wrongNodes);
      const all = [
        ...story.frames.map((f) => f.nodes),
        story.mistake.nodes,
        story.mistake.wrongNodes!,
        story.transfer!.nodes,
        story.transfer!.wrongNodes!,
      ];
      for (const nodes of all)
        for (const node of nodes) {
          expect(node.x, key).toBeGreaterThanOrEqual(0);
          expect(node.y, key).toBeGreaterThanOrEqual(0);
          expect(node.x, key).toBeLessThanOrEqual(400);
          expect(node.y, key).toBeLessThanOrEqual(250);
          if (node.kind === 'rect') {
            expect(node.w, key).toBeGreaterThan(0);
            expect(node.h, key).toBeGreaterThan(0);
            expect(node.x + node.w, key).toBeLessThanOrEqual(400);
            expect(node.y + node.h, key).toBeLessThanOrEqual(250);
          }
          if (node.kind === 'line') {
            expect(node.x2, key).toBeGreaterThanOrEqual(0);
            expect(node.y2, key).toBeGreaterThanOrEqual(0);
            expect(node.x2, key).toBeLessThanOrEqual(400);
            expect(node.y2, key).toBeLessThanOrEqual(250);
          }
        }
    }
  });
  it('gives an addition a carry model instead of cancelling division zeros', () => {
    const key = extraQuestionSubskills['u1-mental']['full-p04-s1-q1-2'];
    const story = extraSubskillStories[key];
    const last = story.frames.at(-1)!.nodes;
    const hundreds = last.filter((n) => n.kind === 'rect' && n.tone === 'known');
    const tens = last.filter((n) => n.kind === 'rect' && n.tone === 'focus');
    const ones = last.filter((n) => n.kind === 'dot');
    expect(hundreds.length * 100 + tens.length * 10 + ones.length).toBe(236 + 78);
    expect(story.mistake.nodes.filter((n) => n.kind === 'rect' && n.tone === 'focus')).toHaveLength(
      8,
    );
    expect(
      story.mistake.wrongNodes!.some((n) => n.kind === 'rect' && n.dashed && n.tone === 'error'),
    ).toBe(true);
  });
  it('shows every remaining part once for each row of a mental multiplication', () => {
    const story = extraSubskillStories['extra-oral-product'];
    const split = story.frames[1].nodes.filter((n) => n.kind === 'rect');
    expect(split.filter((n) => n.tone === 'known')).toHaveLength(20 * 5);
    expect(split.filter((n) => n.tone === 'focus')).toHaveLength(4 * 5);
    expect(story.prompt).toContain('24×5');
    expect(story.prompt).not.toContain('23×5');
    expect(story.frames[2].nodes.filter((n) => n.kind === 'rect')).toHaveLength(24 * 5);
    expect(
      story.mistake.wrongNodes!.filter((n) => n.kind === 'rect' && n.tone === 'error'),
    ).toHaveLength(3);
  });
  it('expands both dimensions, rather than teaching a repunit-square pattern', () => {
    const story = extraSubskillStories[extraQuestionSubskills['u6-patterns']['teach-u6-11']];
    expect(story.frames.map((f) => f.nodes.filter((n) => n.kind === 'rect').length)).toEqual([
      6, 12, 24,
    ]);
    expect(story.frames[0].nodes.find((n) => n.kind === 'rect')).toMatchObject({ w: 15, h: 15 });
    expect(story.frames[2].nodes.find((n) => n.kind === 'rect')).toMatchObject({ w: 15, h: 15 });
  });
  it('uses zero as the counterexample and preserves zero in a longer product', () => {
    const story = extraSubskillStories[extraQuestionSubskills['u6-patterns']['teach-u6-12']];
    expect(story).toBe(extraSubskillStories[extraQuestionSubskills['u6-tools']['u6-04']]);
    expect(story.frames[0].nodes.filter((n) => n.kind === 'rect' && n.label === '0')).toHaveLength(
      3,
    );
    expect(story.frames[1].nodes.filter((n) => n.kind === 'rect' && n.label === '0')).toHaveLength(
      5,
    );
    expect(story.transfer!.right).toContain('0');
  });
  it('uses independent parameters for same-level and repeated-packet checks', () => {
    const order = extraSubskillStories['extra-same-level-order'];
    expect(order.transfer!.question).not.toContain('28−17＋3');
    expect(order.transfer!.right).toContain(String(32 - 19 + 6));
    const packets = extraSubskillStories['extra-multiple-packets'];
    expect(packets.prompt).not.toContain('123×9');
    expect(packets.frames.at(-1)!.equation).toContain(String(124 * 32));
    expect(
      packets.frames
        .at(-1)!
        .nodes.filter((n) => n.kind === 'rect')
        .reduce((sum, n) => sum + Number(n.label), 0),
    ).toBe(124 * 32);
  });
  it('keeps remaining pages, final partial day and exact division distinct', () => {
    const story = extraSubskillStories[extraQuestionSubskills['u4-steps']['bank-u4-steps-02']];
    const rectangles = story.frames[3].nodes.filter((n) => n.kind === 'rect');
    expect(rectangles).toHaveLength(8);
    expect(rectangles.reduce((sum, n) => sum + Number(n.label), 0)).toBe(280 - 4 * 25);
    expect(rectangles.at(-1)!.label).toBe('12');
    expect(story.transfer!.nodes.filter((n) => n.kind === 'rect')).toHaveLength((250 - 100) / 25);
    const rate = extraSubskillStories[extraQuestionSubskills['u4-steps']['bank-u4-steps-04']];
    expect(
      rate.frames
        .at(-1)!
        .nodes.filter((n) => n.kind === 'rect')
        .reduce((sum, n) => sum + Number(n.label), 0),
    ).toBe(400 - 3 * 40);
    expect(
      rate.frames[1].nodes.filter((n) => n.kind === 'rect' && n.tone === 'focus'),
    ).toHaveLength(10 - 3 - 2);
  });
  it('counts code capacity and last-group bounds without losing the known existing book', () => {
    const story = extraSubskillStories[extraQuestionSubskills['u5-codes']['bank-u5-codes-04']];
    const slots = story.frames[1].nodes.filter((n) => n.kind === 'rect');
    expect(slots).toHaveLength(25);
    expect(slots.filter((n) => n.tone === 'known')).toHaveLength(87 - 76 + 1);
    expect(Math.floor((87 - 1) / 25) * 25 + 1).toBe(76);
    expect(modelText(story.frames.at(-1)!.nodes)).toContain('202806076');
    expect(story.mistake.right).toContain('87到100');
    expect(JSON.stringify(story)).not.toContain('202705128');
    expect(JSON.stringify(story)).not.toContain('202705121');
    const capacity = extraSubskillStories[extraQuestionSubskills['u5-codes']['bank-u5-codes-03']];
    expect(capacity.frames.at(-1)!.equation).toContain(String(999 - 356));
    expect(capacity.prompt).not.toContain('248');
    const timesEleven = extraSubskillStories['extra-times-eleven'];
    expect(timesEleven.transfer!.question).toContain('17×11');
    expect(timesEleven.transfer!.question).not.toContain('15×11');
    expect(timesEleven.transfer!.right).toContain(String(17 * 11));
  });
  it('proves the paid quantity is minimal and does not count gifts again', () => {
    const story = extraSubskillStories[extraQuestionSubskills['u6-application']['u6-12']];
    expect(story.frames).toHaveLength(5);
    expect(story.frames[1].nodes.filter((n) => n.kind === 'rect' && n.label === '1')).toHaveLength(
      Math.floor(30 / 10),
    );
    expect(31 + Math.floor(31 / 10)).toBeLessThan(35);
    expect(32 + Math.floor(32 / 10)).toBe(35);
    expect(story.frames[3].equation).toContain('34＜35');
    expect(story.frames[4].equation).toContain(String(198 * 32));
    expect(story.transfer!.right).toContain(String(17 * 80));
    expect(modelText(story.frames.flatMap((f) => f.nodes))).not.toMatch(/[⌊⌋]/);
  });
});
