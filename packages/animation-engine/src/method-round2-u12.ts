import { frame, line, rect, text, type MethodNode, type MethodStory } from './method-primitives';
import { unit12Stories } from './methods-u12';
import { extraSubskillStories } from './method-extra-subskills';

/** Individually checked question relationships; never infer a family from runtime keywords. */
export const round2U12QuestionSubskills: Record<string, Record<string, string>> = {
  'u1-units': {
    'full-p06-s3-q2': 'r2-age-scale',
    'full-p17-s3-q2': 'r2-mixed-units',
  },
  'u1-changes': {
    'full-p06-s2-q11': 'r2-equal-payment-compensation',
    'full-p14-s3-q3-1': 'r2-scaled-remainder',
    'full-p14-s3-q3-2': 'r2-scaled-remainder',
    'full-p16-s1-q4-2': 'r2-scaled-remainder',
    'full-p16-s2-q2': 'r2-scaled-remainder',
    'full-p17-s1-q4': 'r2-scaled-remainder',
    'full-p17-s3-q5': 'r2-scaled-remainder',
  },
  'u1-restore': {
    'full-p07-q6': 'r2-division-sum',
    'full-p07-q13': 'r2-division-sum',
    'full-p07-q14': 'r2-division-sum',
    'full-p07-q15': 'r2-division-sum',
    'full-p07-q16': 'r2-division-sum',
    'full-p07-q20': 'r2-division-sum',
    'full-p07-q7': 'r2-same-remainder-difference',
    'full-p07-q8': 'r2-same-remainder-difference',
    'full-p07-q17': 'r2-same-remainder-difference',
    'full-p07-q18': 'r2-same-remainder-difference',
  },
  'u1-loading': {
    'full-p04-s5-q2': 'r2-material-bottleneck',
    'full-p14-s2-q10': 'r2-material-bottleneck',
    'full-p16-s1-q8': 'r2-material-bottleneck',
  },
  'u1-groups': {
    'full-p04-s5-q6': 'r2-shared-carrying',
    'full-p08-q1': 'r2-shared-carrying',
    'full-p08-q2': 'r2-shared-carrying',
    'full-p08-q4': 'r2-shared-carrying',
    'full-p08-q5': 'r2-shared-carrying',
    'full-p08-q6': 'r2-shared-carrying',
    'full-p08-q8': 'r2-shared-carrying',
    'full-p08-q9': 'r2-shared-carrying',
    'full-p08-q10': 'r2-shared-carrying',
    'full-p08-q11': 'r2-shared-carrying',
    'full-p17-s3-q12': 'r2-shared-carrying',
  },
  'u2-tiling': {
    'full-p01-s5-q2': 'r2-moving-area',
    'full-p02-s5-q4-2': 'r2-moving-area',
    'full-p05-s5-q3': 'r2-moving-area',
    'full-p15-s5-q3': 'r2-moving-area',
  },
  'u2-fence': {
    'full-p05-s5-q4-1': 'r2-square-wall',
    'full-p05-s5-q4-2': 'r2-square-wall',
    'full-p15-s2-q4': 'r2-square-wall',
    'full-p18-q27': 'r2-shared-fence',
  },
  'u2-compare': {
    'full-p02-s3-q11': 'r2-square-scale',
    'full-p10-s1-q4': 'r2-square-scale',
    'full-p10-s2-q6': 'r2-area-per-person',
    'full-p16-s2-q5': 'r2-area-per-person',
  },
  'u2-units': { 'u2-21': 'r2-perimeter-area-filter' },
  'u2-measure': {
    'full-p01-s1-q2': 'r2-polygon-boundary',
    'full-p01-s3-q1-2': 'r2-polygon-boundary',
    'u2-10': 'r2-polygon-boundary',
    'u2-11': 'r2-polygon-boundary',
    'full-p01-s4-q1': 'r2-polygon-boundary',
    'full-p02-s4-q1': 'r2-polygon-boundary',
    'full-p02-s2-q1-1': 'r2-measure-product',
    'full-p02-s2-q1-7': 'r2-measure-product',
    'full-p02-s2-q1-8': 'r2-measure-product',
    'full-p02-s2-q1-9': 'r2-measure-product',
    'full-p02-s2-q1-10': 'r2-measure-product',
    'full-p02-s2-q1-2': 'r2-measure-division',
    'full-p02-s2-q1-3': 'r2-measure-division',
    'full-p02-s2-q1-4': 'r2-measure-division',
    'full-p02-s2-q1-5': 'r2-measure-division',
    'full-p02-s2-q1-6': 'r2-measure-division',
    'full-p02-s2-q1-11': 'r2-measure-division',
    'full-p02-s2-q1-13': 'r2-measure-division',
    'full-p02-s2-q1-14': 'r2-measure-division',
    'full-p02-s2-q1-15': 'r2-measure-division',
    'full-p02-s2-q1-12': 'r2-measure-continuous-division',
    'full-p02-s2-q1-16': 'r2-measure-zero-product',
  },
};

const caption = (nodes: MethodNode[], value: string, wrong = false): MethodNode[] => [
  ...nodes,
  text(200, 237, value, wrong ? 'error' : 'focus', 20),
];
const dots = (
  count: number,
  x: number,
  y: number,
  tone: 'focus' | 'error' = 'focus',
): MethodNode[] =>
  Array.from({ length: count }, (_, i) => ({ kind: 'dot', x: x + i * 24, y, tone }));

function ageModel(weeks: number, stage: number, wrong = false): MethodNode[] {
  const years = weeks / 52;
  if (wrong)
    return caption(
      [
        text(200, 27, '错误想法：数字一样，时间就一样', 'error', 20),
        ...['秒', '时', '日', '周'].map((unit, i) =>
          rect(
            36 + (i % 2) * 176,
            52 + Math.floor(i / 2) * 74,
            152,
            55,
            'error',
            `${weeks}${unit}`,
          ),
        ),
      ],
      '忽略单位，把四种时间当成相同',
      true,
    );
  if (stage === 0)
    return caption(
      ['秒', '时', '日', '周'].flatMap((unit, i) => [
        rect(36 + (i % 2) * 176, 52 + Math.floor(i / 2) * 74, 152, 55, 'known', `${weeks}${unit}`),
      ]),
      '数字相同，时间长短不同',
    );
  if (stage === 1)
    return caption(
      [
        text(200, 26, '一年约52周', 'known', 22),
        ...Array.from({ length: years }, (_, i) =>
          rect(45 + (i % 3) * 106, 48 + Math.floor(i / 3) * 49, 96, 40, 'focus', '52周'),
        ),
      ],
      `${weeks}周约是${years}年`,
    );
  return caption(
    [
      text(200, 26, '先把各项换成好理解的时间', 'known', 20),
      ...[
        [`${weeks}秒`, '不到1时'],
        [`${weeks}时`, '不到20日'],
        [`${weeks}日`, '不到2年'],
        [`${weeks}周`, `约${years}年`],
      ].flatMap(([from, to], i) => [
        rect(34, 45 + i * 42, 140, 36, i === 3 ? 'focus' : 'quiet', from),
        rect(226, 45 + i * 42, 140, 36, i === 3 ? 'focus' : 'quiet', to),
        line(174, 62 + i * 42, 226, 62 + i * 42, i === 3 ? 'focus' : 'quiet'),
      ]),
    ],
    wrong ? `只看数字${weeks}，忽略了单位` : `接近${years}岁，要选“周”`,
    wrong,
  );
}
const ageScale: MethodStory = {
  prompt: '哪个接近9岁孩子的年龄：468秒、468时、468日、468周？一年约52周。',
  frames: [
    frame(
      '先读数字后面的单位',
      '相同的468，配不同单位，表示的时间可以差很多。',
      '秒＜时＜日＜周',
      ageModel(468, 0),
    ),
    frame(
      '把周数装进一年一组',
      '每52周约是一年。468周可分成9组52周，约9年。',
      '468÷52＝9年（约）',
      ageModel(468, 1),
    ),
    frame(
      '用年龄量级排除其余项',
      '468秒不到1小时；468时不到20天；468日不到2年。只有468周约9年。',
      '468周≈9年',
      ageModel(468, 2),
    ),
  ],
  mistake: {
    question: '数字都是468，就表示一样长、都能作为9岁孩子的年龄吗？一年约52周。',
    wrong: '一样长，只看数字468就行',
    right: '不一样，还要看时间单位',
    why: '单位决定每一份有多长。468周约9年，468日却不到2年；不能只比较数字。',
    nodes: ageModel(468, 2),
    wrongNodes: ageModel(468, 2, true),
  },
  transfer: {
    question: '换数：一年约52周，416周和416日，哪个接近8岁孩子的年龄？',
    wrong: '416日，数字都是416',
    right: '416周，约416÷52＝8年',
    why: '416周约8年，416日不到2年。比较年龄要先统一到年或熟悉的时间量级。',
    nodes: ageModel(416, 1),
    wrongNodes: ageModel(416, 2, true),
  },
};

