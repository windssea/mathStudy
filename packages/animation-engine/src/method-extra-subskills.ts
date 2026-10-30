import {
  frame,
  text,
  rect,
  line,
  type MethodNode,
  type MethodCheck,
  type MethodStory,
} from './method-primitives';

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
const caption = (heading: string, shapes: MethodNode[], footer: string): MethodNode[] => [
  text(200, 27, heading, 'known', 20),
  ...shapes,
  text(200, 235, footer, 'focus', 20),
];

/** Unlabelled blocks represent one hundred / ten; dots represent one. */
function baseTen(hundreds: number, tens: number, ones: number, missingTen = false): MethodNode[] {
  return [
    text(76, 55, '百', 'known', 20),
    text(207, 55, '十', 'focus', 20),
    text(338, 55, '个', 'warm', 20),
    ...Array.from({ length: hundreds }, (_, i) =>
      rect(24 + (i % 3) * 36, 76 + Math.floor(i / 3) * 43, 30, 36, 'known'),
    ),
    ...Array.from({ length: tens }, (_, i) =>
      rect(145 + (i % 4) * 29, 76 + Math.floor(i / 4) * 40, 24, 32, 'focus'),
    ),
    ...Array.from(
      { length: ones },
      (_, i): MethodNode => ({
        kind: 'dot',
        x: 305 + (i % 4) * 20,
        y: 87 + Math.floor(i / 4) * 28,
        tone: 'warm',
      }),
    ),
    ...(missingTen
      ? [rect(145, 194, 24, 24, 'error', undefined, true), text(257, 204, '漏进1个十', 'error', 18)]
      : []),
  ];
}
const addition = lesson(
  '236＋78，个位和十位满十后怎样换单位？',
  [
    frame(
      '同数位合在一起',
      '236有2百3十6个，78有7十8个。先把相同单位放到同一列。',
      '2百、10十、14个',
      caption('先合并同单位的对象', baseTen(2, 10, 14), '每块是1百或1十，每点是1个'),
    ),
    frame(
      '14个一换成1十4个一',
      '10个一只能换成1个十，剩4个一。新换的1个十也要加到十位。',
      '14个一＝1个十＋4个一',
      caption('个位满十，移到十位', baseTen(2, 11, 4), '2百、11十、4个'),
    ),
    frame(
      '11个十再换成1百1十',
      '十位一共有11个十，十个十换成一个百。最后是3百1十4个。',
      '236＋78＝314',
      caption('十位满十，再向百位换', baseTen(3, 1, 4), '3百＋1十＋4个＝314'),
    ),
  ],
  check(
    '47＋38，个位满十后能写成75吗？',
    '能，十位4＋3就写7',
    '不能，应是85',
    '7＋8有15个一，换出的1个十不能漏掉。十位应是4＋3＋1。',
    caption('正确：8个十、5个一', baseTen(0, 8, 5), '47＋38＝85'),
    caption('错写75，漏掉进位的十', baseTen(0, 7, 5, true), '漏掉的10必须加回'),
  ),
  check(
    '换数：58＋67的和是多少？',
    '115：个位进1却没加入十位',
    '125：满十继续向前换',
    '8＋7换出1个十，5＋6＋1是12个十，再换成1百2十。',
    caption('正确：1百2十5个', baseTen(1, 2, 5), '58＋67＝125'),
    caption('错写115，少了1个十', baseTen(1, 1, 5, true), '先加上个位换来的十'),
  ),
);

