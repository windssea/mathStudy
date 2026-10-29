/** Deterministic teaching storyboards. Coordinates are in a 400 × 250 drawing space.
 * Color names describe mathematical roles; React only selects a frame. */
export type MethodTone = 'known' | 'focus' | 'error' | 'quiet' | 'warm';
export type MethodNode =
  | {
      kind: 'rect';
      x: number;
      y: number;
      w: number;
      h: number;
      tone: MethodTone;
      label?: string;
      dashed?: boolean;
    }
  | {
      kind: 'line';
      x: number;
      y: number;
      x2: number;
      y2: number;
      tone: MethodTone;
      dashed?: boolean;
    }
  | { kind: 'text'; x: number; y: number; text: string; tone: MethodTone; size?: number }
  | { kind: 'dot'; x: number; y: number; tone: MethodTone };
export interface MethodFrame {
  title: string;
  why: string;
  equation: string;
  nodes: MethodNode[];
}
export interface MethodStory {
  prompt: string;
  frames: MethodFrame[];
  mistake: { question: string; wrong: string; right: string; why: string; nodes: MethodNode[] };
  transfer?: { question: string; wrong: string; right: string; why: string; nodes: MethodNode[] };
}
const text = (
  x: number,
  y: number,
  value: string,
  tone: MethodTone = 'quiet',
  size = 22,
): MethodNode => ({ kind: 'text', x, y, text: value, tone, size });
const rect = (
  x: number,
  y: number,
  w: number,
  h: number,
  tone: MethodTone,
  label?: string,
  dashed = false,
): MethodNode => ({ kind: 'rect', x, y, w, h, tone, label, dashed });
const line = (
  x: number,
  y: number,
  x2: number,
  y2: number,
  tone: MethodTone = 'quiet',
  dashed = false,
): MethodNode => ({ kind: 'line', x, y, x2, y2, tone, dashed });
const frame = (title: string, why: string, equation: string, nodes: MethodNode[]): MethodFrame => ({
  title,
  why,
  equation,
  nodes,
});
const bars = (
  parts: { label: string; weight: number; tone?: MethodTone }[],
  heading = '',
): MethodNode[] => {
  const sum = parts.reduce((n, p) => n + p.weight, 0);
  let x = 24;
  return [
    text(200, 49, heading),
    ...parts.flatMap((p) => {
      const w = (352 * p.weight) / sum;
      const n = rect(x, 88, w - Math.min(3, w * 0.15), 64, p.tone ?? 'known', p.label);
      x += w;
      return [n];
    }),
  ];
};
const grid = (cols: number, rows: number, filled = rows * cols, edge = false): MethodNode[] => {
  const cell = Math.min(300 / cols, 150 / rows),
    x = (400 - cols * cell) / 2,
    y = 52;
  return [...Array(cols * rows)]
    .map((_, i) =>
      rect(
        x + (i % cols) * cell,
        y + Math.floor(i / cols) * cell,
        cell,
        cell,
        i < filled ? 'focus' : 'quiet',
      ),
    )
    .concat(edge ? [rect(x, y, cols * cell, rows * cell, 'known', undefined, true)] : []);
};
const cards = (labels: string[], active = labels.length - 1): MethodNode[] =>
  labels.flatMap((label, i) => [
    rect(32, 20 + i * 72, 336, 56, i === active ? 'focus' : 'known', label),
    ...(i < labels.length - 1 ? [line(200, 76 + i * 72, 200, 92 + i * 72)] : []),
  ]);
const rows = (labels: string[], values: string[], active: number): MethodNode[] =>
  labels.flatMap((label, i) => [
    text(82, 48 + i * 55, label, 'quiet', 20),
    rect(148, 18 + i * 55, 230, 44, i === active ? 'focus' : 'known', values[i]),
  ]);
const place = (
  digits: string,
  active: number,
  labels = ['千万', '百万', '十万', '万', '千', '百', '十', '个'],
): MethodNode[] => {
  const width = 352 / digits.length,
    x = 24;
  return [...digits].flatMap((digit, i) => [
    text(x + width * (i + 0.5), 58, labels[labels.length - digits.length + i], 'quiet', 18),
    rect(x + i * width, 78, width - 2, 66, i === active ? 'focus' : 'known', digit),
  ]);
};
const rectangle = (
  a: number,
  b: number,
  mode: 'boundary' | 'area' | 'fence' | 'cut',
  stage: number,
): MethodNode[] => {
  const x = 70,
    y = 55,
    w = 260,
    h = 145;
  const nodes: MethodNode[] = [
    rect(x, y, w, h, mode === 'area' ? 'focus' : 'quiet'),
    text(
      200,
      232,
      `${mode === 'fence' && stage === 0 ? '?' : a} ${mode === 'fence' ? '米' : '厘米'}`,
    ),
    text(36, 135, `${b}`),
  ];
  if (mode === 'fence')
    return [
      ...nodes,
      text(364, 135, `${b}`),
      rect(x - 12, y - 23, w + 24, 23, 'known', '墙'),
      line(x, y, x, y + h, 'focus'),
      line(x, y + h, x + w, y + h, 'focus'),
      line(x + w, y + h, x + w, y, 'focus'),
      text(
        200,
        136,
        stage === 0 ? '靠墙这边不用围' : stage === 1 ? `两条宽：${b} × 2` : `长：${a} 米`,
        'focus',
      ),
    ];
  if (mode === 'boundary')
    return [
      ...nodes,
      line(x, y, x + w, y, 'focus'),
      line(x + w, y, x + w, y + h, stage > 0 ? 'focus' : 'known'),
      line(x + w, y + h, x, y + h, stage > 0 ? 'focus' : 'known'),
      line(x, y + h, x, y, stage > 0 ? 'focus' : 'known'),
      text(200, 136, '沿外边走一周', 'focus'),
    ];
  if (mode === 'cut')
    return [
      ...nodes,
      rect(x + w - w / 3, y, w / 3, (h * 3) / 8, 'error', stage === 0 ? '剪去' : '12'),
      ...(stage > 0
        ? [
            line(x + w - w / 3, y, x + w - w / 3, y + (h * 3) / 8, 'focus'),
            line(x + w - w / 3, y + (h * 3) / 8, x + w, y + (h * 3) / 8, 'focus'),
          ]
        : []),
      text(174, 150, stage === 2 ? '剩余 84' : '原面积 96', 'focus'),
    ];
  return [...nodes, text(200, 136, `${a} × ${b} 个小方格`, 'focus')];
};
const division = (n: number, d: number, stage: number): MethodNode[] => {
  const q = Math.floor(n / d),
    r = n % d;
  return stage === 0
    ? bars(
        [
          { label: `每份 ${d}`, weight: d },
          { label: '还有多少份？', weight: n - d, tone: 'quiet' },
        ],
        `总量 ${n}`,
      )
    : stage === 1
      ? grouping(q, d, r)
      : bars(
          [
            { label: `${q} 份，共 ${d * q}`, weight: d * q, tone: 'focus' },
            ...(r ? [{ label: `余 ${r}`, weight: r, tone: 'warm' as const }] : []),
          ],
          `${d} × ${q} + ${r} = ${n}`,
        );
};

/** Every outlined box is one whole group. Dots are single leftover objects, not decorative marks. */
const grouping = (
  groups: number,
  each: number,
  remainder: number,
  focusLast = false,
): MethodNode[] => [
  text(200, 27, `${groups} 份，每份 ${each}`, 'known', 22),
  ...Array.from({ length: groups }, (_, i) =>
    rect(
      23 + (i % 7) * 51,
      45 + Math.floor(i / 7) * 53,
      46,
      43,
      focusLast && i === groups - 1 ? 'focus' : 'known',
      String(each),
    ),
  ),
  text(200, 177, `剩下 ${remainder} 个`, 'warm', 22),
  ...Array.from(
    { length: remainder },
    (_, i): MethodNode => ({
      kind: 'dot',
      x: 38 + (i % 18) * 18,
      y: 201 + Math.floor(i / 18) * 23,
      tone: 'warm',
    }),
  ),
];

const regroupRemainder = (each: number, left: number, regrouped: boolean): MethodNode[] => [
  text(
    200,
    27,
    regrouped ? `再圈出 ${each} 个，成为 1 份` : `剩下 ${left} 个，每份要 ${each} 个`,
    'focus',
    21,
  ),
  rect(23, 53, 287, 115, regrouped ? 'focus' : 'quiet', undefined, !regrouped),
  ...Array.from(
    { length: left },
    (_, i): MethodNode => ({
      kind: 'dot',
      x: i < each ? 44 + (i % 6) * 47 : 350,
      y: i < each ? 78 + Math.floor(i / 6) * 33 : 111,
      tone: i < each ? (regrouped ? 'focus' : 'known') : 'warm',
    }),
  ),
  text(166, 211, `这一圈：${each} 个`, 'focus', 22),
  text(350, 211, `剩 ${left - each}`, 'warm', 22),
];

