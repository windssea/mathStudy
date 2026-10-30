import {
  frame,
  line,
  rect,
  text,
  type MethodNode,
  type MethodStory,
  type MethodTone,
} from './method-primitives';

/** Individually reviewed question IDs; every map preserves the question's quantity relation. */
export const round2U34QuestionSubskills: Record<string, Record<string, string>> = {
  'u3-inverse': {
    'bank-u3-inverse-03': 'r2-same-total-inverse-compare',
    'bank-u3-inverse-04': 'r2-remove-before-repack',
  },
  'u3-shopping': {
    'bank-u3-shopping-03': 'r2-reverse-shopping-price',
    'bank-u3-shopping-04': 'r2-shopping-refund',
  },
  'u3-compare': {
    'bank-u3-compare-01': 'r2-compare-unit-prices',
    'u3-12': 'r2-compare-unit-prices',
    'bank-u3-compare-02': 'r2-discount-more-items',
    'u3-10': 'r2-discount-more-items',
    'bank-u3-compare-04': 'r2-at-least-purchase',
  },
  'u3-speed': {
    'bank-u3-speed-03': 'r2-speed-same-units',
    'bank-u3-speed-04': 'r2-rest-before-deadline',
  },
  'u3-journey': { 'u3-11': 'r2-second-person-elapsed' },
  'u3-conditions': {
    'bank-u3-conditions-01': 'r2-useful-unit-quantity',
    'bank-u3-conditions-02': 'r2-useful-unit-quantity',
    'bank-u3-conditions-04': 'r2-production-rate-change',
  },
  'u4-brackets': {
    'bank-u4-brackets-02': 'r2-bracket-scope',
    'u4-10': 'r2-bracket-scope',
    'u4-09': 'r2-nested-division',
    'bank-u4-brackets-05': 'r2-reverse-bracket-equation',
  },
};

const top = (s: string): MethodNode => text(200, 27, s, 'known', 20);
const bottom = (s: string, tone: MethodTone = 'focus'): MethodNode => text(200, 235, s, tone, 20);
function parts(
  values: number[],
  y: number,
  tones: MethodTone[],
  labels = values.map(String),
  h = 50,
): MethodNode[] {
  const sum = values.reduce((a, b) => a + b, 0);
  let x = 32;
  return values.map((value, i) => {
    const w = (336 * value) / sum;
    const node = rect(x, y, w - 2, h, tones[i] ?? 'known', labels[i]);
    x += w;
    return node;
  });
}
function groups(count: number, each: number, tone: MethodTone = 'focus'): MethodNode[] {
  return Array.from({ length: count }, (_, i) =>
    rect(
      33 + (i % 7) * 48,
      52 + Math.floor(i / 7) * 50,
      43,
      40,
      tone,
      each < 100 ? String(each) : undefined,
    ),
  );
}
function pairedTotals(
  total: number,
  a: number,
  b: number,
  stage: number,
  wrong = false,
): MethodNode[] {
  const first = wrong ? total / b : total / a;
  const second = wrong ? total / a : total / b;
  return [
    top(`两条都表示${total}本`),
    ...parts(
      Array.from({ length: stage > 0 ? a : 1 }, () => total / (stage > 0 ? a : 1)),
      58,
      Array(a).fill(wrong ? 'error' : 'known'),
      Array(stage > 0 ? a : 1).fill(stage > 0 ? String(first) : String(total)),
    ),
    text(200, 133, `${a}倍：平均分成${a}份`, 'known', 20),
    ...parts(
      Array.from({ length: stage > 1 ? b : 1 }, () => total / (stage > 1 ? b : 1)),
      153,
      Array(b).fill(wrong ? 'error' : 'focus'),
      Array(stage > 1 ? b : 1).fill(stage > 1 ? String(second) : String(total)),
      43,
    ),
    bottom(
      stage < 2
        ? `${b}倍：同一总数分成更多份`
        : `${first}与${second}相差${Math.abs(first - second)}本`,
      wrong ? 'error' : 'focus',
    ),
  ];
}
const inverseCompare: MethodStory = {
  prompt: '故事书96本，是科普书的3倍，也是历史书的6倍。科普书与历史书谁多，多多少本？',
  frames: [
    frame(
      '先找同一个总量',
      '两句话都把故事书96本当作总量，不能把倍数直接当本数比较。',
      '两条长条都表示96本',
      pairedTotals(96, 3, 6, 0),
    ),
    frame(
      '3倍，就把总量分成3份',
      '科普书是其中1份。3份拼回96本，所以每份32本。',
      '96÷3＝32本',
      pairedTotals(96, 3, 6, 1),
    ),
    frame(
      '同样长的条，分6份后每份更少',
      '历史书是6份中的1份，只有16本。比较的是32和16，不是3和6。',
      '96÷6＝16；32−16＝16本',
      pairedTotals(96, 3, 6, 2),
    ),
  ],
  mistake: {
    question: '故事书96本，是科普书的3倍、历史书的6倍。6比3大，历史书就更多吗？',
    wrong: '是，历史书32本，科普书16本',
    right: '不是，科普书32本，历史书16本',
    why: '同一个96分得越细，每份越少。把32和16交换后，3×16和6×32都拼不回96。',
    nodes: pairedTotals(96, 3, 6, 2),
    wrongNodes: pairedTotals(96, 3, 6, 2, true),
  },
  transfer: {
    question: '换数：甲有120张卡，是乙的4倍、丙的6倍。乙比丙多多少张？',
    wrong: '10张，但丙更多',
    right: '10张，乙更多',
    why: '乙120÷4=30，丙120÷6=20。30−20=10，分4份得到的每份更大。',
    nodes: pairedTotals(120, 4, 6, 2),
    wrongNodes: pairedTotals(120, 4, 6, 2, true),
  },
};