function sameLevelModel(stage: number, wrong = false): MethodNode[] {
  return caption(
    wrong
      ? '错法：把后面的加法先并进减数'
      : stage === 0
        ? '加减同级，先看左边一对'
        : stage === 1
          ? '减掉18，先留下16'
          : '给留下的16再添7',
    [
      ...Array.from({ length: 34 }, (_, i) =>
        rect(
          30 + (i % 17) * 20,
          68 + Math.floor(i / 17) * 34,
          16,
          28,
          stage === 0 ? 'known' : i < (wrong ? 25 : 18) ? 'error' : 'known',
          undefined,
          stage > 0 && i < (wrong ? 25 : 18),
        ),
      ),
      ...(stage === 2 && !wrong
        ? Array.from({ length: 7 }, (_, i) => rect(130 + i * 20, 162, 16, 28, 'focus'))
        : []),
    ],
    wrong
      ? '34−(18＋7)＝9，改变了原来的运算'
      : stage === 0
        ? '34−18＋7'
        : stage === 1
          ? '先算34−18＝16'
          : '16＋7＝23',
  );
}
const sameLevelOrder = lesson(
  '34−18＋7，没有括号时，为什么要先减18再加7？',
  [
    frame(
      '加减是同一级，先看左边',
      '没有括号时按从左到右计算，不能把后面的加法先塞进减数。',
      '先算34−18',
      sameLevelModel(0),
    ),
    frame(
      '从34个物品中拿走18个',
      '红色的18个已经拿走，留下16个。后面的加7还没有执行。',
      '34−18＝16',
      sameLevelModel(1),
    ),
    frame(
      '给剩下的16个再添7个',
      '这7个是加回来的，不是又拿走的。16加7共有23个。',
      '16＋7＝23',
      sameLevelModel(2),
    ),
  ],
  check(
    '34−18＋7，能先算18＋7再从34中减去吗？',
    '能，先把18和7合起来',
    '不能，应从左到右得23',
    '先把18和7合起来会拿走25个，等于私自添加括号，和先减18再加7不同。',
    sameLevelModel(2),
    sameLevelModel(2, true),
  ),
  check(
    '换数：32−19＋6应得多少？',
    '7：先算19＋6',
    '19：先算32−19，再加6',
    '加6表示添回来6，不是多拿走6。先剩13，再添6，是19。',
    caption(
      '留下13，再添6',
      [rect(42, 84, 206, 70, 'known', '13'), rect(256, 84, 102, 70, 'focus', '添6')],
      '13＋6＝19',
    ),
    caption(
      '错误：把添6变成拿走6',
      [rect(42, 84, 206, 70, 'error', '多减6'), rect(256, 84, 102, 70, 'known', '剩7')],
      '32−(19＋6)＝7不是原式',
    ),
  ),
);

function productGrid(a: number, b: number, split = 0, focusAll = false): MethodNode[] {
  const cell = Math.min(15, 326 / a, 150 / b),
    x = (400 - a * cell) / 2;
  return Array.from({ length: a * b }, (_, i) =>
    rect(
      x + (i % a) * cell,
      63 + Math.floor(i / a) * cell,
      cell - 1,
      cell - 1,
      focusAll || (split && i % a >= split) ? 'focus' : 'known',
    ),
  );
}
const oralProduct = lesson(
  '24×5，怎样把每份24分成20和4来口算？',
  [
    frame(
      '先看24个一排，共5排',
      '每排相同的24个，重复5排。乘法是在数这五份，不是相加24和5。',
      '24×5',
      caption('每排24个，一共5排', productGrid(24, 5), '同样的5份'),
    ),
    frame(
      '每排都分成20和4',
      '左边每排20个，右边每排4个，两部分都有5排，不能只加一次4。',
      '20×5＝100；4×5＝20',
      caption('20列和4列，都有5排', productGrid(24, 5, 20), '左100个，右20个'),
    ),
    frame(
      '把两块拼回完整的数量',
      '拆开前后没有拿走小格，把两块的数量合起来就是原来的24乘5。',
      '100＋20＝120',
      caption('两块都要计入总量', productGrid(24, 5, 0, true), '24×5＝120'),
    ),
  ],
  check(
    '21×4能算成20×4＋1＝81吗？',
    '能，只把剩下的1加上',
    '不能，剩下的1也有4份，应是84',
    '每排都有一个剩下的1，四排就有4个，不能只加一个。',
    caption('四排，每排的1都要数', productGrid(21, 4, 20), '80＋4＝84'),
    caption(
      '错法：只加一排的1',
      productGrid(21, 4, 20).map((n, i) => (i % 21 === 20 && i > 20 ? { ...n, tone: 'error' } : n)),
      '漏掉另外3排的1',
    ),
  ),
  check(
    '换数：32×3，拆开后应怎样合并？',
    '30×3＋2＝92',
    '30×3＋2×3＝96',
    '三排各有2个剩余的小格，一共6个，不是2个。',
    caption('每排32个，共3排', productGrid(32, 3, 30), '90＋6＝96'),
    caption(
      '错法：漏数两排的2',
      productGrid(32, 3, 30).map((n, i) => (i % 32 >= 30 && i >= 32 ? { ...n, tone: 'error' } : n)),
      '只加2，少了4',
    ),
  ),
);

