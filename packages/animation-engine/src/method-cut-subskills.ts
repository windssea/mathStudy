import {
  frame,
  text,
  rect,
  line,
  type MethodNode,
  type MethodTone,
  type MethodStory,
  type MethodCheck,
} from './method-primitives';
import { unit12Stories } from './methods-u12';
import { unit56Stories } from './methods-u56';

/** Question IDs are reviewed against their mathematical relation, never guessed from wording at runtime. */
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
const outline = (points: number[][], tone: MethodTone = 'known', dashed = false): MethodNode[] =>
  points.map((p, i) => {
    const next = points[(i + 1) % points.length];
    return line(p[0], p[1], next[0], next[1], tone, dashed);
  });
const caption = (nodes: MethodNode[], value: string, tone: MethodTone = 'focus'): MethodNode[] => [
  ...nodes,
  text(200, 237, value, tone, 20),
];

function bump(l: number, w: number, h: number, stage: number, wrong = false): MethodNode[] {
  const s = Math.min(280 / l, 136 / (w + h)),
    x = (400 - l * s) / 2,
    y = 52 + h * s,
    bw = Math.min(4, l / 2) * s,
    bx = x + (l * s - bw) / 2;
  if (stage === 0)
    return caption(
      [
        rect(x, y, l * s, w * s, 'known'),
        rect(bx, 35, bw, h * s, 'focus'),
        text(200, 26, `底部长${l}、宽${w}；凸起高${h}`, 'known', 20),
      ],
      '拼接前，先认原长方形',
    );
  return caption(
    [
      rect(x, y, l * s, w * s, 'known'),
      rect(bx, y - h * s, bw, h * s, wrong ? 'error' : 'focus'),
      line(bx, y, bx + bw, y, 'error', true),
      ...outline(
        [
          [x, y],
          [bx, y],
          [bx, y - h * s],
          [bx + bw, y - h * s],
          [bx + bw, y],
          [x + l * s, y],
          [x + l * s, y + w * s],
          [x, y + w * s],
        ],
        'known',
      ),
      ...(stage === 1
        ? [
            line(x, y, bx, y, 'focus'),
            line(bx, y - h * s, bx + bw, y - h * s, 'focus'),
            line(bx + bw, y, x + l * s, y, 'focus'),
            line(x, y + w * s, x + l * s, y + w * s, 'focus'),
          ]
        : [
            line(bx, y, bx, y - h * s, wrong ? 'error' : 'focus'),
            line(bx + bw, y - h * s, bx + bw, y, wrong ? 'error' : 'focus'),
          ]),
      text(
        200,
        26,
        stage === 1 ? `上下水平边合计${l}×2` : `多出的竖边：${h}+${h}`,
        wrong ? 'error' : 'known',
        20,
      ),
      text(200, 213, `原来(${l}+${w})×2=${2 * (l + w)}`, 'known', 20),
    ],
    wrong
      ? `错：漏掉两条${h}，只算原外框`
      : stage === 1
        ? '顶上三段合起来，仍是一条长'
        : `新周长${2 * (l + w)}+${h}×2=${2 * (l + w + h)}`,
    wrong ? 'error' : 'focus',
  );
}
const bumpStory = lesson(
  '长14厘米、宽6厘米的长方形，上边接宽4厘米、高3厘米的凸起，周长和面积怎样变？',
  [
    frame(
      '先认原来的外框',
      '原长方形有两条14和两条6，凸起将接在上边。',
      '原周长=(14+6)×2=40厘米',
      bump(14, 6, 3, 0),
    ),
    frame(
      '水平的三段，合成原来的一条长',
      '凸起顶边替换了下面同长的一段，上方水平边合起来仍是14。',
      '水平边总长=14×2=28厘米',
      bump(14, 6, 3, 1),
    ),
    frame(
      '另外出现两条凸起的高',
      '新增的是凸起两侧的3和3，不能把它们漏掉。',
      '新周长=40+3×2=46厘米',
      bump(14, 6, 3, 2),
    ),
  ],
  check(
    '14×6长方形上接高3厘米凸起，周长还是40厘米吗？',
    '是，拼接后周长总不变',
    '不是，还要加两条3厘米边',
    '水平边只是平移，竖直方向却额外多出两条高。',
    bump(14, 6, 3, 2),
    bump(14, 6, 3, 2, true),
  ),
  check(
    '换数：底部长10厘米、宽4厘米，凸起高2厘米，新周长多少？',
    '28厘米：只算底部外框',
    '32厘米：28+2×2',
    '顶上水平总长仍是10，竖边比底部外框多2+2。',
    bump(10, 4, 2, 2),
    bump(10, 4, 2, 2, true),
  ),
);
bumpStory.frames.push(
  frame(
    '面积把两块不重叠的纸相加',
    '凸起占的是新增纸面。原来14×6，再加宽4高3的凸起；面积与周长分开算。',
    '面积=14×6+4×3=96平方厘米',
    caption(
      [rect(74, 94, 252, 108, 'known', '84'), rect(164, 40, 72, 54, 'focus', '12')],
      '面积84+12=96；周长仍按外边走',
    ),
  ),
);

function squareCut(l: number, w: number, stage: number, wrong = false): MethodNode[] {
  const s = 300 / l,
    x = 50,
    y = 76,
    n = Math.floor(l / w),
    remainder = l - n * w;
  const nodes: MethodNode[] = [
    rect(x, y, l * s, w * s, 'known'),
    text(200, 27, `纸长${l}，宽${w}`, 'known', 20),
  ];
  if (wrong)
    return caption(
      [...nodes, rect(x, y, 180, 150, 'error', `边${l}？`, true)],
      `宽只有${w}，放不下边${l}的正方形`,
      'error',
    );
  if (stage > 0)
    for (let i = 0; i < (stage === 1 ? 1 : n); i++)
      nodes.push(rect(x + i * w * s, y, w * s, w * s, 'focus', String(w)));
  if (stage > 1 && remainder)
    nodes.push(rect(x + n * w * s, y, remainder * s, w * s, 'warm', `${remainder}×${w}`));
  return caption(
    nodes,
    stage === 0
      ? '正方形两边一样长，不能超过短边'
      : stage === 1
        ? `最大正方形边长${w}`
        : stage === 2
          ? `${n}个整方形，余下宽${remainder}`
          : `余料面积${remainder * w}；原面积${l * w}`,
  );
}
const maxSquareStory = lesson(
  '长14厘米、宽5厘米的纸，剪最大的正方形，怎样判断边长、个数与余料？',
  [
    frame(
      '短边决定最大的正方形',
      '两边都必须装在纸里，边长不能超过5。',
      '最大边长=5厘米',
      squareCut(14, 5, 0),
    ),
    frame(
      '先放一个边长5的正方形',
      '它的周长是4个5，面积是5乘5。',
      '周长20；面积25',
      squareCut(14, 5, 1),
    ),
    frame(
      '沿长方向排完整的正方形',
      '14里面能排2个5，余下4。余料还是高5的长方形。',
      '14÷5=2……4；余料4×5',
      squareCut(14, 5, 2),
    ),
    frame(
      '剪下与余下合起来，就是原纸',
      '面积可以相加还原；余料的长宽是4与5。',
      '2×25+20=70；余料周长(4+5)×2=18',
      squareCut(14, 5, 3),
    ),
  ],
  check(
    '14×5的纸，最大正方形能取边长14吗？',
    '能，选最长的边',
    '不能，另一方向只有5',
    '正方形的两边都要放得下，必须用原纸短边。',
    squareCut(14, 5, 1),
    squareCut(14, 5, 1, true),
  ),
  check(
    '换数：16×6纸，尽量剪边长6的正方形，余料是什么？',
    '余料16×6，尺寸不变',
    '剪2个，余料4×6',
    '两块占去12厘米长度，剩4；宽仍是6。',
    squareCut(16, 6, 2),
    squareCut(16, 6, 1, true),
  ),
);

function midpoint(total: number, stage: number, wrong = false): MethodNode[] {
  const nodes: MethodNode[] = [
    rect(122, 48, 156, 156, 'known'),
    line(200, 48, 200, 204, 'quiet', true),
    line(122, 126, 278, 126, 'quiet', true),
    text(200, 27, `大正方形面积${total}`, 'known', 20),
  ];
  if (stage > 0)
    nodes.push(
      ...outline(
        [
          [200, 48],
          [278, 126],
          [200, 204],
          [122, 126],
        ],
        'focus',
      ),
    );
  if (stage > 1 && !wrong) nodes.push(rect(161, 87, 78, 78, 'focus'));
  return caption(
    nodes,
    stage === 0
      ? '先把大正方形均分为4小块'
      : wrong
        ? `错：只取一次一半，得到${total / 2}`
        : stage === 1
          ? `8个同样三角形，中间占4个：${total / 2}`
          : `再取一半：${total / 2}÷2=${total / 4}`,
    wrong ? 'error' : 'focus',
  );
}
const midpointStory = lesson(
  '大正方形面积200平方厘米，连各边中点，再对中间图形连中点，最后面积怎样求？',
  [
    frame(
      '先看同样大小的部分',
      '横竖中线把正方形分成4个同样的小方形。',
      '整张面积200',
      midpoint(200, 0),
    ),
    frame(
      '第一次连中点，留下半张',
      '中线和连线分成8个同样三角形，中间图形占4个。',
      '200÷2=100平方厘米',
      midpoint(200, 1),
    ),
    frame(
      '第二次连中点，再留一半',
      '这次的一半是对100取半，不是再从200减去100。',
      '100÷2=50平方厘米',
      midpoint(200, 2),
    ),
  ],
  check(
    '正方形面积200平方厘米，连续两次连接各边中点，只除以2一次得100，对吗？',
    '对，看到一个一半就够了',
    '不对，要连续取两次一半',
    '第二个图形是第一个中间图形的一半，最终是大图的四分之一。',
    midpoint(200, 2),
    midpoint(200, 1, true),
  ),
  check(
    '换数：大正方形面积120，连续两次连接各边中点，最后面积多少？',
    '60平方厘米',
    '30平方厘米',
    '120的一半60，再取60的一半30。',
    midpoint(120, 2),
    midpoint(120, 1, true),
  ),
);

