import {
  frame,
  line,
  rect,
  text,
  type MethodCheck,
  type MethodNode,
  type MethodStory,
  type MethodTone,
} from './method-primitives';

const check = (
  question: string,
  wrong: string,
  right: string,
  why: string,
  nodes: MethodNode[],
  wrongNodes: MethodNode[],
): MethodCheck => ({ question, wrong, right, why, nodes, wrongNodes });

const places = ['个', '十', '百', '千', '万', '十万', '百万', '千万', '亿'];
function digits(value: string, active: number[] = [], y = 90, tone: MethodTone = 'known') {
  const width = 350 / value.length;
  return [...value].flatMap((digit, i) => [
    text(25 + width * (i + 0.5), y - 16, places[value.length - i - 1], 'quiet', 18),
    rect(25 + width * i, y, width - 2, 52, active.includes(i) ? 'focus' : tone, digit),
  ]);
}

function packs(count: number, caption: string, tone: MethodTone = 'known'): MethodNode[] {
  return [
    text(200, 30, caption, tone, 21),
    ...Array.from({ length: count }, (_, i) =>
      rect(42 + (i % 12) * 26, 68 + Math.floor(i / 12) * 40, 22, 32, tone),
    ),
  ];
}

function conversion(tenThousands: number, reveal: boolean): MethodNode[] {
  return [
    ...packs(tenThousands, `${tenThousands}块，每块1万`),
    rect(52, 156, 296, 38, 'focus'),
    ...Array.from({ length: 9 }, (_, i) =>
      line(52 + (i + 1) * 29.6, 156, 52 + (i + 1) * 29.6, 194, 'known'),
    ),
    line(65, 102, 52, 153, 'quiet', true),
    text(
      200,
      230,
      reveal ? `${tenThousands}万 = ${tenThousands * 10}个千` : '放大1块：1万里有10个千',
      'focus',
      21,
    ),
  ];
}

function cardColumns(values: string[], units: string[], active: number): MethodNode[] {
  return values.flatMap((value, i) => [
    text(80 + i * 120, 58, units[i], i === active ? 'focus' : 'known', 20),
    rect(28 + i * 120, 82, 104, 74, i === active ? 'focus' : 'known', value),
  ]);
}

function placeValues(left: number, right: number, wrong = false): MethodNode[] {
  return [
    text(103, 37, '百万位的5', 'known', 21),
    text(297, 37, '百位的5', 'focus', 21),
    rect(39, 61, 128, 45, 'known', '5'),
    rect(233, 61, 128, 45, 'focus', '5'),
    line(103, 108, 103, 137, 'known'),
    line(297, 108, 297, 137, 'focus'),
    rect(20, 140, 166, 49, wrong ? 'error' : 'known', String(left)),
    rect(214, 140, 166, 49, wrong ? 'error' : 'focus', String(right)),
    text(
      200,
      232,
      wrong ? '错：5−5=0，丢了数位' : `相差 ${left - right}`,
      wrong ? 'error' : 'focus',
      21,
    ),
  ];
}

function swap(stage: number, original = 7, exchanged = 3, wrong = false): MethodNode[] {
  const delta = original - exchanged;
  if (stage < 2)
    return [
      text(109, 36, '万位', 'known'),
      text(291, 36, '千位', 'focus'),
      rect(45, 57, 128, 48, 'known', String(original)),
      rect(227, 57, 128, 48, 'focus', stage ? String(exchanged) : '□'),
      line(109, 108, 291, 151, 'known'),
      line(291, 108, 109, 151, 'focus'),
      rect(45, 155, 128, 48, 'focus', stage ? String(exchanged) : '□'),
      rect(227, 155, 128, 48, 'known', String(original)),
      text(
        200,
        238,
        stage ? `万位少${delta}，千位多${delta}` : '只交换这两位，其余位置不动',
        'focus',
        20,
      ),
    ];
  return [
    text(200, 33, `交换后少了${delta}个万`, 'known', 21),
    rect(40, 65, 320, 55, 'known', String(delta * 10000)),
    rect(40, 140, wrong ? 320 : 32, 40, wrong ? 'error' : 'warm'),
    text(218, 168, `又多回${delta}个千`, wrong ? 'error' : 'warm', 20),
    text(
      200,
      227,
      wrong
        ? `${delta} × 10000（漏减千位补回）`
        : `${delta * 10000} − ${delta * 1000} = ${delta * 9000}`,
      wrong ? 'error' : 'focus',
      21,
    ),
  ];
}

