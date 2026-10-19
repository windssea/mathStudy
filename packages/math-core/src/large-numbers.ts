export const MAX_CLASSROOM_NUMBER = 999_999_999_999;
export const countingUnits = [
  '一',
  '十',
  '百',
  '千',
  '万',
  '十万',
  '百万',
  '千万',
  '亿',
  '十亿',
  '百亿',
  '千亿',
] as const;
export const digitNames = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
export function assertLargeNumber(value: number) {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_CLASSROOM_NUMBER)
    throw new RangeError('请输入0至999999999999之间的整数。');
}
export function parseLargeNumber(text: string) {
  const normalized = text.normalize('NFKC').trim();
  if (!/^\d{1,12}$/.test(normalized))
    throw new RangeError('请输入1至12位数字，不含小数点或其他字符。');
  const value = Number(normalized);
  assertLargeNumber(value);
  return value;
}
export function numberPlaces(value: number) {
  assertLargeNumber(value);
  return countingUnits.map((unit, power) => ({
    power,
    unit,
    position: power === 0 ? '个位' : `${unit}位`,
    digit: Math.floor(value / 10 ** power) % 10,
    used: power < String(value).length,
    contribution: (Math.floor(value / 10 ** power) % 10) * 10 ** power,
  }));
}
export function numberGroups(value: number) {
  assertLargeNumber(value);
  return [2, 1, 0].map((index) => ({
    index,
    label: ['个级', '万级', '亿级'][index],
    suffix: ['', '万', '亿'][index],
    value: Math.floor(value / 10 ** (index * 4)) % 10000,
  }));
}
function readGroup(value: number) {
  let output = '',
    pendingZero = false;
  for (let power = 3; power >= 0; power--) {
    const digit = Math.floor(value / 10 ** power) % 10;
    if (digit) {
      if (pendingZero) output += '零';
      output += digitNames[digit] + ['', '十', '百', '千'][power];
      pendingZero = false;
    } else if (output) pendingZero = true;
  }
  return output;
}
export function readChineseNumber(value: number) {
  assertLargeNumber(value);
  if (value === 0) return '零';
  let output = '',
    skipped = false;
  for (const group of numberGroups(value)) {
    if (group.value === 0) {
      if (output) skipped = true;
      continue;
    }
    if (output && (skipped || group.value < 1000)) output += '零';
    output += readGroup(group.value) + group.suffix;
    skipped = false;
  }
  return output.replace(/^一十/, '十');
}
export function groupedNumber(value: number) {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError('需要非负安全整数。');
  return String(value).replace(/\B(?=(\d{4})+(?!\d))/g, ' | ');
}
export function setNumberDigit(value: number, power: number, digit: number) {
  assertLargeNumber(value);
  if (
    !Number.isInteger(power) ||
    power < 0 ||
    power > 11 ||
    !Number.isInteger(digit) ||
    digit < 0 ||
    digit > 9
  )
    throw new RangeError('数位或数字超出范围。');
  return value + (digit - (Math.floor(value / 10 ** power) % 10)) * 10 ** power;
}
function roundingUnit(power: number) {
  if (!Number.isInteger(power) || power < 1 || power > 11)
    throw new RangeError('保留的数位超出范围。');
  return 10 ** power;
}
export function roundLargeNumber(value: number, power: number) {
  assertLargeNumber(value);
  const unit = roundingUnit(power),
    lower = Math.floor(value / unit) * unit,
    upper = lower + unit,
    midpoint = lower + unit / 2;
  const decidingDigit = Math.floor(value / (unit / 10)) % 10,
    rounded = value < midpoint ? lower : upper;
  return {
    unit,
    lower,
    upper,
    midpoint,
    decidingDigit,
    rounded,
    units: rounded / unit,
    roundUp: decidingDigit >= 5,
    remainder: value - lower,
  };
}
export function exactLargeRewrite(value: number, power: number) {
  assertLargeNumber(value);
  const unit = roundingUnit(power);
  return {
    unit,
    quotient: Math.floor(value / unit),
    remainder: value % unit,
    exact: value % unit === 0,
  };
}
export function roundingRange(target: number, power: number) {
  assertLargeNumber(target);
  const unit = roundingUnit(power);
  if (target % unit !== 0) throw new RangeError('目标近似数必须是保留单位的整数倍。');
  return {
    lower: Math.max(0, target - unit / 2),
    upper: target + unit / 2 - 1,
    excludedUpper: target + unit / 2,
    target,
    unit,
  };
}
export function compareLargeNumbers(left: number, right: number) {
  assertLargeNumber(left);
  assertLargeNumber(right);
  const power = numberPlaces(left)
    .reverse()
    .find((place) => place.digit !== Math.floor(right / 10 ** place.power) % 10)?.power;
  return {
    symbol: left === right ? '=' : left > right ? '>' : '<',
    power,
    reason:
      left === right
        ? '各个数位上的数字都相同，两个数相等。'
        : String(left).length !== String(right).length
          ? '两个数位数不同，位数多的数大。'
          : `位数相同，从最高位起比较；第一个不同的数位是${power === 0 ? '个位' : `${countingUnits[power!]}位`}。`,
  };
}
export function encodeLibraryBook(year: number, shelf: number, serial: number) {
  if (
    !Number.isInteger(year) ||
    year < 1000 ||
    year > 9999 ||
    !Number.isInteger(shelf) ||
    shelf < 1 ||
    shelf > 99 ||
    !Number.isInteger(serial) ||
    serial < 1 ||
    serial > 999
  )
    throw new RangeError('年份须为四位数，书架号1至99，序号1至999。');
  return `${year}${String(shelf).padStart(2, '0')}${String(serial).padStart(3, '0')}`;
}
export function decodeLibraryBook(code: string) {
  if (!/^\d{9}$/.test(code)) throw new RangeError('图书编号须为9位数字，须保留分段中的0。');
  const year = Number(code.slice(0, 4)),
    shelf = Number(code.slice(4, 6)),
    serial = Number(code.slice(6));
  encodeLibraryBook(year, shelf, serial);
  return { year, shelf, serial };
}
