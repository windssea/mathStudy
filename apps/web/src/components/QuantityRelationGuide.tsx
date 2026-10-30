import { readChineseNumber, type UnknownQuantity } from '@mathstudy/math-core';

export default function QuantityRelationGuide({
  context,
  unitValue,
  count,
  perHour,
  unknown,
  onUnknown,
}: {
  context: 'groups' | 'shopping' | 'journey';
  unitValue: number;
  count: number;
  perHour: boolean;
  unknown: UnknownQuantity;
  onUnknown: (value: UnknownQuantity) => void;
}) {
  const names =
    context === 'groups'
      ? ['每份量', '份数', '总量']
      : context === 'shopping'
        ? ['单价', '数量', '总价']
        : ['速度', '时间', '路程'];
  const equations = [
    `${names[2]}＝${names[0]}×${names[1]}`,
    `${names[0]}＝${names[2]}÷${names[1]}`,
    `${names[1]}＝${names[2]}÷${names[0]}`,
  ];
  return (
    <section className="quantity-relation-guide" aria-label="数量关系图解">
      <h3>同一张图，三个问题</h3>
      <div className="quantity-relation-links" role="group" aria-label="切换数量关系">
        {(['total', 'unit', 'count'] as const).map((value, i) => (
          <button key={value} aria-pressed={value === unknown} onClick={() => onUnknown(value)}>
            {equations[i]}
          </button>
        ))}
      </div>
      {context === 'groups' ? (
        <>
          <p>乘数×乘数＝积；a×b＝c。</p>
          <p>积÷一个乘数＝另一个乘数。除法是乘法的逆运算。</p>
        </>
      ) : (
        <dl className="quantity-notation">
          <div>
            <dt>写作</dt>
            <dd>
              {unitValue}
              {context === 'shopping' ? '元/件' : perHour ? '千米/时' : '米/分'}
            </dd>
          </div>
          <div>
            <dt>读作</dt>
            <dd>
              {readChineseNumber(unitValue)}
              {context === 'shopping' ? '元每件' : perHour ? '千米每时' : '米每分'}
            </dd>
          </div>
          <div>
            <dt>意思</dt>
            <dd>
              {context === 'shopping'
                ? `一件${unitValue}元`
                : perHour
                  ? `一小时行${unitValue}千米`
                  : `一分钟行${unitValue}米`}
            </dd>
          </div>
        </dl>
      )}
      <p className="quantity-meaning">
        {unknown === 'total'
          ? context === 'journey'
            ? `${count}${perHour ? '小时' : '分钟'}，就是${count}段各${unitValue}${perHour ? '千米' : '米'}。`
            : `${count}份各${unitValue}${context === 'shopping' ? '元' : '人'}，求和用乘法。`
          : unknown === 'unit'
            ? `把${names[2]}平均分成${count}份，求每份多少。`
            : `每份${unitValue}，看${names[2]}里有几份。`}
      </p>
      <details>
        <summary>乘数交换后，对不对？</summary>
        <p>按“每份量×份数”写，便于对照图意；两个乘数交换，积不变。求什么量，要看题意和单位。</p>
      </details>
    </section>
  );
}
