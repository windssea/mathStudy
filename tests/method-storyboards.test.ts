import { describe, expect, it } from 'vitest';
import { methodStories, methodStory } from '@mathstudy/animation-engine';
import { practice } from '@mathstudy/content';

describe('visual methods', () => {
  it('covers every classified topic with distinct deterministic frames and a misconception', () => {
    expect(Object.keys(methodStories).sort()).toEqual(practice.topics.map((t) => t.id).sort());
    for (const topic of practice.topics) {
      const story = methodStory(topic.id)!;
      expect(story.frames.length).toBeGreaterThanOrEqual(3);
      expect(new Set(story.frames.map((f) => JSON.stringify(f.nodes))).size).toBe(
        story.frames.length,
      );
      expect(story.mistake.right).not.toBe(story.mistake.wrong);
      expect(story.mistake.why.length).toBeGreaterThan(10);
      for (const frame of [
        ...story.frames,
        { nodes: story.mistake.nodes },
        ...(story.transfer ? [{ nodes: story.transfer.nodes }] : []),
      ]) {
        expect(frame.nodes.some((n) => n.kind === 'rect' || n.kind === 'line')).toBe(true);
        for (const node of frame.nodes) {
          expect(Number.isFinite(node.x) && Number.isFinite(node.y)).toBe(true);
          expect(node.x).toBeGreaterThanOrEqual(0);
          expect(node.y).toBeGreaterThanOrEqual(0);
          if (node.kind === 'rect') {
            expect(node.w).toBeGreaterThan(0);
            expect(node.h).toBeGreaterThan(0);
            expect(node.x + node.w).toBeLessThanOrEqual(400);
            expect(node.y + node.h).toBeLessThanOrEqual(250);
          }
        }
      }
    }
    expect(methodStory('unknown')).toBeUndefined();
  });
  it('regroups leftover objects into a real additional whole group before accepting the remainder', () => {
    const frames = methodStory('u1-remainder')!.frames;
    const firstGroups = frames[0].nodes.filter((n) => n.kind === 'rect');
    const firstRemainder = frames[0].nodes.filter((n) => n.kind === 'dot');
    expect(firstGroups).toHaveLength(12);
    expect(firstRemainder).toHaveLength(19);
    expect(firstGroups.length * 18 + firstRemainder.length).toBe(235);
    const regrouped = frames[2].nodes.filter((n) => n.kind === 'dot');
    expect(regrouped.filter((n) => n.tone === 'focus')).toHaveLength(18);
    expect(regrouped.filter((n) => n.tone === 'warm')).toHaveLength(1);
    const finalGroups = frames[3].nodes.filter((n) => n.kind === 'rect');
    const finalRemainder = frames[3].nodes.filter((n) => n.kind === 'dot');
    expect(finalGroups.length).toBe(firstGroups.length + 1);
    expect(finalRemainder.length).toBeLessThan(18);
    expect(finalGroups.length * 18 + finalRemainder.length).toBe(235);
    const transfer = methodStory('u1-remainder')!.transfer!;
    expect(
      transfer.nodes.filter((n) => n.kind === 'rect').length * 16 +
        transfer.nodes.filter((n) => n.kind === 'dot').length,
    ).toBe(203);
  });
  it('changes the fenced boundary when the wall moves instead of teaching a memorized formula', () => {
    const story = methodStory('u2-fence')!;
    const originalWall = story.frames[0].nodes.find((n) => n.kind === 'line' && n.dashed)!;
    const movedWall = story.transfer!.nodes.find((n) => n.kind === 'line' && n.dashed)!;
    expect(originalWall).toMatchObject({ y: 60, y2: 60 });
    expect(movedWall).toMatchObject({ x: 70, x2: 70 });
    for (const nodes of [story.frames[0].nodes, story.transfer!.nodes]) {
      expect(nodes.filter((n) => n.kind === 'line' && !n.dashed)).toHaveLength(3);
    }
    expect(story.transfer!.right).toContain(String(10 * 2 + 8));
    expect(story.transfer!.wrong).toContain(String(10 + 8 * 2));
  });
  it('preserves the total while regrouping and reveals only computed dependency results', () => {
    const regrouping = methodStory('u3-inverse')!.frames;
    const before = regrouping[0].nodes.filter((n) => n.kind === 'rect');
    const after = regrouping[1].nodes.filter((n) => n.kind === 'rect');
    expect(before).toHaveLength(12);
    expect(after).toHaveLength(18);
    expect(before.reduce((sum, n) => sum + Number(n.label), 0)).toBe(360);
    expect(after.reduce((sum, n) => sum + Number(n.label), 0)).toBe(360);
    const order = methodStory('u4-order')!.frames;
    expect(order[0].nodes.some((n) => n.kind === 'rect' && n.label?.includes('72'))).toBe(false);
    expect(order[1].nodes.some((n) => n.kind === 'rect' && n.label?.includes('54'))).toBe(false);
    expect(order[2].nodes.some((n) => n.kind === 'rect' && n.label === '72 − 18 = 54')).toBe(true);
  });
  it('shows the mathematical reason behind high-risk mistakes', () => {
    expect(methodStory('u2-fence')!.frames[1].equation).toBe(`长 = 32 − 6 × 2 = ${32 - 6 * 2} 米`);
    expect(
      methodStory('u2-fence')!.mistake.nodes.some(
        (n) => n.kind === 'line' && n.dashed && n.tone === 'error',
      ),
    ).toBe(true);
    expect(methodStory('u1-loading')!.frames[2].equation).toContain(`${Math.ceil(157 / 24)} 辆`);
    expect(
      methodStory('u1-intervals')!.frames[1].nodes.filter((n) => n.kind === 'line'),
    ).toHaveLength(240 / 30 - 1);
    expect(methodStory('u2-units')!.frames[1].nodes.filter((n) => n.kind === 'rect')).toHaveLength(
      10 * 10,
    );
    expect(methodStory('u6-written')!.frames[2].equation).toBe(`4260 + 852 = ${213 * 24}`);
    expect(methodStory('u6-error')!.frames[2].equation).toBe(
      `204 × 27 = ${204 * 32 - (204 * 2 + 204 * 3)}`,
    );
    expect(methodStory('u5-rounding')!.frames[2].equation).toContain('7365000');
  });
});