function unitsModel(stage: number, wrong = false): MethodNode[] {
  if (stage === 0)
    return caption(
      [
        text(200, 25, '先找每1个大单位里有多少小单位', 'known', 20),
        ...[
          ['1时', '60分'],
          ['1分', '60秒'],
          ['1米', '100厘米'],
          ['1日', '24时'],
        ].flatMap(([a, b], i) => [
          rect(40, 43 + i * 43, 106, 36, 'known', a),
          line(146, 61 + i * 43, 230, 61 + i * 43),
          rect(230, 43 + i * 43, 130, 36, 'focus', b),
        ]),
      ],
      '单位不同，进率不一定相同',
    );
  if (stage === 1)
    return caption(
      [
        text(
          200,
          27,
          wrong ? '错误分组：把60厘米当1米' : '1200厘米，按每米100厘米分组',
          wrong ? 'error' : 'known',
          20,
        ),
        ...Array.from({ length: wrong ? 20 : 12 }, (_, i) =>
          wrong
            ? rect(40 + (i % 5) * 65, 48 + Math.floor(i / 5) * 38, 57, 36, 'error', '60')
            : rect(40 + (i % 4) * 82, 52 + Math.floor(i / 4) * 48, 74, 39, 'focus', '100'),
        ),
        ...(!wrong ? [text(200, 209, '12份100厘米＝12米', 'focus', 20)] : []),
      ],
      wrong ? '错把每60厘米叫1米，得到20米' : '1200÷100＝12米',
      wrong,
    );
  return caption(
    [
      text(200, 27, '小单位换大单位：按进率分组', 'known', 20),
      rect(28, 62, 148, 65, 'known', '360分'),
      rect(224, 62, 148, 65, 'focus', '6时'),
      line(176, 94, 224, 94),
      text(200, 53, '÷60', 'focus', 20),
      rect(28, 146, 148, 65, 'known', '480时'),
      rect(224, 146, 148, 65, 'focus', '20日'),
      line(176, 178, 224, 178),
      text(200, 137, '÷24', 'focus', 20),
    ],
    '420秒÷60＝7分',
  );
}
const mixedUnits: MethodStory = {
  prompt: '把360分、1200厘米、420秒、480时分别换成时、米、分、日。',
  frames: [
    frame(
      '先把每种单位配对',
      '分与时、秒与分都按60分组；厘米与米按100，时与日按24。',
      '1时＝60分；1米＝100厘米；1日＝24时',
      unitsModel(0),
    ),
    frame(
      '长度按100厘米圈成1米',
      '1200厘米能圈成12份100厘米。不能看到换算就统一除以60。',
      '1200÷100＝12米',
      unitsModel(1),
    ),
    frame(
      '按各自的进率分组',
      '求有几个大单位，就除以每个大单位包含的小单位数。',
      '360÷60＝6；420÷60＝7；480÷24＝20',
      unitsModel(2),
    ),
  ],
  mistake: {
    question: '把1200厘米换成米，可以像分换成时一样除以60吗？',
    wrong: '可以，所有单位都除以60',
    right: '不可以，厘米换米要除以100',
    why: '每1米是100厘米。60是时、分、秒之间的进率，不是长度的进率。',
    nodes: unitsModel(1),
    wrongNodes: unitsModel(1, true),
  },
  transfer: {
    question: '换数：600厘米等于几米？已知1米＝100厘米。',
    wrong: '10米：600÷60',
    right: '6米：600÷100',
    why: '把600厘米分成6份100厘米，每份1米，所以是6米。',
    nodes: caption(
      [
        text(200, 27, '每100厘米是1米', 'known', 20),
        ...Array.from({ length: 6 }, (_, i) =>
          rect(46 + (i % 3) * 106, 64 + Math.floor(i / 3) * 68, 96, 52, 'focus', '100'),
        ),
      ],
      '6份100厘米＝6米',
    ),
    wrongNodes: caption(
      Array.from({ length: 10 }, (_, i) =>
        rect(32 + (i % 5) * 68, 64 + Math.floor(i / 5) * 68, 60, 52, 'error', '60'),
      ),
      '错把每60厘米叫1米',
      true,
    ),
  },
};

function scaledRemainderModel(scale: number, wrong = false): MethodNode[] {
  return caption(
    [
      text(200, 27, `${59 * scale}÷${7 * scale}：仍分8份`, 'known', 22),
      ...Array.from({ length: 8 }, (_, i) =>
        rect(40 + (i % 4) * 83, 50 + Math.floor(i / 4) * 50, 74, 40, 'known', String(7 * scale)),
      ),
      ...(scale === 1 || wrong
        ? dots(3, 176, 182, wrong ? 'error' : 'focus')
        : Array.from({ length: 3 }, (_, i) =>
            rect(111 + i * 63, 161, 54, 42, 'focus', String(scale)),
          )),
    ],
    wrong
      ? `错误合计：${56 * scale + 3}，凑不回${59 * scale}`
      : `8×${7 * scale}＋${3 * scale}＝${59 * scale}`,
    wrong,
  );
}
const scaledRemainder: MethodStory = {
  prompt: '59÷7＝8……3。被除数、除数同时乘10后，商和余数怎样变？',
  frames: [
    frame('先把原来的总量分清', '59里分出8份7，还剩3个一。', '59＝7×8＋3', scaledRemainderModel(1)),
    frame(
      '每个一都变成一个十',
      '总量和每份量同时乘10，份数仍是8；剩下的3个一也要变成3个十。',
      '590÷70＝8……30',
      scaledRemainderModel(10),
    ),
    frame(
      '用乘加验算余数的单位',
      '8份70是560，补30才能回到590。只补3会得到563。',
      '70×8＋30＝590；30＜70',
      caption(scaledRemainderModel(10).slice(0, -1), '商不变，余数也乘10'),
    ),
    frame(
      '反过来同除，余数也要同除',
      '把590和70同时除以10，每份从70变7，份数仍8；原来的余30也变成3。商不变，不代表余数不变。',
      '590÷70＝8……30 → 59÷7＝8……3',
      caption(
        [...scaledRemainderModel(1).slice(0, -1), text(200, 211, '原余30÷10＝3', 'focus', 20)],
        '商仍8，余数30÷10＝3',
      ),
    ),
  ],
  mistake: {
    question: '59÷7＝8……3。两数同时乘10，590÷70的余数仍是3吗？',
    wrong: '是，商和余数都不变',
    right: '不是，余数也乘10，变成30',
    why: '商是份数，仍为8；余数与被除数使用同一计数单位，也扩大10倍。70×8＋3只等于563。',
    nodes: scaledRemainderModel(10),
    wrongNodes: scaledRemainderModel(10, true),
  },
  transfer: {
    question: '换倍数：59÷7＝8……3。两数同时乘100，5900÷700的余数是多少？',
    wrong: '3，商不变所以余数不变',
    right: '300，余数也乘100',
    why: '原来的3个一变成3个百。700×8＋300＝5900，且300小于700。',
    nodes: scaledRemainderModel(100),
    wrongNodes: scaledRemainderModel(100, true),
  },
};

