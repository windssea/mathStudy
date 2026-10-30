import {
  frame,
  line,
  rect,
  text,
  type MethodNode,
  type MethodStory,
  type MethodTone,
} from './method-primitives';

/** A bounded, individually reviewed list; no question is classified by a runtime keyword guess. */
export const priorityQuestionSubskills: Record<string, Record<string, string>> = {
  'u2-fence': { 'full-p10-s5-q2': 'priority-two-walls' },
  'u3-journey': {
    'bank-u3-journey-02': 'priority-segment-distances',
    'bank-u3-journey-04': 'priority-deadline-speed',
  },
  'u4-model': { 'bank-u4-model-05': 'priority-combine-then-group' },
  'u1-loading': {
    'full-p04-s3-q4': 'priority-threshold-discount',
    'full-p06-s4-q5': 'priority-budget-gift',
  },
};

const caption = (
  nodes: MethodNode[],
  message: string,
  tone: MethodTone = 'focus',
): MethodNode[] => [...nodes, text(200, 237, message, tone, 20)];
function band(
  parts: { value: number; label?: string; tone?: MethodTone }[],
  y = 80,
  h = 60,
): MethodNode[] {
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  let x = 24;
  return parts.map((part) => {
    const width = (352 * part.value) / total;
    const node = rect(x, y, width - Math.min(2, width / 8), h, part.tone ?? 'known', part.label);
    x += width;
    return node;
  });
}

function cornerFence(fence: number, length: number, stage: number, wrong = false): MethodNode[] {
  const width = (fence - length) / (wrong ? 2 : 1),
    s = Math.min(216 / length, 144 / width),
    x = (400 - length * s) / 2,
    y = 58,
    right = x + length * s,
    bottom = y + width * s;
  return caption(
    [
      rect(x, y, length * s, width * s, stage === 2 ? 'focus' : 'quiet'),
      line(x, y, right, y, 'known', true),
      line(x, y, x, bottom, wrong ? 'error' : 'known', true),
      line(x, bottom, right, bottom, 'focus'),
      line(right, y, right, bottom, 'focus'),
      text(200, 27, '墙角两边靠墙，只围另外两边', 'known', 20),
      text(200, bottom - 15, `长${length}米`, 'known', 20),
      text(
        right + 38,
        y + (width * s) / 2,
        stage === 0 ? '宽?' : `宽${width}`,
        wrong ? 'error' : 'focus',
        20,
      ),
    ],
    wrong
      ? '错把靠墙的一边也算进篱笆'
      : stage === 0
        ? `篱笆${fence}＝一条长＋一条宽`
        : stage === 1
          ? `另一边${fence}−${length}＝${width}米`
          : `面积${length}×${width}＝${length * width}平方米`,
    wrong ? 'error' : 'focus',
  );
}
const twoWalls: MethodStory = {
  prompt: '墙角有相邻两边可作围墙，篱笆长20米，一边长12米。面积多少？每平方米养5只，能养多少只？',
  frames: [
    frame(
      '先排除两条靠墙边',
      '上边和左边已有墙。20米篱笆只用于下面的一条长和右边的一条宽。',
      '一条长＋一条宽＝20米',
      cornerFence(20, 12, 0),
    ),
    frame(
      '篱笆扣掉一条长，就剩一条宽',
      '右边只出现一条需要围的宽，不要再除以2。',
      '宽＝20−12＝8米',
      cornerFence(20, 12, 1),
    ),
    frame(
      '得到长宽后，再求覆盖面积',
      '面积数的是内部的面，用长乘宽；20米只是一部分外边长度。',
      '12×8＝96平方米',
      cornerFence(20, 12, 2),
    ),
    frame(
      '每平方米的数量复制96份',
      '每1平方米可以养5只，96平方米就有96份5只。',
      '96×5＝480只',
      caption(
        [
          text(200, 27, '面积96平方米；每平方米5只', 'known', 20),
          rect(30, 75, 135, 96, 'known', '96㎡'),
          rect(240, 73, 100, 100, 'focus'),
          ...[
            [263, 98],
            [290, 98],
            [317, 98],
            [276, 143],
            [303, 143],
          ].map(([x, y]): MethodNode => ({ kind: 'dot', x, y, tone: 'focus' })),
          text(290, 205, '每1㎡5只', 'focus', 20),
        ],
        '96份5只，一共480只',
      ),
    ),
  ],
  mistake: {
    question: '墙角两边靠墙，篱笆20米，一边12米。另一边要用(20−12)÷2求吗？',
    wrong: '要，另一边是4米',
    right: '不要，只围一条宽，另一边是8米',
    why: '这里有两条相邻的墙，篱笆只用在另外两边。减去12后剩的8米就是一条完整的宽，除以2会把它少算一半。',
    nodes: cornerFence(20, 12, 1),
    wrongNodes: cornerFence(20, 12, 1, true),
  },
  transfer: {
    question: '换数：同样利用墙角两边，篱笆26米，一边16米，围成面积多少平方米？',
    wrong: '80：把剩下10米又除以2',
    right: '160：另一边10米，16×10',
    why: '26−16=10是一条宽，不是两条宽的合计。面积16×10=160。',
    nodes: cornerFence(26, 16, 2),
    wrongNodes: cornerFence(26, 16, 2, true),
  },
};