function scaledArray(cols: number, rows: number, splitX: number, splitY: number): MethodNode[] {
  const s = 17,
    x = (400 - cols * s) / 2;
  return [
    ...Array.from({ length: cols * rows }, (_, i) =>
      rect(
        x + (i % cols) * s,
        57 + Math.floor(i / cols) * s,
        s - 2,
        s - 2,
        i % cols < splitX && Math.floor(i / cols) < splitY ? 'known' : 'focus',
      ),
    ),
    ...Array.from({ length: Math.ceil(cols / splitX) - 1 }, (_, i) =>
      line(x + (i + 1) * splitX * s - 1, 54, x + (i + 1) * splitX * s - 1, 57 + rows * s, 'quiet'),
    ),
    ...Array.from({ length: Math.ceil(rows / splitY) - 1 }, (_, i) =>
      line(
        x - 2,
        57 + (i + 1) * splitY * s - 1,
        x + cols * s,
        57 + (i + 1) * splitY * s - 1,
        'quiet',
      ),
    ),
  ];
}
const factorScale = lesson(
  '2×3的两个乘数都乘2，为什么积会变成4倍？',
  [
    frame(
      '先保留原来的6格',
      '2列3行共有6格。用这整块作为比较的一个单位。',
      '2×3＝6',
      caption('原来的一整块', scaledArray(2, 3, 2, 3), '每一块都有6格'),
    ),
    frame(
      '列数加倍，先复制一块',
      '列数从2变成4，行数仍是3。现在有原来的两块。',
      '4×3＝12＝6×2',
      caption('只把一个方向乘2', scaledArray(4, 3, 2, 3), '现在是原来的2倍'),
    ),
    frame(
      '行数也加倍，再复制这两块',
      '行数从3变成6，两块又变成四块。两个方向的倍数要相乘。',
      '4×6＝24；2×2＝4',
      caption('两个方向都乘2', scaledArray(4, 6, 2, 3), '一共有原来的4块'),
    ),
  ],
  check(
    '两个非零乘数都乘2，积变成几倍？',
    '2倍：只数一次翻倍',
    '4倍：2×2',
    '一边加倍得到两块，另一边也加倍得到四块；不是只增加一排。',
    caption('两边都加倍，是4块', scaledArray(4, 6, 2, 3), '4个原来的6格'),
    caption('错法只改变了一个方向', scaledArray(4, 3, 2, 3), '这幅只有2倍，还没改行数'),
  ),
  check(
    '换倍数：两个非零乘数都乘3，积变成几倍？',
    '3倍',
    '9倍：3×3',
    '三个方向块排成三排，一共九块，不能只数一排。',
    caption('原块横向3份、纵向3份', scaledArray(6, 9, 2, 3), '积是原来的9倍'),
    caption('错法只增加了列数', scaledArray(6, 3, 2, 3), '只有3块，漏掉另外两排'),
  ),
);

const emptyGroups = (count: number, footer: string, wrong = false): MethodNode[] =>
  caption(
    `${count}份，每份都没有物品`,
    Array.from({ length: count }, (_, i) =>
      rect(24 + i * (352 / count), 86, 352 / count - 5, 68, wrong ? 'error' : 'known', '0', true),
    ),
    footer,
  );
const zeroProduct = lesson(
  '0×3与0×5的积能相同吗？连乘里有0，为什么整个积是0？',
  [
    frame(
      '3份空的，合起来还是空的',
      '每份都是0，三份中没有任何物品。乘数3不代表额外放入3个物品。',
      '0×3＝0',
      emptyGroups(3, '三个空组，合计0个'),
    ),
    frame(
      '把份数改成5，也没有增加物品',
      '每份量仍是0。改成五份，合在一起仍没有物品，所以两个积相同。',
      '0×5＝0',
      emptyGroups(5, '份数不同，两个积仍同为0'),
    ),
    frame(
      '连乘先看含0的那一部分',
      '7×8算出多少都要再乘0；相当于取0份这个数量，没有一份留下。',
      '(7×8)×0＝0',
      caption(
        '0份完整数量，就没有物品',
        [rect(80, 75, 240, 92, 'quiet', '0份', true)],
        '7×8×0的积是0',
      ),
    ),
  ],
  check(
    '同一个数乘两个不同的自然数，积一定不同吗？',
    '一定不同',
    '不一定，0×3和0×5都等于0',
    '同一个数可以是0。三份空组、五份空组都没有物品，一个反例就能推翻“一定”。',
    emptyGroups(5, '正确：0×3＝0×5＝0'),
    caption(
      '错把份数当成物品个数',
      [rect(38, 83, 143, 72, 'error', '3个'), rect(219, 83, 143, 72, 'error', '5个')],
      '每份是0，不是每份1个',
    ),
  ),
  check(
    '换算式：9×12×0×7，积是多少？',
    '756：跳过0继续乘',
    '0：有一个乘数是0',
    '0不能跳过。取0份已经没有物品，再乘7仍然是0。',
    emptyGroups(7, '乘积是0'),
    caption(
      '错误：漏掉了乘0这一步',
      [rect(48, 83, 304, 75, 'error', '9×12×7＝756')],
      '这不是原来的完整算式',
    ),
  ),
);

