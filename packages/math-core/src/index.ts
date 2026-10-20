export function divide(dividend: number, divisor: number) {
  if (
    !Number.isSafeInteger(dividend) ||
    !Number.isSafeInteger(divisor) ||
    dividend < 0 ||
    divisor <= 0
  ) {
    throw new RangeError('请输入非负整数被除数和正整数除数。');
  }
  return { quotient: Math.floor(dividend / divisor), remainder: dividend % divisor };
}

export function trialQuotient(dividend: number, divisor: number, trial: number) {
  const result = divide(dividend, divisor);
  if (!Number.isInteger(trial) || trial < 0 || trial > 99) throw new RangeError('试商超出范围。');
  const product = divisor * trial;
  const remainder = dividend - product;
  return {
    ...result,
    product,
    remainder,
    verdict: remainder < 0 ? 'large' : remainder >= divisor ? 'small' : 'correct',
  } as const;
}

export interface DivisionColumn {
  column: number;
  partial: number;
  digit: number;
  product: number;
  remainder: number;
  broughtDigit?: number;
}
export function longDivision(dividend: number, divisor: number): DivisionColumn[] {
  divide(dividend, divisor);
  const digits = String(dividend).split('').map(Number);
  const columns: DivisionColumn[] = [];
  let partial = 0;
  let started = false;
  digits.forEach((value, column) => {
    partial = partial * 10 + value;
    if (!started && partial < divisor && column < digits.length - 1) return;
    started = true;
    const digit = Math.floor(partial / divisor);
    const product = digit * divisor;
    const remainder = partial - product;
    columns.push({ column, partial, digit, product, remainder, broughtDigit: digits[column + 1] });
    partial = remainder;
  });
  return columns;
}

export function normalizeAnswer(value: string): string {
  return value
    .trim()
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    .replace(/[，,\s]/g, '')
    .replace(/^\+/, '');
}
export function sameAnswer(actual: string, expected: string) {
  const a = normalizeAnswer(actual);
  const b = normalizeAnswer(expected);
  if (/^\d+$/.test(a) && /^\d+$/.test(b)) return BigInt(a) === BigInt(b);
  return a === b;
}

function positiveInteger(value: number) {
  if (!Number.isSafeInteger(value) || value <= 0) throw new RangeError('长度或数量必须是正整数。');
}
export function rectangleMetrics(length: number, width: number) {
  positiveInteger(length);
  positiveInteger(width);
  const area = length * width,
    perimeter = (length + width) * 2;
  if (!Number.isSafeInteger(area) || !Number.isSafeInteger(perimeter))
    throw new RangeError('数值过大。');
  return { area, perimeter, edges: [length, width, length, width] };
}
export function tilingMetrics(length: number, width: number, tileSide = 1) {
  const { area } = rectangleMetrics(length, width);
  positiveInteger(tileSide);
  if (length % tileSide || width % tileSide) throw new RangeError('方格必须恰好铺满图形。');
  return {
    columns: length / tileSide,
    rows: width / tileSide,
    count: area / tileSide ** 2,
    tileArea: tileSide ** 2,
    area,
  };
}
export function perimeterPairs(perimeter: number) {
  positiveInteger(perimeter);
  if (perimeter % 2 || perimeter < 4 || perimeter > 200)
    throw new RangeError('周长应为 4–200 的偶数。');
  const sum = perimeter / 2;
  return Array.from({ length: Math.floor(sum / 2) }, (_, i) => {
    const width = i + 1,
      length = sum - width;
    return { length, width, ...rectangleMetrics(length, width) };
  });
}
export function areaPairs(area: number) {
  positiveInteger(area);
  if (area > 10000) throw new RangeError('面积超出探索范围。');
  const pairs = [];
  for (let width = 1; width * width <= area; width++)
    if (area % width === 0) {
      const length = area / width;
      pairs.push({ length, width, ...rectangleMetrics(length, width) });
    }
  return pairs;
}
export function cornerCutMetrics(
  length: number,
  width: number,
  cutLength: number,
  cutWidth: number,
) {
  const original = rectangleMetrics(length, width);
  positiveInteger(cutLength);
  positiveInteger(cutWidth);
  if (cutLength >= length || cutWidth >= width)
    throw new RangeError('剪角必须小于原图形的长和宽。');
  return {
    removedArea: cutLength * cutWidth,
    remainingArea: original.area - cutLength * cutWidth,
    perimeter: original.perimeter,
  };
}
export * from './quantities';
export * from './expressions';
export * from './large-numbers';

/** Grid answers encode a board as at most 80 zero/one characters. */
export function gradeAnswers(
  question: {
    expected: Record<string, string>;
    construction?: {
      columns: number;
      rows: number;
      area: number;
      perimeter?: number;
      rectangle: boolean;
      given?: number[];
    };
  },
  answers: Record<string, string>,
) {
  const task = question.construction;
  if (!task)
    return Object.keys(question.expected).every((key) =>
      sameAnswer(answers[key] ?? '', question.expected[key]),
    );
  const code = answers.cells ?? '',
    size = task.columns * task.rows;
  if (size > 80 || !/^[01]+$/.test(code) || code.length !== size) return false;
  const cells = new Set([...code].flatMap((c, i) => (c === '1' ? [i] : [])));
  if (cells.size !== task.area || task.given?.some((i) => !cells.has(i))) return false;
  const neighbors = (i: number) =>
    [
      i % task.columns > 0 ? i - 1 : -1,
      i % task.columns < task.columns - 1 ? i + 1 : -1,
      i - task.columns,
      i + task.columns,
    ].filter((n) => n >= 0 && n < size);
  const seen = new Set<number>(),
    queue = [...cells].slice(0, 1);
  while (queue.length) {
    const i = queue.pop()!;
    if (seen.has(i)) continue;
    seen.add(i);
    for (const n of neighbors(i)) if (cells.has(n) && !seen.has(n)) queue.push(n);
  }
  if (seen.size !== cells.size) return false;
  const perimeter = [...cells].reduce(
    (total, i) => total + 4 - neighbors(i).filter((n) => cells.has(n)).length,
    0,
  );
  if (task.perimeter !== undefined && perimeter !== task.perimeter) return false;
  if (task.rectangle) {
    const xs = [...cells].map((i) => i % task.columns),
      ys = [...cells].map((i) => Math.floor(i / task.columns));
    if (
      (Math.max(...xs) - Math.min(...xs) + 1) * (Math.max(...ys) - Math.min(...ys) + 1) !==
      cells.size
    )
      return false;
  }
  return true;
}