function compareRail(a: string, b: string, until: number, wrong = false): MethodNode[] {
  const width = 350 / a.length;
  return [
    text(
      200,
      30,
      wrong ? '错：先看末尾，不看高位' : '同位数，从左向右比',
      wrong ? 'error' : 'known',
      21,
    ),
    ...[a, b].flatMap((value, row) =>
      [...value].map((digit, i) =>
        rect(
          25 + width * i,
          54 + row * 77,
          width - 2,
          48,
          i === until ? (wrong ? 'error' : 'focus') : i < until ? 'known' : 'quiet',
          digit,
        ),
      ),
    ),
    ...Array.from({ length: until }, (_, i) => text(25 + width * (i + 0.5), 120, '=', 'known', 20)),
    text(
      200,
      230,
      until < 2 ? '高位相同，就继续向右比' : `${a} ${wrong ? '<' : '>'} ${b}`,
      wrong ? 'error' : 'focus',
      22,
    ),
  ];
}

function inequality(stage: number, candidate = 4, wrong = false): MethodNode[] {
  const top = `5${stage === 0 ? '□' : candidate}82000`;
  return [...compareRail(top, '5470000', stage === 0 ? 0 : candidate === 4 ? 2 : 1, wrong)];
}

function hundredEnd(stage: number, targetWan = 54, wrong = false): MethodNode[] {
  const upper = targetWan * 10000 + 5000;
  if (stage === 0)
    return [
      text(200, 35, `约${targetWan}万的整数范围`, 'known', 21),
      line(45, 107, 355, 107, 'known'),
      { kind: 'dot', x: 45, y: 107, tone: 'focus' },
      rect(349, 101, 12, 12, 'quiet', undefined, true),
      text(66, 75, String(upper - 10000), 'known', 20),
      text(334, 75, String(upper), 'known', 20),
      text(200, 176, '左端包含，右端不包含', 'focus', 21),
      text(200, 224, `最大整数 ${upper - 1}`, 'quiet', 21),
    ];
  return [
    text(200, 35, '放大右端：每格100', 'known', 21),
    ...(stage === 2
      ? [rect(wrong ? 337 : 182, 88, 36, 43, wrong ? 'error' : 'focus', undefined, true)]
      : []),
    line(45, 110, 355, 110, 'known'),
    ...[0, 1, 2].flatMap((i) => [
      line(45 + i * 155, 102, 45 + i * 155, 118, 'known'),
      text(
        45 + i * 155,
        158,
        String(upper - 200 + i * 100),
        i === (wrong ? 2 : 1) ? (wrong ? 'error' : 'focus') : 'known',
        19,
      ),
    ]),
    { kind: 'dot', x: wrong ? 355 : 200, y: 110, tone: wrong ? 'error' : 'focus' },
    text(
      200,
      224,
      wrong ? `${upper}会进成${targetWan + 1}万` : `最大整百数 ${upper - 100}`,
      wrong ? 'error' : 'focus',
      21,
    ),
  ];
}

function intersection(stage: number, targetWan = 145, wrong = false): MethodNode[] {
  const middle = targetWan * 10000;
  return [
    ...(stage === 2
      ? [
          rect(
            wrong ? 40 : 200,
            90,
            wrong ? 320 : 160,
            101,
            wrong ? 'error' : 'focus',
            undefined,
            true,
          ),
        ]
      : []),
    text(200, 25, '同一原数，同时满足两条范围', 'known', 20),
    text(62, 63, String(middle - 5000), 'known', 18),
    text(200, 63, String(middle), 'focus', 18),
    text(338, 63, String(middle + 5000), 'known', 18),
    line(40, 73, 360, 73, 'quiet'),
    rect(40, 90, 320, 32, 'known'),
    text(200, 146, `到万位约${targetWan}万`, 'known', 20),
    ...(stage > 0
      ? [
          rect(200, 161, 160, 30, wrong ? 'error' : 'warm'),
          line(360, 176, 382, 176, 'warm'),
          line(382, 176, 374, 170, 'warm'),
          text(
            200,
            220,
            stage === 2
              ? wrong
                ? `${middle - 5000}至${middle + 4999}（漏查第二条）`
                : `${middle} 至 ${middle + 4999}`
              : '十万位进位范围，从中点开始',
            stage === 2 ? 'focus' : 'warm',
            20,
          ),
        ]
      : [text(200, 220, '先找第一条允许的区间', 'known', 20)]),
  ];
}

