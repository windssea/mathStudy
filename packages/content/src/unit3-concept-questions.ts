import type { Question, Visual } from '@mathstudy/contracts';

type Stage = NonNullable<Visual['stages']>[number];
function conceptQuestion(
  id: string,
  lesson: number,
  topic: string,
  title: string,
  stem: string,
  fields: Question['fields'],
  expected: Question['expected'],
  steps: string[],
  stages: Stage[],
  pitfall: string,
  options?: string[],
): Question {
  return {
    id: `concept-u3-${id}`,
    unitId: 'U03',
    lessonId: `U03-L0${lesson}`,
    topicIds: [topic],
    title,
    stem,
    type: options ? 'choice' : 'fill',
    difficulty: 'basic',
    fields,
    expected,
    options,
    hint: lesson === 1 ? '先分清每份量、份数和总量。' : '先找出“一件”或“一分钟”对应的量。',
    sourceKind: 'original',
    knowledge: title,
    pages: lesson === 1 ? [45, 47] : lesson === 2 ? [48, 49] : [50, 53],
    hasVisual: true,
    explanation: {
      analysis: steps[0],
      steps,
      answer: options
        ? options[Number(expected.value)]
        : fields.map((f) => `${f.label}：${expected[f.key]}${f.suffix ?? ''}`).join('；'),
      pitfall,
      visual: { kind: 'reasoning', title, labels: [], values: [], captions: steps, stages },
    },
  };
}
const choice = [{ key: 'value', label: '选择一个答案', inputMode: 'numeric' as const }];
const table = (headings: string[], rows: string[][]): Stage => ({ kind: 'table', headings, rows });
const bars = (headings: string[], values: number[]): Stage => ({
  kind: 'bars',
  headings,
  values,
  rows: [],
});

export const unit3ConceptQuestions: Question[] = [
  conceptQuestion(
    'equal-addends',
    1,
    'u3-inverse',
    '相同加数与乘法',
    '每组有4人，共3组。4＋4＋4可以用下面哪个乘法算式表示？',
    choice,
    { value: '1' },
    ['每组4人，3组就是3个4相加。', '4＋4＋4＝4×3＝12（人）。4和3是乘数，12是积。'],
    [
      bars(['第一组', '第二组', '第三组'], [4, 4, 4]),
      table(['每份量', '份数', '总量'], [['4人', '3组', '12人']]),
    ],
    '4×3和3×4的积相同。这里按每份量×份数写，便于对照图意。',
    ['4＋3', '4×3', '4×4', '3＋3'],
  ),
  conceptQuestion(
    'two-divisions',
    1,
    'u3-inverse',
    '两种平均分',
    '有12名同学。①平均分成3组，每组几人？②每组4人，可以分成几组？',
    [
      { key: 'people', label: '①每组', suffix: '人' },
      { key: 'groups', label: '②可以分', suffix: '组' },
    ],
    { people: '4', groups: '3' },
    [
      '平均分成3组：把12平均分成3份，求每份人数。12÷3＝4（人）。',
      '每组4人：看12里面有几个4。12÷4＝3（组）。用4×3＝12验算。',
    ],
    [
      table(['总人数', '已知组数', '求每组'], [['12人', '3组', '12÷3＝4人']]),
      bars(['第1组4人', '第2组4人', '第3组4人'], [4, 4, 4]),
    ],
    '除数3表示组数时，商是每组人数；除数4表示每组人数时，商是组数。',
  ),
  conceptQuestion(
    'price-reading',
    2,
    'u3-shopping',
    '读懂单价单位',
    '一支钢笔的标价是8元/支，读作“八元每支”。它表示什么？',
    choice,
    { value: '2' },
    ['元/支表示每一支钢笔的价钱，是单价。', '一支8元；买3支就是3个8元，8×3＝24（元）。'],
    [
      table(['写作', '读作', '意思'], [['8元/支', '八元每支', '每支8元']]),
      bars(['第1支', '第2支', '第3支'], [8, 8, 8]),
    ],
    '8元/支不是8支钢笔共1元，也不是买多少支都只付8元。',
    ['8支钢笔共1元', '买任意数量都付8元', '每支钢笔8元', '8元是购买数量'],
  ),
  conceptQuestion(
    'price-inverse',
    2,
    'u3-shopping',
    '由总价求单价和数量',
    '5支同样的钢笔共40元，每支多少元？按同样的单价，24元可以买几支？',
    [
      { key: 'price', label: '每支', suffix: '元' },
      { key: 'count', label: '可以买', suffix: '支' },
    ],
    { price: '8', count: '3' },
    [
      '把40元平均分成5份：单价＝总价÷数量，40÷5＝8（元/支）。',
      '每支8元，24元里面有3个8元：数量＝总价÷单价，24÷8＝3（支）。',
    ],
    [
      table(['总价', '数量', '单价'], [['40元', '5支', '40÷5＝8元/支']]),
      bars(['第1支', '第2支', '第3支'], [8, 8, 8]),
    ],
    '40元是5支的总价；求可以买几支，要用新的总价24元除以单价8元/支。',
  ),
  conceptQuestion(
    'speed-reading',
    3,
    'u3-speed',
    '读懂速度单位',
    '小林匀速步行，速度是70米/分，读作“七十米每分”。下面哪句话正确？',
    choice,
    { value: '0' },
    [
      '米/分表示每一分钟行进多少米。70米/分就是每分钟行70米。',
      '每段代表1分钟，3段就是3个70米：70×3＝210（米）。',
    ],
    [bars(['第1分钟'], [70]), bars(['第1分钟', '第2分钟', '第3分钟'], [70, 70, 70])],
    '速度不是只说70米或70分钟。米/分中的“每分”表示一个单位时间。',
    ['每分钟行70米', '每70分钟行1米', '无论走多久都只走70米', '每小时行70米'],
  ),
  conceptQuestion(
    'speed-inverse',
    3,
    'u3-speed',
    '由路程求速度和时间',
    '小林匀速步行，5分钟走350米。他平均每分钟走多少米？照这样的速度，走560米需要几分钟？',
    [
      { key: 'speed', label: '速度', suffix: '米/分' },
      { key: 'time', label: '需要', suffix: '分钟' },
    ],
    { speed: '70', time: '8' },
    [
      '350米平均分成5个1分钟的路段：速度＝路程÷时间，350÷5＝70（米/分）。',
      '560米里面有8个70米：时间＝路程÷速度，560÷70＝8（分钟）。',
    ],
    [
      table(['路程', '时间', '速度'], [['350米', '5分钟', '350÷5＝70米/分']]),
      table(['路程', '速度', '时间'], [['560米', '70米/分', '560÷70＝8分钟']]),
    ],
    '这里速度单位是米/分，路程用米，算出的时间是分钟。先确认单位配套。',
  ),
];
