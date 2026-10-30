import {
  frame,
  text,
  rect,
  line,
  equalGroups,
  operationTree,
  type MethodCheck,
  type MethodNode,
  type MethodStory,
  type MethodTone,
} from './method-primitives';

/** Unit-local builders keep the same objects and scale from one state to the next. */
type Part = { value: number; label?: string; tone?: MethodTone };
const dot = (x: number, y: number, tone: MethodTone = 'known'): MethodNode => ({
  kind: 'dot',
  x,
  y,
  tone,
});
function band(
  parts: Part[],
  y = 90,
  total = parts.reduce((n, p) => n + p.value, 0),
  h = 44,
): MethodNode[] {
  let x = 24;
  return parts.map((p) => {
    const width = (p.value / total) * 352;
    const node = rect(
      x,
      y,
      Math.max(0.8, width - Math.min(2, width / 8)),
      h,
      p.tone ?? 'known',
      p.label,
    );
    x += width;
    return node;
  });
}
function arrow(x: number, y: number, to: number, tone: MethodTone = 'focus'): MethodNode[] {
  const direction = to > x ? 1 : -1;
  return [
    line(x, y, to, y, tone),
    line(to, y, to - direction * 9, y - 6, tone),
    line(to, y, to - direction * 9, y + 6, tone),
  ];
}
const downArrow = (x: number, y: number, end: number, tone: MethodTone): MethodNode[] => [
  line(x, y, x, end, tone),
  line(x, end, x - 6, end - 9, tone),
  line(x, end, x + 6, end - 9, tone),
];
const check = (
  question: string,
  wrong: string,
  right: string,
  why: string,
  nodes: MethodNode[],
  wrongNodes: MethodNode[],
): MethodCheck => ({ question, wrong, right, why, nodes, wrongNodes });
const lesson = (
  prompt: string,
  frames: MethodStory['frames'],
  mistake: MethodCheck,
  transfer: MethodCheck,
): MethodStory => ({ prompt, frames, mistake, transfer });

