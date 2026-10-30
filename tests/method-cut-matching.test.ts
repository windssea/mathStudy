import { describe, expect, it } from 'vitest';
import { practice } from '@mathstudy/content';
import {
  cutQuestionSubskills as links,
  cutSubskillStories as stories,
} from '../packages/animation-engine/src/method-cut-subskills';
import type { MethodNode } from '../packages/animation-engine/src/method-primitives';

const rects = (nodes: MethodNode[]) =>
  nodes.filter((n): n is Extract<MethodNode, { kind: 'rect' }> => n.kind === 'rect');
const lines = (nodes: MethodNode[]) =>
  nodes.filter((n): n is Extract<MethodNode, { kind: 'line' }> => n.kind === 'line');

describe('cut and composition question-to-method matching', () => {
  it('assigns all 45 existing cut-topic IDs explicitly to a real relation', () => {
    const topic = practice.topics.find((t) => t.id === 'u2-cut')!;
    expect(Object.keys(links).sort()).toEqual([...topic.questionIds].sort());
    expect(topic.questionIds).toHaveLength(45);
    for (const key of Object.values(links)) expect(stories[key], key).toBeTruthy();
  });
  it('does not teach corner invariance for protrusions, notches, overlaps or uncertain lengths', () => {
    expect(links['full-p01-s3-q1-3']).toBe('cut-bump');
    expect(links['full-p10-s3-q2']).toBe('cut-notch');
    expect(links['full-p05-s2-q4']).toBe('cut-position-compare');
    expect(links['full-p02-s2-q2-2']).toBe('cut-unknown-area');
    expect(links['full-p10-s1-q9']).toBe('cut-overlap-perimeter');
    expect(links['full-p18-q30-2']).toBe('cut-area-restore');
    expect(links['full-p05-s2-q5']).toBe('cut-strip-area');
    expect(links['full-p01-s5-q3']).toBe('cut-join-options');
  });
  it('adds exactly two bump heights and separately combines the two areas', () => {
    const story = stories['cut-bump'];
    const current = story.frames[2];
    const base = rects(current.nodes)[0];
    const scale = base.w / 14;
    const newEdges = lines(current.nodes).filter((n) => n.tone === 'focus');
    expect(newEdges).toHaveLength(2);
    expect(
      newEdges.reduce((sum, n) => sum + Math.hypot(n.x2 - n.x, n.y2 - n.y), 0) / scale,
    ).toBeCloseTo(6);
    expect(story.frames[2].equation).toContain('46');
    expect(story.frames[3].equation).toContain('96');
    const areas = rects(story.frames[3].nodes);
    expect((areas[0].w * areas[0].h) / (areas[1].w * areas[1].h)).toBeCloseTo(84 / 12);
  });
  it('distinguishes added boundary by cutting location and depth', () => {
    expect(stories['cut-position-compare'].frames.map((f) => f.equation)).toEqual([
      '剪角：周长32；面积56',
      '内部洞：周长32+8=40；面积56',
      '边上开口：周长32+4=36；面积56',
      '深4开口：周长40；面积仍56',
    ]);
    expect(stories['cut-notch'].frames[1].equation).toContain('2×2=4');
  });
  it('shows two genuine halves and uses geometrically square place holders', () => {
    const mid = rects(stories['cut-midpoints'].frames[2].nodes);
    expect((mid[1].w * mid[1].h) / (mid[0].w * mid[0].h)).toBeCloseTo(1 / 4);
    for (const tile of rects(stories['cut-sum-square-sides'].frames[1].nodes))
      expect(tile.w).toBe(tile.h);
    const reverse = stories['cut-reverse-squares'];
    expect(reverse.prompt).toContain('按图中位置');
    expect(reverse.mistake.question).toContain('最近正方形沿12边拼回');
    const missingPieces = rects(reverse.frames[0].nodes).filter((n) => n.dashed);
    expect(missingPieces).toHaveLength(2);
    expect(missingPieces.every((n) => n.w === n.h)).toBe(true);
  });
  it('actually removes all paired internal hexagon edges before counting the final boundary', () => {
    const story = stories['cut-hex-join'];
    expect(lines(story.frames[2].nodes)).toHaveLength(14);
    expect(lines(story.transfer!.nodes)).toHaveLength(18);
    const length = lines(story.frames[2].nodes).reduce(
      (sum, n) => sum + Math.hypot(n.x2 - n.x, n.y2 - n.y),
      0,
    );
    expect(length / 28).toBeCloseTo(14);
    expect(story.frames[1].nodes).not.toEqual(story.frames[2].nodes);
  });
  it('achieves the packing area upper bound and leaves only three square units unused', () => {
    const story = stories['cut-rotate-packing'];
    const placed = rects(story.frames[2].nodes).slice(1);
    expect(placed).toHaveLength(7);
    const total = rects(story.frames[2].nodes)[0];
    const used = placed.reduce((sum, n) => sum + n.w * n.h, 0);
    expect(used / (total.w * total.h)).toBeCloseTo(105 / 108);
    const last = rects(story.frames[3].nodes).filter((n) => n.tone === 'warm');
    expect(last).toHaveLength(3);
    expect(last.reduce((sum, n) => sum + n.w * n.h, 0) / (total.w * total.h)).toBeCloseTo(3 / 108);
    expect(story.frames[3].nodes).not.toEqual(story.frames[2].nodes);
  });
  it('preserves area and direction when restoring or shifting pieces', () => {
    expect(stories['cut-area-restore'].frames[2].equation).toContain('64+40=104');
    expect(stories['cut-strip-area'].transfer!.right).toContain('12');
    const cross = stories['cut-cross-road'];
    expect(cross.transfer!.wrong).toBe('50：只扣横带');
    expect((20 * 12 - 20 * 2) / 4).toBe(50);
    const wrong = rects(cross.mistake.wrongNodes!);
    expect(wrong[1].tone).toBe('focus');
    expect(wrong[2].tone).toBe('warm');
    const restoreWrong = stories['cut-area-restore'].transfer!.wrongNodes!;
    const value = restoreWrong.find((n) => n.kind === 'text' && n.text === '36')!;
    const subtract = rects(restoreWrong).find((n) => n.label === '误减24')!;
    expect(value.x + 18).toBeLessThan(subtract.x);
  });
});
