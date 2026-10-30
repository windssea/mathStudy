import {
  text,
  rect,
  line,
  frame,
  bars,
  grouping,
  regroupRemainder,
  fenceModel,
  story,
  type MethodNode,
  type MethodTone,
  type MethodFrame,
  type MethodStory,
} from './method-primitives';

export const unit12Stories: Record<string, MethodStory> = {};
type Check = MethodStory['mistake'] & { wrongNodes: MethodNode[] };
function teach(id: string, prompt: string, frames: MethodFrame[], mistake: Check, transfer: Check) {
  unit12Stories[id] = { prompt, frames, mistake, transfer };
}
const dot = (x: number, y: number, tone: MethodTone = 'known'): MethodNode => ({
  kind: 'dot',
  x,
  y,
  tone,
});
const note = (nodes: MethodNode[], value: string, tone: MethodTone = 'error'): MethodNode[] => [
  ...nodes.filter((node) => node.kind !== 'text' || node.y < 230),
  text(200, 240, value, tone, 20),
];
const errorOn = (nodes: MethodNode[], selected: (node: MethodNode) => boolean): MethodNode[] =>
  nodes.map((node) => (selected(node) ? { ...node, tone: 'error' } : node));

/** Each outlined packet is one complete group; the loose dots are still ungrouped. */
function packets(
  count: number,
  each: number,
  remainder = 0,
  tone: MethodTone = 'known',
): MethodNode[] {
  const cols = count > 14 ? 8 : 7;
  const w = count > 14 ? 40 : 46;
  const pitch = count > 14 ? 44 : 51;
  return [
    text(200, 26, `${count}份，每份${each}`, tone, 22),
    ...Array.from({ length: count }, (_, i) =>
      rect(24 + (i % cols) * pitch, 43 + Math.floor(i / cols) * 55, w, 45, tone),
    ),
    ...Array.from({ length: remainder }, (_, i) =>
      dot(40 + (i % 11) * 30, 178 + Math.floor(i / 11) * 19, 'warm'),
    ),
    text(200, 240, `整份${count * each}；余${remainder}`, tone, 22),
  ];
}

/** Circles denote actual objects, not a decorative area or a proportional picture. */
function tensGroups(count: number, each: number, grouped = true): MethodNode[] {
  if (!grouped)
    return [
      rect(28, 40, 344, 176, 'quiet'),
      ...Array.from({ length: count * each }, (_, i) =>
        dot(58 + (i % 9) * 35, 60 + Math.floor(i / 9) * 22),
      ),
      text(200, 241, '每点表示1个十', 'known', 20),
    ];
  const cols = count > 7 ? 3 : 4;
  const width = count > 7 ? 106 : 82;
  const height = count > 7 ? 58 : 81;
  const pitchX = count > 7 ? 120 : 95;
  const pitchY = count > 7 ? 67 : 98;
  return Array.from({ length: count }, (_, i) => {
    const x = 12 + (i % cols) * pitchX,
      y = 28 + Math.floor(i / cols) * pitchY;
    const dotCols = width >= 100 ? 4 : 3;
    return [
      rect(x, y, width, height, 'focus'),
      ...Array.from({ length: each }, (_, j) =>
        dot(x + 17 + (j % dotCols) * 22, y + 14 + Math.floor(j / dotCols) * 20, 'focus'),
      ),
    ];
  })
    .flat()
    .concat(text(200, 243, `每圈${each}个十，共${count}圈`, 'focus', 20));
}

function arrayCells(
  cols: number,
  rows: number,
  active: (i: number) => boolean = () => true,
  cellSize?: number,
): MethodNode[] {
  const cell = cellSize ?? Math.min(280 / cols, 140 / rows);
  const x = (400 - cols * cell) / 2,
    y = 50;
  return Array.from({ length: cols * rows }, (_, i) =>
    rect(
      x + (i % cols) * cell,
      y + Math.floor(i / cols) * cell,
      cell,
      cell,
      active(i) ? 'focus' : 'quiet',
    ),
  );
}
function surface(a: number, b: number, mode: 'area' | 'boundary' | 'row' = 'area'): MethodNode[] {
  const cell = Math.min(280 / a, 140 / b),
    x = (400 - a * cell) / 2,
    y = 50;
  return [
    ...arrayCells(a, b, (i) => mode === 'area' || (mode === 'row' && i < a)),
    ...[
      [x, y, x + a * cell, y],
      [x + a * cell, y, x + a * cell, y + b * cell],
      [x + a * cell, y + b * cell, x, y + b * cell],
      [x, y + b * cell, x, y],
    ].map(([x1, y1, x2, y2]) => line(x1, y1, x2, y2, mode === 'boundary' ? 'focus' : 'known')),
    text(200, 27, `${a}厘米`, 'known', 20),
    text(
      200,
      224,
      mode === 'boundary' ? '只沿外边走一圈' : `${b}行，每行${a}格`,
      mode === 'boundary' ? 'focus' : 'known',
      22,
    ),
    text(28, 126, String(b), 'known', 22),
  ];
}

/** The boxes are large groups; the inner cells are the groups after the second split. */
function nestedGroups(big: number, small: number, stage: number, each: number): MethodNode[] {
  const cols = big > 6 ? 4 : 3,
    width = big > 6 ? 84 : 108,
    pitch = big > 6 ? 96 : 124;
  return Array.from({ length: big }, (_, i) => {
    const x = 12 + (i % cols) * pitch,
      y = 35 + Math.floor(i / cols) * 97;
    const show = stage > 1 || (stage === 1 && i === 0);
    return [
      rect(x, y, width, 84, show ? 'known' : 'quiet', show ? undefined : String(small * each)),
      ...(show
        ? Array.from({ length: small }, (_, j) =>
            rect(
              x + 9 + ((j % 2) * (width - 18)) / 2,
              y + 8 + Math.floor(j / 2) * 24,
              (width - 18) / 2 - 2,
              22,
              stage > 1 ? 'focus' : 'known',
            ),
          )
        : []),
    ];
  })
    .flat()
    .concat(
      text(200, 243, stage > 0 ? `每格${each}；共${big * small}格` : `先分${big}大组`, 'focus', 20),
    );
}

function shelves(
  count: number,
  layers: number,
  each: number,
  stage = 2,
  tone: MethodTone = 'known',
): MethodNode[] {
  const width = 350 / count,
    x0 = 25;
  return Array.from({ length: count }, (_, i) => {
    const x = x0 + i * width;
    return [
      text(x + (width - 12) / 2, 28, `书架${i + 1}`, 'quiet', 18),
      rect(
        x,
        44,
        width - 12,
        150,
        'quiet',
        stage === 0 || (stage === 1 && i > 0) ? String(layers * each) : undefined,
      ),
      ...(stage === 0 || (stage === 1 && i > 0)
        ? []
        : Array.from({ length: layers }, (_, j) =>
            rect(x + 5, 49 + (j * 140) / layers, width - 22, 140 / layers, tone, undefined),
          )),
    ];
  })
    .flat()
    .concat(
      text(
        200,
        238,
        stage === 0 ? `每架${layers * each}本` : `每层${each}；共${count * layers}层`,
        tone,
        22,
      ),
    );
}