function segmentBoxes(
  a: number,
  first: number,
  b: number,
  second: number,
  stage: number,
  wrong = false,
): MethodNode[] {
  const count = first + second,
    width = 352 / count;
  return caption(
    [
      text(200, 27, `每框1小时：前${first}时${a}，后${second}时${b}`, 'known', 20),
      ...Array.from({ length: count }, (_, index) =>
        rect(
          24 + index * width,
          80,
          width - 3,
          66,
          index < first ? 'known' : wrong ? 'error' : stage === 0 ? 'quiet' : 'focus',
          index < first || wrong ? String(a) : stage === 0 ? '?' : String(b),
        ),
      ),
    ],
    wrong
      ? `错把后段也用${a}，多算${(a - b) * second}千米`
      : stage === 0
        ? `前段${a}×${first}＝${a * first}千米`
        : `后段${b}×${second}＝${b * second}千米`,
    wrong ? 'error' : 'focus',
  );
}
const segmentDistances: MethodStory = {
  prompt: '汽车先以48千米/时走3小时，再以36千米/时走2小时，全程多少千米？',
  frames: [
    frame(
      '前段只配前段速度与时间',
      '前三框每框1小时，每小时走48千米，这段一共144千米。',
      '48×3＝144千米',
      segmentBoxes(48, 3, 36, 2, 0),
    ),
    frame(
      '换速后，另用后段条件',
      '后两小时每小时只走36千米，不能继续把每个框写成48。',
      '36×2＝72千米',
      segmentBoxes(48, 3, 36, 2, 1),
    ),
    frame(
      '两段都换成路程后再合并',
      '144和72都是千米，拼在一起才是全程。时间能相加，速度却不能任选一个套全程。',
      '144＋72＝216千米',
      caption(
        [
          text(200, 27, '两段首尾相接，单位都是千米', 'known', 20),
          ...band([
            { value: 144, label: '144' },
            { value: 72, label: '72', tone: 'focus' },
          ]),
        ],
        '全程216千米',
      ),
    ),
  ],
  mistake: {
    question: '先48千米/时走3小时，再36千米/时走2小时，可以用48×5求全程吗？',
    wrong: '可以，5小时都按48算',
    right: '不可以，后2小时必须按36算',
    why: '后2小时各少走12千米。都乘48会多算24千米，算成240；正确是144+72=216。',
    nodes: segmentBoxes(48, 3, 36, 2, 1),
    wrongNodes: segmentBoxes(48, 3, 36, 2, 1, true),
  },
  transfer: {
    question: '换数：先以50千米/时走2小时，再以40千米/时走3小时，全程多少千米？',
    wrong: '250：全程5小时都乘50',
    right: '220：50×2＋40×3',
    why: '前段100千米，后段120千米，共220。后段不能沿用前段速度。',
    nodes: caption(
      [
        ...band([
          { value: 100, label: '100' },
          { value: 120, label: '120', tone: 'focus' },
        ]),
      ],
      '100＋120＝220千米',
    ),
    wrongNodes: segmentBoxes(50, 2, 40, 3, 1, true),
  },
};