function divisionSumModel(
  quotient: number,
  sum: number,
  stage: number,
  wrong = false,
): MethodNode[] {
  const parts = quotient + 1,
    remainder = sum - quotient,
    divisor = remainder / (wrong ? quotient : parts);
  return caption(
    [
      text(
        200,
        25,
        stage === 0 ? `总和${sum}，商${quotient}` : `先扣商：${sum}−${quotient}＝${remainder}`,
        'known',
        20,
      ),
      ...Array.from({ length: parts }, (_, i) =>
        rect(
          36 + (i % 4) * 85,
          60 + Math.floor(i / 4) * 67,
          75,
          50,
          i === quotient ? (wrong ? 'error' : 'focus') : 'known',
          stage < 2 ? '?' : String(divisor),
          wrong && i === quotient,
        ),
      ),
      text(200, 200, `${quotient}份是被除数，另1份是除数`, 'known', 20),
    ],
    wrong
      ? `${parts}份${divisor}＝${parts * divisor}，超出${remainder}`
      : stage === 0
        ? `被除数＝除数×${quotient}`
        : stage === 1
          ? `一共${parts}份除数`
          : `除数${divisor}，被除数${divisor * quotient}`,
    wrong,
  );
}
const divisionSum: MethodStory = {
  prompt: '一道没有余数的除法，被除数、除数、商的和是95，商是5。求被除数和除数。',
  frames: [
    frame(
      '把被除数换成5份除数',
      '无余数，商是5，说明被除数正好是除数的5倍。除数自己还占1份。',
      '被除数＝5份除数',
      divisionSumModel(5, 95, 0),
    ),
    frame(
      '从总和中先拿走已知的商',
      '95包含被除数、除数、商。扣掉商5，剩下的是5份加1份除数。',
      '95−5＝90；90是6份除数',
      divisionSumModel(5, 95, 1),
    ),
    frame(
      '先求1份，再还原被除数',
      '90平均分成6份，每份15。被除数是其中5份，不是全部90。',
      '90÷6＝15；15×5＝75',
      divisionSumModel(5, 95, 2),
    ),
  ],
  mistake: {
    question: '无余数除法三数和95、商5。扣掉商后，90应除以5还是6来求除数？',
    wrong: '除以5，除数是18',
    right: '除以6，除数是15',
    why: '被除数有5份除数，除数自己还有1份，共6份。若每份18，6份会变成108，超过90。',
    nodes: divisionSumModel(5, 95, 2),
    wrongNodes: divisionSumModel(5, 95, 2, true),
  },
  transfer: {
    question: '换数：无余数除法三数和104，商4。被除数和除数各是多少？',
    wrong: '被除数100、除数25：100÷4',
    right: '被除数80、除数20：(104−4)÷5',
    why: '扣掉商4后有100，分成4＋1＝5份。除数20，被除数80；80＋20＋4＝104。',
    nodes: divisionSumModel(4, 104, 2),
    wrongNodes: divisionSumModel(4, 104, 2, true),
  },
};

function sameRemainderModel(stage: number, wrong = false): MethodNode[] {
  return caption(
    [
      text(200, 27, '175误写205，商多2，余数没变', 'known', 20),
      rect(28, 62, 240, 48, 'known', '原来的整份'),
      rect(270, 62, 32, 48, 'warm', '余'),
      rect(28, 130, 240, 48, 'known', '原来的整份'),
      rect(270, 130, 32, 48, 'warm', '余'),
      rect(304, 130, 32, 48, wrong ? 'error' : 'focus', stage === 0 ? '?' : wrong ? '30' : '15'),
      rect(338, 130, 32, 48, wrong ? 'error' : 'focus', stage === 0 ? '?' : wrong ? '30' : '15'),
      line(304, 185, 370, 185, 'focus'),
      text(
        337,
        209,
        stage === 0 ? '多30' : wrong ? '错成60' : '2份共30',
        wrong ? 'error' : 'focus',
        20,
      ),
    ],
    wrong
      ? '商多2，不能把30当成1份'
      : stage === 0
        ? '总量多出的30，对应多出的2份'
        : stage === 1
          ? '除数＝30÷2＝15'
          : '175÷15＝11……10',
    wrong,
  );
}
const sameRemainder: MethodStory = {
  prompt: '把被除数175误写成205，商比原来多2，余数不变。求除数和原来的余数。',
  frames: [
    frame(
      '对齐没有变化的部分',
      '余数相同，原来的整份也仍在。被除数多出的30，全部变成了额外的整份。',
      '205−175＝30',
      sameRemainderModel(0),
    ),
    frame(
      '商多2，就是多2份除数',
      '30不是除数，而是两个除数的合计。把30平均分成两份。',
      '除数＝30÷2＝15',
      sameRemainderModel(1),
    ),
    frame(
      '用原来的被除数求余数',
      '恢复除数15后，按原被除数175计算，再检查余数小于15。',
      '175＝15×11＋10',
      sameRemainderModel(2),
    ),
  ],
  mistake: {
    question: '175误写205，商多2且余数不变。除数能直接用205−175＝30吗？',
    wrong: '能，除数就是多出的30',
    right: '不能，30对应2份，除数是15',
    why: '商增加几，就多出几份除数。这里30是两份除数的和，必须除以2；若每份30，会多出60。',
    nodes: sameRemainderModel(1),
    wrongNodes: sameRemainderModel(1, true),
  },
  transfer: {
    question: '换数：被除数从158误写成194，商多3、余数不变。除数是多少？',
    wrong: '36，只算194−158',
    right: '12，(194−158)÷3',
    why: '总量多36，正好是多出的3份除数，每份36÷3＝12。',
    nodes: caption(
      [
        text(200, 28, '多出的36＝3份除数', 'known'),
        ...Array.from({ length: 3 }, (_, i) => rect(40 + i * 108, 82, 100, 80, 'focus', '12')),
      ],
      '3×12＝36',
    ),
    wrongNodes: caption(
      [
        text(200, 28, '错把36当作每1份', 'error'),
        ...Array.from({ length: 3 }, (_, i) => rect(40 + i * 108, 82, 100, 80, 'error', '36')),
      ],
      '3×36＝108，超过多出的36',
      true,
    ),
  },
};