const packBand = (count: number, each: number, footer: string): MethodNode[] => {
  const columns = Math.min(count, 5),
    width = count <= 4 ? 88 : 352 / 5;
  const start = (400 - columns * width) / 2;
  return caption(
    `${count}个相同的数量块`,
    Array.from({ length: count }, (_, i) =>
      rect(
        start + (i % columns) * width,
        count > 5 ? 65 + Math.floor(i / 5) * 67 : 81,
        width - 4,
        count > 5 ? 50 : 76,
        i ? 'focus' : 'known',
        String(each),
      ),
    ),
    footer,
  );
};
const timesEleven = lesson(
  '23×11，为什么要把23×10与23×1合起来？',
  [
    frame(
      '11份分成10份和1份',
      '左边10份，右边1份，合计仍是11份，每份都是23。',
      '11＝10＋1',
      caption(
        '同样的23，分成两部分份数',
        [rect(24, 78, 288, 80, 'known', '10份'), rect(316, 78, 60, 80, 'focus', '1份')],
        '没有增加或减少份数',
      ),
    ),
    frame(
      '两边分别求出数量',
      '十份23是230，一份23是23。右边这一份也要全部计入。',
      '23×10＝230；23×1＝23',
      caption(
        '每份量相同，都按23算',
        [rect(24, 78, 288, 80, 'known', '230'), rect(316, 78, 60, 80, 'focus', '23')],
        '230和23都是部分积',
      ),
    ),
    frame(
      '合起来，再核对个位',
      '230与23相加是253。不能只是把23的两个数字机械地拼起来。',
      '230＋23＝253',
      packBand(1, 253, '23×11＝253'),
    ),
  ],
  check(
    '19×11，中间的9＋1满十，应怎样处理？',
    '写成1109，直接拼数字',
    '按190＋19算，得209',
    '部分积仍要按数位相加。9＋1进到百位，结果是209，不能多写一位。',
    caption(
      '正确：190再加19',
      [rect(25, 84, 240, 70, 'known', '190'), rect(271, 84, 105, 70, 'focus', '19')],
      '190＋19＝209',
    ),
    caption(
      '错误：把进位当作多添一位',
      [rect(50, 85, 300, 70, 'error', '1109')],
      '11份19不可能有一千多',
    ),
  ),
  check(
    '换数：17×11，正确结果是哪一个？',
    '171：把数字顺序接起来',
    '187：170＋17',
    '11份17分成十份与一份，两个部分积是170和17，再相加。',
    caption(
      '十份17，再加一份17',
      [rect(24, 84, 270, 70, 'known', '170'), rect(300, 84, 76, 70, 'focus', '17')],
      '170＋17＝187',
    ),
    caption(
      '错误：直接把数字接在一起',
      [rect(50, 85, 300, 70, 'error', '171')],
      '拼数字没有计算11份的总量',
    ),
  ),
);
const multiples = lesson(
  '已知124×8＝992，怎样核对124×16、×24、×32？',
  [1, 2, 3, 4].map((count) =>
    frame(
      count === 1 ? '把8份124看成一个整块' : `把${count * 8}份分成${count}个整块`,
      `每个整块都有8份124，也就是992。${count * 8}里面有${count}个8，就有${count}个992。`,
      `124×${count * 8}＝992×${count}＝${992 * count}`,
      packBand(count, 992, `合计${992 * count}`),
    ),
  ),
  check(
    '已知124×8＝992，124×32应怎样算？',
    '992＋4＝996',
    '992×4＝3968',
    '32有4个8，所以是四个完整的992，不是把992再加4。',
    packBand(4, 992, '4个992＝3968'),
    caption(
      '错误：只保留了一整块',
      [rect(24, 83, 278, 72, 'known', '992'), rect(309, 83, 67, 72, 'error', '加4')],
      '另外3个整块没有算进去',
    ),
  ),
  check(
    '换数：125×8＝1000，125×24是多少？',
    '1003：1000再加3',
    '3000：3个1000',
    '24里面有3个8，要把1000取三份。',
    packBand(3, 1000, '3×1000＝3000'),
    caption(
      '错误：把份数直接加到总量',
      [rect(24, 83, 278, 72, 'known', '1000'), rect(309, 83, 67, 72, 'error', '加3')],
      '应加三份，而不是加3个',
    ),
  ),
);