function distanceLeft(total: number, walked: number): MethodNode[] {
  return caption(
    [
      text(200, 27, `全程${total}米，先扣已走的路`, 'known', 20),
      ...band([
        { value: walked, label: `已走${walked}` },
        { value: total - walked, label: `剩${total - walked}`, tone: 'focus' },
      ]),
    ],
    `后段还有${total - walked}米`,
  );
}
function deadlineStrip(limit: number, first: number, rest: number, wrong = false): MethodNode[] {
  const available = limit - first - (wrong ? 0 : rest),
    shown = first + rest + available,
    x = 24 + (352 * limit) / shown;
  return caption(
    [
      text(200, 27, `出发后${limit}分钟内，休息也计时`, 'known', 20),
      ...band([
        { value: first, label: `先走${first}` },
        { value: rest, label: `休${rest}`, tone: 'warm' },
        { value: available, label: `后走${available}`, tone: wrong ? 'error' : 'focus' },
      ]),
      ...(wrong ? [line(x, 67, x, 153, 'error', true)] : []),
      text(
        200,
        191,
        wrong ? `错排${shown}分，超过${limit}分` : `剩余可走时间${available}分`,
        wrong ? 'error' : 'focus',
        21,
      ),
    ],
    wrong ? `休息的${rest}分钟不能重复拿来走` : `${limit}−${first}−${rest}＝${available}分钟`,
    wrong ? 'error' : 'focus',
  );
}
function minuteGroups(distance: number, minutes: number): MethodNode[] {
  const width = 352 / 10;
  return caption(
    [
      text(200, 27, `剩${distance}米，平均放进${minutes}分钟`, 'known', 20),
      ...Array.from({ length: minutes }, (_, index) =>
        rect(
          24 + (index % 10) * width,
          58 + Math.floor(index / 10) * 62,
          width - 3,
          45,
          index === 0 ? 'focus' : 'known',
        ),
      ),
      text(200, 201, `每框1分，每分至少${distance / minutes}米`, 'focus', 20),
    ],
    `${distance}÷${minutes}＝${distance / minutes}米/分`,
  );
}
const deadlineSpeed: MethodStory = {
  prompt:
    '步道1800米，先以80米/分走10分钟，休息5分钟。要在出发后35分钟内到达，后段至少每分走多少米？',
  frames: [
    frame(
      '先从全程扣掉已经走的路',
      '先走80×10=800米。后段要完成的不是全程1800，而是余下1000米。',
      '1800−80×10＝1000米',
      distanceLeft(1800, 800),
    ),
    frame(
      '总时限同时扣行走和休息',
      '钟表在休息时也继续走。35分钟里已用10分钟走路和5分钟休息，后段只能用20分钟。',
      '35−10−5＝20分钟',
      deadlineStrip(35, 10, 5),
    ),
    frame(
      '把剩余路程平均分给可用时间',
      '1000米要在20分钟内走完，每分钟至少50米。不能拿原来的35分钟去分。',
      '1000÷20＝50米/分',
      minuteGroups(1000, 20),
    ),
    frame(
      '按这个速度走，回查能否准时',
      '后段50×20=1000米，刚好补齐全程；10+5+20=35分钟，刚好不超时。',
      '800＋50×20＝1800；10＋5＋20＝35',
      caption(
        [
          text(200, 27, '上看全程1800米，下看总35分', 'known', 20),
          ...band(
            [
              { value: 800, label: '800' },
              { value: 1000, label: '1000', tone: 'focus' },
            ],
            60,
            43,
          ),
          text(200, 134, '先走10＋休5＋后走20', 'known', 20),
          ...band(
            [
              { value: 10, label: '10' },
              { value: 5, label: '5', tone: 'warm' },
              { value: 20, label: '20', tone: 'focus' },
            ],
            151,
            43,
          ),
        ],
        '路程补齐，时间也没有超出',
      ),
    ),
  ],
  mistake: {
    question: '35分钟内到达，先走10分钟、休息5分钟。后段还能用25分钟吗？',
    wrong: '能，只扣已经走的10分钟',
    right: '不能，只剩20分钟可走',
    why: '把休息漏掉，会排成10分钟走、5分钟休息、再走25分钟，共40分钟，已经超过35分钟。',
    nodes: deadlineStrip(35, 10, 5),
    wrongNodes: deadlineStrip(35, 10, 5, true),
  },
  transfer: {
    question: '换数：全长1500米，先60米/分走10分钟，休3分钟，须25分钟内到。后段至少多少米/分？',
    wrong: '60：余900米用15分钟走',
    right: '75：余900米只剩12分钟走',
    why: '已走600米，剩900米；25−10−3=12分钟，900÷12=75。用15分钟是漏扣休息，会超时3分钟。',
    nodes: minuteGroups(900, 12),
    wrongNodes: deadlineStrip(25, 10, 3, true),
  },
};