function ring(a: number, b: number, stage: number, wrong = false): MethodNode[] {
  const s = 160 / (a + b),
    x = 120,
    y = 48,
    inside = a - b;
  return caption(
    [
      rect(x, y, a * s, b * s, 'known'),
      rect(x + a * s, y, b * s, a * s, 'known'),
      rect(x + b * s, y + a * s, a * s, b * s, 'known'),
      rect(x, y + b * s, b * s, a * s, 'known'),
      ...(stage > 0
        ? [
            ...outline(
              [
                [x + b * s, y + b * s],
                [x + a * s, y + b * s],
                [x + a * s, y + a * s],
                [x + b * s, y + a * s],
              ],
              wrong ? 'error' : 'focus',
            ),
          ]
        : []),
      text(200, 27, `4块纸，每块长${a}、宽${b}`, 'known', 20),
    ],
    stage === 2
      ? `洞的周长=${wrong ? a + b : inside}×4=${(wrong ? a + b : inside) * 4}`
      : stage === 1
        ? `洞边${a}−${b}=${inside}`
        : '四块不重叠地围一圈',
    wrong ? 'error' : 'focus',
  );
}
function ringView(a: number, b: number, stage: number, wrong = false) {
  return ring(a, b, stage, wrong);
}
const ringStory = lesson(
  '4个长5厘米、宽2厘米的长方形围成方框，中间正方形周长怎样求？',
  [
    frame(
      '先认四块纸的位置',
      '每块长5、宽2。外框边包含一条长和另一块的宽。',
      '外框边=5+2=7厘米',
      ringView(5, 2, 0),
    ),
    frame(
      '中间洞边，是长减去宽',
      '长边的两端有一段被邻纸的宽占去，洞边是5减2。',
      '洞边=5−2=3厘米',
      ringView(5, 2, 1),
    ),
    frame(
      '沿洞的四边走一圈',
      '求的是中间的周长，使用洞边3，而不是外边7。',
      '3×4=12厘米',
      ringView(5, 2, 2),
    ),
  ],
  check(
    '4块5×2纸首尾交错围成正方形框，洞边能按5+2算吗？',
    '能，洞边7',
    '不能，洞边5−2=3',
    '5+2是外框边，洞边要减去邻纸占用的2。',
    ringView(5, 2, 2),
    ringView(5, 2, 2, true),
  ),
  check(
    '换数：4块6×2纸围框，中间洞的周长多少？',
    '32：用外框边8',
    '16：洞边4，共4边',
    '先6−2=4，再4×4。',
    ringView(6, 2, 2),
    ringView(6, 2, 2, true),
  ),
);

function unknownArea(stage: number, wrong = false): MethodNode[] {
  return caption(
    [
      rect(110, 35, 180, 180, 'known'),
      rect(110, 125, 72, 90, wrong ? 'error' : 'quiet', undefined, true),
      ...outline(
        [
          [110, 35],
          [290, 35],
          [290, 215],
          [182, 215],
          [182, 125],
          [110, 125],
        ],
        stage === 1 ? 'focus' : 'known',
      ),
      text(200, 27, '外框10×10；缺角高5，宽?', 'known', 20),
      text(146, 170, wrong ? '误当5' : '?', wrong ? 'error' : 'warm', 22),
    ],
    stage === 0
      ? '外框给全了，缺角宽还未知'
      : stage === 1
        ? '剪在角上，周长仍是40'
        : wrong
          ? '错：凭图猜宽5，算出75'
          : '面积=100−5×?，还不能确定',
    wrong ? 'error' : 'focus',
  );
}
const unknownStory = lesson(
  '外框10×10厘米，左下角缺口高5厘米、宽未知。周长和面积都能确定吗？',
  [
    frame(
      '把已知和未知分开',
      '10×10外框已知，缺口的宽没有给出，不能根据图形比例猜。',
      '缺口高5；宽?',
      unknownArea(0),
    ),
    frame(
      '周长只需平移补回角边',
      '角口少掉的两段边恰好由内侧两段补上，与缺口宽无关。',
      '周长=(10+10)×2=40厘米',
      unknownArea(1),
    ),
    frame(
      '面积还要知道拿走了多少',
      '缺口面积是5乘未知宽，宽变化会改变面积。',
      '剩余面积=100−5×?，不能唯一确定',
      unknownArea(2),
    ),
  ],
  check(
    '外框10×10，角上缺口只知高5、宽未知，能当5×5正方形求剩余75吗？',
    '能，图上看着差不多',
    '不能，缺口宽没给出',
    '题图不能代替缺失条件；确定周长不代表面积也确定。',
    unknownArea(2),
    unknownArea(2, true),
  ),
  check(
    '换情境：外框10×10，已知角上缺口5×2，剩余面积能确定吗？',
    '仍不能确定',
    '能，100−5×2=90',
    '补齐宽2后，缺角面积10，剩余90。',
    [
      rect(110, 35, 180, 180, 'known'),
      rect(110, 125, 36, 90, 'error', '10'),
      text(200, 229, '100−10=90平方厘米', 'focus', 22),
    ],
    unknownArea(2, true),
  ),
);

function overlap(
  stage: number,
  mode: 'union' | 'difference' = 'union',
  wrong = false,
): MethodNode[] {
  const shape: MethodNode[] = [
    rect(70, 55, 144, 108, 'known'),
    rect(160, 109, 108, 90, 'focus'),
    rect(160, 109, 54, 54, 'warm', '9'),
    text(108, 91, '48', 'known', 22),
    text(246, 183, '30', 'focus', 22),
  ];
  if (stage === 0) return caption(shape, '共同9格，同时属于两张纸');
  if (mode === 'union')
    return caption(
      [
        ...shape,
        text(
          200,
          27,
          wrong ? '9被重复算了两次' : '合并后的共同部分只算一次',
          wrong ? 'error' : 'known',
          20,
        ),
      ],
      wrong ? '错：48+30=78' : '合并48+30−9=69',
      wrong ? 'error' : 'focus',
    );
  return caption(
    [
      rect(40, 66, (wrong ? 39 : 39) * 6, 45, 'known', '39'),
      rect(40, 142, (wrong ? 30 : 21) * 6, 45, wrong ? 'error' : 'focus', wrong ? '30' : '21'),
      text(200, 27, wrong ? '只有一边扣9，会改变差' : '两边同时扣同一块9', 'known', 20),
    ],
    wrong ? '错：39−30=9' : '39−21=18，仍等于48−30',
    wrong ? 'error' : 'focus',
  );
}
const overlapStory = lesson(
  '两张纸面积48和30平方厘米，共同压住9平方厘米，合并面积与各自露出部分的面积差怎样求？',
  [
    frame(
      '共同部分被两张纸同时占有',
      '暖色9既在48里，也在30里。',
      '两张面积中都含共同9',
      overlap(0),
    ),
    frame(
      '求合并，重复的一次扣掉',
      '48加30把共同9数了两遍，合并时只保留一遍。',
      '合并面积=48+30−9=69',
      overlap(1),
    ),
    frame(
      '求露出部分，各扣同一个9',
      '甲露出39，乙露出21。两边同时减9，差不变。',
      '(48−9)−(30−9)=48−30=18',
      overlap(2, 'difference'),
    ),
  ],
  check(
    '两张纸面积48、30，重叠9，合并能直接算78吗？',
    '能，两张面积直接加',
    '不能，78里共同9算了两次',
    '合并应扣一次共同部分；求各自露出部分的差，才可直接用两个原面积相减。',
    overlap(1),
    overlap(1, 'union', true),
  ),
  check(
    '两张纸面积48、30，都剪掉共同的9，露出面积相差多少？',
    '9：只从甲扣共同9',
    '18：两边扣同样的9，差不变',
    '39−21=18；只扣一边会改变原来的差。',
    overlap(2, 'difference'),
    overlap(2, 'difference', true),
  ),
);

