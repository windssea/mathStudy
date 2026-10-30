import { describe, expect, it } from 'vitest';
import { unit12Stories as stories } from '../packages/animation-engine/src/methods-u12';
import type { MethodNode } from '../packages/animation-engine/src/method-primitives';

const upgraded = [
  'u1-mental',
  'u1-written',
  'u1-trial',
  'u1-order',
  'u1-units',
  'u1-restore',
  'u1-loading',
  'u1-intervals',
  'u1-changes',
  'u1-groups',
  'u2-meaning',
  'u2-units',
  'u2-grid',
  'u2-measure',
  'u2-cut',
  'u2-tiling',
  'u2-compare',
];
const rects = (nodes: MethodNode[]) =>
  nodes.filter((node): node is Extract<MethodNode, { kind: 'rect' }> => node.kind === 'rect');
const dots = (nodes: MethodNode[]) =>
  nodes.filter((node): node is Extract<MethodNode, { kind: 'dot' }> => node.kind === 'dot');
const lines = (nodes: MethodNode[]) =>
  nodes.filter((node): node is Extract<MethodNode, { kind: 'line' }> => node.kind === 'line');
const texts = (nodes: MethodNode[]) =>
  nodes.filter((node): node is Extract<MethodNode, { kind: 'text' }> => node.kind === 'text');
const inside = (
  point: { x: number; y: number },
  box: { x: number; y: number; w: number; h: number },
) => point.x > box.x && point.x < box.x + box.w && point.y > box.y && point.y < box.y + box.h;
const length = (edge: Extract<MethodNode, { kind: 'line' }>) =>
  Math.hypot(edge.x2 - edge.x, edge.y2 - edge.y);
const packetCount = (nodes: MethodNode[]) => rects(nodes).filter((node) => node.h === 45).length;