/** Same-sized little boxes are individual containers; a single caption gives their unit. */
function containers(
  count: number,
  each: number,
  unit: string,
  heading: string,
  tone: MethodTone = 'focus',
): MethodNode[] {
  const columns = Math.min(10, Math.ceil(Math.sqrt(count * 1.5)));
  const rows = Math.ceil(count / columns);
  const w = 352 / columns;
  const h = Math.min(37, 144 / rows);
  return [
    text(200, 26, heading, 'quiet', 21),
    text(200, 56, `每小格 ${each}${unit}`, 'known', 20),
    ...Array.from({ length: count }, (_, i) =>
      rect(24 + (i % columns) * w, 75 + Math.floor(i / columns) * h, w - 3, h - 3, tone),
    ),
    text(200, 240, `${count} 份，共 ${count * each}${unit}`, tone, 22),
  ];
}
function conserved(
  a: number,
  eachA: number,
  b: number,
  eachB: number,
  unit: string,
  wrong = false,
): MethodNode[] {
  const totalA = a * eachA,
    totalB = b * eachB,
    scale = Math.max(totalA, totalB);
  const extra = totalB > totalA ? totalB - totalA : 0;
  return [
    text(
      200,
      27,
      wrong ? '错法：每份不变，又增加份数' : '重分前后，总量必须相同',
      wrong ? 'error' : 'focus',
      21,
    ),
    text(200, 63, `原来 ${a} 份，每份 ${eachA}${unit}`, 'known', 20),
    ...band(
      Array.from({ length: a }, () => ({ value: eachA })),
      77,
      scale,
      36,
    ),
    text(200, 147, `现在 ${b} 份，每份 ${eachB}${unit}`, wrong ? 'error' : 'focus', 20),
    ...band(
      Array.from({ length: b }, (_, i) => ({
        value: eachB,
        tone: wrong && (i + 1) * eachB > totalA ? ('error' as const) : ('focus' as const),
      })),
      161,
      scale,
      36,
    ),
    text(
      200,
      237,
      wrong
        ? `原来 ${totalA}，却变成 ${totalB}，多 ${extra}${unit}`
        : `${totalA}${unit} = ${totalB}${unit}`,
      wrong ? 'error' : 'focus',
      20,
    ),
  ];
}
function difference(whole: number, kept: number, unit: string, heading: string): MethodNode[] {
  return [
    text(200, 27, heading, 'quiet', 21),
    text(200, 66, `原来 ${whole}${unit}`, 'known', 20),
    ...band([{ value: whole }], 81, whole, 35),
    ...band(
      [
        { value: kept, label: String(kept), tone: 'focus' },
        { value: whole - kept, label: `差 ${whole - kept}`, tone: 'warm' },
      ],
      161,
      whole,
      42,
    ),
    line(24 + (kept / whole) * 352, 124, 24 + (kept / whole) * 352, 213, 'warm', true),
    text(200, 240, `${kept} + ${whole - kept} = ${whole}${unit}`, 'focus', 21),
  ];
}
function pricedItems(count: number, price: number, heading: string, badFrom = count): MethodNode[] {
  return [
    text(200, 30, heading, badFrom < count ? 'error' : 'known', 21),
    ...Array.from({ length: count }, (_, i) =>
      rect(
        24 + (i * 352) / count,
        80,
        352 / count - 4,
        64,
        i >= badFrom ? 'error' : 'known',
        String(price),
      ),
    ),
    text(
      200,
      206,
      badFrom < count ? '红框：把笔错当成本子的单价' : `每一框 ${price} 元，共 ${count} 框`,
      badFrom < count ? 'error' : 'focus',
      20,
    ),
  ];
}
function money(total: number, paid: number, reveal = true, wrongSide = false): MethodNode[] {
  return [
    text(200, 30, `共有 ${total} 元`, 'known', 22),
    ...band([
      { value: paid, label: `已花 ${paid}`, tone: wrongSide ? 'error' : 'known' },
      { value: total - paid, label: reveal ? `剩 ${total - paid}` : '剩 ?', tone: 'focus' },
    ]),
    ...(wrongSide
      ? [
          text(200, 211, '错把已花的钱拿去继续买书', 'error', 20),
          ...arrow(24 + (paid / total) * 176, 151, 90, 'error'),
        ]
      : [text(200, 211, '花掉的和剩下的合起来，仍是原款', 'quiet', 20)]),
  ];
}
function bookPacks(
  packSize: number,
  packs: number,
  loose: number,
  wrongDiscount = false,
  pricing = { pack: 30, single: 11 },
  firstPackOnly = false,
): MethodNode[] {
  const count = packSize * packs + loose,
    width = 352 / count;
  return [
    text(
      200,
      28,
      firstPackOnly
        ? '先看左边一包，其余暂不分组'
        : wrongDiscount
          ? '错法：散本也套用整包单价'
          : '左侧整包，右侧散买',
      wrongDiscount ? 'error' : 'known',
      21,
    ),
    ...Array.from({ length: count }, (_, i) =>
      rect(
        24 + i * width + 3,
        83,
        width - 8,
        56,
        firstPackOnly
          ? i < packSize
            ? 'focus'
            : 'quiet'
          : wrongDiscount && i >= packs * packSize
            ? 'error'
            : 'known',
      ),
    ),
    ...Array.from({ length: firstPackOnly ? 1 : packs }, (_, i) =>
      rect(24 + i * packSize * width, 72, packSize * width - 3, 78, 'focus', undefined, true),
    ),
    ...(loose && !firstPackOnly
      ? [
          rect(
            24 + packs * packSize * width,
            72,
            loose * width - 3,
            78,
            wrongDiscount ? 'error' : 'warm',
            undefined,
            true,
          ),
        ]
      : []),
    text(
      200,
      198,
      firstPackOnly
        ? `左边一包：${packSize}本，${pricing.pack}元`
        : `${packs} 包 × ${packSize} 本 + 散买 ${loose} 本`,
      'focus',
      21,
    ),
    text(
      200,
      235,
      firstPackOnly
        ? `每本均价 ${pricing.pack}÷${packSize}＝${pricing.pack / packSize}元`
        : loose
          ? wrongDiscount
            ? `散本错按${pricing.pack / packSize}元，少算${loose * (pricing.single - pricing.pack / packSize)}元`
            : `整包${pricing.pack}元；散本${pricing.single}元/本`
          : '每包都是完整的一组',
      wrongDiscount ? 'error' : 'quiet',
      20,
    ),
  ];
}
function priceComparison(): MethodNode[] {
  return [
    text(200, 27, '每个方案都正好买到 8 本', 'known', 21),
    ...[88, 85, 82].flatMap((cost, i) => [
      text(77, 65 + i * 63, `${i}包+${8 - i * 3}本`, 'quiet', 18),
      rect(145, 40 + i * 63, (cost / 88) * 170, 42, i === 2 ? 'focus' : 'known'),
      text(350, 68 + i * 63, `${cost}元`, i === 2 ? 'focus' : 'known', 21),
    ]),
  ];
}
function speedMap(
  minutes: number,
  perMinute: number,
  heading: string,
  wrongUnit = false,
): MethodNode[] {
  const columns = Math.min(12, minutes),
    w = 352 / columns;
  return [
    text(200, 27, heading, wrongUnit ? 'error' : 'known', 21),
    ...Array.from({ length: minutes }, (_, i) =>
      rect(
        24 + (i % columns) * w,
        69 + Math.floor(i / columns) * 51,
        w - 2,
        37,
        i === 0 ? 'focus' : 'known',
      ),
    ),
    ...(wrongUnit
      ? [
          line(24, 165, 376, 165, 'error'),
          line(24, 158, 24, 172, 'error'),
          line(376, 158, 376, 172, 'error'),
        ]
      : []),
    text(
      200,
      200,
      wrongUnit
        ? `错：把 ${minutes} 分的总路程写成 ${perMinute} 米`
        : `每格 1 分，每格走 ${perMinute} 米`,
      wrongUnit ? 'error' : 'focus',
      20,
    ),
    text(
      200,
      239,
      wrongUnit ? '把一格的量错放到整段上' : `${minutes} 分走 ${minutes * perMinute} 米`,
      wrongUnit ? 'error' : 'known',
      21,
    ),
  ];
}
function addUnlikeUnits(speed: number, minutes: number): MethodNode[] {
  return [
    text(200, 30, '错法：把不同单位直接相加', 'error', 21),
    rect(28, 75, 144, 60, 'known', `${speed} 米/分`),
    rect(226, 75, 144, 60, 'known', `${minutes} 分`),
    text(200, 111, '+', 'error', 26),
    ...downArrow(200, 147, 177, 'error'),
    text(200, 209, `错写成 ${speed + minutes} 米`, 'error', 22),
  ];
}
function route(stage: number): MethodNode[] {
  return [
    text(200, 27, '同一路程，出发点与终点不变', 'quiet', 21),
    text(30, 66, '甲地', 'known', 18),
    text(367, 66, '乙地', 'known', 18),
    ...band(
      Array.from({ length: 3 }, () => ({ value: 60, label: '60' })),
      83,
      180,
      40,
    ),
    ...arrow(30, 137, 369),
    text(200, 72, '去程：每格 1 时', 'known', 20),
    ...(stage > 0
      ? [
          ...band(
            [
              { value: 90, label: '90', tone: 'focus' },
              { value: 90, label: '90', tone: 'focus' },
            ],
            164,
            180,
            40,
          ),
          ...arrow(369, 218, 30),
          text(200, 157, '返回：每格 1 时', 'focus', 20),
        ]
      : [text(200, 195, '返回每时走 90 千米，时间待求', 'quiet', 20)]),
  ];
}
function timeStrip(
  go: number,
  back: number,
  rest: number,
  omitRest = false,
  timeUnit = '时',
): MethodNode[] {
  const count = go + back + rest,
    width = 352 / count;
  const long = count > 8;
  return [
    text(200, 30, `每个框都是经过的1${timeUnit}`, 'known', 21),
    ...Array.from({ length: count }, (_, i) =>
      rect(
        24 + i * width,
        83,
        width - 3,
        67,
        i < go ? 'known' : i < go + back ? 'focus' : omitRest ? 'error' : 'warm',
        long ? undefined : i < go ? '去' : i < go + back ? '回' : '休',
        omitRest && i >= go + back,
      ),
    ),
    ...(long
      ? [
          text(24 + (go * width) / 2, 183, `去${go}${timeUnit}`, 'known', 18),
          text(24 + (go + back / 2) * width, 183, `回${back}${timeUnit}`, 'focus', 18),
          text(
            24 + (go + back + rest / 2) * width,
            183,
            `休${rest}${timeUnit}`,
            omitRest ? 'error' : 'warm',
            18,
          ),
        ]
      : []),
    ...(omitRest
      ? [
          line(24 + (go + back) * width, 79, 374, 155, 'error'),
          text(200, 229, `漏掉休息${rest}${timeUnit}，会少算时间`, 'error', 21),
        ]
      : [
          text(
            200,
            229,
            rest
              ? `行走${go + back}${timeUnit} + 休息${rest}${timeUnit}`
              : `这里只计行走，共${go + back}${timeUnit}`,
            'focus',
            22,
          ),
        ]),
  ];
}
function unitConfusion(): MethodNode[] {
  return [
    text(200, 27, '错法：把千克之差当箱数之差', 'error', 21),
    rect(24, 70, 146, 56, 'known', '每箱 12千克'),
    rect(228, 70, 146, 56, 'known', '每箱 9千克'),
    text(200, 104, '−', 'quiet', 24),
    text(200, 167, '每箱多 3 千克', 'known', 22),
    ...downArrow(200, 184, 209, 'error'),
    text(200, 236, '却错写：少用 3 箱', 'error', 22),
  ];
}
function wrongOrder(): MethodNode[] {
  return [
    text(200, 27, '错法：跳过左边的除法', 'error', 21),
    text(200, 64, '96 ÷ 4 × 3 − 18', 'known', 25),
    rect(122, 84, 155, 50, 'error', '先算 4 × 3'),
    line(200, 134, 200, 160, 'error'),
    rect(93, 160, 215, 48, 'error', '先除以 12，得 8'),
    text(200, 242, '减18前：原来72，错法8', 'error', 20),
  ];
}
function bracketWhole(wrong = false): MethodNode[] {
  return [
    text(
      200,
      27,
      wrong ? '错法：只用整体中的一份作除数' : '整个中括号是一份完整除数',
      wrong ? 'error' : 'focus',
      21,
    ),
    rect(27, 61, 346, 105, 'quiet', undefined, true),
    ...[0, 1, 2].map((i) =>
      rect(38 + i * 109, 86, 100, 54, wrong && i > 0 ? 'quiet' : 'focus', '20'),
    ),
    ...(wrong
      ? [
          line(150, 77, 363, 151, 'error'),
          text(200, 205, '把“×3”移到除法外面，整体变了', 'error', 20),
        ]
      : [text(200, 205, '20 + 20 + 20 = 60', 'focus', 23)]),
    text(
      200,
      241,
      wrong ? '错：840 ÷ 20 × 3' : '840 要按每 60 一份分组',
      wrong ? 'error' : 'known',
      21,
    ),
  ];
}
function rope(total: number, used: number, reverse = false, wrong = false): MethodNode[] {
  if (wrong) {
    const remaining = total - used,
      difference = used - remaining;
    return [
      text(200, 26, '错把两个部分对齐求差', 'error', 21),
      text(200, 62, `用去 ${used} 米`, 'known', 20),
      ...band([{ value: used }], 76, used, 37),
      text(200, 148, `剩下 ${remaining} 米`, 'focus', 20),
      ...band(
        [
          { value: remaining, tone: 'focus' },
          { value: difference, label: `差${difference}`, tone: 'error' },
        ],
        161,
        used,
        42,
      ),
      text(200, 242, `相差${difference}米，不是原长${total}米`, 'error', 20),
    ];
  }
  return [
    text(200, 28, reverse ? '按原来的方向，再用掉一次检查' : '求原来，把两段接回去', 'known', 21),
    ...band(
      [
        { value: used, label: `用 ${used}`, tone: reverse ? 'quiet' : 'known' },
        { value: total - used, label: `剩 ${total - used}`, tone: 'focus' },
      ],
      100,
      total,
      59,
    ),
    ...(reverse
      ? [
          line(29, 95, 24 + (used / total) * 352 - 5, 164, 'warm'),
          text(200, 220, `${total} − ${used} = ${total - used}`, 'focus', 24),
        ]
      : [text(200, 220, `${used} + ${total - used} = ${total}`, 'focus', 24)]),
  ];
}
function fleets(stage: number): MethodNode[] {
  return [
    text(200, 23, '座位先够 63 人，再比费用', 'known', 20),
    ...[3, 2, 1, 0].flatMap((large, row) => {
      const y = 37 + row * 48,
        seats = large * 24 + (3 - large) * 16,
        possible = seats >= 63;
      let x = 65;
      return [
        text(28, y + 26, `${large}大`, 'quiet', 18),
        ...Array.from({ length: 3 }, (_, i) => {
          const big = i < large,
            w = big ? 60 : 40;
          const node = rect(
            x,
            y,
            w,
            38,
            possible ? (large === 2 && stage > 0 ? 'focus' : 'known') : 'quiet',
            big ? '24' : '16',
          );
          x += w + 4;
          return node;
        }),
        text(300, y + 26, `${seats}座`, possible ? 'known' : 'error', 19),
        ...(stage > 0 && possible
          ? [
              text(
                361,
                y + 26,
                `${large * 180 + (3 - large) * 140}`,
                large === 2 ? 'focus' : 'known',
                20,
              ),
            ]
          : []),
        ...(!possible ? [line(276, y + 8, 325, y + 34, 'error')] : []),
      ];
    }),
    text(
      200,
      246,
      stage > 0 ? '右列费用：元；不够坐的不比较' : '宽框：大车；窄框：小车',
      'quiet',
      18,
    ),
  ];
}
function capacity(seats: number, people: number, fee: number): MethodNode[] {
  const columns = 10,
    x = (index: number) => 47 + (index % columns) * 34,
    y = (index: number) => 58 + Math.floor(index / columns) * 23;
  return [
    text(
      200,
      25,
      `${seats} 座，${people} 人，费用 ${fee} 元`,
      seats < people ? 'error' : 'focus',
      21,
    ),
    ...Array.from({ length: people }, (_, i) => dot(x(i), y(i), i < seats ? 'known' : 'error')),
    ...Array.from({ length: Math.max(0, seats - people) }, (_, i) =>
      rect(x(people + i) - 8, y(people + i) - 8, 16, 16, 'quiet', undefined, true),
    ),
    text(
      200,
      240,
      seats < people
        ? `${people - seats} 人没有座位，不能选`
        : `都能坐下；空框是余下 ${seats - people} 座`,
      seats < people ? 'error' : 'focus',
      21,
    ),
    line(27, 218, 375, 218, seats < people ? 'error' : 'focus'),
  ];
}