function diagonal(stage: number, wrong = false): MethodNode[] {
  const first = [rect(140, 65, 120, 90, 'known'), line(140, 65, 260, 155, 'focus')];
  const separated = [
    ...outline(
      [
        [40, 65],
        [160, 65],
        [40, 155],
      ],
      'known',
    ),
    ...outline(
      [
        [240, 65],
        [360, 155],
        [240, 155],
      ],
      'focus',
    ),
  ];
  const joined = [
    ...outline(
      [
        [80, 185],
        [200, 95],
        [320, 185],
      ],
      'focus',
    ),
    line(200, 95, 200, 185, 'known', true),
  ];
  return caption(
    [
      ...(stage === 0 ? first : stage === 1 ? separated : joined),
      text(200, 27, '原纸8×6，沿对角线剪成两块', 'known', 20),
    ],
    wrong
      ? '错：只数一块，得到24'
      : stage === 0
        ? '原面积8×6=48'
        : stage === 1
          ? '两块都在，没有丢掉纸'
          : '不重叠、不留缝，合计仍是48',
    wrong ? 'error' : 'focus',
  );
}
const diagonalStory = lesson(
  '8×6厘米长方形沿对角线剪开，把两块拼成三角形，面积变了吗？',
  [
    frame('先算整张纸有多少面', '原来覆盖的面积是8乘6。', '原面积48平方厘米', diagonal(0)),
    frame(
      '分开后，两块都要保留',
      '每块是原来的一半，两块合起来仍是原来全部。',
      '两块合计仍为48',
      diagonal(1),
    ),
    frame(
      '换位置，不增减纸片',
      '没有重叠、没有缝隙，面积仍是48；周长要沿新的外边另数。',
      '拼后面积48平方厘米',
      diagonal(2),
    ),
  ],
  check(
    '8×6纸沿对角线剪两块，两块不重叠拼成三角形，能只算原面积一半24吗？',
    '能，三角形就是一半',
    '不能，两块都用上了',
    '这里用的是原来两块三角形，不是只取一块。',
    diagonal(2),
    diagonal(1, true),
  ),
  check(
    '换数：10×4纸剪成两块，不重叠拼回新图，面积多少？',
    '20平方厘米',
    '40平方厘米',
    '原纸40，两块都保留，形状变化不改变纸的总面积。',
    caption([rect(60, 65, 280, 112, 'known', '40')], '两块都在，总面积40'),
    caption(
      [
        ...outline(
          [
            [60, 65],
            [340, 177],
            [60, 177],
          ],
          'error',
        ),
      ],
      '错：只保留一半20',
      'error',
    ),
  ),
);

function zigzag(stage: number, wrong = false): MethodNode[] {
  const left = [
      [100, 55],
      [200, 55],
      [230, 90],
      [200, 125],
      [230, 160],
      [200, 195],
      [100, 195],
    ],
    right = [
      [200, 55],
      [300, 55],
      [300, 195],
      [200, 195],
      [230, 160],
      [200, 125],
      [230, 90],
    ];
  const transform = (points: number[][], dx: number) => points.map(([x, y]) => [x + dx, y]);
  return caption(
    [
      ...outline(transform(left, stage === 1 ? -35 : stage === 2 ? 100 : 0), 'known'),
      ...outline(transform(right, stage === 1 ? 35 : stage === 2 ? -100 : 0), 'focus'),
      ...(stage === 0
        ? [
            line(200, 55, 230, 90, 'warm'),
            line(230, 90, 200, 125, 'warm'),
            line(200, 125, 230, 160, 'warm'),
            line(230, 160, 200, 195, 'warm'),
          ]
        : []),
      text(
        200,
        27,
        stage === 2 ? '直边拼入内部，曲折边来到外面' : '两块纸都保留，观察边的位置',
        'known',
        20,
      ),
    ],
    wrong
      ? '错：面积相等，所以周长也相等'
      : stage === 0
        ? '曲折线在内部，不算原周长'
        : stage === 1
          ? '剪开会露出两条曲折边'
          : '面积不变；曲折外边比原直边长',
    wrong ? 'error' : 'focus',
  );
}
const zigzagStory = lesson(
  '纸沿曲折线分两块，再把两条直边拼在一起，面积与周长怎样比较？',
  [
    frame(
      '原来只沿整张纸的外框',
      '曲折分割线藏在纸的内部，不是原图周长。',
      '面积看纸面；周长看外边',
      zigzag(0),
    ),
    frame(
      '两块都保留，面没有变',
      '把两块分开，不丢掉也不重叠，纸面总量不变。',
      '两块面积之和=原面积',
      zigzag(1),
    ),
    frame(
      '拼直边后，外露边换了',
      '直边进入内部，两条较长的曲折边露在外面，所以周长变大。',
      '面积相等；本次周长变大',
      zigzag(2),
    ),
  ],
  check(
    '两块纸都用上，能由面积相等推出周长相等吗？',
    '能，面积相等就都相等',
    '不能，还要看外露边',
    '面积统计纸面，周长统计外露边；曲折边变成外边会改变周长。',
    zigzag(2),
    zigzag(2, true),
  ),
  check(
    '换情境：两块纸有重叠后拼在一起，覆盖面积还等于两块之和吗？',
    '等于，纸一块没少',
    '不等于，重叠部分要少算一次',
    '保存纸片不等于覆盖面积不变；只有不重叠、不留缝的重拼才保持覆盖面积。',
    caption(
      [
        rect(60, 60, 180, 100, 'known'),
        rect(170, 110, 170, 95, 'focus'),
        rect(170, 110, 70, 50, 'warm'),
      ],
      '共同部分只算一次',
    ),
    caption(
      [rect(60, 60, 180, 100, 'known'), rect(170, 110, 170, 95, 'error')],
      '错：重叠也重复加入',
      'error',
    ),
  ),
);

function fold(stage: number, wrong = false): MethodNode[] {
  return caption(
    [
      ...(stage === 0
        ? [
            rect(45, 82, 80, 80, 'known', '25'),
            rect(185, 82, 160, 80, 'focus'),
            text(265, 62, '直立长10', 'known', 20),
          ]
        : [
            rect(80, 82, 80, 80, 'known', '25'),
            rect(160, 82, 160, 80, wrong ? 'error' : 'focus', stage > 1 ? '50' : undefined),
            line(160, 65, 160, 177, 'warm', true),
          ]),
      text(
        200,
        27,
        stage === 0 ? '底座为正方形，先还原共同的宽' : '展开后，底座与直立部分不重叠',
        'known',
        20,
      ),
      text(36, 130, stage === 0 ? '?' : '5', 'known', 20),
    ],
    wrong
      ? '错：把25直接当宽，算10×25'
      : stage === 0
        ? '5×5=25，所以宽5'
        : stage === 1
          ? '直立部分宽也为5'
          : '原面积25+10×5=75',
    wrong ? 'error' : 'focus',
  );
}
const foldStory = lesson(
  '折起卡纸的正方形底座面积25，直立部分长10，怎样求原卡纸面积？',
  [
    frame('从正方形面积还原边长', '5乘5是25，所以底座边长5，不是25。', '底座边长5厘米', fold(0)),
    frame(
      '沿折痕展开，找到共同的宽',
      '卡纸展开后，两部分的宽相同，都是5。',
      '直立部分面积=10×5',
      fold(1),
    ),
    frame(
      '把不重叠的两部分相加',
      '原卡纸包含底座和直立部分，两部分缺一不可。',
      '25+10×5=75平方厘米',
      fold(2),
    ),
  ],
  check(
    '卡纸正方形底座面积25，直立部分长10、与底座同宽，能把直立部分宽当25吗？',
    '能，算10×25',
    '不能，宽是5，因为5×5=25',
    '面积25是25个平方单位，不能直接当长度25。',
    fold(2),
    fold(2, true),
  ),
  check(
    '换数：正方形底座面积36，直立部分长8、与底座同宽，原卡纸面积多少？',
    '324：36+8×36',
    '84：36+8×6',
    '正方形底座边长6，展开后直立部分也宽6。',
    caption(
      [rect(50, 75, 120, 120, 'known', '36'), rect(170, 75, 160, 120, 'focus', '48')],
      '36+8×6=84',
    ),
    caption(
      [rect(50, 75, 120, 120, 'known', '36'), rect(170, 75, 160, 120, 'error', '288')],
      '错把面积36当长度36',
      'error',
    ),
  ),
);

function reverseCut(stage: number, wrong = false): MethodNode[] {
  return caption(
    [
      rect(230, 140, 90, 60, 'known', '12×8'),
      rect(
        230,
        50,
        90,
        90,
        stage > 0 ? 'focus' : 'quiet',
        stage > 0 ? '12×12' : undefined,
        stage === 0,
      ),
      rect(
        80,
        50,
        150,
        150,
        stage > 1 ? (wrong ? 'error' : 'warm') : 'quiet',
        stage > 1 ? (wrong ? '漏400' : '20×20') : undefined,
        stage < 2,
      ),
      text(200, 27, '从最后的12×8小长方形往回拼', 'known', 20),
    ],
    wrong
      ? '错：只补回最近剪下的144'
      : stage === 0
        ? '按图：最近一块与余料共用12边'
        : stage === 1
          ? '前一块长方形：12×(12+8)'
          : '再补边20正方形：原纸32×20',
    wrong ? 'error' : 'focus',
  );
}
const reverseStory = lesson(
  '按图中位置拼回两块正方形。余料长12、宽8，原长方形怎样还原？',
  [
    frame(
      '从最后余料的长边还原',
      '紧邻余料的正方形边长12，两者沿12厘米边拼接。',
      '前一块正方形12×12',
      reverseCut(0),
    ),
    frame(
      '先拼回最近剪下的一块',
      '12和8合成20，所以前一块长方形是12×20。',
      '12+8=20',
      reverseCut(1),
    ),
    frame(
      '再拼回更早剪下的正方形',
      '更早的正方形边长20，拼回后长32、宽20。',
      '原面积(20+12)×20=640平方厘米',
      reverseCut(2),
    ),
  ],
  check(
    '余料12×8，最近正方形沿12边拼回，最早正方形沿前块长边拼回。只补最近12×12够吗？',
    '够，余料加一块就行',
    '不够，最早20×20也要拼回',
    '题目剪了两次，就有两块正方形离开；只拼一次会少一大块。',
    reverseCut(2),
    reverseCut(2, true),
  ),
  check(
    '换数：余料10×6；最近正方形沿余料长边10拼回，最早正方形再沿前块长边拼回。原纸尺寸是哪组？',
    '16×10：只倒推一次',
    '26×16：两次都拼回',
    '先得到10×16，再补边16正方形，原长26、宽16。',
    caption(
      [
        rect(109, 60, 112, 112, 'known', '16×16'),
        rect(221, 60, 70, 70, 'focus', '10×10'),
        rect(221, 130, 70, 42, 'warm', '10×6'),
      ],
      '(16+10)×16=416',
    ),
    caption(
      [rect(150, 55, 100, 100, 'error', '10×10'), rect(150, 155, 100, 60, 'known', '10×6')],
      '错：漏掉最早的16×16',
      'error',
    ),
  ),
);

