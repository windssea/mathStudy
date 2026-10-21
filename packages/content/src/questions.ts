import { questionSchema } from '@mathstudy/contracts';
import collectedData from '../../../content/practice/collected-questions.json';
import fullPaperData from '../../../content/practice/full-questions.json';
import unit345Data from '../../../content/practice/unit345-questions.json';
import unit345LegacyTopics from '../../../content/practice/unit345-legacy-topics.json';
import type { Question, QuestionType, Difficulty, Visual } from '@mathstudy/contracts';
import { unit2Questions, unit2VisualOverrides } from './unit2-questions';
import { depthQuestions } from './depth-questions';

type Spec = {
  id: string;
  unitId: string;
  lessonId?: string;
  title: string;
  stem: string;
  type?: QuestionType;
  difficulty?: Difficulty;
  suffix?: string;
  answer: number;
  analysis: string;
  steps: string[];
  pitfall?: string;
  visual?: Visual;
  options?: string[];
};
const pages: Record<string, [number, number]> = {
  U01: [2, 16],
  U02: [18, 43],
  U03: [45, 56],
  U04: [58, 63],
  U05: [68, 88],
  U06: [95, 103],
};
function item(s: Spec): Question {
  return {
    id: s.id,
    unitId: s.unitId,
    lessonId: s.lessonId,
    title: s.title,
    type: s.type ?? 'fill',
    difficulty: s.difficulty ?? 'basic',
    stem: s.stem,
    fields: [{ key: 'value', label: s.options ? '选择一个答案' : '你的答案', suffix: s.suffix }],
    options: s.options,
    hint: s.analysis,
    sourceKind: 'original',
    knowledge: s.title,
    pages: pages[s.unitId],
    hasVisual: !!s.visual,
    expected: { value: String(s.answer) },
    explanation: {
      analysis: s.analysis,
      steps: s.steps,
      answer: s.options ? s.options[s.answer] : `${s.answer}${s.suffix ?? ''}`,
      pitfall: s.pitfall ?? '先找清条件和问题，算完后带回情境检查。',
      visual: s.visual,
    },
  };
}
function division(
  id: string,
  lessonId: string,
  n: number,
  d: number,
  difficulty: Difficulty = 'basic',
  story?: string,
): Question {
  const q = Math.floor(n / d),
    r = n % d;
  return {
    id,
    lessonId,
    unitId: 'U01',
    title: '商与余数',
    type: story ? 'application' : 'fill',
    difficulty,
    stem: story ?? `${n} ÷ ${d} 的商和余数分别是多少？`,
    fields: [
      { key: 'quotient', label: '商' },
      { key: 'remainder', label: '余数' },
    ],
    hint: `先用乘法找出不超过 ${n} 的最大 ${d} 的倍数。`,
    sourceKind: 'original',
    knowledge: '两、三位数除以两位数',
    pages: pages.U01,
    hasVisual: false,
    expected: { quotient: String(q), remainder: String(r) },
    explanation: {
      analysis: `求能分成多少份，用除法。用 ${d} 乘试商，再检查余下的部分。`,
      steps: [
        `${d} × ${q} = ${d * q}`,
        `${n} − ${d * q} = ${r}`,
        `${r} < ${d}，所以商是 ${q}，余数是 ${r}。`,
        `验算：${d} × ${q} + ${r} = ${n}。`,
      ],
      answer: `商 ${q}，余数 ${r}`,
      pitfall: '每次除后的余数都要比除数小；整除时余数填 0。',
    },
  };
}
function visual(
  kind: Visual['kind'],
  title: string,
  labels: string[],
  values: number[],
  captions: string[],
): Visual {
  return { kind, title, labels, values, captions };
}
function calc(
  id: string,
  unitId: string,
  title: string,
  stem: string,
  answer: number,
  steps: string[],
  suffix?: string,
) {
  return item({
    id,
    unitId,
    title,
    stem,
    answer,
    steps,
    suffix,
    analysis:
      steps.length > 1 ? '按运算顺序逐步计算，再检查结果。' : '根据数的组成或对应的数量关系计算。',
  });
}