function repack(
  stage: number,
  wrong = false,
  original = 180,
  removed = 36,
  each = 18,
): MethodNode[] {
  const left = original - removed;
  return [
    top(stage === 0 ? `原来12盒，每盒${original / 12}支` : `原有${original}支，先取走${removed}支`),
    ...(stage === 0
      ? groups(12, original / 12, 'known')
      : stage === 1
        ? parts([removed, left], 76, ['warm', 'focus'], [`取走${removed}`, `余${left}`], 90)
        : groups((wrong ? original : left) / each, each, wrong ? 'error' : 'focus')),
    bottom(
      stage === 0
        ? `12×${original / 12}＝${original}支`
        : stage === 1
          ? `${original}−${removed}＝${left}支`
          : `${wrong ? original : left}÷${each}＝${(wrong ? original : left) / each}盒`,
      wrong ? 'error' : 'focus',
    ),
  ];
}
const removeRepack: MethodStory = {
  prompt: '12盒彩笔，每盒15支，先取走36支。剩下的改成每盒18支，能装满多少盒？',
  frames: [
    frame(
      '原来的盒数先换成总支数',
      '12盒只是原包装，每盒15支，合起来才是可重新分装的180支。',
      '15×12＝180支',
      repack(0),
    ),
    frame(
      '先把取走的一段拿开',
      '取走的36支不再参与分盒，只把余下144支重新包装。',
      '180−36＝144支',
      repack(1),
    ),
    frame(
      '余下的才按新包装分组',
      '每盒18支，144支能装8盒；8盒加上取走的36支能还原原总数。',
      '144÷18＝8；18×8＋36＝180',
      repack(2),
    ),
  ],
  mistake: {
    question: '180支先取走36支，余下每18支一盒。直接180÷18=10盒，可以吗？',
    wrong: '可以，换包装不改变总支数',
    right: '不可以，只能装8盒',
    why: '换包装不改变剩余支数，但取走36支确实减少了总量。10盒会把取走的36支又装回来。',
    nodes: repack(2),
    wrongNodes: repack(2, true),
  },
  transfer: {
    question: '换数：12盒每盒20支，先取走60支，余下每30支一盒，能装几盒？',
    wrong: '8盒：把取走的60支也装了',
    right: '6盒：先扣掉60支',
    why: '20×12−60=180支，180÷30=6盒。8盒需要240支，已没有这么多。',
    nodes: repack(2, false, 240, 60, 30),
    wrongNodes: repack(2, true, 240, 60, 30),
  },
};

function reversePrice(
  stage: number,
  wrong = false,
  paid = 200,
  change = 32,
  pen = 24,
  count = 8,
): MethodNode[] {
  const bookMoney = paid - change - pen,
    unit = bookMoney / count;
  const wrongUnit = (paid + change - pen) / count;
  return [
    top(`付${paid}元，找回${change}元，笔${pen}元`),
    ...(stage === 0
      ? parts([paid - change, change], 72, ['known', 'warm'], ['购物用去', `找回${change}`], 80)
      : stage === 1
        ? parts([pen, bookMoney], 72, ['warm', 'focus'], [`笔${pen}`, `本子${bookMoney}`], 80)
        : groups(count, wrong ? wrongUnit : unit, wrong ? 'error' : 'focus')),
    bottom(
      stage === 0
        ? `实际花${paid}−${change}＝${paid - change}`
        : stage === 1
          ? `本子用${paid - change}−${pen}＝${bookMoney}`
          : `${count}本，每本${wrong ? wrongUnit : unit}元`,
      wrong ? 'error' : 'focus',
    ),
    ...(wrong ? [text(200, 202, '× 把找零加回购物款', 'error', 20)] : []),
  ];
}
const reverseShopping: MethodStory = {
  prompt: '买8本相同的本子和一支24元的笔，付200元，找回32元。每本本子多少元？',
  frames: [
    frame(
      '找回的钱没有花出去',
      '付出的200元由购物款和找回的32元组成。先拿掉找零。',
      '200−32＝168元',
      reversePrice(0),
    ),
    frame(
      '购物款再分成笔钱和本子钱',
      '168元还包括一支笔。24元笔钱也不能平均分给8本本子。',
      '168−24＝144元',
      reversePrice(1),
    ),
    frame(
      '只有本子钱才平均分给本数',
      '8本同价，把144元平均分8份，每份18元。',
      '144÷8＝18元/本',
      reversePrice(2),
    ),
  ],
  mistake: {
    question: '付200元、找回32元，买8本本子和24元的笔。用(200+32−24)÷8算单价，对吗？',
    wrong: '对，每本26元',
    right: '不对，每本18元',
    why: '找零在手中，应该从付款中减去。26×8+24+32=264，已经超过原来的200元。',
    nodes: reversePrice(2),
    wrongNodes: reversePrice(2, true),
  },
  transfer: {
    question: '换数：付180元找回30元，买6本本子和18元的笔。每本多少元？',
    wrong: '32元：把找零加回去',
    right: '22元：先扣找零，再扣笔钱',
    why: '(180−30−18)÷6=22。找零与笔钱都不属于本子总价。',
    nodes: reversePrice(2, false, 180, 30, 18, 6),
    wrongNodes: reversePrice(2, true, 180, 30, 18, 6),
  },
};

function refund(
  stage: number,
  wrong = false,
  paid = 240,
  change = 48,
  price = 16,
  back = 3,
): MethodNode[] {
  const count = (paid - change) / price,
    giveBack = back * price,
    left = count - back;
  return [
    top(`付${paid}，先找${change}；每本${price}元`),
    ...(stage < 2
      ? [
          ...parts(
            [paid - change, change],
            60,
            ['known', 'warm'],
            [`书款${paid - change}`, `找零${change}`],
          ),
          ...(stage === 1
            ? groups(count, price, 'known').map((node) => ({ ...node, y: node.y + 70 }))
            : []),
        ]
      : [
          ...parts(
            [left * price, giveBack, change],
            70,
            ['known', wrong ? 'error' : 'focus', 'warm'],
            [`留书${left * price}`, `退款${giveBack}`, `原找零${change}`],
            65,
          ),
          line(32 + (336 * left * price) / paid, 155, 368, 155, wrong ? 'error' : 'focus', wrong),
          text(
            260,
            190,
            wrong ? `错只记${change}元` : `手中${change}+${giveBack}`,
            wrong ? 'error' : 'focus',
            20,
          ),
        ]),
    bottom(
      stage === 0
        ? `第一次实付${paid - change}元`
        : stage === 1
          ? `原买${count}本，再退${back}本`
          : `留下${left}本；手中${wrong ? change : change + giveBack}元`,
      wrong ? 'error' : 'focus',
    ),
  ];
}
const shoppingRefund: MethodStory = {
  prompt: '画册每本16元，付240元、先找回48元，随后按原价退3本。留下几本？手中共有多少元？',
  frames: [
    frame(
      '先把原来的书款找出来',
      '找回的48元还在手中，第一次真正买书只用了192元。',
      '240−48＝192元',
      refund(0),
    ),
    frame(
      '先还原原本买了多少本',
      '每本16元，192元对应12本。退货要从12本里拿走3本。',
      '192÷16＝12本',
      refund(1),
    ),
    frame(
      '退掉的书变回手中的钱',
      '退3本得到48元，加在原找零48元上；留下9本值144元，两部分合计仍240元。',
      '12−3＝9本；48＋16×3＝96元',
      refund(2),
    ),
  ],
  mistake: {
    question: '付240元先找48元，画册每本16元，再退3本。手中还是只有48元吗？',
    wrong: '是，找回的钱就是48元',
    right: '不是，另退48元，共96元',
    why: '第一次找零与后来退款是两笔钱。留下9本值144元，144+96才能还原240元。',
    nodes: refund(2),
    wrongNodes: refund(2, true),
  },
  transfer: {
    question: '换数：画册每本15元，付200元先找20元，随后退2本。留下几本，手中多少钱？',
    wrong: '10本，20元：漏了退款',
    right: '10本，50元：退款再加回手中',
    why: '原买(200−20)÷15=12本；退2本剩10本。退款30元，手中20+30=50元。',
    nodes: refund(2, false, 200, 20, 15, 2),
    wrongNodes: refund(2, true, 200, 20, 15, 2),
  },
};