function gridCut(divisions: number, stage: number, wrong = false): MethodNode[] {
  const n = divisions,
    side = n === 2 ? 12 : 16,
    cell = 144 / n,
    x = 128,
    y = 52,
    cols = n === 2 ? 1 : 2,
    rows = n === 2 ? 1 : 3;
  return caption(
    [
      ...Array.from({ length: n * n }, (_, i) =>
        rect(
          x + (i % n) * cell,
          y + Math.floor(i / n) * cell,
          cell,
          cell,
          i % n < cols && Math.floor(i / n) < rows ? (stage > 0 ? 'focus' : 'known') : 'known',
        ),
      ),
      text(200, 27, `大边${side}，横竖各分${n}份`, 'known', 20),
      ...(stage > 1
        ? [
            ...outline(
              [
                [x, y],
                [x + cols * cell, y],
                [x + cols * cell, y + rows * cell],
                [x, y + rows * cell],
              ],
              wrong ? 'error' : 'focus',
            ),
          ]
        : []),
    ],
    wrong
      ? '错：把块数直接当边长'
      : stage === 0
        ? `每个小边${side}÷${n}=${side / n}`
        : stage === 1
          ? `剪下长${(cols * side) / n}、宽${(rows * side) / n}`
          : n === 2
            ? '每个小方形周长6×4=24'
            : '剪下周长40；余面积256−96=160',
    wrong ? 'error' : 'focus',
  );
}
function partitionStory(n: number): MethodStory {
  const side = n === 2 ? 12 : 16,
    small = side / n,
    cols = n === 2 ? 1 : 2,
    rows = n === 2 ? 1 : 3;
  return lesson(
    `边长${side}厘米正方形，横竖各分${n}份，怎样从小格数找到真实边长？`,
    [
      frame(
        '先求一个小格的边长',
        '每一方向分别平均分，不能把面积份数直接拿来除边长。',
        `${side}÷${n}=${small}厘米`,
        gridCut(n, 0),
      ),
      frame(
        '数横格和竖格，分别乘小边',
        '长有几格、宽有几格，要分别数。',
        `这块长${cols}×${small}，宽${rows}×${small}`,
        gridCut(n, 1),
      ),
      frame(
        '求周长数外边，求面积数格面',
        '格线藏在内部的部分不计入周长，面积按长乘宽。',
        `长${cols * small}；宽${rows * small}；面积${cols * rows * small * small}`,
        gridCut(n, 2),
      ),
    ],
    check(
      `小格边长${small}，一块横${cols}格、竖${rows}格，边长能直接用格数吗？`,
      '能，格数就是厘米数',
      '不能，格数还要乘每格边长',
      '格数说明有多少份，每份长度是小格边长。',
      gridCut(n, 2),
      gridCut(n, 2, true),
    ),
    check(
      '换数：大正方形边20，横竖各分2份，每个小正方形周长多少？',
      '20：20×4÷4',
      '40：边10，再乘4',
      '4块来自横竖各分2份，小边20÷2=10。',
      caption(
        [
          rect(100, 50, 160, 160, 'known'),
          line(180, 50, 180, 210, 'focus'),
          line(100, 130, 260, 130, 'focus'),
        ],
        '小边10，小周长40',
      ),
      caption([rect(100, 50, 160, 160, 'error')], '错：把边20除以面积份数4', 'error'),
    ),
  );
}

function sharedSides(stage: number, wrong = false): MethodNode[] {
  const s = 58,
    x = 113,
    y = 80;
  return caption(
    [
      ...Array.from({ length: 3 }, (_, i) => rect(x + i * s, y, s, s, 'known', '4')),
      ...(stage > 0
        ? [
            line(x + s, y, x + s, y + s, wrong ? 'error' : 'warm', true),
            line(x + 2 * s, y, x + 2 * s, y + s, wrong ? 'error' : 'warm', true),
          ]
        : []),
      ...(stage > 1
        ? [
            line(x, y, x + 3 * s, y, 'focus'),
            line(x + 3 * s, y, x + 3 * s, y + s, 'focus'),
            line(x + 3 * s, y + s, x, y + s, 'focus'),
            line(x, y + s, x, y, 'focus'),
          ]
        : []),
      text(200, 27, '3个边长4正方形排一行', 'known', 20),
    ],
    wrong
      ? '错：两条拼缝只减2×4'
      : stage === 0
        ? '原周长之和：3×16=48'
        : stage === 1
          ? '每条拼缝，左右两条边都藏起来'
          : '外周长48−2×2×4=32',
    wrong ? 'error' : 'focus',
  );
}
const sharedStory = lesson(
  '3个边长4厘米的正方形排一行，为什么不能把原周长直接相加？',
  [
    frame(
      '先看每块各有四条边',
      '分开数每块周长，3块共有12条小边。',
      '原周长之和=3×16=48厘米',
      sharedSides(0),
    ),
    frame(
      '找拼缝，成对去掉内部边',
      '两条拼缝，每处有两块纸各贡献一条边，合计藏4条小边。',
      '减少2×2×4=16厘米',
      sharedSides(1),
    ),
    frame('沿新外框核对', '新长方形长12、宽4，外周长32。', '48−16=32；(12+4)×2=32', sharedSides(2)),
  ],
  check(
    '3个边4正方形排一行，原周长48只减两条4，结果40，对吗？',
    '对，两条拼缝减两边',
    '不对，每条拼缝两侧都要减',
    '拼缝在内部，两个原来都外露的边同时消失。',
    sharedSides(2),
    sharedSides(2, true),
  ),
  check(
    '换数：3个同样正方形排一行，周长合计少24厘米，小边多长？',
    '12厘米：24÷2',
    '6厘米：24÷4',
    '两处拼缝共藏4条边，所以小边24÷4=6。',
    caption(
      [
        rect(38, 70, 108, 108, 'known', '6'),
        rect(146, 70, 108, 108, 'focus', '6'),
        rect(254, 70, 108, 108, 'known', '6'),
      ],
      '减少4条小边，24÷4=6',
    ),
    caption(
      [
        rect(38, 70, 108, 108, 'error', '12'),
        rect(146, 70, 108, 108, 'error', '12'),
        rect(254, 70, 108, 108, 'error', '12'),
      ],
      '错：每处只减一边',
      'error',
    ),
  ),
);

function hexModel(stage: number, transfer = false, wrong = false): MethodNode[] {
  const r = 28,
    dx = Math.sqrt(3) * r,
    centers = [
      [200 + dx, 100],
      [200 + dx / 2, 142],
      [200 - dx / 2, 142],
    ];
  if (stage > 0) centers.push(transfer ? [200 - dx * 1.5, 142] : [200, 100]);
  const edges = centers.flatMap(([x, y], i) =>
    outline(
      [
        [x, y - r],
        [x + dx / 2, y - r / 2],
        [x + dx / 2, y + r / 2],
        [x, y + r],
        [x - dx / 2, y + r / 2],
        [x - dx / 2, y - r / 2],
      ],
      i === 3 ? (wrong ? 'error' : 'focus') : 'known',
    ),
  );
  const edgeKey = (edge: MethodNode) => {
    if (edge.kind !== 'line') return '';
    return [
      [edge.x, edge.y],
      [edge.x2, edge.y2],
    ]
      .map((p) => p.map((n) => n.toFixed(3)).join(','))
      .sort()
      .join('|');
  };
  const counts = new Map<string, number>();
  edges.forEach((edge) => counts.set(edgeKey(edge), (counts.get(edgeKey(edge)) ?? 0) + 1));
  const visibleEdges =
    stage === 2 && !wrong ? edges.filter((edge) => counts.get(edgeKey(edge)) === 1) : edges;
  return caption(
    [
      ...visibleEdges,
      ...(stage === 1 && !transfer
        ? [
            line(200 + dx / 2, 86, 200 + dx / 2, 114, 'warm', true),
            line(200 + dx / 2, 114, 200, 128, 'warm', true),
            line(200, 128, 200 - dx / 2, 114, 'warm', true),
          ]
        : []),
      text(200, 27, '每个六边形有6条边，每条长1', 'known', 20),
    ],
    stage === 0
      ? '原图3块，外边合计14'
      : wrong
        ? '错：只减去一侧的公共边'
        : stage === 1
          ? '先贴新块，找到每处两条内部边'
          : transfer
            ? '新贴1处：14+6−2=18'
            : '新贴3处：14+6−3×2=14',
    wrong ? 'error' : 'focus',
  );
}
const hexStory = lesson(
  '原3个正六边形外周长14，每条边1。再补一块，为什么要看贴住几条边？',
  [
    frame('先沿原图外边数', '图里的公共边已藏起来，原外边合计14。', '原周长14厘米', hexModel(0)),
    frame(
      '数新块实际贴住的边',
      '这里新块和3个邻块各贴住1边，共3处公共边。',
      '新块有6边，贴住3处',
      hexModel(1),
    ),
    frame(
      '每处公共边，两边都从外周长消失',
      '增加新块6条边后，还要扣掉3对内部边。',
      '14+6−3×2=14厘米',
      hexModel(2),
    ),
  ],
  check(
    '原六边形拼图周长14，新块每边1厘米，贴住3条边，只扣3算17，对吗？',
    '对，贴住3条就减3',
    '不对，3处公共边要扣6',
    '每处有旧图的一条边和新块的一条边，都变成内部边。',
    hexModel(2),
    hexModel(2, false, true),
  ),
  check(
    '换拼法：原图周长14，新六边形每边1厘米，只贴住原图1条边，新周长多少？',
    '14，添一块总不变',
    '18：14+6−2',
    '拼接方式不同，公共边数量不同；1处只消去2条边。',
    hexModel(2, true),
    hexModel(2, true, true),
  ),
);