function overfilledShelves(count: number, layers: number, each: number): MethodNode[] {
  const width = 350 / count;
  return note(
    [
      ...shelves(count, layers, each, 0).map((node) =>
        node.kind === 'rect' ? { ...node, label: undefined } : node,
      ),
      ...Array.from({ length: count }, (_, i) =>
        Array.from({ length: layers }, (_, j) =>
          Array.from({ length: count }, (_, k) =>
            rect(
              30 + i * width + (k * (width - 22)) / count,
              49 + (j * 140) / layers,
              (width - 22) / count - 2,
              140 / layers,
              'error',
            ),
          ),
        ),
      ).flat(2),
    ],
    `× 每层误放${count}份${each}`,
  );
}
function busSeats(full: number, left: number, extra: boolean, seats = 24): MethodNode[] {
  const passengers = full * seats + left;
  const boxes = full + (extra ? 1 : 0);
  const slot = (i: number) => ({ x: 8 + (i % 4) * 97, y: 30 + Math.floor(i / 4) * 110 });
  return [
    ...Array.from({ length: boxes }, (_, i) => {
      const p = slot(i);
      return rect(p.x, p.y, 88, 80, i === full ? 'focus' : 'known');
    }),
    ...Array.from({ length: passengers }, (_, i) => {
      const group = Math.floor(i / seats),
        n = i % seats,
        p = slot(group);
      return dot(
        p.x + 12 + (n % 6) * 12,
        p.y + 14 + Math.floor(n / 6) * 17,
        group < full ? 'known' : extra ? 'focus' : 'error',
      );
    }),
    text(
      200,
      243,
      left ? (extra ? '剩下的人，也有一辆车' : `${left}人还在车外`) : '没有余人，不用再加车',
      left && !extra ? 'error' : 'focus',
      20,
    ),
  ];
}
function cuts(parts: number, each: number, stage = 1, wrong = false): MethodNode[] {
  const step = 352 / parts;
  return [
    ...Array.from({ length: parts }, (_, i) =>
      rect(
        24 + i * step + (stage > 1 ? 2 : 0),
        89,
        step - (stage > 1 ? 4 : 1),
        54,
        stage > 1 ? 'focus' : 'known',
        undefined,
      ),
    ),
    ...Array.from({ length: parts - 1 }, (_, i) =>
      line(24 + (i + 1) * step, 67, 24 + (i + 1) * step, 163, 'focus'),
    ),
    ...(wrong ? [line(376, 67, 376, 163, 'error')] : []),
    dot(24, 116, wrong ? 'known' : 'warm'),
    dot(376, 116, wrong ? 'error' : 'warm'),
    text(200, 213, wrong ? '× 多锯原端点' : '原来两端不用锯', wrong ? 'error' : 'known', 20),
    text(200, 34, `每段${each}厘米`, 'known', 20),
  ];
}
function doubles(count: number, layers: number, tone: MethodTone = 'known'): MethodNode[] {
  const cols = 6,
    rows = Math.ceil(count / cols),
    pitchY = rows > 2 ? 48 : 83;
  return Array.from({ length: count }, (_, i) => {
    const x = 18 + (i % cols) * 61,
      y = 36 + Math.floor(i / cols) * pitchY;
    return [
      rect(x, y, 48, layers === 2 ? 66 : 38, 'quiet'),
      ...Array.from({ length: layers }, (_, j) => rect(x + 3, y + 3 + j * 30, 42, 28, tone)),
    ];
  })
    .flat()
    .concat(
      text(200, 22, '每个小块表示35', 'known', 20),
      text(200, 243, `${count}份，每份${layers * 35}`, tone, 22),
    );
}
function hourBoxes(hours: number, focus = false): MethodNode[] {
  return Array.from({ length: hours }, (_, i) => [
    rect(17 + i * 52, 48, 46, 140, 'known'),
    ...Array.from({ length: 6 }, (_, j) =>
      rect(20 + i * 52, 52 + j * 22, 40, 19, focus ? 'focus' : 'known'),
    ),
  ])
    .flat()
    .concat(
      text(200, 27, '每盒1时，每小段10分', 'known', 20),
      text(200, 231, `${hours}盒，共${hours * 60}分`, focus ? 'focus' : 'known', 22),
    );
}
function smallAreaUnits(whole: number, rest: number): MethodNode[] {
  return [
    ...Array.from({ length: whole }, (_, i) =>
      Array.from({ length: 100 }, (_, j) =>
        rect(20 + i * 125 + (j % 10) * 10, 42 + Math.floor(j / 10) * 10, 10, 10, 'known'),
      ),
    ).flat(),
    ...Array.from({ length: rest }, (_, j) =>
      rect(150 + (j % 10) * 10, 171 + Math.floor(j / 10) * 10, 10, 10, 'focus'),
    ),
    text(200, 26, `${whole}个大单位 = ${whole * 100}小格`, 'known', 21),
    text(200, 242, `再加${rest}小格，共${whole * 100 + rest}`, 'focus', 21),
  ];
}
function cutCorner(a: number, b: number, c: number, d: number, stage: number): MethodNode[] {
  const s = Math.min(280 / a, 140 / b),
    x = (400 - a * s) / 2,
    y = 50;
  const x1 = x + (a - c) * s,
    right = x + a * s,
    y1 = y + d * s,
    bottom = y + b * s;
  const nodes = Array.from({ length: a * b }, (_, i) => ({
    i,
    removed: i % a >= a - c && Math.floor(i / a) < d,
  }))
    .filter(({ removed }) => stage === 0 || !removed)
    .map(({ i, removed }) =>
      rect(x + (i % a) * s, y + Math.floor(i / a) * s, s, s, removed ? 'error' : 'known'),
    );
  const outline = [
    [x, y, x1, y],
    [x1, y, x1, y1],
    [x1, y1, right, y1],
    [right, y1, right, bottom],
    [right, bottom, x, bottom],
    [x, bottom, x, y],
  ];
  return [
    ...nodes,
    ...outline
      .filter((_, i) => stage !== 3 || (i !== 1 && i !== 2))
      .map(([a1, b1, a2, b2], i) => line(a1, b1, a2, b2, i === 1 || i === 2 ? 'focus' : 'known')),
    ...(stage === 0 || stage >= 2
      ? [line(x1, y, right, y, 'error', true), line(right, y, right, y1, 'error', true)]
      : []),
    text(200, 26, `${a}×${b}，角上剪${c}×${d}`, 'known', 20),
    text(
      200,
      234,
      stage === 3
        ? '× 只减旧边，忘了新边'
        : stage >= 2
          ? `少${c}+${d}，也多${c}+${d}`
          : `留下${a * b - c * d}格`,
      stage === 3 ? 'error' : 'focus',
      21,
    ),
  ];
}
function notch(a: number, b: number, cut: number, depth: number, wrong = false): MethodNode[] {
  const s = 22,
    x = (400 - a * s) / 2,
    y = 47,
    start = (a - cut) / 2;
  const nodes = Array.from({ length: a * b }, (_, i) => i)
    .filter((i) => !(i % a >= start && i % a < start + cut && Math.floor(i / a) < depth))
    .map((i) => rect(x + (i % a) * s, y + Math.floor(i / a) * s, s, s, 'known'));
  const points = wrong
    ? [
        [x, y],
        [x + a * s, y],
        [x + a * s, y + b * s],
        [x, y + b * s],
        [x, y],
      ]
    : [
        [x, y],
        [x + start * s, y],
        [x + start * s, y + depth * s],
        [x + (start + cut) * s, y + depth * s],
        [x + (start + cut) * s, y],
        [x + a * s, y],
        [x + a * s, y + b * s],
        [x, y + b * s],
        [x, y],
      ];
  return [
    ...nodes,
    ...points
      .slice(1)
      .map(([x2, y2], i) =>
        line(
          points[i][0],
          points[i][1],
          x2,
          y2,
          wrong && i === 0 ? 'error' : 'focus',
          wrong && i === 0,
        ),
      ),
    text(200, 26, '上边中间挖缺口', 'known', 20),
    text(
      200,
      233,
      wrong ? '× 漏算缺口深边' : `多出两条${depth}厘米深边`,
      wrong ? 'error' : 'focus',
      19,
    ),
  ];
}
function floorTiles(cols: number, rows: number, activeRow = false): MethodNode[] {
  return Array.from({ length: cols * rows }, (_, i) =>
    rect(
      65 + ((i % cols) * 270) / cols,
      39 + (Math.floor(i / cols) * 180) / rows,
      270 / cols,
      180 / rows,
      !activeRow || i < cols ? 'focus' : 'quiet',
    ),
  ).concat(
    text(200, 24, '长60分米，宽40分米', 'known', 20),
    text(200, 245, `${cols}列 × ${rows}行`, 'focus', 20),
  );
}
function untileable(wrong = false): MethodNode[] {
  return [
    ...(wrong
      ? Array.from({ length: 9 }, (_, i) => rect(56 + i * 32, 60, 32, 72, 'error'))
      : Array.from({ length: 6 }, (_, i) => rect(56 + i * 48, 60, 48, 48, 'known'))),
    ...(wrong ? [] : [rect(56, 108, 288, 24, 'warm')]),
    text(200, 31, '地面12分米×3分米', 'known', 20),
    text(200, 182, wrong ? '× 面积4，形状错了' : '余下宽1分米条带', wrong ? 'error' : 'warm', 19),
    text(
      200,
      229,
      wrong ? '条形小块不是正方形砖' : '面积比9，却铺不满',
      wrong ? 'error' : 'focus',
      20,
    ),
  ];
}
function comparePlots(stage: number, wrong = false): MethodNode[] {
  return [
    ...Array.from({ length: 40 }, (_, i) =>
      rect(20 + (i % 10) * 15, 70 + Math.floor(i / 10) * 15, 15, 15, stage > 0 ? 'known' : 'quiet'),
    ),
    ...Array.from({ length: 49 }, (_, i) =>
      rect(
        250 + (i % 7) * 15,
        47 + Math.floor(i / 7) * 15,
        15,
        15,
        wrong
          ? i < 40
            ? 'known'
            : 'error'
          : stage > 2
            ? i >= 40
              ? 'focus'
              : 'known'
            : stage > 1
              ? 'focus'
              : 'quiet',
      ),
    ),
    text(95, 30, '10×4', 'known', 20),
    text(302, 30, '7×7', 'focus', 20),
    text(95, 184, '40格', 'known', 22),
    text(302, 184, wrong ? '× 也说40格' : '49格', wrong ? 'error' : 'focus', 22),
    text(
      200,
      236,
      wrong ? '右边多出的9格没有被数上' : stage > 2 ? '左边40格，右边还多9格' : '两边周长同为28米',
      wrong ? 'error' : 'known',
      20,
    ),
  ];
}
unit12Stories['u1-remainder'] = story(
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
);