function classGroups(
  a: number,
  classesA: number,
  b: number,
  classesB: number,
  stage: number,
  wrong = false,
): MethodNode[] {
  return caption(
    [
      text(200, 27, `先分别数${classesA}班和${classesB}班的人`, 'known', 20),
      ...Array.from({ length: classesA }, (_, index) =>
        rect(24 + index * (352 / classesA), 59, 352 / classesA - 4, 48, 'known', String(a)),
      ),
      ...Array.from({ length: classesB }, (_, index) =>
        rect(
          24 + index * (352 / classesB),
          148,
          352 / classesB - 4,
          48,
          wrong ? 'error' : stage === 0 ? 'quiet' : 'focus',
          stage === 0 && !wrong ? '?' : String(wrong ? a : b),
        ),
      ),
    ],
    wrong
      ? `错把${classesB}班也当成每班${a}人`
      : stage === 0
        ? `上面${a}×${classesA}＝${a * classesA}人`
        : `两类分别为${a * classesA}人、${b * classesB}人`,
    wrong ? 'error' : 'focus',
  );
}
function peoplePackets(people: number, size: number): MethodNode[] {
  const count = people / size,
    columns = 12,
    width = 352 / columns;
  return caption(
    [
      text(200, 27, `合计${people}人，每框${size}人`, 'known', 20),
      ...Array.from({ length: count }, (_, index) =>
        rect(
          24 + (index % columns) * width,
          58 + Math.floor(index / columns) * 62,
          width - 2,
          48,
          'focus',
          String(size),
        ),
      ),
    ],
    `${people}÷${size}＝${count}组`,
  );
}
const combineThenGroup: MethodStory = {
  prompt: '四年级4班，每班28人；五年级3班，每班24人。两年级合起来，每8人一组，能分几组？',
  frames: [
    frame(
      '每班28人的4班先单独计算',
      '四年级这4班的人数相同，可以把4份28合起来。',
      '28×4＝112人',
      classGroups(28, 4, 24, 3, 0),
    ),
    frame(
      '另一类班额不同，另算人数',
      '五年级是3份24，不能沿用四年级每班28人的条件。',
      '24×3＝72人',
      classGroups(28, 4, 24, 3, 1),
    ),
    frame(
      '先合并两类总人数',
      '112人和72人都是要参加实验的人。先合成184人的整体，再来分组。',
      '112＋72＝184人',
      caption(
        [
          text(200, 27, '两年级先合并成一个总量', 'known', 20),
          ...band([
            { value: 112, label: '112' },
            { value: 72, label: '72', tone: 'focus' },
          ]),
        ],
        '一共184人',
      ),
    ),
    frame(
      '每8人圈成一个完整组',
      '每框8人，184人可以放进23个完整框。分的是人数，不是原来7个班。',
      '(28×4＋24×3)÷8＝23组',
      peoplePackets(184, 8),
    ),
  ],
  mistake: {
    question: '4班每班28人，另3班每班24人。能先把7个班合并，都乘28吗？',
    wrong: '能，7个班都是每班28人',
    right: '不能，两种班额要分别乘',
    why: '后3班每班只有24人，都乘28会每班多算4人，共多算12人。正确总人数是112+72=184，再按8人分组。',
    nodes: classGroups(28, 4, 24, 3, 1),
    wrongNodes: classGroups(28, 4, 24, 3, 1, true),
  },
  transfer: {
    question: '换数：2班每班30人、3班每班20人，合计后每6人一组，能分几组？',
    wrong: '25组：5×30÷6',
    right: '20组：(2×30＋3×20)÷6',
    why: '先算60+60=120人，再分成20组。不能把每班20人的3班也当成每班30人。',
    nodes: peoplePackets(120, 6),
    wrongNodes: classGroups(30, 2, 20, 3, 1, true),
  },
};