function materialModel(transfer: boolean, stage: number, wrong = false): MethodNode[] {
  const counts = transfer ? [12, 15, 14] : [15, 20, 16];
  const supplies = transfer ? ['101÷8', '95÷6', '73÷5'] : ['90÷6', '80÷4', '96÷6'];
  const smallest = Math.min(...counts);
  return caption(
    [
      text(200, 25, '每袋都要甲、乙、丙三种材料', 'known', 20),
      ...counts.flatMap((count, row) => [
        text(
          65,
          transfer ? 64 + row * 54 : 72 + row * 60,
          stage === 0 ? supplies[row] : `${['甲', '乙', '丙'][row]}:${count}份`,
          'known',
          20,
        ),
        ...Array.from({ length: count }, (_, i) =>
          rect(
            132 + i * 11.5,
            transfer ? 44 + row * 54 : 52 + row * 60,
            9,
            transfer ? 28 : 32,
            wrong ? 'error' : stage > 1 && i >= smallest ? 'quiet' : 'focus',
          ),
        ),
        ...(transfer
          ? [
              text(
                246,
                92 + row * 54,
                [`余5克，不够8克`, `余5克，不够6克`, `余3克，不够5克`][row],
                'warm',
                18,
              ),
            ]
          : []),
      ]),
    ],
    wrong
      ? `错把份数相加：${counts.reduce((a, b) => a + b, 0)}袋`
      : stage < 2
        ? '分别求每种材料能配多少份'
        : `三种都够的只有${smallest}份`,
    wrong,
  );
}
const materialBottleneck: MethodStory = {
  prompt: '每袋用甲6克、乙4克、丙6克；现有甲90克、乙80克、丙96克。最多配多少袋？',
  frames: [
    frame(
      '一袋必须三种材料都齐全',
      '先分别看每种材料能配几份，不能把克数相加后随便分。',
      '甲90÷6；乙80÷4；丙96÷6',
      materialModel(false, 0),
    ),
    frame(
      '把每种材料变成可配的份数',
      '三种材料分别够15、20、16袋。图中每格只代表这种材料的一份。',
      '甲15份，乙20份，丙16份',
      materialModel(false, 1),
    ),
    frame(
      '按最先用完的材料停止',
      '配到第15袋，甲已用完；乙、丙虽有剩，也不能单独变成完整一袋。',
      '最多15袋',
      materialModel(false, 2),
    ),
  ],
  mistake: {
    question: '甲够15袋、乙够20袋、丙够16袋，每袋三种都要。最多能配51袋吗？',
    wrong: '能，15＋20＋16＝51袋',
    right: '不能，最多15袋，要三种同时够',
    why: '这些份数不是三种成品。每袋要同时拿一份甲、一份乙、一份丙，甲只能支持15袋。',
    nodes: materialModel(false, 2),
    wrongNodes: materialModel(false, 2, true),
  },
  transfer: {
    question: '换数：每袋甲8克、乙6克、丙5克；现有甲101克、乙95克、丙73克。最多配几袋？',
    wrong: '41袋，12＋15＋14',
    right: '12袋，取三种都够的最少份数',
    why: '甲101÷8＝12余5，乙95÷6＝15余5，丙73÷5＝14余3。都只能算完整份，余料不足再配一份；甲最多支持12袋。',
    nodes: materialModel(true, 2),
    wrongNodes: materialModel(true, 2, true),
  },
};

function carryingModel(
  people: number,
  carrying: number,
  distance: number,
  stage: number,
  wrong = false,
): MethodNode[] {
  const total = carrying * distance,
    each = total / people;
  if (stage === 0)
    return caption(
      [
        text(200, 27, `每一段路，都要${carrying}人一起抬`, 'known', 20),
        ...Array.from({ length: carrying }, (_, i) => [
          rect(40, 58 + i * 48, 320, 33, 'known'),
          text(200, 82 + i * 48, `${distance}米`, 'known', 20),
        ]).flat(),
      ],
      `${carrying}条“人的抬行路程”`,
    );
  if (stage === 1)
    return caption(
      [
        text(200, 27, '先合计所有人的抬行米数', 'known', 20),
        ...Array.from({ length: carrying }, (_, i) =>
          rect(
            40,
            58 + i * 48,
            320,
            33,
            wrong && i > 0 ? 'error' : 'focus',
            String(distance),
            wrong && i > 0,
          ),
        ),
      ],
      wrong ? `漏掉另外${carrying - 1}人的抬行` : `${distance}×${carrying}＝${total}人·米`,
      wrong,
    );
  return caption(
    [
      text(200, 27, `总抬行${total}人·米，平均分给${people}人`, 'known', 20),
      ...Array.from({ length: people }, (_, i) =>
        rect(
          28 + i * (344 / people),
          85,
          344 / people - 4,
          75,
          wrong ? 'error' : 'focus',
          String(wrong ? distance / people : each),
        ),
      ),
    ],
    wrong ? `错用路程${distance}÷${people}` : `每人${total}÷${people}＝${each}米`,
    wrong,
  );
}
const sharedCarrying: MethodStory = {
  prompt: '3人轮流抬物品，任何时刻都要2人一起抬，送到360米外。平均每人抬多少米？',
  frames: [
    frame(
      '一段路对应两个人在抬',
      '物品走1米，就有两个人各抬1米。人的抬行米数不是物品路程本身。',
      '每走1米，合计2人·米',
      carryingModel(3, 2, 360, 0),
    ),
    frame(
      '先合计两条抬行路程',
      '整段360米始终需要两人，所有人实际抬行的米数合计是两份360。',
      '360×2＝720人·米',
      carryingModel(3, 2, 360, 1),
    ),
    frame(
      '再把总抬行平均分给三人',
      '轮流只改变谁在抬，不改变总抬行720人·米。三人平均，每人240米。',
      '720÷3＝240米',
      carryingModel(3, 2, 360, 2),
    ),
  ],
  mistake: {
    question: '3人轮流抬360米，每次2人一起抬。平均每人能直接算360÷3吗？',
    wrong: '能，每人120米',
    right: '不能，先乘2再除以3，每人240米',
    why: '每米有两人在抬。只用360÷3，会漏掉第二个人的全部抬行路程。',
    nodes: carryingModel(3, 2, 360, 2),
    wrongNodes: carryingModel(3, 2, 360, 1, true),
  },
  transfer: {
    question: '换数：4人轮流抬320米，每次3人一起抬，平均每人抬几米？',
    wrong: '80米：320÷4',
    right: '240米：320×3÷4',
    why: '每米要3人抬，总抬行320×3＝960人·米。平均给4人，每人240米。',
    nodes: carryingModel(4, 3, 320, 2),
    wrongNodes: carryingModel(4, 3, 320, 1, true),
  },
};

