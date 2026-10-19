import {
  assertLargeNumber,
  countingUnits,
  numberPlaces,
  numberGroups,
  readChineseNumber,
  roundLargeNumber,
  exactLargeRewrite,
  roundingRange,
} from '@mathstudy/math-core';
export interface NumberFrame {
  title: string;
  text: string;
  power?: number;
  exchangePower?: number;
  digits?: number[];
  readout?: string;
  result?: string;
}
export function countingFrames(value: number, power: number): NumberFrame[] {
  assertLargeNumber(value);
  if (!Number.isInteger(power) || power < 0 || power > 11)
    throw new RangeError('计数单位超出范围。');
  const next = value + 10 ** power;
  assertLargeNumber(next);
  const digits = numberPlaces(value).map((place) => place.digit);
  const frames: NumberFrame[] = [
    {
      title: '先看原来的数',
      text: `${value}，准备添1个${countingUnits[power]}。`,
      digits: [...digits],
      power,
    },
  ];
  digits[power]++;
  frames.push({
    title: `添1个${countingUnits[power]}`,
    text: `添上的数量是${10 ** power}。满10个同样的计数单位时，要向左边相邻数位进1。`,
    digits: [...digits],
    power,
  });
  for (let index = power; index < 11; index++) {
    if (digits[index] < 10) break;
    digits[index] -= 10;
    digits[index + 1]++;
    frames.push({
      title: `10个${countingUnits[index]}换成1个${countingUnits[index + 1]}`,
      text: `数的大小没有因换单位而改变；${10 ** index}×10＝${10 ** (index + 1)}。相邻单位进率是10，不是每隔一级也进10。`,
      digits: [...digits],
      power: index + 1,
      exchangePower: index,
    });
  }
  frames.push({
    title: '读出添数后的结果',
    text: `${value}＋${10 ** power}＝${next}，读作${readChineseNumber(next)}。`,
    digits: [...digits],
    power,
    result: String(next),
    exchangePower: frames.at(-1)?.exchangePower ?? power,
  });
  return frames;
}
export function readingFrames(value: number): NumberFrame[] {
  assertLargeNumber(value);
  const groups = numberGroups(value).filter(
    (group) => group.value > 0 || (group.index === 0 && value === 0),
  );
  return [
    {
      title: '先分级，定位每个数字',
      text: '从右边起，每四个数位一级：个级、万级、亿级。空缺数位要用0占位，不能把数位挤在一起。',
    },
    ...groups.map((group) => ({
      title: `读${group.label}`,
      text: `${group.label}是${group.value}个${group.suffix || '一'}。从高位读起，万级后加“万”，亿级后加“亿”；低级不足四位或中间整级空缺时，衔接处读一个“零”。`,
      power: group.index * 4,
      readout: readChineseNumber(
        Math.floor(value / 10 ** (group.index * 4)) * 10 ** (group.index * 4),
      ),
    })),
    {
      title: '连起来读，再对照数位表写',
      text: '每级末尾的0不读；中间一个0或连续几个0只读一个“零”。写数时，从高位写起，每一级按四个数位对齐。',
      readout: readChineseNumber(value),
      result: String(value),
    },
  ];
}
export function approximationFrames(
  value: number,
  power: number,
  mode: 'round' | 'exact' | 'range',
): NumberFrame[] {
  const unit = countingUnits[power],
    position = `${unit}位`;
  if (mode === 'range') {
    const range = roundingRange(value, power);
    return [
      { title: '先确定目标近似数', text: `研究四舍五入到${position}后是${value}的非负整数。` },
      {
        title: '找下边界：刚好能进位',
        text: `从${range.lower}开始会舍入到${value}；${range.lower === 0 ? '范围从最小自然数0开始。' : `再少1的${range.lower - 1}不能舍入到这个目标。`}`,
      },
      {
        title: '找上边界：再多1就进到下一档',
        text: `${range.excludedUpper}会进到下一档，因此最大整数是${range.upper}。`,
      },
      {
        title: '完整范围，两端都要检查',
        text: `${range.lower} ≤ 原数 ≤ ${range.upper}。图上右侧空心点${range.excludedUpper}不包含在范围内。`,
        result: `${range.lower}～${range.upper}`,
      },
    ];
  }
  if (mode === 'exact') {
    const rewrite = exactLargeRewrite(value, power);
    return [
      {
        title: `每${rewrite.unit}是1${unit}`,
        text: '改换计数单位时，要保持原数的大小不变。',
        power,
      },
      {
        title: '检查尾数能否全部去掉',
        text: `${value}＝${rewrite.quotient}×${rewrite.unit}＋${rewrite.remainder}。`,
        power,
      },
      {
        title: rewrite.exact ? '精确改写，用等号' : '还有余数，不能直接去掉',
        text: rewrite.exact
          ? `${value}＝${rewrite.quotient}${unit}，数值没有变化。`
          : `还有${rewrite.remainder}，不能直接写成整数${unit}。可保留余数；如果题目要求近似数，再切换四舍五入。`,
        result: rewrite.exact ? `${value} = ${rewrite.quotient}${unit}` : undefined,
      },
    ];
  }
  const result = roundLargeNumber(value, power);
  return [
    {
      title: `确定保留到${position}`,
      text: `${position}右边的数字都是尾数。要用${unit}作单位求整数近似数。`,
      power,
    },
    {
      title: `看尾数最高位：${countingUnits[power - 1]}位`,
      text: `这一位是${result.decidingDigit}，${result.roundUp ? '大于或等于5，要向保留位进1' : '小于5，舍去尾数'}。不是看个位，也不是把尾数每一位逐次四舍五入。`,
      power: power - 1,
    },
    {
      title: '在数轴上比较距离',
      text: `相邻两档是${result.lower}和${result.upper}，中点是${result.midpoint}。距左端${value - result.lower}，距右端${result.upper - value}。原数${value < result.midpoint ? '在中点左边' : value === result.midpoint ? '正好在中点，按五入进到右边' : '在中点右边'}。`,
      power: power - 1,
    },
    {
      title: '写出近似数，注意进位',
      text: `${value} ${result.remainder === 0 ? '=' : '≈'} ${result.rounded}（${result.units}${unit}）。${result.remainder === 0 ? '尾数本来全为0，这次数值没有改变。' : '近似数与原数不相等，用约等号；进位时可能跨过多个9。'}`,
      power,
      result: `${value} ${result.remainder === 0 ? '=' : '≈'} ${result.units}${unit}`,
    },
  ];
}
