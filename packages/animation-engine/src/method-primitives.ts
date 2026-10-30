/** Pure geometry builders; all coordinates use the shared 400 × 250 drawing space. */
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

export interface MethodCheck {
  question: string;
  wrong: string;
  right: string;
  why: string;
  /** A mathematically valid model used to explain the right reasoning. */
  nodes: MethodNode[];
  /** Optional explicitly wrong model, highlighted only as an error demonstration. */
  wrongNodes?: MethodNode[];
}
export interface MethodStory {
  prompt: string;
  frames: MethodFrame[];
  mistake: MethodCheck;
  transfer?: MethodCheck;
}

export const text = (
  x: number,
  y: number,
  value: string,
  tone: MethodTone = 'quiet',
  size = 22,
): MethodNode => ({ kind: 'text', x, y, text: value, tone, size });

export const rect = (
  x: number,
  y: number,
  w: number,
  h: number,
  tone: MethodTone,
  label?: string,
  dashed = false,
): MethodNode => ({ kind: 'rect', x, y, w, h, tone, label, dashed });

export const line = (
  x: number,
  y: number,
  x2: number,
  y2: number,
  tone: MethodTone = 'quiet',
  dashed = false,
): MethodNode => ({ kind: 'line', x, y, x2, y2, tone, dashed });

export const frame = (
  title: string,
  why: string,
  equation: string,
  nodes: MethodNode[],
): MethodFrame => ({
  title,
  why,
  equation,
  nodes,
});

export const bars = (
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

export const grid = (
  cols: number,
  rows: number,
  filled = rows * cols,
  edge = false,
): MethodNode[] => {
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

export const cards = (labels: string[], active = labels.length - 1): MethodNode[] =>
  labels.flatMap((label, i) => [
    rect(32, 20 + i * 72, 336, 56, i === active ? 'focus' : 'known', label),
    ...(i < labels.length - 1 ? [line(200, 76 + i * 72, 200, 92 + i * 72)] : []),
  ]);

export const rows = (labels: string[], values: string[], active: number): MethodNode[] =>
  labels.flatMap((label, i) => [
    text(82, 48 + i * 55, label, 'quiet', 20),
    rect(148, 18 + i * 55, 230, 44, i === active ? 'focus' : 'known', values[i]),
  ]);

export const place = (
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

export const rectangle = (
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

export const division = (n: number, d: number, stage: number): MethodNode[] => {
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

export const grouping = (
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

export const regroupRemainder = (each: number, left: number, regrouped: boolean): MethodNode[] => [
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

export const equalGroups = (
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

export const operationTree = (stage: number, bracket = false): MethodNode[] => {
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

export const fenceModel = (
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

export const multiplication = (
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

export const story = (
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