function carryInverse(stage: number, resultWan = 610, wrong = false): MethodNode[] {
  const beforeWan = resultWan - 1;
  const value = `${wrong ? resultWan : beforeWan}5000`;
  return [
    text(
      200,
      31,
      stage === 0 ? `近似数${resultWan}万，千位原来是5` : '千位5，保留部分已经加过1',
      'known',
      21,
    ),
    ...digits(stage === 0 ? '□□□5□□□' : stage === 1 ? `${beforeWan}5□□□` : value, [2, 3]),
    ...(stage > 0 ? [line(200, 148, 200, 177, wrong ? 'error' : 'focus')] : []),
    text(
      200,
      220,
      stage === 0
        ? '原来万位还不知道'
        : wrong
          ? `错：${resultWan}5000约为${resultWan + 1}万`
          : `${resultWan} − 1 = ${beforeWan}（万）`,
      wrong ? 'error' : 'focus',
      21,
    ),
  ];
}

function shares(count: number, each: number | undefined, tone: MethodTone = 'known'): MethodNode[] {
  return [
    text(200, 30, `${count}份，每份${each ?? '?'}`, tone, 21),
    ...Array.from({ length: count }, (_, i) =>
      rect(45 + (i % 8) * 39, 57 + Math.floor(i / 8) * 23, 32, 17, tone),
    ),
    text(
      200,
      233,
      each === undefined ? '一小格代表1份' : `${count} × ${each} = ${count * each}`,
      tone,
      22,
    ),
  ];
}

function wrongFactor(stage: number): MethodNode[] {
  return stage === 0
    ? [
        text(200, 27, '错把40份，算成46份', 'known', 21),
        ...Array.from({ length: 46 }, (_, i) =>
          rect(45 + (i % 8) * 39, 54 + Math.floor(i / 8) * 23, 32, 17, i < 40 ? 'known' : 'error'),
        ),
        text(200, 231, '多出的6份，共810', 'error', 22),
      ]
    : stage === 1
      ? shares(6, 135, 'focus')
      : shares(40, 135, 'focus');
}

function distanceUnits(stage: number, wrong = false, stepCm = 80, steps = 125): MethodNode[] {
  const centimeters = stepCm * steps;
  return stage === 0
    ? [
        text(200, 30, `每步${stepCm}厘米，走${steps}步`, 'known', 21),
        ...Array.from({ length: 5 }, (_, i) =>
          rect(30 + i * 69, 93, 64, 48, 'known', String(stepCm)),
        ),
        text(200, 182, `这里只展开5步，共有${steps}步`, 'quiet', 20),
      ]
    : stage === 1
      ? [
          text(200, 31, `${steps}份${stepCm}厘米`, 'known', 21),
          rect(28, 83, 344, 78, 'focus', String(centimeters)),
          text(
            200,
            217,
            wrong ? '错：刚相乘就写成米' : '此时的单位还是厘米',
            wrong ? 'error' : 'focus',
            21,
          ),
        ]
      : [
          text(200, 28, '100厘米打包成1米', 'known', 21),
          rect(28, 68, 344, 48, 'known', `${centimeters}厘米`),
          line(200, 118, 200, 151, 'focus'),
          rect(
            28,
            157,
            344,
            48,
            wrong ? 'error' : 'focus',
            `${wrong ? centimeters : centimeters / 100}米`,
          ),
          text(
            200,
            239,
            wrong ? '错：没有按100厘米一包换单位' : `${centimeters} ÷ 100 = ${centimeters / 100}`,
            wrong ? 'error' : 'focus',
            20,
          ),
        ];
}

function setPrice(
  stage: number,
  desk = 145,
  chair = 55,
  count = 24,
  budget = 5000,
  wrong = false,
): MethodNode[] {
  const each = desk + chair,
    spent = each * count;
  return stage === 0
    ? [
        text(200, 28, '每套都包含两件', 'known', 21),
        rect(28, 46, 344, 128, 'focus', undefined, true),
        rect(45, 61, 128, 60, 'known', String(desk)),
        rect(227, 61, 128, 60, 'warm', String(chair)),
        text(109, 150, '一张桌子', 'known', 20),
        text(291, 150, '一把椅子', 'warm', 20),
        text(200, 222, `一套${each}元`, 'focus', 22),
      ]
    : stage === 1
      ? [...shares(count, wrong ? desk : each, wrong ? 'error' : 'focus')]
      : [
          text(200, 28, `带来${budget}元`, 'known', 21),
          rect(28, 73, 344, 72, 'quiet'),
          rect(
            28,
            73,
            (344 * (wrong ? desk * count : spent)) / budget,
            72,
            wrong ? 'error' : 'known',
          ),
          text(
            200,
            184,
            `花${wrong ? desk * count : spent}，剩${budget - (wrong ? desk * count : spent)}`,
            wrong ? 'error' : 'focus',
            22,
          ),
          text(
            200,
            234,
            wrong ? '错：每套只算桌子，漏了椅子' : '总钱数 = 已花 + 剩余',
            wrong ? 'error' : 'focus',
            20,
          ),
        ];
}