const equalGroups = (
  count: number,
  each: number,
  heading: string,
  tone: MethodTone = 'known',
): MethodNode[] => [
  text(200, 28, heading, 'quiet', 21),
  ...Array.from({ length: count }, (_, i) =>
    rect(23 + (i % 7) * 51, 49 + Math.floor(i / 7) * 48, 46, 40, tone, String(each)),
  ),
  text(200, 229, `${count} 份 × 每份 ${each} = ${count * each}`, tone, 22),
];

/** Connecting lines show which two quantities an operation needs; future results stay hidden. */
const operationTree = (stage: number, bracket = false): MethodNode[] => {
  const first = bracket ? 20 : 24;
  const second = bracket ? 60 : 72;
  return [
    rect(28, 16, 70, 42, 'known', bracket ? '68' : '96'),
    rect(122, 16, 70, 42, 'known', bracket ? '48' : '4'),
    line(63, 58, 110, 83, stage === 0 ? 'focus' : 'known'),
    line(157, 58, 110, 83, stage === 0 ? 'focus' : 'known'),
    rect(53, 83, 115, 45, stage === 0 ? 'focus' : 'known', `${bracket ? '−' : '÷'} 得 ${first}`),
    rect(229, 83, 60, 45, stage === 0 ? 'quiet' : 'known', '3'),
    line(110, 128, 210, 150, stage === 1 ? 'focus' : 'known'),
    line(259, 128, 210, 150, stage === 1 ? 'focus' : 'quiet'),
    rect(
      155,
      150,
      115,
      43,
      stage === 1 ? 'focus' : stage > 1 ? 'known' : 'quiet',
      stage > 0 ? `× 得 ${second}` : '再做乘法',
    ),
    rect(318, 150, 67, 43, stage === 2 ? 'known' : 'quiet', bracket ? '840' : '18'),
    line(210, 193, 290, 209, stage === 2 ? 'focus' : 'quiet'),
    line(351, 193, 290, 209, stage === 2 ? 'focus' : 'quiet'),
    rect(
      215,
      209,
      165,
      40,
      stage === 2 ? 'focus' : 'quiet',
      stage > 1
        ? bracket
          ? '840 ÷ 60 = 14'
          : '72 − 18 = 54'
        : bracket
          ? '最后做除法'
          : '最后做减法',
    ),
  ];
};

/** Wall is dashed; only solid highlighted lines consume fencing. Coordinates are schematic. */
const fenceModel = (
  long: number,
  wide: number,
  stage: number,
  wallOnShortSide = false,
): MethodNode[] => {
  const wall = wallOnShortSide
    ? line(70, 60, 70, 175, 'quiet', true)
    : line(70, 60, 330, 60, 'quiet', true);
  const sides = wallOnShortSide
    ? [
        line(70, 60, 330, 60, 'focus'),
        line(330, 60, 330, 175, 'focus'),
        line(330, 175, 70, 175, 'focus'),
      ]
    : [
        line(70, 60, 70, 175, 'focus'),
        line(330, 60, 330, 175, 'focus'),
        line(70, 175, 330, 175, stage > 0 ? 'focus' : 'known'),
      ];
  return [
    rect(70, 60, 260, 115, stage >= 2 ? 'focus' : 'quiet'),
    wall,
    ...sides,
    text(200, 33, wallOnShortSide ? '宽边靠墙：左边不用围' : '长边靠墙：上边不用围', 'quiet', 20),
    text(37, 123, String(wide), 'known', 22),
    text(361, 123, String(wide), 'known', 22),
    text(200, 208, stage === 0 && !wallOnShortSide ? '长 ? 米' : `长 ${long} 米`, 'focus', 22),
    text(
      200,
      124,
      stage >= 2 ? `面积 ${long * wide} 平方米` : `宽 ${wide} 米`,
      stage >= 2 ? 'focus' : 'known',
      22,
    ),
    ...(stage === 3
      ? [line(70, 60, 330, 60, 'error', true), text(200, 242, '× 墙边不需要围栏', 'error', 20)]
      : []),
  ];
};
const multiplication = (
  n: number,
  tens: number,
  ones: number,
  stage: number,
  wrong = false,
): MethodNode[] => {
  const left = 24,
    top = 50,
    total = 352;
  // The model is explicitly schematic. Leave enough room to read both partial products.
  const w = Math.min(244, Math.max(176, (total * tens * 10) / (tens * 10 + ones)));
  return [
    rect(left, top, w, 130, stage >= 1 ? 'focus' : 'known', `${n} × ${wrong ? tens : tens * 10}`),
    rect(left + w, top, total - w, 130, 'known', `${n}×${ones}`),
    text(left + w / 2, 218, String(n * tens * (wrong ? 1 : 10)), wrong ? 'error' : 'focus'),
    text(left + w + (total - w) / 2, 218, String(n * ones), 'known'),
  ];
};
const story = (
  prompt: string,
  frames: MethodFrame[],
  question: string,
  wrong: string,
  right: string,
  why: string,
  nodes?: MethodNode[],
): MethodStory => ({
  prompt,
  frames,
  mistake: { question, wrong, right, why, nodes: nodes ?? frames[frames.length - 1].nodes },
});