function movingAreaModel(
  width: number,
  speed: number,
  minutes: number,
  stage: number,
  wrong = false,
): MethodNode[] {
  const minuteArea = width * speed;
  if (wrong)
    return caption(
      [
        text(200, 28, `路程${speed}×${minutes}＝${speed * minutes}米`, 'error', 20),
        line(42, 116, 358, 116, 'error'),
        line(42, 116, 42, 158, 'quiet', true),
        line(358, 116, 358, 158, 'quiet', true),
        line(42, 158, 358, 158, 'quiet', true),
        text(200, 193, `漏掉了${width}米的宽`, 'error', 22),
      ],
      '线的长度不能当作面的面积',
      true,
    );
  if (stage === 0)
    return caption(
      [
        text(200, 27, '1分钟压过一个长方形', 'known', 20),
        rect(70, 80, 260, (260 * width) / speed, 'focus'),
        text(200, 175, `前进${speed}米`, 'known', 22),
        text(36, 105, `${width}米`, 'known', 20),
        text(200, 110, `${speed}×${width}＝${minuteArea}㎡`, 'focus', 22),
      ],
      `每分钟覆盖${minuteArea}平方米`,
    );
  return caption(
    [
      text(200, 27, `${minutes}分钟，不重复覆盖`, 'known', 22),
      ...Array.from({ length: minutes }, (_, i) =>
        rect(
          40 + (i % 5) * 65,
          60 + Math.floor(i / 5) * 65,
          57,
          52,
          stage === 1 ? 'known' : 'focus',
          String(minuteArea),
        ),
      ),
      text(200, 210, `每块代表1分钟的${minuteArea}㎡`, 'known', 20),
    ],
    stage === 1
      ? `共${minutes}份，每份${minuteArea}平方米`
      : `${minuteArea}×${minutes}＝${minuteArea * minutes}平方米`,
  );
}
const movingArea: MethodStory = {
  prompt: '压路机每分钟前进20米，压过的宽3米。连续10分钟，不重复碾压，覆盖多少平方米？',
  frames: [
    frame(
      '把一段路扩成一条有宽度的面',
      '每分钟前进20米、宽3米，覆盖的是长20、宽3的长方形。',
      '每分钟面积20×3＝60平方米',
      movingAreaModel(3, 20, 10, 0),
    ),
    frame(
      '每过一分钟，就增加同样一块',
      '10分钟且不重复碾压，就是10块不重叠的60平方米。',
      '10份60平方米',
      movingAreaModel(3, 20, 10, 1),
    ),
    frame(
      '把十块面积相加',
      '60平方米一份，10份共600平方米。路程和面积的单位不同。',
      '20×3×10＝600平方米',
      movingAreaModel(3, 20, 10, 2),
    ),
  ],
  mistake: {
    question: '每分钟前进20米、宽3米，10分钟不重复碾压。只算20×10＝200就得到面积了吗？',
    wrong: '得到了，面积200平方米',
    right: '没有，200是米，还要乘宽3米',
    why: '20×10算的是行驶路程200米。覆盖面积要把这条线沿宽3米铺开，200×3＝600平方米。',
    nodes: movingAreaModel(3, 20, 10, 2),
    wrongNodes: movingAreaModel(3, 20, 10, 2, true),
  },
  transfer: {
    question: '换数：洒水宽4米，每分钟前进25米，8分钟不重复洒水，面积多少平方米？',
    wrong: '200平方米：25×8',
    right: '800平方米：25×4×8',
    why: '每分钟覆盖25×4＝100平方米。8分钟是8份100平方米，共800平方米。',
    nodes: movingAreaModel(4, 25, 8, 2),
    wrongNodes: movingAreaModel(4, 25, 8, 2, true),
  },
};

function squareWallModel(fence: number, stage: number, wrong = false): MethodNode[] {
  const side = fence / 3;
  if (wrong)
    return caption(
      [
        text(200, 27, '错把靠墙边也计入篱笆', 'error', 20),
        rect(120, 58, 160, 160, 'quiet'),
        line(120, 58, 280, 58, 'error', true),
        line(120, 58, 120, 218, 'known'),
        line(120, 218, 280, 218, 'known'),
        line(280, 58, 280, 218, 'known'),
        text(200, 55, '这边已有墙', 'error', 20),
        text(200, 140, `${fence}米误分4份`, 'error', 22),
      ],
      '篱笆实际上只用于三边',
      true,
    );
  return caption(
    [
      text(200, 27, '正方形一边靠墙，只围另外三边', 'known', 20),
      rect(120, 58, 160, 160, stage >= 2 ? 'focus' : 'quiet'),
      line(120, 58, 280, 58, wrong ? 'error' : 'known', true),
      line(120, 58, 120, 218, 'focus'),
      line(120, 218, 280, 218, 'focus'),
      line(280, 58, 280, 218, 'focus'),
      text(200, 55, '墙', wrong ? 'error' : 'known', 20),
      text(84, 140, stage === 0 ? '?' : String(side), 'focus', 22),
      text(316, 140, stage === 0 ? '?' : String(side), 'focus', 22),
      text(
        200,
        143,
        stage === 0
          ? `${fence}米÷3`
          : stage === 1
            ? `边长${side}米`
            : `${side}×${side}=${side * side}㎡`,
        'focus',
        22,
      ),
    ],
    wrong
      ? `错算墙边：${fence}÷4`
      : stage < 2
        ? `三条等长边共${fence}米`
        : `覆盖面积${side * side}平方米`,
    wrong,
  );
}
const squareWall: MethodStory = {
  prompt: '正方形菜地一边靠墙，另外三边共用54米篱笆。面积多少？每平方米种5株，一共多少株？',
  frames: [
    frame(
      '正方形四边相等，但只围三边',
      '靠墙的一边已有墙，不用篱笆。54米是三条相等边长的合计。',
      '边长×3＝54米',
      squareWallModel(54, 0),
    ),
    frame(
      '把篱笆平均分成三边',
      '三边一样长，54平均分3份，每份18米。不能除以4。',
      '54÷3＝18米',
      squareWallModel(54, 1),
    ),
    frame(
      '面积使用完整的长和宽',
      '虽然只围三边，里面仍是一个边长18米的正方形。',
      '18×18＝324平方米',
      squareWallModel(54, 2),
    ),
    frame(
      '每平方米的株数复制324份',
      '每平方米5株，324平方米就有324份5株；不能用篱笆米数乘5。',
      '324×5＝1620株',
      caption(
        [
          text(200, 27, '324平方米，每平方米5株', 'known', 20),
          rect(50, 65, 125, 115, 'known', '324㎡'),
          rect(250, 65, 100, 115, 'focus'),
          ...dots(3, 276, 101),
          ...dots(2, 287, 143),
        ],
        '324份5株＝1620株',
      ),
    ),
  ],
  mistake: {
    question: '正方形一边靠墙，三边篱笆共54米。边长应算54÷4吗？',
    wrong: '应算÷4，正方形有四边',
    right: '应算÷3，只围三条等长边',
    why: '正方形虽有四边，但54米不包含墙边。多除一份，会把真正需要围的三边算短。',
    nodes: squareWallModel(54, 1),
    wrongNodes: squareWallModel(54, 1, true),
  },
  transfer: {
    question: '换数：正方形花圃一边靠墙，三边篱笆共45米，占地面积多少平方米？',
    wrong: '先45÷4求边长',
    right: '225平方米：45÷3＝15，再15×15',
    why: '45米对应3条同长边，每边15米。面积用两条边长相乘，15×15＝225。',
    nodes: squareWallModel(45, 2),
    wrongNodes: squareWallModel(45, 2, true),
  },
};