function crossRoad(stage: number, wrong = false): MethodNode[] {
  const s = 12,
    x = 92,
    y = 43,
    plotW = 8 * s,
    plotH = 6 * s;
  return caption(
    [
      ...(stage === 0
        ? [
            rect(x, y, 18 * s, 14 * s, 'known'),
            rect(x + 8 * s, y, 2 * s, 14 * s, wrong ? 'focus' : 'warm'),
            rect(x, y + 6 * s, 18 * s, 2 * s, 'warm'),
          ]
        : Array.from({ length: 4 }, (_, i) =>
            rect(
              104 + (i % 2) * plotW,
              52 + Math.floor(i / 2) * plotH,
              plotW,
              plotH,
              i === 0 ? 'focus' : 'known',
              stage === 2 ? '48' : undefined,
            ),
          )),
      text(200, 27, stage === 0 ? '18×14地面，十字带宽2' : '去掉横、竖各一条宽2的带', 'known', 20),
    ],
    wrong
      ? '错：只扣横带，漏了竖带'
      : stage === 0
        ? '十字带占两个方向，不只一条'
        : stage === 1
          ? '余下4块移近：总长16、总宽12'
          : '余面积16×12=192，每块48',
    wrong ? 'error' : 'focus',
  );
}
const crossStory = lesson(
  '18米×14米场地中间十字带宽2米，剩下4块一样大区域，每块面积怎样求？',
  [
    frame(
      '先看十字带占哪两个方向',
      '横带占去高2，竖带占去宽2，两处都要处理。',
      '长方向少2；宽方向也少2',
      crossRoad(0),
    ),
    frame(
      '把四块活动区移近',
      '移近不增加也不减少面积，合成16×12的长方形。',
      '剩余总面积=(18−2)×(14−2)=192',
      crossRoad(1),
    ),
    frame('再均分成四块', '192是4块合计，每块需要再除以4。', '192÷4=48平方米', crossRoad(2)),
  ],
  check(
    '18×14地面，十字带宽2，只扣一条横带就能求4块区域总面积吗？',
    '能，只要减18×2',
    '不能，另一个方向也少2',
    '只扣横带会把竖带的剩余部分当活动区。',
    crossRoad(2),
    crossRoad(0, true),
  ),
  check(
    '换数：20×12场地，十字带宽2，每块面积多少？',
    '50：只扣横带',
    '45：(20−2)×(12−2)÷4',
    '合并后的活动区长18宽10，总面积180，再分4块。',
    caption(
      [
        rect(92, 60, 216, 120, 'known'),
        line(200, 60, 200, 180, 'focus'),
        line(92, 120, 308, 120, 'focus'),
      ],
      '18×10÷4=45',
    ),
    caption([rect(80, 60, 240, 120, 'error')], '错：另一个方向没扣2', 'error'),
  ),
);

function fixedArea(stage: number, wrong = false): MethodNode[] {
  const pairs = [
    [1, 36],
    [2, 18],
    [3, 12],
    [4, 9],
    [6, 6],
  ];
  if (stage === 1)
    return pairs.flatMap(([a, b], i) => [
      text(65, 39 + i * 42, `${a}×${b}`, 'known', 19),
      rect(125, 18 + i * 42, (a + b) * 5, 30, i === 4 ? 'focus' : 'known'),
      text(352, 40 + i * 42, String(2 * (a + b)), i === 4 ? 'focus' : 'known', 20),
    ]);
  return caption(
    [
      ...Array.from({ length: 36 }, (_, i) =>
        rect(128 + (i % 6) * 24, 48 + Math.floor(i / 6) * 24, 24, 24, wrong ? 'error' : 'focus'),
      ),
      text(200, 27, '36个单位方格，面积始终36', 'known', 20),
    ],
    wrong
      ? '错：面积36就把周长也写36'
      : stage === 0
        ? '同样36格，排布可以改变外框'
        : '6×6最接近，周长24最短',
    wrong ? 'error' : 'focus',
  );
}
const fixedAreaStory = lesson(
  '36个边长1厘米方格拼成长方形或正方形，最短周长怎样找到？',
  [
    frame(
      '固定的是格数，不是周长',
      '每种拼法都用36格，比较的是外面一圈长度。',
      '面积都为36平方厘米',
      fixedArea(0),
    ),
    frame(
      '按整数边长有序列出拼法',
      '从1×36到6×6，每组都计算两长两宽，避免漏掉方案。',
      '周长依次74、40、30、26、24',
      fixedArea(1),
    ),
    frame(
      '保留最短方案，并用格子核对',
      '6行6列仍是36格，而外框最短。',
      '最短周长6×4=24厘米',
      fixedArea(2),
    ),
  ],
  check(
    '36个边长1厘米方格拼成6×6，能把面积36直接当周长36吗？',
    '能，格子总数就是周长',
    '不能，周长要数4条6',
    '面积数内部单位格，周长数外边，二者单位不同。',
    fixedArea(2),
    fixedArea(2, true),
  ),
  check(
    '换数：面积24，用整数边长拼长方形，最短方案是？',
    '1×24，周长50',
    '4×6，周长20',
    '有序比较1×24、2×12、3×8、4×6，最后一组周长最短；不一定能拼正方形。',
    caption([rect(92, 60, 216, 144, 'focus')], '4×6：周长(4+6)×2=20'),
    caption([rect(40, 100, 320, 24, 'error')], '1×24：周长50', 'error'),
  ),
);

function packing(total: number, stage: number, wrong = false): MethodNode[] {
  const s = 300 / total,
    x = 50,
    y = 72,
    cols = Math.floor(total / 5),
    r = total - cols * 5;
  const nodes: MethodNode[] = [
    rect(x, y, total * s, 6 * s, 'known'),
    text(200, 27, `布${total}×6，每块手帕5×3`, 'known', 20),
  ];
  if (stage > 0)
    for (let row = 0; row < 2; row++)
      for (let col = 0; col < cols; col++)
        nodes.push(rect(x + col * 5 * s, y + row * 3 * s, 5 * s, 3 * s, 'known'));
  if (stage > 1 && !wrong) nodes.push(rect(x + cols * 5 * s, y, 3 * s, 5 * s, 'focus'));
  else if (stage > 0)
    nodes.push(rect(x + cols * 5 * s, y, r * s, 6 * s, wrong ? 'error' : 'quiet', undefined, true));
  if (stage === 3 && !wrong)
    for (let i = 0; i < 3; i++) nodes.push(rect(x + (cols * 5 + i) * s, y + 5 * s, s, s, 'warm'));
  return caption(
    nodes,
    stage === 0
      ? `面积上限：${total * 6}÷15取整数`
      : stage === 1 || wrong
        ? `正放${cols * 2}块；余条${r}×6`
        : stage === 3
          ? '只余3平方厘米，放不下另一块15'
          : `余条转放1块，共${cols * 2 + 1}块`,
    wrong ? 'error' : 'focus',
  );
}
const packingStory = lesson(
  '18×6厘米的布，裁5×3厘米手帕，怎样证明最多能裁几块？',
  [
    frame(
      '先找不可能超过的面积上限',
      '每块15，总面积108，只够7块完整面积；8块面积已经超出。',
      '108÷15=7……3，最多不超过7',
      packing(18, 0),
    ),
    frame('先按同一方向排', '3列、2行先放6块，右边还剩3×6的窄条。', '3×2=6块', packing(18, 1)),
    frame(
      '把一块转90度，检查余条',
      '5×3旋转后是3×5，能放进3×6的余条，不能漏掉。',
      '6+1=7块',
      packing(18, 2),
    ),
    frame(
      '实际放得下，才能确定最多',
      '既没有超过7的可能，又实际排下7，所以最多7。',
      '可实现7=面积上限7',
      packing(18, 3),
    ),
  ],
  check(
    '18×6布裁5×3，正放6块后就结束了吗？',
    '结束，余条宽3放不下长5',
    '没结束，转成3×5还能放1块',
    '宽与长可以换方向。面积上限只能说明不能更多，还要找到实际拼法。',
    packing(18, 2),
    packing(18, 1, true),
  ),
  check(
    '换数：13×6布裁5×3，最多几块？',
    '4块，只排原方向',
    '5块：原方向4块，余条再转放1块',
    '总面积78，最多5块；余条3×6可再放3×5一块，5块可实现。',
    packing(13, 2),
    packing(13, 1, true),
  ),
);