export const unit34Stories: Record<string, MethodStory> = {};

unit34Stories['u3-inverse'] = lesson(
  '同一队人原来排成12行，每行30人，平均改排成18行，每行多少人？',
  [
    frame(
      '先守住总人数',
      '队伍变了，人没有增减。先把原来的全部人数求出来。',
      '12 × 30 = 360 人',
      equalGroups(12, 30, '原来 12 行，每个框是一行'),
    ),
    frame(
      '用同一总数重新分组',
      '360 人平均分成 18 行。行数增加，每行人数要减少。',
      '360 ÷ 18 = 20 人',
      equalGroups(18, 20, '现在 18 行：框多了，每框少了', 'focus'),
    ),
    frame(
      '对齐两条总量，检查没有人增减',
      '每一条完整长条都代表 360 人。分界线变多了，整条总量没有变。',
      '18 × 20 = 12 × 30 = 360',
      conserved(12, 30, 18, 20, '人'),
    ),
  ],
  check(
    '同一队人原来12行，每行30人。改排18行，每行仍放30人，可以吗？',
    '可以，只增加行数',
    '不可以，总人数会变多',
    '18 行每行 30 人会成为 540 人，比原来多 180 人。重排不能凭空增加人数。',
    conserved(12, 30, 18, 20, '人'),
    conserved(12, 30, 18, 30, '人', true),
  ),
  check(
    '换一组：同一队人原来8行，每行24人，平均改排12行，每行多少人？',
    '24 人，每行不变',
    '16 人，总数仍是 192 人',
    '8×24=192，192÷12=16。把每行也保留为24，会凭空增加96人。',
    conserved(8, 24, 12, 16, '人'),
    conserved(8, 24, 12, 24, '人', true),
  ),
);
unit34Stories['u3-shopping'] = lesson(
  '买4本本子，每本12元；买3支笔，每支5元。付100元，应找回多少元？',
  [
    frame(
      '相同单价的本子先成一组',
      '每本 12 元，4 本就是 4 份 12 元。先求本子费。',
      '12 × 4 = 48 元',
      pricedItems(4, 12, '本子：4 本，每本 12 元'),
    ),
    frame(
      '笔的单价不同，另算一组',
      '每支笔 5 元，3 支就是 3 份 5 元。不能把笔也按 12 元计算。',
      '5 × 3 = 15 元',
      pricedItems(3, 5, '笔：3 支，每支 5 元'),
    ),
    frame('两笔费用合起来', '48 元和 15 元都是花掉的钱，单位相同才能相加。', '48 + 15 = 63 元', [
      text(200, 35, '花掉的钱分成两段', 'known', 22),
      ...band([
        { value: 48, label: '本子48' },
        { value: 15, label: '笔15', tone: 'focus' },
      ]),
      text(200, 217, '本子费 + 笔费 = 63 元', 'focus', 22),
    ]),
    frame(
      '付款中未花掉的部分就是找零',
      '100 元由花费和找零组成。拿走 63 元后还剩 37 元。',
      '100 − 63 = 37 元',
      money(100, 63),
    ),
  ],
  check(
    '买4本本子，每本12元；3支笔，每支5元。把7件一起乘12求总价，可以吗？',
    '可以，都是买了东西',
    '不能，笔和本子的单价不同',
    '笔每支只要5元。把三支笔也乘12，会把每支笔多算7元。',
    [
      text(200, 28, '两种单价，各自数份数', 'known', 21),
      ...band([
        { value: 48, label: '4×12' },
        { value: 15, label: '3×5', tone: 'focus' },
      ]),
      text(200, 217, '48 + 15 = 63 元', 'focus', 22),
    ],
    pricedItems(7, 12, '错把 7 件都当成每件 12 元', 4),
  ),
  check(
    '换一组：买2本本子，每本9元；买4支笔，每支3元。付50元，应找回多少元？',
    '找 32 元，只扣本子费',
    '找 20 元，因为花了 30 元',
    '2×9+4×3=30，50−30=20。先分别算费用，再从付款中取走总花费。',
    money(50, 30),
    [
      text(200, 30, '错法：只拿走本子费', 'error', 21),
      ...band([
        { value: 18, label: '只扣18', tone: 'known' },
        { value: 12, label: '漏扣12', tone: 'error' },
        { value: 20, label: '真找零20', tone: 'focus' },
      ]),
      text(200, 215, '漏掉笔费，会错找 32 元', 'error', 21),
    ],
  ),
);