unit12Stories['u2-fence'] = story(
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

unit12Stories['u1-remainder'].transfer = {
  question: '换一组数：203 个，每 16 个一份，怎样才分完？',
  wrong: '12 份，还剩 16 个',
  right: '12 份，还剩 11 个',
  why: '16 × 12 = 192，203 − 192 = 11；11 不够再组成一份。若剩 16 个，还能再分一份，而且总数也不再是 203。',
  nodes: grouping(12, 16, 11),
};

unit12Stories['u2-fence'].transfer = {
  question: '换个靠墙方向：长 10 米、宽 8 米，宽边靠墙，需要围几米？',
  wrong: '26 米：10 + 8 + 8',
  right: '28 米：10 + 10 + 8',
  why: '这次靠墙的是宽边。剩下要围的是两条长、一条宽，所以是 10 + 10 + 8 = 28 米。不能照抄“长加两条宽”。',
  nodes: fenceModel(10, 8, 1, true),
};

teach(
  'u1-mental',
  '630 ÷ 90，为什么可以同时去掉一个0？',
  [
    frame(
      '先用十作为计数单位',
      '每点是一个十。630有63个十，每一份90要9个十。',
      '630个 = 63个十；90个 = 9个十',
      tensGroups(7, 9, false),
    ),
    frame(
      '每9个十圈成一份',
      '63个十正好圈出7份。换计数单位没有增减任何一份。',
      '63 ÷ 9 = 7',
      tensGroups(7, 9),
    ),
    frame('换回原单位，仍然是7份', '每圈9个十就是90。7圈合起来仍是630。', '90 × 7 = 630', [
      ...tensGroups(7, 9),
      text(200, 15, '每圈90，共630', 'known', 20),
    ]),
  ],
  {
    question: '630÷90简算，哪一种变化保留了原来的份数？',
    wrong: '只把630改成63，除数仍是90',
    right: '630和90同时除以10',
    why: '总数和每份量要使用相同的计数单位。只改总数，63连一份90也不够。',
    nodes: tensGroups(7, 9),
    wrongNodes: [
      rect(20, 65, 252, 50, 'known'),
      rect(20, 143, 360, 50, 'error', undefined, true),
      text(200, 43, '总数只剩63', 'known', 22),
      text(200, 126, '每份却仍要90', 'error', 22),
      text(200, 235, '× 63连一份90也不够', 'error', 22),
    ],
  },
  {
    question: '720个，每80个一份，能分成几份？',
    wrong: '72÷80，连1份也不够',
    right: '72个十÷8个十，共9份',
    why: '两边都换成十作单位，72里面有9个8。每份仍相当于原来的80个。',
    nodes: tensGroups(9, 8),
    wrongNodes: [
      rect(20, 65, 324, 50, 'known'),
      rect(20, 143, 360, 50, 'error', undefined, true),
      text(200, 43, '× 总数72，每份80', 'error', 22),
      text(200, 231, '总数变小，每份却没变', 'error', 21),
    ],
  },
);

const writtenGroups = (active: number): MethodNode[] =>
  active > 1
    ? packets(21, 24).map((node, index) =>
        node.kind === 'rect' && index === 21 ? { ...node, tone: 'focus' } : node,
      )
    : [
        rect(24, 45, 166, 114, active === 0 ? 'focus' : 'known'),
        rect(210, 45, 166, 114, active === 0 ? 'focus' : 'known'),
        text(107, 82, '10份', 'known', 22),
        text(107, 124, '240', 'known', 24),
        text(293, 82, '10份', 'known', 22),
        text(293, 124, '240', 'known', 24),
        rect(160, 177, 80, 53, active > 0 ? 'focus' : 'quiet', '24'),
        text(74, 204, active > 0 ? '再1份' : '余下', active > 0 ? 'focus' : 'quiet', 20),
        text(200, 26, active > 1 ? '20份 + 1份 = 21份' : '先分20份，共480', 'focus', 22),
      ];
const quotientZero = (wrong = false): MethodNode[] => [
  text(133, 28, '十位', 'known', 20),
  text(267, 28, '个位', 'known', 20),
  rect(81, 44, 104, 65, wrong ? 'error' : 'known', wrong ? '' : '2'),
  rect(215, 44, 104, 65, wrong ? 'error' : 'focus', wrong ? '2' : '0'),
  rect(24, 143, wrong ? 35 : 344, 51, wrong ? 'error' : 'known'),
  ...(wrong ? [rect(59, 143, 317, 51, 'warm')] : [rect(368, 143, 8, 51, 'warm')]),
  text(
    200,
    132,
    wrong ? '× 2份只有60，还剩552' : '20份共600，还剩12',
    wrong ? 'error' : 'known',
    21,
  ),
  text(
    200,
    238,
    wrong ? '把2个十错当成2个一' : '个位没有整份，仍要写0',
    wrong ? 'error' : 'focus',
    21,
  ),
];
teach(
  'u1-written',
  '504÷24怎样按数位分？612÷30的商为什么要写0？',
  [
    frame(
      '十位的2表示20份',
      '24乘20是480。写在十位的2表示20份，不是2份。',
      '24 × 20 = 480',
      writtenGroups(0),
    ),
    frame(
      '还剩24，个位再分1份',
      '总数504减去480，还剩24。24正好是一个完整份。',
      '504 − 480 = 24；24 ÷ 24 = 1',
      writtenGroups(1),
    ),
    frame(
      '两次的份数合起来',
      '两捆十份加上单独的一份，合计21份。乘回原除数应等于504。',
      '24 × (20 + 1) = 504',
      writtenGroups(2),
    ),
    frame(
      '没有个位份，也要保留位置',
      '612里有20份30，余12不足一份。个位商0，20里的0不能省。',
      '612 ÷ 30 = 20……12',
      quotientZero(),
    ),
    frame(
      '省掉0，份数就变了',
      '把20写成2，就把两个十变成两个一。2份30只有60，不是已经分出的600。',
      '30 × 2 = 60 ≠ 600',
      quotientZero(true),
    ),
  ],
  {
    question: '612÷30，十位商2，落下2后只有12，商怎样写？',
    wrong: '写2，个位的0省略',
    right: '写20，个位用0占位',
    why: '十位2表示20份。个位不够一份要写0，省掉后2会落到个位，变成2份。',
    nodes: quotientZero(),
    wrongNodes: quotientZero(true),
  },
  {
    question: '换一组数：816÷40，余16不足一份，商和余数是哪组？',
    wrong: '商2余16',
    right: '商20余16',
    why: '40乘20是800，加16正好816。商写2只能表示80，和原数差得很远。',
    nodes: [
      rect(78, 52, 104, 68, 'known', '2'),
      rect(218, 52, 104, 68, 'focus', '0'),
      text(130, 30, '十位', 'known', 20),
      text(270, 30, '个位', 'known', 20),
      rect(24, 156, 344, 47, 'known'),
      rect(368, 156, 8, 47, 'warm'),
      text(200, 146, '800 + 16 = 816', 'focus', 22),
      text(200, 238, '16 < 40，个位写0', 'focus', 21),
    ],
    wrongNodes: [
      rect(218, 52, 104, 68, 'error', '2'),
      rect(24, 156, 35, 47, 'error'),
      rect(59, 156, 317, 47, 'warm'),
      text(200, 30, '× 把20份写成2份', 'error', 22),
      text(200, 238, '× 80+16≠816', 'error', 21),
    ],
  },
);

const trialGroups = (stage: number): MethodNode[] => [
  ...packets(stage > 1 ? 6 : 5, 28, stage > 1 ? 4 : 0).filter(
    (node) => node.kind !== 'text' || node.y < 230,
  ),
  ...(stage < 2
    ? [
        rect(135, 106, 128, 52, stage === 1 ? 'focus' : 'warm'),
        text(199, 135, stage === 1 ? '28 + 4' : '还剩32', 'warm', 22),
        ...(stage === 1 ? [line(247, 106, 247, 158, 'focus')] : []),
      ]
    : []),
  text(200, 240, stage > 1 ? '整份168；余4' : '整份140；余32', 'known', 22),
];
teach(
  'u1-trial',
  '172÷28，试商5后，怎样知道要调大还是调小？',
  [
    frame(
      '估商只是起点，先乘原数',
      '把28看作30，先试商5。必须用原除数28乘回去，5份共140。',
      '172 − 28 × 5 = 32',
      trialGroups(0),
    ),
    frame(
      '剩下32，还够再分28',
      '余下部分中还能圈出完整的一份28。说明份数少了，商要加1。',
      '32 = 28 + 4',
      trialGroups(1),
    ),
    frame(
      '商加1后，余数才不足一份',
      '再圈一份以后，共6份，只剩4。4比28小，才算分完。',
      '172 = 28 × 6 + 4；4 < 28',
      trialGroups(2),
    ),
    frame(
      '商太大时，乘积会超出总量',
      '试商7会需要196，比172多24。连总数都不够，应调小。',
      '28 × 7 = 196 > 172',
      [
        rect(24, 66, 309, 52, 'known'),
        rect(333, 66, 43, 52, 'error'),
        text(200, 45, '7份需要196', 'error', 22),
        rect(24, 153, 309, 45, 'known'),
        text(200, 144, '原来只有172', 'known', 22),
        line(333, 54, 333, 211, 'focus', true),
        text(200, 240, '多用24，不能分出第7份', 'error', 21),
      ],
    ),
  ],
  {
    question: '试商5，乘积140没有超过172，就可以停了吗？',
    wrong: '可以，乘积没超就行',
    right: '不行，余下32还能再分28',
    why: '不超过总数只是第一项检查。余数还够一份，说明商仍偏小。',
    nodes: trialGroups(2),
    wrongNodes: note(
      errorOn(trialGroups(0), (node) => node.kind === 'rect' && node.w === 128),
      '× 剩32，仍够一份28',
    ),
  },
  {
    question: '换一组数：196÷32，试商5后余36，应该怎样调？',
    wrong: '仍取5，余36',
    right: '调到6，余4',
    why: '36还能拿出一份32。多分一份后只余4，4小于32。',
    nodes: packets(6, 32, 4),
    wrongNodes: note(
      [...packets(5, 32, 0), rect(138, 109, 126, 52, 'error', '剩36')],
      '× 剩36，仍够一份32',
    ),
  },
);

teach(
  'u1-order',
  '480÷8÷6，连续两次平均分，可以怎样合并？',
  [
    frame(
      '先平均分成8大组',
      '总数480先分给8大组。每大组60，还不是最后的小组量。',
      '480 ÷ 8 = 60',
      nestedGroups(8, 6, 0, 10),
    ),
    frame(
      '只看一大组，再分6小组',
      '每大组都要再平均分6份。一大组60分完后，每小组是10。',
      '60 ÷ 6 = 10',
      nestedGroups(8, 6, 1, 10),
    ),
    frame(
      '把其余7大组也分完',
      '8大组，每组6小组，共48小组。同样的480可以一次平均分成48份。',
      '480 ÷ (8 × 6) = 10',
      nestedGroups(8, 6, 2, 10),
    ),
  ],
  {
    question: '连续除以8、再除以6，合并后的除数是什么？',
    wrong: '8÷6',
    right: '8×6',
    why: '每个大组里面都有6小组。小组总数是8组各6个，必须相乘。',
    nodes: nestedGroups(8, 6, 2, 10),
    wrongNodes: note(
      errorOn(
        nestedGroups(8, 6, 0, 10),
        (node) => node.kind === 'rect' && node.x === 12 && node.y === 35,
      ),
      '× 没有继续分小组',
    ),
  },
  {
    question: '换一组数：360÷6÷3，最后每小组多少？',
    wrong: '180：把6÷3当成总组数',
    right: '20：一共6×3=18小组',
    why: '6大组各分3小组，共18小组。360平均分18份，每份20。',
    nodes: nestedGroups(6, 3, 2, 20),
    wrongNodes: [
      rect(28, 64, 158, 98, 'error', '180'),
      rect(214, 64, 158, 98, 'error', '180'),
      text(200, 32, '× 把18小组错当2组', 'error', 22),
      text(200, 225, '每个大组都要再分3份', 'known', 21),
    ],
  },
);

teach(
  'u1-units',
  '420分是多少时？怎样选对换算进率？',
  [
    frame(
      '先建立一个完整小时',
      '一盒表示1时，由6段10分组成。一个完整小时是60分，不是100分。',
      '6 × 10 = 60分 = 1时',
      hourBoxes(1),
    ),
    frame(
      '数420分能装满几盒',
      '420分每60分装一盒，能装满7盒。盒子的数量就是小时数。',
      '420 ÷ 60 = 7时',
      hourBoxes(7, true),
    ),
    frame(
      '换回分钟，核对总量',
      '7个小时各有60分，仍是420分。换单位改变数值，不改变这段时间。',
      '7 × 60 = 420分',
      [...hourBoxes(7), text(200, 212, '7时和420分是同一段时间', 'focus', 20)],
    ),
  ],
  {
    question: '420分换成时，应该按多少分分成一盒？',
    wrong: '100分一盒',
    right: '60分一盒',
    why: '时与分的进率是60。把一小时当100分，会把每盒时间装得过长。',
    nodes: hourBoxes(7, true),
    wrongNodes: [
      rect(40, 60, 120, 111, 'error'),
      ...Array.from({ length: 10 }, (_, i) => rect(45, 65 + i * 10, 110, 8, 'error')),
      text(100, 201, '× 一盒装100分', 'error', 20),
      rect(234, 60, 120, 66, 'known'),
      ...Array.from({ length: 6 }, (_, i) => rect(239, 65 + i * 10, 110, 8, 'known')),
      text(294, 156, '实际只需60分', 'known', 19),
    ],
  },
  {
    question: '换一种单位：288时是多少日？1日是24时。',
    wrong: '4日余48时：用288÷60',
    right: '12日：用288÷24',
    why: '日与时的进率是24。除以60是把时分关系搬错了地方，余48时还够两日。',
    nodes: packets(12, 24),
    wrongNodes: [
      rect(24, 57, 352, 55, 'error'),
      ...Array.from({ length: 3 }, (_, i) =>
        line(24 + 88 * (i + 1), 57, 24 + 88 * (i + 1), 112, 'error'),
      ),
      text(200, 39, '× 每日错装60时', 'error', 22),
      rect(107, 149, 186, 48, 'warm', '还剩48时'),
      text(200, 239, '48时还能分成2日', 'focus', 21),
    ],
  },
);

teach(
  'u1-restore',
  '除数32误看成23，错得商16余5，怎样还原？',
  [
    frame(
      '先按错过程合回总量',
      '商16是每份23时的份数。把16份与余5合回去，得到没有改变的被除数。',
      '23 × 16 + 5 = 373',
      packets(16, 23, 5),
    ),
    frame(
      '总数不动，旧分组拆开',
      '373不变，把每份量改回32。旧商16不能直接搬到新的分组里。',
      '373 ÷ 32',
      [
        rect(24, 72, 352, 75, 'known', '373'),
        line(200, 148, 200, 184, 'focus'),
        text(200, 218, '重新按每份32来分', 'focus', 22),
      ],
    ),
    frame(
      '按32重新分，再检查余数',
      '重新得到11份，余21。合起来是373，而且21不足一份32。',
      '32 × 11 + 21 = 373；21 < 32',
      packets(11, 32, 21),
    ),
  ],
  {
    question: '还原被除数时，错商16应配哪个除数？',
    wrong: '正确除数32，算32×16+5',
    right: '错除数23，算23×16+5',
    why: '16份是按每份23得到的。改用32却保留16份，总数会变成517，不再是原来的数。',
    nodes: packets(16, 23, 5),
    wrongNodes: [
      rect(24, 75, 254, 65, 'known'),
      rect(278, 75, 98, 65, 'error'),
      line(278, 58, 278, 188, 'focus', true),
      text(150, 48, '原来373', 'known', 22),
      text(326, 178, '多144', 'error', 21),
      text(200, 236, '× 32×16+5=517', 'error', 21),
    ],
  },
  {
    question: '换一组数：除数27看成72，错得商4余10，原被除数是多少？',
    wrong: '118：27×4+10',
    right: '298：72×4+10',
    why: '商4属于每份72的错过程。先用72乘4再加10，才能还原原总量298。',
    nodes: packets(4, 72, 10),
    wrongNodes: [
      rect(24, 75, 139.4, 65, 'known'),
      rect(163.4, 75, 212.6, 65, 'error', undefined, true),
      text(200, 43, '原来298', 'known', 22),
      text(88, 180, '只还原118', 'known', 20),
      text(270, 180, '还少180', 'error', 20),
      text(200, 237, '× 误用27×4+10', 'error', 21),
    ],
  },
);

teach(
  'u1-loading',
  '157人，每车24座，要求人人有座，至少几辆车？',
  [
    frame(
      '先把6辆车坐满',
      '每个点表示一个人，每框是一辆24座的车。6辆车坐了144人，车外还有13人。',
      '157 ÷ 24 = 6……13',
      busSeats(6, 13, false),
    ),
    frame(
      '余下13人也必须有座位',
      '商6只数坐满的车。余下的人不能舍去，要另找一辆车。',
      '157 − 24 × 6 = 13',
      note(busSeats(6, 13, false), '13人还需一辆车', 'warm'),
    ),
    frame(
      '增加一辆，圈住余下的人',
      '把剩下13人放入第7辆车。这辆没坐满，也是一辆完整的车。',
      '6 + 1 = 7 辆',
      busSeats(6, 13, true),
    ),
  ],
  {
    question: '157人坐24座的车，商6余13，能只安排6辆吗？',
    wrong: '能，把余数13舍去',
    right: '不能，13人还要1辆，共7辆',
    why: '余数是没有座位的人。题目要求人人有座，所以有余数就再安排一辆。',
    nodes: busSeats(6, 13, true),
    wrongNodes: note(busSeats(6, 13, false), '× 13人还在车外'),
  },
  {
    question: '换一种情况：96人坐24座的车，至少几辆？',
    wrong: '5辆：商4以后总要再加1',
    right: '4辆：没有余下的人',
    why: '96正好是4个24，没有人留在车外。有余数才需要额外的车。',
    nodes: busSeats(4, 0, false),
    wrongNodes: note(
      errorOn(
        busSeats(4, 0, true),
        (node) => node.kind === 'rect' && node.x === 8 && node.y === 140,
      ),
      '× 多叫一辆空车',
    ),
  },
);

teach(
  'u1-intervals',
  '240厘米木条，每段30厘米；每次只锯一根、不叠放，要锯几次？',
  [
    frame(
      '先分清段数和切口',
      '木条总长240厘米，每段30厘米，能得到8段。两端原本就存在。',
      '240 ÷ 30 = 8段',
      [
        rect(24, 89, 352, 54, 'known'),
        text(200, 52, '原来是一根完整木条', 'known', 21),
        dot(24, 116, 'warm'),
        dot(376, 116, 'warm'),
        text(200, 213, '两个原端点都不用锯', 'warm', 20),
      ],
    ),
    frame(
      '只标记相邻两段之间',
      '每两段之间只有一个切口。8段排成一行，中间共有7个位置要锯。',
      '8段之间，有7个切口',
      cuts(8, 30),
    ),
    frame(
      '锯完以后，切口变成相邻端点',
      '每锯一次，只把一段变成两段，段数增加1。原有1段，增加7段，才是8段。',
      '锯的次数 = 8 − 1 = 7',
      cuts(8, 30, 2),
    ),
  ],
  {
    question: '同一根木条锯成8段，为什么不是锯8次？',
    wrong: '8段就有8个切口',
    right: '只有7个内部切口，两端不锯',
    why: '段和切口不是同一个对象。两头已经是端点，每锯一次只增加一段。',
    nodes: cuts(8, 30),
    wrongNodes: cuts(8, 30, 1, true),
  },
  {
    question: '换一根180厘米木条，每段20厘米；不叠放，要锯几次？',
    wrong: '9次：180÷20=9',
    right: '8次：9段之间有8个切口',
    why: '180÷20算出的是9段。只有相邻两段之间要锯，两端不用锯，所以少1次。',
    nodes: cuts(9, 20),
    wrongNodes: cuts(9, 20, 1, true),
  },
);

teach(
  'u1-changes',
  '420÷35=12，只改总量和两边一起加倍，份数有什么不同？',
  [
    frame(
      '原来12份，每份35',
      '每个框装一块35，一共12框，合起来420。商数的是框的个数。',
      '420 ÷ 35 = 12',
      doubles(12, 1),
    ),
    frame(
      '只加倍总量，就多出12框',
      '每份仍是35，总量420再加420。相同的小块多一倍，份数也多一倍。',
      '840 ÷ 35 = 24',
      doubles(24, 1, 'focus'),
    ),
    frame(
      '每份也加倍，两块合成一框',
      '把每份量也变成70，每框装两块35。总量840没变，24小块合成12框。',
      '840 ÷ 70 = 12',
      doubles(12, 2, 'focus'),
    ),
  ],
  {
    question: '420÷35=12，只把总量变成840，每份35不变，商是多少？',
    wrong: '仍是12份',
    right: '24份',
    why: '只增加总量，每份量没有变。要多用一倍的框；若仍装12框，就偷偷把每份也加倍了。',
    nodes: doubles(24, 1, 'focus'),
    wrongNodes: note(doubles(12, 2, 'error'), '× 每份也偷偷加倍'),
  },
  {
    question: '换一组数：360÷30=12；把两边都除以10，商怎样？',
    wrong: '36÷30，商变成1余6',
    right: '36÷3，商仍是12',
    why: '两边一起换计数单位，每份和总量同时缩小，份数不变。只缩小总量会改变分组。',
    nodes: packets(12, 3),
    wrongNodes: [
      rect(24, 67, 293, 55, 'error', '30'),
      rect(317, 67, 59, 55, 'warm'),
      text(200, 41, '× 只把360改成36', 'error', 20),
      text(200, 198, '只剩1份，还余6', 'error', 22),
      text(200, 239, '每份30也要同时改成3', 'focus', 21),
    ],
  },
);

teach(
  'u1-groups',
  '240本书，平均放2个书架，每架4层，每层放多少本？',
  [
    frame(
      '先按书架平均分',
      '240本平均放2架，每架120本。120本是一个书架的总量，不是每层的量。',
      '240 ÷ 2 = 120本',
      shelves(2, 4, 30, 0),
    ),
    frame(
      '一架的120本，再平均放4层',
      '先看第一个书架，每层30本。第二架也必须经历同样的分层。',
      '120 ÷ 4 = 30本',
      shelves(2, 4, 30, 1, 'focus'),
    ),
    frame(
      '数清全部8层',
      '两架各有4层，合起来8层。8个30仍是原来的240本。',
      '240 ÷ (2 × 4) = 30本',
      shelves(2, 4, 30, 2, 'focus'),
    ),
  ],
  {
    question: '240本放2架、每架4层，能直接240÷4求每层吗？',
    wrong: '能，每层60本',
    right: '不能，共有2×4=8层，每层30本',
    why: '每个书架都有4层，不是总共4层。给8层都放60本会变成480本，超过原数。',
    nodes: shelves(2, 4, 30),
    wrongNodes: overfilledShelves(2, 4, 30),
  },
  {
    question: '换一组数：420本平均放3架，每架5层，每层多少本？',
    wrong: '84本：只用420÷5',
    right: '28本：420÷(3×5)',
    why: '3架共有15层。420平均分15份才是每层的量，不能漏掉书架数3。',
    nodes: shelves(3, 5, 28, 2, 'focus'),
    wrongNodes: overfilledShelves(3, 5, 28),
  },
);

teach(
  'u2-meaning',
  '长7厘米、宽4厘米的长方形，周长和面积分别看哪里？',
  [
    frame(
      '沿外边走一圈，量的是长度',
      '只走外框四条边，里面的格子线不走。边框展开是一条长22厘米的线。',
      '7 + 4 + 7 + 4 = 22厘米',
      surface(7, 4, 'boundary'),
    ),
    frame(
      '铺里面的面，先数一行',
      '一行有7个边长1厘米的小正方形。每一格表示1平方厘米，不是一段边长。',
      '一行7格，每格1平方厘米',
      surface(7, 4, 'row'),
    ),
    frame(
      '数完4行，得到面积',
      '每行7格，共4行，里面铺了28个单位方格。边界和内部是不同的测量对象。',
      '7 × 4 = 28平方厘米',
      surface(7, 4, 'area'),
    ),
  ],
  {
    question: '给这个画框配一整块玻璃，应测量什么？',
    wrong: '周长22厘米，沿外边量',
    right: '面积28平方厘米，铺满里面',
    why: '玻璃覆盖的是框内的面。框条才沿边界，不能用一圈线代替整块玻璃。',
    nodes: surface(7, 4, 'area'),
    wrongNodes: note(
      errorOn(surface(7, 4, 'boundary'), (node) => node.kind === 'line' && node.tone === 'focus'),
      '× 只有边，没有玻璃',
    ),
  },
  {
    question: '换一种任务：长8厘米、宽3厘米的桌垫四边包带，要多长？',
    wrong: '24厘米：把里面24格当长度',
    right: '22厘米：(8+3)×2',
    why: '包带沿四条边走一圈，所以相加两条长和两条宽。8乘3数的是面里的格子。',
    nodes: surface(8, 3, 'boundary'),
    wrongNodes: note(
      errorOn(surface(8, 3, 'area'), (node) => node.kind === 'rect' && node.tone === 'focus'),
      '× 数24格，不是量边',
    ),
  },
);

const hundredArea = (rowOnly = false, wrong = false): MethodNode[] => [
  ...arrayCells(10, 10, (i) => !rowOnly || i < 10, 17).map((n, i) =>
    wrong && i < 10 ? { ...n, tone: 'error' as const } : n,
  ),
  text(200, 26, rowOnly ? '每边10分米' : '10行，每行10格', 'known', 21),
  text(
    200,
    243,
    wrong ? '× 漏数另外9行' : rowOnly ? '一行10格，不是整个面' : '100个1平方分米',
    'focus',
    20,
  ),
];
teach(
  'u2-units',
  '1平方米为什么等于100平方分米，而不是10平方分米？',
  [
    frame(
      '每边分10段，先看一行',
      '1米是10分米，横竖都要分成10段。第一行只有10格，整个面还没有数完。',
      '每边10分米；先数1行10格',
      hundredArea(true),
    ),
    frame(
      '把10行全部数完',
      '一行10个1平方分米，一共有10行。面积进率是10乘10，不能只换一条边。',
      '1平方米 = 10 × 10 = 100平方分米',
      hundredArea(),
    ),
    frame(
      '相加前，把大面也拆成小格',
      '3平方米拆成300平方分米，再加40平方分米。只有同样大小的单位格才能直接相加。',
      '3平方米40平方分米 = 300 + 40 = 340平方分米',
      smallAreaUnits(3, 40),
    ),
  ],
  {
    question: '1平方米换成平方分米，能只按长度进率10换算吗？',
    wrong: '能，1平方米是10平方分米',
    right: '不能，10行各10格，共100平方分米',
    why: '面积有长和宽两个方向。只换一条边只数出一行，漏掉其余9行。',
    nodes: hundredArea(),
    wrongNodes: hundredArea(true, true),
  },
  {
    question: '换一组单位：2平方分米加30平方厘米，共多少平方厘米？',
    wrong: '50：2×10+30',
    right: '230：2×100+30',
    why: '1平方分米是10厘米乘10厘米，共100平方厘米。两个大单位要换成200，再加30。',
    nodes: smallAreaUnits(2, 30),
    wrongNodes: [
      ...Array.from({ length: 20 }, (_, i) =>
        rect(100 + (i % 10) * 20, 45 + Math.floor(i / 10) * 20, 20, 20, 'error'),
      ),
      ...Array.from({ length: 30 }, (_, i) =>
        rect(100 + (i % 10) * 20, 117 + Math.floor(i / 10) * 20, 20, 20, 'known'),
      ),
      text(200, 26, '× 两个大单位只换20格', 'error', 20),
      text(200, 240, '少换了180个小方格', 'error', 21),
    ],
  },
);

function pairBoundary(wrong = false): MethodNode[] {
  const x = 100,
    y = 60,
    s = 100;
  return [
    rect(x, y, s, s, 'known'),
    rect(x + s, y, s, s, 'known'),
    line(x, y, x + 2 * s, y, 'focus'),
    line(x + 2 * s, y, x + 2 * s, y + s, 'focus'),
    line(x + 2 * s, y + s, x, y + s, 'focus'),
    line(x, y + s, x, y, 'focus'),
    ...(wrong
      ? [
          line(x + s - 3, y, x + s - 3, y + s, 'error'),
          line(x + s + 3, y, x + s + 3, y + s, 'error'),
        ]
      : []),
    text(200, 28, '两个边长1的方格拼在一起', 'known', 20),
    text(200, 223, wrong ? '× 公共边被数了两次' : '外边6，内边不数', wrong ? 'error' : 'focus', 20),
  ];
}
function lCells(wrong = false): MethodNode[] {
  const s = 60,
    x = 140,
    y = 58,
    cells = [
      [0, 0],
      [1, 0],
      [0, 1],
    ];
  const points = [
    [0, 0],
    [2, 0],
    [2, 1],
    [1, 1],
    [1, 2],
    [0, 2],
    [0, 0],
  ];
  return [
    ...cells.map(([a, b]) => rect(x + a * s, y + b * s, s, s, 'known')),
    ...(wrong
      ? cells.flatMap(([a, b]) =>
          [
            [a, b, a + 1, b],
            [a + 1, b, a + 1, b + 1],
            [a + 1, b + 1, a, b + 1],
            [a, b + 1, a, b],
          ].map(([a1, b1, a2, b2]) =>
            line(
              x + a1 * s,
              y + b1 * s,
              x + a2 * s,
              y + b2 * s,
              (a1 === 1 && a2 === 1 && Math.min(b1, b2) === 0) ||
                (b1 === 1 && b2 === 1 && Math.min(a1, a2) === 0)
                ? 'error'
                : 'known',
            ),
          ),
        )
      : points
          .slice(1)
          .map(([a, b], i) =>
            line(x + points[i][0] * s, y + points[i][1] * s, x + a * s, y + b * s, 'focus'),
          )),
    text(200, 28, '3个单位格拼L形', 'known', 20),
    text(200, 230, wrong ? '× 内边被重复数' : '8厘米；3平方厘米', wrong ? 'error' : 'focus', 20),
  ];
}
teach(
  'u2-grid',
  '6列4行的单位方格，面积怎样数，周长怎样数？',
  [
    frame(
      '格子覆盖内部，按行列数面积',
      '每格1平方厘米，共6列4行。24格描述内部的面，不描述外边的长度。',
      '6 × 4 = 24平方厘米',
      surface(6, 4, 'area'),
    ),
    frame(
      '走外框，内部格线不走',
      '只沿四条外边走一圈。横边各6厘米，竖边各4厘米。',
      '(6 + 4) × 2 = 20厘米',
      surface(6, 4, 'boundary'),
    ),
    frame(
      '放大相邻两格，找藏起来的边',
      '两格接在一起，公共边在内部。它不接触外面，所以不属于周长。',
      '4 + 4 − 2 = 6条单位边',
      pairBoundary(),
    ),
  ],
  {
    question: '相邻两格的公共边，在周长里怎样处理？',
    wrong: '每个格子都数4边，公共边也数',
    right: '公共边在内部，两次都不数',
    why: '两格原本各有一条相接的边，拼好后都藏到内部。周长只留下外面的6条单位边。',
    nodes: pairBoundary(),
    wrongNodes: pairBoundary(true),
  },
  {
    question: '换个图形：3个边长1厘米方格拼成L形，周长多少？',
    wrong: '12厘米：3×4',
    right: '8厘米：只数外露的边',
    why: '有两处公共边，各被3乘4重复算了两次。减去4条内部单位边，剩8厘米。',
    nodes: lCells(),
    wrongNodes: lCells(true),
  },
);

function halfPerimeter(long: number, wide: number, wrong = false): MethodNode[] {
  const n = long + wide,
    s = Math.min(24, 332 / n),
    x = (400 - n * s) / 2;
  return [
    ...Array.from({ length: wrong ? 2 : 1 }, (_, row) =>
      Array.from({ length: n }, (_, i) =>
        rect(
          x + i * s,
          71 + row * 62,
          s,
          46,
          wrong ? (row === 0 && i < long ? 'known' : 'error') : i < long ? 'known' : 'focus',
        ),
      ),
    ).flat(),
    text(
      200,
      30,
      wrong ? `× 两长两宽只减${long}` : `一长一宽共${n}`,
      wrong ? 'error' : 'known',
      20,
    ),
    text(
      200,
      237,
      wrong ? `错剩${n * 2 - long}，多算一半` : `长${long}；余宽${wide}`,
      wrong ? 'error' : 'focus',
      20,
    ),
  ];
}
teach(
  'u2-measure',
  '长9厘米、宽5厘米，面积和周长的公式怎样得到？',
  [
    frame(
      '先数一行，再数有几行',
      '每行铺9格，5行铺满。9乘5数出的是45个单位方格。',
      '面积 = 9 × 5 = 45平方厘米',
      surface(9, 5, 'row'),
    ),
    frame(
      '数满45格，确定面积',
      '同样大小的方格全部铺满，不能重叠也不能漏。面积的单位是平方厘米。',
      '9 × 5 = 45平方厘米',
      surface(9, 5, 'area'),
    ),
    frame(
      '外边有两条长、两条宽',
      '周长是四边长度之和。先把一条长和一条宽合起来，再取两份。',
      '周长 = (9 + 5) × 2 = 28厘米',
      surface(9, 5, 'boundary'),
    ),
    frame(
      '已知周长时，先只看一半',
      '28的一半14里面正好是一长加一宽。减去长9，才留下宽5。',
      '宽 = 28 ÷ 2 − 9 = 5厘米',
      halfPerimeter(9, 5),
    ),
  ],
  {
    question: '周长28厘米、长9厘米，怎样求宽？',
    wrong: '28−9=19厘米',
    right: '28÷2−9=5厘米',
    why: '完整周长含两条长和两条宽。只减一条长，剩下的还带着另一条长，不能叫宽。',
    nodes: halfPerimeter(9, 5),
    wrongNodes: halfPerimeter(9, 5, true),
  },
  {
    question: '换一组数：长方形周长30厘米、长9厘米，宽多少？',
    wrong: '21厘米：30−9',
    right: '6厘米：30÷2−9',
    why: '半个周长15是一条长加一条宽。减去长9，剩6；完整周长减9还多算了另一半。',
    nodes: halfPerimeter(9, 6),
    wrongNodes: halfPerimeter(9, 6, true),
  },
);

teach(
  'u2-cut',
  '12厘米×8厘米的纸，从角上沿原边平行剪去4厘米×3厘米，面积和周长怎样变？',
  [
    frame(
      '先把拿走的角标出来',
      '整张纸96格，角上的4乘3是12格。红色部分是要拿走的面，不是长度。',
      '原面积12 × 8 = 96；剪去4 × 3 = 12',
      cutCorner(12, 8, 4, 3, 0),
    ),
    frame(
      '拿走12格，留下84格',
      '剪掉的格子不再属于纸面。剩余面积是整张面积减去剪去面积。',
      '96 − 12 = 84平方厘米',
      cutCorner(12, 8, 4, 3, 1),
    ),
    frame(
      '重新沿边走，找旧边和新边',
      '少掉旧边4和3，也新出现内侧的4和3。新旧长度相等，这一次周长不变。',
      '原周长40；−4−3+4+3 = 0，仍是40厘米',
      cutCorner(12, 8, 4, 3, 2),
    ),
  ],
  {
    question: '这个角剪掉后，周长能只减去4+3吗？',
    wrong: '能，只看少掉的两段边',
    right: '不能，还要加上新露出的4和3',
    why: '剪纸改变了边界。旧边少7厘米，新边也增加7厘米，所以这例周长仍是40。',
    nodes: cutCorner(12, 8, 4, 3, 2),
    wrongNodes: cutCorner(12, 8, 4, 3, 3),
  },
  {
    question: '变个位置：10厘米×6厘米的纸，从上边中间挖去2厘米×2厘米缺口，周长多少？',
    wrong: '32厘米：所有剪角都不变',
    right: '36厘米：比原来多两条2厘米深边',
    why: '缺口底边替换原来同长的边，还额外增加两条深边。中间挖缺口与剪去一个角不同。',
    nodes: notch(10, 6, 2, 2),
    wrongNodes: notch(10, 6, 2, 2, true),
  },
);

const tileArea = (wrong = false): MethodNode[] => [
  ...arrayCells(2, wrong ? 1 : 2, () => true, 70).map((n) => ({
    ...n,
    tone: wrong ? ('error' as const) : n.tone,
  })),
  text(200, 26, '砖：2分米×2分米', 'known', 20),
  text(
    200,
    233,
    wrong ? '× 漏掉另一行2格' : '2行各2格，面积4平方分米',
    wrong ? 'error' : 'focus',
    20,
  ),
];
teach(
  'u2-tiling',
  '6米×4米地面，边长2分米的方砖，不切割平行铺满，每块3元，要多少元？',
  [
    frame(
      '地面和砖先统一长度单位',
      '地面长60分米、宽40分米，砖两边都是2分米。同一方向的长度才能相除。',
      '6米 = 60分米；4米 = 40分米',
      [
        rect(65, 39, 270, 180, 'quiet'),
        rect(65, 39, 9, 9, 'focus'),
        text(200, 24, '地面60分米×40分米', 'known', 20),
        text(200, 245, '小砖：2分米×2分米', 'focus', 19),
      ],
    ),
    frame(
      '每排30块，20排铺满',
      '长60分米能排30块，宽40分米能排20行。两边都能整除，才可这样整齐铺满。',
      '60 ÷ 2 = 30；40 ÷ 2 = 20',
      floorTiles(30, 20, true),
    ),
    frame(
      '数出600块，再算费用',
      '一排30块，一共20排，合计600块。每块3元，费用还要再乘3。',
      '30 × 20 × 3 = 1800元',
      floorTiles(30, 20),
    ),
    frame(
      '放大一块，区分边长和面积',
      '砖边长2分米，里面有2行、每行2个单位方格。一块的面积是4，不是2。',
      '一块面积 = 2 × 2 = 4平方分米',
      tileArea(),
    ),
    frame(
      '面积比是整数，也要检查边长',
      '12分米×3分米地面，面积比虽是9，短边3却不能排整块2分米方砖。余下的条带不能直接算成完整砖。',
      '12 × 3 ÷ 4 = 9，但3不能被2整除',
      untileable(),
    ),
  ],
  {
    question: '边长2分米的方砖，一块面积可以直接写2平方分米吗？',
    wrong: '可以，边长2就是面积2',
    right: '不可以，两行各两格，面积4',
    why: '边长只数一条边上的单位段。面积要把整个面数完，两行各2格共4格。',
    nodes: tileArea(),
    wrongNodes: tileArea(true),
  },
  {
    question: '12分米×3分米地面，边长2分米方砖；不切割、边平行，面积比9能说明9块恰铺满吗？',
    wrong: '能，面积比是整数就行',
    right: '不能，短边3不能排整块2分米砖',
    why: '先排6块会剩下宽1分米的条带。面积相同的长条不是2乘2的方砖，不能把9块直接当铺满。',
    nodes: untileable(),
    wrongNodes: untileable(true),
  },
);

function sameAreaPlots(wrong = false): MethodNode[] {
  const s = 14,
    left = { x: 24, y: 65, a: 6, b: 4 },
    right = { x: 205, y: 79, a: 12, b: 2 };
  return [left, right]
    .flatMap((p, index) => [
      ...Array.from({ length: p.a * p.b }, (_, i) =>
        rect(p.x + (i % p.a) * s, p.y + Math.floor(i / p.a) * s, s, s, 'quiet'),
      ),
      line(p.x, p.y, p.x + p.a * s, p.y, 'focus'),
      line(p.x + p.a * s, p.y, p.x + p.a * s, p.y + p.b * s, 'focus'),
      line(p.x, p.y, p.x, p.y + p.b * s, 'focus'),
      ...(wrong && index === 1
        ? [
            line(p.x, p.y + p.b * s, p.x + 4 * s, p.y + p.b * s, 'focus'),
            line(p.x + 4 * s, p.y + p.b * s, p.x + p.a * s, p.y + p.b * s, 'error', true),
          ]
        : [line(p.x, p.y + p.b * s, p.x + p.a * s, p.y + p.b * s, 'focus')]),
      text(p.x + (p.a * s) / 2, 36, `${p.a}×${p.b}`, 'known', 20),
      text(
        p.x + (p.a * s) / 2,
        172,
        index === 0 ? '周长20' : wrong ? '× 也写20' : '周长28',
        wrong && index === 1 ? 'error' : 'focus',
        20,
      ),
    ])
    .concat(
      text(
        200,
        235,
        wrong ? '把右边少算了8厘米' : '同样24格，外框长度不同',
        wrong ? 'error' : 'known',
        20,
      ),
    );
}
teach(
  'u2-compare',
  '同用28米绳子，10米×4米与7米×7米，哪种围出的面积大？',
  [
    frame(
      '先核对相同的约束',
      '两种图形的长宽和都是14，四边合起来都是28米。固定的是围绳长度。',
      '(10 + 4) × 2 = (7 + 7) × 2 = 28米',
      comparePlots(0),
    ),
    frame(
      '先数细长方案的面',
      '每格1平方米，左图4行、每行10格，面积40平方米。绳长不能替代格数。',
      '10 × 4 = 40平方米',
      comparePlots(1),
    ),
    frame(
      '再数正方形里的面',
      '右图7行、每行7格，共49格。相同周长可以包围不同的面积。',
      '7 × 7 = 49平方米；49 > 40',
      comparePlots(2),
    ),
    frame(
      '对齐格数，找多出的9格',
      '把左图40格对应到右图，右图仍多9格。正方形方案在这两种选择中围得更大。',
      '49 − 40 = 9平方米',
      comparePlots(3),
    ),
  ],
  {
    question: '两种方案都用28米绳子，能直接说面积相等吗？',
    wrong: '能，绳子一样长，面积也一样',
    right: '不能，40格与49格不同',
    why: '绳子固定的是外边长度。长宽搭配变了，里面可铺的单位方格数也会改变。',
    nodes: comparePlots(3),
    wrongNodes: comparePlots(3, true),
  },
  {
    question: '换个固定条件：6厘米×4厘米与12厘米×2厘米，面积都24，周长也相同吗？',
    wrong: '相同，面积24就说明周长相同',
    right: '不同，周长分别20厘米和28厘米',
    why: '面积相等只说明方格数相等。两图的外边长短不同，周长应分别把四条边相加。',
    nodes: sameAreaPlots(),
    wrongNodes: sameAreaPlots(true),
  },
);

// Preserve the two pilots, but give each a genuinely different incorrect construction.
unit12Stories['u1-remainder'].mistake.nodes = packets(1, 18, 17);
unit12Stories['u1-remainder'].mistake.wrongNodes = note(
  errorOn(packets(1, 18, 18), (node) => node.kind === 'dot'),
  '× 余18还能再分',
);
unit12Stories['u1-remainder'].transfer!.wrongNodes = note(
  errorOn(packets(12, 16, 16), (node) => node.kind === 'dot'),
  '× 合成208，原数203',
);
unit12Stories['u2-fence'].mistake.wrongNodes = [
  ...fenceModel(20, 6, 2),
  line(70, 60, 330, 60, 'error'),
  text(200, 241, '× 墙边多围20米', 'error', 19),
];
unit12Stories['u2-fence'].transfer!.wrongNodes = [
  rect(70, 60, 260, 115, 'quiet'),
  line(70, 60, 70, 175, 'error'),
  line(330, 60, 330, 175, 'known'),
  line(70, 175, 330, 175, 'known'),
  text(200, 32, '× 围墙边，漏上边', 'error', 20),
  text(200, 210, '错围10+8+8=26米', 'error', 22),
];