function unitPrices(
  stage: number,
  wrong = false,
  countA = 3,
  sumA = 42,
  countB = 5,
  sumB = 65,
  buy = 6,
): MethodNode[] {
  const a = sumA / countA,
    b = sumB / countB;
  const books = (count: number, price: number, y: number, tone: MethodTone): MethodNode[] =>
    Array.from({ length: count }, (_, i) =>
      rect(200 - count * 20 + i * 40, y, 36, 48, tone, stage === 0 ? undefined : String(price)),
    );
  return [
    top(stage === 2 ? `都买${buy}本再比较` : `甲${countA}本${sumA}元；乙${countB}本${sumB}元`),
    ...books(stage === 2 ? buy : countA, a, 58, wrong ? 'error' : 'known'),
    text(
      200,
      135,
      stage === 0 ? '数量不同，不能只比总价' : `甲每本${a}元`,
      wrong ? 'error' : 'known',
      20,
    ),
    ...books(stage === 2 ? buy : countB, b, 155, 'focus'),
    bottom(
      stage === 0
        ? `${sumA}和${sumB}对应的本数不同`
        : stage === 1
          ? `乙每本${b}元`
          : `甲${a * buy}元，乙${b * buy}元，相差${Math.abs(a - b) * buy}元`,
      wrong ? 'error' : 'focus',
    ),
  ];
}
const compareUnitPrices: MethodStory = {
  prompt: '甲店3本42元，乙店5本65元，单买同价。每本分别多少元？买6本哪店更省，省多少元？',
  frames: [
    frame(
      '先看两笔钱各买了几本',
      '42元只买3本，65元买了5本。两家数量不同，直接比总价不公平。',
      '先把数量统一到1本',
      unitPrices(0),
    ),
    frame(
      '分别分出每一本的价钱',
      '甲把42元分3份，每份14；乙把65元分5份，每份13。',
      '42÷3＝14；65÷5＝13元/本',
      unitPrices(1),
    ),
    frame(
      '同样买6本，差价重复6次',
      '乙每本少1元，6本共省6元。条带上的本数现在相同，才能比总价。',
      '(14−13)×6＝6元',
      unitPrices(2),
    ),
  ],
  mistake: {
    question: '甲店3本42元，乙店5本65元，单买同价。42比65小，甲店就更便宜吗？',
    wrong: '是，选甲店，只看42较小',
    right: '不是，乙每本13元，比甲少1元',
    why: '甲的42元只买3本。都买6本时，甲84元，乙78元，甲反而多花6元。',
    nodes: unitPrices(2),
    wrongNodes: unitPrices(0, true),
  },
  transfer: {
    question: '换数：甲店4本52元，乙店3本42元，单买同价。买8本，甲店比乙店省多少元？',
    wrong: '乙更省，因为42小于52',
    right: '甲省8元，单价13元比14元低',
    why: '52÷4=13，42÷3=14。同买8本，单价差1元，合计差8元。',
    nodes: unitPrices(2, false, 4, 52, 3, 42, 8),
    wrongNodes: unitPrices(0, true, 4, 52, 3, 42, 8),
  },
};

function discount(
  stage: number,
  wrong = false,
  budget = 180,
  oldCount = 9,
  reduction = 5,
): MethodNode[] {
  const oldPrice = budget / oldCount,
    newPrice = oldPrice - reduction,
    newCount = budget / newPrice;
  const displayCount = wrong ? oldCount + reduction : newCount;
  const oldCells = Array(oldCount).fill(oldPrice),
    nextCells = Array(displayCount).fill(newPrice);
  return [
    top(`钱不变：${budget}元`),
    ...parts(oldCells, 57, Array(oldCount).fill('known'), Array(oldCount).fill(''), 43),
    text(200, 125, `原${oldCount}支，每支${oldPrice}元`, 'known', 20),
    ...(stage > 0
      ? parts(
          stage === 1 ? [budget] : nextCells,
          150,
          Array(40).fill(wrong ? 'error' : 'focus'),
          stage === 1 ? [`新单价${newPrice}元`] : Array(displayCount).fill(''),
          42,
        )
      : []),
    bottom(
      stage === 0
        ? `${budget}÷${oldCount}＝${oldPrice}元/支`
        : stage === 1
          ? `${oldPrice}−${reduction}＝${newPrice}元/支`
          : wrong
            ? `错买${displayCount}支，要${displayCount * newPrice}元`
            : `现${newCount}支，比原来多${newCount - oldCount}支`,
      wrong ? 'error' : 'focus',
    ),
  ];
}
const discountMore: MethodStory = {
  prompt: '180元原来正好买9支笔。每支降价5元后，180元能比原来多买几支？',
  frames: [
    frame(
      '先恢复原来每支多少钱',
      '固定的180元平均付给9支笔，每支20元。',
      '180÷9＝20元/支',
      discount(0),
    ),
    frame(
      '降价改变每支的钱数',
      '每支少5元，新单价15元。5的单位是元，不是支。',
      '20−5＝15元/支',
      discount(1),
    ),
    frame(
      '同一笔钱按新单价重新分',
      '180里有12个15，能买12支。要回答多几支，还要减去原来的9支。',
      '180÷15＝12；12−9＝3支',
      discount(2),
    ),
  ],
  mistake: {
    question: '180元原来买9支笔，每支降价5元。是不是就能多买5支？',
    wrong: '是，9+5=14支',
    right: '不是，现买12支，只多3支',
    why: '新单价15元，14支要210元，超过180元。降价的元数不能直接加进支数。',
    nodes: discount(2),
    wrongNodes: discount(2, true),
  },
  transfer: {
    question: '换数：120元原来买6支笔，每支降价5元后，用120元能多买几支？',
    wrong: '多5支：把元数当支数',
    right: '多2支：现买8支',
    why: '原单价120÷6=20，新单价15；120÷15=8，8−6=2支。',
    nodes: discount(2, false, 120, 6, 5),
    wrongNodes: discount(2, true, 120, 6, 5),
  },
};