function quantityParts(total: number, used: number, reveal: boolean): MethodNode[] {
  const w = (352 * used) / total;
  return caption(
    `总量${total}，先区分已用和未用`,
    [
      rect(24, 82, w - 2, 72, 'known', String(used)),
      rect(24 + w, 82, 352 - w, 72, 'focus', reveal ? String(total - used) : '剩下？'),
    ],
    reveal ? `${total}−${used}＝${total - used}` : `先求已经用去的${used}`,
  );
}
function dayBoxes(
  full: number,
  each: number,
  remainder: number,
  mode: 'remaining' | 'finish' | 'drop' | 'extra' = 'finish',
): MethodNode[] {
  const count = full + (remainder ? 1 : 0) + (mode === 'extra' ? 1 : 0),
    cols = Math.min(4, count);
  return caption(
    '每个框是一整天的阅读量',
    Array.from({ length: count }, (_, i) =>
      rect(
        28 + (i % cols) * 88,
        65 + Math.floor(i / cols) * 63,
        80,
        48,
        i < full
          ? 'known'
          : mode === 'drop' || mode === 'extra'
            ? 'error'
            : mode === 'remaining'
              ? 'warm'
              : 'focus',
        i < full ? String(each) : mode === 'extra' ? '空天' : String(remainder),
        i >= full && mode !== 'finish',
      ),
    ),
    remainder
      ? mode === 'drop'
        ? `漏下${remainder}页，还没有读完`
        : `${full}天后余${remainder}页，还需要1天`
      : mode === 'extra'
        ? '没有余页，不必再加一天'
        : `正好${full}天读完`,
  );
}
const remainingDays = lesson(
  '一本书280页，前4天每天读25页；以后每天最多24页，还需几天，最后一天读几页？',
  [
    frame(
      '先求已经读掉的页数',
      '前4天每天读25页，合计100页。这部分不需要重新安排。',
      '4×25＝100页',
      packBand(4, 25, '这100页已经读过'),
    ),
    frame(
      '从全书取出剩余的180页',
      '把已读的100页从280页里扣除，只给剩下的180页安排阅读天数。',
      '280−100＝180页',
      quantityParts(280, 100, true),
    ),
    frame(
      '先排满7天，仍有12页',
      '180除以24，7个完整阅读日用去168页，余下12页还没有读。',
      '180÷24＝7……12',
      dayBoxes(7, 24, 12, 'remaining'),
    ),
    frame(
      '最后12页也要安排一天',
      '要求读完整本书，即使最后一天不满24页，也需要第8天；整除时则不用加一天。',
      '还需7＋1＝8天；最后12页',
      dayBoxes(7, 24, 12),
    ),
  ],
  check(
    '还有180页，每天最多24页，能只安排7天吗？',
    '能，商是7就用7天',
    '不能，还剩12页，需要8天',
    '7天最多读168页，留下的12页不是已经读过的页数，还要安排一天。',
    dayBoxes(7, 24, 12),
    dayBoxes(7, 24, 12, 'drop'),
  ),
  check(
    '换数：全书250页，已读100页，剩下每天25页，还需几天？',
    '7天：商后总要再加1',
    '6天：150页正好分成6天',
    '只有余下的页数大于0才增加一天。150除以25没有余数。',
    dayBoxes(6, 25, 0),
    dayBoxes(6, 25, 0, 'extra'),
  ),
);
const remainingRate = lesson(
  '计划每天40件，10天完成。前3天照做，想提前2天完成，剩下每天应做多少件？',
  [
    frame(
      '用原计划确定总任务',
      '同一批零件总量不变，原计划10天每天40件，一共400件。',
      '40×10＝400件',
      packBand(10, 40, '总任务固定为400件'),
    ),
    frame(
      '先从日程中拿掉已过和提前的天数',
      '10天中前3天已经过去，还要提前2天，所以后面只有5天可以工作。',
      '10−3−2＝5天',
      caption(
        '前3天已做，中间5天可用',
        Array.from({ length: 10 }, (_, i) =>
          rect(
            25 + i * 35,
            87,
            31,
            62,
            i < 3 ? 'known' : i < 8 ? 'focus' : 'error',
            undefined,
            i >= 8,
          ),
        ),
        '最后2天被提前完成的要求取消',
      ),
    ),
    frame(
      '只给还没完成的任务排日程',
      '已经做120件，剩280件；不能把400件全部重新分到后5天。',
      '400−40×3＝280件',
      quantityParts(400, 120, true),
    ),
    frame(
      '把280件平均放进5天',
      '剩余的任务和剩余的时间对应，280件分成5个相同的日任务，每天56件。',
      '280÷5＝56件/天',
      packBand(5, 56, '120＋5×56＝400'),
    ),
  ],
  check(
    '全书360页，前4天每天读30页；剩下要6天读完，后面每天多少页？',
    '60页：直接用360÷6',
    '40页：(360−4×30)÷6',
    '原来的360页里含已经读完的120页，后面只应再分配240页。',
    packBand(6, 40, '6天共240页，加已读120页正好360'),
    packBand(6, 60, '错把已读120页也重新分配'),
  ),
  check(
    '换数：每天60件、计划8天；前3天照做，要提前1天完成，后面每天多少件？',
    '60件：余下仍有5天',
    '75件：300件分给4天',
    '总量480，已经做180。提前一天后只剩8−3−1＝4天，不是5天。',
    packBand(4, 75, '4天共300件'),
    packBand(5, 60, '错法多安排了一天，不能提前完成'),
  ),
);