export const methodStories: Record<string, MethodStory> = {
  'u1-mental': story(
    '630 ÷ 90，为什么可以先算 63 ÷ 9？',
    [
      frame(
        '把“十”当作一份',
        '630 是 63 个十，90 是 9 个十。',
        '630 ÷ 90',
        bars([{ label: '63 个十', weight: 7 }], '换同一种计数单位'),
      ),
      frame(
        '同时缩小，两边一起变',
        '被除数、除数同时除以 10，每组的份数不变。',
        '63 ÷ 9 = 7',
        cards(['630 ÷ 90', '↓ 两边都 ÷ 10', '63 ÷ 9 = 7'], 2),
      ),
      frame(
        '乘回去，检查分得对不对',
        '7 份，每份 90，正好是 630。',
        '90 × 7 = 630',
        bars(
          Array.from({ length: 7 }, () => ({ label: '90', weight: 1, tone: 'focus' as const })),
          '7 份',
        ),
      ),
    ],
    '哪一种变化能保持商不变？',
    '只把 630 除以 10',
    '630 和 90 都除以 10',
    '只改一边，原来的分组关系就改变了。',
  ),
  'u1-written': story(
    '504 ÷ 24，十位上的 2 表示多少？',
    [
      frame(
        '先分出 20 份',
        '前两位 50 够除以 24，商从十位写起。',
        '24 × 20 = 480',
        rows(['商的十位', '表示的份数', '已经分掉'], ['2', '20 份', '480'], 0),
      ),
      frame(
        '余下的继续分',
        '504 减去 480，还剩 24，能再分 1 份。',
        '504 − 480 = 24',
        bars(
          [
            { label: '已分 480', weight: 480 },
            { label: '24', weight: 24, tone: 'focus' },
          ],
          '504',
        ),
      ),
      frame(
        '两次分组加起来',
        '20 份加 1 份，合起来是 21 份。',
        '24 × 21 = 504',
        bars(
          [
            { label: '20 份', weight: 20 },
            { label: '1', weight: 1, tone: 'focus' },
          ],
          '商 21 = 20 + 1',
        ),
      ),
    ],
    '十位商 2，乘回去应是多少？',
    '24 × 2 = 48',
    '24 × 20 = 480',
    '商写在十位，表示的是 20 份。',
  ),
  'u1-trial': story(
    '172 ÷ 28，试商 5 后为什么还要调商？',
    [
      frame(
        '先试 5 份',
        '把 28 看作 30，先估一个商，再乘回原除数。',
        '28 × 5 = 140',
        bars(
          [
            { label: '140', weight: 140 },
            { label: '余 32', weight: 32, tone: 'warm' },
          ],
          '共 172',
        ),
      ),
      frame(
        '余下还能再分一份',
        '32 大于 28，说明原来分的份数少了。',
        '32 ≥ 28，商小了',
        bars(
          [
            { label: '再分 28', weight: 28, tone: 'focus' },
            { label: '4', weight: 4, tone: 'warm' },
          ],
          '余下的 32',
        ),
      ),
      frame(
        '加一份后再检查',
        '余数 4 小于 28，才算分完。',
        '172 = 28 × 6 + 4',
        division(172, 28, 2),
      ),
    ],
    '试商以后，能只看乘积没超过吗？',
    '没超过就可以',
    '还要看余数是否小于除数',
    '余数仍能再分一份，就说明商偏小。',
  ),
  'u1-remainder': story(
    '235 ÷ 18，余数为什么不能等于 18？',
    [
      frame(
        '先分出 12 份，看看剩下什么',
        '每个框是完整的一份，里面有 18 个。先分 12 份，还剩 19 个。',
        '235 − 18 × 12 = 19',
        grouping(12, 18, 19),
      ),
      frame(
        '剩下的还能再组成一份',
        '把剩下的 19 个摆出来，其中 18 个正好够一份。余数不能停在 19。',
        '19 = 18 + 1',
        regroupRemainder(18, 19, false),
      ),
      frame(
        '多分一份，商就要加 1',
        '圈出 18 个，放进新的一份。12 份变成 13 份，外面只剩 1 个。',
        '12 + 1 = 13；19 − 18 = 1',
        regroupRemainder(18, 19, true),
      ),
      frame(
        '只剩 1 个，已经不够一份',
        '13 个框共装了 234 个。剩下的 1 个小于每份的 18 个，这才真正分完。',
        '235 ÷ 18 = 13……1；1 < 18',
        grouping(13, 18, 1, true),
      ),
      frame(
        '把完整份和剩下的合回去',
        '验算要同时检查两件事：合起来仍是 235，剩下的又不足一份。',
        '18 × 13 + 1 = 235',
        [...grouping(13, 18, 1), text(200, 242, '整份 234 + 剩下 1 = 原来 235', 'focus', 20)],
      ),
    ],
    '除数是 18，余数最大能是几？',
    '18',
    '17',
    '如果余下 18，还能再组成一份，商应加 1；所以余数最大是比 18 少 1 的 17。',
    regroupRemainder(18, 18, true),
  ),
  'u1-order': story(
    '480 ÷ 8 ÷ 6，为什么能除以 8 × 6？',
    [
      frame(
        '先平均分成 8 大组',
        '每大组有 60，继续分这一个大组。',
        '480 ÷ 8 = 60',
        bars(
          Array.from({ length: 8 }, () => ({ label: '60', weight: 1 })),
          '8 大组，共 480',
        ),
      ),
      frame('每大组再分 6 小组', '每小组有 10，一共不是 8 ÷ 6 组。', '60 ÷ 6 = 10', grid(8, 6, 48)),
      frame(
        '直接数一共多少小组',
        '8 大组，每组 6 小组，共 48 小组。',
        '480 ÷ (8 × 6) = 10',
        cards(['8 × 6 = 48 小组', '480 ÷ 48 = 10'], 1),
      ),
    ],
    '合并连续两次除法，除数怎样合并？',
    '除以 (8 ÷ 6)',
    '除以 (8 × 6)',
    '先分 8 组，再把每组分 6 份，共分成 48 份。',
  ),
  'u1-units': story(
    '420 分是多少时？288 时是多少日？',
    [
      frame(
        '先选对进率',
        '一小时有 60 分，一天有 24 时。',
        '1 时 = 60 分；1 日 = 24 时',
        cards(['1 时 = 60 分', '1 日 = 24 时'], 0),
      ),
      frame(
        '小单位换大单位，数有几份',
        '420 分里有 7 份 60 分。',
        '420 ÷ 60 = 7 时',
        bars(
          Array.from({ length: 7 }, () => ({ label: '60', weight: 1, tone: 'focus' as const })),
          '420 分',
        ),
      ),
      frame(
        '用另一种进率再看一次',
        '288 小时里有 12 份 24 小时。',
        '288 ÷ 24 = 12 日',
        cards(['288 时', '每 24 时是 1 日', '12 日'], 2),
      ),
    ],
    '把小时换成日，应该除以多少？',
    '60',
    '24',
    '60 用在时与分之间；日与时的进率是 24。',
  ),
  'u1-restore': story(
    '把除数 32 看成 23，错得商 16 余 5。',
    [
      frame(
        '先找没有改变的总数',
        '错除数、错商和余数，仍能还原原被除数。',
        '23 × 16 + 5 = 373',
        bars(
          [
            { label: '23 × 16 = 368', weight: 368 },
            { label: '5', weight: 5, tone: 'warm' },
          ],
          '原来的被除数',
        ),
      ),
      frame(
        '把错误除数换回来',
        '373 没变，现在每份应该是 32。',
        '373 ÷ 32',
        cards(['被除数 373 不变', '错除数 23 → 正确 32'], 1),
      ),
      frame(
        '重新分组并验算',
        '分成 11 份后剩 21，小于 32。',
        '32 × 11 + 21 = 373',
        division(373, 32, 2),
      ),
    ],
    '重新计算前，先找什么？',
    '用正确除数乘错商',
    '用错除数还原被除数',
    '错商 16 属于除以 23 的过程，不能直接配给 32。',
  ),
  'u1-loading': story(
    '157 人，每车 24 座，至少需要几辆？',
    [
      frame(
        '先让 6 辆车坐满',
        '6 辆车能坐 144 人。',
        '24 × 6 = 144',
        bars(
          Array.from({ length: 6 }, () => ({ label: '24', weight: 1 })),
          '6 辆车',
        ),
      ),
      frame(
        '看剩下的人有没有车',
        '还有 13 人，人数没坐满一车也需要安排。',
        '157 − 144 = 13',
        bars(
          [
            { label: '144 人已有座位', weight: 144 },
            { label: '13 人', weight: 13, tone: 'warm' },
          ],
          '所有人都要上车',
        ),
      ),
      frame(
        '为余下的人补一辆',
        '补的这一辆不必坐满，但不能省掉。',
        '6 + 1 = 7 辆',
        bars(
          [
            { label: '6 辆坐满', weight: 6 },
            { label: '再 1 辆', weight: 1, tone: 'focus' },
          ],
          '7 辆才能全部坐下',
        ),
      ),
    ],
    '剩 13 人时，应该怎样处理？',
    '舍掉余数，只要 6 辆',
    '再安排 1 辆，共 7 辆',
    '商只表示坐满的车数；题目要求所有人都坐下。',
  ),
  'u1-intervals': story(
    '240 厘米的木条，每段 30 厘米，锯几次？',
    [
      frame(
        '先求分成几段',
        '每一段 30 厘米，共有 8 段。',
        '240 ÷ 30 = 8 段',
        bars(
          Array.from({ length: 8 }, () => ({ label: '30', weight: 1 })),
          '240 厘米',
        ),
      ),
      frame(
        '只数中间的切口',
        '两头本来就是端点，不用再锯。',
        '8 段之间有 7 个切口',
        Array.from({ length: 8 }, (_, i) =>
          rect(24 + i * 44, 80, 42, 60, 'known', String(i + 1)),
        ).concat(
          Array.from({ length: 7 }, (_, i) => line(67 + i * 44, 60, 67 + i * 44, 165, 'error')),
        ),
      ),
      frame(
        '把段数与次数分开',
        '一根木条，每锯一次只增加一段。',
        '锯的次数 = 段数 − 1 = 7',
        cards(['原来 1 段', '锯 7 次，增加 7 段', '最后 8 段'], 2),
      ),
    ],
    '把一根木条锯成 8 段，要几次？',
    '8 次',
    '7 次',
    '两端不用锯。这里按每次锯一根、无叠放来计算。',
  ),
  'u1-changes': story(
    '420 ÷ 35 = 12，只改一边和两边一起改有什么不同？',
    [
      frame(
        '原来每份 35，共 12 份',
        '把总量和每份量分开看。',
        '420 ÷ 35 = 12',
        bars([{ label: '12 份 × 35', weight: 1 }], '原来 420'),
      ),
      frame(
        '只把总量加倍',
        '每份不变，总数加倍，份数也加倍。',
        '840 ÷ 35 = 24',
        bars(
          [
            { label: '原来 12 份', weight: 1 },
            { label: '再加 12 份', weight: 1, tone: 'focus' },
          ],
          '总量 × 2',
        ),
      ),
      frame(
        '总量与每份量同时加倍',
        '每份也变大，份数保持不变。',
        '840 ÷ 70 = 12',
        bars([{ label: '仍是 12 份，每份 70', weight: 1, tone: 'focus' }], '总量 × 2，每份量 × 2'),
      ),
    ],
    '两边同时乘 2，商怎样变化？',
    '商也乘 2',
    '商不变',
    '分组总量和每一份都加倍，份数没有变。',
  ),
  'u1-groups': story(
    '240 本书，2 个书架，每架 4 层，每层多少本？',
    [
      frame(
        '先分到 2 个书架',
        '每个书架得到 120 本。',
        '240 ÷ 2 = 120',
        bars(
          [
            { label: '120 本', weight: 1 },
            { label: '120 本', weight: 1 },
          ],
          '2 个书架',
        ),
      ),
      frame('每架再分到 4 层', '书架里的每一层都要分到书。', '120 ÷ 4 = 30', grid(2, 4)),
      frame(
        '一共 8 层，一次分完也可以',
        '两级分组是相乘，不能漏掉书架或层。',
        '240 ÷ (2 × 4) = 30',
        cards(['2 × 4 = 8 层', '每层 30 本', '30 × 8 = 240'], 2),
      ),
    ],
    '求每层多少本，240 应除以什么？',
    '只除以 4',
    '除以 2 × 4',
    '每个书架都有 4 层，2 个书架一共 8 层。',
  ),
};

