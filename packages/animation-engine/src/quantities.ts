import { quantityRelation, type UnknownQuantity } from '@mathstudy/math-core';
export interface QuantityFrame {
  title: string;
  text: string;
  groups: number;
  reveal: boolean;
}
export function quantityFrames(
  unitValue: number,
  count: number,
  context: 'groups' | 'shopping' | 'journey',
  unknown: UnknownQuantity,
  perHour = false,
): QuantityFrame[] {
  const relation = quantityRelation(unitValue, count);
  const names =
    context === 'groups'
      ? ['每组人数', '组数', '总人数']
      : context === 'shopping'
        ? ['单价', '数量', '总价']
        : ['速度', '时间', '路程'];
  const units =
    context === 'groups'
      ? ['人/组', '组', '人']
      : context === 'shopping'
        ? ['元/件', '件', '元']
        : perHour
          ? ['千米/时', '小时', '千米']
          : ['米/分', '分钟', '米'];
  const index = unknown === 'unit' ? 0 : unknown === 'count' ? 1 : 2;
  const facts = [unitValue, count, relation.total]
    .map((v, i) => `${names[i]}：${i === index ? '?' : v}${units[i]}`)
    .join('，');
  const base: QuantityFrame[] = [
    { title: '找出两个已知量', text: facts, groups: 0, reveal: false },
    {
      title: '先看一份和几份',
      text: `${names[0]}表示每一份的大小，${names[1]}表示这样的份数，${names[2]}表示合起来的总量。`,
      groups: 1,
      reveal: false,
    },
  ];
  if (unknown === 'total')
    for (let i = 1; i <= count; i++)
      base.push({
        title: `合起来看第${i}份`,
        text:
          context === 'journey'
            ? `按${unitValue}${units[0]}匀速行进，${i}${units[1]}走${unitValue * i}${units[2]}。`
            : `${i}份，每份${unitValue}${units[2]}，合起来是${unitValue * i}${units[2]}。`,
        groups: i,
        reveal: false,
      });
  else
    base.push({
      title: '把总量平均分',
      text:
        unknown === 'unit'
          ? `把${relation.total}${units[2]}平均分成${count}份，求每份是多少。`
          : `看${relation.total}${units[2]}里有多少个${unitValue}${units[2]}，就有多少份。`,
      groups: count,
      reveal: false,
    });
  base.push({
    title: unknown === 'total' ? '用乘法表示相同加数的和' : '用除法求未知的一个乘数',
    text: `${names[2]} = ${names[0]} × ${names[1]}；${relation.equations[unknown]}（${units[index]}）。`,
    groups: count,
    reveal: true,
  });
  return base;
}