export const round2U56QuestionSubskills: Record<string, Record<string, string>> = {
  'u5-place': {
    'bank-u5-place-01': 'u56-unit-count',
    'u5-02': 'u56-unit-count',
    'u5-10': 'u56-unit-count',
    'u5-11': 'u56-unit-count',
    'bank-u5-place-02': 'u56-place-card-sum',
    'bank-u5-place-03': 'u56-place-value-gap',
    'bank-u5-place-04': 'u56-digit-swap',
  },
  'u5-compare': {
    'bank-u5-compare-01': 'u56-number-compare',
    'u5-04': 'u56-number-compare',
    'bank-u5-compare-03': 'u56-number-compare',
    'bank-u5-compare-02': 'u56-compare-digit',
  },
  'u5-rounding': {
    'bank-u5-rounding-03': 'u56-hundred-range',
    'u5-21': 'u56-hundred-range',
    'bank-u5-rounding-04': 'u56-rounding-intersection',
    'bank-u5-rounding-02': 'u56-rounding-carry',
    'u5-19': 'u56-rounding-carry',
  },
  'u6-error': { 'u6-10': 'u56-factor-misread' },
  'u6-application': { 'u6-06': 'u56-distance-unit', 'u6-08': 'u56-set-price' },
};

export const round2U56SubskillStories: Record<string, MethodStory> = {
  'u56-unit-count': {
    prompt: '24万里面有多少个千？怎样反过来把240个千合成万？',
    frames: [
      frame(
        '先确定每块代表什么',
        '一块是一万，共24块。块的个数和每块的计数单位要一起看。',
        '24块，每块1万',
        packs(24, '24块，每块1万'),
      ),
      frame(
        '把一万拆成十个千',
        '一万等于十个千。放大一块，分成10份，每份是1千。',
        '1万 = 10个千',
        conversion(24, false),
      ),
      frame(
        '每一块都要拆',
        '24块每块都有10个千，共24份10。不能只把一块换单位。',
        '24 × 10 = 240（个千）',
        conversion(24, true),
      ),
      frame(
        '反过来每十个千打一包',
        '从千换成万，用十个千合成一万，所以包数要除以10。跨两级时要再合一轮，进率相乘。',
        '240 ÷ 10 = 24（万）',
        [
          text(200, 30, '小单位合包，大单位拆包', 'known', 21),
          rect(30, 70, 144, 69, 'known', '24万'),
          rect(226, 70, 144, 69, 'focus', '240千'),
          line(176, 91, 224, 91, 'focus'),
          line(224, 124, 176, 124, 'known'),
          text(200, 190, '向右×10；向左÷10', 'focus', 21),
          text(200, 233, '万→千→百：10×10', 'known', 20),
        ],
      ),
    ],
    mistake: check(
      '24万里有24个千，对吗？',
      '对，数字24没有变',
      '不对，有240个千',
      '1万里就有10个千。单位变小，同样数量要用更多个新单位表示。',
      conversion(24, true),
      [
        rect(30, 70, 144, 69, 'error', '24万'),
        rect(226, 70, 144, 69, 'error', '24千'),
        line(176, 105, 224, 105, 'error'),
        text(200, 217, '错：换单位却没改变份数', 'error', 21),
      ],
    ),
    transfer: check(
      '3个亿里面有多少个万？',
      '300个万',
      '30000个万',
      '亿到万隔四级：10×10×10×10=10000。每亿有10000个万，3亿有30000个万。',
      [
        text(200, 30, '亿 → 千万 → 百万 → 十万 → 万', 'known', 19),
        rect(30, 80, 144, 72, 'known', '3亿'),
        rect(226, 80, 144, 72, 'focus', '30000万'),
        line(176, 116, 224, 116, 'focus'),
        text(200, 219, '3 × 10000 = 30000', 'focus', 22),
      ],
      [
        text(200, 30, '错：只乘了100', 'error', 21),
        rect(30, 80, 144, 72, 'known', '3亿'),
        rect(226, 80, 144, 72, 'error', '300万'),
        text(200, 219, '漏掉了两次×10', 'error', 22),
      ],
    ),
  },
  'u56-place-card-sum': {
    prompt: '14张“十万”、12张“万”和6张“千”，合起来表示多少个千？',
    frames: [
      frame(
        '张数相同，单位未必相同',
        '三列卡片表示的单位不同，不能直接把14、12和6相加。',
        '先把单位统一成千',
        cardColumns(['14', '12', '6'], ['十万卡', '万卡', '千卡'], 2),
      ),
      frame(
        '先换每一张的单位',
        '1张十万卡等于100个千，1张万卡等于10个千，1张千卡就是1个千。',
        '十万=100千；万=10千',
        cardColumns(['100', '10', '1'], ['每张含千', '每张含千', '每张含千'], 0),
      ),
      frame(
        '再算每列共有几个千',
        '张数乘每张包含的千，得到三列分别有1400、120和6个千。',
        '14×100；12×10；6×1',
        [
          ...cardColumns(['1400', '120', '6'], ['14张合计', '12张合计', '6张合计'], 1),
          text(200, 221, '现在每一列的单位都是千', 'focus', 21),
        ],
      ),
      frame(
        '同单位才合起来',
        '三部分都变成了千，可以直接相加，原来的总量没有改变。',
        '1400 + 120 + 6 = 1526（个千）',
        [
          rect(26, 57, 348, 59, 'known', '1400 + 120 + 6'),
          line(200, 118, 200, 151, 'focus'),
          rect(26, 157, 348, 59, 'focus', '1526个千'),
        ],
      ),
    ],
    mistake: check(
      '14张十万卡、12张万卡、6张千卡，能直接算14+12+6吗？',
      '能，共32个千',
      '不能，要先统一计数单位',
      '32是卡片张数，不是千的个数。十万卡每张含100个千，不能只算1个。',
      cardColumns(['1400', '120', '6'], ['个千', '个千', '个千'], 0),
      [
        rect(28, 71, 344, 75, 'error', '14 + 12 + 6 = 32'),
        text(200, 218, '错：把不同单位当成同一种', 'error', 21),
      ],
    ),
    transfer: check(
      '2张“十万”、3张“万”、4张“千”，合起来有多少个千？',
      '9个千',
      '234个千',
      '分别换成200、30、4个千，再相加。9只是总张数。',
      [
        ...cardColumns(['200', '30', '4'], ['个千', '个千', '个千'], 2),
        text(200, 224, '200 + 30 + 4 = 234', 'focus', 21),
      ],
      [
        rect(28, 71, 344, 75, 'error', '2 + 3 + 4 = 9'),
        text(200, 218, '错：忽略每张卡的单位', 'error', 21),
      ],
    ),
  },
  'u56-place-value-gap': {
    prompt: '5000500里的两个5，表示的数值相差多少？',
    frames: [
      frame(
        '先找两个5所在的位置',
        '左边的5在百万位，右边的5在百位。数字相同，计数单位不同。',
        '5个百万；5个百',
        [...digits('5000500', [0, 4]), text(200, 222, '比较的是数值，不是数字形状', 'focus', 21)],
      ),
      frame(
        '把各自的数值展开',
        '百万位的5表示5000000，百位的5表示500。先带着单位读，再写成数。',
        '5×1000000；5×100',
        placeValues(5000000, 500),
      ),
      frame(
        '大数值减小数值',
        '求相差多少，用5000000减500。不能因为都是5，就说相差0。',
        '5000000 − 500 = 4999500',
        [
          ...placeValues(5000000, 500).slice(0, -1),
          text(200, 232, '5000000 − 500 = 4999500', 'focus', 21),
        ],
      ),
    ],
    mistake: check(
      '5000500里的两个5相差0，对吗？',
      '对，都是数字5',
      '不对，数值相差4999500',
      '百万位与百位的计数单位不同，要先求出每个5表示的数值。',
      placeValues(5000000, 500),
      placeValues(5, 5, true),
    ),
    transfer: check(
      '4000400中的两个4，表示的数值相差多少？',
      '0',
      '3999600',
      '百万位的4是4000000，百位的4是400，相减得3999600。',
      [...digits('4000400', [0, 4]), text(200, 224, '4000000 − 400 = 3999600', 'focus', 20)],
      [
        rect(48, 81, 304, 65, 'error', '4 − 4 = 0'),
        text(200, 217, '错：丢掉了数位单位', 'error', 21),
      ],
    ),
  },
  'u56-digit-swap': {
    prompt: '六位数57□042，把万位与千位交换后小36000。□填几？',
    frames: [
      frame(
        '只追踪交换的两个位置',
        '原来万位是7、千位是□。交换后万位是□、千位是7，其余数字不变。',
        '万位7 ↔ 千位□',
        swap(0),
      ),
      frame(
        '每差1，整数就差9000',
        '万位少1会少10000，千位同时多1会补回1000，净少9000。',
        '10000 − 1000 = 9000',
        swap(2, 7, 6),
      ),
      frame(
        '用总差求数字差',
        '36000里有4个9000，说明7与□相差4。□比7小，所以填3。',
        '36000 ÷ 9000 = 4；7−4=3',
        swap(1),
      ),
      frame(
        '放回原数核对',
        '573042与537042只交换万位、千位，差正好是36000。',
        '573042 − 537042 = 36000',
        swap(2),
      ),
    ],
    mistake: check(
      '万位7和千位3交换后，只少40000吗？',
      '是，只看万位少了4',
      '不是，净少36000',
      '万位少40000，千位又多4000。两处一起变，不能只看减少的一处。',
      swap(2),
      swap(2, 7, 3, true),
    ),
    transfer: check(
      '六位数68□015，交换万位与千位后小45000，□填几？',
      '5',
      '3',
      '每差1净少9000；45000÷9000=5，8−5=3。不是直接把数字差5填进空格。',
      [...swap(1, 8, 3), text(200, 238, '45000÷9000=5，8−5=3', 'focus', 20)].filter(
        (n, i, a) => n.kind !== 'text' || n.y !== 238 || i === a.length - 1,
      ),
      [
        rect(46, 81, 308, 68, 'error', '45000÷9000=5'),
        text(200, 218, '错：把相差5当成□的值', 'error', 21),
      ],
    ),
  },
  'u56-number-compare': {
    prompt: '2083000和2038000，哪个数大？怎样从左向右找到决定大小的一位？',
    frames: [
      frame(
        '先看位数是否相同',
        '两个数都是七位数，不能用位数分出大小，再从最高位逐位比较。',
        '同为七位数',
        compareRail('2083000', '2038000', 0),
      ),
      frame(
        '相同高位先对齐',
        '百万位都是2，十万位都是0。这些相同的位置还不能决定大小。',
        '2=2，0=0',
        compareRail('2083000', '2038000', 1),
      ),
      frame(
        '第一处不同就能决定',
        '万位8大于3。即使后面的千位3小于8，也不能推翻高位已经决定的大小。',
        '2083000 > 2038000',
        compareRail('2083000', '2038000', 2),
      ),
    ],
    mistake: check(
      '2083000的千位3小于2038000的千位8，所以前者更小吗？',
      '是，3比8小',
      '不是，先比不同的万位',
      '第一处不同在万位：8万比3万多5万。后面的位合起来最多差9999，补不回5万。',
      compareRail('2083000', '2038000', 2),
      compareRail('2083000', '2038000', 3, true),
    ),
    transfer: check(
      '5062000和5026000，哪个数更大？',
      '5026000',
      '5062000',
      '百万位、十万位相同，接着万位6大于2。不能先看千位。',
      compareRail('5062000', '5026000', 2),
      compareRail('5062000', '5026000', 3, true),
    ),
  },
  'u56-compare-digit': {
    prompt: '5□82000大于5470000，□最小能填几？',
    frames: [
      frame(
        '先比相同的最高位',
        '百万位都是5，继续比十万位。不能从末尾的0开始判断。',
        '百万位相同',
        inequality(0),
      ),
      frame(
        '先试与对方相等的4',
        '十万位都填4时，还没有分出大小；接着比较万位8与7。',
        '5482000 > 5470000',
        inequality(1),
      ),
      frame(
        '再检查4是否已经最小',
        '填3或更小，十万位先变小，后面的8补不回来。填4已经成立，最小就是4。',
        '□最小填4',
        [
          text(200, 31, '候选十万位', 'known', 21),
          ...[3, 4, 5, 6].flatMap((n, i) => [
            rect(26 + i * 90, 80, 78, 58, n === 4 ? 'focus' : n < 4 ? 'error' : 'known', String(n)),
            text(
              65 + i * 90,
              184,
              n < 4 ? '太小' : n === 4 ? '最小可填' : '也可以',
              n === 4 ? 'focus' : 'quiet',
              18,
            ),
          ]),
        ],
      ),
    ],
    mistake: check(
      '5□82000＞5470000，□一定要大于4吗？',
      '是，最小填5',
      '不是，填4时继续比万位',
      '十万位相等，还要看下一位。5482000的万位8大于7，所以4也成立。',
      inequality(1),
      [
        text(200, 31, '错：相同一位后就停止比较', 'error', 21),
        rect(46, 84, 308, 68, 'error', '□只能填5～9'),
        text(200, 220, '漏掉了填4的有效情况', 'error', 21),
      ],
    ),
    transfer: check(
      '7□63000＞7250000，□最小填几？',
      '3',
      '2',
      '填2后十万位相等，再比万位6与5，仍然大于。填1时十万位已经更小。',
      compareRail('7263000', '7250000', 2),
      [
        rect(46, 84, 308, 68, 'error', '□最小填3'),
        text(200, 220, '错：漏掉同位相等后继续比', 'error', 21),
      ],
    ),
  },
  'u56-hundred-range': {
    prompt: '一个整数四舍五入到万位约是54万，而且是整百数，最小和最大是多少？',
    frames: [
      frame(
        '先找到近似数的整数范围',
        '535000从中点进成54万；545000会进成55万，所以右端不能包含。',
        '535000 ≤ 原数 < 545000',
        hundredEnd(0),
      ),
      frame(
        '整百数只能落在百的刻度上',
        '虽然544999仍约为54万，但它不是整百数。向左找最近的整百刻度。',
        '末两位必须是00',
        hundredEnd(1),
      ),
      frame(
        '同时满足两个条件',
        '535000本身是整百数；右端之前最后一个整百数是544900。',
        '最小535000，最大544900',
        hundredEnd(2),
      ),
    ],
    mistake: check(
      '约54万的整百数，最大可以是545000吗？',
      '可以，它也是整百数',
      '不可以，应是544900',
      '545000虽然整百，却达到下一段的中点，会约为55万。必须同时满足两个条件。',
      hundredEnd(2),
      hundredEnd(2, 54, true),
    ),
    transfer: check(
      '一个整百数四舍五入到万位约是68万，最大是多少？',
      '684999',
      '684900',
      '允许的整数最大684999，但整百数末尾必须是00，因此最后一个是684900。',
      hundredEnd(2, 68),
      [
        text(200, 35, '错：只满足近似数条件', 'error', 21),
        rect(44, 90, 312, 62, 'error', '684999'),
        text(200, 218, '末两位99，不是整百数', 'error', 21),
      ],
    ),
  },
  'u56-rounding-intersection': {
    prompt:
      '同一个整数，到万位约145万，到十万位约150万。原数最小和最大是多少？两次都直接舍入原数。',
    frames: [
      frame(
        '先用万位条件圈一段',
        '到万位约145万，原数从1445000开始，到1455000之前。',
        '1445000 ≤ 原数 ≤ 1454999',
        intersection(0),
      ),
      frame(
        '把十万位条件叠上来',
        '到十万位约150万，原数从1450000开始，到1550000之前。图中右方范围还会继续延伸。',
        '1450000 ≤ 原数 ≤ 1549999',
        intersection(1),
      ),
      frame(
        '只保留两段共同覆盖的部分',
        '左边1445000到1449999不满足第二条；1455000起不满足第一条。共同部分才是答案。',
        '1450000 ≤ 原数 ≤ 1454999',
        intersection(2),
      ),
    ],
    mistake: check(
      '到万位约145万、到十万位约150万，最小能填1445000吗？',
      '能，它约为145万',
      '不能，最小1450000',
      '1445000到十万位约140万，不满足第二条。不能只检查一条近似数条件。',
      intersection(2),
      intersection(2, 145, true),
    ),
    transfer: check(
      '同一个整数，到万位约235万、到十万位约240万，最小是多少？两次直接看原数。',
      '2345000',
      '2350000',
      '第一条允许2345000起，第二条要求2350000起。两段共同的起点是2350000。',
      intersection(2, 235),
      intersection(2, 235, true),
    ),
  },
  'u56-rounding-carry': {
    prompt: '一个七位数四舍五入到万位是610万，原来的千位是5。原数万位是几？',
    frames: [
      frame(
        '先分清原数与近似数',
        '610万是进位后的结果。原来的千位5还在被舍去的部分，不能把结果的万位直接抄回去。',
        '原数的千位是5',
        carryInverse(0),
      ),
      frame(
        '千位5说明已经进过1万',
        '从进位后的610万退回1万，原来保留的部分就是609万。',
        '610 − 1 = 609（万）',
        carryInverse(1),
      ),
      frame(
        '跨过整十万，也要还原进位',
        '609万的万位是9。举例6095000到万位确实约为610万，条件一致。',
        '6095000 ≈ 610万；万位9',
        [...carryInverse(2).slice(0, -1), text(200, 220, '6095000约为610万', 'focus', 22)],
      ),
    ],
    mistake: check(
      '原数千位5，四舍五入后610万，原数万位也是0吗？',
      '是，照近似数抄0',
      '不是，原数万位是9',
      '千位5使原来的609万进成610万。若原数是6105000，会约为611万。',
      carryInverse(2),
      carryInverse(2, 610, true),
    ),
    transfer: check(
      '原数千位8，四舍五入到万位是407万，原数万位是几？',
      '7',
      '6',
      '千位8会进1万，原来保留的部分是406万，因此万位6。',
      [...digits('4068000', [2, 3]), text(200, 223, '4068000约为407万', 'focus', 22)],
      [
        ...digits('4078000', [2, 3], 90, 'error'),
        text(200, 223, '错：4078000约为408万', 'error', 22),
      ],
    ),
  },
  'u56-factor-misread': {
    prompt: '一个数乘40，错看成乘46，积多了810。正确的积是多少？',
    frames: [
      frame(
        '多出的积来自多算的份数',
        '原来40份，错算46份，多出6份。同一个数是每份的量。',
        '46 − 40 = 6（份）',
        wrongFactor(0),
      ),
      frame(
        '先用6份求出每份',
        '多出的810正好对应6份，每份是810除以6，得到原来的那个数135。',
        '810 ÷ 6 = 135',
        wrongFactor(1),
      ),
      frame(
        '再回到原来的40份',
        '正确积要算40份135，不能直接把差810当成原数或正确积。',
        '135 × 40 = 5400',
        wrongFactor(2),
      ),
    ],
    mistake: check(
      '一个数乘40看成乘46，多810，正确积就是810吗？',
      '是，多出的数就是原来的积',
      '不是，正确积是5400',
      '810只对应多出的6份。先求每份135，再求40份5400。',
      wrongFactor(2),
      shares(6, 135, 'error'),
    ),
    transfer: check(
      '一个数乘30看成乘35，积多620，正确的积是多少？',
      '18600',
      '3720',
      '先用620÷5求出每份124，再算124×30。620是5份，不能直接当成每份。',
      shares(30, 124, 'focus'),
      shares(30, 620, 'error'),
    ),
  },
  'u56-distance-unit': {
    prompt: '每步80厘米，走125步，一共走了多少米？',
    frames: [
      frame(
        '先看每步用什么单位',
        '每一步都是80厘米，125步就是125份80厘米。',
        '每步80厘米，共125步',
        distanceUnits(0),
      ),
      frame(
        '相乘后仍是厘米',
        '步数把每步的长度重复相加，得到10000厘米，单位不会自动变成米。',
        '80 × 125 = 10000（厘米）',
        distanceUnits(1),
      ),
      frame(
        '再按100厘米合成1米',
        '10000厘米每100厘米打一包，共100包，也就是100米。',
        '10000 ÷ 100 = 100（米）',
        distanceUnits(2),
      ),
    ],
    mistake: check(
      '80厘米一步，走125步，能直接写10000米吗？',
      '能，80×125=10000',
      '不能，是10000厘米，也就是100米',
      '乘法只改变长度的份数，没有改变每份所用的厘米单位。要换成米，还需除以100。',
      distanceUnits(2),
      distanceUnits(2, true),
    ),
    transfer: check(
      '每步60厘米，走150步，一共多少米？',
      '9000米',
      '90米',
      '60×150=9000厘米，9000÷100=90米。',
      distanceUnits(2, false, 60, 150),
      distanceUnits(2, true, 60, 150),
    ),
  },
  'u56-set-price': {
    prompt: '一张桌子145元，一把椅子55元。买24套，每套各一件，付5000元，剩多少元？',
    frames: [
      frame(
        '先圈出完整的一套',
        '每套既有桌子也有椅子，先合起来算一套200元。',
        '145 + 55 = 200（元）',
        setPrice(0),
      ),
      frame(
        '每套的钱重复24次',
        '买24套就是24份200元，不是买24张桌子。两种物品都不能漏掉。',
        '200 × 24 = 4800（元）',
        setPrice(1),
      ),
      frame(
        '从付款中拿走总费用',
        '5000元分成已经花掉的4800元和剩下的钱。剩余200元。',
        '5000 − 4800 = 200（元）',
        setPrice(2),
      ),
    ],
    mistake: check(
      '24套桌椅，只算145×24再从5000里减，可以吗？',
      '可以，每套有一张桌子',
      '不可以，还漏了24把椅子',
      '每一套都包含两件，漏一把椅子就会少算55元，24套共少算1320元。',
      setPrice(2),
      setPrice(2, 145, 55, 24, 5000, true),
    ),
    transfer: check(
      '桌子160元、椅子40元，每套各一件，买18套付4000元，剩多少？',
      '1120元',
      '400元',
      '每套200元，18套3600元，再用4000减去3600。1120元是只减桌子费用的错法。',
      setPrice(2, 160, 40, 18, 4000),
      setPrice(2, 160, 40, 18, 4000, true),
    ),
  },
};