function codeFields(year: string, shelf: string, sequence: string): MethodNode[] {
  return [
    text(104, 57, '年份4位', 'known', 20),
    text(238, 57, '架号2位', 'known', 20),
    text(329, 57, '序号3位', 'focus', 20),
    rect(24, 85, 158, 65, 'known', year),
    rect(188, 85, 91, 65, 'known', shelf),
    rect(285, 85, 91, 65, 'focus', sequence),
  ];
}
function codeRange(first: number, current: number, last: number, full = false): MethodNode[] {
  const count = last - first + 1,
    width = 352 / count;
  return caption(
    `这一组从${first}到${last}`,
    Array.from({ length: count }, (_, i) =>
      rect(
        24 + i * width,
        87,
        Math.max(1, width - 1),
        62,
        first + i <= current ? 'known' : full ? 'error' : 'quiet',
        undefined,
        first + i > current && !full,
      ),
    ),
    full ? `错：${current}之后不一定全有书` : `已知${current}存在，后面还可能有空位`,
  );
}
const groupCode = lesson(
  '年份4位、书架2位、序号3位；每25本一组，202806087在最后一组，该架本数有什么范围？',
  [
    frame(
      '先只取出同架序号087',
      '年份2028和架号06标识书架，组别按末尾序号087来判断，不能拿整个9位编号除以25。',
      '2028｜06｜087',
      caption('先固定年份与书架', codeFields('2028', '06', '087'), '同一书架，才按序号分组'),
    ),
    frame(
      '找出087落在哪25个位置中',
      '前三组各25本，已经到75。第4组从076开始，到100结束。',
      '25×3＋1＝76；25×4＝100',
      codeRange(76, 87, 100),
    ),
    frame(
      '有087号，不等于最后一组全满',
      '087号已经存在，所以至少有87本；超过100就会开新组，与最后一组的条件冲突。',
      '至少87本，最多100本',
      caption(
        '末组可以没有装满',
        [
          line(43, 111, 355, 111, 'known'),
          line(43, 98, 43, 124),
          line(355, 98, 355, 124),
          rect(43, 153, 312, 43, 'focus', '87～100本'),
        ],
        '101号会进入下一组',
      ),
    ),
    frame(
      '本组第一本只改末尾序号',
      '年份和架号不变，第4组首号是76，写回固定三位序号时必须补成076。',
      '2028｜06｜076＝202806076',
      caption('同组首号保留同一书架', codeFields('2028', '06', '076'), '本组第一本为202806076'),
    ),
  ],
  check(
    '每25本一组，087号属于最后一组，就能肯定一共100本吗？',
    '能，最后一组一定装满',
    '不能，只能确定87到100本',
    '最后一组的后面可以留空。已知087号存在才决定下限，上限是该组最后一个位置100。',
    codeRange(76, 87, 100),
    codeRange(76, 87, 100, true),
  ),
  check(
    '换数：每20本一组，2028年03架047号在最后一组，本数范围及本组首号是哪组？',
    '41到60本；202803041',
    '47到60本；202803041',
    '047号已经存在，不能只有41本；该组从041到060，首号仍为041。',
    codeRange(41, 47, 60),
    caption(
      '错误下限41，装不下已知047号',
      [rect(44, 88, 140, 70, 'error', '只到041'), rect(218, 88, 140, 70, 'known', '047已存在')],
      '总本数至少要到047',
    ),
  ),
);
const codeCapacity = lesson(
  '同架序号固定3位，从001到999，每号一本；已经连续编到356，还能编几本？',
  [
    frame(
      '三位序号有明确的最后一个位置',
      '每位最大都是9，所以最后是999。000不用，从001开始一号一本。',
      '最大序号999，最多999本',
      caption(
        '序号段不能再多加一位',
        [
          rect(66, 85, 84, 67, 'known', '9'),
          rect(158, 85, 84, 67, 'known', '9'),
          rect(250, 85, 84, 67, 'known', '9'),
        ],
        '001到999共有999个序号',
      ),
    ),
    frame(
      '把已用序号从全部位置中分开',
      '001到356已经用过，后面的位置才能继续分配；356不是最后一个可用序号。',
      '已用356；后面从357开始',
      quantityParts(999, 356, false),
    ),
    frame(
      '总位置减已用位置',
      '999个总位置中取出356个已用位置，剩下643个。357这个第一个未用编号也要计入。',
      '999−356＝643',
      quantityParts(999, 356, true),
    ),
  ],
  check(
    '序号001到005，已连续用到002，还能编几本？',
    '2本：5−3',
    '3本：003、004、005',
    '第一个未用编号003也能使用，不能把它漏掉。总5个位置减已用2个，剩3个。',
    caption(
      '后面三个位置都可用',
      Array.from({ length: 5 }, (_, i) =>
        rect(24 + i * 71, 86, 65, 65, i < 2 ? 'known' : 'focus', String(i + 1).padStart(3, '0')),
      ),
      '003、004、005共有3本',
    ),
    caption(
      '错法漏掉第一个未用的003',
      Array.from({ length: 5 }, (_, i) =>
        rect(
          24 + i * 71,
          86,
          65,
          65,
          i === 2 ? 'error' : i < 2 ? 'known' : 'focus',
          String(i + 1).padStart(3, '0'),
        ),
      ),
      '003也是一个可用位置',
    ),
  ),
  check(
    '换数：序号001到999，已连续编到785，还能编几本？',
    '213本：999−786',
    '214本：999−785',
    '786是第一个还没使用的位置，它也要计入。用全部位置减已经用过的位置最清楚。',
    quantityParts(999, 785, true),
    caption(
      '错误：把786也从可用范围扣掉',
      [rect(24, 85, 352, 66, 'error', '999−786＝213')],
      '786还没用，不能扣掉',
    ),
  ),
);