function sharedFenceModel(
  length: number,
  width: number,
  stage: number,
  wrong = false,
): MethodNode[] {
  const s = 220 / length,
    x = 90,
    y = 52,
    h = width * s,
    divider = x + width * s,
    right = x + 220;
  return caption(
    [
      text(200, 26, '分成正方形与长方形，两处都围', 'known', 20),
      rect(x, y, width * s, h, 'quiet'),
      rect(divider, y, (length - width) * s, h, 'quiet'),
      line(x, y, right, y, stage > 0 ? 'focus' : 'known'),
      line(right, y, right, y + h, stage > 0 ? 'focus' : 'known'),
      line(right, y + h, x, y + h, stage > 0 ? 'focus' : 'known'),
      line(x, y + h, x, y, stage > 0 ? 'focus' : 'known'),
      line(
        divider,
        y,
        divider,
        y + h,
        stage >= 2 ? (wrong ? 'error' : 'focus') : 'known',
        stage < 2,
      ),
      ...(wrong ? [line(divider + 8, y, divider + 8, y + h, 'error', true)] : []),
      text(58, y + h / 2, String(width), 'known', 22),
      text(200, y + h + 23, `整块长${length}米`, 'known', 20),
      text(x + (width * s) / 2, y + h / 2, '正方形', 'known', 20),
      text(divider + ((length - width) * s) / 2, y + h / 2, '余下', 'known', 20),
    ],
    wrong
      ? '共同隔栏画了两遍，多算一次'
      : stage === 0
        ? '中间这条也需要篱笆'
        : stage === 1
          ? `外圈(${length}+${width})×2=${2 * (length + width)}`
          : `外圈＋隔栏＝${2 * (length + width) + width}米`,
    wrong,
  );
}
const sharedFence: MethodStory = {
  prompt:
    '30米×18米土地分出最大的正方形，其余作另一圈舍。外侧和两处之间都围篱笆，共同隔栏只围一次。最少几米？',
  frames: [
    frame(
      '先分清外圈和内部隔栏',
      '最大正方形边长18米，余下12×18米。两处之间的18米边是同一条隔栏。',
      '正方形18×18；余下12×18',
      sharedFenceModel(30, 18, 0),
    ),
    frame(
      '先沿整块土地外边走一圈',
      '外圈由两条30米和两条18米组成。内部隔栏还没计算。',
      '(30＋18)×2＝96米',
      sharedFenceModel(30, 18, 1),
    ),
    frame(
      '内部隔栏只补一次',
      '两处共用同一条18米隔栏，只需建一条。各算完整周长会重复计算。',
      '96＋18＝114米',
      sharedFenceModel(30, 18, 2),
    ),
  ],
  mistake: {
    question: '30×18米土地分成18×18和12×18两处圈舍。直接把两个周长相加，得到132米，对吗？',
    wrong: '对，72＋60＝132米',
    right: '不对，共同隔栏多算一次，应114米',
    why: '两个周长都含中间的18米边，实际只建一条。132−18＝114，也等于外圈96＋隔栏18。',
    nodes: sharedFenceModel(30, 18, 2),
    wrongNodes: sharedFenceModel(30, 18, 2, true),
  },
  transfer: {
    question: '换数：28×16米土地分出最大正方形，两处都围、隔栏共用一次。最少几米篱笆？',
    wrong: '120米，把两个周长相加',
    right: '104米，外圈88＋隔栏16',
    why: '整块外圈(28＋16)×2＝88，内部只再加一条16米的隔栏，共104米。',
    nodes: sharedFenceModel(28, 16, 2),
    wrongNodes: sharedFenceModel(28, 16, 2, true),
  },
};

function squareScaleModel(
  base: number,
  factor: number,
  stage: number,
  wrong = false,
): MethodNode[] {
  const cell = 24,
    big = base * factor,
    bx = 206,
    by = 40;
  return caption(
    [
      text(200, 27, `每条边都扩大到${factor}倍`, 'known', 22),
      ...Array.from({ length: base * base }, (_, i) =>
        rect(52 + (i % base) * cell, 84 + Math.floor(i / base) * cell, cell, cell, 'known'),
      ),
      ...(stage < 2
        ? [rect(bx, by, big * cell, big * cell, 'quiet')]
        : Array.from({ length: big * big }, (_, i) =>
            rect(
              bx + (i % big) * cell,
              by + Math.floor(i / big) * cell,
              cell,
              cell,
              wrong && i >= base * base * factor ? 'quiet' : 'focus',
            ),
          )),
      ...(stage === 1
        ? [
            line(bx, by, bx + big * cell, by, 'focus'),
            line(bx + big * cell, by, bx + big * cell, by + big * cell, 'focus'),
          ]
        : []),
      text(88, 193, stage < 2 ? `边长${base}` : `${base * base}格`, 'known', 20),
      text(
        bx + (big * cell) / 2,
        209,
        stage < 2 ? `边长${big}` : wrong ? `只画了${base * base * factor}格` : `${big * big}格`,
        wrong ? 'error' : 'focus',
        20,
      ),
    ],
    wrong
      ? `只扩大了一个方向，漏了其余格`
      : stage === 0
        ? `${base}×${factor}＝${big}`
        : stage === 1
          ? `周长：${base * 4}→${big * 4}，是${factor}倍`
          : `面积：${base * base}→${big * big}，是${factor * factor}倍`,
    wrong,
  );
}
const squareScale: MethodStory = {
  prompt: '边长3厘米的正方形，每条边扩大到原来的2倍。周长和面积各扩大到几倍？',
  frames: [
    frame(
      '长和宽都要扩大',
      '原来每边3厘米，扩大2倍后，每边都是6厘米。不是只把一条边变长。',
      '3×2＝6厘米',
      squareScaleModel(3, 2, 0),
    ),
    frame(
      '周长沿四条边相加',
      '四条边都变成原来的2倍，四边合计也变成2倍。',
      '12→24厘米，周长扩大2倍',
      squareScaleModel(3, 2, 1),
    ),
    frame(
      '面积同时增加行数和列数',
      '原来3行3列9格，新图6行6列36格。横向2倍、纵向2倍，共4倍。',
      '2×2＝4倍；9→36平方厘米',
      squareScaleModel(3, 2, 2),
    ),
  ],
  mistake: {
    question: '边长3厘米的正方形，每条边扩大2倍。面积也只扩大2倍吗？',
    wrong: '是，面积9×2＝18平方厘米',
    right: '不是，面积扩大2×2＝4倍，变36',
    why: '只画18格，仅把一个方向扩大2倍，还是长方形。新正方形还要把另一个方向扩大2倍，共36格。',
    nodes: squareScaleModel(3, 2, 2),
    wrongNodes: squareScaleModel(3, 2, 2, true),
  },
  transfer: {
    question: '换数：正方形原边长2厘米，每条边扩大3倍。周长、面积各变为原来的几倍？',
    wrong: '周长3倍，面积也3倍',
    right: '周长3倍，面积3×3＝9倍',
    why: '边长从2变6，周长8变24；面积从4变36。行数和列数都扩大3倍，所以面积9倍。',
    nodes: squareScaleModel(2, 3, 2),
    wrongNodes: squareScaleModel(2, 3, 2, true),
  },
};