function missingSide(stage: number, wrong = false): MethodNode[] {
  const s = 17.5,
    x = 112.5,
    y = 48;
  return caption(
    [
      rect(x, y, 10 * s, 8 * s, 'known'),
      rect(x + 6 * s, y, 4 * s, 5 * s, stage === 3 ? 'quiet' : 'warm', undefined, stage === 3),
      ...outline(
        [
          [x, y],
          [x + 6 * s, y],
          [x + 6 * s, y + 5 * s],
          [x + 10 * s, y + 5 * s],
          [x + 10 * s, y + 8 * s],
          [x, y + 8 * s],
        ],
        'focus',
      ),
      text(83, 120, '8', 'known', 22),
      text(332, 92, wrong ? '错当3' : stage === 0 ? '?' : '5', wrong ? 'error' : 'focus', 20),
      text(332, 168, '3', 'known', 20),
      text(200, 27, '外框10×8；缺角宽4', 'known', 20),
    ],
    wrong
      ? '错：把下面的3当缺口高'
      : stage === 0
        ? '整高8由缺口高与下段3组成'
        : stage === 1
          ? '缺口高8−3=5'
          : stage === 2
            ? '缺口面积4×5=20'
            : '剩余面积80−20=60',
    wrong ? 'error' : 'focus',
  );
}
const missingSideStory = lesson(
  'L形外框10×8厘米，右上缺角宽4，右下剩高3，怎样求面积？',
  [
    frame(
      '先把缺口高和下段高分开',
      '左侧整高8与右侧两段合起来一样高，3只是下面一段。',
      '缺口高+3=8',
      missingSide(0),
    ),
    frame('用整段减去已知一段', '从8里扣掉下面3，缺口高为5。', '缺口高=8−3=5厘米', missingSide(1)),
    frame('求真正拿走的那一块', '缺口宽4、高5，面积20。', '4×5=20平方厘米', missingSide(2)),
    frame(
      '补成外框，再扣缺角',
      '外框面积80，缺口20，留下60。',
      '10×8−4×5=60平方厘米',
      missingSide(3),
    ),
  ],
  check(
    'L形外框10×8，右上缺宽4，右下剩高3，缺角也能直接按高3算吗？',
    '能，看到3就用3',
    '不能，缺角高是整高8减3',
    '3表示留下的下段，不是拿走的上段。两段合起来必须等于8。',
    missingSide(3),
    missingSide(1, true),
  ),
  check(
    '换数：外框8×7，右上缺宽2，右下高4，剩余面积多少？',
    '48：56−2×4',
    '50：56−2×(7−4)',
    '先求缺口高3，再扣面积6，得到50。',
    caption(
      [rect(100, 48, 200, 150, 'known'), rect(250, 48, 50, 64, 'warm')],
      '缺高7−4=3；56−6=50',
    ),
    caption(
      [rect(100, 48, 200, 150, 'known'), rect(250, 48, 50, 85, 'error')],
      '错把下段4当缺口高',
      'error',
    ),
  ),
);

function sumSides(stage: number, wrong = false): MethodNode[] {
  return caption(
    [
      rect(110, 35, 180, 180, 'quiet'),
      rect(110, 35, 67.5, 67.5, 'known', stage > 0 ? '甲边' : '?'),
      rect(177.5, 102.5, 112.5, 112.5, 'focus', stage > 0 ? '乙边' : '?'),
      line(110, 215, 290, 215, wrong ? 'error' : 'focus'),
      text(200, 27, '外框一边=甲边+乙边', 'known', 20),
    ],
    wrong
      ? '错：周长和32直接当大边'
      : stage === 0
        ? '两小正方形周长和32'
        : stage === 1
          ? '4组(甲边+乙边)=32'
          : '大边32÷4=8；面积8×8=64',
    wrong ? 'error' : 'focus',
  );
}
const sumSidesStory = lesson(
  '大正方形一边由两个小正方形边长拼成，小正方形周长和32，怎样求大正方形面积？',
  [
    frame(
      '把大边与两条小边对应起来',
      '图中的一条大边，正好是一条小正方形边加另一条。',
      '大边=两条小边之和',
      sumSides(0),
    ),
    frame(
      '周长和里有四组这样的边',
      '每个小正方形周长都是4条自身边，合起来就是4组大小边之和。',
      '大边=32÷4=8厘米',
      sumSides(1),
    ),
    frame('从边长转到面积', '得到的是边长8，求面积还要乘另一个8。', '8×8=64平方厘米', sumSides(2)),
  ],
  check(
    '大正方形一边由两小正方形的边拼成，两小周长和32，大正方形边长就是32吗？',
    '是，32就是一条大边',
    '不是，32里有4组大边',
    '把两个小周长的每一组对应到大正方形一边，需要先除以4。',
    sumSides(2),
    sumSides(2, true),
  ),
  check(
    '换数：两个小周长和40，大边是两小边之和，大面积多少？',
    '1600：40×40',
    '100：(40÷4)×(40÷4)',
    '先从周长和求出大边10，再求面积100。',
    caption([rect(120, 50, 160, 160, 'focus', '10×10')], '40÷4=10；面积100'),
    caption([rect(120, 50, 160, 160, 'error', '40×40')], '错：周长和不是一条边', 'error'),
  ),
);

function positionedCut(
  place: 'corner' | 'notch' | 'hole',
  stage = 2,
  cutWidth = 2,
  depth = 2,
  wrong = false,
): MethodNode[] {
  const s = 23,
    x = 85,
    y = 50,
    w = 10 * s,
    h = 6 * s,
    cw = cutWidth * s,
    ch = depth * s,
    cx = place === 'corner' ? x + w - cw : x + (w - cw) / 2,
    cy = place === 'hole' ? y + (h - ch) / 2 : y;
  const outer = [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ],
    boundary =
      place === 'corner'
        ? [
            [x, y],
            [cx, y],
            [cx, y + ch],
            [x + w, y + ch],
            [x + w, y + h],
            [x, y + h],
          ]
        : place === 'notch'
          ? [
              [x, y],
              [cx, y],
              [cx, y + ch],
              [cx + cw, y + ch],
              [cx + cw, y],
              [x + w, y],
              [x + w, y + h],
              [x, y + h],
            ]
          : outer;
  const nodes: MethodNode[] = [
    rect(x, y, w, h, 'known'),
    rect(cx, cy, cw, ch, stage === 0 ? 'error' : 'quiet', undefined, stage === 0),
    ...outline(stage === 0 ? outer : boundary, stage === 2 ? 'focus' : 'known'),
    text(200, 27, `10×6纸，去掉${cutWidth}×${depth}`, 'known', 20),
  ];
  if (stage > 0) {
    if (place === 'hole')
      nodes.push(
        ...outline(
          [
            [cx, cy],
            [cx + cw, cy],
            [cx + cw, cy + ch],
            [cx, cy + ch],
          ],
          wrong ? 'error' : 'focus',
        ),
      );
    else {
      nodes.push(line(cx, y, cx + cw, y, 'error', true));
      nodes.push(line(cx, y, cx, y + ch, 'focus'), line(cx, y + ch, cx + cw, y + ch, 'focus'));
      if (place === 'notch') nodes.push(line(cx + cw, y + ch, cx + cw, y, 'focus'));
    }
  }
  const p = 32 + (place === 'corner' ? 0 : place === 'notch' ? 2 * depth : 2 * (cutWidth + depth));
  return caption(
    nodes,
    wrong
      ? '错：只看面积，就说周长都一样'
      : stage === 0
        ? '先标拿走的面，原外框仍完整'
        : place === 'corner'
          ? `剪角：新旧两边补平，周长${p}`
          : place === 'notch'
            ? `开口：多2条深${depth}，周长${p}`
            : `挖洞：洞边也要计入，周长${p}`,
    wrong ? 'error' : 'focus',
  );
}
const notchStory = lesson(
  '10×6厘米纸，从上边中间挖去宽2、深2的凹口，周长和面积如何变化？',
  [
    frame(
      '先认缺口宽和深',
      '宽2沿原来的上边，深2是往纸里走的距离，两个方向分开。',
      '原周长32；原面积60',
      positionedCut('notch', 0),
    ),
    frame(
      '底边替掉旧边，多出两条深边',
      '旧上边少2，凹口底边补2，二者相抵；另出现两条2厘米的深边。',
      '周长增加2×2=4厘米',
      positionedCut('notch', 1),
    ),
    frame(
      '周长和面积各算各的',
      '外周长变长，留下的纸面变少。',
      '新周长32+4=36；剩余面积60−4=56',
      positionedCut('notch', 2),
    ),
  ],
  check(
    '10×6纸挖宽2深2凹口，周长还保持32吗？',
    '是，剪去一块周长都不变',
    '不是，多两条深边，变36',
    '角切和边中开口不同；开口额外露出两条深边。',
    positionedCut('notch', 2),
    positionedCut('notch', 2, 2, 2, true),
  ),
  check(
    '换深度：10×6纸开宽1深4凹口，周长多少？',
    '34：增加两条宽1',
    '40：增加两条深4',
    '开口宽与新底边相抵，决定周长增加量的是两条深。',
    positionedCut('notch', 2, 1, 4),
    positionedCut('notch', 2, 1, 4, true),
  ),
);
const positionStory = lesson(
  '同样10×6厘米纸，都拿走面积4的小块，剪角、边上开口和内部挖洞，周长相同吗？',
  [
    frame(
      '剪角：少的两边被新边补平',
      '角上拿走2×2，新旧边各为2+2，周长仍32。',
      '剪角：周长32；面积56',
      positionedCut('corner'),
    ),
    frame(
      '挖内部洞：外框一条没少',
      '外框仍32，洞周围另外出现4条2厘米边。',
      '内部洞：周长32+8=40；面积56',
      positionedCut('hole'),
    ),
    frame(
      '边上开口：只增加两条深边',
      '旧宽2被新底宽2替换，只多两条深2。',
      '边上开口：周长32+4=36；面积56',
      positionedCut('notch'),
    ),
    frame(
      '面积相同，缺口越深可露出越长边',
      '把2×2换成1×4，拿走面积仍4，但新增两条深4。',
      '深4开口：周长40；面积仍56',
      positionedCut('notch', 2, 1, 4),
    ),
  ],
  check(
    '三张10×6纸分别剪角2×2、挖内部2×2方孔、边上开2×2凹口，周长一定相同吗？',
    '相同，剪去面积都为4',
    '不同，要分别看新旧边',
    '面积统计拿走的面，周长统计边界；位置改变会让不同数量的新边露出。',
    positionedCut('hole'),
    positionedCut('corner', 2, 2, 2, true),
  ),
  check(
    '10×6纸，2×2凹口与1×4凹口面积相同，哪个周长更长？',
    '一样长，开口面积都是4',
    '深4的更长，多出8而不是4',
    '新增的是两条深边；不能用开口面积或宽替代深。',
    positionedCut('notch', 2, 1, 4),
    positionedCut('notch', 2, 2, 2, true),
  ),
);