// Geometry: the boundary, interior and removed parts remain visibly different.
methodStories['u2-meaning'] = story(
  '7 厘米 × 4 厘米，周长和面积看哪里？',
  [
    frame(
      '周长看外边的一圈',
      '把四条边接起来，量的是线的长度。',
      '7 + 4 + 7 + 4 = 22 厘米',
      rectangle(7, 4, 'boundary', 1),
    ),
    frame(
      '面积看里面铺了多少格',
      '每行 7 个单位方格，一共有 4 行。',
      '7 × 4 = 28 平方厘米',
      grid(7, 4),
    ),
    frame(
      '单位跟着测量对象走',
      '线用厘米，面用平方厘米，两者不能替换。',
      '周长 22 厘米；面积 28 平方厘米',
      rows(['外边一圈', '里面的面'], ['22 厘米', '28 平方厘米'], 1),
    ),
  ],
  '给画框配玻璃，应求什么？',
  '周长',
  '面积',
  '玻璃铺满框里面的面；框条才沿着外边一圈。',
);
methodStories['u2-units'] = story(
  '1 平方米为什么是 100 平方分米？',
  [
    frame(
      '每边分成 10 小段',
      '1 米 = 10 分米，横向和纵向都要分。',
      '横 10 格，竖 10 格',
      grid(10, 10, 10),
    ),
    frame(
      '一排 10 格，共 10 排',
      '面积里的两条边都扩大了计数份数。',
      '10 × 10 = 100',
      grid(10, 10),
    ),
    frame(
      '单位统一后才相加',
      '3 平方米先换成 300 平方分米。',
      '300 + 40 = 340 平方分米',
      bars(
        [
          { label: '300', weight: 300 },
          { label: '40', weight: 40, tone: 'focus' },
        ],
        '全部用平方分米',
      ),
    ),
  ],
  '1 平方米等于多少平方分米？',
  '10',
  '100',
  '长度只数一条边，面积要数 10 行、每行 10 格。',
);
methodStories['u2-grid'] = story(
  '6 列 4 行的小方格，哪些边属于周长？',
  [
    frame('数格子求面积', '一格是 1 平方厘米，按行列数。', '6 × 4 = 24 平方厘米', grid(6, 4)),
    frame(
      '只沿外框走一圈',
      '内部公共边没有露在外面，不算周长。',
      '(6 + 4) × 2 = 20 厘米',
      grid(6, 4, 24, true),
    ),
    frame(
      '相邻小格的公共边要藏起来',
      '两格拼在一起，外面只剩 6 条单位边。',
      '两个小格：4 + 4 − 2 = 6 条单位边',
      [
        ...grid(2, 1),
        line(200, 52, 200, 202, 'error', true),
        text(200, 232, '虚线是内部公共边', 'error', 20),
      ],
    ),
  ],
  '数周长时，内部公共边算不算？',
  '要算进去',
  '不算，只数外边界',
  '周长围在图形外面，公共边藏在内部。',
);
methodStories['u2-measure'] = story(
  '长 9 厘米、宽 5 厘米，两个公式怎样来的？',
  [
    frame('先看一行，再看几行', '每行 9 格，共 5 行。', '面积 = 9 × 5 = 45 平方厘米', grid(9, 5)),
    frame(
      '相对的边一样长',
      '长和宽各有两条，把它们加起来。',
      '周长 = (9 + 5) × 2 = 28 厘米',
      rectangle(9, 5, 'boundary', 1),
    ),
    frame(
      '反过来也能找到宽',
      '半个周长是一条长加一条宽。',
      '28 ÷ 2 − 9 = 5 厘米',
      bars(
        [
          { label: '长 9', weight: 9 },
          { label: '宽 5', weight: 5, tone: 'focus' },
        ],
        '半个周长 14',
      ),
    ),
  ],
  '已知长和周长，怎样求宽？',
  '周长 − 长',
  '周长 ÷ 2 − 长',
  '周长中有两条长和两条宽，先取一半。',
);
methodStories['u2-cut'] = story(
  '12 × 8 的纸，角上剪去 4 × 3，会怎样？',
  [
    frame(
      '把剪去的面标出来',
      '原纸 96 平方厘米，红色角是剪掉的 12。',
      '12 × 8 = 96；4 × 3 = 12',
      rectangle(12, 8, 'cut', 0),
    ),
    frame(
      '只减去被拿走的面',
      '整张减去红色的角，未剪掉的面就是所求面积。',
      '96 − 12 = 84 平方厘米',
      rectangle(12, 8, 'cut', 2),
    ),
    frame(
      '周长要重新追边界',
      '剪掉的上边 4、右边 3，换成向内的 4 和 3。',
      '少 4 + 3，又多 4 + 3',
      rectangle(12, 8, 'cut', 1),
    ),
  ],
  '沿原边平行剪去一个角，周长一定减少吗？',
  '一定减少',
  '这例中不变',
  '新增加的两条边，与原来少掉的两段一样长。',
);
methodStories['u2-fence'] = story(
  '三边围栏共 32 米，垂直墙的宽 6 米，面积是多少？',
  [
    frame(
      '先划掉不用围的那一边',
      '上面靠墙，只围左、右和下面三条边。',
      '32 米 = 一条长 + 两条宽',
      fenceModel(20, 6, 0),
    ),
    frame('先用掉两条宽', '左边 6 米，右边也是 6 米，剩下才是长。', '长 = 32 − 6 × 2 = 20 米', [
      ...bars(
        [
          { label: '左宽 6', weight: 6 },
          { label: '长 20', weight: 20, tone: 'focus' },
          { label: '右宽 6', weight: 6 },
        ],
        '把需要围的三边展开',
      ),
      text(200, 205, '两条宽先占去 12 米', 'known', 22),
    ]),
    frame(
      '求面积，再乘回去检查',
      '面积用长乘宽；围栏用三边相加来验算。',
      '20 × 6 = 120 平方米',
      fenceModel(20, 6, 2),
    ),
    frame(
      '沿着实线走，核对用了多少围栏',
      '从左上开始，走左宽、下面长、右宽。到墙边就停，不走虚线墙边。',
      '6 + 20 + 6 = 32 米',
      [...fenceModel(20, 6, 1), text(200, 242, '左 6 → 下 20 → 右 6', 'focus', 20)],
    ),
    frame(
      '把墙边也算进去，就多算了',
      '红色虚线是已经有的墙，不需要再买围栏。完整周长 52 米比围栏多出 20 米。',
      '(20 + 6) × 2 = 52；52 − 20 = 32',
      fenceModel(20, 6, 3),
    ),
  ],
  '这里的 32 米是长方形完整周长吗？',
  '是，先算 32 ÷ 2',
  '不是，只是另外三边',
  '靠墙的一边没有用围栏，32 里只有一条长、两条宽。',
  fenceModel(20, 6, 3),
);
methodStories['u1-remainder'].transfer = {
  question: '换一组数：203 个，每 16 个一份，怎样才分完？',
  wrong: '12 份，还剩 16 个',
  right: '12 份，还剩 11 个',
  why: '16 × 12 = 192，203 − 192 = 11；11 不够再组成一份。若剩 16 个，还能再分一份，而且总数也不再是 203。',
  nodes: grouping(12, 16, 11),
};
methodStories['u2-fence'].transfer = {
  question: '换个靠墙方向：长 10 米、宽 8 米，宽边靠墙，需要围几米？',
  wrong: '26 米：10 + 8 + 8',
  right: '28 米：10 + 10 + 8',
  why: '这次靠墙的是宽边。剩下要围的是两条长、一条宽，所以是 10 + 10 + 8 = 28 米。不能照抄“长加两条宽”。',
  nodes: fenceModel(10, 8, 1, true),
};
methodStories['u2-tiling'] = story(
  '6 米 × 4 米，边长 2 分米的砖，每块 3 元。',
  [
    frame(
      '边长先换成同一种单位',
      '地面是 60 分米 × 40 分米，砖是 2 × 2 分米。',
      '6 米 = 60 分米；4 米 = 40 分米',
      rows(['地面长', '地面宽', '砖边长'], ['60 分米', '40 分米', '2 分米'], 2),
    ),
    frame(
      '每排多少块，一共多少排',
      '这里两条边都能整除，能整齐铺满。',
      '60 ÷ 2 = 30；40 ÷ 2 = 20',
      [...grid(6, 4), text(200, 232, '示意：实际为 30 列 × 20 行', 'quiet', 18)],
    ),
    frame(
      '先算块数，再算费用',
      '面积比得到块数，乘单价才是花的钱。',
      '30 × 20 × 3 = 1800 元',
      cards(['600 块砖', '每块 3 元', '总价 1800 元'], 2),
    ),
  ],
  '一块边长 2 分米的砖，面积是多少？',
  '2 平方分米',
  '4 平方分米',
  '一块砖有 2 行，每行 2 个单位方格。',
);
methodStories['u2-compare'] = story(
  '同样用 28 米绳子，4 × 10 与 7 × 7 哪个围得大？',
  [
    frame(
      '先确认固定的条件',
      '两种方案的长宽和都是 14。',
      '(4 + 10) × 2 = (7 + 7) × 2',
      rows(['方案一', '方案二'], ['长 10，宽 4', '长 7，宽 7'], 0),
    ),
    frame('把面积画在相同尺度上', '细长的长方形面积 40，正方形面积 49。', '40 < 49', [
      rect(28, 70, 180, 72, 'known', '40'),
      rect(240, 35, 126, 126, 'focus', '49'),
      text(200, 222, '相同周长，面积可能不同', 'quiet', 20),
    ]),
    frame(
      '比较的是面，不是围栏',
      '绳子一样长，不代表里面铺的方格一样多。',
      '7 × 7 = 49 平方米，更大',
      bars(
        [
          { label: '40', weight: 40 },
          { label: '多 9', weight: 9, tone: 'focus' },
        ],
        '49 比 40 多 9',
      ),
    ),
  ],
  '周长一样，面积一定一样吗？',
  '一定一样',
  '不一定',
  '周长固定的是边界总长，长宽的搭配仍然可以改变。',
);

