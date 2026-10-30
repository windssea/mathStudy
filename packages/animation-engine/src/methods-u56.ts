import {
  text,
  rect,
  line,
  frame,
  type MethodNode,
  type MethodTone,
  type MethodStory,
  type MethodCheck,
} from './method-primitives';

const units = ['个', '十', '百', '千', '万', '十万', '百万', '千万', '亿', '十亿', '百亿', '千亿'];

/** Digit tiles stay in fixed place-value slots, including deliberately empty slots. */
function rail(
  value: string,
  focus: number[] = [],
  y = 80,
  slots = value.length,
  emptyZero = false,
  tone: MethodTone = 'known',
): MethodNode[] {
  const digits = value.padStart(slots, ' '),
    width = 352 / slots;
  const grouped = slots >= 6 && y >= 75 && y < 100;
  const tiles = [...digits].flatMap((digit, index) => [
    text(
      24 + width * (index + 0.5),
      y - 16,
      units[grouped ? (slots - index - 1) % 4 : slots - index - 1],
      'quiet',
      18,
    ),
    rect(
      24 + width * index,
      y,
      width - 2,
      60,
      focus.includes(index) ? 'focus' : digit === ' ' ? 'quiet' : tone,
      digit === ' ' || (emptyZero && digit === '0') ? undefined : digit,
      digit === ' ' || (emptyZero && digit === '0'),
    ),
  ]);
  if (grouped) {
    const split = slots - 4;
    return [
      ...tiles,
      text(24 + (width * split) / 2, y - 52, slots > 8 ? '高位' : '万级', 'known', 18),
      text(24 + width * (split + 2), y - 52, '个级', 'focus', 18),
      line(24 + width * split - 1, y - 25, 24 + width * split - 1, y + 67, 'quiet', true),
    ];
  }
  return tiles;
}
function levelRail(value: string, revealZero: boolean, focus: number[] = []): MethodNode[] {
  return [
    ...rail(value, focus, 83, 8, !revealZero),
    line(199, 72, 199, 143, 'quiet', true),
    text(111, 181, '万级4位', 'known', 20),
    text(289, 181, '个级4位', 'focus', 20),
  ];
}
function permutation(value: string, placed: number, wrong = false): MethodNode[] {
  const slots = value.length,
    width = 352 / slots;
  return [
    ...[...value].slice(placed).map((digit, i) => rect(24 + i * 48, 10, 40, 50, 'known', digit)),
    ...[...value].flatMap((digit, i) => [
      rect(
        24 + i * width,
        102,
        width - 3,
        48,
        wrong && i === 0 ? 'error' : i < placed ? 'focus' : 'quiet',
        i < placed ? digit : undefined,
        i >= placed,
      ),
      text(24 + width * (i + 0.5), 181, units[slots - i - 1], 'quiet', 18),
    ]),
    ...(placed ? [line(24 + width / 2, 64, 24 + width / 2, 91, wrong ? 'error' : 'focus')] : []),
    text(
      200,
      225,
      wrong ? '首位0会丢位数' : placed < slots ? '余下数字各用一次' : `组成 ${value}`,
      wrong ? 'error' : 'focus',
      20,
    ),
  ];
}
function wanPacks(merged = false): MethodNode[] {
  // One small square unit is one 万; all areas use exactly the same scale.
  const side = 69,
    area = ((4 * 100 + 2 * 10) * side * side) / 100;
  if (merged)
    return [
      rect(27, 87, 345, area / 345, 'focus', '420万'),
      text(200, 198, '数量不变，改用万', 'focus', 21),
    ];
  return [
    ...Array.from({ length: 4 }, (_, i) => rect(30 + i * 87, 64, side, side, 'known', '百')),
    ...Array.from({ length: 2 }, (_, i) => rect(30 + i * 87, 185, side, side / 10, 'focus', '十')),
    text(200, 31, '4百与2十（单位万）', 'known', 21),
    text(290, 213, '共420个万', 'focus', 21),
  ];
}
function roundLine(
  lower: number,
  value: number,
  choose: 'none' | 'lower' | 'upper' = 'none',
  wrong = false,
): MethodNode[] {
  const midpoint = lower + 5000,
    upper = lower + 10000,
    x = 40 + ((value - lower) / 10000) * 320;
  return [
    line(40, 123, 360, 123, 'known'),
    line(200, 112, 200, 134, 'quiet', true),
    {
      kind: 'dot',
      x: 40,
      y: 123,
      tone: choose === 'lower' ? (wrong ? 'error' : 'focus') : 'known',
    },
    {
      kind: 'dot',
      x: 360,
      y: 123,
      tone: choose === 'upper' ? (wrong ? 'error' : 'focus') : 'known',
    },
    { kind: 'dot', x, y: 123, tone: 'warm' },
    text(72, 174, `${lower / 10000}万`, 'known', 20),
    text(328, 174, `${upper / 10000}万`, 'known', 20),
    text(200, 213, `中点 ${midpoint}`, 'quiet', 20),
    text(200, 45, String(value), 'warm', 22),
    line(x, 57, x, 104, 'warm'),
    ...(choose === 'none'
      ? []
      : [
          line(x, 91, choose === 'upper' ? 354 : 46, 91, wrong ? 'error' : 'focus'),
          text(
            200,
            72,
            choose === 'upper' ? '向上一万' : '留在这一万',
            wrong ? 'error' : 'focus',
            20,
          ),
        ]),
    ...(value < midpoint && midpoint - value < 2
      ? [text(200, 244, `距中点还差${midpoint - value}`, 'warm', 18)]
      : []),
  ];
}
function roundingRange(wrong = false): MethodNode[] {
  return [
    line(40, 120, 360, 120, 'known'),
    rect(40, 99, 320, 42, 'focus'),
    { kind: 'dot', x: 40, y: 120, tone: 'focus' },
    line(360, 82, 360, 158, wrong ? 'focus' : 'error', !wrong),
    text(75, 184, '7365000', 'known', 20),
    text(324, 184, '7375000', 'known', 20),
    text(200, 46, '约为737万的整数', 'focus', 21),
    text(200, 225, wrong ? '错：右端也计入' : '上限7374999', wrong ? 'error' : 'focus', 20),
  ];
}
function codeStrip(
  year: string,
  shelf: string,
  serial: string,
  padded: boolean,
  broken = false,
): MethodNode[] {
  const code = padded
    ? year + shelf.padStart(2, '0') + serial.padStart(3, '0')
    : year + shelf + serial;
  const source = broken ? year + shelf + serial : code;
  const unpacked = !padded && !broken;
  const nodes: MethodNode[] = [
    text(103, 35, '年份', 'known', 20),
    text(unpacked ? 228 : 220, 35, '书架', 'warm', 20),
    text(unpacked ? 328 : 318, 35, '序号', 'focus', 20),
  ];
  if (unpacked) {
    return [
      ...nodes,
      rect(25, 84, 156, 65, 'known', year),
      rect(193, 84, 70, 65, 'warm', shelf),
      rect(275, 84, 105, 65, 'focus', serial),
      text(200, 213, '信息先分段，不直接挤在一起', 'quiet', 20),
    ];
  }
  const digitWidth = 39;
  for (let i = 0; i < 9; i++)
    nodes.push(
      rect(
        24 + i * digitWidth,
        84,
        digitWidth - 2,
        65,
        broken && i >= 4 ? 'error' : i < 4 ? 'known' : i < 6 ? 'warm' : 'focus',
        source[i],
        !source[i],
      ),
    );
  nodes.push(line(178, 65, 178, 162, 'quiet', true), line(256, 65, 256, 162, 'quiet', true));
  nodes.push(
    text(
      200,
      213,
      broken
        ? '删0后，分段位置变了'
        : `${year}｜${shelf.padStart(2, '0')}｜${serial.padStart(3, '0')}`,
      broken ? 'error' : 'focus',
      21,
    ),
  );
  return nodes;
}
function areaProduct(
  n: number,
  tens: number,
  ones: number,
  stage: number,
  wrong = false,
): MethodNode[] {
  const total = tens * 10 + ones,
    unitWidth = 352 / total,
    left = 24,
    top = 65,
    height = 92;
  const nodes: MethodNode[] = [text(200, 30, `每份 ${n}，一共 ${total} 份`, 'known', 21)];
  if (wrong) {
    nodes.push(rect(left, top, tens * unitWidth, height, 'error', String(n * tens)));
    nodes.push(
      rect(
        left + tens * unitWidth,
        top,
        tens * 9 * unitWidth,
        height,
        'error',
        `漏${tens * 9}份`,
        true,
      ),
    );
    nodes.push(
      rect(left + tens * 10 * unitWidth, top, ones * unitWidth, height, 'known', String(n * ones)),
    );
    nodes.push(text(200, 218, `误把 ${tens * 10} 份当 ${tens} 份`, 'error', 21));
    return nodes;
  }
  if (stage >= 3)
    return [
      ...nodes,
      rect(left, top, 352, height, 'focus', String(n * total)),
      line(
        left + tens * 10 * unitWidth,
        top,
        left + tens * 10 * unitWidth,
        top + height,
        'known',
        true,
      ),
      text(200, 218, '两块合并，总份数不变', 'focus', 21),
    ];
  nodes.push(
    rect(
      left,
      top,
      tens * 10 * unitWidth,
      height,
      stage ? 'focus' : 'known',
      stage ? String(n * tens * 10) : `${tens * 10}份`,
    ),
  );
  nodes.push(
    rect(
      left + tens * 10 * unitWidth,
      top,
      ones * unitWidth,
      height,
      'known',
      stage ? String(n * ones) : `${ones}份`,
    ),
  );
  if (stage === 2)
    nodes.push(
      line(110, 158, 165, 192, 'focus'),
      line(345, 158, 235, 192, 'known'),
      rect(126, 195, 148, 43, 'focus', String(n * total)),
    );
  else
    nodes.push(
      text(
        200,
        219,
        stage ? `${n * tens}个十 = ${n * tens * 10}` : '分成十位份数和个位份数',
        'focus',
        21,
      ),
    );
  return nodes;
}
function shiftTiles(base: string, shift: number, complete: boolean): MethodNode[] {
  const slots = base.length + shift,
    width = 352 / slots;
  return [
    ...rail(base, [], 53, slots),
    ...rail(
      complete ? base + '0'.repeat(shift) : base,
      complete ? Array.from({ length: base.length }, (_, i) => i) : [],
      156,
      slots,
    ),
    ...[...base].map((_, i) =>
      line(
        24 + width * (shift + i + 0.5),
        105,
        24 + width * ((complete ? 0 : shift) + i + 0.5),
        130,
        'focus',
      ),
    ),
    text(
      200,
      244,
      complete ? (shift === 1 ? '左移一位' : '左移两位') : shift === 1 ? '还要乘十' : '还要乘一百',
      'focus',
      18,
    ),
  ];
}
function writtenProduct(n: number, tens: number, ones: number): MethodNode[] {
  const values = [n * ones, n * tens * 10, n * (tens * 10 + ones)];
  const labels = [`${ones}份`, `${tens * 10}份`, '合计'];
  const columns = String(values[2]).length;
  const width = 244 / columns;
  return [
    text(200, 24, '同一数位上下对齐', 'focus', 21),
    ...Array.from({ length: columns }, (_, i) =>
      text(132 + width * (i + 0.5), 51, units[columns - i - 1], 'quiet', 18),
    ),
    ...values.flatMap((value, row) => [
      text(67, 87 + row * 63, labels[row], row === 1 ? 'focus' : 'known', 20),
      ...[...String(value).padStart(columns, ' ')].map((digit, column) =>
        rect(
          132 + width * column,
          59 + row * 63,
          width - 3,
          43,
          row === 1 ? 'focus' : 'known',
          digit.trim() || undefined,
          !digit.trim(),
        ),
      ),
    ]),
    line(132, 174, 376, 174, 'known'),
  ];
}
function convolution(n: number): MethodNode[] {
  const count = Array.from({ length: n * 2 - 1 }, (_, i) => Math.min(i + 1, n, n * 2 - 1 - i));
  const width = 332 / count.length;
  return [
    text(200, 27, '每点为一次1×1，同列同数位', 'known', 20),
    ...Array.from(
      { length: n * n },
      (_, i): MethodNode => ({
        kind: 'dot',
        x: 34 + ((i % n) + Math.floor(i / n) + 0.5) * width,
        y: 55 + Math.floor(i / n) * 29,
        tone: 'known',
      }),
    ),
    ...count.flatMap((value, i) => [
      line(34 + (i + 0.5) * width, 160, 34 + (i + 0.5) * width, 183, 'quiet'),
      rect(34 + i * width, 187, width - 4, 40, 'focus', String(value)),
    ]),
    text(200, 247, '左侧高位，最右是个位', 'quiet', 18),
  ];
}
function carryColumn(
  ones: number,
  tens: number,
  exchanged: boolean,
  wrong = false,
  concrete = false,
): MethodNode[] {
  const nextTens = tens + (exchanged ? Math.floor(ones / 10) : 0),
    nextOnes = exchanged ? ones % 10 : ones;
  return [
    text(108, 30, concrete ? '十位' : '高一位', 'known', 20),
    text(292, 30, concrete ? '个位' : '本位', 'focus', 20),
    rect(40, 55, 136, 137, 'quiet', undefined, true),
    rect(224, 55, 136, 137, wrong ? 'error' : 'quiet', undefined, true),
    ...Array.from(
      { length: nextTens },
      (_, i): MethodNode => ({
        kind: 'dot',
        x: 65 + (i % 4) * 27,
        y: 85 + Math.floor(i / 4) * 30,
        tone: 'known',
      }),
    ),
    ...Array.from(
      { length: nextOnes },
      (_, i): MethodNode => ({
        kind: 'dot',
        x: 246 + (i % 4) * 27,
        y: 81 + Math.floor(i / 4) * 30,
        tone: wrong ? 'error' : 'focus',
      }),
    ),
    text(
      200,
      228,
      wrong
        ? '错：同一位直接写10以上'
        : concrete
          ? `${nextTens}个十与${nextOnes}个一`
          : exchanged
            ? '进1，本位留0'
            : `${ones}个本位单位`,
      wrong ? 'error' : 'focus',
      20,
    ),
    ...(exchanged ? [line(249, 205, 142, 205, 'focus')] : []),
  ];
}
function missingShares(
  n: number,
  total: number,
  counted: number,
  recovered: number,
  complete = false,
): MethodNode[] {
  const u = 352 / total,
    missing = total - counted;
  const nodes: MethodNode[] = [text(200, 30, `${total}份，每份${n}`, 'known', 21)];
  if (complete)
    return [
      ...nodes,
      rect(24, 74, 352, 94, 'focus', String(n * total)),
      text(200, 220, `${counted}份 + ${missing}份 = ${total}份`, 'focus', 21),
    ];
  nodes.push(rect(24, 74, counted * u, 94, 'known', String(counted * n)));
  if (recovered)
    nodes.push(rect(24 + counted * u, 74, recovered * u, 94, 'focus', String(recovered * n)));
  if (recovered < missing)
    nodes.push(
      rect(
        24 + (counted + recovered) * u,
        74,
        (missing - recovered) * u,
        94,
        'error',
        `还漏${missing - recovered}份`,
        true,
      ),
    );
  nodes.push(
    text(
      200,
      219,
      recovered === missing
        ? `补回${missing}份，共${missing * n}`
        : recovered
          ? `只补${recovered}份，仍没补全`
          : `漏了${missing}份`,
      recovered === missing ? 'focus' : 'error',
      21,
    ),
  );
  return nodes;
}
function itemRefunds(count: number, extra: number, stage: number, wrong = false): MethodNode[] {
  const columns = 7;
  if (stage === 2) {
    const total = count * extra;
    if (wrong)
      return [
        text(200, 27, '错：只退回一件的差价', 'error', 21),
        rect(32, 55, 80, 49, 'focus', undefined, true),
        ...Array.from(
          { length: extra },
          (_, i): MethodNode => ({ kind: 'dot', x: 60 + i * 20, y: 80, tone: 'focus' }),
        ),
        rect(16, 113, 368, 105, 'error', undefined, true),
        ...Array.from(
          { length: total - extra },
          (_, i): MethodNode => ({
            kind: 'dot',
            x: 27 + (i % 14) * 26,
            y: 128 + Math.floor(i / 14) * 20,
            tone: 'error',
          }),
        ),
        text(200, 243, `${total - extra}元还没退`, 'error', 18),
      ];
    return [
      text(200, 27, `${count}份${extra}元，一起退回`, 'focus', 21),
      rect(16, 46, 368, 162, 'focus', undefined, true),
      ...Array.from(
        { length: total },
        (_, i): MethodNode => ({
          kind: 'dot',
          x: 27 + (i % 14) * 26,
          y: 64 + Math.floor(i / 14) * 31,
          tone: 'focus',
        }),
      ),
      text(200, 239, `每点1元，共${total}元`, 'focus', 20),
    ];
  }
  return [
    text(200, 27, stage === 0 ? `每格1件，共${count}件` : `每件多算${extra}元`, 'known', 21),
    ...Array.from({ length: count }, (_, i) => {
      const x = 33 + (i % columns) * 48,
        y = 49 + Math.floor(i / columns) * 31;
      return [
        rect(x, y, 40, 26, stage === 0 ? 'known' : 'quiet'),
        ...(stage
          ? Array.from(
              { length: extra },
              (_, k): MethodNode => ({
                kind: 'dot',
                x: x + 11 + k * 14,
                y: y + 13,
                tone: wrong && i > 0 ? 'error' : 'focus',
              }),
            )
          : []),
      ];
    }).flat(),
    text(
      200,
      232,
      stage === 0
        ? '每一件都按同一单价计算'
        : wrong
          ? `错：只退回1件的${extra}元`
          : `${count}份${extra}元，共${count * extra}元`,
      wrong ? 'error' : 'focus',
      20,
    ),
  ];
}
function budgetBar(budget: number, spent: number): MethodNode[] {
  const change = budget - spent,
    spentWidth = (352 * spent) / budget;
  return [
    text(200, 31, `预算 ${budget}元`, 'known', 22),
    rect(24, 75, spentWidth, 84, 'known', `花${spent}`),
    rect(24 + spentWidth, 75, 352 - spentWidth, 84, 'focus', `剩${change}`),
    text(200, 219, `${spent} + ${change} = ${budget}`, 'focus', 21),
  ];
}
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

