import { describe, expect, it } from 'vitest';
import {
  expressionOperations,
  expressionText,
  parseExpression,
  readyOperations,
  reduceOperation,
} from '@mathstudy/math-core';
import { arithmeticScenes, calculationFrames } from '@mathstudy/animation-engine';

describe('mixed operations and bracket reductions', () => {
  it.each([
    ['18+18*2-6', ['18 + 18 × 2 − 6', '18 + 36 − 6', '54 − 6', '48']],
    ['525/[(81-56)*3]', ['525 ÷ [(81 − 56) × 3]', '525 ÷ [25 × 3]', '525 ÷ 75', '7']],
    ['58*(20-78/13)', ['58 × (20 − 78 ÷ 13)', '58 × (20 − 6)', '58 × 14', '812']],
    ['800/(70-30)/5', ['800 ÷ (70 − 30) ÷ 5', '800 ÷ 40 ÷ 5', '20 ÷ 5', '4']],
    ['800/[(70-30)/5]', ['800 ÷ [(70 − 30) ÷ 5]', '800 ÷ [40 ÷ 5]', '800 ÷ 8', '100']],
  ])('keeps complete equivalent equations for %s', (source, expected) => {
    expect(calculationFrames(source).map((frame) => expressionText(frame.root))).toEqual(expected);
  });
  it('requires left association while accepting independent multiplication branches', () => {
    const same = parseExpression('80/4*2');
    expect(readyOperations(same).map((item) => expressionText(item.node))).toEqual(['80 ÷ 4']);
    expect(() =>
      reduceOperation(
        same,
        expressionOperations(same).find((item) => item.node.op === '*')!.node.id,
      ),
    ).toThrow(/从左往右/);
    const independent = parseExpression('240/6-2*17');
    const original = expressionText(independent);
    const ready = readyOperations(independent);
    expect(ready).toHaveLength(2);
    const alternate = reduceOperation(independent, ready[1].node.id);
    expect(expressionText(alternate.root)).toBe('240 ÷ 6 − 34');
    expect(calculationFrames(alternate.root).at(-1)!.root).toMatchObject({
      kind: 'number',
      value: 6,
    });
    expect(expressionText(independent)).toBe(original);
  });
  it('explains nested priority and division inside a small bracket', () => {
    const root = parseExpression('58*(20-78/13)');
    const outside = expressionOperations(root).find((item) => item.depth === 0)!;
    expect(() => reduceOperation(root, outside.node.id)).toThrow(/小括号内/);
    expect(expressionText(readyOperations(root)[0].node)).toBe('78 ÷ 13');
    expect(expressionText(parseExpression('５２５÷［（８１－５６）×３］'))).toBe(
      '525 ÷ [(81 − 56) × 3]',
    );
  });
  it.each([
    'alert(1)',
    '1;2',
    '2**3',
    '1.5+2',
    '[(2+3)]extra',
    '(2+3]',
    '2(3+4)',
    '1+',
    '-1+2',
    '9'.repeat(250),
  ])('rejects unsafe or unsupported input %s', (source) => {
    expect(() => parseExpression(source)).toThrow();
  });
  it.each(['3/0', '3/2', '1-2', '1000000*1000000*1000000'])(
    'rejects invalid integer arithmetic %s',
    (source) => {
      expect(() => calculationFrames(source)).toThrow(RangeError);
    },
  );
  it('finishes every authored scene, checks alternatives and conserves quantities', () => {
    const expected = [48, 6, 40, 35, 7, 812, 9, 4, 100, 2, 6, 6, 84, 8];
    arithmeticScenes.forEach((scene, index) => {
      expect(calculationFrames(scene.expression).at(-1)!.root).toMatchObject({
        kind: 'number',
        value: expected[index],
      });
      if (!scene.problem) return;
      expect(scene.problem.parts.reduce((sum, part) => sum + part.value, 0)).toBe(
        scene.problem.total,
      );
      for (const choice of scene.problem.choices.filter((choice) => choice.valid))
        expect(calculationFrames(choice.expression).at(-1)!.root).toMatchObject({
          value: expected[index],
        });
    });
  });
});