function speedUnits(
  stage: number,
  wrong = false,
  bike = 240,
  bikeTime = 15,
  carKmh = 48,
  carTime = 6,
): MethodNode[] {
  const car = wrong ? carKmh : (carKmh * 1000) / 60;
  const bikeDistance = bike * bikeTime,
    carDistance = car * carTime;
  const max = Math.max(bikeDistance, carDistance);
  return [
    top(
      stage === 0
        ? '先把速度的长度、时间单位都统一'
        : stage === 1
          ? '一小时分6框，每框10分钟'
          : '两段路程都用米比较',
    ),
    ...(stage === 0
      ? [
          rect(32, 72, 150, 88, 'known', `${bike}米/分`),
          rect(218, 72, 150, 88, 'warm', `${carKmh}千米/时`),
        ]
      : stage === 1
        ? [
            rect(32, 58, 336, 58, 'known', `${carKmh * 1000}米 / 60分`),
            ...Array.from({ length: 6 }, (_, i) => rect(32 + i * 56, 144, 52, 45, 'focus', '10')),
          ]
        : [
            rect(32, 59, (336 * bikeDistance) / max, 47, 'known', `${bikeDistance}米`),
            rect(
              32,
              145,
              (336 * carDistance) / max,
              47,
              wrong ? 'error' : 'focus',
              `${carDistance}米`,
            ),
            line(
              32 + (336 * Math.min(bikeDistance, carDistance)) / max,
              211,
              368,
              211,
              wrong ? 'error' : 'focus',
            ),
          ]),
    bottom(
      stage === 0
        ? '千米→米；小时→分钟'
        : stage === 1
          ? `${carKmh * 1000}÷60＝${car}米/分`
          : `相差${Math.abs(carDistance - bikeDistance)}米`,
      wrong ? 'error' : 'focus',
    ),
  ];
}
const speedSameUnits: MethodStory = {
  prompt: '自行车每分钟240米，骑15分钟；汽车每小时48千米，行6分钟。两者路程相差多少米？',
  frames: [
    frame(
      '速度单位不同，不能直接乘分钟',
      '自行车是每分钟，汽车是每小时；48千米也不是48米。先统一两处单位。',
      '48千米＝48000米；1时＝60分',
      speedUnits(0),
    ),
    frame(
      '一小时的路程平均分给60分钟',
      '48000米对应60分，所以1分钟800米。图中6段10分钟拼成整小时。',
      '48000÷60＝800米/分',
      speedUnits(1),
    ),
    frame(
      '各自的速度配各自的时间',
      '自行车走3600米，汽车走4800米。都换成米后，用长的一段减短的一段。',
      '240×15＝3600；800×6＝4800；差1200米',
      speedUnits(2),
    ),
  ],
  mistake: {
    question: '汽车每小时48千米，行6分钟，能直接算48×6=288米吗？',
    wrong: '能，汽车走288米',
    right: '不能，汽车走4800米',
    why: '48的单位是千米/时。要乘6分钟，先变成800米/分；288米把长度、时间两种单位都错配了。',
    nodes: speedUnits(2),
    wrongNodes: speedUnits(2, true),
  },
  transfer: {
    question: '换数：自行车200米/分骑10分；汽车36千米/时行4分。相差多少米？',
    wrong: '1856米：把汽车当36米/分',
    right: '400米：汽车2400米，自行车2000米',
    why: '36千米/时=36000÷60=600米/分，600×4−200×10=400米。',
    nodes: speedUnits(2, false, 200, 10, 36, 4),
    wrongNodes: speedUnits(2, true, 200, 10, 36, 4),
  },
};

function restTimeline(
  stage: number,
  wrong = false,
  firstSpeed = 80,
  firstTime = 18,
  secondSpeed = 120,
  early = 3,
): MethodNode[] {
  const distance = firstSpeed * firstTime,
    walk = distance / secondSpeed;
  const rest = firstTime - walk - (wrong ? 0 : early);
  return [
    top(stage === 1 ? `同一路${distance}米，每框${secondSpeed}米` : `同一条路${distance}米`),
    ...(stage === 0
      ? [
          ...parts(
            Array(firstTime).fill(firstSpeed),
            79,
            Array(firstTime).fill('known'),
            Array(firstTime).fill(''),
            70,
          ),
          text(200, 193, `${firstTime}分，每分${firstSpeed}米`, 'known', 20),
        ]
      : stage === 1
        ? [...groups(walk, secondSpeed), text(200, 198, `每框走1分，走路用${walk}分`, 'focus', 20)]
        : [
            ...parts(
              [walk, rest, ...(wrong ? [] : [early])],
              76,
              ['known', wrong ? 'error' : 'focus', 'quiet'],
              [`走${walk}分`, `休${rest}分`, ...(wrong ? [] : [`早${early}分`])],
              70,
            ),
            text(
              200,
              191,
              wrong ? `到第${walk + rest}分，没能早到` : `最晚第${firstTime - early}分到达`,
              wrong ? 'error' : 'focus',
              20,
            ),
          ]),
    bottom(
      stage === 0
        ? `${firstSpeed}×${firstTime}＝${distance}米`
        : stage === 1
          ? `${distance}÷${secondSpeed}＝${walk}分`
          : `休息最多${rest}分`,
      wrong ? 'error' : 'focus',
    ),
  ];
}
const restDeadline: MethodStory = {
  prompt:
    '小安80米/分，18分钟走完一条路。小禾120米/分，同时出发，要早到3分钟，途中最多休息几分钟？',
  frames: [
    frame(
      '用第一人的数据恢复同一路程',
      '小禾走的也是这1440米，不能把两人的速度直接相减当成路程。',
      '80×18＝1440米',
      restTimeline(0),
    ),
    frame(
      '只算小禾真正走路的时间',
      '1440米按每分钟120米走，行走本身用12分钟。',
      '1440÷120＝12分',
      restTimeline(1),
    ),
    frame(
      '先留下必须早到的3分钟',
      '18分钟先减早到3分钟，只剩15分钟可用；其中12分钟走路，剩3分钟才能休息。',
      '18−3−12＝3分',
      restTimeline(2),
    ),
  ],
  mistake: {
    question: '同路程1440米，小禾120米/分，要比18分钟早到3分钟。休息18−12=6分钟，行吗？',
    wrong: '行，走12分休6分',
    right: '不行，最多休3分',
    why: '12+6=18，只能同时到达，没有早到。截止是第15分钟，12+3=15刚好满足。',
    nodes: restTimeline(2),
    wrongNodes: restTimeline(2, true),
  },
  transfer: {
    question: '换数：甲60米/分走20分，乙100米/分走同路，同时出发，乙要早到4分，最多休息几分？',
    wrong: '8分：漏留早到的4分',
    right: '4分：走12分，最晚第16分到',
    why: '路程1200米，乙行走12分；20−4−12=4分可休息。',
    nodes: restTimeline(2, false, 60, 20, 100, 4),
    wrongNodes: restTimeline(2, true, 60, 20, 100, 4),
  },
};