// Quantity relationships: segment widths encode parts of the same total.
methodStories['u3-inverse'] = story(
  '12 行，每行 30 人，改排 18 行，每行多少人？',
  [
    frame(
      '先守住总人数',
      '队伍变了行数，人没有增加或减少。',
      '12 × 30 = 360 人',
      equalGroups(12, 30, '原来 12 行，每个框是一行'),
    ),
    frame(
      '把同一总量重新分组',
      '现在要把 360 人平均分成 18 行。',
      '360 ÷ 18 = 20 人',
      equalGroups(18, 20, '现在 18 行：框多了，每框少了', 'focus'),
    ),
    frame(
      '乘回去，看总数是否相同',
      '行数增多，每行人数减少；总人数保持不变。',
      '18 × 20 = 12 × 30',
      rows(['原来', '现在'], ['12 × 30 = 360', '18 × 20 = 360'], 1),
    ),
  ],
  '改排时保持不变的量是什么？',
  '每行人数',
  '总人数',
  '重排只改变分组方式，不改变人数。',
);
methodStories['u3-shopping'] = story(
  '4 本 12 元的本子、3 支 5 元的笔，付 100 元。',
  [
    frame(
      '不同商品分开算钱',
      '单价不同，不能把本数和支数直接合起来。',
      '12 × 4 = 48；5 × 3 = 15',
      rows(['本子', '笔'], ['48 元', '15 元'], 0),
    ),
    frame(
      '把花的钱合起来',
      '48 元和 15 元，都是费用，可以相加。',
      '48 + 15 = 63 元',
      bars(
        [
          { label: '本子 48', weight: 48 },
          { label: '笔 15', weight: 15, tone: 'focus' },
        ],
        '花掉 63 元',
      ),
    ),
    frame(
      '付的钱分成花费与找零',
      '找零是 100 元中没有花掉的部分。',
      '100 − 63 = 37 元',
      bars(
        [
          { label: '花费 63', weight: 63 },
          { label: '找零 37', weight: 37, tone: 'focus' },
        ],
        '付款 100 元',
      ),
    ),
  ],
  '算找零，最后一步是什么？',
  '100 + 63',
  '100 − 63',
  '付款等于花费加找零，找零是剩下的一段。',
);
methodStories['u3-compare'] = story(
  '单本 11 元，3 本一包 30 元，买 8 本怎样省？',
  [
    frame(
      '整包只能按整数买',
      '8 本最多买 2 个整包，还有 2 本单买。',
      '8 = 3 + 3 + 2',
      bars(
        [
          { label: '3 本', weight: 3 },
          { label: '3 本', weight: 3 },
          { label: '2 本', weight: 2, tone: 'focus' },
        ],
        '正好 8 本',
      ),
    ),
    frame(
      '列出可行的购买方案',
      '每个方案都正好买到 8 本，再比较钱数。',
      '0 包 88 元；1 包 85 元；2 包 82 元',
      rows(['0 包 + 8 本', '1 包 + 5 本', '2 包 + 2 本'], ['88 元', '85 元', '82 元'], 2),
    ),
    frame(
      '买 2 包，再单买 2 本',
      '2 包共 60 元，2 本共 22 元。',
      '2 × 30 + 2 × 11 = 82 元',
      bars(
        [
          { label: '2 包 60', weight: 60 },
          { label: '2 本 22', weight: 22, tone: 'focus' },
        ],
        '总价 82 元',
      ),
    ),
  ],
  '能按每本 10 元直接买 8 本吗？',
  '能，一共 80 元',
  '不能，优惠价按整包出售',
  '8 不能整分成每包 3 本，余下两本要按单本价买。',
);
methodStories['u3-speed'] = story(
  '12 分钟走 840 米，同样速度，21 分钟走多远？',
  [
    frame(
      '先看每 1 分钟走多少',
      '把 840 米分成 12 份，取其中 1 份。',
      '840 ÷ 12 = 70 米/分',
      equalGroups(12, 70, '每个框表示 1 分钟走的米数'),
    ),
    frame(
      '21 份同样的距离合起来',
      '70 是每分钟的路程，现在有 21 分钟。',
      '70 × 21 = 1470 米',
      equalGroups(21, 70, '现在有 21 个同样的 70 米', 'focus'),
    ),
    frame(
      '用单位检查数量关系',
      '速度乘时间，分钟相互对应，结果是米。',
      '米/分 × 分 = 米',
      rows(['速度', '时间', '路程'], ['70 米/分', '21 分', '1470 米'], 2),
    ),
  ],
  '70 的完整单位是什么？',
  '米',
  '米/分',
  '它说的是每 1 分钟走的距离，不能漏掉“每分”。',
);
methodStories['u3-journey'] = story(
  '去程 60 千米/时行 3 时，90 千米/时返回，休息 1 时。',
  [
    frame(
      '先找相同的单程路程',
      '沿原路返回，路程相同，速度可以不同。',
      '60 × 3 = 180 千米',
      bars([{ label: '去程 180 千米', weight: 1 }], '去程与返回同一条路'),
    ),
    frame(
      '返回速度快，用时就短',
      '180 千米按每小时 90 千米，需 2 小时。',
      '180 ÷ 90 = 2 时',
      rows(['去程', '返回'], ['60 × 3 = 180', '90 × 2 = 180'], 1),
    ),
    frame(
      '总时间还包括停下来的时间',
      '休息时不走路，但时间仍然过去。',
      '3 + 2 + 1 = 6 时',
      bars(
        [
          { label: '去 3 时', weight: 3 },
          { label: '回 2 时', weight: 2 },
          { label: '休 1 时', weight: 1, tone: 'warm' },
        ],
        '共 6 小时',
      ),
    ),
  ],
  '求全程所用时间，要算休息吗？',
  '不用，没增加路程',
  '要，休息也经过了时间',
  '题目求总时间，行走和休息都包含在内。',
);
methodStories['u3-conditions'] = story(
  '每箱 9 千克，装 40 箱；改成每箱 12 千克，少几箱？',
  [
    frame(
      '先找保持不变的总质量',
      '换箱子，水果的总质量没有变。',
      '9 × 40 = 360 千克',
      bars([{ label: '40 箱 × 9 千克', weight: 1 }], '总量 360 千克'),
    ),
    frame(
      '用新箱子的每份量重新分',
      '每箱装得多，箱数会减少。',
      '360 ÷ 12 = 30 箱',
      bars([{ label: '30 箱 × 12 千克', weight: 1, tone: 'focus' }], '仍然 360 千克'),
    ),
    frame(
      '题目问少几箱，还要比较',
      '新箱数是 30，减少的箱数才是答案。',
      '40 − 30 = 10 箱',
      bars(
        [
          { label: '现在 30', weight: 30 },
          { label: '少用 10', weight: 10, tone: 'focus' },
        ],
        '原来 40 箱',
      ),
    ),
  ],
  '12 − 9 算出的是少用的箱数吗？',
  '是，少用 3 箱',
  '不是，是每箱多装的千克数',
  '比较前要看单位；千克之差不能直接当箱数之差。',
);