export const unit56Stories: Record<string, MethodStory> = {
  'u5-place': lesson(
    '8个千万和6个万，为什么写成80060000？',
    [
      frame(
        '先看两种计数单位',
        '8表示8个千万，6表示6个万。数字放在对应数位，才表示这些数量。',
        '8个千万，6个万',
        [
          rect(45, 65, 128, 76, 'known', '8'),
          rect(227, 65, 128, 76, 'focus', '6'),
          text(109, 180, '千万', 'known'),
          text(291, 180, '万', 'focus'),
        ],
      ),
      frame(
        '把数字放进对应位置',
        '8放在千万位，6放在万位。其余位置暂时留空。',
        '8 × 10000000 + 6 × 10000',
        [...rail('80060000', [0, 3], 80, 8, true), text(200, 216, '空位还不能省掉', 'warm', 21)],
      ),
      frame(
        '空位都用0占住',
        '中间和末尾的0都保住数位。6仍表示60000，不能挪到千位。',
        '8006｜0000',
        [
          ...rail('80060000', [3]),
          line(199, 66, 199, 153, 'quiet', true),
          text(200, 214, '6个万 = 60000', 'focus', 22),
        ],
      ),
      frame(
        '把两部分合成同一个数',
        '80000000和60000相加，得到80060000。按数位回读，数量没有改变。',
        '80000000 + 60000 = 80060000',
        [
          ...rail('80060000', [0, 3]),
          line(46, 146, 178, 187, 'known'),
          line(178, 146, 222, 187, 'focus'),
          text(200, 220, '80060000', 'focus', 24),
        ],
      ),
    ],
    check(
      '80060000中的6表示什么？',
      '6个千',
      '6个万',
      '6在万位，表示60000。把它右移一位，就只剩6000。',
      rail('80060000', [3]),
      [
        ...rail('80006000', [4], 80, 8, false, 'error'),
        text(200, 219, '错：把6从万位移到千位', 'error', 20),
      ],
    ),
    check(
      '7个百万和4个千，合成的数是多少？',
      '7040000',
      '7004000',
      '7放百万位，4放千位。7040000中的4在万位，变成了4个万。',
      [...rail('7004000', [0, 3]), text(200, 219, '7000000 + 4000', 'focus', 21)],
      [
        ...rail('7040000', [2], 80, 7, false, 'error'),
        text(200, 219, '错：4挪到了万位', 'error', 21),
      ],
    ),
  ),
  'u5-reading': lesson(
    '“六千零三万零八”，为什么写成60030008？',
    [
      frame(
        '先分清万级和个级',
        '六千零三万是6003个万，八是8个一。先分开两级，再确定每个位置。',
        '万级6003；个级8',
        [
          rect(28, 65, 167, 80, 'known', '6003万'),
          rect(205, 65, 167, 80, 'focus', '8个一'),
          line(200, 45, 200, 183, 'quiet', true),
          text(200, 220, '每一级占四个位置', 'quiet', 21),
        ],
      ),
      frame(
        '把8放到个位',
        '个级的8只能放在最右边。前面三个空位还要占住。',
        '6003｜□□□8',
        levelRail('60030008', false, [7]),
      ),
      frame(
        '把空位补成0',
        '写数时每个空位都要有0。不能按听到几个“零”决定写几个0。',
        '6003｜0008',
        levelRail('60030008', true, [1, 2, 4, 5, 6]),
      ),
      frame(
        '连读零，但不移动数字',
        '万级连续的0合读一个零，个级前面的0再读一个零。0的读法简化，数位不减少。',
        '60030008：六千零三万零八',
        [
          ...levelRail('60030008', true),
          line(70, 143, 156, 143, 'focus'),
          line(202, 143, 328, 143, 'focus'),
          text(200, 230, '读零合并，写数位保留', 'focus', 21),
        ],
      ),
    ],
    check(
      '“六千零三万零八”能写成6003008吗？',
      '能，只要写听到的零',
      '不能，应写60030008',
      '少一个占位0，6就从千万位落到了百万位。数值会缩小，读法也改变。',
      levelRail('60030008', true, [0, 7]),
      [
        ...rail('6003008', [1], 80, 8, false, 'error'),
        text(200, 218, '错：6003万变成600万多', 'error', 20),
      ],
    ),
    check(
      '“五千零二万零六”应写成哪个数？',
      '5002006',
      '50020006',
      '万级是5002，个级是0006，合成50020006。个级必须保留四个位置。',
      levelRail('50020006', true, [7]),
      [...rail('5002006', [1], 80, 8, false, 'error'), text(200, 219, '错：少占一位', 'error', 21)],
    ),
  ),
  'u5-compare': lesson(
    '把0、0、3、5、7、8各用一次，组成最大和最小六位数。',
    [
      frame(
        '最大数先占最大的数位',
        '相同位数先比最高位。把8、7、5、3、0、0依次放入，得到最大数。',
        '最大875300',
        permutation('875300', 6),
      ),
      frame(
        '最小数先选非零首位',
        '六位数的最高位不能是0。先把最小的非零数字3移到十万位。',
        '首位放3',
        permutation('300578', 1),
      ),
      frame(
        '两个0紧跟首位',
        '首位确定后，把两个0放在尽量高的位置。剩余5、7、8仍各用一次。',
        '3、0、0、□、□、□',
        permutation('300578', 3),
      ),
      frame(
        '剩余数字从小到大放',
        '先比较高位，再决定低位。最小六位数是300578。',
        '最小300578',
        permutation('300578', 6),
      ),
    ],
    check(
      '用0、0、3、5、7、8各一次，003578是最小六位数吗？',
      '是，先放0最小',
      '不是，最小六位数是300578',
      '普通整数前面的0不占最高位，003578实际是四位数3578。必须先放最小的非零数字3。',
      permutation('300578', 6),
      permutation('003578', 6, true),
    ),
    check(
      '用0、0、2、4、6、9各一次，最小六位数是哪一个？',
      '002469',
      '200469',
      '先把2放十万位，接着放两个0。前面放0会失去六位数。',
      permutation('200469', 6),
      permutation('002469', 6, true),
    ),
  ),
  'u5-rewrite': lesson(
    '4200000精确改写成以“万”为单位的数，大小怎样保持不变？',
    [
      frame(
        '先看4200000个一',
        '原来的计数单位是个一。末尾四个0，说明它能整分成一万一份。',
        '1万 = 10000个一',
        [
          ...rail('4200000', [3, 4, 5, 6]),
          line(177, 146, 375, 146, 'focus'),
          text(200, 217, '末尾四位可以整打包', 'focus', 20),
        ],
      ),
      frame(
        '把四位一包圈出来',
        '右边四个0组成个级，高位的420表示有420个万。分级线不是删数字，而是换单位。',
        '420｜0000',
        [
          rect(24, 75, 148, 78, 'focus', '420'),
          rect(180, 75, 196, 78, 'known', '0000'),
          text(98, 198, '有420包'),
          text(278, 198, '每包10000'),
        ],
      ),
      frame(
        '把一万当一个新单位',
        '4个100万加2个10万，共420万。每一块仍代表原来同样多的数量。',
        '4200000 ÷ 10000 = 420',
        wanPacks(),
      ),
      frame(
        '合起来并写上万',
        '420个万与4200000个一相等。新数值和新单位必须一起写。',
        '420万 = 4200000',
        wanPacks(true),
      ),
    ],
    check(
      '4200000改写成万，只写420可以吗？',
      '可以，四个0删掉了',
      '不可以，要写420万',
      '420表示420个一，420万表示420个一万。少了单位，数量就变成原来的万分之一。',
      wanPacks(true),
      [
        ...rail('420', [], 80, 7, false, 'error'),
        text(200, 217, '错：剩下的是420个一', 'error', 20),
      ],
    ),
    check(
      '3050000精确改写成万，哪种写法保持大小不变？',
      '305',
      '305万',
      '305个万是305×10000，能还原成3050000。只写305就丢失了计数单位。',
      [
        rect(25, 75, 350, 76, 'focus', '305个万'),
        text(200, 215, '305 × 10000 = 3050000', 'focus', 21),
      ],
      [...rail('305', [], 80, 7, false, 'error'), text(200, 215, '错：只有305个一', 'error', 21)],
    ),
  ),
  'u5-rounding': lesson(
    '7365000四舍五入到万位，怎样看中点和取值边界？',
    [
      frame(
        '找保留位和下一位',
        '保留万位，就检查千位。千位的5表示已经达到两个整万数的中点。',
        '保留万位，检查千位',
        [...rail('7365000', [2, 3]), text(200, 218, '736万与737万之间', 'focus', 21)],
      ),
      frame(
        '把原数放上数轴',
        '7365000正好是7360000与7370000的中点。到中点时，四舍五入规定向上一万。',
        '7360000 + 5000 = 7365000',
        roundLine(7360000, 7365000),
      ),
      frame(
        '到中点就向上取',
        '万位由6进到7，后面四位不再保留。近似数用约等号。',
        '7365000 ≈ 737万',
        roundLine(7360000, 7365000, 'upper'),
      ),
      frame(
        '右边的中点不能再算进来',
        '7365000开始约为737万，到7375000会进成738万。因此最大整数是7374999。',
        '7365000 ≤ 原数 ≤ 7374999',
        roundingRange(),
      ),
    ],
    check(
      '7375000四舍五入到万位，还是737万吗？',
      '是，右端也包含',
      '不是，应约为738万',
      '7375000是737万与738万的中点，应向上进一万。约为737万的范围不包含它。',
      roundLine(7370000, 7375000, 'upper'),
      roundLine(7370000, 7375000, 'lower', true),
    ),
    check(
      '5264999四舍五入到万位，结果是哪一个？',
      '527万',
      '526万',
      '5264999比中点5265000小1，尚未达到进一万的位置。检查千位4，应舍去尾数。',
      roundLine(5260000, 5264999, 'lower'),
      roundLine(5260000, 5264999, 'upper', true),
    ),
  ),
  'u5-codes': lesson(
    '年份4位、书架2位、序号3位：2028年3号架第7本书怎样编码？',
    [
      frame(
        '先分开三种信息',
        '年份、书架和序号各有固定长度。先确定分段，不能直接把数字挤在一起。',
        '4位｜2位｜3位',
        codeStrip('2028', '3', '7', false),
      ),
      frame(
        '把3和7放在各段末尾',
        '3号架写03，第7本写007。前导0占住空位，原来的信息没有变。',
        '2028｜03｜007',
        codeStrip('2028', '3', '7', true),
      ),
      frame(
        '沿固定分界读回信息',
        '从左读4位年份、2位书架、3位序号。保留0，才能把202803007唯一拆回去。',
        '202803007',
        [
          ...codeStrip('2028', '3', '7', true),
          line(24, 172, 178, 172, 'known'),
          line(181, 172, 256, 172, 'warm'),
          line(259, 172, 375, 172, 'focus'),
        ],
      ),
    ],
    check(
      '年份4位、架号2位、序号3位，编号202803007里的补位0能删吗？',
      '可以，普通整数前面的0可省',
      '不可以，编码按固定长度分段',
      '编码的0承担定位作用，不是在比较普通整数大小。删去0，后面的信息会越过分界。',
      codeStrip('2028', '3', '7', true),
      codeStrip('2028', '3', '7', true, true),
    ),
    check(
      '按4位年份、2位架号、3位序号，2030年12号架第4本的编号是？',
      '2030124',
      '203012004',
      '第4本要占三位，写004。2030124只有七位，无法按4、2、3位完整拆分。',
      codeStrip('2030', '12', '4', true),
      codeStrip('2030', '12', '4', true, true),
    ),
  ),
  'u6-written': lesson(
    '213 × 24，第二行为什么要向左对齐一位？',
    [
      frame(
        '同一个213分成20份和4份',
        '24是20加4，两块都以213为一份。分开计算后还要合起来。',
        '213 × 24 = 213 × 20 + 213 × 4',
        areaProduct(213, 2, 4, 0),
      ),
      frame(
        '十位2是20，不是2',
        '个位4份得到852，十位20份得到4260。426个十要占到千位。',
        '213 × 20 = 4260',
        areaProduct(213, 2, 4, 1),
      ),
      frame(
        '把两块部分积拼起来',
        '同一数位对齐，再把两块合起来。4份和20份正好补全24份。',
        '4260 + 852 = 5112',
        areaProduct(213, 2, 4, 2),
      ),
      frame(
        '合并后核对总份数',
        '总份数仍是24，每份仍是213。积5112对应整块，不漏掉十位那一块。',
        '213 × 24 = 5112',
        areaProduct(213, 2, 4, 3),
      ),
      frame(
        '竖式中也要按数位对齐',
        '426表示426个十，所以写成4260，6在十位。与852相加时，个位对个位、十位对十位。',
        '852 + 4260 = 5112',
        writtenProduct(213, 2, 4),
      ),
    ],
    check(
      '213 × 24的十位部分积是多少？',
      '213 × 2 = 426',
      '213 × 20 = 4260',
      '2在十位，表示20份。只乘2会漏掉18份213，所以部分积缩小到十分之一。',
      areaProduct(213, 2, 4, 1),
      areaProduct(213, 2, 4, 1, true),
    ),
    check(
      '312 × 23的十位部分积应是多少？',
      '624',
      '6240',
      '十位的2表示20，312×20=6240。624只算了2份，少了18份。',
      areaProduct(312, 2, 3, 1),
      areaProduct(312, 2, 3, 1, true),
    ),
  ),
  'u6-zero': lesson(
    '204 × 30与320 × 40，哪些0能转成乘10？',
    [
      frame(
        '中间0把2留在百位',
        '204是2个百和4个一。中间没有十，也必须用0占住十位。',
        '204 = 200 + 4',
        [...rail('204', [1]), text(200, 217, '2不能从百位挪到十位', 'focus', 20)],
      ),
      frame('先取3份204', '30是3个十，先算204的3倍。中间的占位0始终保留。', '204 × 3 = 612', [
        text(200, 30, '每格204，先取3份', 'known', 21),
        ...Array.from({ length: 3 }, (_, i) => rect(36 + i * 116, 76, 96, 70, 'known', '204')),
        text(200, 220, '共612，还要乘10', 'focus', 21),
      ]),
      frame(
        '把612整体变成10倍',
        '末尾的0转成乘10，所有数字一起向左移一位。个位空出来补0，得到6120。',
        '204 × 30 = 612 × 10 = 6120',
        shiftTiles('612', 1, true),
      ),
      frame(
        '两个末尾0要合起来数',
        '320是32个十，40是4个十。先算32×4=128，还要乘10×10。',
        '320 × 40 = 128 × 100',
        shiftTiles('128', 2, false),
      ),
      frame(
        '整体向左移两位',
        '128乘100，变成12800。补两个0来自两个乘10，不能拿中间0凑数。',
        '320 × 40 = 12800',
        shiftTiles('128', 2, true),
      ),
    ],
    check(
      '204 × 30能先算24 × 3，再补两个0得到7200吗？',
      '能，两个0最后一起补',
      '不能，正确积是6120',
      '204中间的0是数位占位，去掉它会把2个百变成2个十。只有30的末尾0能转成乘10。',
      shiftTiles('612', 1, true),
      [
        ...rail('24', [3], 49, 4, false, 'error'),
        ...rail('7200', [0, 1], 156, 4, false, 'error'),
        text(200, 244, '错：204先被改成24', 'error', 18),
      ],
    ),
    check(
      '405 × 20的正确积是哪个？',
      '9000',
      '8100',
      '405×2=810，再乘10得8100。删掉405中的0去算45，会改变百位的大小。',
      shiftTiles('810', 1, true),
      [
        ...rail('45', [3], 49, 4, false, 'error'),
        ...rail('9000', [0], 156, 4, false, 'error'),
        text(200, 244, '错：405被改成45', 'error', 18),
      ],
    ),
  ),
  'u6-tools': lesson(
    '计算器显示306 × 24 = 7344，怎样核对才可靠？',
    [
      frame(
        '把306拆成300和6',
        '两块仍然合成306，份数都为24。较小的6不能直接丢掉。',
        '306 = 300 + 6',
        [
          rect(24, 75, (352 * 300) / 306, 90, 'known', '300'),
          rect(24 + (352 * 300) / 306, 75, (352 * 6) / 306, 90, 'focus', '6'),
          text(200, 218, '两块都要取24份', 'known', 21),
        ],
      ),
      frame(
        '先估大小，拦明显错误',
        '只取300的部分得到7200，精确积应稍大。估算看大小，不能证明个位也正确。',
        '300 × 24 = 7200',
        [
          rect(24, 75, (352 * 300) / 306, 90, 'known', '7200'),
          rect(24 + (352 * 300) / 306, 75, (352 * 6) / 306, 90, 'warm', '待补'),
          text(200, 218, '估算漏出的6×24仍要补回', 'warm', 20),
        ],
      ),
      frame(
        '另换20份与4份独立复算',
        '把同一个306分成20份和4份。两块分别算出6120和1224。',
        '306 × 20 = 6120；306 × 4 = 1224',
        areaProduct(306, 2, 4, 1),
      ),
      frame(
        '精确合并，再对照屏幕',
        '6120加1224等于7344，才与计算器逐位一致。接近7200只是第一道检查。',
        '6120 + 1224 = 7344',
        areaProduct(306, 2, 4, 2),
      ),
    ],
    check(
      '计算器显示306 × 24 = 7334，只因接近估算7200，就能认定对吗？',
      '能，估算接近就行',
      '不能，精确积应是7344',
      '300×24是7200，还要补6×24=144，合成7344。7334同样接近，但少了10。',
      areaProduct(306, 2, 4, 2),
      [
        rect(24, 78, (352 * 7200) / 7344, 85, 'known', '7200'),
        rect(24 + (352 * 7200) / 7344, 78, (352 * 134) / 7344, 85, 'error', '误补134'),
        rect(24 + (352 * 7334) / 7344, 78, (352 * 10) / 7344, 85, 'error', '漏10', true),
        text(200, 220, '错：6×24被少算10', 'error', 21),
      ],
    ),
    check(
      '402 × 23，估算约9200；精确核对是哪一个？',
      '9236',
      '9246',
      '402×20=8040，402×3=1206，合成9246。9236也接近估算值，但仍少10。',
      areaProduct(402, 2, 3, 2),
      [
        rect(24, 78, (352 * 8040) / 9246, 85, 'known', '8040'),
        rect(24 + (352 * 8040) / 9246, 78, (352 * 1196) / 9246, 85, 'error', '误算1196'),
        rect(24 + (352 * 9236) / 9246, 78, (352 * 10) / 9246, 85, 'error', '漏10', true),
        text(200, 220, '错：部分积少了10', 'error', 21),
      ],
    ),
  ),
  'u6-patterns': lesson(
    '11 × 11、111 × 111的积先升后降，能一直照抄吗？',
    [
      frame(
        '把同位的1×1合起来',
        '每个点表示一次1×1，最右一列是个位，往左数位依次升高。同列合成1、2、1。',
        '11 × 11 = 121',
        convolution(2),
      ),
      frame(
        '增加一行，也增加一列',
        '3行3列有9个点，同位合成1、2、3、2、1。位值由列决定。',
        '111 × 111 = 12321',
        convolution(3),
      ),
      frame(
        '再增加一行，验证新例子',
        '4行4列有16个点，同位合成1、2、3、4、3、2、1。新例子经过计算才成立。',
        '1111 × 1111 = 1234321',
        convolution(4),
      ),
      frame(
        '当某一列累积到10',
        '两个因数各有10个1时，中间一列会出现10个1×1。一个数位不能直接写10。',
        '同一列合得10，要进位',
        carryColumn(10, 0, false),
      ),
      frame(
        '十进制要重新打包',
        '10个本位单位换成1个高一位单位，本位留下0。因此不能无限照抄升降数字。',
        '10个本位单位 = 1个高位单位',
        carryColumn(10, 0, true),
      ),
    ],
    check(
      '同一数位合得10，能把10直接留在该数位吗？',
      '能，照着升降规律写10',
      '不能，留0并向高一位进1',
      '一个十进制数位只能写0到9。10个本位单位必须换成1个高一位单位。',
      carryColumn(10, 0, true),
      carryColumn(10, 0, false, true),
    ),
    check(
      '本位合得12个一，高一位原有3个十，进位后怎样写？',
      '高位3，本位12',
      '高位4，本位2',
      '12个一换成1个十和2个一，原有3个十变成4个十。总量仍是42。',
      carryColumn(12, 3, true, false, true),
      carryColumn(12, 3, false, true, true),
    ),
  ),
  'u6-error': lesson(
    '204 × 32被错算成204 × 2 + 204 × 3，少算多少？',
    [
      frame(
        '先画完整的32份',
        '正确计算应取30份和2份，每份都是204。整块的积是6528。',
        '204 × 30 + 204 × 2 = 6528',
        areaProduct(204, 3, 2, 0),
      ),
      frame(
        '叠上错法，找出缺口',
        '错法只取3份和2份，共5份。32份与5份之间缺了27份。',
        '30 − 3 = 27份',
        missingShares(204, 32, 5, 0),
      ),
      frame(
        '只补回缺失的27份',
        '每份204，少算的是27个204，不是27个一。把缺口单独乘出来。',
        '204 × 27 = 5508',
        missingShares(204, 32, 5, 27),
      ),
      frame(
        '补回后，再合成整块',
        '错积1020加上漏掉的5508，恢复成6528。5份与27份合成原来的32份。',
        '1020 + 5508 = 6528',
        missingShares(204, 32, 5, 27, true),
      ),
    ],
    check(
      '204 × 32错算成204 × 2 + 204 × 3，应补回哪部分？',
      '204 × (3 − 2)',
      '204 × (30 − 3)',
      '十位本应乘30，却只乘3，少了27份。补1份仍然缺26份，与个位的2没有这种差值关系。',
      missingShares(204, 32, 5, 27),
      missingShares(204, 32, 5, 1),
    ),
    check(
      '306 × 42被错算成306 × 4 + 306 × 2，少算多少？',
      '612',
      '11016',
      '正确取42份，错法只取6份，少36份。306×36=11016，不能只算4与2相差的2份。',
      missingShares(306, 42, 6, 36),
      missingShares(306, 42, 6, 2),
    ),
  ),
  'u6-application': lesson(
    '每件198元，买35件，带7000元还剩多少？',
    [
      frame(
        '先把35件一一对应起来',
        '每一格代表1件，每件都是198元。要求剩余，先求35件的实际总价。',
        '198 × 35',
        itemRefunds(35, 2, 0),
      ),
      frame(
        '每件先按200元算',
        '35件都多算2元，不是整笔钱只多2元。图中每件都对应两个多算的1元。',
        '200 × 35 = 7000',
        itemRefunds(35, 2, 1),
      ),
      frame(
        '把每件多算的都退回',
        '35份2元一共70元，必须从假设总价里全部减去。剩下实际花费6930元。',
        '200 × 35 − 2 × 35 = 6930元',
        itemRefunds(35, 2, 2),
      ),
      frame(
        '预算分成已花和剩余',
        '7000元分成实际花费6930元与剩余70元。两部分加回去仍是原预算。',
        '7000 − 6930 = 70元',
        budgetBar(7000, 6930),
      ),
    ],
    check(
      '每件198元买35件，先按每件200元算完，应该怎样修正？',
      '只减去2元',
      '减去35个2元，共70元',
      '每件都多算2元，35件就有35份多算的钱。只退一件的2元，还剩34件的多算部分。',
      itemRefunds(35, 2, 2),
      itemRefunds(35, 2, 2, true),
    ),
    check(
      '每件199元买24件，带5000元，实际还剩多少？',
      '201元',
      '224元',
      '先算200×24=4800，再减24件各多算的1元，实际花4776元。5000−4776=224元。',
      budgetBar(5000, 4776),
      [
        ...itemRefunds(24, 1, 2, true),
        text(261, 72, '错付4799元', 'error', 20),
        text(261, 101, '只剩201元', 'error', 20),
      ],
    ),
  ),
};