function rateChange(
  stage: number,
  wrong = false,
  total = 80,
  firstTime = 5,
  oldRate = 4,
  increase = 2,
): MethodNode[] {
  const done = firstTime * oldRate,
    left = total - done,
    newRate = oldRate + increase,
    secondTime = left / newRate;
  return [
    top(stage === 0 ? `前${firstTime}分做${done}朵` : `总任务${total}朵不变`),
    ...(stage === 0
      ? groups(firstTime, oldRate, 'known')
      : stage === 1
        ? [
            ...parts([done, left], 67, ['known', 'focus'], [`完成${done}`, `余${left}`], 65),
            rect(105, 164, 190, 42, 'focus', `新速度${newRate}朵/分`),
          ]
        : [
            ...parts(
              [firstTime, secondTime],
              76,
              [wrong ? 'quiet' : 'known', 'focus'],
              [wrong ? '漏算前段' : `前${firstTime}分`, `后${secondTime}分`],
              70,
            ),
            ...(wrong
              ? [
                  line(
                    32,
                    158,
                    32 + (336 * firstTime) / (firstTime + secondTime),
                    158,
                    'error',
                    true,
                  ),
                ]
              : []),
            text(200, 194, `后段${left}÷${newRate}＝${secondTime}分`, 'focus', 20),
          ]),
    bottom(
      stage === 0
        ? `${done}÷${firstTime}＝${oldRate}朵/分`
        : stage === 1
          ? `${left}朵按${newRate}朵/分做`
          : `全程${wrong ? secondTime : firstTime + secondTime}分`,
      wrong ? 'error' : 'focus',
    ),
  ];
}
const changedRate: MethodStory = {
  prompt: '前5分钟做20朵纸花，之后每分钟比原来多做2朵。一共做80朵，从开始到完成共几分钟？',
  frames: [
    frame(
      '先把前段总量换成每分钟量',
      '20朵是5分钟合做的，不能当作每分钟20朵。',
      '20÷5＝4朵/分',
      rateChange(0),
    ),
    frame(
      '已经做的拿开，余下用新速度',
      '80朵拿开已做20朵，还剩60朵；新速度4+2=6朵/分。',
      '80−20＝60朵；4＋2＝6朵/分',
      rateChange(1),
    ),
    frame(
      '后段10分钟还要接上前段',
      '60朵用10分钟完成。题目问从开始，前面的5分钟也在整个时间条上。',
      '60÷6＝10；5＋10＝15分',
      rateChange(2),
    ),
  ],
  mistake: {
    question: '前5分做20朵，余60朵按6朵/分做。后段用10分，就回答共10分吗？',
    wrong: '是，共10分',
    right: '不是，还要加前5分，共15分',
    why: '10分只对应剩余的60朵，前20朵已经用了5分。两段时间首尾连接才是从开始到结束。',
    nodes: rateChange(2),
    wrongNodes: rateChange(2, true),
  },
  transfer: {
    question: '换数：前6分做30朵，之后每分钟多做5朵，一共做90朵。全程几分钟？',
    wrong: '6分：只算后段',
    right: '12分：前6分加后6分',
    why: '原速5，新速10朵/分；余60朵用6分，前后合计12分。',
    nodes: rateChange(2, false, 90, 6, 5, 5),
    wrongNodes: rateChange(2, true, 90, 6, 5, 5),
  },
};

function bracketScope(
  stage: number,
  wrong = false,
  total = 480,
  inner = 12,
  times = 2,
): MethodNode[] {
  const share = total / inner,
    a = wrong ? total / (inner * times) : share * times,
    b = total / (inner * times);
  return [
    top(`先算小括号，得到${inner}`),
    ...(stage === 0
      ? [
          rect(32, 57, 156, 53, 'known', `÷${inner}`),
          rect(213, 57, 155, 53, 'focus', `再×${times}`),
          rect(32, 151, 336, 53, 'warm', `整体作除数：${inner}×${times}`),
        ]
      : [
          ...Array.from({ length: stage === 1 || wrong ? 1 : times }, (_, i) => {
            const width = (336 * (wrong ? b : share)) / (share * times);
            return rect(
              32 + i * width,
              58,
              width - 2,
              50,
              wrong ? 'error' : 'focus',
              String(wrong ? b : share),
            );
          }),
          text(
            200,
            133,
            stage === 1 ? `甲先得${share}，还要乘${times}` : `甲结果${a}`,
            wrong ? 'error' : 'focus',
            20,
          ),
          rect(100, 155, 200, 43, 'known', `乙${total}÷${inner * times}＝${b}`),
        ]),
    bottom(
      stage === 0
        ? '甲先除再乘；乙除以整个积'
        : stage === 1
          ? `乙的除数是${inner * times}`
          : `两式相差${a - b}`,
      wrong ? 'error' : 'focus',
    ),
  ];
}
const bracketsScope: MethodStory = {
  prompt: '甲480÷(18−6)×2，乙480÷[(18−6)×2]。两式各是多少？为什么不同？',
  frames: [
    frame(
      '小括号相同，大括号范围不同',
      '两式都先算18−6。甲的乘2在除数外；乙把12×2一起作为除数。',
      '18−6＝12',
      bracketScope(0),
    ),
    frame(
      '甲先除出一份，乙先合成除数',
      '甲480÷12得到40后还要乘2；乙先得到除数24，再用480÷24。',
      '甲先得40；乙480÷24＝20',
      bracketScope(1),
    ),
    frame(
      '甲的40重复两份，乙仍是一份20',
      '甲是80，乙是20。除以12后再乘2，会变大；除以12×2，会把每份变小。',
      '甲40×2＝80；乙20；相差60',
      bracketScope(2),
    ),
  ],
  mistake: {
    question: '480÷(18−6)×2与480÷[(18−6)×2]，能都把12×2作为除数吗？',
    wrong: '能，两式都是20',
    right: '不能，甲80、乙20',
    why: '甲的小括号只围住18−6，同级除乘从左到右；把×2搬入除数，改变了计算对象。',
    nodes: bracketScope(2),
    wrongNodes: bracketScope(2, true),
  },
  transfer: {
    question: '换数：甲600÷(30−10)×3，乙600÷[(30−10)×3]。甲比乙大多少？',
    wrong: '0：两式都按除以60计算',
    right: '80：甲90，乙10',
    why: '甲600÷20×3=90；乙600÷60=10，90−10=80。',
    nodes: bracketScope(2, false, 600, 20, 3),
    wrongNodes: bracketScope(2, true, 600, 20, 3),
  },
};