describe('unit 1 and 2 object-based method teaching', () => {
  it.each([...upgraded, 'u1-remainder', 'u2-fence'])(
    '%s has a complete changed-context check and a distinct visible mistake',
    (id) => {
      const method = stories[id];
      expect(method.frames.length).toBeGreaterThanOrEqual(3);
      expect(method.frames.length).toBeLessThanOrEqual(6);
      for (const check of [method.mistake, method.transfer!]) {
        expect(check.question.length).toBeGreaterThan(12);
        expect(check.right).not.toBe(check.wrong);
        expect(check.why.length).toBeGreaterThan(15);
        expect(check.wrongNodes?.some((node) => node.tone === 'error')).toBe(true);
        expect(
          check.wrongNodes?.some((node) => node.kind !== 'text' && node.tone === 'error'),
        ).toBe(true);
        expect(check.wrongNodes).not.toEqual(check.nodes);
      }
    },
  );
  it('preserves all 63 tens while forming seven groups of nine, then transfers to nine groups of eight', () => {
    const method = stories['u1-mental'];
    expect(dots(method.frames[0].nodes)).toHaveLength(63);
    const grouped = method.frames[1].nodes;
    expect(rects(grouped)).toHaveLength(7);
    for (const box of rects(grouped))
      expect(dots(grouped).filter((point) => inside(point, box))).toHaveLength(9);
    expect(7 * 9 * 10).toBe(630);
    expect(rects(method.transfer!.nodes)).toHaveLength(9);
    for (const box of rects(method.transfer!.nodes))
      expect(dots(method.transfer!.nodes).filter((point) => inside(point, box))).toHaveLength(8);
    expect(9 * 8 * 10).toBe(720);
  });
  it('keeps tens and ones distinct, including the empty ones place in a quotient', () => {
    const method = stories['u1-written'];
    expect(texts(method.frames[0].nodes).filter((node) => node.text === '10份')).toHaveLength(2);
    expect(packetCount(method.frames[2].nodes)).toBe(21);
    expect(24 * 21).toBe(504);
    const correct = rects(method.frames[3].nodes);
    const tens = correct.find((node) => node.label === '2')!;
    const zero = correct.find((node) => node.label === '0')!;
    expect(tens.x).toBeLessThan(zero.x);
    const wrong = rects(method.mistake.wrongNodes!);
    expect(wrong.find((node) => node.label === '2')!.x).toBe(zero.x);
    expect(wrong.some((node) => node.label === '0')).toBe(false);
    expect(30 * 20 + 12).toBe(612);
    expect(40 * 20 + 16).toBe(816);
  });
  it('adds a real sixth group when the trial remainder can still contain the divisor', () => {
    const method = stories['u1-trial'];
    expect(packetCount(method.frames[0].nodes)).toBe(5);
    expect(texts(method.frames[0].nodes).some((node) => node.text.includes('余32'))).toBe(true);
    expect(texts(method.frames[1].nodes).some((node) => node.text.includes('余0'))).toBe(false);
    const remaining = rects(method.frames[1].nodes).find((node) => node.w === 128)!;
    const split = lines(method.frames[1].nodes).find((node) => node.x === 247)!;
    expect((split.x - remaining.x) / (remaining.x + remaining.w - split.x)).toBe(28 / 4);
    expect(packetCount(method.frames[2].nodes)).toBe(6);
    expect(dots(method.frames[2].nodes)).toHaveLength(4);
    expect(6 * 28 + 4).toBe(172);
    expect(packetCount(method.transfer!.nodes) * 32 + dots(method.transfer!.nodes).length).toBe(
      196,
    );
  });
  it('multiplies both group counts instead of dividing them', () => {
    const method = stories['u1-order'];
    const small = (nodes: MethodNode[]) => rects(nodes).filter((node) => node.h === 22);
    expect(rects(method.frames[0].nodes)).toHaveLength(8);
    expect(small(method.frames[1].nodes)).toHaveLength(6);
    expect(small(method.frames[2].nodes)).toHaveLength(48);
    expect(48 * 10).toBe(480);
    expect(small(method.mistake.wrongNodes!)).toHaveLength(0);
    expect(small(method.transfer!.nodes)).toHaveLength(18);
    expect(18 * 20).toBe(360);
  });
  it('uses six ten-minute segments per hour and twenty-four hours per day', () => {
    const method = stories['u1-units'];
    const boxes = rects(method.frames[1].nodes).filter((node) => node.h === 140);
    const segments = rects(method.frames[1].nodes).filter((node) => node.h === 19);
    expect(boxes).toHaveLength(7);
    for (const box of boxes)
      expect(
        segments.filter((segment) => segment.x > box.x && segment.x < box.x + box.w),
      ).toHaveLength(6);
    expect(segments.length * 10).toBe(420);
    expect(packetCount(method.transfer!.nodes)).toBe(288 / 24);
    expect(288 % 24).toBe(0);
    expect(method.transfer!.right).toContain('12日');
  });
  it('reconstructs the invariant dividend using the wrong divisor before changing the grouping', () => {
    const method = stories['u1-restore'];
    expect(packetCount(method.frames[0].nodes) * 23 + dots(method.frames[0].nodes).length).toBe(
      373,
    );
    expect(packetCount(method.frames[2].nodes) * 32 + dots(method.frames[2].nodes).length).toBe(
      373,
    );
    expect(dots(method.frames[2].nodes).length).toBeLessThan(32);
    expect(rects(method.mistake.wrongNodes!).some((node) => node.tone === 'error')).toBe(true);
    expect(32 * 16 + 5 - 373).toBe(144);
    expect(packetCount(method.transfer!.nodes) * 72 + dots(method.transfer!.nodes).length).toBe(
      298,
    );
    expect(298 - (27 * 4 + 10)).toBe(180);
  });
  it('moves all 157 passenger dots inside seven buses and adds no bus for exact division', () => {
    const method = stories['u1-loading'];
    const buses = (nodes: MethodNode[]) =>
      rects(nodes).filter((node) => node.w === 88 && node.h === 80);
    const before = method.frames[0].nodes,
      after = method.frames[2].nodes;
    expect(dots(before)).toHaveLength(157);
    expect(dots(after)).toHaveLength(157);
    expect(buses(before)).toHaveLength(6);
    expect(buses(after)).toHaveLength(7);
    expect(
      dots(before).filter((point) => !buses(before).some((box) => inside(point, box))),
    ).toHaveLength(13);
    expect(
      dots(after).filter((point) => !buses(after).some((box) => inside(point, box))),
    ).toHaveLength(0);
    expect(buses(method.transfer!.nodes)).toHaveLength(4);
    expect(dots(method.transfer!.nodes)).toHaveLength(96);
    const extra = buses(method.transfer!.wrongNodes!).at(-1)!;
    expect(dots(method.transfer!.wrongNodes!).filter((point) => inside(point, extra))).toHaveLength(
      0,
    );
  });
  it('counts only internal cuts and exposes the extra cut at an original endpoint', () => {
    const method = stories['u1-intervals'];
    const correct = lines(method.frames[1].nodes);
    expect(rects(method.frames[1].nodes)).toHaveLength(8);
    expect(correct).toHaveLength(7);
    expect(correct.every((edge) => edge.x > 24 && edge.x < 376)).toBe(true);
    expect(lines(method.mistake.wrongNodes!).filter((edge) => edge.x === 376)).toHaveLength(1);
    expect(lines(method.transfer!.nodes)).toHaveLength(180 / 20 - 1);
  });
  it('distinguishes doubling the total from doubling both total and group size', () => {
    const frames = stories['u1-changes'].frames;
    const containers = (nodes: MethodNode[]) => rects(nodes).filter((node) => node.w === 48);
    const chunks = (nodes: MethodNode[]) => rects(nodes).filter((node) => node.w === 42);
    expect(containers(frames[0].nodes)).toHaveLength(12);
    expect(containers(frames[1].nodes)).toHaveLength(24);
    expect(containers(frames[2].nodes)).toHaveLength(12);
    expect(chunks(frames[0].nodes).length * 35).toBe(420);
    expect(chunks(frames[1].nodes).length * 35).toBe(840);
    expect(chunks(frames[2].nodes).length * 35).toBe(840);
    for (const box of containers(frames[2].nodes))
      expect(
        chunks(frames[2].nodes).filter((chunk) => inside({ x: chunk.x + 1, y: chunk.y + 1 }, box)),
      ).toHaveLength(2);
  });
  it('counts every shelf level and shows the duplicated books when a grouping level is omitted', () => {
    const method = stories['u1-groups'];
    const levels = (nodes: MethodNode[]) => rects(nodes).filter((node) => node.h < 150);
    expect(levels(method.frames[2].nodes)).toHaveLength(8);
    expect(levels(method.mistake.wrongNodes!)).toHaveLength(16);
    expect(8 * 30).toBe(240);
    expect(16 * 30).toBe(480);
    expect(levels(method.transfer!.nodes)).toHaveLength(15);
    expect(levels(method.transfer!.wrongNodes!)).toHaveLength(45);
    expect(15 * 28).toBe(420);
  });
  it('measures the same seven-by-four object as a boundary or as twenty-eight surface units', () => {
    const method = stories['u2-meaning'];
    const edge = method.frames[0].nodes,
      face = method.frames[2].nodes;
    expect(
      lines(edge)
        .filter((node) => node.tone === 'focus')
        .reduce((sum, node) => sum + length(node), 0) / 35,
    ).toBe(22);
    expect(rects(face).filter((node) => node.tone === 'focus')).toHaveLength(28);
    expect(rects(method.mistake.wrongNodes!).filter((node) => node.tone === 'focus')).toHaveLength(
      0,
    );
    expect(
      lines(method.transfer!.nodes)
        .filter((node) => node.tone === 'focus')
        .reduce((sum, node) => sum + length(node), 0) / 35,
    ).toBe(22);
  });
  it('counts both dimensions of area-unit conversion, including mixed units', () => {
    const method = stories['u2-units'];
    expect(rects(method.frames[0].nodes).filter((node) => node.tone === 'focus')).toHaveLength(10);
    expect(rects(method.frames[1].nodes)).toHaveLength(100);
    expect(rects(method.frames[1].nodes).filter((node) => node.tone === 'focus')).toHaveLength(100);
    expect(rects(method.frames[2].nodes)).toHaveLength(340);
    expect(rects(method.transfer!.nodes)).toHaveLength(230);
    expect(rects(method.transfer!.wrongNodes!)).toHaveLength(50);
    expect(230 - 50).toBe(180);
  });
  it('removes both copies of shared internal edges, including in an L-shaped transfer', () => {
    const method = stories['u2-grid'];
    expect(rects(method.frames[0].nodes)).toHaveLength(24);
    expect(
      lines(method.mistake.nodes)
        .filter((edge) => edge.tone === 'focus')
        .reduce((sum, edge) => sum + length(edge), 0) / 100,
    ).toBe(6);
    expect(lines(method.mistake.wrongNodes!).filter((edge) => edge.tone === 'error')).toHaveLength(
      2,
    );
    expect(rects(method.transfer!.nodes)).toHaveLength(3);
    expect(lines(method.transfer!.nodes).reduce((sum, edge) => sum + length(edge), 0) / 60).toBe(8);
    expect(
      lines(method.transfer!.wrongNodes!).filter((edge) => edge.tone === 'error'),
    ).toHaveLength(4);
  });
  it('takes half the perimeter before subtracting the length to recover width', () => {
    const method = stories['u2-measure'];
    expect(rects(method.frames[0].nodes).filter((node) => node.tone === 'focus')).toHaveLength(9);
    expect(rects(method.frames[1].nodes).filter((node) => node.tone === 'focus')).toHaveLength(45);
    expect(rects(method.frames[3].nodes)).toHaveLength(14);
    expect(rects(method.frames[3].nodes).filter((node) => node.tone === 'focus')).toHaveLength(5);
    expect(rects(method.mistake.wrongNodes!).filter((node) => node.tone === 'error')).toHaveLength(
      19,
    );
    expect(rects(method.transfer!.nodes).filter((node) => node.tone === 'focus')).toHaveLength(6);
  });
  it('preserves perimeter for a corner cut but adds two depths for a middle notch', () => {
    const method = stories['u2-cut'];
    expect(rects(method.frames[0].nodes)).toHaveLength(96);
    expect(rects(method.frames[0].nodes).filter((node) => node.tone === 'error')).toHaveLength(12);
    expect(rects(method.frames[1].nodes)).toHaveLength(84);
    const edges = lines(method.frames[2].nodes);
    expect(
      edges.filter((edge) => edge.tone === 'focus').reduce((sum, edge) => sum + length(edge), 0) /
        17.5,
    ).toBe(7);
    expect(
      edges.filter((edge) => edge.tone === 'error').reduce((sum, edge) => sum + length(edge), 0) /
        17.5,
    ).toBe(7);
    expect(
      edges.filter((edge) => !edge.dashed).reduce((sum, edge) => sum + length(edge), 0) / 17.5,
    ).toBe(40);
    expect(rects(method.transfer!.nodes)).toHaveLength(56);
    expect(lines(method.transfer!.nodes).reduce((sum, edge) => sum + length(edge), 0) / 22).toBe(
      36,
    );
  });
  it('uses six hundred actual square tiles and rejects an integer area ratio with incompatible side lengths', () => {
    const method = stories['u2-tiling'];
    expect(rects(method.frames[1].nodes)).toHaveLength(600);
    expect(rects(method.frames[1].nodes).filter((node) => node.tone === 'focus')).toHaveLength(30);
    expect(600 * 3).toBe(1800);
    expect(rects(method.mistake.nodes)).toHaveLength(4);
    expect(rects(method.mistake.wrongNodes!)).toHaveLength(2);
    const transfer = rects(method.transfer!.nodes),
      squares = transfer.filter((node) => node.w === node.h);
    expect(squares).toHaveLength(6);
    const strip = transfer.find((node) => node.tone === 'warm')!;
    expect((strip.w * strip.h) / (24 * 24)).toBe(12);
    expect(squares.length * 4 + 12).toBe(12 * 3);
    const falseTiles = rects(method.transfer!.wrongNodes!);
    expect(falseTiles).toHaveLength(9);
    expect(falseTiles.every((node) => node.w !== node.h)).toBe(true);
    expect((falseTiles[0].w * falseTiles[0].h) / (24 * 24)).toBe(4);
  });
  it('compares areas on one scale and shows that equal area does not imply equal perimeter', () => {
    const method = stories['u2-compare'];
    const nodes = method.frames[3].nodes;
    expect(rects(nodes).filter((node) => node.x < 200)).toHaveLength(40);
    expect(rects(nodes).filter((node) => node.x >= 250)).toHaveLength(49);
    expect(rects(nodes).filter((node) => node.x >= 250 && node.tone === 'focus')).toHaveLength(9);
    const transfer = method.transfer!.nodes;
    expect(rects(transfer).filter((node) => node.x < 200)).toHaveLength(24);
    expect(rects(transfer).filter((node) => node.x >= 200)).toHaveLength(24);
    expect(
      lines(transfer)
        .filter((node) => node.x < 200 && node.x2 < 200)
        .reduce((sum, node) => sum + length(node), 0) / 14,
    ).toBe(20);
    expect(
      lines(transfer)
        .filter((node) => node.x >= 200 && node.x2 >= 200)
        .reduce((sum, node) => sum + length(node), 0) / 14,
    ).toBe(28);
    expect(
      lines(method.transfer!.wrongNodes!)
        .filter((node) => node.tone === 'error')
        .reduce((sum, node) => sum + length(node), 0) / 14,
    ).toBe(8);
  });
});