const baseQuestions: Question[] = [
  division('u1-01', 'U01-L01', 60, 20),
  division('u1-02', 'U01-L01', 160, 30, 'advanced'),
  division(
    'u1-03',
    'U01-L01',
    280,
    30,
    'advanced',
    '花店有 280 枝花，每 30 枝扎一束。最多能扎几束，还剩几枝？',
  ),
  division('u1-04', 'U01-L02', 96, 24),
  division(
    'u1-05',
    'U01-L02',
    172,
    28,
    'advanced',
    '有 172 本书，每箱放 28 本。能装满几箱，还剩几本？',
  ),
  item({
    id: 'u1-06',
    unitId: 'U01',
    lessonId: 'U01-L02',
    title: '判断试商方向',
    type: 'choice',
    difficulty: 'advanced',
    stem: '计算 108 ÷ 22，先试商 5。22 × 5 = 110，接下来应该怎么做？',
    options: ['把商调大到 6', '把商调小到 4', '商 5 不变', '把余数写成 2'],
    answer: 1,
    analysis: '试商后乘回去，看积是否超过被除数。',
    steps: [
      '110 > 108，说明商 5 偏大。',
      '调小到 4：22 × 4 = 88。',
      '108 − 88 = 20，20 < 22，商 4 合适。',
    ],
    pitfall: '积超过被除数时要调小商，不能把负的差当余数。',
  }),
  division('u1-07', 'U01-L03', 156, 12),
  division('u1-08', 'U01-L03', 612, 30, 'advanced'),
  division(
    'u1-09',
    'U01-L03',
    364,
    28,
    'advanced',
    '小林读一本 364 页的书，每天读 28 页。需要多少天读完，还剩多少页未分配到完整的一天？',
  ),
  item({
    id: 'u1-10',
    unitId: 'U01',
    lessonId: 'U01-L04',
    title: '连除解决问题',
    type: 'application',
    difficulty: 'advanced',
    stem: '224 本书平均放在 2 个书架上，每个书架有 4 层。平均每层放多少本？',
    answer: 28,
    suffix: '本',
    analysis: '可以先算每个书架放多少本，再算每层放多少本。',
    steps: ['224 ÷ 2 = 112（本）', '112 ÷ 4 = 28（本）', '也可以算：224 ÷（2 × 4）= 28（本）。'],
  }),
  item({
    id: 'u1-11',
    unitId: 'U01',
    lessonId: 'U01-L04',
    title: '分层平均分',
    type: 'application',
    difficulty: 'advanced',
    stem: '900 本图书平均分给 6 个年级，每个年级有 3 个班。平均每班分到多少本？',
    answer: 50,
    suffix: '本',
    analysis: '先求一共多少个班，或连续进行两次平均分。',
    steps: ['6 × 3 = 18（个）', '900 ÷ 18 = 50（本）'],
    pitfall: '不能把年级数与每年级班数相加。',
  }),
  item({
    id: 'u1-12',
    unitId: 'U01',
    lessonId: 'U01-L04',
    title: '图书打包的两层分组',
    type: 'application',
    difficulty: 'challenge',
    stem: '图书室有 864 本书，每 24 本装一包，每 3 包装一箱。一共可以装多少箱？',
    answer: 12,
    suffix: '箱',
    analysis: '把“本 → 包 → 箱”画成两层分组。先求包数，再求箱数。',
    steps: ['864 ÷ 24 = 36（包）', '36 ÷ 3 = 12（箱）', '验算：12 × 3 × 24 = 864（本）。'],
    visual: visual(
      'division',
      '从本数到箱数',
      ['每包本数', '每箱包数', '总本数'],
      [864, 24, 3],
      [
        '先把 864 本书按每包 24 本分组，得到 36 包。',
        '再把 36 包按每箱 3 包分组，得到 12 箱。',
        '两层平均分：864 ÷ 24 ÷ 3 = 12。',
      ],
    ),
  }),
  division('u1-13', 'U01-L05', 605, 21, 'advanced'),
  item({
    id: 'u1-14',
    unitId: 'U01',
    lessonId: 'U01-L05',
    title: '有余数时还要一辆车',
    type: 'application',
    difficulty: 'challenge',
    stem: '278 名同学去参观，每辆车最多坐 45 人。至少需要多少辆车？',
    answer: 7,
    suffix: '辆',
    analysis: '先求坐满的车数，再看看余下的人需不需要一辆车。',
    steps: [
      '278 ÷ 45 = 6……8（人）',
      '6 辆车只能坐 270 人，余下 8 人也需要一辆车。',
      '6 + 1 = 7（辆）。',
    ],
    pitfall: '商是坐满的车数，不是最终所需车数，余下的人不能被忽略。',
    visual: visual(
      'division',
      '余下的 8 人也要有座位',
      ['每辆人数', '每组车数', '总人数'],
      [278, 45, 1],
      [
        '先安排 6 辆坐满的车，一共坐 270 人。',
        '还剩 8 人，虽然不满 45 人，也需要 1 辆车。',
        '因此至少要 7 辆车。',
      ],
    ),
  }),
  item({
    id: 'u1-15',
    unitId: 'U01',
    lessonId: 'U01-L05',
    title: '从人数到车队',
    type: 'application',
    difficulty: 'challenge',
    stem: '456 人乘车出发，每辆车坐 38 人，每 4 辆车组成一队。正好可以组成几队？',
    answer: 3,
    suffix: '队',
    analysis: '先算车数，再按每 4 辆分成一队。每一步的单位不同。',
    steps: ['456 ÷ 38 = 12（辆）', '12 ÷ 4 = 3（队）', '验算：3 × 4 × 38 = 456（人）。'],
    visual: visual(
      'division',
      '人数、车辆和车队',
      ['每辆人数', '每队车数', '总人数'],
      [456, 38, 4],
      [
        '456 人按每辆 38 人分组，一共需要 12 辆车。',
        '12 辆车按每队 4 辆分组，得到 3 队。',
        '每队 152 人，3 队正好是 456 人。',
      ],
    ),
  }),

  calc(
    'u2-01',
    'U02',
    '长方形周长',
    '长方形长 8 厘米、宽 5 厘米，周长是多少厘米？',
    26,
    ['（8 + 5）× 2 = 26（厘米）'],
    '厘米',
  ),
  calc(
    'u2-02',
    'U02',
    '长方形面积',
    '长方形长 9 厘米、宽 6 厘米，面积是多少平方厘米？',
    54,
    ['9 × 6 = 54（平方厘米）'],
    '平方厘米',
  ),
  calc('u2-03', 'U02', '面积单位进率', '1 平方分米 =（    ）平方厘米。', 100, [
    '1 分米 = 10 厘米。',
    '10 × 10 = 100（平方厘米）。',
  ]),
  calc('u2-04', 'U02', '面积单位换算', '6 平方分米 =（    ）平方厘米。', 600, [
    '6 × 100 = 600（平方厘米）。',
  ]),
  item({
    id: 'u2-05',
    unitId: 'U02',
    title: '周长与面积的单位',
    type: 'choice',
    stem: '测量数学书封面的面积，下面哪个单位最合适？',
    options: ['厘米', '平方厘米', '千米', '秒'],
    answer: 1,
    analysis: '面积表示面的大小，应该使用面积单位。',
    steps: ['厘米和千米是长度单位。', '平方厘米是面积单位，适合计量书封面的大小。'],
  }),
  item({
    id: 'u2-06',
    unitId: 'U02',
    title: '菜地的面积',
    type: 'application',
    difficulty: 'advanced',
    stem: '一块长方形菜地长 24 米、宽 15 米，面积是多少平方米？',
    answer: 360,
    suffix: '平方米',
    analysis: '长方形面积等于长乘宽，两个长度单位已经相同。',
    steps: ['24 × 15 = 360（平方米）。'],
  }),
  item({
    id: 'u2-07',
    unitId: 'U02',
    title: '一面靠墙的围栏',
    type: 'application',
    difficulty: 'advanced',
    stem: '长方形花圃长 20 米、宽 12 米，一条长边靠墙，其余三边围篱笆。需要篱笆多少米？',
    answer: 44,
    suffix: '米',
    analysis: '靠墙的一条长边不用围，只算另一条长边和两条宽。',
    steps: ['12 × 2 = 24（米）', '20 + 24 = 44（米）'],
    pitfall: '这里求三条边的长度，不是完整周长。',
  }),
  item({
    id: 'u2-08',
    unitId: 'U02',
    title: '剪去一角，面积怎么变',
    type: 'application',
    difficulty: 'challenge',
    stem: '一张边长 12 厘米的正方形纸，从一个角剪去长 4 厘米、宽 3 厘米的小长方形。剩下的面积是多少平方厘米？',
    answer: 132,
    suffix: '平方厘米',
    analysis: '剩下的面积 = 原正方形面积 − 剪去的小长方形面积。',
    steps: ['12 × 12 = 144（平方厘米）', '4 × 3 = 12（平方厘米）', '144 − 12 = 132（平方厘米）'],
    pitfall: '不能用边长相减后的结果直接相乘。',
    visual: visual(
      'rectangle',
      '完整面积减去剪去的部分',
      ['正方形边长', '剪去的长', '剪去的宽'],
      [12, 12, 4, 3],
      [
        '先看完整正方形，面积为 12 × 12 = 144。',
        '右上角小长方形面积为 4 × 3 = 12。',
        '把这一块去掉，剩余面积是 132 平方厘米。',
      ],
    ),
  }),
  item({
    id: 'u2-09',
    unitId: 'U02',
    title: '相同周长，最大面积',
    type: 'application',
    difficulty: 'challenge',
    stem: '用 24 厘米长的铁丝围成长方形或正方形，边长都是整厘米。面积最大可以是多少平方厘米？',
    answer: 36,
    suffix: '平方厘米',
    analysis: '长加宽为 12。逐个比较整数边长组合，长宽越接近，面积越大。',
    steps: [
      '24 ÷ 2 = 12（厘米）',
      '1×11=11，2×10=20，3×9=27，4×8=32，5×7=35，6×6=36。',
      '正方形边长 6 厘米时，面积最大为 36 平方厘米。',
    ],
    visual: visual(
      'rectangle',
      '围成正方形时面积最大',
      ['长', '宽'],
      [6, 6],
      [
        '周长固定是 24，长与宽的和就是 12。',
        '逐个比较 1×11 到 6×6，不漏掉整厘米的组合。',
        '6×6 的面积最大，得到 36 平方厘米。',
      ],
    ),
  }),

  calc(
    'u3-01',
    'U03',
    '单价与总价',
    '每支钢笔 8 元，买 6 支一共多少元？',
    48,
    ['总价 = 单价 × 数量。', '8 × 6 = 48（元）'],
    '元',
  ),
  calc(
    'u3-02',
    'U03',
    '速度与路程',
    '每分钟走 70 米，4 分钟走多少米？',
    280,
    ['路程 = 速度 × 时间。', '70 × 4 = 280（米）'],
    '米',
  ),
  calc('u3-03', 'U03', '求单价', '12 支笔共 96 元，每支笔多少元？', 8, ['96 ÷ 12 = 8（元）'], '元'),
  item({
    id: 'u3-04',
    unitId: 'U03',
    title: '数量关系',
    type: 'choice',
    stem: '已知路程和速度，求时间应选哪个关系？',
    options: ['路程 × 速度', '路程 ÷ 速度', '速度 ÷ 路程', '路程 + 速度'],
    answer: 1,
    analysis: '路程 = 速度 × 时间，已知积与一个乘数，求另一个乘数用除法。',
    steps: ['时间 = 路程 ÷ 速度。'],
  }),
  item({
    id: 'u3-05',
    unitId: 'U03',
    title: '采购椅子',
    type: 'application',
    difficulty: 'advanced',
    stem: '学校买椅子共用 1350 元，每把 45 元。一共买了多少把？',
    answer: 30,
    suffix: '把',
    analysis: '已知总价和单价，求数量。',
    steps: ['1350 ÷ 45 = 30（把）。'],
  }),
  item({
    id: 'u3-06',
    unitId: 'U03',
    title: '旅途路程',
    type: 'application',
    difficulty: 'advanced',
    stem: '汽车每小时行 60 千米，行驶 3 小时。一共行多少千米？',
    answer: 180,
    suffix: '千米',
    analysis: '速度和时间的单位相匹配，用乘法求路程。',
    steps: ['60 × 3 = 180（千米）。'],
  }),
  item({
    id: 'u3-07',
    unitId: 'U03',
    title: '同一路程的往返',
    type: 'application',
    difficulty: 'challenge',
    stem: '汽车从甲城到乙城，每小时行 60 千米，用 4 小时到达。返回走相同路线，用了 3 小时。返回的速度是多少千米/时？',
    answer: 80,
    suffix: '千米/时',
    analysis: '往返路程相同。先用去时的速度和时间求路程，再除以返回时间。',
    steps: ['60 × 4 = 240（千米）', '240 ÷ 3 = 80（千米/时）'],
    pitfall: '不能把去、回时间差直接当成速度差。',
    visual: visual(
      'bars',
      '往返路程相同',
      ['去时：4小时', '返回：3小时'],
      [240, 240, 4, 3],
      [
        '去时每小时 60 千米，4 小时共 240 千米。',
        '返回还是 240 千米，把路程平均分成 3 份。',
        '每份 80 千米，所以返回速度是 80 千米/时。',
      ],
    ),
  }),
  item({
    id: 'u3-08',
    unitId: 'U03',
    title: '先求单价再购物',
    type: 'application',
    difficulty: 'challenge',
    stem: '3 本同样的笔记本共 18 元。小军带 70 元，买 8 本这样的笔记本，还剩多少元？',
    answer: 22,
    suffix: '元',
    analysis: '单价不变。先求一本的价钱，再算 8 本的总价，最后求剩余。',
    steps: ['18 ÷ 3 = 6（元/本）', '6 × 8 = 48（元）', '70 − 48 = 22（元）'],
    visual: visual(
      'operations',
      '从单价到找零',
      ['总价÷数量', '单价×新数量', '付出−用去'],
      [18, 3, 6, 8, 48, 70, 22],
      [
        '18 元平均分给 3 本，单价是 6 元。',
        '8 本需要 6 × 8 = 48 元。',
        '70 元减去 48 元，剩下 22 元。',
      ],
    ),
  }),
  item({
    id: 'u3-09',
    unitId: 'U03',
    title: '相同总量的装箱',
    type: 'application',
    difficulty: 'advanced',
    stem: '苹果每箱装 8 千克，能装 45 箱。改成每箱 6 千克，能装多少箱？',
    answer: 60,
    suffix: '箱',
    analysis: '苹果总质量不变，先求总质量，再求新箱数。',
    steps: ['8 × 45 = 360（千克）', '360 ÷ 6 = 60（箱）'],
  }),

  calc('u4-01', 'U04', '先乘后加减', '18 + 18 × 2 − 6 =（    ）。', 48, [
    '18 × 2 = 36',
    '18 + 36 − 6 = 54 − 6 = 48',
  ]),
  calc('u4-02', 'U04', '混合运算', '240 ÷ 6 − 2 × 17 =（    ）。', 6, [
    '240 ÷ 6 = 40，2 × 17 = 34。',
    '40 − 34 = 6。',
  ]),
  calc('u4-03', 'U04', '中括号与小括号', '525 ÷［（81 − 56）× 3］=（    ）。', 7, [
    '先算小括号：81 − 56 = 25。',
    '再算中括号：25 × 3 = 75。',
    '最后算：525 ÷ 75 = 7。',
  ]),
  item({
    id: 'u4-04',
    unitId: 'U04',
    title: '同级运算顺序',
    type: 'choice',
    stem: '80 ÷ 4 × 2 的结果是多少？',
    options: ['10', '20', '40', '80'],
    answer: 2,
    analysis: '乘除是同级运算，按从左到右的顺序计算。',
    steps: ['80 ÷ 4 = 20', '20 × 2 = 40'],
    pitfall: '不能先算 4 × 2，把原式错误地变成 80 ÷ 8。',
  }),
  item({
    id: 'u4-05',
    unitId: 'U04',
    title: '剩余预算能买多少',
    type: 'application',
    difficulty: 'advanced',
    stem: '带 800 元，先买 4 架单价 126 元的飞机模型。剩下的钱买单价 37 元的模型船，能买多少艘？',
    answer: 8,
    suffix: '艘',
    analysis: '先求已花的钱，再求剩余，最后除以模型船的单价。',
    steps: ['126 × 4 = 504（元）', '800 − 504 = 296（元）', '296 ÷ 37 = 8（艘）'],
  }),
  item({
    id: 'u4-06',
    unitId: 'U04',
    title: '读书计划',
    type: 'application',
    difficulty: 'advanced',
    stem: '一本书 188 页，前 4 天每天看 17 页。剩下的每天看 20 页，还要多少天？',
    answer: 6,
    suffix: '天',
    analysis: '总页数减去已读页数，再除以今后每天读的页数。',
    steps: ['17 × 4 = 68（页）', '188 − 68 = 120（页）', '120 ÷ 20 = 6（天）'],
  }),
  item({
    id: 'u4-07',
    unitId: 'U04',
    title: '先分书，再打包',
    type: 'application',
    difficulty: 'challenge',
    stem: '有 360 本书，先给 4 个班每班分 45 本。余下的每 30 本装一包，能装几包？',
    answer: 6,
    suffix: '包',
    analysis: '“余下的”是中间量。先求分出去的本数，再计算剩余书的包数。',
    steps: [
      '45 × 4 = 180（本）',
      '360 − 180 = 180（本）',
      '180 ÷ 30 = 6（包）',
      '综合算式：（360 − 45 × 4）÷ 30 = 6。',
    ],
    visual: visual(
      'operations',
      '沿着问题找到中间量',
      ['先分出的书', '剩余的书', '装成的包数'],
      [360, 45, 4, 30, 6],
      [
        '45 × 4 得到先分出去的 180 本。',
        '360 − 180 得到余下的 180 本。',
        '180 ÷ 30 得到 6 包，括号保证先求余量。',
      ],
    ),
  }),
  item({
    id: 'u4-08',
    unitId: 'U04',
    title: '两种商品的找零',
    type: 'application',
    difficulty: 'challenge',
    stem: '买 3 个每个 48 元的球，再买 2 副每副 36 元的球拍。付 300 元，应找回多少元？',
    answer: 84,
    suffix: '元',
    analysis: '分别计算两类商品的总价，再从 300 元中扣除。',
    steps: ['48 × 3 = 144（元）', '36 × 2 = 72（元）', '300 −（144 + 72）= 84（元）'],
    visual: visual(
      'bars',
      '把付出的钱分成三部分',
      ['买球', '球拍', '找回'],
      [144, 72, 84],
      [
        '买球用去 144 元，买球拍用去 72 元。',
        '一共用去 216 元。',
        '300 元中剩下的一部分是 84 元。',
      ],
    ),
  }),
  calc('u4-09', 'U04', '检查括号中的顺序', '72 ÷［160 ÷（102 − 82）］=（    ）。', 9, [
    '102 − 82 = 20',
    '160 ÷ 20 = 8',
    '72 ÷ 8 = 9',
  ]),

  calc('u5-01', 'U05', '数的组成', '6 个亿和 8 个万组成的数是多少？', 600080000, [
    '6 个亿是 600000000，8 个万是 80000。',
    '600000000 + 80000 = 600080000。',
  ]),
  calc('u5-02', 'U05', '计数单位', '100000000 里面有多少个万？', 10000, [
    '100000000 ÷ 10000 = 10000。',
  ]),
  calc('u5-03', 'U05', '求近似数', '把 49995000 四舍五入到万位，约是（    ）万。', 5000, [
    '千位是 5，万位要进 1。',
    '49995000 ≈ 50000000 = 5000 万。',
  ]),
  item({
    id: 'u5-04',
    unitId: 'U05',
    title: '比较多位数',
    type: 'choice',
    stem: '下面哪个数最大？',
    options: ['78090000', '78900000', '78009000', '78099000'],
    answer: 1,
    analysis: '位数相同，从最高位起逐位比较，先看不同的那一位。',
    steps: [
      '这四个数都是八位数，千万位都是 7，百万位都是 8。',
      '78900000 的十万位是 9，其余三个数的十万位是 0。',
      '所以 78900000 最大。',
    ],
  }),
  item({
    id: 'u5-05',
    unitId: 'U05',
    title: '用万作单位改写',
    type: 'application',
    difficulty: 'advanced',
    stem: '某图书平台收录 32000000 条图书信息。精确改写成用“万”作单位的数，是多少万条？',
    answer: 3200,
    suffix: '万条',
    analysis: '整万数改写为以万作单位，去掉末尾四个 0，再加上万。',
    steps: ['32000000 = 3200 万。'],
    pitfall: '这是精确改写，用等号，不是四舍五入。',
  }),
  calc('u5-06', 'U05', '数位与数值', '由 3 个亿、2 个百万、5 个千组成的数是多少？', 302005000, [
    '按亿级、万级、个级对齐数位。',
    '300000000 + 2000000 + 5000 = 302005000。',
  ]),
  item({
    id: 'u5-07',
    unitId: 'U05',
    title: '从近似数寻找范围',
    type: 'application',
    difficulty: 'challenge',
    stem: '一个整数四舍五入到万位后是 36 万。这个整数最小是多少？',
    answer: 355000,
    analysis: '找出刚刚能够向上舍入到 36 万的边界。35 万 5 千是中点。',
    steps: [
      '35 万与 36 万之间的中点是 355000。',
      '355000 的千位是 5，向万位进 1 得到 36 万。',
      '355000 再小 1 就是 354999，会舍入成 35 万。',
      '所以最小是 355000。',
    ],
    pitfall: '不能直接认为最小是 360000；还要考虑四舍五入进位。',
    visual: visual(
      'numberline',
      '36 万对应的整数范围',
      ['下边界', '36万', '上边界前一个数'],
      [355000, 360000, 364999],
      [
        '从 355000 起，整数会四舍五入到 36 万。',
        '360000 正好是 36 万。',
        '到 364999 为止仍是 36 万；365000 会进到 37 万。',
      ],
    ),
  }),
  item({
    id: 'u5-08',
    unitId: 'U05',
    title: '近似数的上边界',
    type: 'application',
    difficulty: 'challenge',
    stem: '一个整数四舍五入到万位后是 36 万。这个整数最大是多少？',
    answer: 364999,
    analysis: '再多 1 就应舍入到 37 万的那个数，就是上边界。',
    steps: [
      '365000 的千位是 5，会进到 37 万。',
      '比它小 1 的 364999 的千位是 4，舍去尾数后为 36 万。',
      '所以最大是 364999。',
    ],
    visual: visual(
      'numberline',
      '再多 1 就进位',
      ['下边界', '36万', '最大整数'],
      [355000, 360000, 364999],
      [
        '355000 到 364999 都可舍入为 36 万。',
        '364999 的千位为 4，舍去万位后尾数。',
        '365000 已经越过这一范围，不能选。',
      ],
    ),
  }),
  calc('u5-09', 'U05', '相邻位数的边界', '最小的八位数比最大的七位数大多少？', 1, [
    '最小八位数 10000000，最大七位数 9999999。',
    '10000000 − 9999999 = 1。',
  ]),

  item({
    id: 'u5-10',
    unitId: 'U05',
    title: '一万里面的计数单位',
    stem: '10000里面有多少个百？',
    answer: 100,
    analysis: '百是计数单位，每100个一组成1个百。',
    steps: ['10000÷100＝100，所以一万里面有100个百。'],
    pitfall: '10个千是一万，100个百也是一万；不要把单位“千”与“百”混淆。',
  }),
  item({
    id: 'u5-11',
    unitId: 'U05',
    title: '凑成一万张卡片',
    type: 'application',
    stem: '每盒有1000张卡片。要凑成10000张，需要多少盒？',
    answer: 10,
    suffix: '盒',
    analysis: '求10000里面有几个1000，可以一千一千数，也可以用除法。',
    steps: ['10000÷1000＝10（盒）。', '10个一千是一万。'],
  }),
  item({
    id: 'u5-12',
    unitId: 'U05',
    title: '含零大数的读法',
    type: 'choice',
    stem: '3008007的正确读法是哪个？',
    options: ['三百万八千零七', '三百万零八千零七', '三百零八万零七', '三百万八千七'],
    answer: 0,
    analysis: '先分成300万和8007。万级末尾的0不读，个级8007中间的0只读一个零。',
    steps: ['300｜8007：300万读三百万。', '8007读八千零七。', '合起来读三百万八千零七。'],
    pitfall: '个级是四位数8007，级与级之间不额外加零；个级内部的0仍需按规则读。',
  }),
  item({
    id: 'u5-13',
    unitId: 'U05',
    title: '按数级写数',
    stem: '把“二千零二万二千”写成阿拉伯数字。',
    answer: 20022000,
    analysis: '先确定千万位、万位和千位，其余数位用0占位。',
    steps: ['2个千万是20000000，2个万是20000，2个千是2000。', '20000000＋20000＋2000＝20022000。'],
    pitfall: '分成2002｜2000，不要遗漏万级或个级的占位0。',
  }),
  item({
    id: 'u5-14',
    unitId: 'U05',
    title: '跨数级组成大数',
    difficulty: 'advanced',
    stem: '4个亿、3个万和7个十组成的数是多少？',
    answer: 400030070,
    analysis: '按亿级、万级、个级分别写4、0003、0070，再按四位对齐。',
    steps: ['4｜0003｜0070。', '400000000＋30000＋70＝400030070。'],
    pitfall: '数级内部缺少的数位都要补0，不能直接把4、3、7接在一起。',
  }),
  item({
    id: 'u5-15',
    unitId: 'U05',
    title: '自然数与数字',
    type: 'choice',
    stem: '关于自然数和数字，下面哪句话正确？',
    options: [
      '0不是自然数',
      '有最大的自然数',
      '0是最小的自然数，表示数的数字共有10个',
      '一个十二位数就是最大的自然数',
    ],
    answer: 2,
    analysis: '0也是自然数。自然数可以不断加1，没有最大值；数字只有0至9。',
    steps: [
      '自然数包括0、1、2、3……。',
      '0至9是表示数所用的10个数字。',
      '任何自然数加1都能得到更大的自然数。',
    ],
  }),
  item({
    id: 'u5-16',
    unitId: 'U05',
    title: '读懂分段图书编号',
    stem: '自拟图书编号规则为年份4位｜书架2位｜序号3位。202604030表示2026年入库、4号书架的第几本书？',
    answer: 30,
    suffix: '本',
    analysis: '按固定的4、2、3位拆开；最后三位030表示序号30。',
    steps: ['2026｜04｜030。', '序号030表示第30本书。'],
    pitfall: '这是编码，04与030中的0用于保持分段长度，不能在编号中删掉。',
  }),
  item({
    id: 'u5-17',
    unitId: 'U05',
    title: '编码中的零不能省',
    type: 'choice',
    stem: '图书编号按年份4位｜书架2位｜序号3位编写。2026年入库、4号书架、第30本应写成哪个编号？',
    options: ['2026430', '202604030', '202640030', '20260430'],
    answer: 1,
    analysis: '书架号4补为04，序号30补为030。',
    steps: ['年份2026保持4位。', '书架04保持2位，序号030保持3位。', '连接得到202604030。'],
    pitfall: '编号不是单纯表示一个数量，不能随意省略分段里的0。',
  }),
  item({
    id: 'u5-18',
    unitId: 'U05',
    title: '固定序号的容量',
    type: 'application',
    difficulty: 'advanced',
    stem: '同一年、同一书架的图书序号固定为3位，从001开始，最多编到999。每个编号只给一本书，最多可给多少本书编号？',
    answer: 999,
    suffix: '本',
    analysis: '可用序号从1到999，每个序号对应一本书。000没有在题目规定的可用范围内。',
    steps: ['001、002、003……999共有999个序号。', '所以最多可给999本不同的书编号。'],
    pitfall: '不能把000也算进去，也不能把同一个编号重复分配给不同的书。',
  }),
  calc('u6-01', 'U06', '三位数乘两位数', '128 × 16 =（    ）。', 2048, [
    '128 × 6 = 768。',
    '128 × 10 = 1280。',
    '768 + 1280 = 2048。',
  ]),
  calc('u6-02', 'U06', '乘数中有零', '106 × 20 =（    ）。', 2120, [
    '106 × 2 = 212。',
    '再乘 10 得 2120。',
  ]),
  calc('u6-03', 'U06', '末尾有零的乘法', '450 × 30 =（    ）。', 13500, [
    '45 × 3 = 135。',
    '再乘 100，得到 13500。',
  ]),
  item({
    id: 'u6-04',
    unitId: 'U06',
    title: '选择合适的计算方法',
    type: 'choice',
    stem: '253 × 194 × 371 × 0 的结果是多少？',
    options: ['0', '253', '194', '无法计算'],
    answer: 0,
    analysis: '多个数相乘，只要有一个乘数是 0，积就是 0。',
    steps: ['任何数乘 0 都得 0，所以结果是 0。'],
  }),
  item({
    id: 'u6-05',
    unitId: 'U06',
    title: '采购灯管',
    type: 'application',
    difficulty: 'advanced',
    stem: '每支灯管 25 元，学校买 226 支，共需多少元？',
    answer: 5650,
    suffix: '元',
    analysis: '总价 = 单价 × 数量，可以用竖式或分解计算。',
    steps: ['226 × 25 = 226 ×（20 + 5）', '= 4520 + 1130 = 5650（元）。'],
  }),
  item({
    id: 'u6-06',
    unitId: 'U06',
    title: '步长与路程换算',
    type: 'application',
    difficulty: 'advanced',
    stem: '小明每步长 75 厘米，走了 128 步。一共走了多少米？',
    answer: 96,
    suffix: '米',
    analysis: '先求厘米数，再按 100 厘米 = 1 米换算。',
    steps: ['75 × 128 = 9600（厘米）', '9600 厘米 = 96 米。'],
  }),
  item({
    id: 'u6-07',
    unitId: 'U06',
    title: '从进货量求剩余',
    type: 'application',
    difficulty: 'challenge',
    stem: '商店运来 36 箱饮料，每箱 24 瓶，卖出 475 瓶，还剩多少瓶？',
    answer: 389,
    suffix: '瓶',
    analysis: '先用部分积求运来的总瓶数，再减去卖出的瓶数。',
    steps: ['24 × 36 = 24 × 30 + 24 × 6', '= 720 + 144 = 864（瓶）', '864 − 475 = 389（瓶）'],
    visual: visual(
      'multiplication',
      '把 36 拆成 30 和 6',
      ['每箱瓶数', '箱数'],
      [24, 36],
      [
        '24 × 30 = 720，十位上的 3 表示 30。',
        '24 × 6 = 144，把两部分相加得到 864。',
        '再减去卖出的 475 瓶，还剩 389 瓶。',
      ],
    ),
  }),
  item({
    id: 'u6-08',
    unitId: 'U06',
    title: '配套采购与预算',
    type: 'application',
    difficulty: 'challenge',
    stem: '一张桌子 135 元，一把椅子 65 元。买 28 套，每套一桌一椅，付 6000 元，还剩多少元？',
    answer: 400,
    suffix: '元',
    analysis: '先把一桌一椅看作一套，再求 28 套的总价。',
    steps: ['135 + 65 = 200（元/套）', '200 × 28 = 5600（元）', '6000 − 5600 = 400（元）'],
    visual: visual(
      'operations',
      '先合成一套，再计算总价',
      ['一套的价钱', '28套总价', '预算剩余'],
      [135, 65, 200, 28, 5600, 6000, 400],
      [
        '把桌子和椅子合成一套：135 + 65 = 200 元。',
        '28 套一共要 5600 元。',
        '付出的 6000 元减去 5600 元，还剩 400 元。',
      ],
    ),
  }),
  item({
    id: 'u6-09',
    unitId: 'U06',
    title: '预算是否够用',
    type: 'application',
    difficulty: 'advanced',
    stem: '一台学习设备 249 元，购买 32 台。准备 8000 元，买完还剩多少元？',
    answer: 32,
    suffix: '元',
    analysis: '先求 32 台总价，与预算比较后求余额。',
    steps: ['249 × 32 = 7968（元）', '8000 − 7968 = 32（元）。'],
  }),
];
export const questions: Question[] = [
  ...baseQuestions,
  ...unit2Questions,
  ...depthQuestions,
  ...unit345Data.map((q) => questionSchema.parse(q)),
  ...collectedData.map((q) => questionSchema.parse(q)),
  ...fullPaperData.map((q) => questionSchema.parse(q)),
].map((q) =>
  unit2VisualOverrides[q.id]
    ? {
        ...q,
        hasVisual: true,
        explanation: { ...q.explanation, visual: unit2VisualOverrides[q.id] },
      }
    : q,
);
for (const q of questions) {
  const mapped = (unit345LegacyTopics as Record<string, string>)[q.id];
  if (mapped) q.topicIds = [mapped];
  if (q.topicIds?.length) continue;
  const text = q.title + q.stem;
  let topic = 'general';
  if (q.unitId === 'U01')
    topic = /看错|看成|还原|错写/.test(text)
      ? 'restore'
      : /锯|楼|段|间隔/.test(text)
        ? 'intervals'
        : /试商|调商|商是|位数/.test(text)
          ? 'trial'
          : /余数|验算/.test(text)
            ? 'remainder'
            : /每层|每班|每小时|连除/.test(text)
              ? 'groups'
              : /车|箱|装|盒/.test(text)
                ? 'loading'
                : /降价|单价|不变|变化/.test(text)
                  ? 'changes'
                  : 'calculation';
  if (q.unitId === 'U02')
    topic = /换算|平方分米|进率|单位/.test(text)
      ? 'units'
      : /方格|铺格|数格/.test(text)
        ? 'grid'
        : /靠墙|围栏|栅栏/.test(text)
          ? 'fence'
          : /铺砖|费用|地砖/.test(text)
            ? 'tiling'
            : /拼|剪|切|分割/.test(text)
              ? 'cut'
              : /同周长|同面积|最长|最短|方案|条件/.test(text)
                ? 'compare'
                : /区别|区分|辨|一定/.test(text)
                  ? 'meaning'
                  : 'measure';
  q.topicIds = [`u${Number(q.unitId.slice(1))}-${topic}`];
}
