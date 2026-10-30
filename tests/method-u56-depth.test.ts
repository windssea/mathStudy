import { describe, expect, it } from 'vitest';
import { methodStory, type MethodNode } from '@mathstudy/animation-engine';
import { readChineseNumber } from '@mathstudy/math-core';

type Box = Extract<MethodNode, { kind: 'rect' }>;
const boxes = (nodes: MethodNode[], y?: number) =>
  nodes.filter((n): n is Box => n.kind === 'rect' && (y === undefined || n.y === y));
const digits = (nodes: MethodNode[], y = 80) =>
  boxes(nodes, y)
    .sort((a, b) => a.x - b.x)
    .map((n) => n.label ?? ' ')
    .join('');
const valueAt = (nodes: MethodNode[], y = 80) => Number(digits(nodes, y).trim());
const numericSum = (nodes: MethodNode[], y: number) =>
  boxes(nodes, y).reduce((sum, n) => sum + (/^\d+$/.test(n.label ?? '') ? Number(n.label) : 0), 0);
function extreme(chars: string, largest = false) {
  const values: number[] = [];
  const visit = (prefix: string, rest: string) => {
    if (!rest) {
      if (prefix[0] !== '0') values.push(Number(prefix));
      return;
    }
    for (let i = 0; i < rest.length; i++)
      visit(prefix + rest[i], rest.slice(0, i) + rest.slice(i + 1));
  };
  visit('', chars);
  return largest ? Math.max(...values) : Math.min(...values);
}
const dotValue = (nodes: MethodNode[]) =>
  nodes.reduce((sum, n) => sum + (n.kind === 'dot' ? (n.x < 200 ? 10 : 1) : 0), 0);

describe('unit 5 place value and representation depth', () => {
  it('places the same eight and six into invariant slots, then occupies all zero positions', () => {
    const { frames, mistake, transfer } = methodStory('u5-place')!;
    const empty = boxes(frames[1].nodes, 80),
      occupied = boxes(frames[2].nodes, 80);
    expect(empty.map((n) => [n.x, n.w])).toEqual(occupied.map((n) => [n.x, n.w]));
    expect(empty.filter((n) => n.label !== undefined).map((n) => n.label)).toEqual(['8', '6']);
    expect(occupied.map((n) => n.label).join('')).toBe(String(8 * 10 ** 7 + 6 * 10 ** 4));
    expect(occupied[3].x).toBe(empty[3].x);
    expect(valueAt(mistake.nodes)).toBe(80060000);
    expect(valueAt(mistake.wrongNodes!)).toBe(80006000);
    expect(valueAt(transfer!.nodes)).toBe(7 * 10 ** 6 + 4 * 10 ** 3);
    expect(valueAt(transfer!.wrongNodes!)).toBe(7 * 10 ** 6 + 4 * 10 ** 4);
    expect(frames[2].nodes.some((n) => n.kind === 'text' && n.text === '万级')).toBe(true);
    expect(frames[2].nodes.some((n) => n.kind === 'text' && n.text === '个级')).toBe(true);
  });

  it('keeps four written positions per level while Chinese reading merges consecutive zeros', () => {
    const story = methodStory('u5-reading')!;
    const code = digits(story.frames[2].nodes, 83);
    expect(code.slice(0, 4)).toBe('6003');
    expect(code.slice(4)).toBe('0008');
    expect(readChineseNumber(Number(code))).toBe('六千零三万零八');
    expect(code.split('0').length - 1).toBe(5);
    expect(story.frames[1].nodes.filter((n) => n.kind === 'rect' && n.dashed)).toHaveLength(5);
    expect(valueAt(story.mistake.wrongNodes!)).toBe(6003008);
    expect(readChineseNumber(Number(story.transfer!.right))).toBe('五千零二万零六');
    expect(Number(story.transfer!.right)).toBe(5002 * 10000 + 6);
    expect(digits(story.transfer!.nodes, 83)).toBe(story.transfer!.right);
  });

  it('moves each digit once and excludes leading zero arrangements from the six-digit extrema', () => {
    const story = methodStory('u5-compare')!;
    expect(valueAt(story.frames[0].nodes, 102)).toBe(extreme('003578', true));
    expect(valueAt(story.frames[3].nodes, 102)).toBe(extreme('003578'));
    expect(
      boxes(story.frames[1].nodes, 102)
        .filter((n) => n.label !== undefined)
        .map((n) => n.label),
    ).toEqual(['3']);
    expect(
      boxes(story.frames[2].nodes, 102)
        .filter((n) => n.label !== undefined)
        .map((n) => n.label),
    ).toEqual(['3', '0', '0']);
    expect(valueAt(story.mistake.wrongNodes!, 102)).toBe(3578);
    expect(String(valueAt(story.mistake.wrongNodes!, 102))).toHaveLength(4);
    expect(valueAt(story.transfer!.nodes, 102)).toBe(extreme('002469'));
  });

  it('keeps both numerical value and drawn area invariant when regrouping ones as 万', () => {
    const story = methodStory('u5-rewrite')!;
    const packages = boxes(story.frames[2].nodes),
      merged = boxes(story.frames[3].nodes);
    expect(packages.filter((n) => n.label === '百')).toHaveLength(4);
    expect(packages.filter((n) => n.label === '十')).toHaveLength(2);
    const wanCount = packages.reduce((sum, n) => sum + (n.label === '百' ? 100 : 10), 0);
    expect(wanCount * 10000).toBe(4200000);
    expect(packages.reduce((sum, n) => sum + n.w * n.h, 0)).toBeCloseTo(merged[0].w * merged[0].h);
    expect(merged[0].label).toBe(`${4200000 / 10000}万`);
    expect(valueAt(story.mistake.wrongNodes!)).toBe(420);
    expect(story.transfer!.right).toBe(`${3050000 / 10000}万`);
  });

  it('positions the midpoint exactly, excludes the next midpoint, and checks an independent value below it', () => {
    const story = methodStory('u5-rounding')!;
    const point = story.frames[1].nodes.find((n) => n.kind === 'dot' && n.tone === 'warm')!;
    expect(point.x).toBe(200);
    expect(7365000).toBe((7360000 + 7370000) / 2);
    expect(Math.round(7365000 / 10000)).toBe(737);
    expect(
      story.frames[3].nodes.some(
        (n) => n.kind === 'line' && n.x === 360 && n.x2 === 360 && n.dashed && n.tone === 'error',
      ),
    ).toBe(true);
    expect(Math.round(7374999 / 10000)).toBe(737);
    expect(Math.round(7375000 / 10000)).toBe(738);
    const next = story.transfer!.nodes.find((n) => n.kind === 'dot' && n.tone === 'warm')!;
    expect(next.x).toBeLessThan(200);
    expect(next.x).toBeCloseTo(40 + ((5264999 - 5260000) / 10000) * 320);
    expect(story.transfer!.right).toBe(`${Math.round(5264999 / 10000)}万`);
  });

  it('pads fields without shifting year or shelf information, including the incorrect code model', () => {
    const story = methodStory('u5-codes')!;
    expect(boxes(story.frames[0].nodes).map((n) => n.label)).toEqual(['2028', '3', '7']);
    const encoded = boxes(story.frames[1].nodes)
      .map((n) => n.label)
      .join('');
    expect(encoded).toBe('2028' + String(3).padStart(2, '0') + String(7).padStart(3, '0'));
    expect(encoded).toHaveLength(4 + 2 + 3);
    expect(story.transfer!.right).toBe('2030' + '12' + '004');
    const wrong = boxes(story.transfer!.wrongNodes!);
    expect(
      wrong
        .slice(0, 4)
        .map((n) => n.label)
        .join(''),
    ).toBe('2030');
    expect(
      wrong
        .slice(4, 6)
        .map((n) => n.label)
        .join(''),
    ).toBe('12');
    expect(
      wrong
        .slice(6)
        .map((n) => n.label ?? '_')
        .join(''),
    ).toBe('4__');
  });
});