unit34Stories['u3-compare'] = lesson(
  '散买每本11元，每包3本、整包30元。正好买8本，怎样花钱最少？',
  [
    frame(
      '优惠只给完整的一包',
      '一包有 3 本，30 元平均每本 10 元。单买一本仍要 11 元。',
      '30 ÷ 3 = 10 元/本',
      bookPacks(3, 2, 2, false, { pack: 30, single: 11 }, true),
    ),
    frame(
      '把 8 本按整包和散本分开',
      '8 本能分出两个完整的 3 本包。剩下 2 本不够一包，按单本价买。',
      '8 = 3 + 3 + 2',
      bookPacks(3, 2, 2),
    ),
    frame(
      '只比较正好买到 8 本的方案',
      '包数只能是0、1、2。每多买一个整包，就把三本散买换成一包。',
      '0 包 88 元；1 包 85 元；2 包 82 元',
      priceComparison(),
    ),
    frame(
      '把省下的钱也画出来',
      '两包加两本共82元。与全单买88元相比，少花6元。',
      '2 × 30 + 2 × 11 = 82；88 − 82 = 6',
      difference(88, 82, '元', '同样 8 本，比较费用差'),
    ),
  ],
  check(
    '每包3本、整包30元，散买每本11元。正好买8本，能都按每本10元算吗？',
    '能，一共 80 元',
    '不能，优惠价按整包出售',
    '只有完整三本包享受优惠。剩下两本每本11元，不能按10元算。',
    bookPacks(3, 2, 2),
    bookPacks(3, 2, 2, true),
  ),
  check(
    '换一组：每包4本、整包36元，散买每本10元。正好买10本，最少花多少元？',
    '10×9＝90元',
    '2×36＋2×10＝92元',
    '10本只能买两个整包，余下两本要单买。不能把不足一包的两本也按9元算。',
    bookPacks(4, 2, 2, false, { pack: 36, single: 10 }),
    bookPacks(4, 2, 2, true, { pack: 36, single: 10 }),
  ),
);
unit34Stories['u3-speed'] = lesson(
  '小明用12分钟走840米。保持同样速度，21分钟走多远？',
  [
    frame(
      '找每一小段相同时间的路程',
      '840米平均对应12个一分钟。取出其中一格，就得到每分钟的路程。',
      '840 ÷ 12 = 70 米/分',
      speedMap(12, 70, '先把 12 分钟平均分成 12 格'),
    ),
    frame(
      '时间增加，同样的一分钟重复21次',
      '速度没有变，每格仍走70米。21格路程合起来才是所求总路程。',
      '70 × 21 = 1470 米',
      speedMap(21, 70, '把每分钟 70 米延长到 21 分钟'),
    ),
    frame(
      '回看一格的单位，核对分组',
      '1470米平均分成21份，仍是每分70米。70的单位必须包含“每分”。',
      '1470 ÷ 21 = 70 米/分',
      [
        text(200, 32, '一格：1 分钟', 'known', 22),
        rect(62, 67, 276, 59, 'focus', '这一格走 70 米'),
        text(200, 182, '70 米/分 × 21 分 = 1470 米', 'focus', 21),
        line(73, 213, 327, 213),
        text(200, 243, '每格路程 × 格数 = 总路程', 'quiet', 20),
      ],
    ),
  ],
  check(
    '12分钟走840米，840÷12=70。这里的70表示什么？',
    '12 分钟的总路程是 70 米',
    '每 1 分钟走 70 米，单位米/分',
    '70对应一格一分钟，不是12格的总路程。原来12分钟的总路程仍是840米。',
    speedMap(12, 70, '一格 70 米，12 格 840 米'),
    speedMap(12, 70, '错把一格的路程标到整段上', true),
  ),
  check(
    '换一组：小明每分走45米，速度不变，5分钟走多远？',
    '45+5＝50米',
    '45×5＝225米',
    '45米/分表示每一分钟的一份路程。有5份相同路程，应该相乘，不能把速度和时间相加。',
    speedMap(5, 45, '5 份相同的 45 米'),
    addUnlikeUnits(45, 5),
  ),
);
unit34Stories['u3-journey'] = lesson(
  '去程每时60千米，行3时；原路返回每时90千米，全程共休息1时。含休息共用多久？',
  [
    frame(
      '先固定一条单程路程',
      '去程每小时60千米，走3小时。三个相同路段合成单程总长。',
      '60 × 3 = 180 千米',
      route(0),
    ),
    frame(
      '返回沿同一条路，换成更长的小时段',
      '返回仍是180千米，每小时走90千米。整条路只需两个90千米段。',
      '180 ÷ 90 = 2 时',
      route(1),
    ),
    frame(
      '先合计两段在路上的时间',
      '去程3小时，返回2小时。这里只统计行走时间，还没有包含休息。',
      '3 + 2 = 5 时（行走）',
      timeStrip(3, 2, 0),
    ),
    frame(
      '把停下的一小时也接上',
      '休息没有增加路程，却也经过了一小时。全程时间要把这一格加回去。',
      '3 + 2 + 1 = 6 时（全程）',
      timeStrip(3, 2, 1),
    ),
  ],
  check(
    '去程3时，回程2时，共休息1时。求全程经过的时间，要算休息吗？',
    '不用，休息没有增加路程',
    '要，休息也经过了时间',
    '总时间包含在路上和停下来的时间。漏掉一小时休息，会把6小时错写成5小时。',
    timeStrip(3, 2, 1),
    timeStrip(3, 2, 1, true),
  ),
  check(
    '换一组：单程600米，去每分60米，原路返回每分75米，全程共休息2分。含休息共用多久？',
    '18分，只加去程与回程',
    '20分：去10分＋回8分＋休2分',
    '去程600÷60=10分，回程600÷75=8分。休息也经过2分，全程是20分，不能只记行走的18分。',
    timeStrip(10, 8, 2, false, '分'),
    timeStrip(10, 8, 2, true, '分'),
  ),
);
unit34Stories['u3-conditions'] = lesson(
  '同一批水果，原来每箱9千克，装40箱；改成每箱12千克，少用几箱？',
  [
    frame(
      '每箱量和箱数合成总量',
      '图上每小格是一箱，每箱9千克。换箱前先确定总质量。',
      '9 × 40 = 360 千克',
      containers(40, 9, '千克', '原来：每个小格是一箱', 'known'),
    ),
    frame(
      '用同一总量装进新的箱子',
      '水果没有增减，总量仍是360千克。每箱装12千克，需要的箱数变少。',
      '360 ÷ 12 = 30 箱',
      containers(30, 12, '千克', '现在：每个小格仍是一箱'),
    ),
    frame(
      '题目问少几箱，要比较箱数',
      '30箱是现在需要的数量。把它与原来40箱对齐，空出的10箱才是减少的数量。',
      '40 − 30 = 10 箱',
      difference(40, 30, '箱', '比较箱数，不比较千克数'),
    ),
  ],
  check(
    '同一批水果原来40箱，每箱9千克；改成每箱12千克。12−9算出的3，能当作少用的箱数吗？',
    '能，少用3箱',
    '不能，3表示每箱多装3千克',
    '12与9的单位是千克，差也是千克。少几箱要比较40箱和30箱。',
    difference(40, 30, '箱', '正确：40 箱与 30 箱比较'),
    unitConfusion(),
  ),
  check(
    '换一组：同一批240千克水果，每箱8千克改成每箱12千克，少用几箱？',
    '少4箱，因为12−8＝4',
    '少10箱，因为30−20＝10',
    '总量240千克不变，箱数从30变成20。每箱多4千克，不等于少4箱。',
    difference(30, 20, '箱', '先求两种装法的箱数'),
    [
      text(200, 30, '错把每箱多装的量当成箱数', 'error', 21),
      rect(34, 83, 136, 59, 'known', '12 千克'),
      rect(230, 83, 136, 59, 'known', '8 千克'),
      text(200, 119, '−', 'quiet', 24),
      ...downArrow(200, 150, 181, 'error'),
      text(200, 214, '4 千克 ≠ 4 箱', 'error', 25),
    ],
  ),
);

