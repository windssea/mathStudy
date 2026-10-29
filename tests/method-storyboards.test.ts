import { describe, expect, it } from 'vitest';
import { methodStories, methodStory } from '@mathstudy/animation-engine';
import { practice } from '@mathstudy/content';

describe('visual methods', () => {
  it('covers every classified topic with three distinct deterministic frames and a misconception', () => {
    expect(Object.keys(methodStories).sort()).toEqual(practice.topics.map((t) => t.id).sort());
    for (const topic of practice.topics) {
      const story = methodStory(topic.id)!;
      expect(story.frames).toHaveLength(3);
      expect(new Set(story.frames.map((f) => JSON.stringify(f.nodes))).size).toBe(3);
      expect(story.mistake.right).not.toBe(story.mistake.wrong);
      expect(story.mistake.why.length).toBeGreaterThan(10);
      for (const frame of [...story.frames, { nodes: story.mistake.nodes }]) {
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