function promotionPacks(
  buy: number,
  packs: number,
  loose: number,
  footer: string,
  short = false,
): MethodNode[] {
  const width = 352 / Math.max(3, packs);
  return caption(
    `每买${buy}个，另送1个`,
    [
      ...Array.from({ length: packs }, (_, i) => [
        rect(24 + i * width, 74, width - 27, 61, 'known', `买${buy}`),
        rect(24 + i * width + width - 25, 74, 21, 61, 'warm', '1'),
      ]).flat(),
      ...(loose ? [rect(145, 166, 110, 40, short ? 'error' : 'focus', `再买${loose}`)] : []),
    ],
    footer,
  );
}
const promotion = lesson(
  '每个198元，每买满10个另送1个，赠品不再参加满赠。至少需要35个，最少花多少钱？',
  [
    frame(
      '把满赠看成一组付费与赠品',
      '一个完整组付10个的钱，另外得到1个赠品，一共得到11个。赠品不再拿去凑下一个10。',
      '付费10个＋赠1个＝11个',
      promotionPacks(10, 1, 0, '蓝框付费，黄框是赠品'),
    ),
    frame(
      '三组可得到33个，还没到35',
      '买30个可得到3个赠品，合计33个。不能把目标35除以11后的余量直接丢掉。',
      '30＋3＝33，还差2个',
      promotionPacks(10, 3, 0, '只买30个，还差2个'),
    ),
    frame(
      '余下两个按正常单价购买',
      '再单买2个，付费数是32，赠品仍只有3个，一共35个。',
      '32÷10商3余2；32＋3＝35个',
      promotionPacks(10, 3, 2, '付费32，赠3，合计35'),
    ),
    frame(
      '少付费一个，验证为什么不够',
      '如果只买31个，赠品仍是3个，合计34个，达不到35个。',
      '31＋3＝34＜35',
      promotionPacks(10, 3, 1, '少付1个就少得1个，不够35', true),
    ),
    frame(
      '只为32个付费，赠品不收费',
      '已经验证32是满足35个的最少付费数，只需乘这32个的单价。',
      '198×32＝6336元',
      promotionPacks(10, 3, 2, '35个中只有32个要付钱'),
    ),
  ],
  check(
    '买满10送1，至少要35个，只买30个够吗？',
    '够，取3个完整赠送组即可',
    '不够，30＋3只有33个，至少付费32个',
    '三组虽然能送3个，但合计仍少于35。补买两个后没有再达到10个，所以赠品不增加。',
    promotionPacks(10, 3, 2, '32个付费＋3个赠品＝35'),
    promotionPacks(10, 3, 0, '错误：把剩下需要的2个漏掉'),
  ),
  check(
    '换规则：每买满5个另送1个，赠品不再满赠，每个80元。至少要20个，最少花多少元？',
    '1280元：买16个就够',
    '1360元：买17个，送3个，共20个',
    '买16只送3个，合计19；买17送3个才到20。只向付费的17个收钱。',
    promotionPacks(5, 3, 2, '17＋3＝20；17×80＝1360'),
    promotionPacks(5, 3, 1, '16＋3＝19，还差1个', true),
  ),
);

