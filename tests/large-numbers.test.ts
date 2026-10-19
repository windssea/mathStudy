import { describe, expect, it } from 'vitest';
import {
  readChineseNumber,
  parseLargeNumber,
  numberGroups,
  numberPlaces,
  setNumberDigit,
  compareLargeNumbers,
  roundLargeNumber,
  exactLargeRewrite,
  roundingRange,
  encodeLibraryBook,
  decodeLibraryBook,
  MAX_CLASSROOM_NUMBER,
} from '@mathstudy/math-core';
import { countingFrames, readingFrames, approximationFrames } from '@mathstudy/animation-engine';
describe('large integer place value and Chinese reading', () => {
  it.each([
    [0, '零'],
    [10, '十'],
    [11, '十一'],
    [101, '一百零一'],
    [1001, '一千零一'],
    [1010, '一千零一十'],
    [10000, '一万'],
    [10010, '一万零一十'],
    [10001, '一万零一'],
    [100000, '十万'],
    [6004000, '六百万四千'],
    [3008007, '三百万八千零七'],
    [52395239, '五千二百三十九万五千二百三十九'],
    [600080000, '六亿零八万'],
    [302005000, '三亿零二百万五千'],
    [100000001, '一亿零一'],
    [100010001, '一亿零一万零一'],
    [2006000000, '二十亿零六百万'],
    [13700000000, '一百三十七亿'],
    [100000000001, '一千亿零一'],
    [60020070, '六千零二万零七十'],
    [20022000, '二千零二万二千'],
  ])('reads %i as %s without spurious or missing zeros', (number, reading) => {
    expect(readChineseNumber(number)).toBe(reading);
    expect(readingFrames(number).at(-1)?.readout).toBe(reading);
  });
  it('preserves values when splitting into groups and editing every digit', () => {
    for (const number of [0, 9999, 10000, 3008007, 600080000, 302005000, 999999999999]) {
      expect(
        numberGroups(number).reduce((sum, group) => sum + group.value * 10000 ** group.index, 0),
      ).toBe(number);
      expect(numberPlaces(number).reduce((sum, place) => sum + place.contribution, 0)).toBe(number);
      for (let power = 0; power < 12; power++) {
        const changed = setNumberDigit(number, power, 5);
        expect(numberPlaces(changed)[power].digit).toBe(5);
        for (const place of numberPlaces(number).filter((place) => place.power !== power))
          expect(numberPlaces(changed)[place.power].digit).toBe(place.digit);
      }
    }
    expect(parseLargeNumber('００６０００８００００')).toBe(600080000);
  });
  it.each(['', '-1', '1.5', '1e8', '1,000', '1/2', '1234567890123', '<script>'])(
    'rejects invalid numeric input %s',
    (text) => expect(() => parseLargeNumber(text)).toThrow(),
  );
  it('distinguishes comparing digit counts, the first different place and equality', () => {
    expect(compareLargeNumbers(9999999, 10000000)).toMatchObject({ symbol: '<' });
    expect(compareLargeNumbers(78900000, 78099000)).toMatchObject({ symbol: '>', power: 5 });
    expect(compareLargeNumbers(600080000, 600080000)).toMatchObject({
      symbol: '=',
      power: undefined,
    });
  });
  it('conserves quantity in every carry exchange, including consecutive nines', () => {
    for (const [number, power] of [
      [9999, 0],
      [9990, 1],
      [9000, 3],
      [29990000, 4],
      [99999999, 0],
      [0, 8],
    ]) {
      const frames = countingFrames(number, power);
      expect(frames[0].digits!.reduce((sum, digit, index) => sum + digit * 10 ** index, 0)).toBe(
        number,
      );
      for (const frame of frames.slice(1))
        expect(frame.digits!.reduce((sum, digit, index) => sum + digit * 10 ** index, 0)).toBe(
          number + 10 ** power,
        );
      expect(frames.at(-1)?.digits?.every((digit) => digit <= 9)).toBe(true);
    }
    const carry = countingFrames(9999, 0);
    expect(carry[1].digits![0]).toBe(10);
    expect(carry.at(-1)).toMatchObject({ result: '10000', exchangePower: 3 });
    expect(() => countingFrames(MAX_CLASSROOM_NUMBER, 0)).toThrow();
    expect(() => setNumberDigit(1, 12, 3)).toThrow();
  });
});
describe('rounding, exact rewriting and inclusive integer ranges', () => {
  it('uses only the first discarded digit and carries across nines', () => {
    expect(roundLargeNumber(384204, 4)).toMatchObject({
      decidingDigit: 4,
      rounded: 380000,
      midpoint: 385000,
    });
    expect(roundLargeNumber(386685, 4).rounded).toBe(390000);
    expect(roundLargeNumber(385000, 4).rounded).toBe(390000);
    expect(roundLargeNumber(49995000, 4).units).toBe(5000);
    expect(roundLargeNumber(1970000000, 8).units).toBe(20);
    expect(roundLargeNumber(14999, 4).rounded).toBe(10000);
    expect(roundLargeNumber(999999999999, 8).rounded).toBe(1000000000000);
  });
  it('keeps exact rewrite separate from discarding a nonzero remainder', () => {
    expect(exactLargeRewrite(32000000, 4)).toMatchObject({
      exact: true,
      quotient: 3200,
      remainder: 0,
    });
    expect(exactLargeRewrite(32000001, 4)).toMatchObject({ exact: false, remainder: 1 });
    expect(approximationFrames(32000000, 4, 'exact').at(-1)?.result).toBe('32000000 = 3200万');
    expect(approximationFrames(32000001, 4, 'exact').at(-1)?.result).toBeUndefined();
  });
  it('derives both integer boundaries and checks their neighbors across scales', () => {
    expect(roundingRange(360000, 4)).toEqual({
      lower: 355000,
      upper: 364999,
      excludedUpper: 365000,
      target: 360000,
      unit: 10000,
    });
    for (const power of [2, 3, 4, 8])
      for (const count of [0, 1, 5, 36, 100, 999]) {
        const target = count * 10 ** power,
          range = roundingRange(target, power);
        expect(roundLargeNumber(range.lower, power).rounded).toBe(target);
        expect(roundLargeNumber(range.upper, power).rounded).toBe(target);
        if (range.lower > 0)
          expect(roundLargeNumber(range.lower - 1, power).rounded).not.toBe(target);
        expect(roundLargeNumber(range.excludedUpper, power).rounded).not.toBe(target);
      }
    expect(roundingRange(0, 4)).toMatchObject({ lower: 0, upper: 4999 });
    expect(() => roundingRange(355000, 4)).toThrow();
    expect(() => roundLargeNumber(1, 0)).toThrow();
    expect(() => readChineseNumber(-1)).toThrow();
  });
});
describe('fixed length educational library codes', () => {
  it('preserves segment zeros, decodes round trips and separates different books', () => {
    const code = encodeLibraryBook(2026, 4, 30);
    expect(code).toBe('202604030');
    expect(decodeLibraryBook(code)).toEqual({ year: 2026, shelf: 4, serial: 30 });
    expect(encodeLibraryBook(2026, 4, 31)).not.toBe(code);
    expect(() => decodeLibraryBook('2026430')).toThrow();
    expect(() => decodeLibraryBook('202600000')).toThrow();
    expect(() => encodeLibraryBook(2026, 4, 1000)).toThrow();
  });
});