function discountPackets(
  amount: number,
  threshold: number,
  reduction: number,
  stage: number,
  wrong = false,
): MethodNode[] {
  const full = Math.floor(amount / threshold),
    rem = amount % threshold,
    width = 352 / (full + 1);
  return caption(
    [
      text(200, 27, `按原价每满${threshold}元，优惠${reduction}元`, 'known', 20),
      ...Array.from({ length: full }, (_, index) =>
        rect(24 + index * width, 58, width - 3, 55, 'known', String(threshold)),
      ),
      rect(24 + full * width, 58, width * (rem / threshold), 55, 'warm', String(rem)),
      ...(wrong
        ? [
            rect(
              24 + full * width + width * (rem / threshold),
              58,
              width * (1 - rem / threshold) - 3,
              55,
              'error',
              undefined,
              true,
            ),
          ]
        : []),
      ...(stage > 0
        ? Array.from({ length: full + (wrong ? 1 : 0) }, (_, index) =>
            rect(
              24 + index * width,
              153,
              width - 3,
              46,
              index === full ? 'error' : 'focus',
              String(reduction),
            ),
          )
        : []),
      ...(stage > 0
        ? Array.from({ length: full }, (_, index) =>
            line(24 + (index + 0.5) * width, 118, 24 + (index + 0.5) * width, 145, 'focus'),
          )
        : []),
    ],
    wrong
      ? `第${full + 1}份还差${threshold - rem}元，不能多减一次`
      : stage === 0
        ? `${full}份满额，余${rem}元不满一份`
        : `只优惠${full}次，共减${full * reduction}元`,
    wrong ? 'error' : 'focus',
  );
}
function discountedPayment(amount: number, threshold: number, reduction: number): MethodNode[] {
  const off = Math.floor(amount / threshold) * reduction;
  return caption(
    [
      text(200, 27, `原价${amount}＝实付＋优惠${off}`, 'known', 20),
      ...band([
        { value: amount - off, label: String(amount - off) },
        { value: off, label: String(off), tone: 'focus' },
      ]),
    ],
    `实付${amount}−${off}＝${amount - off}元`,
  );
}
const thresholdDiscount: MethodStory = {
  prompt: '按商品原价每满80元优惠15元，买原价370元的商品，实际支付多少元？',
  frames: [
    frame(
      '先按满额门槛圈完整份',
      '370元可圈出4份80元，还剩50元。余下50没有再满80，不能多享受一次。',
      '370÷80＝4……50',
      discountPackets(370, 80, 15, 0),
    ),
    frame(
      '每个完整份只对应一次优惠',
      '4个蓝框各对应15元优惠。右边余50元没有达到门槛，不再产生优惠。',
      '4×15＝60元',
      discountPackets(370, 80, 15, 1),
    ),
    frame(
      '从原价扣优惠，得到实付款',
      '优惠60元是少付的钱，要从原价370元中减去；不是只支付优惠额。',
      '370−60＝310元',
      discountedPayment(370, 80, 15),
    ),
  ],
  mistake: {
    question: '按原价每满80元优惠15元，原价370元，余下50元可以再优惠一次吗？',
    wrong: '可以，共优惠5次，减75元',
    right: '不可以，只优惠4次，实付310元',
    why: '第5份需要再有80元，但只有50元，还差30元。不能把不满额的余数进成一次满减。',
    nodes: discountPackets(370, 80, 15, 1),
    wrongNodes: discountPackets(370, 80, 15, 1, true),
  },
  transfer: {
    question: '换数：原价425元，每满100元优惠20元，实付多少元？',
    wrong: '325：把余25元也当一次优惠',
    right: '345：4次优惠共80元',
    why: '425÷100商4余25，只优惠4次。实付425−4×20=345元。',
    nodes: discountedPayment(425, 100, 20),
    wrongNodes: discountPackets(425, 100, 20, 1, true),
  },
};