describe('unit 6 partial products and conservation depth', () => {
  it('splits 24 shares into areas in a 20:4 ratio and preserves the lost eighteen shares in the error model', () => {
    const story = methodStory('u6-written')!;
    const split = boxes(story.frames[0].nodes, 65),
      partials = boxes(story.frames[1].nodes, 65);
    expect(split[0].w / split[1].w).toBeCloseTo(20 / 4);
    expect(split.reduce((sum, n) => sum + n.w, 0)).toBeCloseTo(352);
    expect(partials.map((n) => Number(n.label))).toEqual([213 * 20, 213 * 4]);
    expect(numericSum(story.frames[2].nodes, 65)).toBe(213 * 24);
    const final = boxes(story.frames[3].nodes, 65)[0];
    expect(final.w * final.h).toBeCloseTo(split.reduce((sum, n) => sum + n.w * n.h, 0));
    const wrong = boxes(story.mistake.wrongNodes!, 65);
    expect(wrong[0].w).toBeCloseTo(partials[0].w / 10);
    expect(wrong[1].label).toBe('漏18份');
    expect((wrong[1].w / 352) * 24).toBeCloseTo(18);
    expect(numericSum(story.mistake.wrongNodes!, 65) + 18 * 213).toBe(5112);
    expect(story.transfer!.right).toBe(String(312 * 20));
  });

  it('moves every digit left by the multiplier power, never by deleting an internal placeholder', () => {
    const story = methodStory('u6-zero')!;
    expect(digits(story.frames[0].nodes)).toBe('204');
    for (const [index, base, factor] of [
      [2, 612, 10],
      [4, 128, 100],
    ] as const) {
      const nodes = story.frames[index].nodes;
      expect(valueAt(nodes, 53)).toBe(base);
      expect(valueAt(nodes, 156)).toBe(base * factor);
      const before = boxes(nodes, 53).find((n) => n.label === String(base)[0])!;
      const after = boxes(nodes, 156).find((n) => n.label === String(base)[0])!;
      expect(before.x - after.x).toBeCloseTo((352 / boxes(nodes, 53).length) * Math.log10(factor));
    }
    expect(valueAt(story.mistake.nodes, 156)).toBe(204 * 30);
    expect(valueAt(story.mistake.wrongNodes!, 156)).toBe(24 * 3 * 100);
    expect(valueAt(story.transfer!.nodes, 156)).toBe(405 * 20);
  });

  it('keeps the small correction after estimation and independently reconstructs the exact calculator result', () => {
    const story = methodStory('u6-tools')!;
    const split = boxes(story.frames[0].nodes, 75);
    expect(split[0].w / split[1].w).toBeCloseTo(300 / 6);
    expect(numericSum(story.frames[3].nodes, 65)).toBe(306 * 24);
    expect(300 * 24 + 6 * 24).toBe(7344);
    const omitted = boxes(story.mistake.wrongNodes!, 78).find((n) => n.label === '漏10')!;
    expect((omitted.w / 352) * 7344).toBeCloseTo(10);
    expect(story.transfer!.right).toBe(String(402 * 23));
    expect(Number(story.transfer!.right) - Number(story.transfer!.wrong)).toBe(10);
  });

  it('counts diagonal digit contributions before carrying, then conserves ten base units in a higher column', () => {
    const story = methodStory('u6-patterns')!;
    for (const [index, n] of [2, 3, 4].entries()) {
      const nodes = story.frames[index].nodes;
      expect(nodes.filter((node) => node.kind === 'dot')).toHaveLength(n * n);
      expect(
        Number(
          boxes(nodes, 187)
            .map((node) => node.label)
            .join(''),
        ),
      ).toBe(Number('1'.repeat(n)) ** 2);
    }
    expect(dotValue(story.frames[3].nodes)).toBe(10);
    expect(dotValue(story.frames[4].nodes)).toBe(10);
    expect(story.frames[3].nodes.filter((n) => n.kind === 'dot' && n.x >= 200)).toHaveLength(10);
    expect(story.frames[4].nodes.filter((n) => n.kind === 'dot' && n.x < 200)).toHaveLength(1);
    expect(story.frames[4].nodes.some((n) => n.kind === 'text' && n.text === '高一位')).toBe(true);
    expect(dotValue(story.transfer!.nodes)).toBe(3 * 10 + 12);
    expect(dotValue(story.transfer!.wrongNodes!)).toBe(3 * 10 + 12);
    expect(story.transfer!.nodes.filter((n) => n.kind === 'dot' && n.x >= 200)).toHaveLength(2);
    expect(story.transfer!.wrongNodes!.filter((n) => n.kind === 'dot' && n.x >= 200)).toHaveLength(
      12,
    );
  });

  it('measures the missing block as shares of the multiplicand rather than subtracting unrelated digits', () => {
    const story = methodStory('u6-error')!;
    const missing = boxes(story.frames[1].nodes, 74).find((n) => n.tone === 'error')!;
    expect((missing.w / 352) * 32).toBeCloseTo(30 - 3);
    expect(numericSum(story.frames[2].nodes, 74)).toBe(204 * 32);
    expect(numericSum(story.frames[2].nodes, 74) - numericSum(story.frames[1].nodes, 74)).toBe(
      204 * 27,
    );
    expect(boxes(story.mistake.wrongNodes!, 74).find((n) => n.tone === 'error')!.label).toBe(
      '还漏26份',
    );
    expect(story.transfer!.right).toBe(String(306 * 42 - (306 * 4 + 306 * 2)));
    expect(numericSum(story.transfer!.nodes, 74)).toBe(306 * 42);
  });

  it('collects every per-item excess into a conserved refund and partitions the original budget', () => {
    const story = methodStory('u6-application')!;
    expect(boxes(story.frames[0].nodes)).toHaveLength(35);
    const distributed = story.frames[1].nodes.filter((n) => n.kind === 'dot');
    const gathered = story.frames[2].nodes.filter((n) => n.kind === 'dot');
    expect(distributed).toHaveLength(35 * (200 - 198));
    expect(gathered).toHaveLength(distributed.length);
    expect(gathered.map((n) => [n.x, n.y])).not.toEqual(distributed.map((n) => [n.x, n.y]));
    expect(
      story.mistake.wrongNodes!.filter((n) => n.kind === 'dot' && n.tone === 'focus'),
    ).toHaveLength(2);
    expect(
      story.mistake.wrongNodes!.filter((n) => n.kind === 'dot' && n.tone === 'error'),
    ).toHaveLength(34 * 2);
    const budget = boxes(story.frames[3].nodes, 75);
    expect((budget[0].w / 352) * 7000).toBeCloseTo(198 * 35);
    expect((budget[1].w / 352) * 7000).toBeCloseTo(7000 - 198 * 35);
    expect(story.transfer!.right).toBe(`${5000 - 199 * 24}元`);
    expect(
      story.transfer!.wrongNodes!.filter((n) => n.kind === 'dot' && n.tone === 'error'),
    ).toHaveLength(23);
  });
});
