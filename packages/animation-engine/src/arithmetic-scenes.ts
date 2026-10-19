export interface ArithmeticScene {
  id: string;
  kind: 'operationOrder' | 'nestedBrackets' | 'multiStepProblems';
  title: string;
  source: string;
  expression: string;
  note: string;
  problem?: {
    stem: string;
    conditions: string[];
    target: string;
    relations: { quantity: string; relation: string }[];
    choices: { expression: string; valid: boolean; reason: string }[];
    check: string;
    unit: string;
    total: number;
    parts: { label: string; value: number }[];
  };
}
export const arithmeticScenes: ArithmeticScene[] = [
  {
    id: 'choir',
    kind: 'operationOrder',
    title: '社团人数：先乘后加减',
    source: '教材 p.58 例1',
    expression: '18 + 18 * 2 - 6',
    note: '18×2先求绘画组人数，再把书法组和绘画组人数相加，最后减去6。',
  },
  {
    id: 'two-products',
    kind: 'operationOrder',
    title: '乘除分支：先分别计算',
    source: '教材 p.59 想想做做',
    expression: '240 / 6 - 2 * 17',
    note: '左右两边的除法、乘法互不依赖，都要在最后的减法之前算。',
  },
  {
    id: 'same-level',
    kind: 'operationOrder',
    title: '乘除同级：从左往右',
    source: '题库 u4-04 · 原创练习',
    expression: '80 / 4 * 2',
    note: '不能把4×2先合并成除数；80÷4×2与80÷(4×2)含义不同。',
  },
  {
    id: 'correct-order',
    kind: 'operationOrder',
    title: '纠错：不能先把110减20',
    source: '教材 p.59 纠错情境',
    expression: '110 - 20 * 5 + 25',
    note: '先算20×5，而不是110−20；算出后，剩下的减法和加法从左往右算。',
  },
  {
    id: 'nested',
    kind: 'nestedBrackets',
    title: '先小括号，再中括号',
    source: '教材 p.60 试算',
    expression: '525 / [(81 - 56) * 3]',
    note: '中括号包住整个乘积。小括号算完后，中括号还不能漏掉。',
  },
  {
    id: 'inside-order',
    kind: 'nestedBrackets',
    title: '括号里面也要先乘除',
    source: '教材 p.61 想想做做',
    expression: '58 * (20 - 78 / 13)',
    note: '先算小括号里的78÷13，再做20−6，最后与外面的58相乘。',
  },
  {
    id: 'nested-division',
    kind: 'nestedBrackets',
    title: '逐层求出除数',
    source: '题库 u4-09 · 原创练习',
    expression: '72 / [160 / (102 - 82)]',
    note: '先算102−82，接着求中括号中的160÷20，最后算72÷8。',
  },
  {
    id: 'bracket-a',
    kind: 'nestedBrackets',
    title: '对照①：除完再除',
    source: '教材 p.61 括号位置对照',
    expression: '800 / (70 - 30) / 5',
    note: '先算70−30，再按从左往右算800÷40÷5，结果是4。',
  },
  {
    id: 'bracket-b',
    kind: 'nestedBrackets',
    title: '对照②：把整个除式作除数',
    source: '教材 p.61 括号位置对照',
    expression: '800 / [(70 - 30) / 5]',
    note: '中括号中的40÷5作为整个除数，800÷8的结果是100。',
  },
  {
    id: 'model-example',
    kind: 'nestedBrackets',
    title: '教材模型预算：先求剩余的钱',
    source: '教材 p.60 例2',
    expression: '(600 - 126 * 4) / 48',
    note: '括号表示先求剩余的钱；小括号里面仍然先算126×4，再做减法。',
  },
  {
    id: 'books',
    kind: 'multiStepProblems',
    title: '先分书，再打包',
    source: '题库 u4-07 · 原创应用',
    expression: '(360 - 45 * 4) / 30',
    note: '“剩下的本数”是把条件与问题连起来的中间量。',
    problem: {
      stem: '有360本书，先给4个班每班分45本。余下的每30本装一包，能装几包？',
      conditions: ['一共有360本', '4个班，每班45本', '余下的每30本装一包'],
      target: '能装几包',
      relations: [
        { quantity: '包数', relation: '剩余本数 ÷ 每包30本' },
        { quantity: '剩余本数', relation: '总本数360 − 分出的本数' },
        { quantity: '分出的本数', relation: '每班45本 × 4个班' },
      ],
      choices: [
        {
          expression: '(360 - 45 * 4) / 30',
          valid: true,
          reason: '先求剩余本数，再除以每包本数，符合题意。',
        },
        {
          expression: '360 - 45 * 4 / 30',
          valid: false,
          reason: '没有把“余下的本数”括起来，会把分出去的书先除以30，改变题意。',
        },
        {
          expression: '(360 - 45) * 4 / 30',
          valid: false,
          reason: '45是每班本数，须先乘4求分出的总数，不能只从360中减去45。',
        },
      ],
      check: '6×30＋45×4＝360（本），装包的与分出的合起来正好是原有的书。',
      unit: '本',
      total: 360,
      parts: [
        { label: '分给各班', value: 180 },
        { label: '余下装包', value: 180 },
      ],
    },
  },
  {
    id: 'reading',
    kind: 'multiStepProblems',
    title: '读书计划：先求剩余页数',
    source: '题库 u4-06 · 原创应用',
    expression: '(188 - 17 * 4) / 20',
    note: '不能直接用总页数除以20，前4天已读的页数要先扣除。',
    problem: {
      stem: '一本书188页，前4天每天看17页。剩下的每天看20页，还要多少天？',
      conditions: ['全书188页', '前4天，每天17页', '以后每天20页'],
      target: '还要多少天',
      relations: [
        { quantity: '还要的天数', relation: '剩余页数 ÷ 以后每天20页' },
        { quantity: '剩余页数', relation: '总页数188 − 已读页数' },
        { quantity: '已读页数', relation: '每天17页 × 4天' },
      ],
      choices: [
        {
          expression: '(188 - 17 * 4) / 20',
          valid: true,
          reason: '先扣除已读页数，再按以后每天阅读量求天数。',
        },
        {
          expression: '188 - 17 * 4 / 20',
          valid: false,
          reason: '余下的页数应是一个整体，先求188−17×4，再除以20。',
        },
        {
          expression: '(188 - 17) * 4 / 20',
          valid: false,
          reason: '17页只是一天的阅读量，不是前4天一共读的页数。',
        },
      ],
      check: '17×4＋20×6＝188（页），已读68页，后来读120页，合起来是全书188页。',
      unit: '页',
      total: 188,
      parts: [
        { label: '前4天已读', value: 68 },
        { label: '以后还要读', value: 120 },
      ],
    },
  },
  {
    id: 'change',
    kind: 'multiStepProblems',
    title: '两种商品：分清两笔支出',
    source: '题库 u4-08 · 原创应用',
    expression: '300 - (48 * 3 + 36 * 2)',
    note: '可以先合计两笔支出再扣除，也可以从300元里依次减去两笔支出。',
    problem: {
      stem: '买3个每个48元的球，再买2副每副36元的球拍。付300元，应找回多少元？',
      conditions: ['付出300元', '球每个48元，买3个', '球拍每副36元，买2副'],
      target: '应找回多少元',
      relations: [
        { quantity: '找回的钱', relation: '付出300元 − 一共用去的钱' },
        { quantity: '一共用去的钱', relation: '买球的钱 ＋ 买球拍的钱' },
        { quantity: '两笔支出', relation: '48×3 与 36×2，分别求两类商品总价' },
      ],
      choices: [
        {
          expression: '300 - (48 * 3 + 36 * 2)',
          valid: true,
          reason: '先把两笔支出加起来，再从300元里扣除，符合题意。',
        },
        {
          expression: '300 - 48 * 3 - 36 * 2',
          valid: true,
          reason: '从300元里依次减去两笔支出也正确；乘法都要先于减法。',
        },
        {
          expression: '300 - (48 + 36) * (3 + 2)',
          valid: false,
          reason: '两种商品的单价与数量各自对应，不能把单价相加后再乘总件数。',
        },
      ],
      check: '144＋72＋84＝300（元），两笔支出与找回的钱合起来等于付出的钱。',
      unit: '元',
      total: 300,
      parts: [
        { label: '买球', value: 144 },
        { label: '买球拍', value: 72 },
        { label: '找回', value: 84 },
      ],
    },
  },
  {
    id: 'budget',
    kind: 'multiStepProblems',
    title: '剩余预算：模型还能买多少',
    source: '题库 u4-05 · 原创应用',
    expression: '(800 - 126 * 4) / 37',
    note: '800元是原有预算，296元才是买模型船可使用的钱。',
    problem: {
      stem: '带800元，先买4架单价126元的飞机模型。剩下的钱买单价37元的模型船，能买多少艘？',
      conditions: ['原有800元', '飞机模型每架126元，买4架', '模型船每艘37元'],
      target: '能买多少艘模型船',
      relations: [
        { quantity: '模型船艘数', relation: '剩余的钱 ÷ 每艘37元' },
        { quantity: '剩余的钱', relation: '原有800元 − 飞机模型的总价' },
        { quantity: '飞机模型总价', relation: '每架126元 × 4架' },
      ],
      choices: [
        {
          expression: '(800 - 126 * 4) / 37',
          valid: true,
          reason: '先求剩余预算，再除以模型船单价。',
        },
        {
          expression: '800 - 126 * 4 / 37',
          valid: false,
          reason: '括号须包住完整的剩余金额，不能只对一部分金额除以37。',
        },
      ],
      check: '126×4＋37×8＝800（元），504元加296元正好用完预算。',
      unit: '元',
      total: 800,
      parts: [
        { label: '飞机模型', value: 504 },
        { label: '模型船预算', value: 296 },
      ],
    },
  },
];