function nestedDivision(
  stage: number,
  wrong = false,
  total = 120,
  middle = 240,
  difference = 20,
): MethodNode[] {
  const divisor = middle / difference,
    result = total / divisor;
  return [
    top(
      stage === 0
        ? '先得到最里面的一份'
        : stage === 1
          ? '中括号还要继续算完'
          : '整个中括号才是外层除数',
    ),
    ...(stage === 0
      ? parts([24, difference], 76, ['warm', 'focus'], ['减去24', `余${difference}`], 80)
      : stage === 1
        ? groups(divisor, difference, 'known')
        : groups(
            wrong ? total / difference : result,
            wrong ? difference : divisor,
            wrong ? 'error' : 'focus',
          )),
    bottom(
      stage === 0
        ? `44−24＝${difference}`
        : stage === 1
          ? `${middle}÷${difference}＝${divisor}`
          : `${total}÷${wrong ? difference : divisor}＝${wrong ? total / difference : result}`,
      wrong ? 'error' : 'focus',
    ),
  ];
}
const nested: MethodStory = {
  prompt: '计算120÷[240÷(44−24)]。最外面的120，到底应该除以哪个数？',
  frames: [
    frame(
      '从最里面的一层开始',
      '44减24得到20；它只是内层结果，还不是120的除数。',
      '44−24＝20',
      nestedDivision(0),
    ),
    frame(
      '先把中括号的整个结果求出',
      '240每20为一组，分成12组。因此整个中括号的值是12。',
      '240÷20＝12',
      nestedDivision(1),
    ),
    frame(
      '用120除以整个中括号的12',
      '120每12一组分成10组。括号不能拆成120÷240再÷20。',
      '120÷12＝10',
      nestedDivision(2),
    ),
  ],
  mistake: {
    question: '120÷[240÷(44−24)]，算出44−24=20后，就直接120÷20=6吗？',
    wrong: '是，结果6',
    right: '不是，中括号等于12，结果10',
    why: '20只是240的除数；先240÷20得到12，才轮到最外层120÷12。跳过240就换了计算对象。',
    nodes: nestedDivision(2),
    wrongNodes: nestedDivision(2, true),
  },
  transfer: {
    question: '换数：180÷[360÷(70−40)]，结果是多少？',
    wrong: '6：直接180÷30',
    right: '15：先得中括号12',
    why: '70−40=30，360÷30=12，最后180÷12=15；不是直接除以内层的30。',
    nodes: nestedDivision(2, false, 180, 360, 30),
    wrongNodes: nestedDivision(2, true, 180, 360, 30),
  },
};

function reverseBrackets(
  stage: number,
  wrong = false,
  total = 720,
  result = 8,
  times = 3,
  minus = 12,
): MethodNode[] {
  const denominator = total / result,
    inner = denominator / times,
    unknown = inner + minus;
  return [
    top(
      stage === 0
        ? `总数${total}，分成${result}份`
        : stage === 1
          ? `整个除数${denominator}由${times}份组成`
          : '把原来减去的一段接回去',
    ),
    ...(stage === 0
      ? groups(result, denominator, 'known')
      : stage === 1
        ? parts(
            Array(times).fill(inner),
            77,
            Array(times).fill('focus'),
            Array(times).fill(String(inner)),
            80,
          )
        : parts(
            [minus, wrong ? inner - 2 * minus : inner],
            77,
            ['warm', wrong ? 'error' : 'focus'],
            [`减去${minus}`, wrong ? `只余${inner - 2 * minus}` : `余${inner}`],
            80,
          )),
    bottom(
      stage === 0
        ? `除数${total}÷${result}＝${denominator}`
        : stage === 1
          ? `小括号${denominator}÷${times}＝${inner}`
          : `原数${wrong ? inner - minus : unknown}`,
      wrong ? 'error' : 'focus',
    ),
    ...(stage === 2
      ? [
          text(
            200,
            199,
            wrong ? `错把${inner}再减${minus}` : `${inner}＋${minus}＝${unknown}`,
            wrong ? 'error' : 'focus',
            20,
          ),
        ]
      : []),
  ];
}
const reverseEquation: MethodStory = {
  prompt: '720÷[(□−12)×3]＝8。先找整个除数，再倒推□应该填多少。',
  frames: [
    frame(
      '先把整个除数当作一个未知量',
      '720分成8份，每份90。中括号整体就是90，不要先和12直接运算。',
      '中括号＝720÷8＝90',
      reverseBrackets(0),
    ),
    frame(
      '把90平均分成3份',
      '小括号乘3得到90，所以小括号是一份30。',
      '□−12＝90÷3＝30',
      reverseBrackets(1),
    ),
    frame(
      '从剩下30倒推原来的数',
      '原数减12后剩30。把拿走的12接回去，原数就是42。',
      '□＝30＋12＝42',
      reverseBrackets(2),
    ),
  ],
  mistake: {
    question: '720÷[(□−12)×3]=8，倒推到□−12=30后，□是30−12=18吗？',
    wrong: '是，□填18',
    right: '不是，□填42',
    why: '30是减掉12后的剩余，应该加回12。18−12只有6，不可能得到要求的30。',
    nodes: reverseBrackets(2),
    wrongNodes: reverseBrackets(2, true),
  },
  transfer: {
    question: '换数：960÷[(□−10)×4]＝8，□填多少？',
    wrong: '20：倒推最后仍减10',
    right: '40：倒推最后加回10',
    why: '整个除数960÷8=120；小括号120÷4=30；原数30+10=40。',
    nodes: reverseBrackets(2, false, 960, 8, 4, 10),
    wrongNodes: reverseBrackets(2, true, 960, 8, 4, 10),
  },
};