methodStories['u4-order'] = story(
  '96 ÷ 4 × 3 − 18，第一步算什么？',
  [
    frame('同一级，从左往右', '乘除同级，排在左边的除法先算。', '96 ÷ 4 = 24', operationTree(0)),
    frame(
      '算乘法，保留未算部分',
      '只替换算过的部分，减 18 暂时不动。',
      '24 × 3 = 72',
      operationTree(1),
    ),
    frame('最后处理加减', '顺序对应每一步得到的中间结果。', '72 − 18 = 54', operationTree(2)),
  ],
  '能先算中间的 4 × 3 吗？',
  '能，先乘后除',
  '不能，乘除同级从左往右',
  '“先乘除”是先处理同一等级，不是乘法永远比除法先。',
);
methodStories['u4-brackets'] = story(
  '840 ÷ [(68 − 48) × 3]，为什么先算里面？',
  [
    frame(
      '先算最里面的整体',
      '小括号包住一个需要先知道的量。',
      '68 − 48 = 20',
      operationTree(0, true),
    ),
    frame('再算中括号里的整体', '20 乘 3 作为完整的除数。', '20 × 3 = 60', operationTree(1, true)),
    frame(
      '最后再平均分',
      '除以 60，不能在除以 20 后再乘 3。',
      '840 ÷ 60 = 14',
      operationTree(2, true),
    ),
  ],
  '中括号里的 20 × 3 表示什么？',
  '只先除以 20，之后再乘 3',
  '先合成除数 60',
  '整个中括号都是除数，不能拆开改变分组关系。',
);
methodStories['u4-model'] = story(
  '500 元，先买 4 件每件 35 元的用品，余款买 12 元的书。',
  [
    frame(
      '先算已经花掉的钱',
      '500 元分成用品费和余款两段。',
      '35 × 4 = 140 元',
      bars(
        [
          { label: '用品费 140', weight: 140 },
          { label: '余款 ?', weight: 360, tone: 'quiet' },
        ],
        '共有 500 元',
      ),
    ),
    frame(
      '把余款作为一个整体',
      '能用来买书的只有剩下的 360 元。',
      '500 − 140 = 360 元',
      bars(
        [
          { label: '140', weight: 140 },
          { label: '可以买书 360', weight: 360, tone: 'focus' },
        ],
        '先求括号中的量',
      ),
    ),
    frame(
      '每 12 元买一本书',
      '先得到余款，再按每本 12 元分组。',
      '(500 − 35 × 4) ÷ 12 = 30 本',
      cards(['用品费 140', '余款 360', '可以买 30 本'], 2),
    ),
  ],
  '哪一个整体应该放进括号？',
  '35 × 4 ÷ 12',
  '500 − 35 × 4',
  '先求余款，再用余款除以书的单价。',
);
methodStories['u4-steps'] = story(
  '绳子用去 6 段，每段 9 米，还剩 17 米，原来多长？',
  [
    frame(
      '先把用去的拼起来',
      '6 段，每段 9 米，共用去 54 米。',
      '9 × 6 = 54 米',
      bars(
        Array.from({ length: 6 }, () => ({ label: '9', weight: 1 })),
        '用去的部分',
      ),
    ),
    frame(
      '求原来，把剩下的接回去',
      '原来长度等于用去的加剩下的。',
      '54 + 17 = 71 米',
      bars(
        [
          { label: '用去 54', weight: 54 },
          { label: '剩 17', weight: 17, tone: 'focus' },
        ],
        '原来 71 米',
      ),
    ),
    frame(
      '按事情发生的顺序验算',
      '从原长减去用掉的，应该还剩 17。',
      '71 − 54 = 17 米',
      cards(['原来 71', '用掉 54', '剩下 17'], 2),
    ),
  ],
  '题目有“还剩”，最后一定做减法吗？',
  '一定',
  '不一定，求原来要加回去',
  '文字是线索；最后一步由求哪一个量决定。',
);
methodStories['u4-budget'] = story(
  '63 人租车，最多 3 辆：大车 24 座 180 元，小车 16 座 140 元。',
  [
    frame(
      '先筛座位够不够',
      '最多两辆大车只有 48 座，所以必须用 3 辆。',
      '2 × 24 = 48 < 63',
      rows(['3 大', '2 大 1 小', '1 大 2 小'], ['72 座', '64 座', '56 座，不够'], 1),
    ),
    frame(
      '只比较可行方案的费用',
      '座位不够的方案，再便宜也不能选。',
      '3 大 540 元；2 大 1 小 500 元',
      rows(['3 大', '2 大 1 小', '3 小'], ['540 元，可行', '500 元，可行', '48 座，不够'], 1),
    ),
    frame(
      '选够坐且最省的方案',
      '2 辆大车和 1 辆小车，共 64 座，500 元。',
      '2 × 180 + 140 = 500 元',
      bars(
        [
          { label: '48 座', weight: 48 },
          { label: '16 座', weight: 16, tone: 'focus' },
        ],
        '共 64 座，能坐下 63 人',
      ),
    ),
  ],
  '便宜但座位不够的方案能选吗？',
  '能，先选最便宜',
  '不能，先满足人数和车辆限制',
  '先筛可行方案，再在可行方案里比较费用。',
);

methodStories['u5-place'] = story(
  '8 个千万和 6 个万，为什么写成 80060000？',
  [
    frame(
      '先把位置摆出来',
      '8 放在千万位，6 放在万位，没数的位先留着。',
      '8 × 10000000 + 6 × 10000',
      place('80060000', 0),
    ),
    frame(
      '每个数位都要占一个位置',
      '中间空位用 0 占住，6 不能向左或向右移。',
      '8006｜0000',
      place('80060000', 3),
    ),
    frame(
      '按计数单位回读',
      '数字 6 在万位，表示 6 个一万。',
      '80000000 + 60000 = 80060000',
      rows(['8 在千万位', '6 在万位'], ['80000000', '60000'], 1),
    ),
  ],
  '这里的数字 6 表示什么？',
  '6 个一',
  '6 个万',
  '同一个数字换了位置，它表示的大小也会改变。',
);
methodStories['u5-reading'] = story(
  '“六千零三万零八”，为什么需要这么多 0？',
  [
    frame(
      '先把万级和个级分开',
      '六千零三万，万级是 6003；零八，个级是 0008。',
      '万级 6003｜个级 0008',
      [
        rect(24, 65, 172, 90, 'known', '6003'),
        rect(204, 65, 172, 90, 'focus', '0008'),
        text(110, 205, '万级'),
        text(290, 205, '个级'),
      ],
    ),
    frame(
      '每一级保留四个位置',
      '个级里的 8 必须在个位，前面三个位置都用 0 占住。',
      '6003｜0008',
      place('60030008', 7),
    ),
    frame(
      '合起来，再分级读回去',
      '读出来的零不等于写出来的零的个数。',
      '60030008',
      cards(['6003 万', '8 个一', '六千零三万零八'], 2),
    ),
  ],
  '只听见一个“零”，就只写一个 0 吗？',
  '是',
  '不是，要按数位占位',
  '读法可以把连续的零合读，写数时每个空位仍要保留。',
);
methodStories['u5-compare'] = story(
  '0、0、3、5、7、8 组成最大、最小六位数。',
  [
    frame(
      '最大数把大的数字放高位',
      '高位先决定数的大小。',
      '8 > 7 > 5 > 3 > 0 > 0',
      place('875300', 0),
    ),
    frame(
      '最小数的首位不能放 0',
      '先放最小的非零数字 3，然后把 0 放低一位。',
      '首位 3，接着 0、0',
      place('300578', 0),
    ),
    frame(
      '从左往右逐位核对',
      '每个数字只使用一次，而且必须保持六位。',
      '最大 875300；最小 300578',
      rows(['最大六位数', '最小六位数'], ['875300', '300578'], 1),
    ),
  ],
  '最小六位数可以从 0 开头吗？',
  '可以，0 最小',
  '不可以，会失去六位数的首位',
  '最高位必须非零，之后才把 0 尽量排在前面。',
);
methodStories['u5-rewrite'] = story(
  '4200000 精确改写成以“万”为单位的数。',
  [
    frame(
      '每一万打成一包',
      '改变的是计数单位，原数大小不变。',
      '1 万 = 10000',
      cards(['每包 10000', '一共有多少包？'], 0),
    ),
    frame('数一数有几个一万', '4200000 里有 420 个一万。', '4200000 ÷ 10000 = 420', [
      rect(24, 65, 172, 90, 'focus', '420'),
      rect(204, 65, 172, 90, 'known', '0000'),
      text(200, 206, '420 个一万'),
    ]),
    frame(
      '写上新单位，再还原检查',
      '数值变成 420，单位必须写“万”。',
      '420 万 = 4200000',
      cards(['4200000', '420 万', '420 × 10000'], 1),
    ),
  ],
  '4200000 改写成万，能只写 420 吗？',
  '能',
  '不能，要写 420 万',
  '数值与单位一起才表示原来的大小。',
);
methodStories['u5-rounding'] = story(
  '7365000 四舍五入到万位，为什么要进 1？',
  [
    frame(
      '先找到保留的万位',
      '万位右边的第一位是千位，检查它决定进舍。',
      '736｜5000',
      place('7365000', 2),
    ),
    frame('千位是 5，向上进一万', '5000 正好走到两个整万数的中点。', '7365000 ≈ 737 万', [
      line(40, 130, 360, 130),
      ...[40, 200, 360].map(
        (x) => ({ kind: 'dot', x, y: 130, tone: x === 200 ? 'focus' : 'known' }) as MethodNode,
      ),
      text(60, 180, '736万', 'known', 20),
      text(200, 83, '7365000', 'focus'),
      text(340, 180, '737万', 'known', 20),
    ]),
    frame(
      '范围的两端要分别检查',
      '从 7365000 到 7374999，四舍五入都约为 737 万。',
      '7365000 ≤ 原数 ≤ 7374999',
      bars([{ label: '7365000 ～ 7374999', weight: 1, tone: 'focus' }], '都是约 737 万'),
    ),
  ],
  '近似数与原数之间通常用什么符号？',
  '=',
  '≈',
  '四舍五入改变了精确数值，要用约等号表示。',
);
methodStories['u5-codes'] = story(
  '年份 4 位｜书架 2 位｜序号 3 位，怎样编码？',
  [
    frame('每一段先定好长度', '年份 2028，书架 3，书序号 7。', '4 位｜2 位｜3 位', [
      rect(20, 75, 160, 75, 'known', '2028'),
      rect(190, 75, 74, 75, 'warm', '3'),
      rect(274, 75, 106, 75, 'focus', '7'),
    ]),
    frame('不够位数，用 0 补在前面', '03 表示 3 号书架；007 表示第 7 本。', '2028｜03｜007', [
      rect(20, 75, 160, 75, 'known', '2028'),
      rect(190, 75, 74, 75, 'warm', '03'),
      rect(274, 75, 106, 75, 'focus', '007'),
    ]),
    frame(
      '按同一套规则拆回去',
      '编码表达的是约定信息，不是求一个数的大小。',
      '202803007',
      cards(['2028 年', '03 号书架', '007 号书'], 2),
    ),
  ],
  '编码开头或中间补的 0 能随意删掉吗？',
  '能，大小没有变',
  '不能，会破坏分段规则',
  '编码要按固定长度读信息，和普通整数写法不同。',
);