function joinOptions(a: number, b: number, stage: number, wrong = false): MethodNode[] {
  const s = 15;
  return caption(
    [
      ...(stage === 0
        ? [rect(40, 70, a * s, b * s, 'known'), rect(240, 70, a * s, b * s, 'known')]
        : stage === 1
          ? [
              rect(80, 75, a * s, b * s, 'known'),
              rect(80 + a * s, 75, a * s, b * s, 'focus'),
              line(80 + a * s, 75, 80 + a * s, 75 + b * s, 'warm', true),
            ]
          : [
              rect(140, 45, a * s, b * s, 'known'),
              rect(140, 45 + b * s, a * s, b * s, 'focus'),
              line(140, 45 + b * s, 140 + a * s, 45 + b * s, 'warm', true),
            ]),
      text(200, 27, `两张${a}×${b}纸，拼法要说清`, 'known', 20),
    ],
    wrong
      ? '错：面积相同就认定周长相同'
      : stage === 0
        ? `总面积${a * b * 2}，可以选两种接边`
        : stage === 1
          ? `沿${b}边拼：${2 * a}×${b}，周长${2 * (2 * a + b)}`
          : `沿${a}边拼：${a}×${2 * b}，周长${2 * (a + 2 * b)}`,
    wrong ? 'error' : 'focus',
  );
}
const joinOptionsStory = lesson(
  '两张8×5厘米长方形拼成一个大长方形，为什么周长有两种结果？',
  [
    frame(
      '两块相同，接边却可以选',
      '拼接后不能重叠，也不能留缝。沿长边和沿短边拼都能组成长方形。',
      '面积都是8×5×2=80',
      joinOptions(8, 5, 0),
    ),
    frame(
      '沿短边5拼，长变成两倍',
      '宽仍5，长变16；两条5厘米公共边藏到内部。',
      '周长=(16+5)×2=42',
      joinOptions(8, 5, 1),
    ),
    frame(
      '沿长边8拼，宽变成两倍',
      '长仍8，宽变10；这次藏进内部的是两条8厘米边。',
      '周长=(8+10)×2=36',
      joinOptions(8, 5, 2),
    ),
  ],
  check(
    '两张8×5纸拼长方形，面积都是80，所以周长都42吗？',
    '是，面积一样周长也一样',
    '不是，接长边或短边得到36或42',
    '两种接边把不同长度的边藏在内部，外周长不同。',
    joinOptions(8, 5, 2),
    joinOptions(8, 5, 2, true),
  ),
  check(
    '换数：两张6×4纸，沿6厘米长边拼，周长多少？',
    '32：仍按沿短边拼',
    '28：新尺寸6×8',
    '沿长边拼时，另一方向4变8，不是把长6变12。',
    joinOptions(6, 4, 2),
    joinOptions(6, 4, 1, true),
  ),
);

const areaRemoveStory: MethodStory = {
  ...unit12Stories['u2-cut'],
  prompt: '整块12×8厘米纸，拿走4×3厘米小块，剩余面积怎样求？',
  frames: [
    ...unit12Stories['u2-cut'].frames.slice(0, 2),
    frame(
      '把拿走与留下的面合起来复核',
      '原面积必须等于两部分之和。位置可变，面积仍按拿走了多少来扣。',
      '84+12=96平方厘米',
      caption(
        [rect(40, 85, 280, 90, 'known', '84'), rect(320, 85, 40, 90, 'warm', '12')],
        '留下84+拿走12=原来96',
      ),
    ),
  ],
  mistake: check(
    '12×8纸拿走4×3小块，能算(12−4)×(8−3)吗？',
    '能，两个边长都减掉',
    '不能，应算12×8−4×3',
    '把两边分别减，会把整条纸都扣掉；实际只拿走4乘3这一块。',
    unit12Stories['u2-cut'].frames[1].nodes,
    caption(
      [
        rect(60, 55, 280, 140, 'known'),
        rect(60, 55, 93, 140, 'error'),
        rect(60, 142, 280, 53, 'error'),
      ],
      '错：把整条都扣掉了',
      'error',
    ),
  ),
  transfer: check(
    '换数：8×6的墙面，黑板面积4，不刷的只有黑板，粉刷面积多少？',
    '20平方米：48−(8+6)×2',
    '44平方米：48−4',
    '这里扣的是黑板覆盖的面积，不能拿周长去减面积。',
    caption(
      [
        text(200, 28, '整面墙48平方米', 'known', 20),
        rect(104, 50, 192, 144, 'known'),
        rect(200, 98, 48, 48, 'warm', '4'),
      ],
      '48−4=44平方米',
    ),
    caption([rect(72, 50, 256, 144, 'error')], '错：用周长28去减面积48', 'error'),
  ),
};
const restoreAreaStory = lesson(
  '长方形空地宽8米，分出一个最大正方形，余下40平方米，怎样求原面积？',
  [
    frame(
      '最大正方形边长来自原短边',
      '正方形要完整装进长方形，边长为宽8。',
      '正方形边长8米',
      caption(
        [rect(70, 55, 160, 160, 'known', '边8'), rect(230, 55, 100, 160, 'warm', '余40')],
        '原纸由正方形与余料组成',
      ),
    ),
    frame(
      '先求分出的正方形面积',
      '已知8是边长，需要乘另一个8才是正方形面积。',
      '8×8=64平方米',
      caption(
        [rect(70, 55, 160, 160, 'focus', '64'), rect(230, 55, 100, 160, 'known', '40')],
        '分出的面积64；余下面积40',
      ),
    ),
    frame(
      '求原来，把两部分加回去',
      '原地块包含两块，不能再减去余下部分。',
      '原面积=64+40=104平方米',
      caption(
        [rect(70, 55, 160, 160, 'focus', '64'), rect(230, 55, 100, 160, 'focus', '40')],
        '64+40=104平方米',
      ),
    ),
  ],
  check(
    '宽8，最大正方形面积64，余料40，求原面积能算64−40吗？',
    '能，剩余要用减法',
    '不能，求原来要把两部分相加',
    '40是正方形外剩下的另一块，不是从正方形里面拿走的面积。',
    caption(
      [rect(70, 55, 160, 160, 'known', '64'), rect(230, 55, 100, 160, 'focus', '40')],
      '原面积64+40=104',
    ),
    caption(
      [rect(70, 55, 160, 160, 'known', '64'), rect(170, 55, 100, 160, 'error', '误减40')],
      '错：把余料压到正方形里扣',
      'error',
    ),
  ),
  check(
    '换数：地宽6，最大正方形外余24平方米，原面积多少？',
    '12：36−24',
    '60：36+24',
    '正方形36与余料24并排组成原地块。',
    caption(
      [rect(80, 55, 144, 144, 'known', '36'), rect(224, 55, 96, 144, 'focus', '24')],
      '36+24=60',
    ),
    caption(
      [
        rect(80, 55, 144, 144, 'known'),
        text(104, 127, '36', 'known', 22),
        rect(128, 55, 96, 144, 'error', '误减24'),
      ],
      '错：把外面的余料当成剪掉的',
      'error',
    ),
  ),
);