function purchaseBundles(
  packSize: number,
  packs: number,
  loose: number,
  packPrice: number,
  singlePrice: number,
  wrong = false,
): MethodNode[] {
  const count = packs * packSize + loose,
    width = 336 / count,
    cost = packs * packPrice + loose * singlePrice;
  return [
    top(`每小格1本，共${count}本`),
    ...Array.from({ length: packs }, (_, i) => [
      rect(
        30 + i * packSize * width,
        77,
        packSize * width - 1,
        89,
        wrong ? 'error' : 'known',
        undefined,
        true,
      ),
      text(
        30 + (i + 0.5) * packSize * width,
        64,
        `${packPrice}元/包`,
        wrong ? 'error' : 'known',
        20,
      ),
    ]).flat(),
    ...Array.from({ length: count }, (_, i) =>
      rect(
        32 + i * width,
        91,
        width - 5,
        60,
        wrong ? 'error' : i < packs * packSize ? 'known' : 'focus',
        i < packs * packSize ? undefined : String(singlePrice),
      ),
    ),
    text(200, 204, `${packs}包＋单买${loose}本`, wrong ? 'error' : 'focus', 20),
    bottom(`${packs}×${packPrice}＋${loose}×${singlePrice}＝${cost}元`, wrong ? 'error' : 'focus'),
  ];
}
const atLeastPurchase: MethodStory = {
  prompt: '每包4本24元，散买每本10元。至少买7本，可以多买。怎样买最省钱？',
  frames: [
    frame(
      '先看“至少”，不是“正好”',
      '7本够用，8本也够用。多买可能更便宜，不能先删掉多买的方案。',
      '本数≥7才可行',
      [
        top('至少7本，8本也满足'),
        ...Array.from({ length: 7 }, (_, i) =>
          rect(32 + i * 48, 79, 43, 75, 'quiet', undefined, true),
        ),
        bottom('这里只标需要的7本'),
      ],
    ),
    frame(
      '先算恰好7本的最省方案',
      '买1包有4本，再单买3本。54元是恰好7本的费用，还不是全部方案中的最低价。',
      '24＋3×10＝54元',
      purchaseBundles(4, 1, 3, 24, 10),
    ),
    frame(
      '再检查多买1本的整包方案',
      '买2包有8本，花48元。虽然多了1本，却比54元少6元。',
      '24×2＝48元，比54元少6元',
      purchaseBundles(4, 2, 0, 24, 10),
    ),
    frame(
      '先筛够本数，再比费用',
      '0包70元，1包54元，2包48元。3包起至少72元，不可能更省，所以最少48元。',
      '选2包，共8本，48元',
      [
        top('三种够用方案，费用从长到短'),
        ...[70, 54, 48].flatMap((value, i) => [
          text(50, 73 + i * 55, `${i}包`, 'known', 20),
          rect(
            94,
            45 + i * 55,
            (282 * value) / 70,
            42,
            i === 2 ? 'focus' : 'known',
            `${i === 2 ? 8 : 7}本${value}元`,
          ),
        ]),
        bottom('3包起≥72元，不会更省'),
      ],
    ),
  ],
  mistake: {
    question: '4本一包24元，散买10元，至少7本可多买。只比较恰好7本，选54元可以吗？',
    wrong: '可以，1包加3本就是最低价',
    right: '不可以，2包8本只要48元',
    why: '54元能买够，但不是最省。8本仍符合至少7本，而且整包方案48元更便宜。',
    nodes: purchaseBundles(4, 2, 0, 24, 10),
    wrongNodes: purchaseBundles(4, 1, 3, 24, 10, true),
  },
  transfer: {
    question: '换数：3本一包21元，散买10元。至少5本，可多买。最少花多少元？',
    wrong: '42元：总以为多买整包才省',
    right: '41元：1包加2本',
    why: '1包加2本是21+20=41；2包6本要42。多买只是候选方案，每次都要实际比较。',
    nodes: purchaseBundles(3, 1, 2, 21, 10),
    wrongNodes: purchaseBundles(3, 2, 0, 21, 10, true),
  },
};