/** Explicitly reviewed IDs only; no runtime keyword classification or grading changes. */
export const extraSubskillStories: Record<string, MethodStory> = {
  'extra-oral-addition': addition,
  'extra-oral-product': oralProduct,
  'extra-same-level-order': sameLevelOrder,
  'extra-factor-scale': factorScale,
  'extra-zero-product': zeroProduct,
  'extra-times-eleven': timesEleven,
  'extra-multiple-packets': multiples,
  'extra-remaining-days': remainingDays,
  'extra-remaining-rate': remainingRate,
  'extra-code-capacity': codeCapacity,
  'extra-code-last-group': groupCode,
  'extra-promotion-minimum': promotion,
};
export const extraQuestionSubskills: Record<string, Record<string, string>> = {
  'u1-mental': {
    'full-p04-s1-q1-2': 'extra-oral-addition',
    'full-p06-s1-q1-10': 'extra-same-level-order',
    'full-p04-s1-q1-5': 'extra-oral-product',
    'full-p06-s1-q1-4': 'extra-oral-product',
    'full-p06-s1-q1-7': 'extra-oral-product',
    'full-p09-s3-q1-2': 'extra-oral-product',
    'full-p13-s1-q1-3': 'extra-oral-product',
    'full-p13-s1-q1-5': 'extra-oral-product',
    'full-p14-s3-q1-5': 'extra-oral-product',
    'full-p16-s3-q1-6': 'extra-oral-product',
    'full-p17-s2-q1-3': 'extra-oral-product',
    'full-p17-s2-q1-6': 'extra-oral-product',
  },
  'u6-patterns': {
    'teach-u6-09': 'extra-times-eleven',
    'teach-u6-10': 'extra-multiple-packets',
    'teach-u6-11': 'extra-factor-scale',
    'teach-u6-12': 'extra-zero-product',
  },
  'u6-tools': { 'u6-04': 'extra-zero-product' },
  'u4-steps': {
    'bank-u4-steps-02': 'extra-remaining-days',
    'u4-06': 'extra-remaining-days',
    'u4-11': 'extra-remaining-rate',
    'bank-u4-steps-04': 'extra-remaining-rate',
  },
  'u5-codes': {
    'bank-u5-codes-03': 'extra-code-capacity',
    'u5-18': 'extra-code-capacity',
    'bank-u5-codes-04': 'extra-code-last-group',
  },
  'u6-application': { 'u6-12': 'extra-promotion-minimum' },
};