unit34Stories['u4-order'] = lesson(
  '96 ÷ 4 × 3 − 18，第一步算什么？',
  [
    frame(
      '同级运算，先用左边两个量',
      '乘除同级，先算左边的96÷4。右边的3和18先保留，等待前面的结果。',
      '96 ÷ 4 = 24',
      operationTree(0),
    ),
    frame(
      '把已算出的24交给下一步',
      '24是前一步的结果，现在取它的3倍。减18仍在后面等待。',
      '24 × 3 = 72',
      operationTree(1),
    ),
    frame(
      '前面的乘除完成，再处理减法',
      '72已经合成一个结果。最后从72中拿走18。',
      '72 − 18 = 54',
      operationTree(2),
    ),
  ],
  check(
    '计算96÷4×3−18，能先把中间的4×3算成12吗？',
    '能，先乘后除',
    '不能，乘除同级，从左往右',
    '原式先得24，再取3倍是72。先算4×3会变成96÷12=8，改变了原来的分组。',
    operationTree(0),
    wrongOrder(),
  ),
  check(
    '换一组：72÷3×2−8，第一步算什么？',
    '先算3×2＝6',
    '先算72÷3＝24',
    '乘除同级，只能先用排在左边的72和3。把3×2先合成除数，会改变原来的运算关系。',
    [
      text(200, 30, '先取左边两个量', 'known', 21),
      rect(35, 78, 150, 57, 'focus', '72 ÷ 3'),
      rect(225, 78, 139, 57, 'quiet', '×2 −8'),
      line(110, 135, 110, 169, 'focus'),
      rect(52, 169, 116, 50, 'focus', '24'),
    ],
    [
      text(200, 30, '错把后面的乘法先合起来', 'error', 21),
      text(200, 82, '72 ÷ 3 × 2 − 8', 'known', 25),
      rect(110, 117, 180, 60, 'error', '先算 3×2＝6'),
      text(200, 233, '错误合成除数 6', 'error', 22),
    ],
  ),
);
unit34Stories['u4-brackets'] = lesson(
  '840 ÷ [(68 − 48) × 3]，为什么先算里面？',
  [
    frame(
      '先得到最里面的一份',
      '68减48得到20。这个20是后面三份相同数量中的一份。',
      '68 − 48 = 20',
      operationTree(0, true),
    ),
    frame(
      '把三份20圈成一个整体',
      '中括号把20×3作为完整除数。先把三份合成60，不能只取其中一份。',
      '20 × 3 = 60',
      bracketWhole(),
    ),
    frame(
      '用840按整份60分组',
      '每个框是完整的60。14份60正好合成840，整个除数都参与了分组。',
      '840 ÷ 60 = 14',
      containers(14, 60, '', '每框是一个完整除数 60'),
    ),
  ],
  check(
    '把840÷[20×3]改成840÷20×3，可以吗？',
    '可以，去掉中括号不影响',
    '不能，20×3必须先合成完整除数',
    '原式每份是60。改写后先按每份20分组再乘3，分组单位已经改变。',
    bracketWhole(),
    bracketWhole(true),
  ),
  check(
    '换一组：480÷[(35−15)×2]，应怎样分组？',
    '先480÷20，再乘2',
    '先合成每份40，再算480÷40',
    '括号里每份20共有两份，合起来是40。480应按完整的40分组，不是按20分后再扩大。',
    [
      text(200, 29, '一整个除数 = 两份 20', 'focus', 21),
      rect(38, 65, 324, 112, 'quiet', undefined, true),
      rect(52, 88, 140, 66, 'known', '20'),
      rect(207, 88, 140, 66, 'known', '20'),
      text(200, 228, '20×2＝40；480÷40＝12', 'focus', 22),
    ],
    [
      text(200, 29, '错法：把括号拆成两步', 'error', 21),
      rect(38, 88, 140, 66, 'focus', '只除 20'),
      rect(207, 88, 140, 66, 'error', '再 ×2'),
      line(183, 99, 196, 154, 'error'),
      text(200, 228, '除数从40错变成20', 'error', 22),
    ],
  ),
);
unit34Stories['u4-model'] = lesson(
  '有500元，先买4件用品，每件35元。余款买每本12元的书，最多买几本？',
  [
    frame(
      '先算已经花掉的部分',
      '4件用品，每件35元，共用去140元。图中另一段还没求出，不能当作全部500元来买书。',
      '35 × 4 = 140 元',
      money(500, 140, false),
    ),
    frame(
      '取剩下的钱作为一个整体',
      '从500元中拿走140元，剩下360元。只有右边这段钱还能买书。',
      '500 − 140 = 360 元',
      money(500, 140),
    ),
    frame(
      '把余款按每本12元分组',
      '每小格表示一本书，需要12元。360元正好组成30个这样的完整份。',
      '(500 − 35 × 4) ÷ 12 = 30 本',
      containers(30, 12, '元', '余款 360 元，每格一本书'),
    ),
  ],
  check(
    '有500元，先买4件用品，每件35元；余款买每本12元的书。除以12应作用在哪段钱上？',
    '作用在用品费35×4上',
    '作用在余款500−35×4上',
    '已花的钱不能再次买书。括号应圈住余款，再用这整个余款除以书价。',
    money(500, 140),
    money(500, 140, true, true),
  ),
  check(
    '换一组：有360元，买6件用品，每件20元。余款买每本15元的书，最多买几本？',
    '24本：360÷15',
    '16本：(360−20×6)÷15',
    '先拿走120元用品费，余款240元。每15元一份，只有16份，不是拿全部360元去分。',
    containers(16, 15, '元', '余款 240 元，每格一本书'),
    [
      text(200, 27, '错法：连花掉的钱也拿去买书', 'error', 21),
      ...band([
        { value: 120, label: '已花120', tone: 'error' },
        { value: 240, label: '余款240', tone: 'focus' },
      ]),
      text(200, 218, '错用全部 360÷15，会多算8本', 'error', 20),
    ],
  ),
);
unit34Stories['u4-steps'] = lesson(
  '一根绳子用去6段，每段9米，还剩17米。原来长多少米？',
  [
    frame('先把用去的六段接起来', '每段9米，六段首尾相接。先知道一共用去多少。', '9 × 6 = 54 米', [
      text(200, 31, '每一格是用掉的一段 9 米', 'known', 21),
      ...band(Array.from({ length: 6 }, () => ({ value: 9, label: '9' }))),
      text(200, 216, '用去的总长 54 米', 'focus', 22),
    ]),
    frame(
      '倒过来，把剩下的一段接回去',
      '原来的绳子包含用去的54米和剩下的17米。求原来要合并两段，不是再次拿走。',
      '54 + 17 = 71 米',
      rope(71, 54),
    ),
    frame(
      '顺着事情发生的方向复核',
      '从原来的71米拿走54米。右边确实还剩17米，拼回去的总长才合理。',
      '71 − 54 = 17 米',
      rope(71, 54, true),
    ),
  ],
  check(
    '绳子用去6段，每段9米，还剩17米。求原长，见到“还剩”就要减法吗？',
    '一定，见“剩下”就减',
    '不一定，求原来要把用去的加回',
    '用去的与剩下的是原长的两个部分。它们之间的差，不是原来的完整长度。',
    rope(71, 54),
    rope(71, 54, false, true),
  ),
  check(
    '换一组：一根绳子用去4段，每段8米，还剩19米。原来长多少米？',
    '13米：32−19',
    '51米：32＋19',
    '4×8=32米是用去的部分。把19米接回去得到51米，求差只会得到两段相差的长度。',
    rope(51, 32),
    rope(51, 32, false, true),
  ),
);
unit34Stories['u4-budget'] = lesson(
  '63人租车，每辆大车24座、180元，每辆小车16座、140元。最多租3辆，怎样租最省钱？',
  [
    frame(
      '先排除车辆数不够的情况',
      '两辆大车最多48座，仍不够63人。所以必须在三辆车的组合中选择。',
      '2 × 24 = 48 < 63',
      [
        text(200, 29, '即使用两辆最大的车也不够', 'known', 21),
        rect(44, 81, 142, 66, 'known', '24 座'),
        rect(213, 81, 142, 66, 'known', '24 座'),
        text(200, 210, '还差 63−48＝15 个座位', 'error', 22),
      ],
    ),
    frame(
      '逐个检查三辆组合能坐多少人',
      '三辆车有四种大小搭配。先划掉座位不足的两种，费用暂不参与筛选。',
      '72座、64座可行；56座、48座不够',
      fleets(0),
    ),
    frame(
      '只在够坐的方案里比较费用',
      '3大车540元，2大1小500元。选便宜的可行方案，不能选更便宜但不够坐的。',
      '2 × 180 + 140 = 500 元',
      fleets(1),
    ),
    frame(
      '用人数回查，确认所有人有座',
      '2大1小共64座，能坐下63人。只多出1个座位，人数和车辆限制都满足。',
      '24 × 2 + 16 = 64；64 − 63 = 1',
      capacity(64, 63, 500),
    ),
  ],
  check(
    '63人租车，小车每辆16座、140元。三辆小车共420元，能选这个方案吗？',
    '能，只选总价最低的',
    '不能，48座坐不下63人',
    '三辆小车少15个座位。先满足人数和车辆限制，再比较可行方案的费用。',
    capacity(64, 63, 500),
    capacity(48, 63, 420),
  ),
  check(
    '换一组：50人租车，每辆大车20座、110元，每辆小车12座、80元。最多3辆，怎样租最省钱？',
    '1大2小，270元',
    '2大1小，300元',
    '1大2小只有44座，便宜却坐不下。2大1小有52座，300元，比三大车330元更省。',
    capacity(52, 50, 300),
    capacity(44, 50, 270),
  ),
);