function unitQuantity(
  stage: number,
  wrong = false,
  count = 9,
  each = 6,
  irrelevant = 5,
  unit = '朵',
): MethodNode[] {
  return [
    top(
      stage === 0
        ? '挑出产量与对应时间'
        : stage === 1
          ? '每分钟量相同，才可以延长'
          : wrong
            ? '错把无关条件当作每份量'
            : `每小格1份，每份${each}${unit}`,
    ),
    ...(stage === 0
      ? [
          rect(32, 65, 160, 58, 'known', '3分18朵'),
          rect(208, 65, 160, 58, 'known', '6分36朵'),
          text(200, 178, '旁观5人：不决定每分钟产量', 'quiet', 20),
          line(84, 191, 316, 191, 'quiet', true),
        ]
      : stage === 1
        ? [
            ...Array.from({ length: 3 }, (_, i) => rect(116 + i * 56, 62, 50, 46, 'known', '6')),
            text(200, 135, '两组记录，每分钟都是6朵', 'known', 20),
            ...Array.from({ length: 6 }, (_, i) => rect(32 + i * 56, 155, 50, 46, 'focus', '6')),
          ]
        : groups(count, wrong ? irrelevant : each, wrong ? 'error' : 'focus')),
    bottom(
      stage === 0
        ? '需要同一段对应的两个量'
        : stage === 1
          ? '18÷3＝36÷6＝6朵/分'
          : `${count}×${wrong ? irrelevant : each}＝${count * (wrong ? irrelevant : each)}${unit}`,
      wrong ? 'error' : 'focus',
    ),
  ];
}
const usefulQuantity: MethodStory = {
  prompt: '一条生产线3分钟做18朵纸花，6分钟做36朵，速度不变。有5人旁观，9分钟做多少朵？',
  frames: [
    frame(
      '只用真正决定产量的条件',
      '要找9分钟的产量，需要时间与产量的对应记录。旁观人数不会改变题目说明的不变速度。',
      '选3分钟与18朵，或6分钟与36朵',
      unitQuantity(0),
    ),
    frame(
      '先取出相同的1分钟',
      '18朵平均分3分钟，每分6朵；另一条记录36÷6也得6，速度相同。',
      '18÷3＝36÷6＝6朵/分',
      unitQuantity(1),
    ),
    frame(
      '每分钟6朵，重复9份',
      '速度不变，9分钟就有9份6朵。时间增加，产量随份数增加，不是保持原产量重新分。',
      '6×9＝54朵',
      unitQuantity(2),
    ),
  ],
  mistake: {
    question: '生产线3分做18朵、6分做36朵，旁观5人。9分产量能算9×5=45朵吗？',
    wrong: '能，用到了9和5两个数',
    right: '不能，应该9×6=54朵',
    why: '5的单位是人，不是朵/分。每分钟6朵来自产量除以对应时间，不能见到数字就相乘。',
    nodes: unitQuantity(2),
    wrongNodes: unitQuantity(2, true),
  },
  transfer: {
    question: '换情境：5本同款笔记本45元，小甲有50元，小乙单独买7本。单价不变，小乙付多少元？',
    wrong: '350元：把小甲的50元当单价',
    right: '63元：每本9元，买7本',
    why: '45÷5=9元/本，9×7=63。小甲带的钱与小乙购买无关，不参与单价和总价的计算。',
    nodes: unitQuantity(2, false, 7, 9, 50, '元'),
    wrongNodes: unitQuantity(2, true, 7, 9, 50, '元'),
  },
};

function secondElapsed(
  stage: number,
  wrong = false,
  aSpeed = 72,
  aTime = 15,
  bSpeed = 90,
  rest = 2,
): MethodNode[] {
  const distance = aSpeed * aTime,
    bTime = distance / bSpeed;
  const timeline = wrong
    ? [
        { value: aTime, label: `甲${aTime}`, tone: 'error' as const },
        { value: bTime, label: `乙${bTime}`, tone: 'known' as const },
        { value: rest, label: String(rest), tone: 'focus' as const },
      ]
    : [
        { value: bTime, label: `乙${bTime}`, tone: 'known' as const },
        { value: rest, label: String(rest), tone: 'focus' as const },
      ];
  let x = 32;
  return [
    top(
      stage < 2
        ? `同一路程${distance}米`
        : wrong
          ? `错把甲的${aTime}分也加进来`
          : `只算乙：走${bTime}分＋休${rest}分`,
    ),
    ...(stage < 2
      ? parts(
          Array(stage === 0 ? aTime : bTime).fill(1),
          79,
          Array(40).fill(stage === 0 ? 'known' : 'focus'),
          Array(40).fill(''),
          65,
        )
      : timeline.map((part) => {
          const width = (336 * part.value) / (aTime + bTime + rest),
            node = rect(x, 79, width - 2, 65, part.tone, part.label);
          x += width;
          return node;
        })),
    text(
      200,
      192,
      stage === 0
        ? `甲每框1分，走${aSpeed}米`
        : stage === 1
          ? `乙每框1分，走${bSpeed}米`
          : `休息也经过${rest}分钟`,
      'known',
      20,
    ),
    bottom(
      stage === 0
        ? `${aSpeed}×${aTime}＝${distance}米`
        : stage === 1
          ? `${distance}÷${bSpeed}＝${bTime}分`
          : `乙共${bTime + rest + (wrong ? aTime : 0)}分`,
      wrong ? 'error' : 'focus',
    ),
  ];
}
const secondPersonElapsed: MethodStory = {
  prompt:
    '甲每分钟走72米，15分钟走完一条路。乙每分钟走90米，走同一条路、途中休息2分钟。乙从出发到到达共多久？',
  frames: [
    frame(
      '甲的数据只用来找同一路程',
      '甲15分钟走过的路长1080米。乙也只走这条路，没有先走甲的15分钟。',
      '72×15＝1080米',
      secondElapsed(0),
    ),
    frame(
      '按乙的速度重新分这条路',
      '乙每分钟走90米，1080米分成12份，所以乙真正行走12分钟。',
      '1080÷90＝12分',
      secondElapsed(1),
    ),
    frame(
      '只连接乙自己的行走与休息',
      '题目问乙的时间，只算乙走路的12分和乙休息的2分。甲的15分不在乙的时间线上。',
      '12＋2＝14分',
      secondElapsed(2),
    ),
  ],
  mistake: {
    question: '甲15分走完1080米，乙90米/分走同路并休2分。乙共用15+12+2=29分吗？',
    wrong: '是，把甲和乙的时间都加上',
    right: '不是，只算乙12+2=14分',
    why: '这是两个人走同一条路，不是同一人的去程和回程。甲的时间只用来计算路程，不能加入乙的经过时间。',
    nodes: secondElapsed(2),
    wrongNodes: secondElapsed(2, true),
  },
  transfer: {
    question: '换数：甲50米/分走18分，乙75米/分走同路并休4分。乙从出发到到达共多久？',
    wrong: '34分：又加了甲的18分',
    right: '16分：乙走12分加休4分',
    why: '路程50×18=900米；乙走900÷75=12分，加自己的4分休息，共16分。',
    nodes: secondElapsed(2, false, 50, 18, 75, 4),
    wrongNodes: secondElapsed(2, true, 50, 18, 75, 4),
  },
};

export const round2U34SubskillStories: Record<string, MethodStory> = {
  'r2-same-total-inverse-compare': inverseCompare,
  'r2-remove-before-repack': removeRepack,
  'r2-reverse-shopping-price': reverseShopping,
  'r2-shopping-refund': shoppingRefund,
  'r2-compare-unit-prices': compareUnitPrices,
  'r2-discount-more-items': discountMore,
  'r2-speed-same-units': speedSameUnits,
  'r2-rest-before-deadline': restDeadline,
  'r2-production-rate-change': changedRate,
  'r2-bracket-scope': bracketsScope,
  'r2-nested-division': nested,
  'r2-reverse-bracket-equation': reverseEquation,
  'r2-at-least-purchase': atLeastPurchase,
  'r2-useful-unit-quantity': usefulQuantity,
  'r2-second-person-elapsed': secondPersonElapsed,
};