function perPersonModel(stage: number, transfer = false, wrong = false): MethodNode[] {
  const areas = transfer ? [60, 96] : [72, 100],
    people = transfer ? [10, 12] : [12, 20];
  const each = areas.map((a, i) => a / people[i]);
  const crowded = each[0] < each[1] ? 0 : 1;
  return caption(
    [
      text(
        200,
        26,
        stage === 0 ? '先求总面积，再看有多少人' : '用同样大小的1平方米格比较',
        'known',
        20,
      ),
      ...areas.flatMap((area, row) => [
        text(
          70,
          78 + row * 88,
          `${['甲', '乙'][row]}${people[row]}人`,
          wrong ? 'error' : 'known',
          20,
        ),
        ...(stage === 0 || wrong
          ? [rect(143, 50 + row * 88, 208, 61, wrong ? 'error' : 'known', `${area}㎡`)]
          : Array.from({ length: each[row] }, (_, i) =>
              rect(
                141 + i * 26,
                55 + row * 88,
                24,
                40,
                stage === 2 && row !== crowded ? 'known' : 'focus',
              ),
            )),
        ...(stage > 0 && !wrong
          ? [text(244, 116 + row * 88, `每人${each[row]}㎡`, 'focus', 20)]
          : []),
      ]),
      ...(stage === 3
        ? [line(270, 51, 270, 99, 'known', true), line(270, 139, 270, 187, 'known', true)]
        : []),
    ],
    wrong
      ? '错把总面积或人数单独拿来比'
      : stage === 0
        ? '面积÷人数，才是每人的那份'
        : stage === 1
          ? `甲每人${each[0]}平方米，乙每人${each[1]}平方米`
          : stage === 3
            ? '人均至少5㎡：等于5也符合'
            : each[0] < each[1]
              ? '甲每人空间小，更拥挤'
              : '乙每人空间小，更拥挤',
    wrong,
  );
}
const areaPerPerson: MethodStory = {
  prompt: '甲场地9×8米、12人；乙场地10×10米、20人。哪里更拥挤？若人均至少5平方米，两处都符合吗？',
  frames: [
    frame(
      '先把长宽换成总面积',
      '甲72平方米、乙100平方米；但总面积较小，不等于每人分到的空间较小。',
      '甲9×8＝72；乙10×10＝100',
      perPersonModel(0),
    ),
    frame(
      '把面积平均分给各自的人数',
      '比较拥挤程度，要把两处都换成每1人占的面积。',
      '甲72÷12＝6；乙100÷20＝5',
      perPersonModel(1),
    ),
    frame(
      '用每个人的空间判断拥挤',
      '每格都是1平方米。乙每人只有5格，比甲的6格少，所以乙更拥挤。',
      '5＜6，乙更拥挤',
      perPersonModel(2),
    ),
    frame(
      '至少包含刚好相等的情况',
      '要求至少5平方米，就是不能小于5。甲6、乙5，都符合，不必严格大于5。',
      '6≥5，5≥5，都符合',
      perPersonModel(3),
    ),
  ],
  mistake: {
    question: '甲72平方米12人，乙100平方米20人。甲面积较小，所以甲一定更拥挤，对吗？',
    wrong: '对，只比较总面积就行',
    right: '不对，乙每人5平方米，更拥挤',
    why: '甲每人72÷12＝6平方米，乙每人100÷20＝5平方米。拥挤程度要用同样1人的空间比较。',
    nodes: perPersonModel(2),
    wrongNodes: perPersonModel(2, false, true),
  },
  transfer: {
    question: '换数：甲60平方米10人，乙96平方米12人。哪里更拥挤？',
    wrong: '乙，因为12人比10人多',
    right: '甲，人均6平方米，小于乙的8',
    why: '甲60÷10＝6，乙96÷12＝8。人较多也可能每人空间更大，不能只数人数。',
    nodes: perPersonModel(2, true),
    wrongNodes: perPersonModel(2, true, true),
  },
};

function compensationModel(
  stage: number,
  a = 6,
  b = 24,
  payback = 108,
  wrong = false,
): MethodNode[] {
  const fair = (a + b) / 2,
    extra = (b - a) / 2,
    count = wrong ? b - a : extra,
    price = payback / count;
  if (stage === 2)
    return caption(
      [
        text(
          200,
          27,
          `${payback}元，对应${wrong ? '错认的' : '多分的'}${count}支`,
          wrong ? 'error' : 'known',
          20,
        ),
        ...Array.from({ length: count }, (_, i) =>
          rect(
            33 + (i % 6) * 57,
            53 + Math.floor(i / 6) * 45,
            50,
            36,
            wrong ? 'error' : 'focus',
            String(price),
          ),
        ),
      ],
      wrong
        ? `按${price}元算，多分${extra}支只值${extra * price}元`
        : `每支${payback}÷${count}＝${price}元`,
      wrong,
    );
  return caption(
    [
      text(200, 27, '两人出钱一样多，应各得一半', 'known', 20),
      text(47, 80, `甲${a}支`, 'known', 20),
      text(47, 153, `乙${b}支`, 'known', 20),
      ...Array.from({ length: stage === 0 ? a : fair }, (_, i) =>
        rect(95 + i * 10, 55, 9, 35, i < a ? 'known' : 'focus', undefined, i >= a),
      ),
      ...Array.from({ length: b }, (_, i) =>
        rect(95 + i * 10, 128, 9, 35, stage > 0 && i >= fair ? 'warm' : 'known'),
      ),
      ...(stage > 0
        ? [
            line(95 + fair * 10, 43, 95 + fair * 10, 182, 'focus', true),
            text(245, 207, `应各得${fair}支`, 'focus', 20),
          ]
        : []),
    ],
    stage === 0 ? `相差${b - a}支，要从差里各补一半` : `乙多分${extra}支，对应应退的${payback}元`,
  );
}
const equalPayment: MethodStory = {
  prompt: '甲乙出同样多的钱买同样的笔，甲分6支、乙分24支。乙退给甲108元后公平了，每支多少元？',
  frames: [
    frame(
      '同钱先对应同样的笔数',
      '一共30支，若按相同付款公平分，应各得15支。不是把24−6全看作乙多拿的数量。',
      '(6＋24)÷2＝15支',
      compensationModel(0),
    ),
    frame(
      '数量差一半，才是多分的笔',
      '甲比应得的15支少9支；乙比15支多9支。两边的一少一多合成18支差。',
      '多分(24−6)÷2＝9支',
      compensationModel(1),
    ),
    frame(
      '退款只补偿乙多分的9支',
      '乙多拿9支，退108元抵这9支的钱，所以108要分成9份。',
      '108÷9＝12元/支',
      compensationModel(2),
    ),
  ],
  mistake: {
    question: '同钱买笔，甲6支、乙24支，乙退108元。单价能直接算108÷(24−6)吗？',
    wrong: '能，每支6元',
    right: '不能，18支差的一半才是补偿数量，每支12元',
    why: '每人本应15支，乙只比应得的数量多9支。若单价6元，9支只值54元，对不上108元退款。',
    nodes: compensationModel(2),
    wrongNodes: compensationModel(2, 6, 24, 108, true),
  },
  transfer: {
    question: '换数：同钱买笔，甲8支、乙22支，乙退给甲70元后公平。每支多少元？',
    wrong: '5元：70÷14',
    right: '10元：70÷[(22−8)÷2]',
    why: '两人应各15支，乙多拿7支，不是14支。70元补7支，每支10元。',
    nodes: compensationModel(2, 8, 22, 70),
    wrongNodes: compensationModel(2, 8, 22, 70, true),
  },
};

