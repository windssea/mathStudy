import { divide, longDivision, type DivisionColumn } from '@mathstudy/math-core';
export { perimeterSteps, areaSteps, type GeometryStep } from './geometry';

export interface Frame {
  id: string;
  title: string;
  text: string;
  phase: 'intro' | 'groups' | 'quotient' | 'multiply' | 'subtract' | 'bring' | 'check';
  columnIndex: number;
}
export function divisionFrames(
  n: number,
  d: number,
): { frames: Frame[]; columns: DivisionColumn[] } {
  const answer = divide(n, d);
  const columns = longDivision(n, d);
  const frames: Frame[] = [
    {
      id: 'intro',
      title: '先看商的位置',
      text: `先看被除数的前两位。够除就从十位商起，不够就看前三位。计算 ${n} ÷ ${d}。`,
      phase: 'intro',
      columnIndex: -1,
    },
  ];
  columns.forEach((c, i) => {
    const position = String(n).length - c.column - 1;
    const unit = position === 1 ? '十' : '个';
    frames.push({
      id: `q-${i}`,
      title: `商写在${unit}位`,
      text: `${c.partial} 里面最多有 ${c.digit} 个 ${d}。商 ${c.digit} 要写在${unit}位，数位要对齐。`,
      phase: 'quotient',
      columnIndex: i,
    });
    frames.push({
      id: `m-${i}`,
      title: '乘回去',
      text: `${d} × ${c.digit} = ${c.product}，把积与当前被除的部分对齐。`,
      phase: 'multiply',
      columnIndex: i,
    });
    frames.push({
      id: `s-${i}`,
      title: '相减求余',
      text: `${c.partial} − ${c.product} = ${c.remainder}。余下的 ${c.remainder} 比除数 ${d} 小。`,
      phase: 'subtract',
      columnIndex: i,
    });
    if (c.broughtDigit !== undefined)
      frames.push({
        id: `b-${i}`,
        title: '落下一位继续除',
        text: `把下一位 ${c.broughtDigit} 落下来，与余下的数组成 ${c.remainder * 10 + c.broughtDigit}，继续计算。`,
        phase: 'bring',
        columnIndex: i,
      });
  });
  frames.push({
    id: 'check',
    title: '用乘法验算',
    text: `${d} × ${answer.quotient} + ${answer.remainder} = ${n}。${answer.remainder === 0 ? '没有余数，正好分完。' : `余数 ${answer.remainder} 小于除数 ${d}，验算通过。`}`,
    phase: 'check',
    columnIndex: columns.length - 1,
  });
  return { frames, columns };
}

export function groupFrames(n: number, d: number): Frame[] {
  const { quotient: q, remainder: r } = divide(n, d);
  return [
    {
      id: 'intro',
      title: '有多少，可以怎么分？',
      text: `一共有 ${n} 本书，每 ${d} 本分成一组。先想一想，能分几组？`,
      phase: 'intro',
      columnIndex: 0,
    },
    {
      id: 'groups',
      title: '每组一样多',
      text: `每组 ${d} 本，${q} 组就是 ${d} × ${q} = ${d * q} 本。`,
      phase: 'groups',
      columnIndex: 0,
    },
    {
      id: 'remainder',
      title: r ? '剩下的不能再分一整组' : '刚好分完',
      text: r
        ? `还剩 ${r} 本，比 ${d} 本少，不够再分一组。余数是 ${r}。`
        : `已经分完了 ${n} 本书，余数是 0。`,
      phase: 'subtract',
      columnIndex: 0,
    },
    {
      id: 'check',
      title: '把分组写成除法',
      text: `${n} ÷ ${d} = ${q}${r ? `……${r}` : ''}。商表示组数，余数表示剩下的本数。`,
      phase: 'check',
      columnIndex: 0,
    },
  ];
}
export { quantityFrames, type QuantityFrame } from './quantities';
export { calculationFrames, type CalculationFrame } from './expressions';
export { arithmeticScenes, type ArithmeticScene } from './arithmetic-scenes';