function stripArea(stage: number, high = 1, wrong = false): MethodNode[] {
  const widths = [1, 2, 1, 2],
    nodes: MethodNode[] = [];
  if (stage === 0) {
    for (let i = 0; i < 24; i++)
      nodes.push(rect(110 + (i % 6) * 30, 50 + Math.floor(i / 6) * 30, 30, 30, 'quiet'));
    [
      [0, 0, 1],
      [2, 1, 2],
      [1, 2, 1],
      [4, 3, 2],
    ].forEach(([col, row, n]) =>
      nodes.push(rect(110 + col * 30, 50 + row * 30, n * 30, 30, 'focus')),
    );
  } else {
    let x = 110;
    for (const width of widths) {
      nodes.push(rect(x, 95, width * 30, high * 30, 'focus', String(width)));
      x += width * 30;
    }
    if (stage === 2)
      nodes.push(
        ...outline(
          [
            [110, 95],
            [290, 95],
            [290, 95 + high * 30],
            [110, 95 + high * 30],
          ],
          wrong ? 'error' : 'focus',
        ),
      );
  }
  return caption(
    [...nodes, text(200, 27, `每段高${high}，宽1、2、1、2`, 'known', 20)],
    wrong
      ? '错：只加宽度，漏掉共同的高'
      : stage === 0
        ? '只拿阴影，不把整张纸都算上'
        : stage === 1
          ? '水平移动，首尾相接不重不漏'
          : `总宽6×高${high}，面积${6 * high}`,
    wrong ? 'error' : 'focus',
  );
}
const stripStory = lesson(
  '阴影每段高1厘米，宽依次1、2、1、2厘米，平移后面积怎样求？',
  [
    frame(
      '只认真正涂色的部分',
      '背景格子不是阴影，不能把整个长方形面积都算进去。',
      '阴影宽分别1、2、1、2；高都1',
      stripArea(0),
    ),
    frame(
      '把同高的阴影首尾接到一行',
      '只平移，不重叠也不漏，阴影覆盖量不变。',
      '合起来的宽=1+2+1+2=6厘米',
      stripArea(1),
    ),
    frame(
      '用合成条的长与宽求面积',
      '高度仍1，不是原来整张纸的4行。',
      '6×1=6平方厘米',
      stripArea(2),
    ),
  ],
  check(
    '6×4纸上四条阴影高1、宽1、2、1、2，平移后能把整张纸都算阴影吗？',
    '能，背景也是纸',
    '不能，只移动和统计涂色部分',
    '平移保持的是阴影面积，不会把原来没涂色的格子也算进来。',
    stripArea(2),
    caption([rect(110, 50, 180, 120, 'error', '24')], '错：把未涂色背景也算进去了', 'error'),
  ),
  check(
    '换数：四条阴影高都为2，宽依次1、2、1、2，面积多少？',
    '6：只把宽加起来',
    '12：总宽6乘共同高2',
    '同高的条可以接起来，但面积还要乘共同的高。',
    stripArea(2, 2),
    stripArea(2, 2, true),
  ),
);

const overlapPerimeterStory: MethodStory = {
  ...overlapStory,
  prompt: '8×6与6×5两张纸在角上重叠3×3，合并成阶梯形，面积和周长怎样分开求？',
  frames: [
    ...overlapStory.frames.slice(0, 2),
    frame(
      '求周长，改沿合并后的外框',
      '共同部分的面积9不能直接当长度扣。把各段水平、竖直边分别平移合并。',
      '水平总跨度8+6−3=11；竖直6+5−3=8',
      caption(
        [
          ...outline(
            [
              [70, 55],
              [214, 55],
              [214, 109],
              [268, 109],
              [268, 199],
              [160, 199],
              [160, 163],
              [70, 163],
            ],
            'focus',
          ),
          text(200, 27, '沿真实外边走，不走重叠内部边', 'known', 20),
        ],
        '水平合计22；竖直合计16',
      ),
    ),
    frame(
      '分别核对两种不同的量',
      '面积去掉一次重叠面，周长把外面一圈边长相加。',
      '面积69平方厘米；周长2×(11+8)=38厘米',
      caption(
        [
          rect(70, 55, 144, 108, 'known'),
          rect(160, 109, 108, 90, 'focus'),
          ...outline(
            [
              [70, 55],
              [214, 55],
              [214, 109],
              [268, 109],
              [268, 199],
              [160, 199],
              [160, 163],
              [70, 163],
            ],
            'focus',
          ),
        ],
        '面积69；周长38，单位不同',
      ),
    ),
  ],
  mistake: check(
    '8×6与6×5纸在角上重叠3×3，能用两周长和50减重叠面积9求合并周长吗？',
    '能，从周长和减重叠面积',
    '不能，面积9不是一段边长',
    '重叠面积是平方厘米，周长是厘米；应沿外边或按水平、竖直跨度合并。',
    caption(
      [
        ...outline(
          [
            [70, 55],
            [214, 55],
            [214, 109],
            [268, 109],
            [268, 199],
            [160, 199],
            [160, 163],
            [70, 163],
          ],
          'focus',
        ),
      ],
      '水平22+竖直16=38',
    ),
    caption(
      [rect(70, 55, 144, 108, 'error'), rect(160, 109, 108, 90, 'error')],
      '错：用面积9去减长度50',
      'error',
    ),
  ),
  transfer: check(
    '换图：两张7×4纸一横一竖，角上重叠4×4形成L形，周长多少？',
    '44：两块周长直接相加',
    '28：外边可平移成7×7外框',
    '重叠后的内部边不再计入周长；外边横向总14、竖向总14。',
    caption(
      [
        ...outline(
          [
            [90, 55],
            [230, 55],
            [230, 135],
            [170, 135],
            [170, 195],
            [90, 195],
          ],
          'focus',
        ),
      ],
      '周长14+14=28厘米',
    ),
    caption(
      [rect(90, 55, 140, 80, 'error'), rect(90, 55, 80, 140, 'error')],
      '错：内部边也重复数了',
      'error',
    ),
  ),
};

export const cutSubskillStories: Record<string, MethodStory> = {
  'cut-corner': unit12Stories['u2-cut'],
  'cut-tiling': unit12Stories['u2-tiling'],
  'cut-join': sharedStory,
  'cut-bump': bumpStory,
  'cut-max-square': maxSquareStory,
  'cut-midpoints': midpointStory,
  'cut-ring': ringStory,
  'cut-unknown-area': unknownStory,
  'cut-overlap': overlapStory,
  'cut-area-rearrange': diagonalStory,
  'cut-zigzag': zigzagStory,
  'cut-fold': foldStory,
  'cut-reverse-squares': reverseStory,
  'cut-quarter': partitionStory(2),
  'cut-grid-piece': partitionStory(4),
  'cut-hex-join': hexStory,
  'cut-cross-road': crossStory,
  'cut-fixed-area': fixedAreaStory,
  'cut-rotate-packing': packingStory,
  'cut-missing-side': missingSideStory,
  'cut-sum-square-sides': sumSidesStory,
  'cut-partial-product': unit56Stories['u6-written'],
  'cut-notch': notchStory,
  'cut-position-compare': positionStory,
  'cut-join-options': joinOptionsStory,
  'cut-area-remove': areaRemoveStory,
  'cut-area-restore': restoreAreaStory,
  'cut-strip-area': stripStory,
  'cut-overlap-perimeter': overlapPerimeterStory,
};

export const cutQuestionSubskills: Record<string, string> = {
  'full-p01-s2-q4': 'cut-max-square',
  'full-p01-s3-q1-3': 'cut-bump',
  'full-p01-s3-q2-3': 'cut-area-remove',
  'full-p01-s5-q1': 'cut-max-square',
  'full-p01-s5-q3': 'cut-join-options',
  'full-p02-s1-q4': 'cut-tiling',
  'full-p02-s1-q9': 'cut-midpoints',
  'full-p02-s1-q10': 'cut-ring',
  'full-p02-s2-q2-2': 'cut-unknown-area',
  'full-p02-s3-q12': 'cut-overlap',
  'full-p02-s3-q13': 'cut-sum-square-sides',
  'full-p02-s5-q2': 'cut-quarter',
  'full-p02-s5-q5': 'cut-max-square',
  'full-p05-s1-q5': 'cut-tiling',
  'full-p05-s1-q7': 'cut-join',
  'full-p05-s2-q4': 'cut-position-compare',
  'full-p05-s2-q5': 'cut-strip-area',
  'full-p05-s3-q3': 'cut-bump',
  'full-p10-s1-q6': 'cut-reverse-squares',
  'full-p10-s1-q8': 'cut-area-rearrange',
  'full-p10-s1-q9': 'cut-overlap-perimeter',
  'full-p10-s1-q10': 'cut-hex-join',
  'full-p10-s2-q5': 'cut-partial-product',
  'full-p10-s2-q7': 'cut-corner',
  'full-p10-s3-q2': 'cut-notch',
  'full-p10-s5-q3': 'cut-join-options',
  'full-p10-s5-q5': 'cut-cross-road',
  'full-p15-s1-q5': 'cut-grid-piece',
  'full-p15-s1-q6': 'cut-fold',
  'full-p15-s2-q5': 'cut-overlap',
  'full-p15-s2-q7': 'cut-position-compare',
  'full-p15-s2-q8': 'cut-join',
  'full-p15-s3-q3': 'cut-corner',
  'full-p15-s5-q1': 'cut-area-remove',
  'full-p16-s1-q9': 'cut-position-compare',
  'full-p18-q6': 'cut-zigzag',
  'full-p18-q20': 'cut-fold',
  'full-p18-q22-1': 'cut-area-remove',
  'full-p18-q22-2': 'cut-missing-side',
  'full-p18-q30-2': 'cut-area-restore',
  'full-p01-s1-q6': 'cut-join',
  'full-p18-q32': 'cut-rotate-packing',
  'u2-08': 'cut-area-remove',
  'u2-17': 'cut-fixed-area',
  'u2-19': 'cut-join',
};