function giftPack(price: number, buy: number): MethodNode[] {
  const width = 220 / buy;
  return caption(
    [
      text(200, 27, `每个${price}元，买${buy}个另送1个`, 'known', 20),
      ...Array.from({ length: buy }, (_, index) =>
        rect(24 + index * width, 83, width - 5, 64, 'known', String(price)),
      ),
      rect(285, 83, 65, 64, 'warm', '赠1'),
    ],
    `一组花${buy * price}元，得到${buy + 1}个`,
  );
}
function budgetPacks(budget: number, price: number, buy: number): MethodNode[] {
  const packs = Math.floor(budget / (price * buy)),
    spent = packs * price * buy;
  return caption(
    [
      text(200, 27, '每蓝框是一整组付费，黄点是赠品', 'known', 20),
      ...Array.from({ length: packs }, (_, index) => [
        rect(
          24 + (index % 3) * 118,
          58 + Math.floor(index / 3) * 66,
          92,
          45,
          'known',
          String(price * buy),
        ),
        {
          kind: 'dot',
          x: 129 + (index % 3) * 118,
          y: 80 + Math.floor(index / 3) * 66,
          tone: 'warm',
        } as MethodNode,
      ]).flat(),
    ],
    `${packs}组花${spent}，得到${packs * (buy + 1)}个；余${budget - spent}元`,
  );
}
function giftCount(
  paid: number,
  buy: number,
  mode: 'right' | 'omit' | 'repeat' = 'right',
): MethodNode[] {
  const gifts = Math.floor(paid / buy) + (mode === 'repeat' ? 1 : 0),
    width = 352 / 9;
  return caption(
    [
      text(200, 27, `付费${paid}个，每买${buy}个送1个`, 'known', 20),
      ...Array.from({ length: paid }, (_, index) =>
        rect(24 + (index % 9) * width, 47 + Math.floor(index / 9) * 47, width - 3, 36, 'known'),
      ),
      ...(mode !== 'omit'
        ? Array.from({ length: gifts }, (_, index) =>
            rect(
              24 + index * 58,
              159,
              50,
              42,
              mode === 'repeat' && index === gifts - 1 ? 'error' : 'warm',
              '1',
            ),
          )
        : []),
    ],
    mode === 'omit'
      ? `错：只算${paid}个，漏掉${gifts}个赠品`
      : mode === 'repeat'
        ? `错：赠品又凑满赠，多算1个`
        : `付费${paid}＋赠${gifts}＝${paid + gifts}个`,
    mode === 'right' ? 'focus' : 'error',
  );
}
const budgetGift: MethodStory = {
  prompt: '每个50元，买三送一，赠品不再参加满赠。850元最多得到多少个？',
  frames: [
    frame(
      '先把付费和赠品分开',
      '一组付3个的钱，花150元，另外得到1个赠品；共得到4个。',
      '50×3＝150元；3＋1＝4个',
      giftPack(50, 3),
    ),
    frame(
      '预算先买完整的促销组',
      '850元先买5组，花750元，得到20个。100元余款仍然可以继续买。',
      '850÷150＝5……100',
      budgetPacks(850, 50, 3),
    ),
    frame(
      '余款按单价再买，不能直接丢掉',
      '余100元还能单买2个，没满3个，所以没有新赠品。20加2共22个，正好花850元。',
      '100÷50＝2；20＋2＝22个',
      caption(
        [
          text(200, 27, '5组已得20个，余款再买2个', 'known', 20),
          rect(28, 80, 130, 80, 'known', '20个'),
          text(191, 127, '＋', 'quiet', 26),
          rect(225, 80, 65, 80, 'focus', '50'),
          rect(300, 80, 65, 80, 'focus', '50'),
        ],
        '原有20＋单买2＝22个',
      ),
    ),
    frame(
      '赠品只由付费数量产生',
      '总共付费17个，17÷3商5，只产生5个赠品。赠品不能再拿去凑买三送一。',
      '付费17个＋赠5个＝22个',
      giftCount(17, 3),
    ),
  ],
  mistake: {
    question: '每个50元，买三送一，850元可付费买17个。最多得到数能直接写17吗？',
    wrong: '能，只算850÷50＝17个',
    right: '不能，还要加5个赠品，共22个',
    why: '17是付费数量，17÷3商5可得到5个赠品。赠品免费，但也属于最后得到的物品。',
    nodes: giftCount(17, 3),
    wrongNodes: giftCount(17, 3, 'omit'),
  },
  transfer: {
    question: '换数：每个40元，买四送一，赠品不再满赠。620元最多得到多少个？',
    wrong: '19个，把赠品也凑出第4份赠送',
    right: '18个，付费15个只赠3个',
    why: '620÷40商15余20，付费15个，赠15÷4的商3个，共18个。余20元买不起一个，赠品也不能继续凑付费数量。',
    nodes: giftCount(15, 4),
    wrongNodes: giftCount(15, 4, 'repeat'),
  },
};

export const prioritySubskillStories: Record<string, MethodStory> = {
  'priority-two-walls': twoWalls,
  'priority-segment-distances': segmentDistances,
  'priority-deadline-speed': deadlineSpeed,
  'priority-combine-then-group': combineThenGroup,
  'priority-threshold-discount': thresholdDiscount,
  'priority-budget-gift': budgetGift,
};
