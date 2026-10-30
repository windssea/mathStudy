import { describe, expect, it } from 'vitest';
import { methodStory, type MethodNode } from '@mathstudy/animation-engine';

type Box = Extract<MethodNode, { kind: 'rect' }>;
const boxes = (nodes: MethodNode[]) => nodes.filter((node): node is Box => node.kind === 'rect');
const textNodes = (nodes: MethodNode[]) =>
  nodes.filter((node): node is Extract<MethodNode, { kind: 'text' }> => node.kind === 'text');

describe('unit 5–6 teaching audit regressions', () => {
  it('shows actual vertical partial products with shared place columns and a zero in the units slot', () => {
    const story = methodStory('u6-written')!;
    const vertical = story.frames.find((frame) => frame.title.includes('竖式'))!;
    expect(vertical).toBeDefined();
    const rows = [59, 122, 185].map((y) =>
      boxes(vertical.nodes)
        .filter((box) => box.y === y)
        .sort((a, b) => a.x - b.x),
    );
    expect(rows.map((row) => Number(row.map((box) => box.label ?? ' ').join('')))).toEqual([
      213 * 4,
      213 * 20,
      213 * 24,
    ]);
    expect(rows[0].map((box) => box.x)).toEqual(rows[1].map((box) => box.x));
    expect(rows[1].at(-1)?.label).toBe('0');
    expect(rows[1].at(-2)?.label).toBe('6');
    let carry = 0;
    for (let column = 3; column >= 0; column--) {
      const sum = Number(rows[0][column].label ?? 0) + Number(rows[1][column].label ?? 0) + carry;
      expect(Number(rows[2][column].label)).toBe(sum % 10);
      carry = Math.floor(sum / 10);
    }
    expect(carry).toBe(0);
  });

  it('centers encoding field names over their own fixed-length fields', () => {
    const story = methodStory('u5-codes')!;
    for (const nodes of [story.frames[1].nodes, story.mistake.wrongNodes!, story.transfer!.nodes]) {
      const digits = boxes(nodes).sort((a, b) => a.x - b.x);
      for (const [name, first, last] of [
        ['年份', 0, 3],
        ['书架', 4, 5],
        ['序号', 6, 8],
      ] as const) {
        const heading = textNodes(nodes).find((node) => node.text === name)!;
        const left = digits[first].x;
        const right = digits[last].x + digits[last].w;
        expect(Math.abs(heading.x - (left + right) / 2)).toBeLessThan(3);
      }
    }
  });

  it('explains the one-integer rounding gap even when two points are below a display pixel apart', () => {
    const transfer = methodStory('u5-rounding')!.transfer!;
    const point = transfer.nodes.find((node) => node.kind === 'dot' && node.tone === 'warm')!;
    const midpointX = 200;
    expect(point.x).toBeLessThan(midpointX);
    expect(midpointX - point.x).toBeLessThan(1);
    expect(textNodes(transfer.nodes).some((node) => node.text === '距中点还差1')).toBe(true);
    expect(Number(transfer.right.replace('万', ''))).toBe(Math.round(5264999 / 10000));
  });

  it('gives dot columns place meaning so a point is not mistaken for a single unit in the final product', () => {
    const story = methodStory('u6-patterns')!;
    for (const [index, factor] of [11, 111, 1111].entries()) {
      const frame = story.frames[index];
      const columns = boxes(frame.nodes).sort((a, b) => b.x - a.x);
      const weighted = columns.reduce((total, column, place) => {
        const contributions = frame.nodes.filter(
          (node) => node.kind === 'dot' && node.x >= column.x && node.x <= column.x + column.w + 4,
        ).length;
        expect(contributions).toBe(Number(column.label));
        return total + contributions * 10 ** place;
      }, 0);
      expect(weighted).toBe(factor * factor);
      expect(textNodes(frame.nodes).some((node) => node.text.includes('最右是个位'))).toBe(true);
    }
  });

  it('connects the per-item refund mistake all the way to the incorrect remaining budget', () => {
    const transfer = methodStory('u6-application')!.transfer!;
    const wrongText = textNodes(transfer.wrongNodes!).map((node) => node.text);
    expect(wrongText).toContain(`错付${200 * 24 - 1}元`);
    expect(wrongText).toContain(`只剩${5000 - (200 * 24 - 1)}元`);
    expect(
      transfer.wrongNodes!.filter((node) => node.kind === 'dot' && node.tone === 'error'),
    ).toHaveLength(24 - 1);
    expect(transfer.right).toBe(`${5000 - 199 * 24}元`);
  });
});