function unrollPolygon(sides: number[], stage: number, wrong = false): MethodNode[] {
  const total = sides.reduce((n, side) => n + side, 0),
    scale = 320 / total;
  let x = 40,
    accumulated = 0;
  const nodes: MethodNode[] = [
    text(
      200,
      27,
      wrong ? '错套长方形：把两条边各算两次' : '每条实际的边，只数一次',
      wrong ? 'error' : 'known',
      20,
    ),
  ];
  for (const [i, side] of sides.entries()) {
    const width = side * scale;
    nodes.push(
      line(x, 123, x + width, 123, wrong && i >= 2 ? 'error' : i === 1 ? 'known' : 'focus'),
    );
    nodes.push(text(x + width / 2, 100, String(side), wrong ? 'error' : 'known', 22));
    if (stage === 2) {
      nodes.push(line(x, 128, x, 145));
      nodes.push(text(x, 173, String(accumulated), 'known', 20));
    }
    x += width;
    accumulated += side;
  }
  if (stage === 2)
    nodes.push(line(x, 128, x, 145), text(x, 173, String(total), wrong ? 'error' : 'focus', 20));
  return caption(
    nodes,
    wrong
      ? `错误多算成${total}厘米`
      : stage === 1
        ? '各边首尾相接，展开后总长不变'
        : `${sides.join('＋')}＝${total}厘米`,
    wrong,
  );
}
const polygonBoundary: MethodStory = {
  prompt: '三角形三边5、12、13厘米；正六边形每边4厘米。沿各自外边走一周，周长怎样求？',
  frames: [
    frame(
      '先数实际有几条边',
      '三角形有三条边。沿外边走一周，就要把5、12、13各走一次。',
      '周长是实际各边的总长',
      caption(
        [
          text(200, 27, '三角形：三条实际的边', 'known', 20),
          line(70, 170, 70, 60, 'known'),
          line(70, 60, 334, 170, 'known'),
          line(334, 170, 70, 170, 'known'),
          text(38, 122, '5', 'known', 22),
          text(200, 201, '12', 'known', 22),
          text(219, 105, '13', 'known', 22),
        ],
        '5、12、13各走一次',
      ),
    ),
    frame(
      '把每条边首尾接成一条线',
      '把边展开，只改变摆放方向，不改变每条边的长度。三段都要保留。',
      '依次连接5、12、13厘米',
      unrollPolygon([5, 12, 13], 1),
    ),
    frame(
      '累加到最后一个端点',
      '走完5厘米，再走12到17，再走13到30。最后的总长度就是周长。',
      '5＋12＋13＝30厘米',
      unrollPolygon([5, 12, 13], 2),
    ),
    frame(
      '相同长度的边，可以合并成乘法',
      '正六边形有6条相等的4厘米边。先数6条，再把6份4厘米相加，简写成4×6。',
      '4×6＝24厘米',
      unrollPolygon([4, 4, 4, 4, 4, 4], 2),
    ),
  ],
  mistake: {
    question: '三角形三边5、12、13厘米，可以套长方形公式(5＋12)×2求周长吗？',
    wrong: '可以，周长34厘米',
    right: '不可以，三条边相加才是30厘米',
    why: '长方形公式利用两组对边相等。三角形只有三边，套公式会漏掉13，又把5和12各算两次。',
    nodes: unrollPolygon([5, 12, 13], 2),
    wrongNodes: unrollPolygon([5, 12, 5, 12], 2, true),
  },
  transfer: {
    question: '换图：四边形四条边分别2、5、4、6厘米。周长是多少？',
    wrong: '14厘米，只用(2＋5)×2',
    right: '17厘米，2＋5＋4＋6',
    why: '没有给出对边相等，就不能把前两边重复两次。沿四条实际边依次加，总长17厘米。',
    nodes: unrollPolygon([2, 5, 4, 6], 2),
    wrongNodes: unrollPolygon([2, 5, 2, 5], 2, true),
  },
};

function perimeterFilterModel(perimeter: number, minimum: number, stage: number): MethodNode[] {
  const half = perimeter / 2,
    pairs = Array.from({ length: Math.floor(half / 2) }, (_, i) => ({
      width: i + 1,
      length: half - i - 1,
    }));
  if (stage === 0)
    return caption(
      [
        text(200, 27, `四边总长${perimeter}厘米`, 'known', 22),
        rect(34, 63, 150, 60, 'known', '长＋宽'),
        rect(216, 63, 150, 60, 'known', '长＋宽'),
        text(200, 171, `${perimeter}÷2＝${half}厘米`, 'focus', 24),
      ],
      '先把四边分成两组长＋宽',
    );
  const passing = pairs.filter((p) => p.length * p.width >= minimum).length;
  return caption(
    [
      text(
        200,
        27,
        stage === 1 ? `宽从1列到${pairs.length}，长＝${half}−宽` : `面积至少${minimum}，等于也达标`,
        'known',
        20,
      ),
      ...pairs.flatMap((p, i) => {
        const center = 24 + (352 / pairs.length) * (i + 0.5),
          area = p.length * p.width;
        const tone = stage === 1 ? 'known' : area >= minimum ? 'focus' : 'quiet';
        return [
          rect(center - p.length * 3, 125 - p.width * 6, p.length * 6, p.width * 6, tone),
          text(center, 158, `${p.length}×${p.width}`, tone, 20),
          ...(stage === 2 ? [text(center, 192, `面积${area}`, tone, 20)] : []),
        ];
      }),
    ],
    stage === 1 ? '只列长≥宽，避免重复' : `保留达标的${passing}种，面积小的去掉`,
  );
}
function repeatedRotationModel(): MethodNode[] {
  return caption(
    [
      text(200, 27, '错误：旋转后又算一次', 'error', 20),
      rect(64, 88, 96, 24, 'error'),
      text(112, 147, '8×2', 'error', 22),
      rect(263, 55, 24, 96, 'error'),
      text(275, 186, '2×8', 'error', 22),
    ],
    '同一种摆法旋转后，不是新方案',
    true,
  );
}
const perimeterAreaFilter: MethodStory = {
  prompt: '长方形周长20厘米，长宽都是整厘米，面积至少16平方厘米。长宽交换算同一种，共有几种？',
  frames: [
    frame(
      '先把周长换成长宽和',
      '一周包含两条长和两条宽。把20分成两份，才得到一条长加一条宽是10。',
      '长＋宽＝20÷2＝10厘米',
      perimeterFilterModel(20, 16, 0),
    ),
    frame(
      '按宽从小到大，配出所有整数组合',
      '宽取1、2、3、4、5，长依次9、8、7、6、5。再往后只是把前面的长宽交换，不能重复计数。',
      '(9,1)、(8,2)、(7,3)、(6,4)、(5,5)',
      perimeterFilterModel(20, 16, 1),
    ),
    frame(
      '逐个算面积，再用门槛筛选',
      '五种面积是9、16、21、24、25。至少16包含恰好16，所以去掉9，留下4种。',
      '16、21、24、25达标，共4种',
      perimeterFilterModel(20, 16, 2),
    ),
  ],
  mistake: {
    question: '周长20厘米、面积至少16平方厘米。8×2与2×8应该算两种，所以共有8种吗？',
    wrong: '应该，长宽交换再算一次，共8种',
    right: '不应该，旋转算同一种，共4种',
    why: '8×2只是转成2×8，周长、面积及形状都没有改变。只列长不小于宽的组合，面积达到16的共4种。',
    nodes: perimeterFilterModel(20, 16, 2),
    wrongNodes: repeatedRotationModel(),
  },
  transfer: {
    question:
      '换数：长方形周长18厘米，长宽为整厘米，面积至少14平方厘米；长宽交换算同一种，共几种？',
    wrong: '2种，面积必须大于14',
    right: '3种：7×2、6×3、5×4',
    why: '长宽和9，依次1×8、2×7、3×6、4×5，面积8、14、18、20。至少14包括14，后三种均达标。',
    nodes: perimeterFilterModel(18, 14, 2),
    wrongNodes: caption(
      perimeterFilterModel(18, 15, 2).slice(0, -1),
      '错把“至少14”当成“大于14”',
      true,
    ),
  },
};

export const round2U12SubskillStories: Record<string, MethodStory> = {
  'r2-age-scale': ageScale,
  'r2-mixed-units': mixedUnits,
  'r2-scaled-remainder': scaledRemainder,
  'r2-division-sum': divisionSum,
  'r2-same-remainder-difference': sameRemainder,
  'r2-material-bottleneck': materialBottleneck,
  'r2-shared-carrying': sharedCarrying,
  'r2-moving-area': movingArea,
  'r2-square-wall': squareWall,
  'r2-shared-fence': sharedFence,
  'r2-square-scale': squareScale,
  'r2-area-per-person': areaPerPerson,
  'r2-equal-payment-compensation': equalPayment,
  'r2-polygon-boundary': polygonBoundary,
  'r2-perimeter-area-filter': perimeterAreaFilter,
  // A source-paper arithmetic block was classified under measurement. Reuse arithmetic
  // models explicitly instead of presenting an unrelated perimeter/area lesson.
  'r2-measure-product': extraSubskillStories['extra-oral-product'],
  'r2-measure-division': unit12Stories['u1-written'],
  'r2-measure-continuous-division': unit12Stories['u1-order'],
  'r2-measure-zero-product': extraSubskillStories['extra-zero-product'],
};
