import { describe, expect, it } from 'vitest';
import { unit12Stories as stories } from '../packages/animation-engine/src/methods-u12';
import { methodSubskillStories } from '../packages/animation-engine/src/method-subskills';
import type { MethodNode } from '../packages/animation-engine/src/method-primitives';

const rects = (nodes: MethodNode[]) =>
  nodes.filter((n): n is Extract<MethodNode, { kind: 'rect' }> => n.kind === 'rect');
const lines = (nodes: MethodNode[]) =>
  nodes.filter((n): n is Extract<MethodNode, { kind: 'line' }> => n.kind === 'line');
const texts = (nodes: MethodNode[]) =>
  nodes.filter((n): n is Extract<MethodNode, { kind: 'text' }> => n.kind === 'text');
const dots = (nodes: MethodNode[]) => nodes.filter((n) => n.kind === 'dot');
const edgeLength = (nodes: MethodNode[]) =>
  lines(nodes).reduce((sum, edge) => sum + Math.hypot(edge.x2 - edge.x, edge.y2 - edge.y), 0);

describe('unit 1/2 teaching review regressions', () => {
  it('keeps the original rectangle intact until the marked corner has been removed', () => {
    const [mark, remove, compare] = stories['u2-cut'].frames;
    expect(rects(mark.nodes)).toHaveLength(96);
    expect(rects(mark.nodes).filter((n) => n.tone === 'error')).toHaveLength(12);
    expect(lines(mark.nodes)).toHaveLength(4);
    expect(lines(mark.nodes).every((n) => n.tone === 'known' && !n.dashed)).toBe(true);
    expect(edgeLength(mark.nodes) / 17.5).toBe(40);
    expect(texts(mark.nodes).some((n) => n.text.includes('96格'))).toBe(true);
    expect(texts(mark.nodes).some((n) => n.text.includes('留下84'))).toBe(false);
    expect(rects(remove.nodes)).toHaveLength(84);
    expect(lines(remove.nodes)).toHaveLength(6);
    expect(lines(remove.nodes).every((n) => n.tone === 'known')).toBe(true);
    expect(lines(compare.nodes).filter((n) => n.tone === 'focus')).toHaveLength(2);
    expect(lines(compare.nodes).filter((n) => n.tone === 'error')).toHaveLength(2);
  });

  it('shows equal boundaries before revealing each area, then the nine extra cells', () => {
    const [boundary, leftArea, rightArea, difference] = stories['u2-compare'].frames;
    expect(lines(boundary.nodes).filter((n) => n.tone === 'focus')).toHaveLength(8);
    const leftEdges = lines(boundary.nodes).filter((n) => n.x < 200 && n.x2 < 200);
    const rightEdges = lines(boundary.nodes).filter((n) => n.x >= 200 && n.x2 >= 200);
    expect(edgeLength(leftEdges) / 15).toBe(28);
    expect(edgeLength(rightEdges) / 15).toBe(28);
    const labels = (nodes: MethodNode[]) =>
      texts(nodes)
        .map((n) => n.text)
        .join(' ');
    expect(labels(boundary.nodes)).not.toMatch(/40格|49格/);
    expect(labels(leftArea.nodes)).toContain('40格');
    expect(labels(leftArea.nodes)).not.toContain('49格');
    expect(labels(rightArea.nodes)).toContain('49格');
    expect(rects(difference.nodes).filter((n) => n.x >= 250 && n.tone === 'focus')).toHaveLength(9);
  });

  it('repairs a maximum-remainder mistake with thirteen loose objects, not a full group of fourteen', () => {
    const check = methodSubskillStories['largest-remainder'].mistake;
    expect(dots(check.nodes)).toHaveLength(13);
    expect(dots(check.wrongNodes!)).toHaveLength(14);
    expect(rects(check.nodes)).toHaveLength(7);
    expect(rects(check.wrongNodes!)).toHaveLength(7);
    expect(texts(check.nodes).some((n) => n.text.includes('剩下 13'))).toBe(true);
    expect(7 * 14 + dots(check.nodes).length).toBe(111);
  });

  it('uses one readable conclusion under the seven hour boxes', () => {
    const footer = texts(stories['u1-units'].frames[2].nodes).filter((n) => n.y >= 200);
    expect(footer).toHaveLength(1);
    expect(footer[0].text).toContain('7时 = 420分');
    expect(footer[0].y).toBeGreaterThan(220);
  });

  it('replaces the original diagram footer instead of stacking an error caption over it', () => {
    const story = stories['u2-meaning'];
    for (const check of [story.mistake, story.transfer!]) {
      const footers = texts(check.wrongNodes!).filter((n) => n.y >= 210);
      expect(footers).toHaveLength(1);
      expect(footers[0].tone).toBe('error');
    }
  });

  it.each([
    ['u2-fence', ['32', '6', '靠墙']],
    ['u1-trial', ['172', '28']],
    ['u1-restore', ['32', '23', '16', '5']],
    ['u2-meaning', ['7', '4', '厘米']],
    ['u2-cut', ['12', '8', '4', '3']],
    ['u2-compare', ['10', '4', '7', '28']],
  ] as const)('%s check supplies its own quantities when the example is hidden', (id, knowns) => {
    for (const known of knowns) expect(stories[id].mistake.question).toContain(known);
    expect(stories[id].mistake.question).not.toMatch(/这个|这里|两种方案/);
  });
});
