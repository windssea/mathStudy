import { describe, expect, it } from 'vitest';
import { practice, questions } from '@mathstudy/content';
import {
  round2U12QuestionSubskills,
  round2U12SubskillStories,
} from '../packages/animation-engine/src/method-round2-u12';
import type { MethodNode } from '@mathstudy/animation-engine';

const rectangles = (nodes: MethodNode[]) => nodes.filter((n) => n.kind === 'rect');
const contents = (nodes: MethodNode[]) =>
  nodes
    .flatMap((n) => (n.kind === 'text' ? [n.text] : n.kind === 'rect' && n.label ? [n.label] : []))
    .join(';');
const sumLabels = (nodes: MethodNode[]) =>
  rectangles(nodes).reduce((sum, n) => sum + Number(n.label ?? 0), 0);

describe('remaining U01–U02 teaching relationships', () => {
  it('matches only explicitly reviewed existing topic members', () => {
    const keys = new Set<string>();
    let count = 0;
    for (const [topicId, map] of Object.entries(round2U12QuestionSubskills)) {
      const topic = practice.topics.find((t) => t.id === topicId)!;
      expect(topic).toBeDefined();
      for (const [id, key] of Object.entries(map)) {
        expect(topic.questionIds, id).toContain(id);
        expect(
          questions.some((q) => q.id === id),
          id,
        ).toBe(true);
        expect(round2U12SubskillStories[key], id).toBeDefined();
        keys.add(key);
        count++;
      }
    }
    expect(count).toBe(68);
    expect([...keys].sort()).toEqual(Object.keys(round2U12SubskillStories).sort());
  });
  it('uses arithmetic stories for the sixteen calculations classified under measurement', () => {
    const map = round2U12QuestionSubskills['u2-measure'];
    const arithmetic = Object.entries(map).filter(([id]) => id.startsWith('full-p02-s2-q1-'));
    expect(arithmetic).toHaveLength(16);
    expect(map['full-p02-s2-q1-16']).toBe('r2-measure-zero-product');
    expect(map['full-p02-s2-q1-12']).toBe('r2-measure-continuous-division');
    expect(map['full-p02-s2-q1-3']).toBe('r2-measure-division');
    expect(map['full-p02-s2-q1-1']).toBe('r2-measure-product');
    for (const key of new Set(arithmetic.map(([, key]) => key))) {
      const story = round2U12SubskillStories[key];
      expect(story.prompt).not.toMatch(/长方形|周长|平方米/);
      expect(story.transfer).toBeDefined();
    }
  });
  it('uses distinct operations and complete visual corrections within the shared canvas', () => {
    for (const [key, story] of Object.entries(round2U12SubskillStories)) {
      expect(story.frames.length, key).toBeGreaterThanOrEqual(3);
      expect(new Set(story.frames.map((f) => JSON.stringify(f.nodes))).size, key).toBe(
        story.frames.length,
      );
      expect(story.mistake.nodes, key).not.toEqual(story.mistake.wrongNodes);
      expect(story.transfer, key).toBeDefined();
      expect(story.transfer!.nodes, key).not.toEqual(story.transfer!.wrongNodes);
      for (const nodes of [
        ...story.frames.map((f) => f.nodes),
        story.mistake.nodes,
        story.mistake.wrongNodes!,
        story.transfer!.nodes,
        story.transfer!.wrongNodes!,
      ]) {
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
  it('compares ages by year-sized week groups rather than leaking the formal 540-week answer', () => {
    const story = round2U12SubskillStories['r2-age-scale'];
    const years = rectangles(story.frames[1].nodes);
    expect(years).toHaveLength(9);
    expect(years.every((n) => n.label === '52周')).toBe(true);
    expect(9 * 52).toBe(468);
    expect(JSON.stringify(story)).not.toContain('540');
    expect(rectangles(story.transfer!.nodes)).toHaveLength(8);
    expect(contents(story.mistake.wrongNodes!)).not.toContain('约9年');
  });
  it('separates length progressions from time progressions', () => {
    const story = round2U12SubskillStories['r2-mixed-units'];
    expect(rectangles(story.frames[1].nodes)).toHaveLength(12);
    expect(sumLabels(story.frames[1].nodes)).toBe(1200);
    expect(rectangles(story.mistake.wrongNodes!)).toHaveLength(20);
    expect(sumLabels(story.mistake.wrongNodes!)).toBe(1200);
    expect(sumLabels(story.transfer!.nodes)).toBe(600);
    expect(contents(story.frames[0].nodes)).toContain('24时');
    expect(contents(story.frames[0].nodes)).toContain('100厘米');
  });
  it('scales each remainder object as well as each full group', () => {
    const story = round2U12SubskillStories['r2-scaled-remainder'];
    expect(
      sumLabels(story.frames[0].nodes) +
        story.frames[0].nodes.filter((n) => n.kind === 'dot').length,
    ).toBe(59);
    expect(sumLabels(story.frames[1].nodes)).toBe(590);
    expect(rectangles(story.frames[1].nodes).filter((n) => n.label === '70')).toHaveLength(8);
    expect(rectangles(story.frames[1].nodes).filter((n) => n.label === '10')).toHaveLength(3);
    expect(
      sumLabels(story.mistake.wrongNodes!) +
        story.mistake.wrongNodes!.filter((n) => n.kind === 'dot').length,
    ).toBe(563);
    expect(sumLabels(story.transfer!.nodes)).toBe(5900);
    expect(story.frames[3].why).toContain('余30也变成3');
    expect(story.frames[3].equation).toContain('8……3');
  });
  it('includes the divisor itself as the extra equal part in a three-number sum', () => {
    const story = round2U12SubskillStories['r2-division-sum'];
    const parts = rectangles(story.frames[2].nodes);
    expect(parts).toHaveLength(6);
    expect(sumLabels(story.frames[2].nodes)).toBe(95 - 5);
    expect(parts.slice(0, 5).reduce((sum, n) => sum + Number(n.label), 0)).toBe(75);
    expect(75 + 15 + 5).toBe(95);
    expect(sumLabels(story.mistake.wrongNodes!)).toBe(108);
    expect(sumLabels(story.transfer!.nodes)).toBe(104 - 4);
  });
  it('matches changed total to changed number of groups, not one divisor', () => {
    const story = round2U12SubskillStories['r2-same-remainder-difference'];
    const extra = rectangles(story.frames[1].nodes).filter((n) => n.tone === 'focus');
    expect(extra).toHaveLength(2);
    expect(extra.reduce((sum, n) => sum + Number(n.label), 0)).toBe(205 - 175);
    expect(175 % 15).toBe(205 % 15);
    expect(sumLabels(story.transfer!.nodes)).toBe(194 - 158);
    expect(sumLabels(story.transfer!.wrongNodes!)).toBe(108);
  });
  it('pairs materials to the bottleneck count and leaves unusable extras', () => {
    const story = round2U12SubskillStories['r2-material-bottleneck'];
    const paired = rectangles(story.frames[2].nodes);
    expect(paired.filter((n) => n.tone === 'focus')).toHaveLength(15 * 3);
    expect(paired.filter((n) => n.tone === 'quiet')).toHaveLength(6);
    expect(rectangles(story.transfer!.nodes).filter((n) => n.tone === 'focus')).toHaveLength(
      12 * 3,
    );
    expect(story.transfer!.why).toContain('101÷8＝12余5');
    expect(contents(story.transfer!.nodes)).toContain('余5克');
    expect(rectangles(story.mistake.wrongNodes!).filter((n) => n.tone === 'error')).toHaveLength(
      51,
    );
  });
  it('counts one carrying distance per active person before averaging', () => {
    const story = round2U12SubskillStories['r2-shared-carrying'];
    expect(sumLabels(story.frames[0].nodes)).toBe(0);
    expect(sumLabels(story.frames[1].nodes)).toBe(360 * 2);
    expect(sumLabels(story.frames[2].nodes)).toBe(360 * 2);
    expect(rectangles(story.frames[2].nodes)).toHaveLength(3);
    expect(rectangles(story.frames[2].nodes).every((n) => n.label === '240')).toBe(true);
    expect(sumLabels(story.transfer!.nodes)).toBe(320 * 3);
  });
  it('turns one minute of moving distance and width into area, then repeats the area', () => {
    const story = round2U12SubskillStories['r2-moving-area'];
    const strip = rectangles(story.frames[0].nodes)[0];
    expect(strip.w / strip.h).toBeCloseTo(20 / 3);
    expect(sumLabels(story.frames[2].nodes)).toBe(20 * 3 * 10);
    expect(sumLabels(story.transfer!.nodes)).toBe(25 * 4 * 8);
    expect(rectangles(story.mistake.wrongNodes!)).toHaveLength(0);
  });
  it('uses three equal fence sides while preserving a true square interior', () => {
    const story = round2U12SubskillStories['r2-square-wall'];
    const square = rectangles(story.frames[2].nodes)[0];
    expect(square.w).toBe(square.h);
    expect(
      story.frames[2].nodes.filter((n) => n.kind === 'line' && n.tone === 'focus'),
    ).toHaveLength(3);
    expect(story.frames[2].equation).toContain('324');
    expect(story.frames[3].equation).toContain('1620');
    expect(contents(story.mistake.wrongNodes!)).not.toContain('18米');
  });
  it('counts every outside edge and the interior divider exactly once', () => {
    const story = round2U12SubskillStories['r2-shared-fence'];
    const right = story.frames[2].nodes
      .filter((n) => n.kind === 'line')
      .filter((n) => n.tone === 'focus');
    const sum = right.reduce((total, n) => total + Math.hypot(n.x2 - n.x, n.y2 - n.y), 0);
    expect(right).toHaveLength(5);
    expect(sum / (220 / 30)).toBeCloseTo(114);
    expect(
      story.mistake.wrongNodes!.filter((n) => n.kind === 'line' && n.tone === 'error'),
    ).toHaveLength(2);
    expect(story.transfer!.right).toContain('104');
  });
  it('scales both row and column counts rather than filling only one strip', () => {
    const story = round2U12SubskillStories['r2-square-scale'];
    expect(rectangles(story.frames[2].nodes).filter((n) => n.tone === 'known')).toHaveLength(9);
    expect(rectangles(story.frames[2].nodes).filter((n) => n.tone === 'focus')).toHaveLength(36);
    expect(rectangles(story.mistake.wrongNodes!).filter((n) => n.tone === 'focus')).toHaveLength(
      18,
    );
    expect(rectangles(story.transfer!.nodes).filter((n) => n.tone === 'known')).toHaveLength(4);
    expect(rectangles(story.transfer!.nodes).filter((n) => n.tone === 'focus')).toHaveLength(36);
  });
  it('normalizes to one person and includes equality in a minimum-space requirement', () => {
    const story = round2U12SubskillStories['r2-area-per-person'];
    expect(rectangles(story.frames[2].nodes)).toHaveLength(72 / 12 + 100 / 20);
    expect(story.frames[2].equation).toContain('乙更拥挤');
    expect(story.frames[3].equation).toContain('5≥5');
    expect(rectangles(story.transfer!.nodes)).toHaveLength(60 / 10 + 96 / 12);
    expect(story.transfer!.right).toContain('甲');
  });
  it('compensates the excess over a fair half, rather than the full allocation difference', () => {
    const story = round2U12SubskillStories['r2-equal-payment-compensation'];
    expect(rectangles(story.frames[1].nodes).filter((n) => n.dashed)).toHaveLength(9);
    expect(rectangles(story.frames[1].nodes).filter((n) => n.tone === 'warm')).toHaveLength(9);
    expect(rectangles(story.frames[2].nodes)).toHaveLength((24 - 6) / 2);
    expect(sumLabels(story.frames[2].nodes)).toBe(108);
    expect(rectangles(story.mistake.wrongNodes!)).toHaveLength(18);
    expect(rectangles(story.transfer!.nodes)).toHaveLength((22 - 8) / 2);
    expect(sumLabels(story.transfer!.nodes)).toBe(70);
    expect(story.transfer!.right).toContain('10元');
  });
  it('unrolls every actual polygon side instead of assuming opposite sides are equal', () => {
    const story = round2U12SubskillStories['r2-polygon-boundary'];
    const triangle = story.frames[0].nodes.filter((n) => n.kind === 'line');
    expect(triangle).toHaveLength(3);
    expect(
      triangle.reduce((sum, n) => sum + Math.hypot(n.x2 - n.x, n.y2 - n.y), 0) / 22,
    ).toBeCloseTo(30);
    expect(story.frames[2].equation).toContain('30厘米');
    expect(story.frames[3].equation).toContain('4×6＝24');
    expect(story.transfer!.right).toContain('17厘米');
    expect(contents(story.transfer!.wrongNodes!)).toContain('14厘米');
  });
  it('enumerates the fixed semiperimeter once and includes the minimum area itself', () => {
    const story = round2U12SubskillStories['r2-perimeter-area-filter'];
    expect(round2U12QuestionSubskills['u2-units']['u2-21']).toBe('r2-perimeter-area-filter');
    const candidates = rectangles(story.frames[1].nodes);
    expect(candidates).toHaveLength(5);
    for (const candidate of candidates) expect((candidate.w + candidate.h) / 6).toBe(10);
    expect(rectangles(story.frames[2].nodes).filter((n) => n.tone === 'focus')).toHaveLength(4);
    expect(rectangles(story.transfer!.nodes).filter((n) => n.tone === 'focus')).toHaveLength(3);
    expect(rectangles(story.transfer!.wrongNodes!).filter((n) => n.tone === 'focus')).toHaveLength(
      2,
    );
    expect(story.transfer!.why).toContain('至少14包括14');
    expect(story.prompt).not.toContain('50');
    expect(story.prompt).not.toContain('30厘米');
  });
});