methodStories['u6-written'] = story(
  '213 × 24，第二行为什么要向左对齐一位？',
  [
    frame(
      '把 24 拆成 20 和 4',
      '同一个 213，分别取 20 份和 4 份。',
      '213 × 24 = 213 × 20 + 213 × 4',
      multiplication(213, 2, 4, 0),
    ),
    frame(
      '十位的 2，代表 20 份',
      '第二行不是 426 个一，而是 426 个十。',
      '213 × 20 = 4260',
      multiplication(213, 2, 4, 1),
    ),
    frame(
      '把两块部分积拼起来',
      '每一块都算全，再按相同数位相加。',
      '4260 + 852 = 5112',
      rows(['个位部分积', '十位部分积', '完整积'], ['852', '4260', '5112'], 2),
    ),
  ],
  '213 × 24 的第二个部分积是多少？',
  '213 × 2 = 426',
  '213 × 20 = 4260',
  '2 在十位，表示 20。漏掉一个数位，部分积会缩小 10 倍。',
  multiplication(213, 2, 4, 1, true),
);
methodStories['u6-zero'] = story(
  '204 × 30 和 320 × 40，哪些 0 能先放一旁？',
  [
    frame(
      '中间的 0 占住数位',
      '204 是 2 个百和 4 个一，不能改写成 24。',
      '204 = 200 + 4',
      place('204', 1),
    ),
    frame(
      '把末尾的 0 变成乘 10',
      '30 是 3 × 10，先算 204 × 3，再乘 10。',
      '204 × 30 = 612 × 10 = 6120',
      cards(['204 × 3 = 612', '再乘 10', '6120'], 2),
    ),
    frame(
      '两边末尾的 0，都要计入',
      '320 = 32 × 10；40 = 4 × 10。',
      '320 × 40 = 128 × 100 = 12800',
      cards(['32 × 4 = 128', '10 × 10 = 100', '128 × 100 = 12800'], 2),
    ),
  ],
  '204 能去掉中间的 0 变成 24 吗？',
  '能，最后补回来',
  '不能，它是数位占位零',
  '删掉中间的 0，百位的 2 会变成十位，数的大小改变了。',
);
methodStories['u6-tools'] = story(
  '306 × 24 = 7344，计算器结果怎样核对？',
  [
    frame(
      '先估大小，拦住明显错误',
      '300 × 24 = 7200，结果应该在它附近。',
      '306 × 24 比 7200 稍大',
      bars(
        [
          { label: '300 × 24 = 7200', weight: 300 },
          { label: '+6×24', weight: 6, tone: 'focus' },
        ],
        '306 = 300 + 6',
      ),
    ),
    frame(
      '再用另一条计算路线',
      '分成 20 份和 4 份，独立复算。',
      '306 × 20 = 6120；306 × 4 = 1224',
      multiplication(306, 2, 4, 1),
    ),
    frame(
      '精确值一致才算通过',
      '估算接近只是线索，分解计算才核对到个位。',
      '6120 + 1224 = 7344',
      rows(['估算', '精确核对'], ['约 7200', '7344'], 1),
    ),
  ],
  '接近估算值，能证明一定算对吗？',
  '能',
  '不能，还要精确复核',
  '输入错一位也可能得到相近结果，估算只能筛查明显错误。',
);
methodStories['u6-patterns'] = story(
  '11 × 11，111 × 111，下一次会出现什么？',
  [
    frame(
      '先观察已算出的例子',
      '位数增加，结果看起来先升后降。',
      '11 × 11 = 121；111 × 111 = 12321',
      cards(['1 2 1', '1 2 3 2 1'], 1),
    ),
    frame(
      '猜一个新例子，再实际计算',
      '猜想必须经过独立计算的检验。',
      '1111 × 1111 = 1234321',
      cards(['猜：1 2 3 4 3 2 1', '验：1111 × 1111', '结果：1234321'], 2),
    ),
    frame(
      '别把几个例子当作所有情况',
      '位数继续增加可能进位，不能无限照抄数字。',
      '新例子支持猜想，不等于证明',
      cards(['观察 → 猜想', '计算新例子', '继续检查适用范围'], 2),
    ),
  ],
  '算对三个例子，就能无限照抄规律吗？',
  '能',
  '不能，还要检查进位与适用范围',
  '十进制中的进位可能改变表面规律。',
);
methodStories['u6-error'] = story(
  '204 × 32，错算成 204 × 2 + 204 × 3，少算多少？',
  [
    frame(
      '把正确的两块部分积画出来',
      '32 是 30 加 2，十位部分应是 30 份。',
      '204 × 30 + 204 × 2 = 6528',
      multiplication(204, 3, 2, 1),
    ),
    frame(
      '错误把 30 份看成了 3 份',
      '个位的 2 份没错，第二块少了 27 份。',
      '30 − 3 = 27 份',
      multiplication(204, 3, 2, 1, true),
    ),
    frame(
      '只算漏掉的这一块',
      '少算的不是 27，而是 27 个 204。',
      '204 × 27 = 5508',
      bars(
        [
          { label: '错算 1020', weight: 1020 },
          { label: '漏掉 5508', weight: 5508, tone: 'error' },
        ],
        '正确积 6528',
      ),
    ),
  ],
  '少算的部分是什么？',
  '204 × (3 − 2)',
  '204 × (30 − 3)',
  '十位本应乘 30，却只乘了 3，漏掉 27 份。',
);
methodStories['u6-application'] = story(
  '每件 198 元，买 35 件，7000 元还剩多少？',
  [
    frame(
      '总价是每件价乘件数',
      '还剩多少，要先知道买东西共花多少。',
      '198 × 35',
      cards(['每件 198 元', '买 35 件', '先求总价'], 2),
    ),
    frame(
      '借整百数计算，再退回多算的',
      '每件当作 200 元，每件多算了 2 元。',
      '200 × 35 − 2 × 35 = 6930 元',
      bars(
        [
          { label: '实际 6930', weight: 6930 },
          { label: '多 70', weight: 70, tone: 'warm' },
        ],
        '先按 7000 元估算',
      ),
    ),
    frame(
      '从预算里减去实际花费',
      '7000 元分成已花的 6930 元和剩下的 70 元。',
      '7000 − 6930 = 70 元',
      rows(['预算', '实际总价', '剩余'], ['7000 元', '6930 元', '70 元'], 2),
    ),
  ],
  '按每件 200 元算完，要怎样修正？',
  '只减去 2 元',
  '减去 35 个 2 元',
  '35 件，每件都多算了 2 元，总共多算 70 元。',
);

