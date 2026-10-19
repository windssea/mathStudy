import { describe, expect, it } from 'vitest';
import { divide, longDivision, sameAnswer, trialQuotient } from '@mathstudy/math-core';
import { divisionFrames, groupFrames } from '@mathstudy/animation-engine';

describe('integer division and teaching invariants', () => {
  it.each([
    [172, 28, 6, 4],
    [156, 12, 13, 0],
    [840, 40, 21, 0],
    [612, 30, 20, 12],
    [605, 21, 28, 17],
  ])('%i ÷ %i', (n, d, q, r) => expect(divide(n, d)).toEqual({ quotient: q, remainder: r }));
  it('validates division by zero and invalid numeric domains', () => {
    for (const [n, d] of [
      [60, 0],
      [-1, 20],
      [1.2, 10],
      [Infinity, 20],
      [Number.MAX_SAFE_INTEGER + 1, 2],
    ])
      expect(() => divide(n, d)).toThrow(RangeError);
  });
  it('preserves total and remainder constraints across the entire supported lesson domain', () => {
    for (let n = 10; n <= 999; n++)
      for (let d = 10; d <= 99; d++) {
        const { quotient: q, remainder: r } = divide(n, d);
        if (q * d + r !== n || r < 0 || r >= d || !Number.isInteger(q))
          throw new Error(`Failed: ${n}/${d}`);
        const columns = longDivision(n, d);
        const recovered = columns.reduce(
          (value, c) => value + c.digit * 10 ** (String(n).length - 1 - c.column),
          0,
        );
        if (recovered !== q || columns.at(-1)?.remainder !== r)
          throw new Error(`Wrong place value: ${n}/${d}`);
      }
  });
  it('keeps a zero in the units place', () => {
    expect(longDivision(612, 30)).toEqual([
      { column: 1, partial: 61, digit: 2, product: 60, remainder: 1, broughtDigit: 2 },
      { column: 2, partial: 12, digit: 0, product: 0, remainder: 12, broughtDigit: undefined },
    ]);
  });
  it('diagnoses both trial directions independently', () => {
    expect(trialQuotient(172, 28, 5).verdict).toBe('small');
    expect(trialQuotient(172, 28, 6).verdict).toBe('correct');
    expect(trialQuotient(172, 28, 7).verdict).toBe('large');
  });
  it('ends every valid demonstration with an explicit, deterministic verification', () => {
    expect(divisionFrames(612, 30)).toEqual(divisionFrames(612, 30));
    expect(divisionFrames(612, 30).frames.at(-1)?.text).toContain('30 × 20 + 12 = 612');
    expect(groupFrames(160, 30).at(-1)?.text).toContain('5……10');
  });
  it('accepts common fullwidth/formatting input without accepting executable or approximate notation', () => {
    expect(sameAnswer(' ００６ ', '6')).toBe(true);
    expect(sameAnswer('600,080,000', '600080000')).toBe(true);
    expect(sameAnswer('6.0', '6')).toBe(false);
    expect(sameAnswer('6;alert(1)', '6')).toBe(false);
    expect(sameAnswer('1e8', '100000000')).toBe(false);
  });
});