const sameQuantity = story(
  '24 个圆点，每 24 个分成一份，能分成几份？',
  [
    frame(
      '总数和每份量一样大',
      '这里总共 24 个，每一份也要 24 个。先把这两个量对应起来。',
      '总数 24；每份 24',
      [
        text(200, 27, '每一个圆点表示 1 个', 'known', 21),
        ...Array.from(
          { length: 24 },
          (_, i): MethodNode => ({
            kind: 'dot',
            x: 54 + (i % 6) * 57,
            y: 58 + Math.floor(i / 6) * 39,
            tone: 'known',
          }),
        ),
      ],
    ),
    frame(
      '把全部圆点圈成一份',
      '24 个正好圈满一份，外面没有剩下的圆点。这里每份量大于 0，分组才有意义。',
      '1 份 × 每份 24 = 总数 24',
      [
        rect(28, 36, 340, 157, 'focus'),
        ...Array.from(
          { length: 24 },
          (_, i): MethodNode => ({
            kind: 'dot',
            x: 54 + (i % 6) * 57,
            y: 58 + Math.floor(i / 6) * 39,
            tone: 'focus',
          }),
        ),
        text(200, 233, '正好 1 份，没有余下', 'focus', 22),
      ],
    ),
    frame(
      '商数的是份数，不是圆点个数',
      '商表示“这样的完整份有几份”。总数和每份量相同且不为 0，就正好只有一份。',
      '24 ÷ 24 = 1，余数 0',
      grouping(1, 24, 0, true),
    ),
  ],
  '36 个，每 36 个一份，商表示什么？',
  '36 个圆点，所以商是 36',
  '能分成 1 份，所以商是 1',
  '商数完整的份数。36 个圆点只够组成一份每份 36 个的整体，不能把圆点个数直接当份数。',
  grouping(1, 36, 0),
);
sameQuantity.transfer = {
  question: '换一组数：45 个，每份 45 个，分成几份？',
  wrong: '45 份',
  right: '1 份',
  why: '全部 45 个放进同一份，正好用完。总量和每份量同样大，完整份数仍是 1。',
  nodes: grouping(1, 45, 0),
};

const largestRemainder = story(
  '除数是 14，商是 7，余数最大时，原来有多少个？',
  [
    frame(
      '剩下 14 个，就还能再分一份',
      '每份要 14 个，剩下的 14 个可以直接圈成一份。商就要增加，不能把它当最后的余数。',
      '余数必须小于 14',
      regroupRemainder(14, 14, true),
    ),
    frame(
      '少 1 个，就刚好不够一份',
      '14 减 1 得 13。剩下 13 个不能凑够每份的 14 个，所以最大余数是 13。',
      '最大余数 = 14 − 1 = 13',
      grouping(7, 14, 13),
    ),
    frame(
      '把整份和最大余数合起来',
      '7 份共 98 个，再把剩下的 13 个接回去，得到原来的总量。商固定不变时，余数越大，总量越大。',
      '14 × 7 + 13 = 111',
      bars(
        [
          { label: '7 份，共 98', weight: 98 },
          { label: '剩 13', weight: 13, tone: 'warm' },
        ],
        '最多共 111 个',
      ),
    ),
  ],
  '除数是 14，余数能取 14 吗？',
  '能，和除数一样大',
  '不能，最多是 13',
  '余下 14 个会再组成一份，商必须增加。余数是整数且不足一份，因此最大是 13。',
  regroupRemainder(14, 14, true),
);
largestRemainder.transfer = {
  question: '换一组数：除数 16，商 4，余数最大时总数是多少？',
  wrong: '64：只算 16 × 4',
  right: '79：16 × 4 + 15',
  why: '余数最大是 15。四个完整份共 64，加上这 15 个，原来的总数是 79。',
  nodes: grouping(4, 16, 15),
};

const verifyDivision = story(
  '有人写 229 ÷ 17 = 13……7，怎样验算这个结果？',
  [
    frame(
      '先把商对应的完整份合起来',
      '13 份，每份 17 个，共 221 个。乘回去只能得到完整份，还不能代表全部总数。',
      '17 × 13 = 221',
      grouping(13, 17, 7),
    ),
    frame(
      '加上写出的余数，比较原数',
      '221 加 7 是 228，比原来的 229 少 1。虽然 7 小于除数，合回去的总数却不对，所以这个结果仍然错了。',
      '17 × 13 + 7 = 228 ≠ 229',
      bars(
        [
          { label: '完整份 221', weight: 221 },
          { label: '错写余 7', weight: 7, tone: 'error' },
          { label: '还少 1', weight: 1, tone: 'warm' },
        ],
        '原来 229 个',
      ),
    ),
    frame(
      '同时检查总数和余数范围',
      '229 减 221 剩 8。合起来等于原数，而且 8 小于 17，这两项都通过才算验算成功。',
      '17 × 13 + 8 = 229；8 < 17',
      grouping(13, 17, 8),
    ),
  ],
  '验算有余数除法，乘回去以后还要做什么？',
  '只要乘积不超过原数就可以',
  '加余数核对原数，再检查余数小于除数',
  '乘积只对应完整的份，余数也属于原总量。合计要等于原数，而且余数必须不足一份，两个条件缺一不可。',
);
verifyDivision.transfer = {
  question: '换一组数：145 ÷ 12 = 12……1，哪种核对完整？',
  wrong: '12 × 12 = 144，就算通过',
  right: '12 × 12 + 1 = 145，且 1 < 12',
  why: '把完整份与余下的合起来等于 145，再确认 1 不足每份 12，这才完整检查了分组结果。',
  nodes: grouping(12, 12, 1),
};

const findDivisor = story(
  '185 个分成 7 份后剩 10 个，每份有多少个？',
  [
    frame(
      '把剩下的和完整份分开',
      '原来的 185 个包含完整的 7 份和剩下的 10 个。余数没有放进完整份里。',
      '185 = 7 个完整份 + 10',
      bars(
        [
          { label: '7 份，尚不知道每份', weight: 175 },
          { label: '剩 10', weight: 10, tone: 'warm' },
        ],
        '原来 185 个',
      ),
    ),
    frame(
      '先取走没有分进整份的部分',
      '减去剩下的 10 个，175 个才是平均装进 7 份里的总量。',
      '185 − 10 = 175',
      bars([{ label: '7 份共有 175', weight: 175, tone: 'focus' }], '只看完整的 7 份'),
    ),
    frame(
      '用整份总量平均分，再验算',
      '175 平均分成 7 份，每份 25 个；10 比每份 25 少，结果符合余数的要求。',
      '(185 − 10) ÷ 7 = 25；25 × 7 + 10 = 185',
      grouping(7, 25, 10),
    ),
  ],
  '求每份量，185 能直接除以 7 吗？',
  '能，余数不用管',
  '不能，先减去剩下的 10',
  '185 中有 10 个不属于这 7 个完整份。先拿走余数，再把完整份的总量平均分。',
);

/** Content editors assign stable IDs explicitly; no runtime keyword classification or answer access. */
export const methodQuestionSubskills: Record<string, Record<string, string>> = {
  'u1-remainder': {
    'full-p11-s2-q2': 'same-quantity',
    'full-p06-s2-q7': 'largest-remainder',
    'full-p09-s1-q6': 'largest-remainder',
    'full-p11-s1-q7': 'largest-remainder',
    'full-p13-s2-q11': 'largest-remainder',
    'full-p14-s1-q6': 'largest-remainder',
    'full-p17-s3-q4': 'largest-remainder',
    'full-p11-s2-q3': 'verify-division',
    'full-p11-s2-q5': 'verify-division',
    'full-p18-q11': 'verify-division',
    'full-p06-s3-q3': 'verify-division',
    'full-p09-s2-q5': 'verify-division',
    'full-p13-s2-q7': 'verify-division',
    'full-p04-s3-q1': 'find-divisor',
    'full-p09-s2-q1': 'find-divisor',
  },
};
export const methodSubskillStories: Record<string, MethodStory> = {
  'same-quantity': sameQuantity,
  'largest-remainder': largestRemainder,
  'verify-division': verifyDivision,
  'find-divisor': findDivisor,
};

export function methodStory(topicId: string, questionId?: string): MethodStory | undefined {
  const subskill = questionId && methodQuestionSubskills[topicId]?.[questionId];
  return (subskill && methodSubskillStories[subskill]) || methodStories[topicId];
}
